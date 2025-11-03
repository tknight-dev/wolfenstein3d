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
	assetIdImgCharacterMoveS,
	assetIdImgCharacterMoveSE,
	assetIdImgCharacterMoveSW,
	assetIdImgCharacterMoveW,
	assetIdImgCharacterMoveNW,
	assetIdImgCharacterMoveN,
	assetIdImgCharacterMoveNE,
	assetIdImgCharacterMoveE,
	AssetIdImgWeaponSequenceKnife,
	AssetIdImgWeaponSequenceMachineGun,
	AssetIdImgWeaponSequencePistol,
	AssetIdImgWeaponSequenceSubMachineGun,
	assetIdImgCharacterDie,
} from '../../asset-manager.js';
import {
	GamingCanvas,
	GamingCanvasConstPI_1_000,
	GamingCanvasConstPI_2_000,
	GamingCanvasConstPI_0_500,
	GamingCanvasReport,
	GamingCanvasRenderStyle,
	GamingCanvasUtilTimers,
	GamingCanvasStat,
} from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameGridCellMasksAndValues, gameGridCellMaskSpriteFixed, GameMap } from '../../models/game.model.js';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataCalculations,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusInputPayload,
	VideoMainBusOutputCmd,
	VideoMainBusOutputPayload,
	VideoMainBusStats,
} from './video-main.model.js';
import {
	GamingCanvasConstPI_1_875,
	GamingCanvasConstPI_0_125,
	GamingCanvasConstPI_0_375,
	GamingCanvasConstPI_0_625,
	GamingCanvasConstPI_0_875,
	GamingCanvasConstPI_1_125,
	GamingCanvasConstPI_1_375,
	GamingCanvasConstPI_1_625,
	GamingCanvasOrientation,
	GamingCanvasUtilDebugImage,
} from '@tknight-dev/gaming-canvas';
import { GamingCanvasGridCamera, GamingCanvasGridRaycastCellSide, GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import { LightingQuality, RaycastQuality, RenderMode } from '../../models/settings.model.js';
import {
	CalcMainBusActionDoorState,
	CalcMainBusActionDoorStateChangeDurationInMS,
	CalcMainBusActionWallMoveStateChangeDurationInMS,
	CalcMainBusDieFrameDurationInMS,
	CalcMainBusFOVByDifficulty,
	CalcMainBusOutputDataActionSwitch,
	CalcMainBusOutputDataActionTag,
	CalcMainBusOutputDataActionWallMove,
	CalcMainBusOutputDataNPCUpdate,
	CalcMainBusPlayerDeadFadeDurationInMS,
	CalcMainBusPlayerDeadFallDurationInMS,
	CalcMainBusWeaponFireDurationsInMS,
} from '../calc-main/calc-main.model.js';
import { CharacterNPC, CharacterNPCUpdateDecodeAndApply, CharacterNPCUpdateDecodeId, CharacterWeapon } from '../../models/character.model.js';
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
			VideoMainEngine.inputActionDoor(<CalcMainBusActionDoorState>payload.data);
			break;
		case VideoMainBusInputCmd.ACTION_SWITCH:
			VideoMainEngine.inputActionSwitch(<CalcMainBusOutputDataActionSwitch>payload.data);
			break;
		case VideoMainBusInputCmd.ACTION_TAG:
			VideoMainEngine.inputActionTag(<CalcMainBusOutputDataActionTag>payload.data);
			break;
		case VideoMainBusInputCmd.ACTION_WALL_MOVE:
			VideoMainEngine.inputActionWallMove(<CalcMainBusOutputDataActionWallMove>payload.data);
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
		case VideoMainBusInputCmd.NPC_UPDATE:
			VideoMainEngine.inputNPCUpdate(<CalcMainBusOutputDataNPCUpdate>payload.data);
			break;
		case VideoMainBusInputCmd.PAUSE:
			VideoMainEngine.inputPause(<boolean>payload.data);
			break;
		case VideoMainBusInputCmd.PLAYER_DEAD:
			VideoMainEngine.inputPlayerDead();
			break;
		case VideoMainBusInputCmd.REPORT:
			VideoMainEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoMainBusInputCmd.SETTINGS:
			VideoMainEngine.inputSettings(<VideoMainBusInputDataSettings>payload.data);
			break;
		case VideoMainBusInputCmd.WEAPON_FIRE:
			VideoMainEngine.inputWeaponFire(<boolean>payload.data);
			break;
		case VideoMainBusInputCmd.WEAPON_SELECT:
			VideoMainEngine.inputWeaponSelect(<CharacterWeapon>payload.data);
			break;
	}
};

class VideoMainEngine {
	private static actionDoors: Map<number, CalcMainBusActionDoorState> = new Map();
	private static actionWall: Map<number, CalcMainBusOutputDataActionWallMove> = new Map();
	private static assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = new Map();
	private static assetImages: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static assetImagesInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static calculations: VideoMainBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static dead: boolean;
	private static deadTimerId: number;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static gameMapUpdate: Uint16Array;
	private static gameMapUpdateNew: boolean;
	private static npcUpdate: Float32Array[];
	private static npcUpdateNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static player1: boolean;
	private static pause: boolean = true;
	private static pauseTimestampUnix: number = Date.now();
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoMainBusInputDataSettings;
	private static settingsNew: boolean;
	private static stats: { [key: number]: GamingCanvasStat } = {};
	private static tagRunAndJump: boolean;
	private static tagRunAndJumpOptions: any;
	private static timers: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();
	private static weapon: CharacterWeapon = CharacterWeapon.PISTOL;
	private static weaponFrame: number = 0;
	private static weaponTimerId: number = -1;

	public static async initialize(data: VideoMainBusInputDataInit): Promise<void> {
		// Stats
		VideoMainEngine.stats[VideoMainBusStats.ALL] = new GamingCanvasStat(50);
		VideoMainEngine.stats[VideoMainBusStats.NPC_C_V] = new GamingCanvasStat(50);
		VideoMainEngine.stats[VideoMainBusStats.RAY] = new GamingCanvasStat(50);
		VideoMainEngine.stats[VideoMainBusStats.RAY_C_V] = new GamingCanvasStat(50);
		VideoMainEngine.stats[VideoMainBusStats.SPRITE] = new GamingCanvasStat(50);

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
		VideoMainEngine.player1 = data.player1;

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
			switch (data.renderMode) {
				case RenderMode.OPENGL:
					VideoMainEngine.goOpenGL__funcForward();
					VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goOpenGL);
					break;
				case RenderMode.RAYCAST:
					VideoMainEngine.goRaycast__funcForward();
					VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goRaycast);
					break;
				case RenderMode.WEBGL:
					VideoMainEngine.goWebGL__funcForward();
					VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goWebGL);
					break;
			}
		}
	}

	/*
	 * Input
	 */

	public static inputActionDoor(data: CalcMainBusActionDoorState): void {
		let durationEff: number,
			statePrevious: CalcMainBusActionDoorState = <CalcMainBusActionDoorState>VideoMainEngine.actionDoors.get(data.gridIndex);

		if (statePrevious !== undefined) {
			VideoMainEngine.timers.clear(statePrevious.timeout);

			if (statePrevious.closing === true) {
				data.timestampUnix -= CalcMainBusActionDoorStateChangeDurationInMS - (Date.now() - statePrevious.timestampUnix);
			}
		}

		durationEff = CalcMainBusActionDoorStateChangeDurationInMS - (Date.now() - data.timestampUnix);
		VideoMainEngine.actionDoors.set(data.gridIndex, data);

		if (data.closing === true) {
			VideoMainEngine.gameMap.grid.data[data.gridIndex] |= GameGridCellMasksAndValues.WALL_INVISIBLE;
		}
		data.timeout = VideoMainEngine.timers.add(() => {
			// Change state complete
			if (data.closing === true) {
				data.closed = true;
				data.closing = false;
				data.open = false;
				data.opening = false;
			} else if (data.opening === true) {
				data.closed = false;
				data.closing = false;
				data.open = true;
				data.opening = false;
				VideoMainEngine.gameMap.grid.data[data.gridIndex] &= ~GameGridCellMasksAndValues.WALL_INVISIBLE;
			}
		}, durationEff);
	}

	public static inputActionSwitch(data: CalcMainBusOutputDataActionSwitch): void {
		VideoMainEngine.gameMap.grid.data[data.gridIndex] = data.cellValue;
	}

	public static inputActionTag(data: CalcMainBusOutputDataActionTag): void {
		if (data.type === GameGridCellMasksAndValues.TAG_RUN_AND_JUMP) {
			VideoMainEngine.tagRunAndJump = true;
			VideoMainEngine.tagRunAndJumpOptions = data.options;
		}
	}

	public static inputActionWallMove(data: CalcMainBusOutputDataActionWallMove): void {
		const gameMapGridData: Uint32Array = VideoMainEngine.gameMap.grid.data;

		// Cache: store the timestamp for animation
		VideoMainEngine.actionWall.set(data.gridIndex, data);

		// Calc: Offset
		let offset: number, spriteType: number;
		switch (data.cellSide) {
			case GamingCanvasGridRaycastCellSide.EAST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = -VideoMainEngine.gameMap.grid.sideLength;
				break;
			case GamingCanvasGridRaycastCellSide.NORTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = 1;
				break;
			case GamingCanvasGridRaycastCellSide.SOUTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = -1;
				break;
			case GamingCanvasGridRaycastCellSide.WEST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = VideoMainEngine.gameMap.grid.sideLength;
				break;
		}

		// Calc: State
		gameMapGridData[data.gridIndex + offset * 2] = gameMapGridData[data.gridIndex] & ~GameGridCellMasksAndValues.WALL_MOVABLE;

		gameMapGridData[data.gridIndex] &= ~GameGridCellMasksAndValues.WALL;
		gameMapGridData[data.gridIndex] |= spriteType;

		// Calc: Move 1st Block
		VideoMainEngine.timers.add(
			() => {
				// 2nd block
				gameMapGridData[data.gridIndex + offset] = gameMapGridData[data.gridIndex];

				data.timestampUnix += (CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0;
				VideoMainEngine.actionWall.set(data.gridIndex + offset, data);

				// 1st block
				gameMapGridData[data.gridIndex] = GameGridCellMasksAndValues.FLOOR;
				VideoMainEngine.actionWall.delete(data.gridIndex);

				// Calc: Move 2nd Block
				VideoMainEngine.timers.add(
					() => {
						gameMapGridData[data.gridIndex + offset] = GameGridCellMasksAndValues.FLOOR;

						VideoMainEngine.actionWall.delete(data.gridIndex + offset);
					},
					(CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0,
				);
			},
			(CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0,
		);
	}

	public static inputCalculations(data: VideoMainBusInputDataCalculations): void {
		VideoMainEngine.stats[VideoMainBusStats.RAY_C_V].add(Date.now() - data.timestampUnix);

		VideoMainEngine.calculations = data;
		VideoMainEngine.calculationsNew = true;
	}

	public static inputMap(data: GameMap): void {
		VideoMainEngine.dead = false;
		VideoMainEngine.gameMap = Assets.mapParse(data);
		VideoMainEngine.gameMapNew = true;
	}

	public static inputMapUpdate(data: Uint16Array): void {
		VideoMainEngine.gameMapUpdate = data;
		VideoMainEngine.gameMapUpdateNew = true;
	}

	public static inputNPCUpdate(data: CalcMainBusOutputDataNPCUpdate): void {
		VideoMainEngine.stats[VideoMainBusStats.NPC_C_V].add(Date.now() - data.timestampUnix);
		VideoMainEngine.npcUpdate = data.npcs;
		VideoMainEngine.npcUpdateNew = true;
	}

	public static inputPause(state: boolean): void {
		VideoMainEngine.pause = state;
	}

	public static inputPlayerDead(): void {
		// Fall
		VideoMainEngine.deadTimerId = VideoMainEngine.timers.add(() => {}, CalcMainBusPlayerDeadFallDurationInMS);

		// Fall + Fade/2
		VideoMainEngine.timers.add(
			() => {
				VideoMainEngine.dead = false;
			},
			((CalcMainBusPlayerDeadFadeDurationInMS / 2) | 0) + CalcMainBusPlayerDeadFallDurationInMS,
		);

		VideoMainEngine.dead = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoMainEngine.report = report;
		VideoMainEngine.reportNew = true;
	}

	public static inputSettings(data: VideoMainBusInputDataSettings): void {
		VideoMainEngine.settings = data;
		VideoMainEngine.settingsNew = true;
	}

	public static inputWeaponFire2(): void {
		const timers: GamingCanvasUtilTimers = VideoMainEngine.timers,
			weapon: CharacterWeapon = VideoMainEngine.weapon;

		timers.clear(VideoMainEngine.weaponTimerId);
		VideoMainEngine.weaponFrame = 2;
		VideoMainEngine.weaponTimerId = timers.add(
			() => {
				// Weapon state: 3 (fire, recoil or stab)
				VideoMainEngine.weaponFrame = 3;
				VideoMainEngine.weaponTimerId = timers.add(
					() => {
						// Weapon state: 4 (holstering)
						VideoMainEngine.weaponFrame = 4;
						VideoMainEngine.weaponTimerId = timers.add(
							() => {
								// Weapon state: 0 (holstered)
								VideoMainEngine.weaponFrame = 0;
							},
							(<number[]>CalcMainBusWeaponFireDurationsInMS.get(weapon))[4],
						);
					},
					(<number[]>CalcMainBusWeaponFireDurationsInMS.get(weapon))[3],
				);
			},
			(<number[]>CalcMainBusWeaponFireDurationsInMS.get(weapon))[2],
		);
	}

	public static inputWeaponFire(refire?: boolean): void {
		const timers: GamingCanvasUtilTimers = VideoMainEngine.timers,
			weapon: CharacterWeapon = VideoMainEngine.weapon;

		if (refire === true) {
			VideoMainEngine.inputWeaponFire2();
		} else {
			// Weapon state: 0 (holstered)
			VideoMainEngine.weaponTimerId = timers.add(
				() => {
					// Weapon state: 1 (rising)
					VideoMainEngine.weaponFrame = 1;
					VideoMainEngine.weaponTimerId = timers.add(
						() => {
							// Weapon state: 2 (fire or rising)
							VideoMainEngine.inputWeaponFire2();
						},
						(<number[]>CalcMainBusWeaponFireDurationsInMS.get(weapon))[1],
					);
				},
				(<number[]>CalcMainBusWeaponFireDurationsInMS.get(weapon))[0],
			);
		}
	}

	public static inputWeaponSelect(weapon: CharacterWeapon): void {
		VideoMainEngine.weapon = weapon;
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

	public static goOpenGL(_timestampNow: number): void {}
	public static goOpenGL__funcForward(): void {
		let countFrame: number = 0,
			settingsFPMS: number = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0,
			timestampDelta: number,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(go);

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				if (settingsFPMS === 0) {
					timestampThen = timestampNow - timestampDelta;
				} else {
					timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				}
				countFrame++;

				if (VideoMainEngine.settingsNew === true) {
					VideoMainEngine.settingsNew = false;

					settingsFPMS = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0;

					if (VideoMainEngine.settings.renderMode !== RenderMode.OPENGL) {
						cancelAnimationFrame(VideoMainEngine.request);
						switch (VideoMainEngine.settings.renderMode) {
							// case RenderMode.OPENGL:
							// 	VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goOpenGL);
							// 	break;
							case RenderMode.RAYCAST:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goRaycast);
								break;
							case RenderMode.WEBGL:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goWebGL);
								break;
						}
					}
				}
			}
		};
		VideoMainEngine.goOpenGL = go;
	}

	public static goRaycast(_timestampNow: number): void {}
	public static goRaycast__funcForward(): void {
		let actionDoors: Map<number, CalcMainBusActionDoorState> = VideoMainEngine.actionDoors,
			actionDoorState: CalcMainBusActionDoorState,
			actionWall: Map<number, CalcMainBusOutputDataActionWallMove> = VideoMainEngine.actionWall,
			actionWallState: CalcMainBusOutputDataActionWallMove,
			asset: OffscreenCanvas,
			assetImageCharacterInstance: Map<AssetIdImgCharacter, OffscreenCanvas>,
			assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = VideoMainEngine.assetImageCharacters,
			assetImages: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assetImages,
			assetImagesInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assetImagesInvertHorizontal,
			calculationsCamera: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			calculationsCameraAlt: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			calculationsCameraAltGridIndex: number,
			calculationsCameraGridIndex: number,
			calculationsRays: Float64Array,
			calculationsRaysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			calculationsRaysMapKeysSorted: Float64Array,
			characterIdByGridIndexSorted: number[],
			characterNPC: CharacterNPC,
			characterNPCId: number,
			characterNPCUpdateEncoded: Float32Array,
			color: string,
			countFrame: number = 0,
			countRays: number = 0,
			countSprites: number = 0,
			offscreenCanvas: OffscreenCanvas = VideoMainEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = VideoMainEngine.report.canvasHeightSplit,
			offscreenCanvasHeightPxHalf: number = (offscreenCanvasHeightPx / 2) | 0,
			offscreenCanvasWidthPx: number = VideoMainEngine.report.canvasWidthSplit,
			offscreenCanvasWidthPxHalf: number = (offscreenCanvasWidthPx / 2) | 0,
			gameMapColorCeiling: number = 0,
			gameMapColorFloor: number = 0,
			gameMapGridCell: number,
			gameMapGridCell2: number,
			gameMapGridIndex: number,
			gameMapGridData: Uint32Array,
			gameMapGridSideLength: number,
			gameMapNPCById: Map<number, CharacterNPC>,
			gameMapNPCDead: Set<number> = new Set(),
			gameMapNPCByGridIndex: Map<number, Map<number, CharacterNPC>> = new Map(),
			gameMapNPCByGridIndexInstance: Map<number, CharacterNPC>,
			gameMapNPCShootAt: Map<number, number> = new Map(),
			gameMapUpdate: Uint16Array,
			i: number,
			player1: boolean = VideoMainEngine.player1,
			pause: boolean = VideoMainEngine.pause,
			renderAltStand: boolean,
			renderAltStandTimerId: number = -42,
			renderAngle: number,
			renderAssetId: number,
			renderAssets: Map<AssetIdImg, OffscreenCanvas>,
			renderBrightness: number,
			renderCharacterNPC: CharacterNPC | undefined,
			renderCharacterNPCState: number,
			renderDead: boolean = VideoMainEngine.dead,
			renderDeadTimerId: number = VideoMainEngine.deadTimerId,
			renderDistance: number,
			renderDistance1: number,
			renderDistance2: number,
			renderDebugImage: OffscreenCanvas = GamingCanvasUtilDebugImage(64),
			renderFilter: string,
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
			renderModeEdit: boolean | undefined,
			renderRayDistanceMapInstance: GamingCanvasGridRaycastResultDistanceMapInstance,
			renderRayIndex: number,
			renderSkip: boolean,
			renderSpriteFixedCoordinates: number[] = new Array(4),
			renderSpriteFixedDoorOffset: number,
			renderSpriteFixedWallMovableOffset: number,
			renderSpriteFixedNS: boolean,
			renderSpriteXFactor: number,
			renderStep: number,
			renderTilt: number = 1,
			renderWallHeight: number,
			renderWallHeightFactored: number,
			renderWallHeightHalf: number,
			renderWallHeightFactor: number,
			renderWeapon: CharacterWeapon = VideoMainEngine.weapon,
			renderWeaponFire: boolean,
			renderWeaponFactor: number,
			renderWeaponHeight: number,
			renderWeaponHeightOffset: number,
			renderWeaponWidth: number,
			renderWeaponWidthOffset: number,
			settingsCrosshair: boolean = VideoMainEngine.settings.crosshair,
			settingsDebug: boolean = VideoMainEngine.settings.debug,
			settingsDifficulty: GameDifficulty = VideoMainEngine.settings.difficulty,
			settingsFOV: number = VideoMainEngine.settings.fov,
			settingsFPMS: number = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0,
			settingsPlayer2Enable: boolean = VideoMainEngine.settings.player2Enable,
			settingsRaycastQuality: RaycastQuality = VideoMainEngine.settings.raycastQuality,
			statAll: GamingCanvasStat = VideoMainEngine.stats[VideoMainBusStats.ALL],
			statAllRaw: Float32Array,
			statNPCCV: GamingCanvasStat = VideoMainEngine.stats[VideoMainBusStats.NPC_C_V],
			statNPCCVRaw: Float32Array,
			statRay: GamingCanvasStat = VideoMainEngine.stats[VideoMainBusStats.RAY],
			statRayRaw: Float32Array,
			statRayCV: GamingCanvasStat = VideoMainEngine.stats[VideoMainBusStats.RAY_C_V],
			statRayCVRaw: Float32Array,
			statSprite: GamingCanvasStat = VideoMainEngine.stats[VideoMainBusStats.SPRITE],
			statSpriteRaw: Float32Array,
			timers: GamingCanvasUtilTimers = VideoMainEngine.timers,
			tagRunAndJump: boolean,
			tagRunAndJumpOptions: any,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			timestampUnix: number,
			timestampUnixEff: number,
			timestampUnixPause: number,
			timestampUnixPauseDelta: number = 0,
			x: number,
			y: number;

		renderGradientCanvasContext = renderGradientCanvas.getContext('2d', {
			alpha: false,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		const actionDie = (character: CharacterNPC) => {
			let state: number = 1;
			timers.add(() => {
				// DIE2
				character.assetId = assetIdImgCharacterDie[state++];

				timers.add(() => {
					// DIE3
					character.assetId = assetIdImgCharacterDie[state++];

					timers.add(() => {
						// DIE4
						character.assetId = assetIdImgCharacterDie[state++];

						timers.add(() => {
							// CORPSE
							character.assetId = assetIdImgCharacterDie[state];
						}, CalcMainBusDieFrameDurationInMS);
					}, CalcMainBusDieFrameDurationInMS);
				}, CalcMainBusDieFrameDurationInMS);
			}, CalcMainBusDieFrameDurationInMS);
		};

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(go);

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta !== 0) {
				timestampUnix = Date.now();
				if (VideoMainEngine.pause !== pause) {
					pause = VideoMainEngine.pause;

					timestampUnixPause = Date.now();
					timestampUnixPauseDelta = timestampUnixPause - VideoMainEngine.pauseTimestampUnix;

					if (pause !== true) {
						timers.clockUpdate(timestampNow);

						for (actionDoorState of actionDoors.values()) {
							actionDoorState.timestampUnix += timestampUnixPauseDelta;
						}

						for (actionWallState of actionWall.values()) {
							actionWallState.timestampUnix += timestampUnixPauseDelta;
						}
					}

					VideoMainEngine.pauseTimestampUnix = timestampUnixPause;
				}
				if (pause === true) {
					timestampUnixEff = timestampUnixPause;
				} else {
					timestampUnixEff = timestampUnix;
					timers.tick(timestampNow);
				}
			}

			// Main code
			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				if (settingsFPMS === 0) {
					timestampThen = timestampNow - timestampDelta;
				} else {
					timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				}
				countFrame++;

				/*
				 * Modifiers
				 */
				if (VideoMainEngine.calculationsNew === true) {
					VideoMainEngine.calculationsNew = false;

					calculationsCamera.decode(VideoMainEngine.calculations.camera);
					calculationsCameraGridIndex = (calculationsCamera.x | 0) * gameMapGridSideLength + (calculationsCamera.y | 0);
					calculationsRays = VideoMainEngine.calculations.rays;
					calculationsRaysMap = VideoMainEngine.calculations.raysMap;
					calculationsRaysMapKeysSorted = VideoMainEngine.calculations.raysMapKeysSorted;

					if (VideoMainEngine.calculations.cameraAlt !== undefined) {
						calculationsCameraAlt.decode(VideoMainEngine.calculations.cameraAlt);
						calculationsCameraAltGridIndex =
							(calculationsCameraAlt.x | 0) * VideoMainEngine.gameMap.grid.sideLength + (calculationsCameraAlt.y | 0);

						renderAltStand = false;
						timers.clear(renderAltStandTimerId);
						timers.add(
							() => {
								renderAltStand = true;
							},
							250,
							renderAltStandTimerId,
						);
					}

					renderModeEdit = VideoMainEngine.calculations.edit;
				}

				if (VideoMainEngine.dead !== renderDead) {
					renderDead = VideoMainEngine.dead;

					if (renderDead === true) {
						renderDeadTimerId = VideoMainEngine.deadTimerId;
					} else {
						renderTilt = 1;
					}
				}

				if (VideoMainEngine.gameMapNew === true) {
					VideoMainEngine.gameMapNew = false;
					VideoMainEngine.reportNew = true; // force gradient re-render

					actionDoors.clear();
					actionWall.clear();
					timers.clearAll();

					gameMapColorCeiling = VideoMainEngine.gameMap.colorCeiling || 0;
					gameMapColorFloor = VideoMainEngine.gameMap.colorFloor || 0;

					gameMapGridData = <Uint32Array>VideoMainEngine.gameMap.grid.data;
					gameMapGridSideLength = VideoMainEngine.gameMap.grid.sideLength;
					gameMapNPCById = VideoMainEngine.gameMap.npcById;

					gameMapNPCDead.clear();
					gameMapNPCByGridIndex.clear();
					gameMapNPCShootAt.clear();
					for (characterNPC of gameMapNPCById.values()) {
						gameMapNPCByGridIndexInstance = <any>gameMapNPCByGridIndex.get(characterNPC.gridIndex);
						if (gameMapNPCByGridIndexInstance === undefined) {
							gameMapNPCByGridIndexInstance = new Map();
							gameMapNPCByGridIndex.set(characterNPC.gridIndex, gameMapNPCByGridIndexInstance);
						}
						gameMapNPCByGridIndexInstance.set(characterNPC.id, characterNPC);
					}

					characterIdByGridIndexSorted = Array.from(gameMapNPCById.keys());
					characterIdByGridIndexSorted.push(-1); // Player1ID
					characterIdByGridIndexSorted.push(-2); // Player2ID
					characterIdByGridIndexSorted = characterIdByGridIndexSorted.sort();

					VideoMainEngine.tagRunAndJump = false;
					tagRunAndJump = false;
				}

				if (VideoMainEngine.gameMapUpdateNew === true) {
					VideoMainEngine.gameMapUpdateNew = false;

					gameMapUpdate = VideoMainEngine.gameMapUpdate;
					for (i = 0; i < gameMapUpdate.length; i += 2) {
						gameMapGridData[gameMapUpdate[i]] = gameMapUpdate[i + 1];
					}
				}

				if (VideoMainEngine.npcUpdateNew === true) {
					VideoMainEngine.npcUpdateNew = false;

					for (characterNPCUpdateEncoded of VideoMainEngine.npcUpdate) {
						// Reference
						characterNPCId = CharacterNPCUpdateDecodeId(characterNPCUpdateEncoded);
						characterNPC = <CharacterNPC>gameMapNPCById.get(characterNPCId);

						if (characterNPC === undefined) {
							continue;
						}
						gameMapGridIndex = characterNPC.gridIndex;

						// Prepare
						gameMapNPCByGridIndexInstance = <any>gameMapNPCByGridIndex.get(gameMapGridIndex);
						if (gameMapNPCByGridIndexInstance !== undefined) {
							gameMapNPCByGridIndexInstance.delete(gameMapGridIndex);
							if (gameMapNPCByGridIndexInstance.size === 0) {
								gameMapNPCByGridIndex.delete(gameMapGridIndex);
							}
						}

						// Update
						x = characterNPC.assetId;
						gameMapNPCShootAt.set(characterNPCId, CharacterNPCUpdateDecodeAndApply(characterNPCUpdateEncoded, characterNPC, timestampUnix));

						if (x >= AssetIdImgCharacter.DIE1 && x <= AssetIdImgCharacter.DIE4) {
							characterNPC.assetId = x;
						} else if (characterNPC.assetId === AssetIdImgCharacter.DIE1 && gameMapNPCDead.has(characterNPC.id) !== true) {
							gameMapNPCDead.add(characterNPC.id);
							actionDie(characterNPC);

							// Spawn drop
							if (characterNPC.type === AssetIdImgCharacterType.BOSS_HANS_GROSSE) {
								renderAssetId = AssetIdImg.SPRITE_KEY1;
							} else {
								renderAssetId = AssetIdImg.SPRITE_AMMO_DROPPED;
							}

							if (characterNPC.type !== AssetIdImgCharacterType.RAT) {
								if (gameMapGridData[gameMapGridIndex] === GameGridCellMasksAndValues.FLOOR && renderAssetId !== AssetIdImg.SPRITE_KEY1) {
									gameMapGridData[gameMapGridIndex] |= renderAssetId;
								} else if (gameMapGridData[gameMapGridIndex + 1] === GameGridCellMasksAndValues.FLOOR) {
									gameMapGridData[gameMapGridIndex + 1] |= renderAssetId;
								} else if (gameMapGridData[gameMapGridIndex - 1] === GameGridCellMasksAndValues.FLOOR) {
									gameMapGridData[gameMapGridIndex - 1] |= renderAssetId;
								} else if (gameMapGridData[gameMapGridIndex + gameMapGridSideLength] === GameGridCellMasksAndValues.FLOOR) {
									gameMapGridData[gameMapGridIndex + gameMapGridSideLength] |= renderAssetId;
								} else if (gameMapGridData[gameMapGridIndex - gameMapGridSideLength] === GameGridCellMasksAndValues.FLOOR) {
									gameMapGridData[gameMapGridIndex - gameMapGridSideLength] |= renderAssetId;
								}
							}
						}

						// Apply
						gameMapNPCByGridIndexInstance = <any>gameMapNPCByGridIndex.get(characterNPC.gridIndex);
						if (gameMapNPCByGridIndexInstance === undefined) {
							gameMapNPCByGridIndexInstance = new Map();
							gameMapNPCByGridIndex.set(characterNPC.gridIndex, gameMapNPCByGridIndexInstance);
						}
						gameMapNPCByGridIndexInstance.set(characterNPC.gridIndex, characterNPC);
					}
				}

				if (VideoMainEngine.reportNew === true || VideoMainEngine.settingsNew === true) {
					// Settings
					settingsCrosshair = VideoMainEngine.settings.crosshair;
					settingsDebug = VideoMainEngine.settings.debug;
					settingsDifficulty = VideoMainEngine.settings.difficulty;
					settingsFOV = VideoMainEngine.settings.fov;
					settingsFPMS = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0;
					renderGamma = VideoMainEngine.settings.gamma;
					renderGrayscale = VideoMainEngine.settings.grayscale;
					renderLightingQuality = VideoMainEngine.settings.lightingQuality;
					settingsPlayer2Enable = VideoMainEngine.settings.player2Enable;
					settingsRaycastQuality = VideoMainEngine.settings.raycastQuality;

					renderGammaFilter = `brightness(${renderGamma})`;

					// Render mode
					if (VideoMainEngine.settings.renderMode !== RenderMode.RAYCAST) {
						cancelAnimationFrame(VideoMainEngine.request);
						switch (VideoMainEngine.settings.renderMode) {
							case RenderMode.OPENGL:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goOpenGL);
								break;
							case RenderMode.WEBGL:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goWebGL);
								break;
						}
					}

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

					if (VideoMainEngine.settings.antialias === true) {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
					} else {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
					}

					asset = assetImages.get(AssetIdImg.WEAPON_KNIFE_1) || renderDebugImage;

					if (VideoMainEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
						if (settingsPlayer2Enable === true) {
							renderWeaponFactor = offscreenCanvasWidthPx / asset.width;
						} else {
							renderWeaponFactor = (offscreenCanvasWidthPx * 0.625) / asset.width;
						}
					} else {
						if (settingsPlayer2Enable === true) {
							renderWeaponFactor = offscreenCanvasWidthPx / asset.width;
						} else {
							renderWeaponFactor = (offscreenCanvasWidthPx * 1.75) / asset.width;
						}
					}

					renderWeaponHeight = asset.height * renderWeaponFactor;
					renderWeaponWidth = asset.width * renderWeaponFactor;
					renderWeaponHeightOffset = offscreenCanvasHeightPx - renderWeaponHeight;
					renderWeaponWidthOffset = (offscreenCanvasWidthPx - renderWeaponWidth) / 2 - offscreenCanvasWidthPx / 200; // + for magic centering offset
				}

				// Background cache
				if (VideoMainEngine.reportNew === true || VideoMainEngine.settingsNew) {
					VideoMainEngine.reportNew = false;
					VideoMainEngine.settingsNew = false;

					renderGradientCanvas.height = offscreenCanvasHeightPx;
					renderGradientCanvas.width = offscreenCanvasWidthPx;

					if (renderLightingQuality >= LightingQuality.FULL) {
						renderGradientCanvasGradient = offscreenCanvasContext.createLinearGradient(0, 0, 0, offscreenCanvasHeightPx); // Ceiling

						if (VideoMainEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
							renderDistance1 = 0.5;
							renderDistance2 = 0.4;
						} else {
							renderDistance1 = 0.8;
							renderDistance2 = 0.7;
						}

						// Ceiling
						color = gameMapColorCeiling.toString(16).padStart(6, '0');
						renderGradientCanvasGradient.addColorStop(0, '#' + color);
						i = (Number(color.substring(0, 2)) * renderDistance1) | 0;
						x = (Number(color.substring(2, 4)) * renderDistance1) | 0;
						y = (Number(color.substring(4, 6)) * renderDistance1) | 0;
						renderGradientCanvasGradient.addColorStop(
							0.5,
							'#' + i.toString(16).padStart(2, '0') + x.toString(16).padStart(2, '0') + y.toString(16).padStart(2, '0'),
						);

						// Floor
						color = gameMapColorFloor.toString(16).padStart(6, '0');
						i = (Number(color.substring(0, 2)) * renderDistance2) | 0;
						x = (Number(color.substring(2, 4)) * renderDistance2) | 0;
						y = (Number(color.substring(4, 6)) * renderDistance2) | 0;
						renderGradientCanvasGradient.addColorStop(
							0.5,
							'#' + i.toString(16).padStart(2, '0') + x.toString(16).padStart(2, '0') + y.toString(16).padStart(2, '0'),
						);
						renderGradientCanvasGradient.addColorStop(1, '#' + color);

						renderGradientCanvasContext.fillStyle = renderGradientCanvasGradient;
						renderGradientCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
					}
				}

				if (tagRunAndJump !== VideoMainEngine.tagRunAndJump) {
					tagRunAndJump = VideoMainEngine.tagRunAndJump;
					tagRunAndJumpOptions = VideoMainEngine.tagRunAndJumpOptions;
				}

				if (renderWeapon !== VideoMainEngine.weapon) {
					renderWeapon = VideoMainEngine.weapon;
				}

				// Don't render a second screen if it's not even enabled
				countRays = 0;
				countSprites = 0;
				if (calculationsRays === undefined || gameMapGridData === undefined) {
					return;
				} else if (player1 !== true && tagRunAndJump === true) {
					// Run and jump animation only happens for one player
					return;
				}

				/*
				 * Render
				 */

				statAll.watchStart();

				// Render: Aspect ratios and positional offsets
				if (VideoMainEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
					renderWallHeightFactor = 1.5;

					if (settingsPlayer2Enable === true) {
						renderHeightFactor = 2;
						renderHeightOffset = offscreenCanvasWidthPxHalf / 1.7777;
					} else {
						renderHeightFactor = 1;
						renderHeightOffset = 0;
					}
				} else {
					renderHeightFactor = 2;

					if (settingsPlayer2Enable === true) {
						renderHeightOffset = offscreenCanvasWidthPxHalf / 2.2222;
						renderWallHeightFactor = 2;
					} else {
						renderHeightOffset = offscreenCanvasWidthPxHalf * 0.8888;
						renderWallHeightFactor = 1;
					}
				}

				// Render: Dead
				if (renderDead === true) {
					if (VideoMainEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
						renderTilt = 2 - <number>timers.getTimeRemaining(renderDeadTimerId) / CalcMainBusPlayerDeadFallDurationInMS;
					} else {
						renderTilt = 1.5 - 0.5 * (<number>timers.getTimeRemaining(renderDeadTimerId) / CalcMainBusPlayerDeadFallDurationInMS);
					}
				}

				// Render: Lighting
				if (renderGamma !== 1 && renderGrayscale === true) {
					renderFilter = `${renderGammaFilter} ${renderGrayscaleFilter}`;
				} else if (renderGamma === 1 && renderGrayscale === false) {
					renderFilter = renderFilterNone;
				} else if (renderGrayscale === true) {
					renderFilter = renderGrayscaleFilter;
				} else {
					renderFilter = renderGammaFilter;
				}
				offscreenCanvasContext.filter = renderFilter;

				// Render: Backgrounds
				if (renderLightingQuality === LightingQuality.FULL) {
					offscreenCanvasContext.drawImage(renderGradientCanvas, 0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx * renderTilt);
				} else {
					// Ceiling
					offscreenCanvasContext.fillStyle = '#' + gameMapColorCeiling.toString(16).padStart(6, '0');
					offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPxHalf * renderTilt);

					// Floor
					offscreenCanvasContext.fillStyle = '#' + gameMapColorFloor.toString(16).padStart(6, '0');
					offscreenCanvasContext.fillRect(0, offscreenCanvasHeightPxHalf * renderTilt, offscreenCanvasWidthPx, offscreenCanvasHeightPxHalf);
				}
				// offscreenCanvasContext.fillStyle = 'black';
				// offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

				// Debug: Weapon hit area
				if (renderModeEdit !== true && settingsDebug === true && tagRunAndJump !== true && VideoMainEngine.dead === false) {
					x = (offscreenCanvasWidthPx * <number>CalcMainBusFOVByDifficulty.get(settingsDifficulty)) / settingsFOV / 2;
					offscreenCanvasContext.fillStyle = 'rgba(255,247,0,0.25)';
					offscreenCanvasContext.strokeStyle = 'rgba(255,247,0,0.75)';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.moveTo(offscreenCanvasWidthPxHalf - x, offscreenCanvasHeightPxHalf);
					offscreenCanvasContext.lineTo(offscreenCanvasWidthPxHalf, offscreenCanvasHeightPx);
					offscreenCanvasContext.lineTo(offscreenCanvasWidthPxHalf + x, offscreenCanvasHeightPxHalf);
					offscreenCanvasContext.stroke();
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.fill();
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.moveTo(offscreenCanvasWidthPxHalf, offscreenCanvasHeightPx);
					offscreenCanvasContext.lineTo(offscreenCanvasWidthPxHalf, offscreenCanvasHeightPxHalf);
					offscreenCanvasContext.stroke();
				}

				// Iterate: By Distance
				for (i of calculationsRaysMapKeysSorted) {
					renderRayDistanceMapInstance = <GamingCanvasGridRaycastResultDistanceMapInstance>calculationsRaysMap.get(i);

					/**
					 * Draw: Ray
					 */
					if (renderRayDistanceMapInstance.rayIndex !== undefined) {
						statRay.watchStart();
						countRays++;
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
						if ((gameMapGridCell2 & GameGridCellMasksAndValues.DOOR) !== 0) {
							asset = renderAssets.get(AssetIdImg.SPRITE_METAL_DOOR_INSIDE) || renderDebugImage;
						} else {
							gameMapGridCell = gameMapGridData[gameMapGridIndex];
							renderAssetId = gameMapGridCell & GameGridCellMasksAndValues.ID_MASK;
							asset = renderAssets.get(renderAssetId) || renderDebugImage;
						}
						// asset = renderDebugImage;

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
							((offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset) * renderTilt, // (y-destination) how far off the ground to start drawing
							settingsRaycastQuality + 1, // (width-destination) Draw the sliced image as 1 pixel wide (+1 covers gaps between rays)
							renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
						);
						statRay.watchStop();
					}

					/**
					 * Draw: Sprites
					 */
					if (renderRayDistanceMapInstance.gridIndex !== undefined) {
						countSprites++;
						statSprite.watchStart();
						gameMapGridIndex = renderRayDistanceMapInstance.gridIndex;
						gameMapGridCell = gameMapGridData[gameMapGridIndex];
						renderGlobalShadow = false;
						renderSkip = false;

						// Skip arrows
						renderAssetId = gameMapGridCell & GameGridCellMasksAndValues.ID_MASK;
						if (renderAssetId < 1000) {
							renderSkip = true;
						}

						// Environment
						if (
							renderSkip !== true &&
							gameMapGridCell !== GameGridCellMasksAndValues.NULL &&
							gameMapGridCell !== GameGridCellMasksAndValues.FLOOR
						) {
							/**
							 * Draw: Sprites - Fixed
							 */
							if ((gameMapGridCell & gameGridCellMaskSpriteFixed) !== 0) {
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
								if ((gameMapGridCell & GameGridCellMasksAndValues.DOOR) !== 0) {
									actionDoorState = <CalcMainBusActionDoorState>actionDoors.get(gameMapGridIndex);
									asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderDebugImage;

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
												1 - (timestampUnixEff - actionDoorState.timestampUnix) / CalcMainBusActionDoorStateChangeDurationInMS,
											);
											// console.log('DOOR CLOSING', renderSpriteFixedDoorOffset);
										} else {
											renderSpriteFixedDoorOffset = Math.min(
												1,
												(timestampUnixEff - actionDoorState.timestampUnix) / CalcMainBusActionDoorStateChangeDurationInMS,
											);
											// console.log('DOOR OPENING', renderSpriteFixedDoorOffset);
										}

										if (
											actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.NORTH ||
											actionDoorState.cellSide === GamingCanvasGridRaycastCellSide.SOUTH
										) {
											x += renderSpriteFixedDoorOffset;
										} else {
											renderGlobalShadow = true;
											y += renderSpriteFixedDoorOffset;
										}
									}
								}

								// If the door isn't wide open
								if (renderSpriteFixedDoorOffset !== 1) {
									/**
									 * Action: Wall Move
									 */
									renderSpriteFixedWallMovableOffset = 0;
									if ((gameMapGridCell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0 && actionWall.has(gameMapGridIndex) === true) {
										actionWallState = <CalcMainBusOutputDataActionWallMove>actionWall.get(gameMapGridIndex);

										if (actionWallState !== undefined) {
											renderSpriteFixedWallMovableOffset =
												2 *
												Math.min(
													1,
													(timestampUnixEff - actionWallState.timestampUnix) / CalcMainBusActionWallMoveStateChangeDurationInMS,
												);

											// Render: Modification based on cell sidedness
											switch (actionWallState.cellSide) {
												case GamingCanvasGridRaycastCellSide.EAST: // inv
													asset =
														assetImagesInvertHorizontal.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) ||
														renderDebugImage;
													x -= renderSpriteFixedWallMovableOffset - 0.5;
													renderGlobalShadow = true;
													break;
												case GamingCanvasGridRaycastCellSide.NORTH:
													asset =
														assetImagesInvertHorizontal.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) ||
														renderDebugImage;
													y += renderSpriteFixedWallMovableOffset - 0.5; // inv
													break;
												case GamingCanvasGridRaycastCellSide.SOUTH:
													asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderDebugImage;
													y -= renderSpriteFixedWallMovableOffset - 0.5; // good
													break;
												case GamingCanvasGridRaycastCellSide.WEST: // good
													asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderDebugImage;
													x += renderSpriteFixedWallMovableOffset - 0.5;
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
									renderAngle = Math.atan2(-y, x);

									// Calc: Distance
									renderDistance1 = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

									// Calc: Height
									renderSpriteFixedCoordinates[1] = (offscreenCanvasHeightPx / renderDistance1) * renderWallHeightFactor;

									// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
									renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

									// Corrections for rotations between 0 and 2pi
									if (renderSpriteXFactor > GamingCanvasConstPI_2_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
									}
									if (renderSpriteXFactor > GamingCanvasConstPI_1_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
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
											renderGlobalShadow = true;
											y -= renderSpriteFixedDoorOffset;
										}
									}

									x += renderSpriteFixedNS === true ? 0 : 1;
									y += renderSpriteFixedNS === true ? 1 : 0;

									// Calc: Angle (fisheye correction)
									renderAngle = Math.atan2(-y, x);

									// Calc: Distance
									renderDistance2 = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

									// Calc: Height
									renderSpriteFixedCoordinates[3] = (offscreenCanvasHeightPx / renderDistance2) * renderWallHeightFactor;

									// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
									renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

									// Corrections for rotations between 0 and 2pi
									if (renderSpriteXFactor > GamingCanvasConstPI_2_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
									}
									if (renderSpriteXFactor > GamingCanvasConstPI_1_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
									}

									renderSpriteFixedCoordinates[2] = (renderSpriteXFactor / settingsFOV) * offscreenCanvasWidthPx;

									/**
									 * Render: Lighting
									 */
									renderDistance = (renderDistance1 + renderDistance2) / 2;

									if ((gameMapGridCell & GameGridCellMasksAndValues.LIGHT) !== 0) {
										offscreenCanvasContext.filter = renderFilter;
									} else if (renderLightingQuality !== LightingQuality.NONE) {
										renderBrightness = 0;

										// Filter: Start
										if (renderLightingQuality === LightingQuality.FULL) {
											renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light

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
									} else {
										offscreenCanvasContext.filter = renderFilter;
									}

									/**
									 * Render images between coordinates
									 */
									// Calc: Height/Width changes between cooridnates
									x = renderSpriteFixedCoordinates[2] - renderSpriteFixedCoordinates[0];
									y = renderSpriteFixedCoordinates[3] - renderSpriteFixedCoordinates[1];

									// Calc: Width of sprite in pixels
									renderDistance = Math.min(offscreenCanvasWidthPx, ((x * x + y * y) ** 0.5) | 0);

									if (asset === undefined) {
										asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderDebugImage;
									}

									renderStep = Math.max(1, (renderDistance / asset.width) | 0);

									for (i = 1; i < renderDistance; i += renderStep) {
										renderSpriteXFactor = i / renderDistance; // Determine percentage of left to right

										// Calc: Height
										renderWallHeight = renderSpriteFixedCoordinates[1] + y * renderSpriteXFactor;

										// Render: 3D Projection
										offscreenCanvasContext.drawImage(
											asset, // (image) Draw from our test image
											renderSpriteXFactor * (1 - renderSpriteFixedDoorOffset) * asset.width, // (x-source) Specific how far from the left to draw from the test image
											0, // (y-source) Start at the bottom of the image (y pixel)
											0.025, // (width-source) Slice 1 pixel wide
											asset.height, // (height-source) height of our test image
											renderSpriteFixedCoordinates[0] + x * renderSpriteXFactor, // (x-destination) Draw sliced image at pixel
											((offscreenCanvasHeightPxHalf - renderWallHeight / 2) / renderHeightFactor + renderHeightOffset) * renderTilt, // (y-destination) how far off the ground to start drawing
											renderStep + 2, // (width-destination) Draw the sliced image as 1 pixel wide
											renderWallHeight / renderHeightFactor, // (height-destination) Draw the sliced image as tall as the wall height
										);
									}
								}
							} else {
								/**
								 * Draw: Sprites - Rotating
								 */
								asset = assetImages.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderDebugImage;

								// Calc: Position
								y = gameMapGridIndex % gameMapGridSideLength;
								x = (gameMapGridIndex - y) / gameMapGridSideLength - calculationsCamera.x + 0.5; // 0.5 is center
								y -= calculationsCamera.y - 0.5; // 0.5 is center

								// Calc: Angle (fisheye correction)
								renderAngle = Math.atan2(-y, x);

								// Calc: Distance
								renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

								// Calc: Height
								renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
								renderWallHeightFactored = renderWallHeight / renderHeightFactor;
								renderWallHeightHalf = renderWallHeight / 2;

								// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
								renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

								// Corrections for rotations between 0 and 2pi
								if (renderSpriteXFactor > GamingCanvasConstPI_2_000) {
									renderSpriteXFactor -= GamingCanvasConstPI_2_000;
								}
								if (renderSpriteXFactor > GamingCanvasConstPI_1_000) {
									renderSpriteXFactor -= GamingCanvasConstPI_2_000;
								}

								renderSpriteXFactor /= settingsFOV;

								// Render: Lighting
								if ((gameMapGridCell & GameGridCellMasksAndValues.LIGHT) !== 0) {
									offscreenCanvasContext.filter = renderGrayscale === true ? renderGrayscaleFilter : renderFilterNone;
								} else if (renderLightingQuality !== LightingQuality.NONE) {
									renderBrightness = 0;

									// Filter: Start
									if (renderLightingQuality === LightingQuality.FULL) {
										renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light
									}

									// Filter: End
									offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
								} else {
									offscreenCanvasContext.filter = renderFilter;
								}

								// Render: 3D Projection
								offscreenCanvasContext.drawImage(
									asset, // (image) Draw from our test image
									0, // (x-source) Specific how far from the left to draw from the test image
									0, // (y-source) Start at the bottom of the image (y pixel)
									asset.width, // (width-source) width of our image
									asset.height, // (height-source) height of our image
									renderSpriteXFactor * offscreenCanvasWidthPx - renderWallHeightHalf / renderHeightFactor, // (x-destination) Draw sliced image at pixel
									((offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset) * renderTilt, // (y-destination) how far off the ground to start drawing
									renderWallHeightFactored, // (width-destination) Draw the sliced image as wide as the wall height
									renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
								);
							}
						}

						/**
						 * Draw: Sprite - Human Player Alt
						 */
						if (calculationsCameraAltGridIndex === gameMapGridIndex) {
							if (tagRunAndJump === true) {
								assetImageCharacterInstance = <any>assetImageCharacters.get(AssetIdImgCharacterType.WILLIAM_BJ_BLAZKOWICZ);
							} else {
								assetImageCharacterInstance = <any>assetImageCharacters.get(AssetIdImgCharacterType.OFFICER);
							}

							// Calc: Position
							x = calculationsCameraAlt.x - calculationsCamera.x;
							y = calculationsCameraAlt.y - calculationsCamera.y;

							// Calc: Angle (fisheye correction)
							renderAngle = Math.atan2(-y, x);

							// Calc: Distance
							renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

							// Calc: Height
							renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
							renderWallHeightFactored = renderWallHeight / renderHeightFactor;
							renderWallHeightHalf = renderWallHeight / 2;

							// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
							renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

							// Corrections for rotations between 0 and 2pi
							if (renderSpriteXFactor > GamingCanvasConstPI_2_000) {
								renderSpriteXFactor -= GamingCanvasConstPI_2_000;
							}
							if (renderSpriteXFactor > GamingCanvasConstPI_1_000) {
								renderSpriteXFactor -= GamingCanvasConstPI_2_000;
							}

							renderSpriteXFactor /= settingsFOV;

							// Calc: Angle
							renderAngle = calculationsCameraAlt.r - Math.atan2(-y, x) + GamingCanvasConstPI_0_500;
							if (renderAngle < 0) {
								renderAngle += GamingCanvasConstPI_2_000;
							} else if (renderAngle >= GamingCanvasConstPI_2_000) {
								renderAngle -= GamingCanvasConstPI_2_000;
							}

							// Calc: Movement
							if (renderAltStand !== true) {
								renderCharacterNPCState = (((timestampNow % 400) / 100) | 0) + 1;
							} else {
								renderCharacterNPCState = 0;
							}

							if (tagRunAndJump === true) {
								x = timestampUnix - tagRunAndJumpOptions.timestampUnix;
								y = tagRunAndJumpOptions.durationRunInMS;

								if (x < y) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveS[renderCharacterNPCState]) || renderDebugImage;
								} else if (x < y + tagRunAndJumpOptions.durationJumpInMS * 0.1) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.JUMP1_S) || renderDebugImage;
								} else if (x < y + tagRunAndJumpOptions.durationJumpInMS * 0.2) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.JUMP2_S) || renderDebugImage;
								} else if (x < y + tagRunAndJumpOptions.durationJumpInMS * 0.3) {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.JUMP3_S) || renderDebugImage;
								} else {
									asset = assetImageCharacterInstance.get(AssetIdImgCharacter.JUMP4_S) || renderDebugImage;
								}
							} else {
								// Calc: Asset
								if (renderAngle < GamingCanvasConstPI_0_125) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveE[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_0_375) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveNE[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_0_625) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveN[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_0_875) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveNW[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_1_125) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveW[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_1_375) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveSW[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_1_625) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveS[renderCharacterNPCState]) || renderDebugImage;
								} else if (renderAngle < GamingCanvasConstPI_1_875) {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveSE[renderCharacterNPCState]) || renderDebugImage;
								} else {
									asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveE[renderCharacterNPCState]) || renderDebugImage;
								}
							}

							// Render: Lighting
							if (renderLightingQuality !== LightingQuality.NONE && (gameMapGridCell & GameGridCellMasksAndValues.LIGHT) === 0) {
								renderBrightness = 0;

								// Filter: Start
								if (renderLightingQuality === LightingQuality.FULL) {
									renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light
								}

								// Filter: End
								offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
							} else {
								offscreenCanvasContext.filter = renderFilter;
							}

							// Render: 3D Projection
							offscreenCanvasContext.drawImage(
								asset, // (image) Draw from our test image
								0, // (x-source) Specific how far from the left to draw from the test image
								0, // (y-source) Start at the bottom of the image (y pixel)
								asset.width, // (width-source) width of our image
								asset.height, // (height-source) height of our image
								renderSpriteXFactor * offscreenCanvasWidthPx - renderWallHeightHalf / renderHeightFactor, // (x-destination) Draw sliced image at pixel
								((offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset) * renderTilt, // (y-destination) how far off the ground to start drawing
								renderWallHeightFactored, // (width-destination) Draw the sliced image as wide as the wall height
								renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
							);
						}

						/**
						 * Draw: Sprites - Characters
						 */
						gameMapNPCByGridIndexInstance = <any>gameMapNPCByGridIndex.get(gameMapGridIndex);
						if (gameMapNPCByGridIndexInstance !== undefined) {
							for (renderCharacterNPC of gameMapNPCByGridIndexInstance.values()) {
								if (renderCharacterNPC.difficulty <= settingsDifficulty) {
									assetImageCharacterInstance = <any>assetImageCharacters.get(renderCharacterNPC.type);

									// Calc: Position
									x = renderCharacterNPC.camera.x - calculationsCamera.x;
									y = renderCharacterNPC.camera.y - calculationsCamera.y;

									// Calc: Angle (fisheye correction)
									renderAngle = Math.atan2(-y, x);

									// Calc: Distance
									renderDistance = (x * x + y * y) ** 0.5 * Math.cos(calculationsCamera.r - renderAngle);

									// Calc: Height
									renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
									renderWallHeightFactored = renderWallHeight / renderHeightFactor;
									renderWallHeightHalf = renderWallHeight / 2;

									// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
									renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - renderAngle;

									// Corrections for rotations between 0 and 2pi
									if (renderSpriteXFactor > GamingCanvasConstPI_2_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
									}
									if (renderSpriteXFactor > GamingCanvasConstPI_1_000) {
										renderSpriteXFactor -= GamingCanvasConstPI_2_000;
									}

									renderSpriteXFactor /= settingsFOV;

									// Calc: Asset by rotation
									if (renderCharacterNPC.type !== AssetIdImgCharacterType.BOSS_HANS_GROSSE) {
										if (renderCharacterNPC.assetId === AssetIdImgCharacter.AIM || renderCharacterNPC.assetId === AssetIdImgCharacter.FIRE) {
											x = player1 === true ? -1 : -2;

											// Replace AIM asset with something that points in the right direction when not looking at player
											if (gameMapNPCShootAt.get(renderCharacterNPC.id) !== x) {
												// Calc: Angle
												renderAngle = renderCharacterNPC.camera.r - Math.atan2(-y, x) + GamingCanvasConstPI_0_500;
												if (renderAngle < 0) {
													renderAngle += GamingCanvasConstPI_2_000;
												} else if (renderAngle >= GamingCanvasConstPI_2_000) {
													renderAngle -= GamingCanvasConstPI_2_000;
												}

												// Calc: Asset
												if (renderAngle < GamingCanvasConstPI_0_125) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveE[0];
												} else if (renderAngle < GamingCanvasConstPI_0_375) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveNE[0];
												} else if (renderAngle < GamingCanvasConstPI_0_625) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveN[0];
												} else if (renderAngle < GamingCanvasConstPI_0_875) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveNW[0];
												} else if (renderAngle < GamingCanvasConstPI_1_125) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveW[0];
												} else if (renderAngle < GamingCanvasConstPI_1_375) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveSW[0];
												} else if (renderAngle < GamingCanvasConstPI_1_625) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveS[0];
												} else if (renderAngle < GamingCanvasConstPI_1_875) {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveSE[0];
												} else {
													renderCharacterNPC.assetId = assetIdImgCharacterMoveE[0];
												}

												// Update instance to standing
												renderCharacterNPC.running = false;
												renderCharacterNPC.walking = false;
											}
										}
									}

									if (renderCharacterNPC.assetId < AssetIdImgCharacter.MOVE1_E) {
										if (renderCharacterNPC.type === AssetIdImgCharacterType.BOSS_HANS_GROSSE) {
											if (renderCharacterNPC.assetId === AssetIdImgCharacter.FIRE) {
												if (((timestampUnix / 100) | 0) % 2 === 0) {
													asset = assetImageCharacterInstance.get(AssetIdImgCharacter.FIRE) || renderDebugImage;
												} else {
													asset = assetImageCharacterInstance.get(AssetIdImgCharacter.FIRE2) || renderDebugImage;
												}
											} else {
												asset = assetImageCharacterInstance.get(renderCharacterNPC.assetId) || renderDebugImage;
											}
										} else {
											asset = assetImageCharacterInstance.get(renderCharacterNPC.assetId) || renderDebugImage;
										}
									} else {
										// Is boss?
										if (renderCharacterNPC.type === AssetIdImgCharacterType.BOSS_HANS_GROSSE) {
											// Calc: Angle (always facing camera)
											if (renderCharacterNPC.running === true || renderCharacterNPC.walking === true) {
												renderCharacterNPCState = ((((timestampUnix - renderCharacterNPC.timestampUnixState) % 400) / 100) | 0) + 1;
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveS[renderCharacterNPCState]) || renderDebugImage;
											} else {
												asset = assetImageCharacterInstance.get(AssetIdImgCharacter.STAND_S) || renderDebugImage;
											}
										} else {
											// Calc: Angle
											renderAngle = renderCharacterNPC.camera.r - Math.atan2(-y, x) + GamingCanvasConstPI_0_500;
											if (renderAngle < 0) {
												renderAngle += GamingCanvasConstPI_2_000;
											} else if (renderAngle >= GamingCanvasConstPI_2_000) {
												renderAngle -= GamingCanvasConstPI_2_000;
											}

											// Calc: Movement
											if (renderCharacterNPC.running === true || renderCharacterNPC.type === AssetIdImgCharacterType.RAT) {
												renderCharacterNPCState = ((((timestampUnix - renderCharacterNPC.timestampUnixState) % 400) / 100) | 0) + 1;
											} else if (renderCharacterNPC.walking === true) {
												renderCharacterNPCState = ((((timestampUnix - renderCharacterNPC.timestampUnixState) % 1600) / 400) | 0) + 1;
											} else {
												renderCharacterNPCState = 0;
											}

											// Calc: Asset
											if (renderAngle < GamingCanvasConstPI_0_125) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveE[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_0_375) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveNE[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_0_625) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveN[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_0_875) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveNW[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_1_125) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveW[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_1_375) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveSW[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_1_625) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveS[renderCharacterNPCState]) || renderDebugImage;
											} else if (renderAngle < GamingCanvasConstPI_1_875) {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveSE[renderCharacterNPCState]) || renderDebugImage;
											} else {
												asset = assetImageCharacterInstance.get(assetIdImgCharacterMoveE[renderCharacterNPCState]) || renderDebugImage;
											}
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
											renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light
										}

										// Filter: End
										offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
									} else {
										offscreenCanvasContext.filter = renderFilter;
									}

									// Render: 3D Projection
									offscreenCanvasContext.drawImage(
										asset, // (image) Draw from our test image
										0, // (x-source) Specific how far from the left to draw from the test image
										0, // (y-source) Start at the bottom of the image (y pixel)
										asset.width, // (width-source) width of our image
										asset.height, // (height-source) height of our image
										renderSpriteXFactor * offscreenCanvasWidthPx - renderWallHeightHalf / renderHeightFactor, // (x-destination) Draw sliced image at pixel
										((offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset) * renderTilt, // (y-destination) how far off the ground to start drawing
										renderWallHeightFactored, // (width-destination) Draw the sliced image as wide as the wall height
										renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
									);
								}
							}
						}
						statSprite.watchStop();
					}
				}

				// Weapon
				if (renderModeEdit !== true && tagRunAndJump !== true) {
					if (settingsCrosshair === true) {
						// Crosshair
						offscreenCanvasContext.fillStyle = 'rgba(255,247,0,0.75)';
						offscreenCanvasContext.fillRect(offscreenCanvasWidthPxHalf - 1, offscreenCanvasHeightPxHalf - 3, 2, 2); // Bottom-Middle
						offscreenCanvasContext.fillRect(offscreenCanvasWidthPxHalf - 3, offscreenCanvasHeightPxHalf - 1, 2, 2); // Middle-Left
						offscreenCanvasContext.fillRect(offscreenCanvasWidthPxHalf + 1, offscreenCanvasHeightPxHalf - 1, 2, 2); // Middle-Right
						offscreenCanvasContext.fillRect(offscreenCanvasWidthPxHalf - 1, offscreenCanvasHeightPxHalf + 1, 2, 2); // Top-Middle
					}

					renderWeaponFire = false;
					switch (renderWeapon) {
						case CharacterWeapon.KNIFE:
							asset = assetImages.get(AssetIdImgWeaponSequenceKnife[VideoMainEngine.weaponFrame]) || renderDebugImage;
							break;
						case CharacterWeapon.MACHINE_GUN:
							asset = assetImages.get(AssetIdImgWeaponSequenceMachineGun[VideoMainEngine.weaponFrame]) || renderDebugImage;

							if (VideoMainEngine.weaponFrame === 2 || VideoMainEngine.weaponFrame === 3) {
								renderWeaponFire = true;
							}
							break;
						case CharacterWeapon.PISTOL:
							asset = assetImages.get(AssetIdImgWeaponSequencePistol[VideoMainEngine.weaponFrame]) || renderDebugImage;
							if (VideoMainEngine.weaponFrame === 2) {
								renderWeaponFire = true;
							}
							break;
						case CharacterWeapon.SUB_MACHINE_GUN:
							asset = assetImages.get(AssetIdImgWeaponSequenceSubMachineGun[VideoMainEngine.weaponFrame]) || renderDebugImage;
							if (VideoMainEngine.weaponFrame === 2) {
								renderWeaponFire = true;
							}
							break;
					}

					// Render: Lighting
					if (renderLightingQuality !== LightingQuality.NONE) {
						renderBrightness = 0;

						if (renderWeaponFire === true) {
							renderBrightness = 0.1;
						} else if ((gameMapGridData[calculationsCameraGridIndex] & GameGridCellMasksAndValues.LIGHT) !== 0) {
							renderBrightness = 0;
						} else {
							renderBrightness = -0.1;
						}

						// Filter: End
						offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
					} else {
						offscreenCanvasContext.filter = renderFilter;
					}

					offscreenCanvasContext.drawImage(
						asset,
						renderWeaponWidthOffset,
						renderWeaponHeightOffset,
						renderWeaponWidth,
						renderWeaponHeight * renderTilt,
					);
				}

				statAll.watchStop();
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				statAllRaw = <Float32Array>statAll.encode();
				statNPCCVRaw = <Float32Array>statNPCCV.encode();
				statRayCVRaw = <Float32Array>statRayCV.encode();
				statRayRaw = <Float32Array>statRay.encode();
				statSpriteRaw = <Float32Array>statSprite.encode();

				// Output
				VideoMainEngine.post(
					[
						{
							cmd: VideoMainBusOutputCmd.STATS,
							data: {
								all: statAllRaw,
								countRays: countRays,
								countSprites: countSprites,
								fps: countFrame,
								npc_c_v: statNPCCVRaw,
								ray: statRayRaw,
								ray_c_v: statRayCVRaw,
								sprite: statSpriteRaw,
							},
						},
					],
					[statAllRaw.buffer, statRayCVRaw.buffer, statRayRaw.buffer, statSpriteRaw.buffer],
				);
				countFrame = 0;
			}
		};
		VideoMainEngine.goRaycast = go;
	}

	public static goWebGL(_timestampNow: number): void {}
	public static goWebGL__funcForward(): void {
		let countFrame: number = 0,
			settingsFPMS: number = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0,
			timestampDelta: number,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(go);

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				if (settingsFPMS === 0) {
					timestampThen = timestampNow - timestampDelta;
				} else {
					timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				}
				countFrame++;

				if (VideoMainEngine.settingsNew === true) {
					VideoMainEngine.settingsNew = false;

					settingsFPMS = VideoMainEngine.settings.fps !== 0 ? 1000 / VideoMainEngine.settings.fps : 0;

					if (VideoMainEngine.settings.renderMode !== RenderMode.WEBGL) {
						cancelAnimationFrame(VideoMainEngine.request);
						switch (VideoMainEngine.settings.renderMode) {
							case RenderMode.OPENGL:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goOpenGL);
								break;
							case RenderMode.RAYCAST:
								VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goRaycast);
								break;
							// case RenderMode.WEBGL:
							// 	VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.goWebGL);
							// 	break;
						}
					}
				}
			}
		};
		VideoMainEngine.goWebGL = go;
	}
}
