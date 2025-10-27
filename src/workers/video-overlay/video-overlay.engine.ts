import {
	GamingCanvas,
	GamingCanvasConstPI_0_500,
	GamingCanvasConstPI_1_500,
	GamingCanvasConstPI_2_000,
	GamingCanvasRenderStyle,
	GamingCanvasReport,
	GamingCanvasUtilDebugImage,
	GamingCanvasUtilTimers,
} from '@tknight-dev/gaming-canvas';
import {
	VideoOverlayBusInputCmd,
	VideoOverlayBusInputDataCalculations,
	VideoOverlayBusInputDataInit,
	VideoOverlayBusInputDataSettings,
	VideoOverlayBusInputPayload,
	VideoOverlayBusOutputCmd,
	VideoOverlayBusOutputPayload,
} from './video-overlay.model.js';
import { GamingCanvasOrientation } from '@tknight-dev/gaming-canvas';
import {
	CalcMainBusOutputDataActionTag,
	CalcMainBusPlayerDeadFadeDurationInMS,
	CalcMainBusPlayerDeadFallDurationInMS,
	CalcMainBusPlayerHitDurationInMS,
} from '../calc-main/calc-main.model.js';
import { GameGridCellMasksAndValues, GameMap } from '../../models/game.model.js';
import { Assets } from '../../modules/assets.js';
import { GamingCanvasGridCamera, GamingCanvasGridRaycastResultDistanceMapInstance, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';
import { Navigation } from '../../models/settings.model.js';
import { AssetIdImg, assetLoaderImage, AssetPropertiesImage, assetsImages, initializeAssetManager } from '../../asset-manager.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoOverlayBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoOverlayBusInputCmd.ACTION_TAG:
			VideoOverlayEngine.inputActionTag(<CalcMainBusOutputDataActionTag>payload.data);
			break;
		case VideoOverlayBusInputCmd.CALCULATIONS:
			VideoOverlayEngine.inputCalculations(<VideoOverlayBusInputDataCalculations>payload.data);
			break;
		case VideoOverlayBusInputCmd.GAME_OVER:
			VideoOverlayEngine.inputGameOver();
			break;
		case VideoOverlayBusInputCmd.INIT:
			VideoOverlayEngine.initialize(<VideoOverlayBusInputDataInit>payload.data);
			break;
		case VideoOverlayBusInputCmd.LOCKED:
			VideoOverlayEngine.inputLocked(<number[]>payload.data);
			break;
		case VideoOverlayBusInputCmd.MAP:
			VideoOverlayEngine.inputGameMap(<GameMap>payload.data);
			break;
		case VideoOverlayBusInputCmd.PAUSE:
			VideoOverlayEngine.inputPause(<boolean>payload.data);
			break;
		case VideoOverlayBusInputCmd.PLAYER_DEAD:
			VideoOverlayEngine.inputPlayerDead();
			break;
		case VideoOverlayBusInputCmd.PLAYER_HIT:
			VideoOverlayEngine.inputPlayerHit(<number>payload.data);
			break;
		case VideoOverlayBusInputCmd.REPORT:
			VideoOverlayEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoOverlayBusInputCmd.RESET:
			VideoOverlayEngine.inputReset();
			break;
		case VideoOverlayBusInputCmd.SETTINGS:
			VideoOverlayEngine.inputSettings(<VideoOverlayBusInputDataSettings>payload.data);
			break;
	}
};

class VideoOverlayEngine {
	private static assetImages: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static calculations: VideoOverlayBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static dead: boolean;
	private static deadTimestamp: number;
	private static gameover: boolean;
	private static hitGradientsByTimerId: Map<number, CanvasGradient> = new Map();
	private static hitsByTimerId: Map<number, number> = new Map();
	private static locked: number[];
	private static lockedNew: boolean;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static player1: boolean;
	private static pause: boolean = true;
	private static pauseTimestampUnix: number = Date.now();
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static reset: boolean;
	private static settings: VideoOverlayBusInputDataSettings;
	private static settingsNew: boolean;
	private static tagRunAndJump: boolean;
	private static tagRunAndJumpOptions: any;
	private static timers: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();

	public static async initialize(data: VideoOverlayBusInputDataInit): Promise<void> {
		// Assets
		await initializeAssetManager();
		let assetCanvas: OffscreenCanvas,
			assetContext: OffscreenCanvasRenderingContext2D,
			assetData: ImageBitmap,
			assetId: AssetIdImg,
			assetImagesLoaded: Map<AssetIdImg, ImageBitmap> = <any>await assetLoaderImage(),
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
			VideoOverlayEngine.assetImages.set(assetId, assetCanvas);
		}

		// Config: Canvas
		VideoOverlayEngine.offscreenCanvas = data.offscreenCanvas;
		VideoOverlayEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Report
		VideoOverlayEngine.inputReport(data.report);

		// Config: Settings
		VideoOverlayEngine.inputSettings(data as VideoOverlayBusInputDataSettings);
		VideoOverlayEngine.player1 = data.player1;

		// Start
		if (VideoOverlayEngine.offscreenCanvasContext === null) {
			VideoOverlayEngine.post([
				{
					cmd: VideoOverlayBusOutputCmd.INIT_COMPLETE,
					data: false,
				},
			]);
		} else {
			VideoOverlayEngine.post([
				{
					cmd: VideoOverlayBusOutputCmd.INIT_COMPLETE,
					data: true,
				},
			]);

			// Start rendering thread
			VideoOverlayEngine.go__funcForward();
			VideoOverlayEngine.request = requestAnimationFrame(VideoOverlayEngine.go);
		}
	}

	/*
	 * Input
	 */

	public static inputActionTag(data: CalcMainBusOutputDataActionTag): void {
		if (data.type === GameGridCellMasksAndValues.TAG_RUN_AND_JUMP) {
			VideoOverlayEngine.tagRunAndJump = true;
			VideoOverlayEngine.tagRunAndJumpOptions = data.options;
		}
	}

	public static inputCalculations(data: VideoOverlayBusInputDataCalculations): void {
		VideoOverlayEngine.calculations = data;
		VideoOverlayEngine.calculationsNew = true;
	}

	public static inputGameOver(): void {
		VideoOverlayEngine.dead = true;
		VideoOverlayEngine.gameover = true;
	}

	public static inputLocked(locked: number[]): void {
		VideoOverlayEngine.locked = locked;
		VideoOverlayEngine.lockedNew = true;
	}

	public static inputGameMap(data: GameMap): void {
		VideoOverlayEngine.gameMap = Assets.mapParse(data);
		VideoOverlayEngine.gameMapNew = true;
		VideoOverlayEngine.reset = true;
	}

	public static inputPause(state: boolean): void {
		VideoOverlayEngine.pause = state;
	}

	public static inputPlayerDead(): void {
		VideoOverlayEngine.deadTimestamp = performance.now();
		VideoOverlayEngine.dead = true;

		VideoOverlayEngine.timers.clearAll();
		VideoOverlayEngine.hitsByTimerId.clear();
		VideoOverlayEngine.hitGradientsByTimerId.clear();

		VideoOverlayEngine.timers.add(() => {
			if (VideoOverlayEngine.gameover !== true) {
				VideoOverlayEngine.dead = false; // Respawn
			}
		}, CalcMainBusPlayerDeadFadeDurationInMS + CalcMainBusPlayerDeadFallDurationInMS);
	}

	public static inputPlayerHit(angle: number): void {
		if (VideoOverlayEngine.dead === true || VideoOverlayEngine.gameover === true) {
			return;
		}

		VideoOverlayEngine.hitsByTimerId.set(
			VideoOverlayEngine.timers.add((_durationInMS: number, id: number) => {
				VideoOverlayEngine.hitsByTimerId.delete(id);
				VideoOverlayEngine.hitGradientsByTimerId.delete(id);
			}, CalcMainBusPlayerHitDurationInMS),
			angle,
		);
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoOverlayEngine.report = report;
		VideoOverlayEngine.reportNew = true;
	}

	public static inputReset(): void {
		VideoOverlayEngine.reset = true;
	}

	public static inputSettings(data: VideoOverlayBusInputDataSettings): void {
		VideoOverlayEngine.settings = data;
		VideoOverlayEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: VideoOverlayBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let assetImages: Map<AssetIdImg, OffscreenCanvas> = VideoOverlayEngine.assetImages,
			calculationsCamera: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			calculationsCameraAlt: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			calculationsCameraAltAvailable: boolean,
			calculationsCameraRaysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			frameCount: number = 0,
			fpms: number = 1000 / 30, // Fixed 30fps
			gameMap: GameMap,
			hitAngle: number,
			hitGradientsByTimerId: Map<number, CanvasGradient> = VideoOverlayEngine.hitGradientsByTimerId,
			hitsByTimerId: Map<number, number> = VideoOverlayEngine.hitsByTimerId,
			offscreenCanvas: OffscreenCanvas = VideoOverlayEngine.offscreenCanvas,
			offscreenCanvasCompass: OffscreenCanvas = new OffscreenCanvas(64, 64),
			offscreenCanvasCompassRotate: OffscreenCanvas = new OffscreenCanvas(64, 64),
			offscreenCanvasCompassRotateContext: OffscreenCanvasRenderingContext2D = offscreenCanvasCompassRotate.getContext('2d', {
				alpha: true,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
			}) as OffscreenCanvasRenderingContext2D,
			offscreenCanvasCompassContext: OffscreenCanvasRenderingContext2D = offscreenCanvasCompass.getContext('2d', {
				alpha: true,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
			}) as OffscreenCanvasRenderingContext2D,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoOverlayEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = VideoOverlayEngine.report.canvasHeightSplit,
			offscreenCanvasHeightPxHalf: number = (offscreenCanvasHeightPx / 2) | 0,
			offscreenCanvasMap: OffscreenCanvas = new OffscreenCanvas(1, 1),
			offscreenCanvasMapContext: OffscreenCanvasRenderingContext2D = offscreenCanvasMap.getContext('2d', {
				alpha: true,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
			}) as OffscreenCanvasRenderingContext2D,
			offscreenCanvasWidthPx: number = VideoOverlayEngine.report.canvasWidthSplit,
			offscreenCanvasWidthPxHalf: number = (offscreenCanvasWidthPx / 2) | 0,
			orientation: GamingCanvasOrientation = VideoOverlayEngine.report.orientation,
			player1: boolean = VideoOverlayEngine.player1,
			pause: boolean = VideoOverlayEngine.pause,
			r: number,
			renderDead: boolean = VideoOverlayEngine.dead,
			renderDeadFadeOut: boolean,
			renderDeadFall: boolean,
			renderDeadTimestamp: number,
			renderDebugImage: OffscreenCanvas = GamingCanvasUtilDebugImage(64),
			renderFilter: string,
			renderFilterNone: string = 'none',
			renderGameOver: boolean = VideoOverlayEngine.gameover,
			renderGradient: CanvasGradient,
			renderGrayscale: boolean,
			renderGrayscaleFilter: string = 'grayscale(1)',
			renderLocked: number[],
			renderLockedDelta: number,
			renderLockedTimestampUnix: number,
			renderMapInstance: GamingCanvasGridRaycastResultDistanceMapInstance,
			renderMapSeenCells: Set<number> = new Set(),
			renderMapViewport: GamingCanvasGridViewport = new GamingCanvasGridViewport(1),
			renderMapViewportHeightPx: number = 90,
			renderMapViewportWidthPx: number = 160,
			renderMapViewportZoom: number = 1,
			settingsMultiplayer: boolean = VideoOverlayEngine.settings.player2Enable,
			settingsNavigation: Navigation = VideoOverlayEngine.settings.navigation,
			tagRunAndJump: boolean,
			tagRunAndJumpOptions: any,
			timerId: number,
			timers: GamingCanvasUtilTimers = VideoOverlayEngine.timers,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			timestampUnix: number,
			timestampUnixPause: number,
			timestampUnixPauseDelta: number,
			x: number,
			y: number;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoOverlayEngine.request = requestAnimationFrame(VideoOverlayEngine.go);
			timestampNow = timestampNow | 0;

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta !== 0) {
				timestampUnix = Date.now();

				if (VideoOverlayEngine.pause !== pause) {
					pause = VideoOverlayEngine.pause;

					timestampUnixPause = Date.now();
					timestampUnixPauseDelta = timestampUnixPause - VideoOverlayEngine.pauseTimestampUnix;

					if (pause !== true) {
						timers.clockUpdate(timestampNow);

						if (renderDead === true) {
							VideoOverlayEngine.deadTimestamp += timestampUnixPauseDelta;
							renderDeadTimestamp += timestampUnixPauseDelta;
						}
					}

					VideoOverlayEngine.pauseTimestampUnix = timestampUnixPause;
				}
				if (pause !== true) {
					timers.tick(timestampNow);
				}
			}

			// Main code
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);
				frameCount++;

				/*
				 * Modifiers
				 */

				if (VideoOverlayEngine.calculationsNew === true) {
					VideoOverlayEngine.calculationsNew = false;

					calculationsCamera.decode(VideoOverlayEngine.calculations.characterPlayerCamera);
					calculationsCamera.z = renderMapViewportZoom;
					calculationsCameraRaysMap = VideoOverlayEngine.calculations.characterPlayerRaysMap;

					if (VideoOverlayEngine.calculations.characterPlayerCameraAlt !== undefined) {
						calculationsCameraAlt.decode(VideoOverlayEngine.calculations.characterPlayerCameraAlt);
						calculationsCameraAltAvailable = true;
					} else {
						calculationsCameraAltAvailable = false;
					}

					// Process camera
					renderMapViewport.apply(calculationsCamera, false);
					renderMapViewport.applyZ(
						calculationsCamera,
						<GamingCanvasReport>Object.assign({}, VideoOverlayEngine.report, {
							canvasHeight: 100,
							canvasWidth: 100,
						}),
					);

					// Process seen cells (clears fog)
					for (renderMapInstance of calculationsCameraRaysMap.values()) {
						if (renderMapInstance.gridIndex !== undefined) {
							renderMapSeenCells.add(renderMapInstance.gridIndex);
						}
					}
				}

				if (VideoOverlayEngine.dead !== renderDead) {
					renderDead = VideoOverlayEngine.dead;

					if (renderDead === true) {
						renderDeadFadeOut = false;
						renderDeadFall = true;
						renderDeadTimestamp = VideoOverlayEngine.deadTimestamp;
					}
				}

				if (VideoOverlayEngine.gameMapNew === true) {
					VideoOverlayEngine.gameMapNew = false;

					gameMap = VideoOverlayEngine.gameMap;
					renderMapSeenCells.clear();
					renderMapViewport = new GamingCanvasGridViewport(gameMap.grid.sideLength);
					renderMapViewport.applyZ(
						calculationsCamera,
						<GamingCanvasReport>Object.assign({}, VideoOverlayEngine.report, {
							canvasHeight: renderMapViewportHeightPx,
							canvasWidth: renderMapViewportWidthPx,
						}),
					);
				}

				if (VideoOverlayEngine.gameover !== renderGameOver) {
					renderGameOver = VideoOverlayEngine.gameover;

					if (renderGameOver === true) {
						renderDeadFadeOut = false;
						renderDeadFall = true;
						renderDeadTimestamp = timestampNow;
					}
				}

				if (VideoOverlayEngine.lockedNew === true) {
					VideoOverlayEngine.lockedNew = false;

					renderLocked = VideoOverlayEngine.locked;
					renderLockedTimestampUnix = timestampUnix;
				}

				if (VideoOverlayEngine.reportNew === true || VideoOverlayEngine.settingsNew === true) {
					// Settings
					orientation = VideoOverlayEngine.report.orientation;
					renderGrayscale = VideoOverlayEngine.settings.grayscale;
					settingsMultiplayer = VideoOverlayEngine.settings.player2Enable;
					settingsNavigation = VideoOverlayEngine.settings.navigation;

					// Report
					if (VideoOverlayEngine.settings.player2Enable === true) {
						offscreenCanvasHeightPx = VideoOverlayEngine.report.canvasHeightSplit;
						offscreenCanvasWidthPx = VideoOverlayEngine.report.canvasWidthSplit;
					} else if (player1 === true) {
						offscreenCanvasHeightPx = VideoOverlayEngine.report.canvasHeight;
						offscreenCanvasWidthPx = VideoOverlayEngine.report.canvasWidth;
					} else {
						offscreenCanvasHeightPx = 1;
						offscreenCanvasWidthPx = 1;
					}

					offscreenCanvasHeightPxHalf = (offscreenCanvasHeightPx / 2) | 0;
					offscreenCanvasWidthPxHalf = (offscreenCanvasWidthPx / 2) | 0;

					offscreenCanvas.height = offscreenCanvasHeightPx;
					offscreenCanvas.width = offscreenCanvasWidthPx;

					if (VideoOverlayEngine.settings.antialias === true) {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
					} else {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
					}

					// Cache: compass
					r = Math.max(
						1,
						offscreenCanvasHeightPx * 0.1 * (settingsMultiplayer === true ? 2 : 1),
						offscreenCanvasWidthPx * 0.1 * (settingsMultiplayer === true ? 2 : 1),
					);
					offscreenCanvasCompass.height = r;
					offscreenCanvasCompass.width = offscreenCanvasCompass.height;
					offscreenCanvasCompassRotate.height = offscreenCanvasCompass.width;
					offscreenCanvasCompassRotate.width = offscreenCanvasCompass.height;

					offscreenCanvasCompassContext.fillStyle = '#161616';
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r / 2, r / 2, r * 0.45, 0, GamingCanvasConstPI_2_000); // Base shape and color
					offscreenCanvasCompassContext.clip();
					offscreenCanvasCompassContext.fill();

					offscreenCanvasCompassContext.fillStyle = '#969696';
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r * 0.1, r * 0.1, r * 0.425, 0, GamingCanvasConstPI_2_000); // TL cut away
					offscreenCanvasCompassContext.fill();
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r * 0.9, r * 0.1, r * 0.425, 0, GamingCanvasConstPI_2_000); // TR cut away
					offscreenCanvasCompassContext.fill();
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r * 0.1, r * 0.9, r * 0.425, 0, GamingCanvasConstPI_2_000); // BL cut away
					offscreenCanvasCompassContext.fill();
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r * 0.9, r * 0.9, r * 0.425, 0, GamingCanvasConstPI_2_000); // BR cut away
					offscreenCanvasCompassContext.fill();

					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r / 2, r / 2, r * 0.1, 0, GamingCanvasConstPI_2_000); // Center cut away
					offscreenCanvasCompassContext.fill();

					offscreenCanvasCompassContext.lineWidth = 2;
					offscreenCanvasCompassContext.strokeStyle = '#161616';
					offscreenCanvasCompassContext.beginPath();
					offscreenCanvasCompassContext.arc(r / 2, r / 2, r / 4, 0, GamingCanvasConstPI_2_000); // Inner circle
					offscreenCanvasCompassContext.stroke();

					offscreenCanvasCompassContext.fillStyle = '#161616';
					offscreenCanvasCompassContext.font = `bold ${r * 0.15625}px serif`;
					offscreenCanvasCompassContext.textAlign = 'center';
					offscreenCanvasCompassContext.fillText('N', r / 2, r * 0.1875);
					offscreenCanvasCompassContext.fillText('E', r * 0.875, r * 0.5635);
					offscreenCanvasCompassContext.fillText('W', r * 0.125, r * 0.5635);
					offscreenCanvasCompassContext.fillText('S', r / 2, r * 0.9375);
					offscreenCanvasCompassRotateContext.translate(offscreenCanvasCompass.width / 2, offscreenCanvasCompass.height / 2);

					// Cache: Map
					renderMapViewportWidthPx = Math.max(
						1,
						offscreenCanvasHeightPx * 0.25 * (settingsMultiplayer === true ? 2 : 1),
						offscreenCanvasWidthPx * 0.25 * (settingsMultiplayer === true ? 2 : 1),
					);
					renderMapViewportHeightPx = Math.max(1, ((renderMapViewportWidthPx * 9) / 16) | 0);
					renderMapViewport.applyZ(
						calculationsCamera,
						<GamingCanvasReport>Object.assign({}, VideoOverlayEngine.report, {
							canvasHeight: renderMapViewportHeightPx,
							canvasWidth: renderMapViewportWidthPx,
						}),
					);

					offscreenCanvasMap.height = renderMapViewportHeightPx;
					offscreenCanvasMap.width = renderMapViewportWidthPx;

					offscreenCanvasMapContext.clearRect(0, 0, offscreenCanvasMap.width, offscreenCanvasMap.height);
					offscreenCanvasMapContext.fillStyle = 'red';
					offscreenCanvasMapContext.fillRect(0, 0, offscreenCanvasMap.width, offscreenCanvasMap.height);
				}

				// Background cache
				if (VideoOverlayEngine.reportNew === true || VideoOverlayEngine.settingsNew) {
					VideoOverlayEngine.reportNew = false;
					VideoOverlayEngine.settingsNew = false;
				}

				if (VideoOverlayEngine.reset === true) {
					VideoOverlayEngine.reset = false;

					VideoOverlayEngine.dead = false;
					VideoOverlayEngine.gameover = false;
					VideoOverlayEngine.timers.clearAll();
					VideoOverlayEngine.hitsByTimerId.clear();
					VideoOverlayEngine.hitGradientsByTimerId.clear();
					VideoOverlayEngine.tagRunAndJump = false;

					renderDead = false;
					renderGameOver = false;
					tagRunAndJump = false;
				}

				if (VideoOverlayEngine.tagRunAndJump !== tagRunAndJump) {
					tagRunAndJump = VideoOverlayEngine.tagRunAndJump;
					tagRunAndJumpOptions = VideoOverlayEngine.tagRunAndJumpOptions;
				}

				/*
				 * Render
				 */

				// Render: Lighting
				if (renderGrayscale === true) {
					renderFilter = renderGrayscaleFilter;
				} else {
					renderFilter = renderFilterNone;
				}
				offscreenCanvasContext.filter = renderFilter;

				if (tagRunAndJump === true) {
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
					return;
				}

				if (pause !== true) {
					if (renderDead === true || renderGameOver === true) {
						// Death
						if (renderDeadFadeOut === false || renderGameOver === true) {
							if (timestampNow - renderDeadTimestamp < CalcMainBusPlayerDeadFallDurationInMS / 2) {
								offscreenCanvasContext.fillStyle = 'rgba(225,0,0, 0.01)'; // bright red
							} else {
								offscreenCanvasContext.fillStyle = 'rgba(125,0,0, 0.075)'; // dark red
							}
							for (x = 0; x < offscreenCanvasWidthPx; x += offscreenCanvasWidthPx / 64) {
								for (y = 0; y < offscreenCanvasHeightPx; y += offscreenCanvasWidthPx / 64) {
									if (Math.random() < 0.5) {
										offscreenCanvasContext.fillRect(x, y, offscreenCanvasWidthPx / 64, offscreenCanvasWidthPx / 64);
									}
								}
							}

							if (renderDeadFall === true && timestampNow - renderDeadTimestamp > CalcMainBusPlayerDeadFallDurationInMS) {
								renderDeadFall = false;
								renderDeadTimestamp = timestampNow;
							}

							if (renderDeadFall === false) {
								if (timestampNow - renderDeadTimestamp < CalcMainBusPlayerDeadFadeDurationInMS / 2) {
									offscreenCanvasContext.fillStyle = `rgba(0,0,0,.1)`;
									offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
								} else {
									renderDeadFadeOut = true;
									renderDeadTimestamp = timestampNow;
								}
							}

							offscreenCanvasContext.fillStyle = 'white';
							if (VideoOverlayEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 15}px serif`;
							} else {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 6}px serif`;
							}
							offscreenCanvasContext.textAlign = 'center';

							if (renderGameOver === true) {
								offscreenCanvasContext.fillText('Game Over', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 2);
							} else {
								offscreenCanvasContext.fillText('You Died', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 2.5);
							}
						} else {
							offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

							offscreenCanvasContext.fillStyle = `rgba(0,0,0,${1 - (timestampNow - renderDeadTimestamp) / (CalcMainBusPlayerDeadFadeDurationInMS / 2)})`;
							offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
						}
					} else {
						offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

						// Hit
						for ([timerId, hitAngle] of hitsByTimerId.entries()) {
							// Gradient
							renderGradient = <CanvasGradient>hitGradientsByTimerId.get(timerId);
							if (renderGradient === undefined) {
								renderGradient = offscreenCanvasContext.createLinearGradient(
									offscreenCanvasWidthPxHalf,
									offscreenCanvasHeightPxHalf,
									offscreenCanvasWidthPxHalf - offscreenCanvasWidthPx * 0.875 * Math.cos(hitAngle - GamingCanvasConstPI_0_500),
									offscreenCanvasHeightPxHalf - offscreenCanvasHeightPx * -Math.sin(hitAngle - GamingCanvasConstPI_0_500),
								);

								renderGradient.addColorStop(0, 'transparent');
								renderGradient.addColorStop(0.25, 'transparent');
								renderGradient.addColorStop(0.75, '#e10000'); // bright red
								// renderGradient.addColorStop(0.875, '#bd0000'); // medium red
								renderGradient.addColorStop(1, '#7d0000'); // dark red

								hitGradientsByTimerId.set(timerId, renderGradient);
							}

							// Render
							offscreenCanvasContext.globalAlpha = (timers.getTimeRemaining(timerId) || 0) / CalcMainBusPlayerHitDurationInMS;
							offscreenCanvasContext.fillStyle = renderGradient;
							offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
						}
						offscreenCanvasContext.globalAlpha = 1;

						// Key Required
						renderLockedDelta = timestampUnix - renderLockedTimestampUnix;
						if (renderLockedDelta < 3000) {
							if (renderLockedDelta < 1000) {
								offscreenCanvasContext.globalAlpha = renderLockedDelta / 1000;
							} else if (renderLockedDelta > 2000) {
								offscreenCanvasContext.globalAlpha = (3000 - renderLockedDelta) / 1000;
							} else {
								offscreenCanvasContext.globalAlpha = 1;
							}

							offscreenCanvasContext.fillStyle = 'white';
							if (VideoOverlayEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 15}px serif`;
							} else {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 6}px serif`;
							}
							offscreenCanvasContext.textAlign = 'center';

							offscreenCanvasContext.fillText(
								`Key ${renderLocked[0]}${renderLocked.length === 2 ? ' and ' + renderLocked[1] : ''}`,
								offscreenCanvasWidthPx / 2,
								offscreenCanvasHeightPx / 5,
							);
							offscreenCanvasContext.fillText('Required', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 3);

							offscreenCanvasContext.globalAlpha = 1;
						}
					}
				}

				if (settingsNavigation === Navigation.COMPASS) {
					// Rotation
					r = GamingCanvasConstPI_1_500 + calculationsCamera.r;

					offscreenCanvasCompassRotateContext.clearRect(0, 0, offscreenCanvasCompass.width, offscreenCanvasCompass.height);
					offscreenCanvasCompassRotateContext.rotate(r);
					offscreenCanvasCompassRotateContext.drawImage(
						offscreenCanvasCompass,
						-offscreenCanvasCompass.width / 2,
						-offscreenCanvasCompass.height / 2,
					);
					offscreenCanvasCompassRotateContext.rotate(-r);

					// Placement
					if (orientation === GamingCanvasOrientation.PORTRAIT) {
						y = player1 === true ? 65 : 0;
					} else {
						y = 0;
					}

					// Draw
					offscreenCanvasContext.globalAlpha = 0.6;
					offscreenCanvasContext.drawImage(
						offscreenCanvasCompassRotate,
						offscreenCanvasWidthPx - offscreenCanvasCompassRotate.width * 1.125,
						offscreenCanvasHeightPx - offscreenCanvasCompassRotate.height * 1.125 - y,
						offscreenCanvasCompassRotate.width,
						offscreenCanvasCompassRotate.height,
					);
					offscreenCanvasContext.globalAlpha = 1;
				} else if (settingsNavigation === Navigation.MAP) {
					offscreenCanvasContext.drawImage(
						offscreenCanvasMap,
						offscreenCanvasWidthPx - offscreenCanvasMap.width * 1.125,
						offscreenCanvasMap.width * 0.125,
						offscreenCanvasMap.width,
						offscreenCanvasMap.height,
					);
				}
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				// Output
				VideoOverlayEngine.post([
					{
						cmd: VideoOverlayBusOutputCmd.STATS,
						data: {
							fps: frameCount,
						},
					},
				]);
				frameCount = 0;
			}
		};
		VideoOverlayEngine.go = go;
	}
}
