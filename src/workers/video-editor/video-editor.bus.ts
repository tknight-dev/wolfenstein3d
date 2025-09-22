import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCalculations,
	VideoEditorBusInputDataSettings,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputDataStats,
	VideoEditorBusOutputPayload,
} from './video-editor.model.js';
import { GamingCanvasGridCamera, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

export class VideoEditorBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: VideoEditorBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(
		canvas: HTMLCanvasElement,
		gameMap: GameMap,
		settings: VideoEditorBusInputDataSettings,
		viewport: GamingCanvasGridViewport,
		callback: (status: boolean) => void,
	): void {
		VideoEditorBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			VideoEditorBus.worker = new Worker(new URL('./video-editor.engine.mjs', import.meta.url), {
				name: 'VideoEditorEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			VideoEditorBus.input();

			// Init the webworker
			const cameraEncoded: Float64Array = GamingCanvasGridCamera.encodeSingle(gameMap.position);
			const offscreenCanvas: OffscreenCanvas = canvas.transferControlToOffscreen();
			const viewportEncoded: Float64Array = viewport.encode();
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.INIT,
					data: Object.assign(
						{
							camera: cameraEncoded,
							gameMap: gameMap,
							offscreenCanvas: offscreenCanvas,
							rays: new Float64Array(),
							report: GamingCanvas.getReport(),
							viewport: viewportEncoded,
						},
						settings,
					),
				},
				[cameraEncoded.buffer, offscreenCanvas, viewportEncoded.buffer],
			);
		} else {
			alert('Web Workers are not supported by your browser');
			VideoEditorBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: VideoEditorBusOutputPayload, payloads: VideoEditorBusOutputPayload[];

		VideoEditorBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case VideoEditorBusOutputCmd.INIT_COMPLETE:
						VideoEditorBus.callbackInitComplete(<boolean>payload.data);
						break;
					case VideoEditorBusOutputCmd.STATS:
						VideoEditorBus.callbackStats(<VideoEditorBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputCalculations(data: VideoEditorBusInputDataCalculations): void {
		let buffers: ArrayBufferLike[] = [];

		data.player1Camera !== undefined && buffers.push(data.player1Camera.buffer);
		data.player2Camera !== undefined && buffers.push(data.player2Camera.buffer);

		if (data.viewport !== undefined) {
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.CALCULATIONS,
					data: data,
				},
				[data.camera.buffer, data.viewport.buffer, ...buffers],
			);
		} else {
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.CALCULATIONS,
					data: data,
				},
				[data.camera.buffer, ...buffers],
			);
		}
	}

	public static outputEnable(enable: boolean): void {
		VideoEditorBus.worker.postMessage({
			cmd: VideoEditorBusInputCmd.ENABLE,
			data: enable,
		});
	}

	public static outputMap(data: GameMap): void {
		VideoEditorBus.worker.postMessage({
			cmd: VideoEditorBusInputCmd.MAP,
			data: data,
		});
	}

	public static outputNPCUpdate(data: Float32Array[]): void {
		VideoEditorBus.worker.postMessage(
			{
				cmd: VideoEditorBusInputCmd.NPC_UPDATE,
				data: data,
			},
			data.map((array: Float32Array) => array.buffer),
		);
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		VideoEditorBus.worker.postMessage({
			cmd: VideoEditorBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: VideoEditorBusInputDataSettings): void {
		VideoEditorBus.worker.postMessage({
			cmd: VideoEditorBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackStats(callbackStats: (data: VideoEditorBusOutputDataStats) => void): void {
		VideoEditorBus.callbackStats = callbackStats;
	}
}
