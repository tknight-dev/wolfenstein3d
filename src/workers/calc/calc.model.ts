import { Camera } from '../../models/camera.model';
import { GameMap } from '../../models/game.model';
import { FPS } from '../../models/settings.model';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum CalcBusInputCmd {
	CHARACTER_CONTROL,
	INIT,
	SETTINGS,
}

export interface CalcBusInputDataInit extends CalcBusInputDataSettings {
	gameMap: GameMap;
}

export interface CalcBusInputDataSettings {
	fps: FPS;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data: CalcBusInputDataInit | CalcBusInputDataSettings | Float32Array;
}

/*
 * Output
 */
export enum CalcBusOutputCmd {
	CAMERA,
	INIT_COMPLETE,
	STATS,
}

export interface CalcBusOutputDataStats {}

export interface CalcBusOutputPayload {
	cmd: CalcBusOutputCmd;
	data: boolean | CalcBusOutputDataStats | Float32Array;
}
