import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import {
	VideoMainBusInputCmd,
	VideoMainBusInputDataCalculations,
	VideoMainBusInputDataInit,
	VideoMainBusInputDataSettings,
	VideoMainBusOutputCmd,
	VideoMainBusOutputDataStats,
	VideoMainBusOutputPayload,
} from './video-main.model.js';
import { GamingCanvasGridCamera } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

export class VideoMainBus {
	private static callbackInitComplete: (player1: boolean, status: boolean) => void;
	private static callbackStats: (player1: boolean, data: VideoMainBusOutputDataStats) => void;
	private static workerPlayer1: Worker;
	private static workerPlayer2: Worker;

	public static initialize(
		camera: GamingCanvasGridCamera,
		canvasPlayer1: HTMLCanvasElement,
		canvasPlayer2: HTMLCanvasElement,
		gameMap: GameMap,
		settings: VideoMainBusInputDataSettings,
		callback: (status: boolean) => void,
	): void {
		VideoMainBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			VideoMainBus.workerPlayer1 = new Worker(new URL('./video-main.engine.mjs', import.meta.url), {
				name: 'VideoMainEnginePlayer1',
				type: 'module', // ESM
			});
			VideoMainBus.workerPlayer2 = new Worker(new URL('./video-main.engine.mjs', import.meta.url), {
				name: 'VideoMainEnginePlayer2',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			VideoMainBus.input(VideoMainBus.workerPlayer1, true);
			VideoMainBus.input(VideoMainBus.workerPlayer2, false);

			// Payload
			const offscreenCanvasPlayer1: OffscreenCanvas = canvasPlayer1.transferControlToOffscreen();
			const offscreenCanvasPlayer2: OffscreenCanvas = canvasPlayer2.transferControlToOffscreen();

			const payload: VideoMainBusInputDataInit = <VideoMainBusInputDataInit>Object.assign(
				{
					gameMap: gameMap,
					player1: true,
					report: GamingCanvas.getReport(),
				},
				settings,
			);

			// Init: Player 1
			payload.camera = camera.encode();
			payload.offscreenCanvas = offscreenCanvasPlayer1;
			payload.player1 = true;
			VideoMainBus.workerPlayer1.postMessage(
				{
					cmd: VideoMainBusInputCmd.INIT,
					data: payload,
				},
				[payload.camera.buffer, payload.offscreenCanvas],
			);

			// Init: Player 2
			payload.camera = camera.encode();
			payload.offscreenCanvas = offscreenCanvasPlayer2;
			payload.player1 = false;
			VideoMainBus.workerPlayer2.postMessage(
				{
					cmd: VideoMainBusInputCmd.INIT,
					data: payload,
				},
				[payload.camera.buffer, payload.offscreenCanvas],
			);
		} else {
			alert('Web Workers are not supported by your browser');
			VideoMainBus.callbackInitComplete(true, false);
			VideoMainBus.callbackInitComplete(false, false);
		}
	}

	private static input(worker: Worker, player1: boolean): void {
		let payload: VideoMainBusOutputPayload, payloads: VideoMainBusOutputPayload[];

		worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case VideoMainBusOutputCmd.INIT_COMPLETE:
						VideoMainBus.callbackInitComplete(player1, <boolean>payload.data);
						break;
					case VideoMainBusOutputCmd.STATS:
						VideoMainBus.callbackStats(player1, <VideoMainBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputCalculations(player1: boolean, data: VideoMainBusInputDataCalculations): void {
		(player1 === true ? VideoMainBus.workerPlayer1 : VideoMainBus.workerPlayer2).postMessage(
			{
				cmd: VideoMainBusInputCmd.CALCULATIONS,
				data: data,
			},
			[data.camera.buffer, data.rays.buffer],
		);
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.REPORT,
			data: report,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: VideoMainBusInputDataSettings): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.SETTINGS,
			data: settings,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackStats(callbackStats: (player1: boolean, data: VideoMainBusOutputDataStats) => void): void {
		VideoMainBus.callbackStats = callbackStats;
	}
}
