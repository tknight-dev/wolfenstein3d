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
	data: CalcBusInputDataInit | CalcBusInputDataPlayerInput | CalcBusInputDataSettings | Float64Array | GamingCanvasGridCharacterInput | GamingCanvasReport;
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
	data: boolean | CalcBusOutputDataCamera | CalcBusOutputDataCalculations | CalcBusOutputDataStats;
}
