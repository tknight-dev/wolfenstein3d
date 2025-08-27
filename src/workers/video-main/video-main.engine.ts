import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusInputPayload,
	VideoMainBusOutputCmd,
	VideoMainBusOutputPayload,
} from './video-main.model';

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
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settingsFPMS: number;
	private static settingsNew: boolean;

	public static initialize(data: VideoMainBusInputDataInit): void {
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
		VideoMainEngine.report = report;

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
		// let canvasOffscreen: OffscreenCanvas = VideoMainEngine.canvasOffscreen,
		// 	canvasOffscreenContext: OffscreenCanvasRenderingContext2D = VideoMainEngine.canvasOffscreenContext,
		// 	fpms: number = VideoMainEngine.settingsFPMS,
		// 	frameCount: number = 0,
		// 	timestampDelta: number,
		// 	timestampFPS: number = 0,
		// 	timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoMainEngine.request = requestAnimationFrame(VideoMainEngine.go);
		};
		VideoMainEngine.go = go;
	}
}
