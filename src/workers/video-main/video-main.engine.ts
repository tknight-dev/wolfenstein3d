import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusInputPayload,
	VideoMainBusOutputCmd,
	VideoMainBusOutputPayload,
} from './video-main.model';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoMainBusInputPayload = event.data;

	switch (payload.cmd) {
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
		let fpms: number = VideoMainEngine.settingsFPMS,
			offscreenCanvas: OffscreenCanvas = VideoMainEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.offscreenCanvasContext,
			frameCount: number = 0,
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

				if (VideoMainEngine.reportNew === true) {
					VideoMainEngine.reportNew = false;

					// This isn't necessary when you are using a fixed resolution
					offscreenCanvas.height = VideoMainEngine.reportHeightPx;
					offscreenCanvas.width = VideoMainEngine.reportWidthPx;
				}

				if (VideoMainEngine.settingsNew === true) {
					VideoMainEngine.settingsNew = false;

					fpms = VideoMainEngine.settingsFPMS;
				}

				// Your code Here
				offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
				offscreenCanvasContext.fillStyle = 'red';
				offscreenCanvasContext.font = '48px serif';
				offscreenCanvasContext.fillText('Video: Main', 5, 50);
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
