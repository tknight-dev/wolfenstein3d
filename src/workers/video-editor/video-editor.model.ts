import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoEditorBusInputCmd {
	INIT,
	REPORT,
	SETTINGS,
}

export interface VideoEditorBusInputDataInit extends VideoEditorBusInputDataSettings {
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoEditorBusInputDataSettings {
	fps: number;
}

export interface VideoEditorBusInputPayload {
	cmd: VideoEditorBusInputCmd;
	data: GamingCanvasReport | VideoEditorBusInputDataInit | VideoEditorBusInputDataSettings;
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
