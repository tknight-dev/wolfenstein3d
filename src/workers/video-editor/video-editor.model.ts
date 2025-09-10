import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoEditorBusInputCmd {
	CALCULATIONS,
	DATA_SEGMENT,
	INIT,
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
}

export interface VideoEditorBusInputDataInit extends VideoEditorBusInputDataCalculations, VideoEditorBusInputDataSettings {
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoEditorBusInputDataSettings {
	antialias: boolean;
	gridDraw: boolean;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
}

export interface VideoEditorBusInputPayload {
	cmd: VideoEditorBusInputCmd;
	data:
		| GamingCanvasReport
		| Float64Array
		| Map<number, number>
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
	fps: number;
}

export interface VideoEditorBusOutputPayload {
	cmd: VideoEditorBusOutputCmd;
	data: boolean | VideoEditorBusOutputDataStats;
}
