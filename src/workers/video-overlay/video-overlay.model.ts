import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { CalcMainBusOutputDataActionTag } from '../calc-main/calc-main.model.js';
import { Navigation } from '../../models/settings.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoOverlayBusInputCmd {
	ACTION_TAG,
	CAMERA,
	GAME_OVER,
	INIT,
	LOCKED,
	MAP,
	PAUSE,
	PLAYER_DEAD,
	PLAYER_HIT,
	REPORT,
	RESET,
	SETTINGS,
}

export interface VideoOverlayBusInputDataCamera {
	cameraPlayer1: Float64Array;
	cameraPlayer2?: Float64Array;
}

export interface VideoOverlayBusInputDataInit extends VideoOverlayBusInputDataSettings {
	offscreenCanvas: OffscreenCanvas;
	player1: boolean;
	report: GamingCanvasReport;
}

export interface VideoOverlayBusInputDataSettings {
	antialias: boolean;
	debug: boolean;
	grayscale: boolean;
	navigation: Navigation;
	player2Enable: boolean;
}

export interface VideoOverlayBusInputPayload {
	cmd: VideoOverlayBusInputCmd;
	data:
		| boolean
		| CalcMainBusOutputDataActionTag
		| Float32Array[]
		| Float64Array
		| GameMap
		| GamingCanvasReport
		| number
		| number[]
		| Uint16Array
		| VideoOverlayBusInputDataCamera
		| VideoOverlayBusInputDataInit
		| VideoOverlayBusInputDataSettings;
}

/*
 * Output
 */
export enum VideoOverlayBusOutputCmd {
	INIT_COMPLETE,
	STATS,
}

export interface VideoOverlayBusOutputDataStats {
	fps: number;
}

export interface VideoOverlayBusOutputPayload {
	cmd: VideoOverlayBusOutputCmd;
	data: boolean | VideoOverlayBusOutputDataStats;
}
