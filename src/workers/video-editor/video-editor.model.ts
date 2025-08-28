import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model';
import { FPS } from '../../models/settings.model';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoEditorBusInputCmd {
	CAMERA_VIEWPORT,
	DATA_SEGMENT,
	INIT,
	REPORT,
	SETTINGS,
}

export interface VideoEditorBusInputDataCameraAndViewport {
	camera: Float32Array;
	viewport: Float32Array;
}

export interface VideoEditorBusInputDataInit extends VideoEditorBusInputDataCameraAndViewport, VideoEditorBusInputDataSettings {
	gameMap: GameMap;
	offscreenCanvas: OffscreenCanvas;
	report: GamingCanvasReport;
}

export interface VideoEditorBusInputDataSettings {
	fps: FPS;
}

export interface VideoEditorBusInputPayload {
	cmd: VideoEditorBusInputCmd;
	data: GamingCanvasReport | Map<number, number> | VideoEditorBusInputDataCameraAndViewport | VideoEditorBusInputDataInit | VideoEditorBusInputDataSettings;
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
