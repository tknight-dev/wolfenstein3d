import {
	CalcPathBusInputCmd,
	CalcPathBusInputDataPlayerUpdate,
	CalcPathBusInputDataSettings,
	CalcPathBusOutputCmd,
	CalcPathBusOutputDataStats,
	CalcPathBusOutputPayload,
} from './calc-path.model.js';
import { GameMap } from '../../models/game.model.js';
import { CalcMainBusOutputDataActionWallMove } from '../calc-main/calc-main.model.js';

/**
 * @author tknight-dev
 */

export class CalcPathBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackPathUpdate: (data: Map<number, number[]>) => void;
	private static callbackStats: (data: CalcPathBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(settings: CalcPathBusInputDataSettings, gameMap: GameMap, callback: (status: boolean) => void): void {
		CalcPathBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			CalcPathBus.worker = new Worker(new URL('./calc-path.engine.mjs', import.meta.url), {
				name: 'CalcPathEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			CalcPathBus.input();

			// Init the webworker
			CalcPathBus.worker.postMessage({
				cmd: CalcPathBusInputCmd.INIT,
				data: Object.assign(
					{
						gameMap: gameMap,
					},
					settings,
				),
			});
		} else {
			alert('Web Workers are not supported by your browser');
			CalcPathBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: CalcPathBusOutputPayload, payloads: CalcPathBusOutputPayload[];

		CalcPathBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case CalcPathBusOutputCmd.INIT_COMPLETE:
						CalcPathBus.callbackInitComplete(<boolean>payload.data);
						break;
					case CalcPathBusOutputCmd.PATH_UPDATE:
						CalcPathBus.callbackPathUpdate(<Map<number, number[]>>payload.data);
						break;
					case CalcPathBusOutputCmd.STATS:
						CalcPathBus.callbackStats(<CalcPathBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputActionWallMove(data: CalcMainBusOutputDataActionWallMove): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.ACTION_WALL_MOVE,
			data: data,
		});
	}

	public static outputMap(data: GameMap): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.MAP,
			data: data,
		});
	}

	public static outputNPCUpdate(data: Float32Array[]): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.NPC_UPDATE,
			data: data,
		});
	}

	public static outputPause(state: boolean): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.PAUSE,
			data: state,
		});
	}

	public static outputPlayerUpdate(data: CalcPathBusInputDataPlayerUpdate): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.PLAYER_UPDATE,
			data: data,
		});
	}

	// User changed their settings
	public static outputSettings(settings: CalcPathBusInputDataSettings): void {
		CalcPathBus.worker.postMessage({
			cmd: CalcPathBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackPathUpdate(callbackPathUpdate: (data: Map<number, number[]>) => void): void {
		CalcPathBus.callbackPathUpdate = callbackPathUpdate;
	}

	public static setCallbackStats(callbackStats: (data: CalcPathBusOutputDataStats) => void): void {
		CalcPathBus.callbackStats = callbackStats;
	}
}
