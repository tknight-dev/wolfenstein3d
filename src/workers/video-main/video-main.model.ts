import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model';
import { FPS } from '../../models/settings.model';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	CAMERA,
	INIT,
	REPORT,
	SETTINGS,
}

export interface VideoMainBusInputDataCamera {
	camera: Float32Array;
}

export interface VideoMainBusInputDataInit extends VideoMainBusInputDataCamera, VideoMainBusInputDataSettings {
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoMainBusInputDataSettings {
	fps: FPS;
}

export interface VideoMainBusInputPayload {
	cmd: VideoMainBusInputCmd;
	data: Float32Array | GamingCanvasReport | VideoMainBusInputDataInit | VideoMainBusInputDataSettings;
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
