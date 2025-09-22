import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	CalcBusInputCmd,
	CalcBusInputDataPlayerInput,
	CalcBusInputDataSettings,
	CalcBusOutputCmd,
	CalcBusOutputDataCamera,
	CalcBusOutputDataCalculations,
	CalcBusOutputDataStats,
	CalcBusOutputPayload,
	CalcBusActionDoorState,
	CalcBusOutputDataAudio,
	CalcBusInputDataAudio,
	CalcBusOutputDataActionWallMove,
	CalcBusOutputDataCharacterMeta,
	CalcBusOutputDataActionSwitch,
	CalcBusOutputDataNPCUpdate,
} from './calc.model.js';
import { GameMap } from '../../models/game.model.js';
import { VideoMainBus } from '../video-main/video-main.bus.js';

/**
 * @author tknight-dev
 */

export class CalcBus {
	private static callbackActionDoor: (data: CalcBusActionDoorState) => void;
	private static callbackActionSwitch: (data: CalcBusOutputDataActionSwitch) => void;
	private static callbackActionWallMove: (data: CalcBusOutputDataActionWallMove) => void;
	private static callbackAudio: (data: CalcBusOutputDataAudio) => void;
	private static callbackCamera: (data: CalcBusOutputDataCamera) => void;
	private static callbackCalculations: (data: CalcBusOutputDataCalculations) => void;
	private static callbackCharacterMeta: (data: CalcBusOutputDataCharacterMeta) => void;
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackNPCUpdate: (data: CalcBusOutputDataNPCUpdate) => void;
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
						report: GamingCanvas.getReport(),
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
					case CalcBusOutputCmd.ACTION_DOOR:
						CalcBus.callbackActionDoor(<CalcBusActionDoorState>payload.data);
						break;
					case CalcBusOutputCmd.ACTION_SWITCH:
						CalcBus.callbackActionSwitch(<CalcBusOutputDataActionSwitch>payload.data);
						break;
					case CalcBusOutputCmd.ACTION_WALL_MOVE:
						CalcBus.callbackActionWallMove(<CalcBusOutputDataActionWallMove>payload.data);
						break;
					case CalcBusOutputCmd.AUDIO:
						CalcBus.callbackAudio(<CalcBusOutputDataAudio>payload.data);
						break;
					case CalcBusOutputCmd.CAMERA:
						CalcBus.callbackCamera(<CalcBusOutputDataCamera>payload.data);
						break;
					case CalcBusOutputCmd.CHARACTER_META:
						CalcBus.callbackCharacterMeta(<CalcBusOutputDataCharacterMeta>payload.data);
						break;
					case CalcBusOutputCmd.CALCULATIONS:
						CalcBus.callbackCalculations(<CalcBusOutputDataCalculations>payload.data);
						break;
					case CalcBusOutputCmd.INIT_COMPLETE:
						CalcBus.callbackInitComplete(<boolean>payload.data);
						break;
					case CalcBusOutputCmd.MAP_UPDATE:
						VideoMainBus.outputMapUpdate(<Uint16Array>payload.data);
						break;
					case CalcBusOutputCmd.NPC_UPDATE:
						CalcBus.callbackNPCUpdate(<CalcBusOutputDataNPCUpdate>payload.data);
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

	public static outputAudioStart(data: CalcBusInputDataAudio): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.AUDIO_START,
			data: data,
		});
	}

	public static outputAudioStop(data: CalcBusInputDataAudio): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.AUDIO_STOP,
			data: data,
		});
	}

	public static outputCamera(camera: Float64Array): void {
		CalcBus.worker.postMessage(
			{
				cmd: CalcBusInputCmd.CAMERA,
				data: camera,
			},
			[camera.buffer],
		);
	}

	public static outputCharacterInput(data: CalcBusInputDataPlayerInput): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.CHARACTER_INPUT,
			data: data,
		});
	}

	public static outputMap(data: GameMap): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.MAP,
			data: data,
		});
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

	public static setCallbackActionDoor(callbackActionDoor: (data: CalcBusActionDoorState) => void): void {
		CalcBus.callbackActionDoor = callbackActionDoor;
	}

	public static setCallbackActionSwitch(callbackActionSwitch: (data: CalcBusOutputDataActionSwitch) => void): void {
		CalcBus.callbackActionSwitch = callbackActionSwitch;
	}

	public static setCallbackActionWallMove(callbackActionWallMove: (data: CalcBusOutputDataActionWallMove) => void): void {
		CalcBus.callbackActionWallMove = callbackActionWallMove;
	}

	public static setCallbackAudio(callbackAudio: (data: CalcBusOutputDataAudio) => void): void {
		CalcBus.callbackAudio = callbackAudio;
	}

	public static setCallbackCamera(callbackCamera: (data: CalcBusOutputDataCamera) => void): void {
		CalcBus.callbackCamera = callbackCamera;
	}

	public static setCallbackCalculations(callbackCalculations: (data: CalcBusOutputDataCalculations) => void): void {
		CalcBus.callbackCalculations = callbackCalculations;
	}

	public static setCallbackCharacterMeta(callbackCharacterMeta: (data: CalcBusOutputDataCharacterMeta) => void): void {
		CalcBus.callbackCharacterMeta = callbackCharacterMeta;
	}

	public static setCallbackNPCUpdate(callbackNPCUpdate: (data: CalcBusOutputDataNPCUpdate) => void): void {
		CalcBus.callbackNPCUpdate = callbackNPCUpdate;
	}

	public static setCallbackStats(callbackStats: (data: CalcBusOutputDataStats) => void): void {
		CalcBus.callbackStats = callbackStats;
	}
}
