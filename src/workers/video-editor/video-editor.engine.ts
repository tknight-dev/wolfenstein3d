import { GamingCanvas, GamingCanvasConstPI_2_000, GamingCanvasReport, GamingCanvasRenderStyle, GamingCanvasStat } from '@tknight-dev/gaming-canvas';
import { GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../../models/game.model.js';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCalculations,
	VideoEditorBusInputDataInit,
	VideoEditorBusInputDataSettings,
	VideoEditorBusInputPayload,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputPayload,
	VideoEditorBusStats,
} from './video-editor.model.js';
import { CharacterNPC, CharacterNPCUpdateDecodeAndApply, CharacterNPCUpdateDecodeId } from '../../models/character.model.js';
import { GamingCanvasGridCamera, GamingCanvasGridRaycastTestImageCreate, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';
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
			VideoEditorEngine.inputNPCUpdate(<Float32Array[]>payload.data);
			break;
		case VideoEditorBusInputCmd.PATH_UPDATE:
			VideoEditorEngine.inputPathUpdate(<Map<number, number[]>>payload.data);
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
	private static npcUpdate: Float32Array[];
	private static npcUpdateNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static pathUpdate: Map<number, number[]>;
	private static pathUpdateNew: boolean;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoEditorBusInputDataSettings;
	private static settingsNew: boolean;
	private static stats: { [key: number]: GamingCanvasStat } = {};

	public static async initialize(data: VideoEditorBusInputDataInit): Promise<void> {
		// Stats
		VideoEditorEngine.stats[VideoEditorBusStats.ALL] = new GamingCanvasStat(50);
		VideoEditorEngine.stats[VideoEditorBusStats.CELLS] = new GamingCanvasStat(50);
		VideoEditorEngine.stats[VideoEditorBusStats.C_V] = new GamingCanvasStat(50);

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

		// Config: Canvas
		VideoEditorEngine.offscreenCanvas = data.offscreenCanvas;
		VideoEditorEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Character
		VideoEditorEngine.characterPlayer1Camera = new GamingCanvasGridCamera();
		VideoEditorEngine.characterPlayer2Camera = new GamingCanvasGridCamera();

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
		VideoEditorEngine.stats[VideoEditorBusStats.C_V].add(Date.now() - data.timestampUnix);

		VideoEditorEngine.calculations = data;
		VideoEditorEngine.calculationsNew = true;
	}

	public static inputEnable(enable: boolean): void {
		VideoEditorEngine.enable = enable;
	}

	public static inputMap(data: GameMap): void {
		VideoEditorEngine.gameMap = Assets.parseMap(data);
		VideoEditorEngine.gameMapNew = true;
	}

	public static inputNPCUpdate(data: Float32Array[]): void {
		VideoEditorEngine.npcUpdate = data;
		VideoEditorEngine.npcUpdateNew = true;
	}

	public static inputPathUpdate(data: Map<number, number[]>): void {
		VideoEditorEngine.pathUpdate = data;
		VideoEditorEngine.pathUpdateNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoEditorEngine.report = report;
		VideoEditorEngine.reportNew = true;
	}

	public static inputSettings(data: VideoEditorBusInputDataSettings): void {
		VideoEditorEngine.settings = data;
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
			calculationsCamera: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			calculationsGameMode: boolean,
			calculationsViewport: GamingCanvasGridViewport = new GamingCanvasGridViewport(1),
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
			characterNPC: CharacterNPC | undefined,
			characterNPCGridIndex: number,
			characterNPCId: number,
			characterNPCUpdateEncoded: Float32Array,
			characterPlayer1: GamingCanvasGridCamera = VideoEditorEngine.characterPlayer1Camera,
			characterPlayer1XEff: number,
			characterPlayer1YEff: number,
			characterPlayer2: GamingCanvasGridCamera = VideoEditorEngine.characterPlayer2Camera,
			characterPlayer2XEff: number,
			characterPlayer2YEff: number,
			gameMapGridData: Uint16Array,
			gameMapGridSideLength: number,
			gameMapNPC: CharacterNPC,
			gameMapNPCId: number,
			gameMapNPCByGridIndex: Map<number, CharacterNPC> = new Map(),
			gameMapNPCById: Map<number, CharacterNPC>,
			i: number,
			offscreenCanvas: OffscreenCanvas = VideoEditorEngine.offscreenCanvas,
			offscreenCanvasInstance: OffscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoEditorEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = 0,
			offscreenCanvasHeightPxEff: number = 0,
			offscreenCanvasWidthPx: number = 0,
			offscreenCanvasWidthPxEff: number = 0,
			path: number[],
			pathByNPCId: Map<number, number[]>,
			frameCount: number = 0,
			renderCellOutlineOffset: number,
			renderCellOutlineWidth: number,
			report: GamingCanvasReport = VideoEditorEngine.report,
			settingsDebug: boolean = VideoEditorEngine.settings.debug,
			settingsGridDraw: boolean = VideoEditorEngine.settings.gridDraw,
			settingsFPMS: number = VideoEditorEngine.settings.fps !== 0 ? 1000 / VideoEditorEngine.settings.fps : 0,
			settingsPlayer2Enabled: boolean = VideoEditorEngine.settings.player2Enable,
			state: boolean,
			statAll: GamingCanvasStat = VideoEditorEngine.stats[VideoEditorBusStats.ALL],
			statAllRaw: Float32Array,
			statCells: GamingCanvasStat = VideoEditorEngine.stats[VideoEditorBusStats.CELLS],
			statCellsRaw: Float32Array,
			statCV: GamingCanvasStat = VideoEditorEngine.stats[VideoEditorBusStats.C_V],
			statCVRaw: Float32Array,
			testImage: OffscreenCanvas = GamingCanvasGridRaycastTestImageCreate(64),
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			timestampUnix: number = Date.now(),
			value: number,
			x: number,
			y: number;

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
			timestampNow = timestampNow | 0;

			// Main code
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta !== 0) {
				timestampUnix = Date.now();
			}

			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				if (settingsFPMS === 0) {
					timestampThen = timestampNow - timestampDelta;
				} else {
					timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				}
				frameCount++;

				if (VideoEditorEngine.enable === true || true) {
					statAll.watchStart();
					if (VideoEditorEngine.gameMapNew === true) {
						VideoEditorEngine.gameMapNew = false;

						gameMapGridData = VideoEditorEngine.gameMap.grid.data;
						gameMapGridSideLength = VideoEditorEngine.gameMap.grid.sideLength;
						gameMapNPCById = VideoEditorEngine.gameMap.npcById;

						for (characterNPC of gameMapNPCById.values()) {
							gameMapNPCByGridIndex.set(characterNPC.gridIndex, characterNPC);
						}
					}

					if (VideoEditorEngine.npcUpdateNew === true) {
						VideoEditorEngine.npcUpdateNew = false;

						for (characterNPCUpdateEncoded of VideoEditorEngine.npcUpdate) {
							// Reference
							characterNPCId = CharacterNPCUpdateDecodeId(characterNPCUpdateEncoded);
							characterNPC = <CharacterNPC>gameMapNPCById.get(characterNPCId);

							if (characterNPC === undefined) {
								continue;
							}

							// Prepare
							gameMapNPCByGridIndex.delete(characterNPC.gridIndex);

							// Update
							CharacterNPCUpdateDecodeAndApply(characterNPCUpdateEncoded, characterNPC, timestampUnix);

							// Apply
							gameMapNPCByGridIndex.set(characterNPC.gridIndex, characterNPC);
						}
					}

					if (VideoEditorEngine.pathUpdateNew === true) {
						VideoEditorEngine.pathUpdateNew = false;
						pathByNPCId = VideoEditorEngine.pathUpdate;
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

							if (VideoEditorEngine.settings.antialias === true) {
								GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
							} else {
								GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
							}
						}

						// Settings
						settingsDebug = VideoEditorEngine.settings.debug;
						settingsGridDraw = VideoEditorEngine.settings.gridDraw;
						settingsFPMS = VideoEditorEngine.settings.fps !== 0 ? 1000 / VideoEditorEngine.settings.fps : 0;
						settingsPlayer2Enabled = VideoEditorEngine.settings.player2Enable;

						/**
						 * Cache
						 */
						// Assets
						if (calculationsViewportCellSizePx !== undefined) {
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

					// No Game map loaded
					if (gameMapGridData === undefined) {
						return;
					}

					// Draw: Clear
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

					// Draw: Cells
					statCells.watchStart();
					for ([i, value] of gameMapGridData.entries()) {
						y = i % gameMapGridSideLength;

						// if (i === 0) {
						// 	console.log(i, x, calculationsViewportWidthStartEff, calculationsViewportWidthStopEff, value, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);
						// }
						// console.log(i, x, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);

						if (y > calculationsViewportHeightStartEff && y < calculationsViewportHeightStopEff) {
							x = (i / gameMapGridSideLength) | 0;

							if (x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff) {
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

								// Character
								characterNPC = gameMapNPCByGridIndex.get(i);
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
							}
						}
					}
					statCells.watchStop();

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
						calculationsViewportCellSizePx * (Math.cos(characterPlayer1.r) + characterPlayer1XEff),
						calculationsViewportCellSizePx * (-Math.sin(characterPlayer1.r) + characterPlayer1YEff),
					);
					offscreenCanvasContext.stroke();

					// Draw: Player2 Position
					offscreenCanvasContext.fillStyle = 'red';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.arc(
						characterPlayer1XEff * calculationsViewportCellSizePx,
						characterPlayer1YEff * calculationsViewportCellSizePx,
						calculationsViewportCellSizePx / 4,
						0,
						GamingCanvasConstPI_2_000,
					);
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
							calculationsViewportCellSizePx * (Math.cos(characterPlayer2.r) + characterPlayer2XEff),
							calculationsViewportCellSizePx * (-Math.sin(characterPlayer2.r) + characterPlayer2YEff),
						);
						offscreenCanvasContext.stroke();

						// Draw: Player2 Position
						offscreenCanvasContext.fillStyle = 'red';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.arc(
							characterPlayer2XEff * calculationsViewportCellSizePx,
							characterPlayer2YEff * calculationsViewportCellSizePx,
							calculationsViewportCellSizePx / 4,
							0,
							GamingCanvasConstPI_2_000,
						);
						offscreenCanvasContext.fill();
					}

					// Draw NPC LOS on players
					if (settingsDebug === true) {
						for (gameMapNPC of gameMapNPCById.values()) {
							offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 5;
							for (i = settingsPlayer2Enabled === true ? -2 : -1; i < 0; i++) {
								if (gameMapNPC.seenLOSById.get(i) === true) {
									offscreenCanvasContext.strokeStyle = 'green';
								} else {
									offscreenCanvasContext.strokeStyle = 'red';
								}

								offscreenCanvasContext.beginPath();
								offscreenCanvasContext.moveTo(
									(gameMapNPC.camera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
									(gameMapNPC.camera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
								);
								offscreenCanvasContext.lineTo(
									calculationsViewportCellSizePx *
										(Math.cos(<number>gameMapNPC.seenAngleById.get(i)) + (gameMapNPC.camera.x - calculationsViewportWidthStart)),
									calculationsViewportCellSizePx *
										(-Math.sin(<number>gameMapNPC.seenAngleById.get(i)) + (gameMapNPC.camera.y - calculationsViewportHeightStart)),
								);
								offscreenCanvasContext.stroke();
							}
						}
					}

					// Draw NPC Path
					if (settingsDebug === true && pathByNPCId !== undefined) {
						for ([gameMapNPCId, path] of pathByNPCId.entries()) {
							if (path.length === 0) {
								continue;
							}
							gameMapNPC = <CharacterNPC>gameMapNPCById.get(gameMapNPCId);

							if (gameMapNPC.assetId === AssetIdImgCharacter.CORPSE) {
								offscreenCanvasContext.fillStyle = 'rgba(255, 0, 0, 0.5)';
								offscreenCanvasContext.strokeStyle = 'rgba(255, 0, 0, 0.5)';
							} else {
								offscreenCanvasContext.fillStyle = 'rgba(255, 255, 0, 0.5)';
								offscreenCanvasContext.strokeStyle = 'rgba(255, 255, 0, 0.5)';

								for (state of gameMapNPC.seenLOSById.values()) {
									if (state === true) {
										offscreenCanvasContext.fillStyle = 'rgba(0, 255, 0, 0.5)';
										offscreenCanvasContext.strokeStyle = 'rgba(0, 255, 0, 0.5)';
										break;
									}
								}
							}

							offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 5;
							offscreenCanvasContext.beginPath();

							for (i = 1; i < path.length; i++) {
								characterNPCGridIndex = path[i];
								y = characterNPCGridIndex % gameMapGridSideLength;
								x = (characterNPCGridIndex - y) / gameMapGridSideLength;

								if (i === 0) {
									offscreenCanvasContext.moveTo(
										(x - calculationsViewportWidthStart + 0.5) * calculationsViewportCellSizePx,
										(y - calculationsViewportHeightStart + 0.5) * calculationsViewportCellSizePx,
									);
								} else {
									offscreenCanvasContext.lineTo(
										(x - calculationsViewportWidthStart + 0.5) * calculationsViewportCellSizePx,
										(y - calculationsViewportHeightStart + 0.5) * calculationsViewportCellSizePx,
									);
								}
							}
							offscreenCanvasContext.stroke();

							offscreenCanvasContext.beginPath();
							offscreenCanvasContext.arc(
								(x - calculationsViewportWidthStart + 0.5) * calculationsViewportCellSizePx,
								(y - calculationsViewportHeightStart + 0.5) * calculationsViewportCellSizePx,
								calculationsViewportCellSizePx / 4,
								0,
								GamingCanvasConstPI_2_000,
							);
							offscreenCanvasContext.fill();
						}
					}

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
							calculationsViewportCellSizePx * (Math.cos(calculationsCamera.r) + (calculationsCamera.x - calculationsViewportWidthStart)),
							calculationsViewportCellSizePx * (-Math.sin(calculationsCamera.r) + (calculationsCamera.y - calculationsViewportHeightStart)),
						);
						offscreenCanvasContext.stroke();

						// Positions
						offscreenCanvasContext.fillStyle = 'magenta';
						offscreenCanvasContext.beginPath();
						offscreenCanvasContext.arc(
							(calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
							(calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
							calculationsViewportCellSizePx / 4,
							0,
							GamingCanvasConstPI_2_000,
						);
						offscreenCanvasContext.fill();
					}

					statAll.watchStop();
				}
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				statAllRaw = <Float32Array>statAll.encode();
				statCellsRaw = <Float32Array>statCells.encode();
				statCVRaw = <Float32Array>statCV.encode();

				// Output
				VideoEditorEngine.post(
					[
						{
							cmd: VideoEditorBusOutputCmd.STATS,
							data: {
								all: statAllRaw,
								cells: statCellsRaw,
								cv: statCVRaw,
								fps: frameCount,
							},
						},
					],
					[statCellsRaw.buffer, statCVRaw.buffer],
				);
				frameCount = 0;
			}
		};
		VideoEditorEngine.go = go;
	}
}
