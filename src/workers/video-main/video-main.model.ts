import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { FPS, LightingQuality, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	CALCULATIONS,
	INIT,
	MAP,
	REPORT,
	SETTINGS,
}

export interface VideoMainBusInputDataCalculations {
	camera: Float64Array;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
}

export interface VideoMainBusInputDataInit extends VideoMainBusInputDataSettings {
	camera: Float64Array;
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	player1: boolean;
	report: GamingCanvasReport;
}

export interface VideoMainBusInputDataSettings {
	antialias: boolean;
	fov: number;
	fps: FPS;
	gamma: number; // 0 - 1 - 2
	grayscale: boolean;
	lightingQuality: LightingQuality;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface VideoMainBusInputPayload {
	cmd: VideoMainBusInputCmd;
	data: Float64Array | GameMap | GamingCanvasReport | VideoMainBusInputDataCalculations | VideoMainBusInputDataInit | VideoMainBusInputDataSettings;
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
