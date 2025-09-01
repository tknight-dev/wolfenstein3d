import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS } from '../../models/settings.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum CalcBusInputCmd {
	CAMERA,
	CHARACTER_CONTROL,
	INIT,
	REPORT,
	SETTINGS,
}

export interface CalcBusInputDataInit extends CalcBusInputDataSettings {
	characterPosition: Float32Array;
	gameMap: GameMap;
	report: GamingCanvasReport;
}

export interface CalcBusInputDataSettings {
	fov: number;
	fps: FPS;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data: CalcBusInputDataInit | CalcBusInputDataSettings | Float32Array | GamingCanvasReport;
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
	cells: Uint8Array;
	rays: Float32Array;
}

export interface CalcBusOutputDataCalculations {
	cells: Uint8Array;
	characterPosition: Float32Array;
	rays: Float32Array;
}

export interface CalcBusOutputDataStats {}

export interface CalcBusOutputPayload {
	cmd: CalcBusOutputCmd;
	data: boolean | CalcBusOutputDataCamera | CalcBusOutputDataCalculations | CalcBusOutputDataStats;
}
