import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameGridCellMaskAndValues, GameMap } from '../../models/game.model.js';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataCalculations,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusInputPayload,
	VideoMainBusOutputCmd,
	VideoMainBusOutputPayload,
} from './video-main.model.js';
import { GamingCanvasUtilScale } from '@tknight-dev/gaming-canvas';
import { GamingCanvasGridCamera, GamingCanvasGridRaycast3DProjectionTestImageCreate, GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

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
		case VideoMainBusInputCmd.REPORT:
			VideoMainEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoMainBusInputCmd.SETTINGS:
			VideoMainEngine.inputSettings(<VideoMainBusInputDataSettings>payload.data);
			break;
	}
};

class VideoMainEngine {
	private static calculations: VideoMainBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static gameMap: GameMap;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoMainBusInputDataSettings;
	private static settingsNew: boolean;

	public static initialize(data: VideoMainBusInputDataInit): void {
		// Config
		VideoMainEngine.gameMap = data.gameMap;
		VideoMainEngine.gameMap.grid = GamingCanvasGridUint16Array.from(data.gameMap.grid.data);

		// Config: Canvas
		VideoMainEngine.offscreenCanvas = data.offscreenCanvas;
		VideoMainEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: false,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Report
		VideoMainEngine.inputCalculations({
			camera: data.camera,
			rays: new Float32Array(),
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
		let calculationsCamera: GamingCanvasGridCamera = GamingCanvasGridCamera.from(VideoMainEngine.calculations.camera),
			calculationsRays: Float32Array = VideoMainEngine.calculations.rays,
			offscreenCanvas: OffscreenCanvas = VideoMainEngine.offscreenCanvas,
			offscreenCanvasHeightPx: number = VideoMainEngine.report.canvasHeight,
			offscreenCanvasHeightPxHalf: number = offscreenCanvasHeightPx / 2,
			offscreenCanvasWidthPx: number = VideoMainEngine.report.canvasWidth,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.offscreenCanvasContext,
			testImage: OffscreenCanvas = GamingCanvasGridRaycast3DProjectionTestImageCreate(64),
			frameCount: number = 0,
			gameMap: GameMap = VideoMainEngine.gameMap,
			i: number,
			renderPixel: number,
			renderWallHeight: number,
			settingsFPMS: number = 1000 / VideoMainEngine.settings.fps,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				frameCount++;

				if (VideoMainEngine.calculationsNew === true) {
					VideoMainEngine.calculationsNew = false;

					calculationsCamera.decode(VideoMainEngine.calculations.camera);
					calculationsRays = VideoMainEngine.calculations.rays;
				}

				if (VideoMainEngine.reportNew === true) {
					VideoMainEngine.reportNew = false;

					// This isn't necessary when you are using a fixed resolution
					offscreenCanvasHeightPx = VideoMainEngine.report.canvasHeight;
					offscreenCanvasHeightPxHalf = offscreenCanvasHeightPx / 2;
					offscreenCanvasWidthPx = VideoMainEngine.report.canvasWidth;

					offscreenCanvas.height = offscreenCanvasHeightPx;
					offscreenCanvas.width = offscreenCanvasWidthPx;
				}

				if (VideoMainEngine.settingsNew === true) {
					VideoMainEngine.settingsNew = false;

					settingsFPMS = 1000 / VideoMainEngine.settings.fps;
				}

				// 3D project rays
				if (calculationsRays !== undefined) {
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

					for (i = 0, renderPixel = 0; i < calculationsRays.length; i += 4, renderPixel++) {
						renderWallHeight = (offscreenCanvasHeightPx / calculationsRays[i + 2]) * 1.5;

						offscreenCanvasContext.drawImage(
							testImage, // (image) Draw from our test image
							calculationsRays[i + 3] * (testImage.width - 1), // (x-source) Specific how far from the left to draw from the test image
							0, // (y-source) Start at the bottom of the image (y pixel)
							1, // (width-source) Slice 1 pixel wide
							testImage.height, // (height-source) height of our test image
							renderPixel, // (x-destination) Draw sliced image at pixel
							offscreenCanvasHeightPxHalf - renderWallHeight / 2, // (y-destination) how far off the ground to start drawing
							1, // (width-destination) Draw the sliced image as 1 pixel wide
							renderWallHeight, // (height-destination) Draw the sliced image as tall as the wall height
						);
					}
				}
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
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
