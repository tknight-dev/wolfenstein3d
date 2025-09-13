import { assetsImages, AssetIdImg, assetLoaderImage, AssetPropertiesImage, initializeAssetManager } from '../../asset-manager.js';
import { GamingCanvasConstPI, GamingCanvasConstPIDouble, GamingCanvasConstPIHalf, GamingCanvasReport, GamingCanvasUtilScale } from '@tknight-dev/gaming-canvas';
import {
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

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoMainBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoMainBusInputCmd.CALCULATIONS:
			VideoMainEngine.inputCalculations(<VideoMainBusInputDataCalculations>payload.data);
			break;
		case VideoMainBusInputCmd.INIT:
			VideoMainEngine.initialize(<VideoMainBusInputDataInit>payload.data);
			break;
		case VideoMainBusInputCmd.MAP:
			VideoMainEngine.inputMap(<GameMap>payload.data);
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
	private static assets: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static assetsInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = new Map();
	private static calculations: VideoMainBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
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
			assetId: AssetIdImg,
			assetProperties: AssetPropertiesImage,
			assetsLoaded: Map<AssetIdImg, ImageBitmap> = <Map<AssetIdImg, ImageBitmap>>await assetLoaderImage();

		for ([assetId, assetData] of assetsLoaded) {
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
			VideoMainEngine.assets.set(assetId, assetCanvas);

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
			VideoMainEngine.assetsInvertHorizontal.set(assetId, assetCanvas);
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
		VideoMainEngine.gameMap = data.gameMap;
		VideoMainEngine.gameMap.grid = GamingCanvasGridUint16Array.from(<Uint16Array>data.gameMap.grid.data);
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

	public static inputCalculations(data: VideoMainBusInputDataCalculations): void {
		VideoMainEngine.calculations = data;

		// Last
		VideoMainEngine.calculationsNew = true;
	}

	public static inputMap(data: GameMap): void {
		data.grid = GamingCanvasGridUint16Array.from(data.grid.data);

		VideoMainEngine.gameMap = data;
		VideoMainEngine.gameMapNew = true;
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
		let asset: OffscreenCanvas,
			assets: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assets,
			renderAssets: Map<AssetIdImg, OffscreenCanvas>,
			assetsInvertHorizontal: Map<AssetIdImg, OffscreenCanvas> = VideoMainEngine.assetsInvertHorizontal,
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
			i: number,
			player1: boolean = VideoMainEngine.player1,
			renderAssetId: number,
			renderBrightness: number,
			renderCellSide: GamingCanvasGridRaycastCellSide,
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
			renderSpriteFixedNS: boolean,
			renderSpriteXFactor: number,
			renderSpriteXFactor2: number,
			renderWallHeight: number,
			renderWallHeight2: number,
			renderWallHeightFactored: number,
			renderWallHeightHalf: number,
			renderWallHeightFactor: number,
			settingsFOV: number = VideoMainEngine.settings.fov,
			settingsFPMS: number = 1000 / VideoMainEngine.settings.fps,
			settingsPlayer2Enable: boolean = VideoMainEngine.settings.player2Enable,
			settingsRaycastQuality: RaycastQuality = VideoMainEngine.settings.raycastQuality,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
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

					gameMapGridData = <Uint16Array>VideoMainEngine.gameMap.grid.data;
					gameMapGridSideLength = VideoMainEngine.gameMap.grid.sideLength;
				}

				if (VideoMainEngine.reportNew === true || VideoMainEngine.settingsNew === true) {
					// Settings
					((settingsFOV = VideoMainEngine.settings.fov), (settingsFPMS = 1000 / VideoMainEngine.settings.fps));
					renderGamma = VideoMainEngine.settings.gamma;
					renderGrayscale = VideoMainEngine.settings.grayscale;
					renderLightingQuality = VideoMainEngine.settings.lightingQuality;
					settingsPlayer2Enable = VideoMainEngine.settings.player2Enable;
					settingsRaycastQuality = VideoMainEngine.settings.raycastQuality;

					offscreenCanvasContext.imageSmoothingEnabled = VideoMainEngine.settings.antialias === true;
					setTimeout(() => {
						offscreenCanvasContext.imageSmoothingEnabled = VideoMainEngine.settings.antialias === true;
					}, 100);

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
					if (renderRayDistanceMapInstance.ray !== undefined) {
						renderRayIndex = renderRayDistanceMapInstance.ray;
						gameMapGridIndex = calculationsRays[renderRayIndex + 3];

						// Render: Modification based on cell sidedness
						switch (calculationsRays[renderRayIndex + 5]) {
							case GamingCanvasGridRaycastCellSide.EAST:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex + gameMapGridSideLength];
								renderAssets = assetsInvertHorizontal;
								renderGlobalShadow = true;
								break;
							case GamingCanvasGridRaycastCellSide.NORTH:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex - 1];
								renderAssets = assetsInvertHorizontal;
								renderGlobalShadow = false;
								break;
							case GamingCanvasGridRaycastCellSide.SOUTH:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex + 1];
								renderAssets = assets;
								renderGlobalShadow = false;
								break;
							case GamingCanvasGridRaycastCellSide.WEST:
								gameMapGridCell2 = gameMapGridData[gameMapGridIndex - gameMapGridSideLength];
								renderAssets = assets;
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
						renderWallHeight = (offscreenCanvasHeightPx / calculationsRays[renderRayIndex + 2]) * renderWallHeightFactor;
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
							calculationsRays[renderRayIndex + 4] * (asset.width - 1), // (x-source) Specific how far from the left to draw from the test image
							0, // (y-source) Start at the bottom of the image (y pixel)
							1, // (width-source) Slice 1 pixel wide
							asset.height, // (height-source) height of our test image
							((renderRayIndex + 5) * settingsRaycastQuality) / 6, // (x-destination) Draw sliced image at pixel (6 elements per ray)
							(offscreenCanvasHeightPxHalf - renderWallHeightHalf) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
							settingsRaycastQuality, // (width-destination) Draw the sliced image as 1 pixel wide (2 covers gaps between rays)
							renderWallHeightFactored, // (height-destination) Draw the sliced image as tall as the wall height
						);
					}

					/**
					 * Draw: Sprites
					 */
					if (renderRayDistanceMapInstance.cell !== undefined) {
						gameMapGridIndex = renderRayDistanceMapInstance.cell;
						gameMapGridCell = gameMapGridData[gameMapGridIndex];

						// Not sprites
						if (gameMapGridCell === GameGridCellMasksAndValues.NULL || gameMapGridCell === GameGridCellMasksAndValues.FLOOR) {
							continue;
						}

						/**
						 * Draw: Sprites - Fixed
						 */
						if ((gameMapGridCell & gameGridCellMaskSpriteFixed) !== 0) {
							// Asset
							asset = assets.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;
							offscreenCanvasContext.filter = 'none';
							renderSpriteFixedNS = (gameMapGridCell & GameGridCellMasksAndValues.SPRITE_FIXED_NS) !== 0;

							// Calc: Position
							y = gameMapGridIndex % gameMapGridSideLength;
							x = (gameMapGridIndex - y) / gameMapGridSideLength - calculationsCamera.x;
							y -= calculationsCamera.y;

							/**
							 * Position 1
							 */
							x += renderSpriteFixedNS === true ? 0.5 : 0; // 0.5 is center
							y += renderSpriteFixedNS === true ? 0 : 0.5; // 0.5 is center

							// Calc: Distance
							renderDistance = (x * x + y * y) ** 0.5;

							// Calc: Height
							renderSpriteFixedCoordinates[1] = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;

							// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
							renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - (Math.atan2(-y, x) + GamingCanvasConstPIHalf);

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
							x += renderSpriteFixedNS === true ? 0 : 1;
							y += renderSpriteFixedNS === true ? 1 : 0;

							// Calc: Distance
							renderDistance2 = (x * x + y * y) ** 0.5;

							// Calc: Height
							renderSpriteFixedCoordinates[3] = (offscreenCanvasHeightPx / renderDistance2) * renderWallHeightFactor;

							// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
							renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - (Math.atan2(-y, x) + GamingCanvasConstPIHalf);

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

								if (renderLightingQuality === LightingQuality.FULL) {
									renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light
								}

								// Filter: End
								offscreenCanvasContext.filter = `brightness(${Math.max(0, Math.min(2, renderGamma + renderBrightness))}) ${renderGrayscale === true ? renderGrayscaleFilter : ''}`;
							}

							/**
							 * Render images between coordinates
							 */
							x = renderSpriteFixedCoordinates[0] - renderSpriteFixedCoordinates[2];
							y = renderSpriteFixedCoordinates[1] - renderSpriteFixedCoordinates[3];

							// Calc: Width of sprite in pixels
							renderDistance = ((x * x + y * y) ** 0.5) | 0;
							// renderDistance = Math.min(offscreenCanvasWidthPx, renderDistance);

							// y = Math.max(1, renderDistance / asset.width) | 0; // Vines have graphical issue with this optimization

							for (i = 0; i < renderDistance; i++) {
								x = i / renderDistance; // Determine percentage of left to right

								// Calc: Height
								renderWallHeight = GamingCanvasUtilScale(x, 0, 1, renderSpriteFixedCoordinates[1], renderSpriteFixedCoordinates[3]);
								// renderWallHeight = Math.min(offscreenCanvasHeightPx, renderWallHeight);

								// Render: 3D Projection
								offscreenCanvasContext.drawImage(
									asset, // (image) Draw from our test image
									x * asset.width, // (x-source) Specific how far from the left to draw from the test image
									0, // (y-source) Start at the bottom of the image (y pixel)
									1, // (width-source) Slice 1 pixel wide
									asset.height, // (height-source) height of our test image
									GamingCanvasUtilScale(x, 0, 1, renderSpriteFixedCoordinates[0], renderSpriteFixedCoordinates[2]), // (x-destination) Draw sliced image at pixel
									(offscreenCanvasHeightPxHalf - renderWallHeight / 2) / renderHeightFactor + renderHeightOffset, // (y-destination) how far off the ground to start drawing
									2, // (width-destination) Draw the sliced image as 1 pixel wide
									renderWallHeight / renderHeightFactor, // (height-destination) Draw the sliced image as tall as the wall height
								);
							}
						} else {
							/**
							 * Draw: Sprites - Rotating
							 */
							asset = assets.get(gameMapGridCell & GameGridCellMasksAndValues.ID_MASK) || renderImageTest;

							// Calc: Position
							y = gameMapGridIndex % gameMapGridSideLength;
							x = (gameMapGridIndex - y) / gameMapGridSideLength - calculationsCamera.x + 0.5; // 0.5 is center
							y -= calculationsCamera.y - 0.5; // 0.5 is center

							// Calc: Distance
							renderDistance = (x * x + y * y) ** 0.5;

							// Calc: Height
							renderWallHeight = (offscreenCanvasHeightPx / renderDistance) * renderWallHeightFactor;
							renderWallHeightFactored = renderWallHeight / renderHeightFactor;
							renderWallHeightHalf = renderWallHeight / 2;

							// Calc: x (canvas pixel based on camera.r, fov, and sprite position)
							renderSpriteXFactor = calculationsCamera.r + settingsFOV / 2 - (Math.atan2(-y, x) + GamingCanvasConstPIHalf);

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

								if (renderLightingQuality === LightingQuality.FULL) {
									renderBrightness -= Math.min(0.75, renderDistance / 20); // no min is lantern light
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
