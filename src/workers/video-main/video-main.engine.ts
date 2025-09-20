import {
	assetsImages,
	assetsImageCharacters,
	AssetIdImg,
	assetLoaderImage,
	assetLoaderImageCharacter,
	AssetPropertiesImage,
	initializeAssetManager,
	AssetIdImgCharacterType,
	AssetIdImgCharacter,
} from '../../asset-manager.js';
import {
	GamingCanvas,
	GamingCanvasConstPI,
	GamingCanvasConstPIDouble,
	GamingCanvasConstPIHalf,
	GamingCanvasFIFOQueue,
	GamingCanvasReport,
	GamingCanvasRenderStyle,
	GamingCanvasUtilScale,
} from '@tknight-dev/gaming-canvas';
import {
	GameDifficulty,
	gameGridCellMaskExtendedDoor,
	GameGridCellMasksAndValues,
	GameGridCellMasksAndValuesExtended,
	gameGridCellMaskSpriteFixed,
	GameMap,
} from '../../models/game.model.js';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataCalculations,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusInputPayload,
	VideoMainBusOutputCmd,
	VideoMainBusOutputPayload,
} from './video-main.model.js';
import { GamingCanvasOrientation } from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridRaycastTestImageCreate,
	GamingCanvasGridRaycastCellSide,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridUint16Array,
} from '@tknight-dev/gaming-canvas/grid';
import { LightingQuality, RaycastQuality } from '../../models/settings.model.js';
import {
	CalcBusActionDoorState,
	CalcBusActionDoorStateAutoCloseDurationInMS,
	CalcBusActionDoorStateChangeDurationInMS,
	CalcBusActionWallMoveStateChangeDurationInMS,
	CalcBusOutputDataActionSwitch,
	CalcBusOutputDataActionWallMove,
} from '../calc/calc.model.js';
import { CharacterNPC } from '../../models/character.model.js';
import { Assets } from '../../modules/assets.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoMainBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoMainBusInputCmd.ACTION_DOOR:
			VideoMainEngine.inputActionDoor(<CalcBusActionDoorState>payload.data);
			break;
		case VideoMainBusInputCmd.ACTION_SWITCH:
			VideoMainEngine.inputActionSwitch(<CalcBusOutputDataActionSwitch>payload.data);
			break;
		case VideoMainBusInputCmd.ACTION_WALL_MOVE:
			VideoMainEngine.inputActionWallMove(<CalcBusOutputDataActionWallMove>payload.data);
			break;
		case VideoMainBusInputCmd.CALCULATIONS:
			VideoMainEngine.inputCalculations(<VideoMainBusInputDataCalculations>payload.data);
			break;
		case VideoMainBusInputCmd.INIT:
			VideoMainEngine.initialize(<VideoMainBusInputDataInit>payload.data);
			break;
		case VideoMainBusInputCmd.MAP:
			VideoMainEngine.inputMap(<GameMap>payload.data);
			break;
		case VideoMainBusInputCmd.MAP_UPDATE:
			VideoMainEngine.inputMapUpdate(<Uint16Array>payload.data);
			break;
		case VideoMainBusInputCmd.REPORT:
			VideoMainEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoMainBusInputCmd.SETTINGS:
			VideoMainEngine.inputSettings(<VideoMainBusInputDataSettings>payload.data);
			break;
	}
};

class VideoMainEngine {
	private static actionDoors: Map<number, CalcBusActionDoorState> = new Map();
	private static actionWall: Map<number, CalcBusOutputDataActionWallMove> = new Map();
	private static assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = new Map();
	private static assetImages: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static assetImagesInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static calculations: VideoMainBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static gameMapUpdate: Uint16Array;
	private static gameMapUpdateNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static player1: boolean;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoMainBusInputDataSettings;
	private static settingsNew: boolean;

	public static async initialize(data: VideoMainBusInputDataInit): Promise<void> {
		// Assets
		await initializeAssetManager();
		let assetCanvas: OffscreenCanvas,
			assetContext: OffscreenCanvasRenderingContext2D,
			assetData: ImageBitmap,
			assetCharacter: AssetIdImgCharacter,
			assetCharacterType: AssetIdImgCharacterType,
			assetId: AssetIdImg,
			assetImagesLoaded: Map<AssetIdImg, ImageBitmap> = <any>await assetLoaderImage(),
			assetImageCharactersLoaded: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, ImageBitmap>> = <any>await assetLoaderImageCharacter(),
			assetImageCharactersLoadedInstance: Map<AssetIdImgCharacter, ImageBitmap>,
			assetProperties: AssetPropertiesImage;

		for ([assetId, assetData] of assetImagesLoaded) {
			// Get properties
			assetProperties = <AssetPropertiesImage>assetsImages.get(assetId);

			// Canvas: Regular
			assetCanvas = new OffscreenCanvas(assetData.width, assetData.height);
			assetContext = assetCanvas.getContext('2d', {
				alpha: assetProperties.alpha,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
			}) as OffscreenCanvasRenderingContext2D;
			assetContext.drawImage(assetData, 0, 0);
			VideoMainEngine.assetImages.set(assetId, assetCanvas);

			// Canvas: Invert Horizontal
			assetCanvas = new OffscreenCanvas(assetData.width, assetData.height);
			assetContext = assetCanvas.getContext('2d', {
				alpha: assetProperties.alpha,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
			}) as OffscreenCanvasRenderingContext2D;
			assetContext.scale(-1, 1);
			assetContext.drawImage(assetData, 0, 0, assetData.width * -1, assetData.height);
			VideoMainEngine.assetImagesInvertHorizontal.set(assetId, assetCanvas);
		}

		for ([assetCharacterType, assetImageCharactersLoadedInstance] of assetImageCharactersLoaded) {
			for ([assetCharacter, assetData] of assetImageCharactersLoadedInstance) {
				// Get properties
				assetProperties = <AssetPropertiesImage>(<any>assetsImageCharacters.get(assetCharacterType)).get(assetCharacter);

				// Canvas: Regular
				assetCanvas = new OffscreenCanvas(assetData.width, assetData.height);
				assetContext = assetCanvas.getContext('2d', {
					alpha: assetProperties.alpha,
					antialias: false,
					depth: true,
					desynchronized: true,
					powerPreference: 'high-performance',
				}) as OffscreenCanvasRenderingContext2D;
				assetContext.drawImage(assetData, 0, 0);

				if (VideoMainEngine.assetImageCharacters.has(assetCharacterType) !== true) {
					VideoMainEngine.assetImageCharacters.set(assetCharacterType, new Map());
				}
				(<any>VideoMainEngine.assetImageCharacters.get(assetCharacterType)).set(assetCharacter, assetCanvas);
			}
		}

		// Config: Canvas
		VideoMainEngine.offscreenCanvas = data.offscreenCanvas;
		VideoMainEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config
		VideoMainEngine.gameMap = Assets.parseMap(data.gameMap);
		VideoMainEngine.player1 = data.player1;

		// Config: Report
		VideoMainEngine.inputCalculations({
			camera: data.camera,
			rays: new Float64Array(),
			raysMap: new Map(),
			raysMapKeysSorted: new Float64Array(),
		});

		// Config: Report
		VideoMainEngine.inputReport(data.report);

		// Config: Settings
		VideoMainEngine.inputSettings(data as VideoMainBusInputDataSettings);

		// Start
		if (VideoMainEngine.offscreenCanvasContext === null) {
			console.error('VideoMainEngine: failed acquire context');
			VideoMainEngine.post([
				{
					cmd: VideoMainBusOutputCmd.INIT_COMPLETE,
					data: false,
				},
			]);
		} else {
			VideoMainEngine.post([
				{
					cmd: VideoMainBusOutputCmd.INIT_COMPLETE,
					data: true,
				},
			]);

			// Start rendering thread
			VideoMainEngine.go__funcForward();
			VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.go);
		}
	}

	/*
	 * Input
	 */

	public static inputActionDoor(data: CalcBusActionDoorState): void {
		let durationEff: number,
			statePrevious: CalcBusActionDoorState = <CalcBusActionDoorState>VideoMainEngine.actionDoors.get(data.gridIndex);

		if (statePrevious !== undefined) {
			clearTimeout(statePrevious.timeout);

			if (statePrevious.closing === true) {
				data.timestampUnix -= CalcBusActionDoorStateChangeDurationInMS - (Date.now() - statePrevious.timestampUnix);
			}
		}

		durationEff = CalcBusActionDoorStateChangeDurationInMS - (Date.now() - data.timestampUnix);
		VideoMainEngine.actionDoors.set(data.gridIndex, data);

		data.timeout = setTimeout(() => {
			// Change state complete
			if (data.closing === true) {
				data.closing = false;
				data.open = false;
				data.opening = false;
				VideoMainEngine.gameMap.grid.data[data.gridIndex] |= GameGridCellMasksAndValues.WALL_INVISIBLE;
			} else if (data.opening === true) {
				data.closing = false;
				data.open = true;
				data.opening = false;
				VideoMainEngine.gameMap.grid.data[data.gridIndex] &= ~GameGridCellMasksAndValues.WALL_INVISIBLE;
			}
		}, durationEff);
	}

	public static inputActionSwitch(data: CalcBusOutputDataActionSwitch): void {
		VideoMainEngine.gameMap.grid.data[data.gridIndex] = data.cellValue;
	}

	public static inputActionWallMove(data: CalcBusOutputDataActionWallMove): void {
		const gameMapGridData: Uint16Array = VideoMainEngine.gameMap.grid.data;

		// Cache: store the timestamp for animation
		VideoMainEngine.actionWall.set(data.gridIndex, data);

		// Calc: Offset
		let offset: number, spriteType: number;
		switch (data.cellSide) {
			case GamingCanvasGridRaycastCellSide.EAST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = VideoMainEngine.gameMap.grid.sideLength;
				break;
			case GamingCanvasGridRaycastCellSide.NORTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = -1;
				break;
			case GamingCanvasGridRaycastCellSide.SOUTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = 1;
				break;
			case GamingCanvasGridRaycastCellSide.WEST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = -VideoMainEngine.gameMap.grid.sideLength;
				break;
		}

		// Calc: State
		gameMapGridData[data.gridIndex + offset * 2] = gameMapGridData[data.gridIndex] & ~GameGridCellMasksAndValues.WALL_MOVABLE;

		gameMapGridData[data.gridIndex] &= ~GameGridCellMasksAndValues.WALL;
		gameMapGridData[data.gridIndex] |= spriteType;

		// Calc: Move 1st Block
		setTimeout(
			() => {
				// 2nd block
				gameMapGridData[data.gridIndex + offset] = gameMapGridData[data.gridIndex];

				data.timestampUnix += (CalcBusActionWallMoveStateChangeDurationInMS / 2) | 0;
				VideoMainEngine.actionWall.set(data.gridIndex + offset, data);

				// 1st block
				gameMapGridData[data.gridIndex] = GameGridCellMasksAndValues.FLOOR;
				VideoMainEngine.actionWall.delete(data.gridIndex);
			},
			(CalcBusActionWallMoveStateChangeDurationInMS / 2) | 0,
		);

		// Calc: Move 2nd Block
		setTimeout(() => {
			gameMapGridData[data.gridIndex + offset] = GameGridCellMasksAndValues.FLOOR;

			VideoMainEngine.actionWall.delete(data.gridIndex + offset);
		}, CalcBusActionWallMoveStateChangeDurationInMS);
	}

	public static inputCalculations(data: VideoMainBusInputDataCalculations): void {
		VideoMainEngine.calculations = data;

		// Last
		VideoMainEngine.calculationsNew = true;
	}

	public static inputMap(data: GameMap): void {
		VideoMainEngine.gameMap = Assets.parseMap(data);
		VideoMainEngine.gameMapNew = true;
	}

	public static inputMapUpdate(data: Uint16Array): void {
		VideoMainEngine.gameMapUpdate = data;
		VideoMainEngine.gameMapUpdateNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoMainEngine.report = report;

		// Last
		VideoMainEngine.reportNew = true;
	}

	public static inputSettings(data: VideoMainBusInputDataSettings): void {
		VideoMainEngine.settings = data;

		// Last
		VideoMainEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: VideoMainBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let actionDoorRequest: CalcBusActionDoorState,
			actionDoors: Map<number, CalcBusActionDoorState> = VideoMainEngine.actionDoors,
			actionDoorState: CalcBusActionDoorState,
			actionWall: Map<number, CalcBusOutputDataActionWallMove> = VideoMainEngine.actionWall,
			actionWallState: CalcBusOutputDataActionWallMove,
			asset: OffscreenCanvas,
			assetImageCharacterInstance: Map<AssetIdImgCharacter, OffscreenCanvas>,
			assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = VideoMainEngine.assetImageCharacters,
			assetImages: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assetImages,
			assetImagesInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assetImagesInvertHorizontal,
			calculationsCamera: GamingCanvasGridCamera = GamingCanvasGridCamera.from(VideoMainEngine.calculations.camera),
			calculationsRays: Float64Array = VideoMainEngine.calculations.rays,
			calculationsRaysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance> = VideoMainEngine.calculations.raysMap,
			calculationsRaysMapKeysSorted: Float64Array = VideoMainEngine.calculations.raysMapKeysSorted,
			offscreenCanvas: OffscreenCanvas = VideoMainEngine.offscreenCanvas,
			offscreenCanvasHeightPx: number = VideoMainEngine.report.canvasHeightSplit,
			offscreenCanvasHeightPxHalf: number = (offscreenCanvasHeightPx / 2) | 0,
			offscreenCanvasWidthPx: number = VideoMainEngine.report.canvasWidthSplit,
			offscreenCanvasWidthPxHalf: number = (offscreenCanvasWidthPx / 2) | 0,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.offscreenCanvasContext,
			frameCount: number = 0,
			gameMapGridCell: number,
			gameMapGridCell2: number,
			gameMapGridIndex: number,
			gameMapGridData: Uint16Array = <Uint16Array>VideoMainEngine.gameMap.grid.data,
			gameMapGridSideLength: number = VideoMainEngine.gameMap.grid.sideLength,
			gameMapNPC: Map<number, CharacterNPC> = VideoMainEngine.gameMap.npc,
			gameMapUpdate: Uint16Array,
			i: number,
			player1: boolean = VideoMainEngine.player1,
			renderAngle: number,
			renderAssetId: number,
			renderAssets: Map<AssetIdImg, OffscreenCanvas>,
			renderBrightness: number,
			renderCellSide: GamingCanvasGridRaycastCellSide,
			renderCharacterNPC: CharacterNPC | undefined,
			renderDistance: number,
			renderDistance1: number,
			renderDistance2: number,
			renderImageTest: OffscreenCanvas = GamingCanvasGridRaycastTestImageCreate(64),
			renderEnable: boolean,
			renderExtended: boolean,
			renderFilterNone: string = 'none',
			renderGamma: number,
			renderGammaFilter: string,
			renderGlobalShadow: boolean,
			renderGradientCanvas: OffscreenCanvas = new OffscreenCanvas(1, 1),
			renderGradientCanvasContext: OffscreenCanvasRenderingContext2D,
			renderGradientCanvasGradient: CanvasGradient,
			renderGrayscale: boolean,
			renderGrayscaleFilter: string = 'grayscale(1)',
			renderHeightFactor: number,
			renderHeightOffset: number,
			renderLightingQuality: LightingQuality,
			renderRayDistanceMapInstance: GamingCanvasGridRaycastResultDistanceMapInstance,
			renderRayIndex: number,
			renderSpriteFixedCoordinates: number[] = new Array(4),
			renderSpriteFixedDoorOffset: number,
			renderSpriteFixedWallMovableOffset: number,
			renderSpriteFixedNS: boolean,
			renderSpriteXFactor: number,
			renderSpriteXFactor2: number,
			renderWallHeight: number,
			renderWallHeight2: number,
			renderWallHeightFactored: number,
			renderWallHeightHalf: number,
			renderWallHeightFactor: number,
			settingsDifficulty: GameDifficulty = VideoMainEngine.settings.difficulty,
			settingsFOV: number = VideoMainEngine.settings.fov,
			settingsFPMS: number = 1000 / VideoMainEngine.settings.fps,
			settingsPlayer2Enable: boolean = VideoMainEngine.settings.player2Enable,
			settingsRaycastQuality: RaycastQuality = VideoMainEngine.settings.raycastQuality,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			timestampUnix: number,
			x: number,
			y: number;

		renderGradientCanvasContext = renderGradientCanvas.getContext('2d', {
			alpha: false,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				timestampUnix = Date.now();
				frameCount++;

				/*
				 * Modifiers
				 */

				if (VideoMainEngine.calculationsNew === true) {
					VideoMainEngine.calculationsNew = false;

					calculationsCamera.decode(VideoMainEngine.calculations.camera);
					calculationsRays = VideoMainEngine.calculations.rays;
					calculationsRaysMap = VideoMainEngine.calculations.raysMap;
					calculationsRaysMapKeysSorted = VideoMainEngine.calculations.raysMapKeysSorted;
				}

				if (VideoMainEngine.gameMapNew === true) {
					VideoMainEngine.gameMapNew = false;

					for (actionDoorState of actionDoors.values()) {
						clearTimeout(actionDoorState.timeout);
					}
					actionDoors.clear();
					actionWall.clear();

					gameMapGridData = <Uint16Array>VideoMainEngine.gameMap.grid.data;
					gameMapGridSideLength = VideoMainEngine.gameMap.grid.sideLength;
					gameMapNPC = VideoMainEngine.gameMap.npc;
				}

				if (VideoMainEngine.gameMapUpdateNew === true) {
					VideoMainEngine.gameMapUpdateNew = false;

					gameMapUpdate = VideoMainEngine.gameMapUpdate;
					for (i = 0; i < gameMapUpdate.length; i += 2) {
						gameMapGridData[gameMapUpdate[i]] = gameMapUpdate[i + 1];
					}
				}

				if (VideoMainEngine.reportNew === true || VideoMainEngine.settingsNew === true) {
					// Settings
					settingsDifficulty = VideoMainEngine.settings.difficulty;
					settingsFOV = VideoMainEngine.settings.fov;
					settingsFPMS = 1000 / VideoMainEngine.settings.fps;
					renderGamma = VideoMainEngine.settings.gamma;
					renderGrayscale = VideoMainEngine.settings.grayscale;
					renderLightingQuality = VideoMainEngine.settings.lightingQuality;
					settingsPlayer2Enable = VideoMainEngine.settings.player2Enable;
					settingsRaycastQuality = VideoMainEngine.settings.raycastQuality;

					if (VideoMainEngine.settings.antialias === true) {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
					} else {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
					}

					renderEnable = player1 === true || settingsPlayer2Enable === true;
					renderGammaFilter = `brightness(${renderGamma})`;

					// Report
					if (VideoMainEngine.settings.player2Enable === true) {
						offscreenCanvasHeightPx = VideoMainEngine.report.canvasHeightSplit;
						offscreenCanvasWidthPx = VideoMainEngine.report.canvasWidthSplit;
					} else if (player1 === true) {
						offscreenCanvasHeightPx = VideoMainEngine.report.canvasHeight;
						offscreenCanvasWidthPx = VideoMainEngine.report.canvasWidth;
					} else {
						offscreenCanvasHeightPx = 1;
						offscreenCanvasWidthPx = 1;
					}

					offscreenCanvasHeightPxHalf = (offscreenCanvasHeightPx / 2) | 0;
					offscreenCanvasWidthPxHalf = (offscreenCanvasWidthPx / 2) | 0;

					offscreenCanvas.height = offscreenCanvasHeightPx;
					offscreenCanvas.width = offscreenCanvasWidthPx;
				}

				// Background cache
				if (VideoMainEngine.reportNew === true || VideoMainEngine.settingsNew) {
					VideoMainEngine.reportNew = false;
					VideoMainEngine.settingsNew = false;

					renderGradientCanvas.height = offscreenCanvasHeightPx;
					renderGradientCanvas.width = offscreenCanvasWidthPx;

					if (renderLightingQuality >= LightingQuality.FULL) {
						// Ceiling
						renderGradientCanvasGradient = offscreenCanvasContext.createLinearGradient(0, 0, 0, offscreenCanvasHeightPx / 2); // Ceiling
						renderGradientCanvasGradient.addColorStop(0, '#383838');
						renderGradientCanvasGradient.addColorStop(1, '#181818');
						renderGradientCanvasContext.fillStyle = renderGradientCanvasGradient;
						renderGradientCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx / 2);

						// Floor
						renderGradientCanvasGradient = offscreenCanvasContext.createLinearGradient(0, offscreenCanvasHeightPx / 2, 0, offscreenCanvasHeightPx); // Floor
						renderGradientCanvasGradient.addColorStop(0, '#313131');
						renderGradientCanvasGradient.addColorStop(1, '#717171');
						renderGradientCanvasContext.fillStyle = renderGradientCanvasGradient;
						renderGradientCanvasContext.fillRect(0, offscreenCanvasHeightPx / 2, offscreenCanvasWidthPx, offscreenCanvasHeightPx / 2);
					}
				}

				// Don't render a second screen if it's not even enabled
				if (renderEnable !== true || calculationsRays === undefined) {
					return;
				}

				/*
				 * Render
				 */

				// Render: Aspect ratios and positional offsets
				if (VideoMainEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
					renderWallHeightFactor = 1.5;

					if (settingsPlayer2Enable === true) {
						renderHeightFactor = 2;
						renderHeightOffset = offscreenCanvasWidthPxHalf / 2;
					} else {
						renderHeightFactor = 1;
						renderHeightOffset = 0;
					}
				} else {
					renderHeightFactor = 2;

					if (settingsPlayer2Enable === true) {
						renderHeightOffset = offscreenCanvasWidthPxHalf / 2;
						renderWallHeightFactor = 2;
					} else {
						renderHeightOffset = offscreenCanvasWidthPxHalf;
						renderWallHeightFactor = 1;
					}
				}

				// Render: Backgrounds
				offscreenCanvasContext.filter = 'none';
				if (renderLightingQuality >= LightingQuality.FULL) {
					offscreenCanvasContext.drawImage(renderGradientCanvas, 0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
				} else {
					// Ceiling
					offscreenCanvasContext.fillStyle = '#383838';
					offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPxHalf);

					// Floor
					offscreenCanvasContext.fillStyle = '#717171';
					offscreenCanvasContext.fillRect(0, offscreenCanvasHeightPxHalf, offscreenCanvasWidthPx, offscreenCanvasHeightPxHalf);
				}

				// Render: No Lighting
				if (renderLightingQuality === LightingQuality.NONE) {
					if (renderGamma !== 1 && renderGrayscale === true) {
						offscreenCanvasContext.filter = `${renderGammaFilter} ${renderGrayscaleFilter}`;
					} else if (renderGamma === 1 && renderGrayscale === false) {
						offscreenCanvasContext.filter = renderFilterNone;
					} else if (renderGrayscale === true) {
						offscreenCanvasContext.filter = renderGrayscaleFilter;
					} else {
						offscreenCanvasContext.filter = renderGammaFilter;
					}
				}

				// Iterate: By Distance
				for (i of calculationsRaysMapKeysSorted) {
					renderRayDistanceMapInstance = <GamingCanvasGridRaycastResultDistanceMapInstance>calculationsRaysMap.get(i);

					/**
					 * Draw: Ray
					 */
					if (renderRayDistanceMapInstance.rayIndex !== undefined) {
						renderRayIndex = renderRayDistanceMapInstance.rayIndex;
						gameMapGridIndex = calculationsRays[renderRayIndex + 4];

						// Render: Modification based on cell sidedness
						switch (calculationsRays[renderRayIndex + 6]) {
							case GamingCanvasGridRaycastCellSide.EAST:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex + gameMapGridSideLength];
								renderAssets = assetImagesInvertHorizontal;
								renderGlobalShadow = true;
								break;
							case GamingCanvasGridRaycastCellSide.NORTH:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex - 1];
								renderAssets = assetImagesInvertHorizontal;
								renderGlobalShadow = false;
								break;
							case GamingCanvasGridRaycastCellSide.SOUTH:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex + 1];
								renderAssets = assetImages;
								renderGlobalShadow = false;
								break;
							case GamingCanvasGridRaycastCellSide.WEST:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex - gameMapGridSideLength];
								renderAssets = assetImages;
								renderGlobalShadow = true;
								break;
						}

						// Render: Asset Selection
						if ((gameMapGridCell2 & GameGridCellMasksAndValues.EXTENDED) !== 0 && (gameMapGridCell2 & gameGridCellMaskExtendedDoor) !== 0) {
							asset = renderAssets.get(AssetIdImg.SPRITE_METAL_DOOR_INSIDE) || renderImageTest;
						} else {
							gameMapGridCell = gameMapGridData[gameMapGridIndex];
							renderAssetId =
								(gameMapGridCell & GameGridCellMasksAndValues.EXTENDED) !== 0
									? gameMapGridCell & GameGridCellMasksAndValuesExtended.ID_MASK
									: gameMapGridCell & GameGridCellMasksAndValues.ID_MASK;

							asset = renderAssets.get(renderAssetId) || renderImageTest;
						}

						// Calc
						renderWallHeight = (offscreenCanvasHeightPx / calculationsRays[renderRayIndex + 3]) * renderWallHeightFactor;
						renderWallHeightFactored = renderWallHeight / renderHeightFactor;
						renderWallHeightHalf = renderWallHeight / 2;

						// Render: Lighting
						if (renderLightingQuality !== LightingQuality.NONE) {
							renderBrightness = 0;

							// Filter: Start
							if (renderLightingQuality === LightingQuality.FULL) {
								renderBrightness -= Math.min(0.75, calculationsRays[renderRayIndex + 2] / 20); // no min is lantern light

								if (renderGlobalShadow === true) {
									renderBrightness = Math.max(-0.85, renderBrightness - 0.3);
								}
							} else if (renderLightingQuality === LightingQuality.BASIC) {
								if (renderGlobalShadow === true) {
									renderBrightness -= 0.3;
								}
							}

							// Filter: End
							offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
						}

						// Render: 3D Projection
						offscreenCanvasContext.drawImage(
							asset, // (image) Draw from our test image
							calculationsRays[renderRayIndex + 5] * (asset.width - 1), // (x-source) Specific how far from the left to draw from the test image
							0, // (y-source) Start at the bottom of the image (y pixel)
							1, // (width-source) Slice 1 pixel wide
							asset.height, // (height-source) height of our test image
							((renderRayIndex + 6) * settingsRaycastQuality) / 7, // (x-destination) Draw sliced image at pixel (6 elements per ray)
							(offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
							settingsRaycastQuality, // (width-destination) Draw the sliced image as 1 pixel wide (2 covers gaps between rays)
							renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
						);
					}

					/**
					 * Draw: Sprites
					 */
					if (renderRayDistanceMapInstance.cellIndex !== undefined) {
						gameMapGridIndex = renderRayDistanceMapInstance.cellIndex;
						gameMapGridCell = gameMapGridData[gameMapGridIndex];
						renderGlobalShadow = false;

						// Environment
						if (gameMapGridCell !== GameGridCellMasksAndValues.NULL && gameMapGridCell !== GameGridCellMasksAndValues.FLOOR) {
							/**
							 * Draw: Sprites - Fixed
							 */
							if ((gameMapGridCell & gameGridCellMaskSpriteFixed) !== 0) {
								offscreenCanvasContext.filter = 'none';
								renderSpriteFixedNS = (gameMapGridCell & GameGridCellMasksAndValues.SPRITE_FIXED_NS) !== 0;

								// Calc: Position
								y = gameMapGridIndex % gameMapGridSideLength;
								x = (gameMapGridIndex - y) / gameMapGridSideLength - calculationsCamera.x;
								y -= calculationsCamera.y;

								/**
								 * Action: Door
								 */
								asset = <any>undefined;
								renderSpriteFixedDoorOffset = 0;
								if ((gameMapGridCell & GameGridCellMasksAndValues.EXTENDED) !== 0 && (gameMapGridCell & gameGridCellMaskExtendedDoor) !== 0) {
									actionDoorState = <CalcBusActionDoorState>actionDoors.get(gameMapGridIndex);
									asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValuesExtended.ID_MASK) || renderImageTest;

									// Door in a non-closed state
									if (
										actionDoorState !== undefined &&
										(actionDoorState.closing === true || actionDoorState.open === true || actionDoorState.opening === true)
									) {
										if (actionDoorState.open === true && actionDoorState.closing === false) {
											renderSpriteFixedDoorOffset = 1;
											// console.log('DOOR OPEN', renderSpriteFixedDoorOffset);
										} else if (actionDoorState.closing === true) {
											renderSpriteFixedDoorOffset = Math.max(
												0,
												1 - (timestampUnix - actionDoorState.timestampUnix) / CalcBusActionDoorStateChangeDurationInMS,
											);
											// console.log('DOOR CLOSING', renderSpriteFixedDoorOffset);
										} else {
											renderSpriteFixedDoorOffset = Math.min(
												1,
												(timestampUnix - actionDoorState.timestampUnix) / CalcBusActionDoorStateChangeDurationInMS,
											);
											// console.log('DOOR OPENING', renderSpriteFixedDoorOffset);
										}

										if (
											actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.NORTH ||
											actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.SOUTH
										) {
											x += renderSpriteFixedDoorOffset;
										} else {
											y += renderSpriteFixedDoorOffset;
										}
									}
								}

								// The door is wide open
								if (renderSpriteFixedDoorOffset === 1) {
									continue;
								}

								/**
								 * Action: Wall Move
								 */
								renderSpriteFixedWallMovableOffset = 0;
								if ((gameMapGridCell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0 && actionWall.has(gameMapGridIndex) === true) {
									actionWallState = <CalcBusOutputDataActionWallMove>actionWall.get(gameMapGridIndex);

									if (actionWallState !== undefined) {
										renderSpriteFixedWallMovableOffset =
											2 * Math.min(1, (timestampUnix - actionWallState.timestampUnix) / CalcBusActionWallMoveStateChangeDurationInMS);

										// Render: Modification based on cell sidedness
										switch (actionWallState.cellSide) {
											case GamingCanvasGridRaycastCellSide.EAST: // inv
												asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
												x += renderSpriteFixedWallMovableOffset - 0.5;
												break;
											case GamingCanvasGridRaycastCellSide.NORTH:
												asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
												y -= renderSpriteFixedWallMovableOffset - 0.5; // inv
												break;
											case GamingCanvasGridRaycastCellSide.SOUTH:
												asset =
													assetImagesInvertHorizontal.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
												y += renderSpriteFixedWallMovableOffset - 0.5; // good
												renderGlobalShadow = true;
												break;
											case GamingCanvasGridRaycastCellSide.WEST: // good
												asset =
													assetImagesInvertHorizontal.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
												x -= renderSpriteFixedWallMovableOffset - 0.5;
												renderGlobalShadow = true;
												break;
										}
									}
								}

								/**
								 * Position 1
								 */

								x += renderSpriteFixedNS === true ? 0.5 : 0; // 0.5 is center
								y += renderSpriteFixedNS === true ? 0 : 0.5; // 0.5 is center

								// Calc: Angle (fisheye correction)
								renderAngle = Math.atan2(-y, x) + GamingCanvasConstPIHalf;

								// Calc: Distance
								renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

								// Calc: Height
								renderSpriteFixedCoordinates[1] = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;

								// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
								renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

								// Corrections for rotations between 0 and 2pi
								if (renderSpriteXFactor > GamingCanvasConstPIDouble) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}
								if (renderSpriteXFactor > GamingCanvasConstPI) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}

								renderSpriteFixedCoordinates[0] = (renderSpriteXFactor / settingsFOV) * offscreenCanvasWidthPx;

								/**
								 * Position 2
								 */

								if (actionDoorState !== undefined) {
									if (
										actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.NORTH ||
										actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.SOUTH
									) {
										x -= renderSpriteFixedDoorOffset;
									} else {
										y -= renderSpriteFixedDoorOffset;
									}
								}

								x += renderSpriteFixedNS === true ? 0 : 1;
								y += renderSpriteFixedNS === true ? 1 : 0;

								// Calc: Angle (fisheye correction)
								renderAngle = Math.atan2(-y, x) + GamingCanvasConstPIHalf;

								// Calc: Distance
								renderDistance2 = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

								// Calc: Height
								renderSpriteFixedCoordinates[3] = (offscreenCanvasHeightPx / renderDistance2) * renderWallHeightFactor;

								// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
								renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

								// Corrections for rotations between 0 and 2pi
								if (renderSpriteXFactor > GamingCanvasConstPIDouble) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}
								if (renderSpriteXFactor > GamingCanvasConstPI) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}

								renderSpriteFixedCoordinates[2] = (renderSpriteXFactor / settingsFOV) * offscreenCanvasWidthPx;

								/**
								 * Render: Lighting
								 */
								renderDistance = (renderDistance + renderDistance2) / 2;

								if ((gameMapGridCell & GameGridCellMasksAndValues.LIGHT) !== 0) {
									offscreenCanvasContext.filter = renderGrayscale === true ? renderGrayscaleFilter : renderFilterNone;
								} else if (renderLightingQuality !== LightingQuality.NONE) {
									renderBrightness = 0;

									// Filter: Start
									if (renderLightingQuality === LightingQuality.FULL) {
										renderBrightness -= Math.min(0.75, calculationsRays[renderRayIndex + 2] / 20); // no min is lantern light

										if (renderGlobalShadow === true) {
											renderBrightness = Math.max(-0.85, renderBrightness - 0.3);
										}
									} else if (renderLightingQuality === LightingQuality.BASIC) {
										if (renderGlobalShadow === true) {
											renderBrightness -= 0.3;
										}
									}

									// Filter: End
									offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
								}

								/**
								 * Render images between coordinates
								 */
								// Calc: Height/Width changes between cooridnates
								x = renderSpriteFixedCoordinates[2] - renderSpriteFixedCoordinates[0];
								y = renderSpriteFixedCoordinates[3] - renderSpriteFixedCoordinates[1];

								// Calc: Width of sprite in pixels
								renderDistance = ((x * x + y * y) ** 0.5) | 0;

								if (asset === undefined) {
									asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
								}

								for (i = 1; i < renderDistance; i++) {
									renderSpriteXFactor = i / renderDistance; // Determine percentage of left to right

									// Calc: Height
									renderWallHeight = renderSpriteFixedCoordinates[1] + y * renderSpriteXFactor;

									// Render: 3D Projection
									offscreenCanvasContext.drawImage(
										asset, // (image) Draw from our test image
										renderSpriteXFactor * (1 - renderSpriteFixedDoorOffset) * asset.width, // (x-source) Specific how far from the left to draw from the test image
										0, // (y-source) Start at the bottom of the image (y pixel)
										1, // (width-source) Slice 1 pixel wide
										asset.height, // (height-source) height of our test image
										renderSpriteFixedCoordinates[0] + x * renderSpriteXFactor, // (x-destination) Draw sliced image at pixel
										(offscreenCanvasHeightPxHalf - renderWallHeight / 2) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
										2, // (width-destination) Draw the sliced image as 1 pixel wide
										renderWallHeight / renderHeightFactor, // (height-destination) Draw the sliced image as tall as the wall height
									);
								}
							} else {
								/**
								 * Draw: Sprites - Rotating
								 */
								asset =
									assetImagesInvertHorizontal.get(
										(gameMapGridCell & GameGridCellMasksAndValues.EXTENDED) !== 0
											? gameMapGridCell & GameGridCellMasksAndValuesExtended.ID_MASK
											: gameMapGridCell & GameGridCellMasksAndValues.ID_MASK,
									) || renderImageTest;

								// Calc: Position
								y = gameMapGridIndex % gameMapGridSideLength;
								x = (gameMapGridIndex - y) / gameMapGridSideLength - calculationsCamera.x + 0.5; // 0.5 is center
								y -= calculationsCamera.y - 0.5; // 0.5 is center

								// Calc: Angle (fisheye correction)
								renderAngle = Math.atan2(-y, x) + GamingCanvasConstPIHalf;

								// Calc: Distance
								renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

								// Calc: Height
								renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
								renderWallHeightFactored = renderWallHeight / renderHeightFactor;
								renderWallHeightHalf = renderWallHeight / 2;

								// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
								renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

								// Corrections for rotations between 0 and 2pi
								if (renderSpriteXFactor > GamingCanvasConstPIDouble) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}
								if (renderSpriteXFactor > GamingCanvasConstPI) {
									renderSpriteXFactor -= GamingCanvasConstPIDouble;
								}

								renderSpriteXFactor /= settingsFOV;

								// Render: Lighting
								if ((gameMapGridCell & GameGridCellMasksAndValues.LIGHT) !== 0) {
									offscreenCanvasContext.filter = renderGrayscale === true ? renderGrayscaleFilter : renderFilterNone;
								} else if (renderLightingQuality !== LightingQuality.NONE) {
									renderBrightness = 0;

									// Filter: Start
									if (renderLightingQuality === LightingQuality.FULL) {
										renderBrightness -= Math.min(0.75, calculationsRays[renderRayIndex + 2] / 20); // no min is lantern light

										// if (renderGlobalShadow === true) {
										// 	renderBrightness = Math.max(-0.85, renderBrightness - 0.3);
										// }
									} else if (renderLightingQuality === LightingQuality.BASIC) {
										// if (renderGlobalShadow === true) {
										// 	renderBrightness -= 0.3;
										// }
									}

									// Filter: End
									offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
								}

								// Render: 3D Projection
								offscreenCanvasContext.drawImage(
									asset, // (image) Draw from our test image
									0, // (x-source) Specific how far from the left to draw from the test image
									0, // (y-source) Start at the bottom of the image (y pixel)
									asset.width, // (width-source) width of our image
									asset.height, // (height-source) height of our image
									renderSpriteXFactor * offscreenCanvasWidthPx - renderWallHeightHalf / renderHeightFactor, // (x-destination) Draw sliced image at pixel
									(offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
									renderWallHeightFactored, // (width-destination) Draw the sliced image as wide as the wall height
									renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
								);
							}
						}

						/**
						 * Draw: Sprites - Characters
						 */
						renderCharacterNPC = gameMapNPC.get(gameMapGridIndex);
						if (renderCharacterNPC !== undefined && renderCharacterNPC.difficulty <= settingsDifficulty) {
							assetImageCharacterInstance = <any>assetImageCharacters.get(renderCharacterNPC.type);

							// Calc: Position
							x = renderCharacterNPC.camera.x - calculationsCamera.x;
							y = renderCharacterNPC.camera.y - calculationsCamera.y;

							// Calc: Angle (fisheye correction)
							renderAngle = Math.atan2(-y, x) + GamingCanvasConstPIHalf;

							// Calc: Distance
							renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

							// Calc: Height
							renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
							renderWallHeightFactored = renderWallHeight / renderHeightFactor;
							renderWallHeightHalf = renderWallHeight / 2;

							// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
							renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

							// Corrections for rotations between 0 and 2pi
							if (renderSpriteXFactor > GamingCanvasConstPIDouble) {
								renderSpriteXFactor -= GamingCanvasConstPIDouble;
							}
							if (renderSpriteXFactor > GamingCanvasConstPI) {
								renderSpriteXFactor -= GamingCanvasConstPIDouble;
							}

							renderSpriteXFactor /= settingsFOV;

							// Calc: Asset by rotation
							if (renderCharacterNPC.assetId < AssetIdImgCharacter.MOVE1_E) {
								// Facing camera
								asset = assetImageCharacterInstance.get(renderCharacterNPC.assetId) || renderImageTest;
							} else {
								// Angled away from camera
								renderAngle = renderCharacterNPC.camera.r - Math.atan2(-y, x) + GamingCanvasConstPIHalf * 1.25;
								if (renderAngle < 0) {
									renderAngle += GamingCanvasConstPIDouble;
								} else if (renderAngle > GamingCanvasConstPIDouble) {
									renderAngle -= GamingCanvasConstPIDouble;
								}

								if (renderAngle < 0.7855) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_E) || renderImageTest;
								} else if (renderAngle < 1.5708) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_NE) || renderImageTest;
								} else if (renderAngle < 2.3562) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_N) || renderImageTest;
								} else if (renderAngle < 3.1416) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_NW) || renderImageTest;
								} else if (renderAngle < 3.927) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_W) || renderImageTest;
								} else if (renderAngle < 4.7124) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_SW) || renderImageTest;
								} else if (renderAngle < 5.4978) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_S) || renderImageTest;
								} else {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_SE) || renderImageTest;
								}
							}

							// Render: Lighting
							if (
								renderLightingQuality !== LightingQuality.NONE &&
								renderCharacterNPC.assetId !== AssetIdImgCharacter.FIRE &&
								(gameMapGridCell & GameGridCellMasksAndValues.LIGHT) === 0
							) {
								renderBrightness = 0;

								// Filter: Start
								if (renderLightingQuality === LightingQuality.FULL) {
									renderBrightness -= Math.min(0.75, calculationsRays[renderRayIndex + 2] / 20); // no min is lantern light
								}

								// Filter: End
								offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
							}

							// Render: 3D Projection
							offscreenCanvasContext.drawImage(
								asset, // (image) Draw from our test image
								0, // (x-source) Specific how far from the left to draw from the test image
								0, // (y-source) Start at the bottom of the image (y pixel)
								asset.width, // (width-source) width of our image
								asset.height, // (height-source) height of our image
								renderSpriteXFactor * offscreenCanvasWidthPx - renderWallHeightHalf / renderHeightFactor, // (x-destination) Draw sliced image at pixel
								(offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
								renderWallHeightFactored, // (width-destination) Draw the sliced image as wide as the wall height
								renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
							);
						}
					}
				}
			}

			// Stats: sent once per second
			if (renderEnable === true && timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				// Output
				VideoMainEngine.post([
					{
						cmd: VideoMainBusOutputCmd.STATS,
						data: {
							fps: frameCount,
						},
					},
				]);
				frameCount = 0;
			}
		};
		VideoMainEngine.go = go;
	}
}
