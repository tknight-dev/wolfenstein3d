import { Camera } from '../../models/camera.model';
import { CharacterControl } from '../../models/character.model';
import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { CalcBusInputCmd, CalcBusInputDataSettings, CalcBusOutputCmd, CalcBusOutputDataStats, CalcBusOutputPayload } from './calc.model';
import { GameMap } from '../../models/game.model';

/**
 * @author tknight-dev
 */

export class CalcBus {
	private static callbackCamera: (camera: Float32Array) => void;
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: CalcBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(settings: CalcBusInputDataSettings, gameMap: GameMap, callback: (status: boolean) => void): void {
		CalcBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			CalcBus.worker = new Worker(new URL('./calc.engine.mjs', import.meta.url), {
				name: 'CalcEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			CalcBus.input();

			// Init the webworker
			CalcBus.worker.postMessage({
				cmd: CalcBusInputCmd.INIT,
				data: Object.assign(
					{
						gameMap: gameMap,
					},
					settings,
				),
			});
		} else {
			alert('Web Workers are not supported by your browser');
			CalcBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: CalcBusOutputPayload, payloads: CalcBusOutputPayload[];

		CalcBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case CalcBusOutputCmd.CAMERA:
						CalcBus.callbackCamera(<Float32Array>payload.data);
						break;
					case CalcBusOutputCmd.INIT_COMPLETE:
						CalcBus.callbackInitComplete(<boolean>payload.data);
						break;
					case CalcBusOutputCmd.STATS:
						CalcBus.callbackStats(<CalcBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputCharacterControl(characterControl: Float32Array): void {
		CalcBus.worker.postMessage(
			{
				cmd: CalcBusInputCmd.CHARACTER_CONTROL,
				data: characterControl,
			},
			[characterControl.buffer],
		);
	}

	// User changed their settings
	public static outputSettings(settings: CalcBusInputDataSettings): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackCamera(callbackCamera: (camera: Float32Array) => void): void {
		CalcBus.callbackCamera = callbackCamera;
	}

	public static setCallbackStats(callbackStats: (data: CalcBusOutputDataStats) => void): void {
		CalcBus.callbackStats = callbackStats;
	}
}
