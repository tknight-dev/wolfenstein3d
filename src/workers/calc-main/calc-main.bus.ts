import { GamingCanvas, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	CalcMainBusInputCmd,
	CalcMainBusInputDataPlayerInput,
	CalcMainBusInputDataSettings,
	CalcMainBusOutputCmd,
	CalcMainBusOutputDataCamera,
	CalcMainBusOutputDataCalculations,
	CalcMainBusOutputDataStats,
	CalcMainBusOutputPayload,
	CalcMainBusActionDoorState,
	CalcMainBusOutputDataAudio,
	CalcMainBusInputDataAudio,
	CalcMainBusOutputDataActionWallMove,
	CalcMainBusOutputDataCharacterMeta,
	CalcMainBusOutputDataActionSwitch,
	CalcMainBusOutputDataWeaponSelect,
	CalcMainBusOutputDataWeaponFire,
} from './calc-main.model.js';
import { GameMap } from '../../models/game.model.js';
import { VideoMainBus } from '../video-main/video-main.bus.js';
import { CharacterWeapon } from '../../models/character.model.js';

/**
 * @author tknight-dev
 */

export class CalcMainBus {
	private static callbackActionDoor: (data: CalcMainBusActionDoorState) => void;
	private static callbackActionSwitch: (data: CalcMainBusOutputDataActionSwitch) => void;
	private static callbackActionWallMove: (data: CalcMainBusOutputDataActionWallMove) => void;
	private static callbackAudio: (data: CalcMainBusOutputDataAudio) => void;
	private static callbackCamera: (data: CalcMainBusOutputDataCamera) => void;
	private static callbackCalculations: (data: CalcMainBusOutputDataCalculations) => void;
	private static callbackCharacterMeta: (data: CalcMainBusOutputDataCharacterMeta) => void;
	private static callbackGameover: () => void;
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackNPCUpdate: (data: Float32Array[]) => void;
	private static callbackPlayerDied: (player1: boolean) => void;
	private static callbackStats: (data: CalcMainBusOutputDataStats) => void;
	private static callbackWeaponFire: (data: CalcMainBusOutputDataWeaponFire) => void;
	private static callbackWeaponSelect: (data: CalcMainBusOutputDataWeaponSelect) => void;
	private static worker: Worker;

	public static initialize(settings: CalcMainBusInputDataSettings, gameMap: GameMap, callback: (status: boolean) => void): void {
		CalcMainBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			CalcMainBus.worker = new Worker(new URL('./calc-main.engine.mjs', import.meta.url), {
				name: 'CalcMainEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			CalcMainBus.input();

			// Init the webworker
			CalcMainBus.worker.postMessage({
				cmd: CalcMainBusInputCmd.INIT,
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
			CalcMainBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: CalcMainBusOutputPayload, payloads: CalcMainBusOutputPayload[];

		CalcMainBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case CalcMainBusOutputCmd.ACTION_DOOR:
						CalcMainBus.callbackActionDoor(<CalcMainBusActionDoorState>payload.data);
						break;
					case CalcMainBusOutputCmd.ACTION_SWITCH:
						CalcMainBus.callbackActionSwitch(<CalcMainBusOutputDataActionSwitch>payload.data);
						break;
					case CalcMainBusOutputCmd.ACTION_WALL_MOVE:
						CalcMainBus.callbackActionWallMove(<CalcMainBusOutputDataActionWallMove>payload.data);
						break;
					case CalcMainBusOutputCmd.AUDIO:
						CalcMainBus.callbackAudio(<CalcMainBusOutputDataAudio>payload.data);
						break;
					case CalcMainBusOutputCmd.CAMERA:
						CalcMainBus.callbackCamera(<CalcMainBusOutputDataCamera>payload.data);
						break;
					case CalcMainBusOutputCmd.CHARACTER_META:
						CalcMainBus.callbackCharacterMeta(<CalcMainBusOutputDataCharacterMeta>payload.data);
						break;
					case CalcMainBusOutputCmd.CALCULATIONS:
						CalcMainBus.callbackCalculations(<CalcMainBusOutputDataCalculations>payload.data);
						break;
					case CalcMainBusOutputCmd.GAME_OVER:
						CalcMainBus.callbackGameover();
						break;
					case CalcMainBusOutputCmd.INIT_COMPLETE:
						CalcMainBus.callbackInitComplete(<boolean>payload.data);
						break;
					case CalcMainBusOutputCmd.MAP_UPDATE:
						VideoMainBus.outputMapUpdate(<Uint16Array>payload.data);
						break;
					case CalcMainBusOutputCmd.NPC_UPDATE:
						CalcMainBus.callbackNPCUpdate(<Float32Array[]>payload.data);
						break;
					case CalcMainBusOutputCmd.PLAYER_DIED:
						CalcMainBus.callbackPlayerDied(<boolean>payload.data);
						break;
					case CalcMainBusOutputCmd.STATS:
						CalcMainBus.callbackStats(<CalcMainBusOutputDataStats>payload.data);
						break;
					case CalcMainBusOutputCmd.WEAPON_FIRE:
						CalcMainBus.callbackWeaponFire(<CalcMainBusOutputDataWeaponFire>payload.data);
						break;
					case CalcMainBusOutputCmd.WEAPON_SELECT:
						CalcMainBus.callbackWeaponSelect(<CalcMainBusOutputDataWeaponSelect>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	public static outputAudioStart(data: CalcMainBusInputDataAudio): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.AUDIO_START,
			data: data,
		});
	}

	public static outputAudioStop(data: CalcMainBusInputDataAudio): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.AUDIO_STOP,
			data: data,
		});
	}

	public static outputCamera(camera: Float64Array): void {
		CalcMainBus.worker.postMessage(
			{
				cmd: CalcMainBusInputCmd.CAMERA,
				data: camera,
			},
			[camera.buffer],
		);
	}

	public static outputCheatCode(player1: boolean): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.CHEAT_CODE,
			data: player1,
		});
	}

	public static outputCharacterInput(data: CalcMainBusInputDataPlayerInput): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.CHARACTER_INPUT,
			data: data,
		});
	}

	public static outputMap(data: GameMap): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.MAP,
			data: data,
		});
	}

	public static outputPathUpdate(data: Map<number, number[]>): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.PATH_UPDATE,
			data: data,
		});
	}

	public static outputPause(state: boolean): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.PAUSE,
			data: state,
		});
	}

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: CalcMainBusInputDataSettings): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static weaponSelect(player1: boolean, weapon: CharacterWeapon): void {
		CalcMainBus.worker.postMessage({
			cmd: CalcMainBusInputCmd.WEAPON_SELECT,
			data: {
				player1: player1,
				weapon: weapon,
			},
		});
	}

	public static setCallbackActionDoor(callbackActionDoor: (data: CalcMainBusActionDoorState) => void): void {
		CalcMainBus.callbackActionDoor = callbackActionDoor;
	}

	public static setCallbackActionSwitch(callbackActionSwitch: (data: CalcMainBusOutputDataActionSwitch) => void): void {
		CalcMainBus.callbackActionSwitch = callbackActionSwitch;
	}

	public static setCallbackActionWallMove(callbackActionWallMove: (data: CalcMainBusOutputDataActionWallMove) => void): void {
		CalcMainBus.callbackActionWallMove = callbackActionWallMove;
	}

	public static setCallbackAudio(callbackAudio: (data: CalcMainBusOutputDataAudio) => void): void {
		CalcMainBus.callbackAudio = callbackAudio;
	}

	public static setCallbackCamera(callbackCamera: (data: CalcMainBusOutputDataCamera) => void): void {
		CalcMainBus.callbackCamera = callbackCamera;
	}

	public static setCallbackCalculations(callbackCalculations: (data: CalcMainBusOutputDataCalculations) => void): void {
		CalcMainBus.callbackCalculations = callbackCalculations;
	}

	public static setCallbackCharacterMeta(callbackCharacterMeta: (data: CalcMainBusOutputDataCharacterMeta) => void): void {
		CalcMainBus.callbackCharacterMeta = callbackCharacterMeta;
	}

	public static setCallbackGameover(callbackGameover: () => void): void {
		CalcMainBus.callbackGameover = callbackGameover;
	}

	public static setCallbackNPCUpdate(callbackNPCUpdate: (data: Float32Array[]) => void): void {
		CalcMainBus.callbackNPCUpdate = callbackNPCUpdate;
	}

	public static setCallbackPlayerDied(callbackPlayerDied: (data: boolean) => void): void {
		CalcMainBus.callbackPlayerDied = callbackPlayerDied;
	}

	public static setCallbackStats(callbackStats: (data: CalcMainBusOutputDataStats) => void): void {
		CalcMainBus.callbackStats = callbackStats;
	}

	public static setCallbackWeaponFire(callbackWeaponFire: (data: CalcMainBusOutputDataWeaponFire) => void): void {
		CalcMainBus.callbackWeaponFire = callbackWeaponFire;
	}

	public static setCallbackWeaponSelect(callbackWeaponSelect: (data: CalcMainBusOutputDataWeaponSelect) => void): void {
		CalcMainBus.callbackWeaponSelect = callbackWeaponSelect;
	}
}
