import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS } from '../../models/settings.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	CALCULATIONS,
	INIT,
	REPORT,
	SETTINGS,
}

export interface VideoMainBusInputDataCalculations {
	camera: Float32Array;
	rays: Float32Array;
}

export interface VideoMainBusInputDataInit extends VideoMainBusInputDataSettings {
	camera: Float32Array;
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	player1: boolean;
	report: GamingCanvasReport;
}

export interface VideoMainBusInputDataSettings {
	fov: number;
	fps: FPS;
	player2Enable: boolean;
}

export interface VideoMainBusInputPayload {
	cmd: VideoMainBusInputCmd;
	data: Float32Array | GamingCanvasReport | VideoMainBusInputDataCalculations | VideoMainBusInputDataInit | VideoMainBusInputDataSettings;
}

/*
 * Output
 */
export enum VideoMainBusOutputCmd {
	INIT_COMPLETE,
	STATS,
}

export interface VideoMainBusOutputDataStats {
	fps: number;
}

export interface VideoMainBusOutputPayload {
	cmd: VideoMainBusOutputCmd;
	data: boolean | VideoMainBusOutputDataStats;
}
