import { Camera } from '../../models/camera.model';
import { CharacterPositionEncode } from '../../models/character.model';
import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	CalcBusInputCmd,
	CalcBusInputDataSettings,
	CalcBusOutputCmd,
	CalcBusOutputDataCamera,
	CalcBusOutputDataCalculations,
	CalcBusOutputDataStats,
	CalcBusOutputPayload,
} from './calc.model';
import { GameMap } from '../../models/game.model';

/**
 * @author tknight-dev
 */

export class CalcBus {
	private static callbackCamera: (data: CalcBusOutputDataCamera) => void;
	private static callbackCalculations: (data: CalcBusOutputDataCalculations) => void;
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: CalcBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(camera: Camera, settings: CalcBusInputDataSettings, gameMap: GameMap, callback: (status: boolean) => void): void {
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
			const characterPositionEncoded: Float32Array = CharacterPositionEncode({
				dataIndex: (camera.x | 0) * gameMap.dataWidth + (camera.y | 0),
				r: camera.r,
				x: camera.x,
				y: camera.y,
			});
			CalcBus.worker.postMessage(
				{
					cmd: CalcBusInputCmd.INIT,
					data: Object.assign(
						{
							characterPosition: characterPositionEncoded,
							gameMap: gameMap,
							report: GamingCanvas.getReport(),
						},
						settings,
					),
				},
				[characterPositionEncoded.buffer],
			);
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
						CalcBus.callbackCamera(<CalcBusOutputDataCamera>payload.data);
						break;
					case CalcBusOutputCmd.CALCULATIONS:
						CalcBus.callbackCalculations(<CalcBusOutputDataCalculations>payload.data);
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

	public static outputCamera(camera: Float32Array): void {
		CalcBus.worker.postMessage(
			{
				cmd: CalcBusInputCmd.CAMERA,
				data: camera,
			},
			[camera.buffer],
		);
	}

	public static outputCharacterControl(characterControl: Float32Array): void {
		CalcBus.worker.postMessage(
			{
				cmd: CalcBusInputCmd.CHARACTER_CONTROL,
				data: characterControl,
			},
			[characterControl.buffer],
		);
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: CalcBusInputDataSettings): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackCamera(callbackCamera: (data: CalcBusOutputDataCamera) => void): void {
		CalcBus.callbackCamera = callbackCamera;
	}

	public static setCallbackCalculations(callbackCalculations: (data: CalcBusOutputDataCalculations) => void): void {
		CalcBus.callbackCalculations = callbackCalculations;
	}

	public static setCallbackStats(callbackStats: (data: CalcBusOutputDataStats) => void): void {
		CalcBus.callbackStats = callbackStats;
	}
}
