import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * Stats
 */
export enum VideoEditorBusStats {
	ALL,
	CELLS,
	C_V,
}

/*
 * Input
 */
export enum VideoEditorBusInputCmd {
	CALCULATIONS,
	ENABLE,
	INIT,
	MAP,
	NPC_UPDATE,
	PATH_UPDATE,
	REPORT,
	SETTINGS,
}

export interface VideoEditorBusInputDataCalculations {
	camera: Float64Array;
	player1Camera?: Float64Array;
	player2Camera?: Float64Array;
	gameMode: boolean;
	rays?: Float64Array;
	raysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted?: Float64Array;
	viewport: Float64Array;
	timestampUnix: number;
}

export interface VideoEditorBusInputDataInit extends VideoEditorBusInputDataCalculations, VideoEditorBusInputDataSettings {
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoEditorBusInputDataSettings {
	antialias: boolean;
	debug: boolean;
	difficulty: GameDifficulty;
	gridDraw: boolean;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
}

export interface VideoEditorBusInputPayload {
	cmd: VideoEditorBusInputCmd;
	data:
		| boolean
		| GamingCanvasReport
		| Float32Array[]
		| Float64Array
		| GameMap
		| Map<number, number[]>
		| VideoEditorBusInputDataCalculations
		| VideoEditorBusInputDataInit
		| VideoEditorBusInputDataSettings;
}

/*
 * Output
 */
export enum VideoEditorBusOutputCmd {
	INIT_COMPLETE,
	STATS,
}

export interface VideoEditorBusOutputDataStats {
	all: Float32Array;
	cells: Float32Array;
	cv: Float32Array;
	fps: number;
}

export interface VideoEditorBusOutputPayload {
	cmd: VideoEditorBusOutputCmd;
	data: boolean | VideoEditorBusOutputDataStats;
}
