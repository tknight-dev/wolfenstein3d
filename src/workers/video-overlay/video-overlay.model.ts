import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameMap } from '../../models/game.model.js';
import { CalcMainBusOutputDataActionTag } from '../calc-main/calc-main.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoOverlayBusInputCmd {
	ACTION_TAG,
	GAME_OVER,
	INIT,
	LOCKED,
	PAUSE,
	PLAYER_DEAD,
	PLAYER_HIT,
	REPORT,
	RESET,
	SETTINGS,
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
