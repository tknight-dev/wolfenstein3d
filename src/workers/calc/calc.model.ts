import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastCellSide, GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import { CharacterInput } from '../../models/character.model.js';

/**
 * @author tknight-dev
 */

/*
 * Actions
 */

export interface CalcBusActionDoorState {
	cellSide: GamingCanvasGridRaycastCellSide;
	closing: boolean;
	gridIndex: number;
	open: boolean;
	opening: boolean;
	timestampUnix: number; // Unix Timestamp for syncing between threads (WebWorkers)
	timeout?: ReturnType<typeof setTimeout>;
}
export const CalcBusActionDoorStateAutoCloseDurationInMS: number = 5000;
export const CalcBusActionDoorStateChangeDurationInMS: number = 1000;
export const CalcBusActionWallMoveStateChangeDurationInMS: number = 5000;

/*
 * Input
 */
export enum CalcBusInputCmd {
	AUDIO_START,
	AUDIO_STOP,
	CAMERA,
	CHARACTER_INPUT,
	INIT,
	MAP,
	REPORT,
	SETTINGS,
}

export interface CalcBusInputDataAudio {
	instance: number | null; // null on failure
	request?: number; // unique to calc engine
}

export interface CalcBusInputDataInit extends CalcBusInputDataSettings {
	gameMap: GameMap;
	report: GamingCanvasReport;
}

export interface CalcBusInputDataPlayerInput {
	player1: CharacterInput;
	player2: CharacterInput;
}

export interface CalcBusInputDataSettings {
	audioNoAction: boolean;
	audioWallCollisions: boolean;
	difficulty: GameDifficulty;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data:
		| CalcBusInputDataAudio
		| CalcBusInputDataInit
		| CalcBusInputDataPlayerInput
		| CalcBusInputDataSettings
		| CharacterInput
		| Float64Array
		| GameMap
		| GamingCanvasReport;
}

/*
 * Output
 */
export enum CalcBusOutputCmd {
	ACTION_DOOR,
	ACTION_SWITCH,
	ACTION_WALL_MOVE,
	AUDIO,
	CAMERA,
	CALCULATIONS,
	CHARACTER_META,
	INIT_COMPLETE,
	MAP_UPDATE,
	STATS,
}

export interface CalcBusOutputDataActionSwitch {
	cellValue: number;
	gridIndex: number;
}

export interface CalcBusOutputDataActionWallMove {
	cellSide: GamingCanvasGridRaycastCellSide;
	gridIndex: number;
	timestampUnix: number;
}

export interface CalcBusOutputDataAudio {
	assetId?: number; // no assetId is modify existing instance
	instance?: number; // assetId and instance is stop old instance; assetId and no instance is play new asset
	pan?: number;
	volume?: number;
	request?: number; // unique to calc engine
}

export interface CalcBusOutputDataCamera {
	camera: Float64Array;
	player1Camera: Float64Array;
	player2Camera: Float64Array;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
}

export interface CalcBusOutputDataCharacterMeta {
	player1?: Uint16Array;
	player2?: Uint16Array;
}

export interface CalcBusOutputDataCalculations {
	characterPlayer1Camera?: Float64Array;
	characterPlayer1Rays?: Float64Array;
	characterPlayer1RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer1RaysMapKeysSorted?: Float64Array;
	characterPlayer2Camera?: Float64Array;
	characterPlayer2Rays?: Float64Array;
	characterPlayer2RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer2RaysMapKeysSorted?: Float64Array;
}

export interface CalcBusOutputDataStats {}

export interface CalcBusOutputPayload {
	cmd: CalcBusOutputCmd;
	data:
		| boolean
		| CalcBusOutputDataActionSwitch
		| CalcBusOutputDataActionWallMove
		| CalcBusActionDoorState
		| CalcBusOutputDataAudio
		| CalcBusOutputDataCamera
		| CalcBusOutputDataCalculations
		| CalcBusOutputDataCharacterMeta
		| CalcBusOutputDataStats
		| Uint16Array;
}
