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
import { GamingCanvasGridCamera, GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

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
	private static calculationsCamera: Float32Array;
	private static calculationsRays: Float32Array;
	private static calculationsNew: boolean;
	private static gameMap: GameMap;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static reportHeightPx: number;
	private static reportWidthPx: number;
	private static reportNew: boolean;
	private static request: number;
	private static settingsFPMS: number;
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
		VideoMainEngine.calculationsCamera = data.camera;
		VideoMainEngine.calculationsRays = data.rays;

		// Last
		VideoMainEngine.calculationsNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoMainEngine.reportHeightPx = report.canvasHeight;
		VideoMainEngine.reportWidthPx = report.canvasWidth;

		// Last
		VideoMainEngine.reportNew = true;
	}

	public static inputSettings(data: VideoMainBusInputDataSettings): void {
		VideoMainEngine.settingsFPMS = 1000 / data.fps;

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
		let camera: GamingCanvasGridCamera = GamingCanvasGridCamera.from(VideoMainEngine.calculationsCamera),
			fpms: number = VideoMainEngine.settingsFPMS,
			offscreenCanvas: OffscreenCanvas = VideoMainEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.offscreenCanvasContext,
			offscreenCanvasImage: OffscreenCanvas = new OffscreenCanvas(64, 64),
			offscreenCanvasImageContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>offscreenCanvasImage.getContext('2d'),
			frameCount: number = 0,
			rays: Float32Array,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);
				frameCount++;

				if (VideoMainEngine.calculationsNew === true) {
					VideoMainEngine.calculationsNew = false;

					camera.decode(VideoMainEngine.calculationsCamera);
					rays = VideoMainEngine.calculationsRays;
				}

				if (VideoMainEngine.reportNew === true) {
					VideoMainEngine.reportNew = false;

					// This isn't necessary when you are using a fixed resolution
					offscreenCanvas.height = VideoMainEngine.reportHeightPx;
					offscreenCanvas.width = VideoMainEngine.reportWidthPx;

					offscreenCanvasImageContext.clearRect(0, 0, offscreenCanvasImage.width, offscreenCanvasImage.height);
					offscreenCanvasImageContext.fillStyle = 'grey';
					offscreenCanvasImageContext.fillRect(0, 0, 64, 64);

					offscreenCanvasImageContext.fillStyle = 'red';
					offscreenCanvasImageContext.fillRect(0, 0, 32, 32);

					offscreenCanvasImageContext.fillStyle = 'blue';
					offscreenCanvasImageContext.fillRect(32, 32, 32, 32);

					offscreenCanvasImageContext.fillStyle = 'green';
					offscreenCanvasImageContext.beginPath();
					offscreenCanvasImageContext.arc(32, 32, 16, 0, 2 * Math.PI);
					offscreenCanvasImageContext.closePath();
					offscreenCanvasImageContext.fill();
				}

				if (VideoMainEngine.settingsNew === true) {
					VideoMainEngine.settingsNew = false;

					fpms = VideoMainEngine.settingsFPMS;
				}

				// Your code Here
				if (rays !== undefined) {
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

					for (let i = 0, j = 0; i < rays.length; i += 4, j++) {
						let wallHeight = (offscreenCanvas.height / rays[i + 2]) * 1.5;
						let color: number = GamingCanvasUtilScale(wallHeight, 0, offscreenCanvas.height, 20, 200);

						// offscreenCanvasContext.fillStyle = `rgb(${color}, ${color}, ${colsaor})`;
						// offscreenCanvasContext.fillRect(j, offscreenCanvas.height / 2 - wallHeight / 2, 1, wallHeight);

						offscreenCanvasContext.drawImage(
							offscreenCanvasImage,
							GamingCanvasUtilScale(rays[i + 3], 0, 1, 0, 63),
							0,
							1,
							64,
							j,
							offscreenCanvas.height / 2 - wallHeight / 2,
							1,
							wallHeight,
						);
					}
				}

				// offscreenCanvasContext.fillStyle = 'red';
				// offscreenCanvasContext.font = '48px serif';
				// offscreenCanvasContext.fillText('Video: Main', 5, 50);
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
