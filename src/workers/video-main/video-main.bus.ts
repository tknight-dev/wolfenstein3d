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
import { CalcBusActionDoorState, CalcBusOutputDataActionSwitch, CalcBusOutputDataActionWallMove } from '../calc/calc.model.js';

/**
 * @author tknight-dev
 */

export class VideoMainBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (player1: boolean, data: VideoMainBusOutputDataStats) => void;
	private static workerPlayer1: Worker;
	private static workerPlayer1Good: boolean;
	private static workerPlayer1Ready: boolean;
	private static workerPlayer2: Worker;
	private static workerPlayer2Good: boolean;
	private static workerPlayer2Ready: boolean;

	public static initialize(
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
			payload.camera = GamingCanvasGridCamera.encodeSingle(gameMap.position);
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
			payload.camera = GamingCanvasGridCamera.encodeSingle(gameMap.position);
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
			VideoMainBus.callbackInitComplete(false);
		}
	}

	private static input(worker: Worker, player1: boolean): void {
		let payload: VideoMainBusOutputPayload, payloads: VideoMainBusOutputPayload[];

		worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case VideoMainBusOutputCmd.INIT_COMPLETE:
						if (player1 === true) {
							VideoMainBus.workerPlayer1Good = <boolean>payload.data;
							VideoMainBus.workerPlayer1Ready = true;
						} else {
							VideoMainBus.workerPlayer2Good = <boolean>payload.data;
							VideoMainBus.workerPlayer2Ready = true;
						}

						if (VideoMainBus.workerPlayer1Ready === true && VideoMainBus.workerPlayer2Ready === true) {
							VideoMainBus.workerPlayer1Ready = false;
							VideoMainBus.workerPlayer2Ready = false;
							VideoMainBus.callbackInitComplete(VideoMainBus.workerPlayer1Good && VideoMainBus.workerPlayer2Good);
						}
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

	public static outputActionDoor(data: CalcBusActionDoorState): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_DOOR,
			data: data,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_DOOR,
			data: data,
		});
	}

	public static outputActionSwitch(data: CalcBusOutputDataActionSwitch): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_SWITCH,
			data: data,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_SWITCH,
			data: data,
		});
	}

	public static outputActionWallMove(data: CalcBusOutputDataActionWallMove): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_WALL_MOVE,
			data: data,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.ACTION_WALL_MOVE,
			data: data,
		});
	}

	public static outputCalculations(player1: boolean, data: VideoMainBusInputDataCalculations): void {
		if (VideoMainBus.workerPlayer1 === undefined || VideoMainBus.workerPlayer2 === undefined) {
			return;
		}

		(player1 === true ? VideoMainBus.workerPlayer1 : VideoMainBus.workerPlayer2).postMessage(
			{
				cmd: VideoMainBusInputCmd.CALCULATIONS,
				data: data,
			},
			[data.camera.buffer, data.rays.buffer, data.raysMapKeysSorted.buffer],
		);
	}

	public static outputMap(data: GameMap): void {
		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.MAP,
			data: data,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.MAP,
			data: data,
		});
	}

	public static outputNPCUpdate(data: Float32Array[]): void {
		if (VideoMainBus.workerPlayer1 === undefined || VideoMainBus.workerPlayer2 === undefined) {
			return;
		}

		VideoMainBus.workerPlayer1.postMessage({
			cmd: VideoMainBusInputCmd.NPC_UPDATE,
			data: data,
		});

		VideoMainBus.workerPlayer2.postMessage({
			cmd: VideoMainBusInputCmd.NPC_UPDATE,
			data: data,
		});
	}

	public static outputMapUpdate(data: Uint16Array): void {
		let dataClone: Uint16Array = Uint16Array.from(data);

		VideoMainBus.workerPlayer1.postMessage(
			{
				cmd: VideoMainBusInputCmd.MAP_UPDATE,
				data: dataClone,
			},
			[dataClone.buffer],
		);

		VideoMainBus.workerPlayer2.postMessage(
			{
				cmd: VideoMainBusInputCmd.MAP_UPDATE,
				data: data,
			},
			[data.buffer],
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
