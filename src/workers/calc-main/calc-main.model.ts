import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastCellSide, GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import { CharacterInput, CharacterWeapon } from '../../models/character.model.js';

/**
 * @author tknight-dev
 */

/*
 * Actions
 */

export interface CalcMainBusActionDoorState {
	cellSide: GamingCanvasGridRaycastCellSide;
	closing: boolean;
	gridIndex: number;
	open: boolean;
	opening: boolean;
	timestampUnix: number; // Unix Timestamp for syncing between threads (WebWorkers)
	timeout?: number;
}
export const CalcMainBusActionDoorStateAutoCloseDurationInMS: number = 5000;
export const CalcMainBusActionDoorStateChangeDurationInMS: number = 1000;
export const CalcMainBusActionWallMoveStateChangeDurationInMS: number = 5000;

/*
 * Input
 */
export enum CalcMainBusInputCmd {
	AUDIO_START,
	AUDIO_STOP,
	CAMERA,
	CHARACTER_INPUT,
	INIT,
	MAP,
	PATH_UPDATE,
	PAUSE,
	REPORT,
	SETTINGS,
	WEAPON_SELECT,
}

export interface CalcMainBusInputDataAudio {
	instance: number | null; // null on failure
	request?: number; // unique to calc engine
}

export interface CalcMainBusInputDataInit extends CalcMainBusInputDataSettings {
	gameMap: GameMap;
	report: GamingCanvasReport;
}

export interface CalcMainBusInputDataPlayerInput {
	player1: CharacterInput;
	player2: CharacterInput;
}

export interface CalcMainBusInputDataSettings {
	audioNoAction: boolean;
	audioWallCollisions: boolean;
	debug: boolean;
	difficulty: GameDifficulty;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface CalcMainBusInputDataWeaponSelect {
	player1: boolean;
	weapon: CharacterWeapon;
}

export interface CalcMainBusInputPayload {
	cmd: CalcMainBusInputCmd;
	data:
		| boolean
		| CalcMainBusInputDataAudio
		| CalcMainBusInputDataInit
		| CalcMainBusInputDataPlayerInput
		| CalcMainBusInputDataSettings
		| CalcMainBusInputDataWeaponSelect
		| CharacterInput
		| Float64Array
		| GameMap
		| GamingCanvasReport
		| Map<number, number[]>;
}

/*
 * Output
 */
export enum CalcMainBusOutputCmd {
	ACTION_DOOR,
	ACTION_SWITCH,
	ACTION_WALL_MOVE,
	AUDIO,
	CAMERA,
	CALCULATIONS,
	CHARACTER_META,
	INIT_COMPLETE,
	MAP_UPDATE,
	NPC_UPDATE,
	PATH_UPDATE,
	STATS,
	WEAPON_SELECT,
}

export interface CalcMainBusOutputDataActionSwitch {
	cellValue: number;
	gridIndex: number;
}

export interface CalcMainBusOutputDataActionWallMove {
	cellSide: GamingCanvasGridRaycastCellSide;
	gridIndex: number;
	timestampUnix: number;
}

export interface CalcMainBusOutputDataAudio {
	assetId?: number; // no assetId is modify existing instance
	instance?: number; // assetId and instance is stop old instance; assetId and no instance is play new asset
	pan?: number;
	volume?: number;
	request?: number; // unique to calc engine
}

export interface CalcMainBusOutputDataCamera {
	camera: Float64Array;
	player1Camera: Float64Array;
	player2Camera: Float64Array;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
}

export interface CalcMainBusOutputDataCharacterMeta {
	player1?: Uint16Array;
	player2?: Uint16Array;
}

export interface CalcMainBusOutputDataCalculations {
	characterPlayer1Camera?: Float64Array;
	characterPlayer1Rays?: Float64Array;
	characterPlayer1RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer1RaysMapKeysSorted?: Float64Array;
	characterPlayer2Camera?: Float64Array;
	characterPlayer2Rays?: Float64Array;
	characterPlayer2RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer2RaysMapKeysSorted?: Float64Array;
}

export interface CalcMainBusOutputDataStats {}

export interface CalcMainBusOutputDataWeaponSelect {
	player1: boolean;
	weapon: CharacterWeapon;
}

export interface CalcMainBusOutputPayload {
	cmd: CalcMainBusOutputCmd;
	data:
		| boolean
		| CalcMainBusOutputDataActionSwitch
		| CalcMainBusOutputDataActionWallMove
		| CalcMainBusActionDoorState
		| CalcMainBusOutputDataAudio
		| CalcMainBusOutputDataCamera
		| CalcMainBusOutputDataCalculations
		| CalcMainBusOutputDataCharacterMeta
		| CalcMainBusOutputDataStats
		| CalcMainBusOutputDataWeaponSelect
		| Float32Array[]
		| Map<number, number[]>
		| Uint16Array;
}
