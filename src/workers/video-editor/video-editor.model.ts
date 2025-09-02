import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS } from '../../models/settings.model.js';

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
	camera: Float32Array;
	gameMode: boolean;
	rays: Float32Array;
	viewport: Float32Array;
}

export interface VideoEditorBusInputDataInit extends VideoEditorBusInputDataCalculations, VideoEditorBusInputDataSettings {
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoEditorBusInputDataSettings {
	fov: number;
	fps: FPS;
	player2Enable: boolean;
}

export interface VideoEditorBusInputPayload {
	cmd: VideoEditorBusInputCmd;
	data:
		| GamingCanvasReport
		| Float32Array
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
