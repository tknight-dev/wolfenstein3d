import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { Camera, CameraEncode } from '../../models/camera.model';
import { GameMap } from '../../models/game.model';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataCalculations,
	VideoMainBusInputDataSettings,
	VideoMainBusOutputCmd,
	VideoMainBusOutputDataStats,
	VideoMainBusOutputPayload,
} from './video-main.model';

/**
 * @author tknight-dev
 */

export class VideoMainBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: VideoMainBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(
		camera: Camera,
		canvas: HTMLCanvasElement,
		gameMap: GameMap,
		settings: VideoMainBusInputDataSettings,
		callback: (status: boolean) => void,
	): void {
		VideoMainBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			VideoMainBus.worker = new Worker(new URL('./video-main.engine.mjs', import.meta.url), {
				name: 'VideoMainEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			VideoMainBus.input();

			// Init the webworker
			const cameraEncoded: Float32Array = CameraEncode(camera);
			const offscreenCanvas: OffscreenCanvas = canvas.transferControlToOffscreen();
			VideoMainBus.worker.postMessage(
				{
					cmd: VideoMainBusInputCmd.INIT,
					data: Object.assign(
						{
							camera: cameraEncoded,
							gameMap: gameMap,
							offscreenCanvas: offscreenCanvas,
							report: GamingCanvas.getReport(),
						},
						settings,
					),
				},
				[cameraEncoded.buffer, offscreenCanvas],
			);
		} else {
			alert('Web Workers are not supported by your browser');
			VideoMainBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: VideoMainBusOutputPayload, payloads: VideoMainBusOutputPayload[];

		VideoMainBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case VideoMainBusOutputCmd.INIT_COMPLETE:
						VideoMainBus.callbackInitComplete(<boolean>payload.data);
						break;
					case VideoMainBusOutputCmd.STATS:
						VideoMainBus.callbackStats(<VideoMainBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputCalculations(data: VideoMainBusInputDataCalculations): void {
		VideoMainBus.worker.postMessage(
			{
				cmd: VideoMainBusInputCmd.CALCULATIONS,
				data: data,
			},
			[data.camera.buffer, data.rays.buffer],
		);
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		VideoMainBus.worker.postMessage({
			cmd: VideoMainBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: VideoMainBusInputDataSettings): void {
		VideoMainBus.worker.postMessage({
			cmd: VideoMainBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackStats(callbackStats: (data: VideoMainBusOutputDataStats) => void): void {
		VideoMainBus.callbackStats = callbackStats;
	}
}
