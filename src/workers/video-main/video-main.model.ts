import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { FPS } from '../../model';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	INIT,
	REPORT,
	SETTINGS,
}

export interface VideoMainBusInputDataInit extends VideoMainBusInputDataSettings {
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoMainBusInputDataSettings {
	fps: FPS;
}

export interface VideoMainBusInputPayload {
	cmd: VideoMainBusInputCmd;
	data: GamingCanvasReport | VideoMainBusInputDataInit | VideoMainBusInputDataSettings;
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
