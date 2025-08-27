import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataInit,
	VideoEditorBusInputDataSettings,
	VideoEditorBusInputPayload,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputPayload,
} from './video-editor.model';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoEditorBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoEditorBusInputCmd.INIT:
			VideoEditorEngine.initialize(<VideoEditorBusInputDataInit>payload.data);
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
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settingsFPMS: number;
	private static settingsNew: boolean;

	public static initialize(data: VideoEditorBusInputDataInit): void {
		// Config: Canvas
		VideoEditorEngine.offscreenCanvas = data.offscreenCanvas;
		VideoEditorEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

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

	public static inputReport(report: GamingCanvasReport): void {
		VideoEditorEngine.report = report;

		// Last
		VideoEditorEngine.reportNew = true;
	}

	public static inputSettings(data: VideoEditorBusInputDataSettings): void {
		VideoEditorEngine.settingsFPMS = 1000 / data.fps;

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
		let fpms: number = VideoEditorEngine.settingsFPMS,
			offscreenCanvas: OffscreenCanvas = VideoEditorEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoEditorEngine.offscreenCanvasContext,
			frameCount: number = 0,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoEditorEngine.request = requestAnimationFrame(VideoEditorEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);
				frameCount++;

				if (VideoEditorEngine.reportNew === true) {
					VideoEditorEngine.reportNew = false;

					// This isn't necessary when you are using a fixed resolution
					offscreenCanvas.height = VideoEditorEngine.report.canvasHeight;
					offscreenCanvas.width = VideoEditorEngine.report.canvasWidth;
				}

				if (VideoEditorEngine.settingsNew === true) {
					VideoEditorEngine.settingsNew = false;

					fpms = VideoEditorEngine.settingsFPMS;
				}

				// Your code Here
				offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
				offscreenCanvasContext.fillStyle = 'red';
				offscreenCanvasContext.font = '48px serif';
				offscreenCanvasContext.fillText('Video: Editor', 5, 100);
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
