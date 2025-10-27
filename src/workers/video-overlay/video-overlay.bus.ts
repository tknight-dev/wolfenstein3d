import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	VideoOverlayBusInputCmd,
	VideoOverlayBusInputDataCalculations,
	VideoOverlayBusInputDataInit,
	VideoOverlayBusInputDataSettings,
	VideoOverlayBusOutputCmd,
	VideoOverlayBusOutputDataStats,
	VideoOverlayBusOutputPayload,
} from './video-overlay.model.js';
import { CalcMainBusOutputDataActionTag } from '../calc-main/calc-main.model.js';
import { GameMap } from '../../models/game.model.js';

/**
 * @author tknight-dev
 */

export class VideoOverlayBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (player1: boolean, data: VideoOverlayBusOutputDataStats) => void;
	private static workerPlayer1: Worker;
	private static workerPlayer1Good: boolean;
	private static workerPlayer1Ready: boolean;
	private static workerPlayer2: Worker;
	private static workerPlayer2Good: boolean;
	private static workerPlayer2Ready: boolean;

	public static initialize(
		canvasPlayer1: HTMLCanvasElement,
		canvasPlayer2: HTMLCanvasElement,
		settings: VideoOverlayBusInputDataSettings,
		callback: (status: boolean) => void,
	): void {
		VideoOverlayBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			VideoOverlayBus.workerPlayer1 = new Worker(new URL('./video-overlay.engine.mjs', import.meta.url), {
				name: 'VideoOverlayEnginePlayer1',
				type: 'module', // ESM
			});
			VideoOverlayBus.workerPlayer2 = new Worker(new URL('./video-overlay.engine.mjs', import.meta.url), {
				name: 'VideoOverlayEnginePlayer2',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			VideoOverlayBus.input(VideoOverlayBus.workerPlayer1, true);
			VideoOverlayBus.input(VideoOverlayBus.workerPlayer2, false);

			// Payload
			const offscreenCanvasPlayer1: OffscreenCanvas = canvasPlayer1.transferControlToOffscreen();
			const offscreenCanvasPlayer2: OffscreenCanvas = canvasPlayer2.transferControlToOffscreen();

			const payload: VideoOverlayBusInputDataInit = <VideoOverlayBusInputDataInit>Object.assign(
				{
					player1: true,
					report: GamingCanvas.getReport(),
				},
				settings,
			);

			// Init: Player 1
			payload.offscreenCanvas = offscreenCanvasPlayer1;
			payload.player1 = true;
			VideoOverlayBus.workerPlayer1.postMessage(
				{
					cmd: VideoOverlayBusInputCmd.INIT,
					data: payload,
				},
				[payload.offscreenCanvas],
			);

			// Init: Player 2
			payload.offscreenCanvas = offscreenCanvasPlayer2;
			payload.player1 = false;
			VideoOverlayBus.workerPlayer2.postMessage(
				{
					cmd: VideoOverlayBusInputCmd.INIT,
					data: payload,
				},
				[payload.offscreenCanvas],
			);
		} else {
			alert('Web Workers are not supported by your browser');
			VideoOverlayBus.callbackInitComplete(false);
		}
	}

	private static input(worker: Worker, player1: boolean): void {
		let payload: VideoOverlayBusOutputPayload, payloads: VideoOverlayBusOutputPayload[];

		worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case VideoOverlayBusOutputCmd.INIT_COMPLETE:
						if (player1 === true) {
							VideoOverlayBus.workerPlayer1Good = <boolean>payload.data;
							VideoOverlayBus.workerPlayer1Ready = true;
						} else {
							VideoOverlayBus.workerPlayer2Good = <boolean>payload.data;
							VideoOverlayBus.workerPlayer2Ready = true;
						}

						if (VideoOverlayBus.workerPlayer1Ready === true && VideoOverlayBus.workerPlayer2Ready === true) {
							VideoOverlayBus.workerPlayer1Ready = false;
							VideoOverlayBus.workerPlayer2Ready = false;
							VideoOverlayBus.callbackInitComplete(VideoOverlayBus.workerPlayer1Good && VideoOverlayBus.workerPlayer2Good);
						}
						break;
					case VideoOverlayBusOutputCmd.STATS:
						VideoOverlayBus.callbackStats(player1, <VideoOverlayBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputActionTag(data: CalcMainBusOutputDataActionTag): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.ACTION_TAG,
			data: data,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.ACTION_TAG,
			data: data,
		});
	}

	public static outputCalculations(player1: boolean, data: VideoOverlayBusInputDataCalculations): void {
		(player1 === true ? VideoOverlayBus.workerPlayer1 : VideoOverlayBus.workerPlayer2).postMessage(
			{
				cmd: VideoOverlayBusInputCmd.CALCULATIONS,
				data: data,
			},
			data.characterPlayerCameraAlt !== undefined
				? [data.characterPlayerCamera.buffer, data.characterPlayerCameraAlt.buffer]
				: [data.characterPlayerCamera.buffer],
		);
	}

	public static outputGameOver(): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.GAME_OVER,
			data: undefined,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.GAME_OVER,
			data: undefined,
		});
	}

	public static outputLocked(player1: boolean, keys: number[]): void {
		if (player1 === true) {
			VideoOverlayBus.workerPlayer1.postMessage({
				cmd: VideoOverlayBusInputCmd.LOCKED,
				data: keys,
			});
		} else {
			VideoOverlayBus.workerPlayer2.postMessage({
				cmd: VideoOverlayBusInputCmd.LOCKED,
				data: keys,
			});
		}
	}

	public static outputMap(data: GameMap): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.MAP,
			data: data,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.MAP,
			data: data,
		});
	}

	public static outputPause(state: boolean): void {
		if (VideoOverlayBus.workerPlayer1 === undefined || VideoOverlayBus.workerPlayer2 === undefined) {
			return;
		}

		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.PAUSE,
			data: state,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.PAUSE,
			data: state,
		});
	}

	public static outputPlayerDead(player1: boolean): void {
		if (player1 === true) {
			VideoOverlayBus.workerPlayer1.postMessage({
				cmd: VideoOverlayBusInputCmd.PLAYER_DEAD,
				data: undefined,
			});
		} else {
			VideoOverlayBus.workerPlayer2.postMessage({
				cmd: VideoOverlayBusInputCmd.PLAYER_DEAD,
				data: undefined,
			});
		}
	}

	public static outputPlayerHit(angle: number, player1: boolean): void {
		if (player1 === true) {
			VideoOverlayBus.workerPlayer1.postMessage({
				cmd: VideoOverlayBusInputCmd.PLAYER_HIT,
				data: angle,
			});
		} else {
			VideoOverlayBus.workerPlayer2.postMessage({
				cmd: VideoOverlayBusInputCmd.PLAYER_HIT,
				data: angle,
			});
		}
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.REPORT,
			data: report,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.REPORT,
			data: report,
		});
	}

	public static outputReset(): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.RESET,
			data: undefined,
		});
		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.RESET,
			data: undefined,
		});
	}

	// User changed their settings
	public static outputSettings(settings: VideoOverlayBusInputDataSettings): void {
		VideoOverlayBus.workerPlayer1.postMessage({
			cmd: VideoOverlayBusInputCmd.SETTINGS,
			data: settings,
		});

		VideoOverlayBus.workerPlayer2.postMessage({
			cmd: VideoOverlayBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackStats(callbackStats: (player1: boolean, data: VideoOverlayBusOutputDataStats) => void): void {
		VideoOverlayBus.callbackStats = callbackStats;
	}
}
