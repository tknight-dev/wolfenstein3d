import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { Camera, CameraEncode } from '../../models/camera.model';
import { GameMap } from '../../models/game.model';
import { Viewport } from '../../models/viewport.model';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCalculations,
	VideoEditorBusInputDataSettings,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputDataStats,
	VideoEditorBusOutputPayload,
} from './video-editor.model';
import { CharacterPosition, CharacterPositionEncode } from '../../models/character.model';

/**
 * @author tknight-dev
 */

export class VideoEditorBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: VideoEditorBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(
		camera: Camera,
		canvas: HTMLCanvasElement,
		gameMap: GameMap,
		settings: VideoEditorBusInputDataSettings,
		viewport: Viewport,
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
			const cameraEncoded: Float32Array = CameraEncode(camera);
			const characterPositionEncoded: Float32Array = CharacterPositionEncode({
				dataIndex: (camera.x | 0) * gameMap.dataWidth + (camera.y | 0),
				r: camera.r,
				x: camera.x,
				y: camera.y,
			});
			const offscreenCanvas: OffscreenCanvas = canvas.transferControlToOffscreen();
			const viewportEncoded: Float32Array = viewport.encode();
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.INIT,
					data: Object.assign(
						{
							camera: cameraEncoded,
							characterPosition: characterPositionEncoded,
							gameMap: gameMap,
							offscreenCanvas: offscreenCanvas,
							rays: new Float32Array(),
							report: GamingCanvas.getReport(),
							viewport: viewportEncoded,
						},
						settings,
					),
				},
				[cameraEncoded.buffer, characterPositionEncoded.buffer, offscreenCanvas, viewportEncoded.buffer],
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
		if (data.viewport !== undefined) {
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.CALCULATIONS,
					data: data,
				},
				[data.camera.buffer, data.rays.buffer, data.viewport.buffer],
			);
		} else {
			VideoEditorBus.worker.postMessage(
				{
					cmd: VideoEditorBusInputCmd.CALCULATIONS,
					data: data,
				},
				[data.camera.buffer, data.rays.buffer],
			);
		}
	}

	public static outputDataSegment(data: Map<number, number>): void {
		VideoEditorBus.worker.postMessage({
			cmd: VideoEditorBusInputCmd.DATA_SEGMENT,
			data: data,
		});
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
