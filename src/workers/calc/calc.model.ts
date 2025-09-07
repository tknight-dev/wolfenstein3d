import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridCharacterInput, GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum CalcBusInputCmd {
	CAMERA,
	CHARACTER_INPUT,
	INIT,
	REPORT,
	SETTINGS,
}

export interface CalcBusInputDataInit extends CalcBusInputDataSettings {
	gameMap: GameMap;
	report: GamingCanvasReport;
}

export interface CalcBusInputDataPlayerInput {
	player1: GamingCanvasGridCharacterInput;
	player2: GamingCanvasGridCharacterInput;
}

export interface CalcBusInputDataSettings {
	fov: number;
	fps: FPS;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data: CalcBusInputDataInit | CalcBusInputDataPlayerInput | CalcBusInputDataSettings | Float32Array | GamingCanvasGridCharacterInput | GamingCanvasReport;
}

/*
 * Output
 */
export enum CalcBusOutputCmd {
	CAMERA,
	CALCULATIONS,
	INIT_COMPLETE,
	STATS,
}

export interface CalcBusOutputDataCamera {
	camera: Float32Array;
	player1Camera: Float32Array;
	player2Camera: Float32Array;
	rays: Float32Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Uint32Array;
}

export interface CalcBusOutputDataCalculations {
	characterPlayer1Camera?: Float32Array;
	characterPlayer1Rays?: Float32Array;
	characterPlayer1RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer1RaysMapKeysSorted?: Uint32Array;
	characterPlayer2Camera?: Float32Array;
	characterPlayer2Rays?: Float32Array;
	characterPlayer2RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer2RaysMapKeysSorted?: Uint32Array;
}

export interface CalcBusOutputDataStats {}

export interface CalcBusOutputPayload {
	cmd: CalcBusOutputCmd;
	data: boolean | CalcBusOutputDataCamera | CalcBusOutputDataCalculations | CalcBusOutputDataStats;
}
