import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
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
	closed: boolean;
	closing: boolean;
	open: boolean;
	timestampUnix: number; // Unix Timestamp for syncing between threads (WebWorkers)
	timeout?: ReturnType<typeof setTimeout>;
}
export const CalcBusActionDoorStateAutoCloseDurationInMS: number = 5000;
export const CalcBusActionDoorStateChangeDurationInMS: number = 2000;

/*
 * Input
 */
export enum CalcBusInputCmd {
	CAMERA,
	CHARACTER_INPUT,
	INIT,
	MAP,
	REPORT,
	SETTINGS,
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
	audioWallCollisions: boolean;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data: CalcBusInputDataInit | CalcBusInputDataPlayerInput | CalcBusInputDataSettings | Float64Array | GameMap | CharacterInput | GamingCanvasReport;
}

/*
 * Output
 */
export enum CalcBusOutputCmd {
	ACTION_DOOR_OPEN,
	CAMERA,
	CALCULATIONS,
	INIT_COMPLETE,
	STATS,
}

export interface CalcBusOutputDataActionDoorOpen {
	cellSide: GamingCanvasGridRaycastCellSide;
	gridIndex: number;
	timestampUnix: number;
}

export interface CalcBusOutputDataCamera {
	camera: Float64Array;
	player1Camera: Float64Array;
	player2Camera: Float64Array;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
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
	data: boolean | CalcBusOutputDataActionDoorOpen | CalcBusOutputDataCamera | CalcBusOutputDataCalculations | CalcBusOutputDataStats;
}
