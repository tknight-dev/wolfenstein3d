import { GamingCanvas, GamingCanvasConstPIDouble, GamingCanvasReport, GamingCanvasRenderStyle } from '@tknight-dev/gaming-canvas';
import { GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../../models/game.model.js';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCalculations,
	VideoEditorBusInputDataInit,
	VideoEditorBusInputDataSettings,
	VideoEditorBusInputPayload,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputPayload,
} from './video-editor.model.js';
import { Character, CharacterNPC, CharacterWeapon } from '../../models/character.model.js';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridICamera,
	GamingCanvasGridRaycastTestImageCreate,
	GamingCanvasGridUint16Array,
	GamingCanvasGridViewport,
} from '@tknight-dev/gaming-canvas/grid';
import {
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	assetLoaderImage,
	assetLoaderImageCharacter,
	AssetPropertiesImage,
	assetsImageCharacters,
	assetsImages,
	initializeAssetManager,
} from '../../asset-manager.js';
import { Assets } from '../../modules/assets.js';
import { CalcBusOutputDataNPCUpdate } from '../calc/calc.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoEditorBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoEditorBusInputCmd.CALCULATIONS:
			VideoEditorEngine.inputCalculations(<VideoEditorBusInputDataCalculations>payload.data);
			break;
		case VideoEditorBusInputCmd.ENABLE:
			VideoEditorEngine.inputEnable(<boolean>payload.data);
			break;
		case VideoEditorBusInputCmd.INIT:
			VideoEditorEngine.initialize(<VideoEditorBusInputDataInit>payload.data);
			break;
		case VideoEditorBusInputCmd.MAP:
			VideoEditorEngine.inputMap(<GameMap>payload.data);
			break;
		case VideoEditorBusInputCmd.NPC_UPDATE:
			VideoEditorEngine.inputNPCUpdate(<CalcBusOutputDataNPCUpdate>payload.data);
			break;
		case VideoEditorBusInputCmd.REPORT:
			VideoEditorEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoEditorBusInputCmd.SETTINGS:
			VideoEditorEngine.inputSettings(<VideoEditorBusInputDataSettings>payload.data);
			break;
	}
};

class VideoEditorEngine {
	private static assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = new Map();
	private static assetImages: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static calculations: VideoEditorBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static characterPlayer1Camera: GamingCanvasGridCamera;
	private static characterPlayer2Camera: GamingCanvasGridCamera;
	private static enable: boolean = false;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static npcUpdate: CalcBusOutputDataNPCUpdate;
	private static npcUpdateNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoEditorBusInputDataSettings;
	private static settingsNew: boolean;

	public static async initialize(data: VideoEditorBusInputDataInit): Promise<void> {
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
			VideoEditorEngine.assetImages.set(assetId, assetCanvas);
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

				if (VideoEditorEngine.assetImageCharacters.has(assetCharacterType) !== true) {
					VideoEditorEngine.assetImageCharacters.set(assetCharacterType, new Map());
				}
				(<any>VideoEditorEngine.assetImageCharacters.get(assetCharacterType)).set(assetCharacter, assetCanvas);
			}
		}

		// Config
		VideoEditorEngine.inputMap(data.gameMap);

		// Config: Canvas
		VideoEditorEngine.offscreenCanvas = data.offscreenCanvas;
		VideoEditorEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Camera and Viewport
		VideoEditorEngine.inputCalculations(data);

		// Config: Character
		VideoEditorEngine.characterPlayer1Camera = new GamingCanvasGridCamera(
			data.gameMap.position.r,
			data.gameMap.position.x + 0.5,
			data.gameMap.position.y + 0.5,
			1,
		);
		VideoEditorEngine.characterPlayer2Camera = new GamingCanvasGridCamera(
			data.gameMap.position.r,
			data.gameMap.position.x + 0.5,
			data.gameMap.position.y + 0.5,
			1,
		);

		// Config: Report
		VideoEditorEngine.inputReport(data.report);

		// Config: Settings
		VideoEditorEngine.inputSettings(data as VideoEditorBusInputDataSettings);

		// Start
		if (VideoEditorEngine.offscreenCanvasContext === null) {
			console.error('VideoEditorEngine: failed acquire context');
			VideoEditorEngine.post([
				{
					cmd: VideoEditorBusOutputCmd.INIT_COMPLETE,
					data: false,
				},
			]);
		} else {
			VideoEditorEngine.post([
				{
					cmd: VideoEditorBusOutputCmd.INIT_COMPLETE,
					data: true,
				},
			]);

			// Start rendering thread
			VideoEditorEngine.go__funcForward();
			VideoEditorEngine.request = requestAnimationFrame(VideoEditorEngine.go);
		}
	}

	/*
	 * Input
	 */

	public static inputCalculations(data: VideoEditorBusInputDataCalculations): void {
		VideoEditorEngine.calculations = data;

		// Last
		VideoEditorEngine.calculationsNew = true;
	}

	public static inputEnable(enable: boolean): void {
		VideoEditorEngine.enable = enable;
	}

	public static inputMap(data: GameMap): void {
		VideoEditorEngine.gameMap = Assets.parseMap(data);
		VideoEditorEngine.gameMapNew = true;
	}

	public static inputNPCUpdate(data: CalcBusOutputDataNPCUpdate): void {
		VideoEditorEngine.npcUpdate = data;
		VideoEditorEngine.npcUpdateNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoEditorEngine.report = report;

		// Last
		VideoEditorEngine.reportNew = true;
	}

	public static inputSettings(data: VideoEditorBusInputDataSettings): void {
		VideoEditorEngine.settings = data;

		// Last
		VideoEditorEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: VideoEditorBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let assetId: AssetIdImg,
			assetChracter: AssetIdImgCharacter,
			assetChracterType: AssetIdImgCharacterType,
			assetImageCharacterInstance: Map<AssetIdImgCharacter, OffscreenCanvas>,
			assetImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = VideoEditorEngine.assetImageCharacters,
			assetImages: Map<AssetIdImg, OffscreenCanvas> = VideoEditorEngine.assetImages,
			assetInstance: OffscreenCanvas,
			calculationsCamera: GamingCanvasGridCamera = GamingCanvasGridCamera.from(VideoEditorEngine.calculations.camera),
			calculationsGameMode: boolean,
			calculationsViewport: GamingCanvasGridViewport = GamingCanvasGridViewport.from(VideoEditorEngine.calculations.viewport),
			calculationsViewportCellSizePx: number,
			calculationsViewportCellSizePxEff: number,
			calculationsViewportHeightStart: number,
			calculationsViewportHeightStartEff: number,
			calculationsViewportHeightStartPx: number,
			calculationsViewportHeightStopEff: number,
			calculationsViewportWidthStart: number,
			calculationsViewportWidthStartEff: number,
			calculationsViewportWidthStartPx: number,
			calculationsViewportWidthStopEff: number,
			cacheCanvasImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvas>> = new Map(),
			cacheCanvasImages: Map<AssetIdImg, OffscreenCanvas> = new Map(),
			cacheCanvasContextOptionsAlpha = {
				alpha: true,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
				preserveDrawingBuffer: false,
			},
			cacheCanvasContextOptionsNoAlpha = {
				...cacheCanvasContextOptionsAlpha,
				alpha: false,
			},
			cacheCanvasGrid: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>cacheCanvasGrid.getContext('2d', {
				...cacheCanvasContextOptionsNoAlpha,
				alpha: true,
			}),
			cacheCanvasGridH: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridHContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>(
				cacheCanvasGridH.getContext('2d', cacheCanvasContextOptionsNoAlpha)
			),
			cacheCanvasGridV: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridVContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>(
				cacheCanvasGridV.getContext('2d', cacheCanvasContextOptionsNoAlpha)
			),
			cacheCanvasImageCharactersContext: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, OffscreenCanvasRenderingContext2D>> = new Map(),
			cacheCanvasImageCharactersContextInstance: Map<AssetIdImgCharacter, OffscreenCanvasRenderingContext2D> = new Map(),
			cacheCanvasImagesContext: Map<AssetIdImg, OffscreenCanvasRenderingContext2D> = new Map(),
			cacheCanvasContextInstance: OffscreenCanvasRenderingContext2D,
			cacheCellSizePx: number = -1,
			camera: GamingCanvasGridCamera,
			characterNPC: CharacterNPC | undefined,
			characterNPCGridIndex: number,
			characterPlayer1: GamingCanvasGridCamera = VideoEditorEngine.characterPlayer1Camera,
			characterPlayer1XEff: number,
			characterPlayer1YEff: number,
			characterPlayer2: GamingCanvasGridCamera = VideoEditorEngine.characterPlayer2Camera,
			characterPlayer2XEff: number,
			characterPlayer2YEff: number,
			gameMapGridData: Uint16Array = VideoEditorEngine.gameMap.grid.data,
			gameMapGridSideLength: number = VideoEditorEngine.gameMap.grid.sideLength,
			gameMapNPCs: Map<number, CharacterNPC> = VideoEditorEngine.gameMap.npc,
			gameMapNPCsById: Map<number, CharacterNPC> = new Map(),
			i: number,
			offscreenCanvas: OffscreenCanvas = VideoEditorEngine.offscreenCanvas,
			offscreenCanvasInstance: OffscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoEditorEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = 0,
			offscreenCanvasHeightPxEff: number = 0,
			offscreenCanvasWidthPx: number = 0,
			offscreenCanvasWidthPxEff: number = 0,
			frameCount: number = 0,
			renderCellOutlineOffset: number,
			renderCellOutlineWidth: number,
			report: GamingCanvasReport = VideoEditorEngine.report,
			settingsGridDraw: boolean = VideoEditorEngine.settings.gridDraw,
			settingsFPMS: number = 1000 / VideoEditorEngine.settings.fps,
			settingsPlayer2Enabled: boolean = VideoEditorEngine.settings.player2Enable,
			testImage: OffscreenCanvas = GamingCanvasGridRaycastTestImageCreate(64),
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			value: number,
			x: number,
			y: number;

		for (characterNPC of gameMapNPCs.values()) {
			gameMapNPCsById.set(characterNPC.id, characterNPC);
		}

		// Warm cache
		for (assetId of assetImages.keys()) {
			offscreenCanvasInstance = new OffscreenCanvas(1, 1);

			cacheCanvasImages.set(assetId, offscreenCanvasInstance);
			cacheCanvasContextInstance = offscreenCanvasInstance.getContext('2d', cacheCanvasContextOptionsAlpha) as OffscreenCanvasRenderingContext2D;

			cacheCanvasImagesContext.set(assetId, cacheCanvasContextInstance);
		}
		for ([assetChracterType, assetImageCharacterInstance] of assetImageCharacters.entries()) {
			for (assetChracter of assetImageCharacterInstance.keys()) {
				offscreenCanvasInstance = new OffscreenCanvas(1, 1);

				// Canvas
				if (cacheCanvasImageCharacters.has(assetChracterType) !== true) {
					cacheCanvasImageCharacters.set(assetChracterType, new Map());
				}
				(<any>cacheCanvasImageCharacters.get(assetChracterType)).set(assetChracter, offscreenCanvasInstance);

				// Context
				cacheCanvasContextInstance = offscreenCanvasInstance.getContext('2d', cacheCanvasContextOptionsAlpha) as OffscreenCanvasRenderingContext2D;
				if (cacheCanvasImageCharactersContext.has(assetChracterType) !== true) {
					cacheCanvasImageCharactersContext.set(assetChracterType, new Map());
				}
				(<any>cacheCanvasImageCharactersContext.get(assetChracterType)).set(assetChracter, cacheCanvasContextInstance);
			}
		}

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoEditorEngine.request = requestAnimationFrame(VideoEditorEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				frameCount++;

				if (VideoEditorEngine.enable === true || true) {
					if (VideoEditorEngine.gameMapNew === true) {
						VideoEditorEngine.gameMapNew = false;

						gameMapGridData = VideoEditorEngine.gameMap.grid.data;
						gameMapGridSideLength = VideoEditorEngine.gameMap.grid.sideLength;
						gameMapNPCs = VideoEditorEngine.gameMap.npc;

						gameMapNPCsById.clear();
						for (characterNPC of gameMapNPCs.values()) {
							gameMapNPCsById.set(characterNPC.id, characterNPC);
						}
					}

					if (VideoEditorEngine.npcUpdateNew === true) {
						VideoEditorEngine.npcUpdateNew = false;

						for (characterNPC of VideoEditorEngine.npcUpdate.npc.values()) {
							gameMapNPCs.delete((<any>gameMapNPCsById.get(characterNPC.id)).gridIndex);
							gameMapNPCs.set(characterNPC.gridIndex, characterNPC);

							gameMapNPCsById.set(characterNPC.id, characterNPC);
						}
					}

					if (VideoEditorEngine.calculationsNew === true || VideoEditorEngine.reportNew === true || VideoEditorEngine.settingsNew === true) {
						VideoEditorEngine.reportNew = false;
						VideoEditorEngine.settingsNew = false;

						// Calculations
						if (VideoEditorEngine.calculationsNew === true) {
							VideoEditorEngine.calculationsNew = false;

							calculationsCamera.decode(VideoEditorEngine.calculations.camera);
							calculationsGameMode = VideoEditorEngine.calculations.gameMode;
							calculationsViewport.decode(VideoEditorEngine.calculations.viewport);

							if (VideoEditorEngine.calculations.player1Camera !== undefined) {
								characterPlayer1.decode(VideoEditorEngine.calculations.player1Camera);
							}
							if (VideoEditorEngine.calculations.player2Camera !== undefined) {
								characterPlayer2.decode(VideoEditorEngine.calculations.player2Camera);
							}

							// if (calculationsGameMode === true) {
							// 	characterPlayer1.camera.r = calculationsCamera.r;
							// 	characterPlayer1.camera.x = calculationsCamera.x;
							// 	characterPlayer1.camera.y = calculationsCamera.y;
							// }

							calculationsViewportCellSizePx = calculationsViewport.cellSizePx;
							calculationsViewportHeightStart = calculationsViewport.heightStart;
							calculationsViewportHeightStartPx = calculationsViewport.heightStartPx;
							calculationsViewportWidthStart = calculationsViewport.widthStart;
							calculationsViewportWidthStartPx = calculationsViewport.widthStartPx;

							renderCellOutlineWidth = Math.max(3, calculationsViewport.cellSizePx / 8);
							renderCellOutlineOffset = renderCellOutlineWidth / 2;

							characterPlayer1XEff = characterPlayer1.x - calculationsViewportWidthStart;
							characterPlayer1YEff = characterPlayer1.y - calculationsViewportHeightStart;
							characterPlayer2XEff = characterPlayer2.x - calculationsViewportWidthStart;
							characterPlayer2YEff = characterPlayer2.y - calculationsViewportHeightStart;
						}

						// Report
						report = VideoEditorEngine.report;
						if (offscreenCanvasHeightPx !== report.canvasHeight || offscreenCanvasWidthPx !== report.canvasWidth) {
							offscreenCanvasHeightPx = report.canvasHeight;
							offscreenCanvasWidthPx = report.canvasWidth;

							offscreenCanvas.height = offscreenCanvasHeightPx;
							offscreenCanvas.width = offscreenCanvasWidthPx;
						}

						// Settings
						settingsGridDraw = VideoEditorEngine.settings.gridDraw;
						settingsFPMS = 1000 / VideoEditorEngine.settings.fps;
						settingsPlayer2Enabled = VideoEditorEngine.settings.player2Enable;

						if (VideoEditorEngine.settings.antialias === true) {
							GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
						} else {
							GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
						}

						// Cache
						if (cacheCellSizePx !== calculationsViewportCellSizePx) {
							cacheCellSizePx = calculationsViewportCellSizePx;

							// Assets
							calculationsViewportCellSizePxEff = calculationsViewportCellSizePx + 1;
							for ([assetId, cacheCanvasContextInstance] of cacheCanvasImagesContext) {
								cacheCanvasContextInstance.canvas.height = calculationsViewportCellSizePxEff;
								cacheCanvasContextInstance.canvas.width = calculationsViewportCellSizePxEff;

								assetInstance = <OffscreenCanvas>assetImages.get(assetId);
								cacheCanvasContextInstance.drawImage(
									assetInstance,
									0,
									0,
									assetInstance.width,
									assetInstance.height,
									0,
									0,
									calculationsViewportCellSizePxEff,
									calculationsViewportCellSizePxEff,
								);
							}
							for ([assetChracterType, cacheCanvasImageCharactersContextInstance] of cacheCanvasImageCharactersContext) {
								for ([assetChracter, cacheCanvasContextInstance] of cacheCanvasImageCharactersContextInstance) {
									cacheCanvasContextInstance.canvas.height = calculationsViewportCellSizePxEff;
									cacheCanvasContextInstance.canvas.width = calculationsViewportCellSizePxEff;

									assetInstance = <OffscreenCanvas>(<any>assetImageCharacters.get(assetChracterType)).get(assetChracter);
									cacheCanvasContextInstance.drawImage(
										assetInstance,
										0,
										0,
										assetInstance.width,
										assetInstance.height,
										0,
										0,
										calculationsViewportCellSizePxEff,
										calculationsViewportCellSizePxEff,
									);
								}
							}

							// Grid: Cache
							if (settingsGridDraw === true) {
								offscreenCanvasHeightPxEff = offscreenCanvasHeightPx + calculationsViewportCellSizePx * 2;
								offscreenCanvasWidthPxEff = offscreenCanvasWidthPx + calculationsViewportCellSizePx * 2;

								cacheCanvasGridH.height = 1;
								cacheCanvasGridH.width = offscreenCanvasWidthPxEff;
								cacheCanvasGridHContext.fillStyle = 'rgba(255,255,255,0.25)';
								cacheCanvasGridHContext.fillRect(0, 0, offscreenCanvasWidthPxEff, 1);

								cacheCanvasGridV.height = offscreenCanvasHeightPxEff;
								cacheCanvasGridV.width = 1;
								cacheCanvasGridVContext.fillStyle = cacheCanvasGridHContext.fillStyle;
								cacheCanvasGridVContext.fillRect(0, 0, 1, offscreenCanvasHeightPxEff);

								cacheCanvasGrid.height = offscreenCanvasHeightPxEff;
								cacheCanvasGrid.width = offscreenCanvasWidthPxEff;

								// Grid: Horizontal
								for (y = 0; y < offscreenCanvasHeightPxEff; y += calculationsViewportCellSizePx) {
									cacheCanvasGridContext.drawImage(cacheCanvasGridH, 0, y);
								}
								// Grid: Vertical
								for (x = 0; x < offscreenCanvasWidthPxEff; x += calculationsViewportCellSizePx) {
									cacheCanvasGridContext.drawImage(cacheCanvasGridV, x, 0);
								}
							}
						}
					}

					// Draw: Config
					// statDrawAvg.watchStart();
					calculationsViewportHeightStartEff = calculationsViewportHeightStart - 1;
					calculationsViewportHeightStopEff = calculationsViewport.heightStop + 1;
					calculationsViewportWidthStartEff = calculationsViewportWidthStart - 1;
					calculationsViewportWidthStopEff = calculationsViewport.widthStop;

					// console.log(calculationsViewportWidthStartEff, calculationsViewportWidthStopEff);

					// Draw: Clear
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

					// Draw: Cells
					for ([i, value] of gameMapGridData.entries()) {
						x = (i / gameMapGridSideLength) | 0;

						// if (i === 0) {
						// 	console.log(i, x, calculationsViewportWidthStartEff, calculationsViewportWidthStopEff, value, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);
						// }
						// console.log(i, x, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);

						if (x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff) {
							y = i % gameMapGridSideLength;

							if (y > calculationsViewportHeightStartEff && y < calculationsViewportHeightStopEff) {
								// if (i === 0) {
								// 	console.log(i, x, y, (x - viewport.widthStart) * cellSizePx, (y - viewport.heightStart - 1) * cellSizePx);
								// }

								// Floor
								if ((value & GameGridCellMasksAndValues.FLOOR) !== 0) {
									offscreenCanvasContext.fillStyle = 'black';
									offscreenCanvasContext.fillRect(
										(x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
										(y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
										calculationsViewportCellSizePxEff,
										calculationsViewportCellSizePxEff,
									);
								}

								// Character
								characterNPC = gameMapNPCs.get(i);
								if (characterNPC !== undefined) {
									offscreenCanvasInstance = (<any>assetImageCharacters.get(characterNPC.type)).get(characterNPC.assetId) || testImage;
									offscreenCanvasContext.drawImage(
										offscreenCanvasInstance,
										0,
										0,
										offscreenCanvasInstance.width,
										offscreenCanvasInstance.height,
										(x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
										(y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
										calculationsViewportCellSizePxEff,
										calculationsViewportCellSizePxEff,
									);
								}

								if (value !== GameGridCellMasksAndValues.NULL) {
									// Sprite/Wall
									if (value !== GameGridCellMasksAndValues.FLOOR) {
										if ((value & GameGridCellMasksAndValues.EXTENDED) !== 0) {
											assetId = value & GameGridCellMasksAndValuesExtended.ID_MASK;
										} else {
											assetId = value & GameGridCellMasksAndValues.ID_MASK;
										}

										offscreenCanvasContext.drawImage(
											<OffscreenCanvas>cacheCanvasImages.get(assetId) || testImage,
											(x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
											(y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
										);
									}

									// Extended
									if ((value & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0) {
										offscreenCanvasContext.lineWidth = renderCellOutlineWidth | 0;
										offscreenCanvasContext.strokeStyle = 'white';
										offscreenCanvasContext.strokeRect(
											(x - calculationsViewportWidthStart) * calculationsViewportCellSizePx + renderCellOutlineOffset,
											(y - calculationsViewportHeightStart) * calculationsViewportCellSizePx + renderCellOutlineOffset,
											calculationsViewportCellSizePxEff - renderCellOutlineWidth,
											calculationsViewportCellSizePxEff - renderCellOutlineWidth,
										);
									}
								}
							}
						}
					}

					// Draw: Map - Grid
					if (settingsGridDraw === true) {
						offscreenCanvasContext.drawImage(
							cacheCanvasGrid,
							-(calculationsViewportWidthStartPx % calculationsViewportCellSizePx) - calculationsViewportCellSizePx,
							-(calculationsViewportHeightStartPx % calculationsViewportCellSizePx) - calculationsViewportCellSizePx,
						);
					}

					// Draw: Map - Remove Grid Outide of Border
					offscreenCanvasContext.clearRect(
						0,
						(gameMapGridSideLength - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
						offscreenCanvas.width,
						offscreenCanvas.height,
					); // Bottom
					offscreenCanvasContext.clearRect(0, 0, -calculationsViewportWidthStart * calculationsViewportCellSizePx, offscreenCanvas.height); // Left
					offscreenCanvasContext.clearRect(
						(gameMapGridSideLength - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
						0,
						offscreenCanvas.width,
						offscreenCanvas.height,
					); // Right
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, -calculationsViewportHeightStart * calculationsViewportCellSizePx); // Top

					// Draw: Map - Border
					offscreenCanvasContext.lineWidth = 5;
					offscreenCanvasContext.strokeStyle = 'black';
					offscreenCanvasContext.strokeRect(
						-calculationsViewportWidthStart * calculationsViewportCellSizePx,
						-calculationsViewportHeightStart * calculationsViewportCellSizePx,
						gameMapGridSideLength * calculationsViewportCellSizePx,
						gameMapGridSideLength * calculationsViewportCellSizePx,
					);

					// Draw: Player1 Direction
					offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 3;
					offscreenCanvasContext.strokeStyle = 'blue';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.moveTo(characterPlayer1XEff * calculationsViewportCellSizePx, characterPlayer1YEff * calculationsViewportCellSizePx); // Center
					offscreenCanvasContext.lineTo(
						calculationsViewportCellSizePx * (Math.sin(characterPlayer1.r) + characterPlayer1XEff),
						calculationsViewportCellSizePx * (Math.cos(characterPlayer1.r) + characterPlayer1YEff),
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.stroke();

					// Draw: Player2 Position
					offscreenCanvasContext.fillStyle = 'red';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.arc(
						characterPlayer1XEff * calculationsViewportCellSizePx,
						characterPlayer1YEff * calculationsViewportCellSizePx,
						calculationsViewportCellSizePx / 4,
						0,
						GamingCanvasConstPIDouble,
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.fill();

					if (settingsPlayer2Enabled === true) {
						// Draw: Player2 Direction
						offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 3;
						offscreenCanvasContext.strokeStyle = 'green';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.moveTo(
							characterPlayer2XEff * calculationsViewportCellSizePx,
							characterPlayer2YEff * calculationsViewportCellSizePx,
						); // Center
						offscreenCanvasContext.lineTo(
							calculationsViewportCellSizePx * (Math.sin(characterPlayer2.r) + characterPlayer2XEff),
							calculationsViewportCellSizePx * (Math.cos(characterPlayer2.r) + characterPlayer2YEff),
						);
						offscreenCanvasContext.closePath();
						offscreenCanvasContext.stroke();

						// Draw: Player2 Position
						offscreenCanvasContext.fillStyle = 'red';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.arc(
							characterPlayer2XEff * calculationsViewportCellSizePx,
							characterPlayer2YEff * calculationsViewportCellSizePx,
							calculationsViewportCellSizePx / 4,
							0,
							GamingCanvasConstPIDouble,
						);
						offscreenCanvasContext.closePath();
						offscreenCanvasContext.fill();
					}

					// Draw NPC LOS on players
					// for (characterNPC of gameMapNPCs.values()) {
					// 	if (characterNPC.playerLOS === undefined) {
					// 		// console.log('undefined', characterNPC);
					// 		continue;
					// 	}

					// 	offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 5;
					// 	for (i = 0; i < (settingsPlayer2Enabled === true ? 2 : 1); i++) {
					// 		if (characterNPC.playerLOS[i] === true) {
					// 			offscreenCanvasContext.strokeStyle = 'green';
					// 		} else {
					// 			offscreenCanvasContext.strokeStyle = 'red';
					// 		}

					// 		offscreenCanvasContext.beginPath();
					// 		offscreenCanvasContext.moveTo(
					// 			(characterNPC.camera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
					// 			(characterNPC.camera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
					// 		);
					// 		offscreenCanvasContext.lineTo(
					// 			calculationsViewportCellSizePx *
					// 				(Math.sin(characterNPC.playerAngle[i]) + (characterNPC.camera.x - calculationsViewportWidthStart)),
					// 			calculationsViewportCellSizePx *
					// 				(Math.cos(characterNPC.playerAngle[i]) + (characterNPC.camera.y - calculationsViewportHeightStart)),
					// 		);
					// 		offscreenCanvasContext.closePath();
					// 		offscreenCanvasContext.stroke();
					// 	}
					// }

					// Draw camera dot
					if (calculationsGameMode !== true) {
						// Direction
						offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 5;
						offscreenCanvasContext.strokeStyle = 'magenta';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.moveTo(
							(calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
							(calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
						); // Center
						offscreenCanvasContext.lineTo(
							calculationsViewportCellSizePx * (Math.sin(calculationsCamera.r) + (calculationsCamera.x - calculationsViewportWidthStart)),
							calculationsViewportCellSizePx * (Math.cos(calculationsCamera.r) + (calculationsCamera.y - calculationsViewportHeightStart)),
						);
						offscreenCanvasContext.closePath();
						offscreenCanvasContext.stroke();

						// Position
						offscreenCanvasContext.fillStyle = 'magenta';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.arc(
							(calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
							(calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
							calculationsViewportCellSizePx / 4,
							0,
							GamingCanvasConstPIDouble,
						);
						offscreenCanvasContext.closePath();
						offscreenCanvasContext.fill();
					}

					// statDrawAvg.watchStop();
				}
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				// Output
				VideoEditorEngine.post([
					{
						cmd: VideoEditorBusOutputCmd.STATS,
						data: {
							fps: frameCount,
						},
					},
				]);
				frameCount = 0;
			}
		};
		VideoEditorEngine.go = go;
	}
}
