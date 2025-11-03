import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { CalcMainBusActionDoorState, CalcMainBusOutputDataActionTag, CalcMainBusOutputDataActionWallMove } from '../calc-main/calc-main.model.js';
import { Navigation } from '../../models/settings.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoOverlayBusInputCmd {
	ACTION_DOOR,
	ACTION_TAG,
	ACTION_WALL_MOVE,
	CALCULATIONS,
	GAME_OVER,
	INIT,
	LOCKED,
	MAP,
	MAP_MAP,
	MAP_SHOW_ALL,
	MAP_UPDATE,
	MAP_ZOOM,
	PAUSE,
	PLAYER_DEAD,
	PLAYER_HIT,
	REPORT,
	SETTINGS,
}

export interface VideoOverlayBusInputDataCalculations {
	characterPlayerCamera: Float64Array;
	characterPlayerCameraAlt?: Float64Array;
}

export interface VideoOverlayBusInputDataInit extends VideoOverlayBusInputDataSettings {
	offscreenCanvas: OffscreenCanvas;
	player1: boolean;
	report: GamingCanvasReport;
}

export interface VideoOverlayBusInputDataMapMap {
	seen: Uint16Array;
	zoom: number;
}

export interface VideoOverlayBusInputDataSettings {
	antialias: boolean;
	debug: boolean;
	difficulty: GameDifficulty;
	fov: number;
	grayscale: boolean;
	navigation: Navigation;
	player2Enable: boolean;
}

export interface VideoOverlayBusInputPayload {
	cmd: VideoOverlayBusInputCmd;
	data:
		| boolean
		| CalcMainBusActionDoorState
		| CalcMainBusOutputDataActionTag
		| CalcMainBusOutputDataActionWallMove
		| Float32Array[]
		| Float64Array
		| GameMap
		| GamingCanvasReport
		| number
		| number[]
		| Uint16Array
		| Uint32Array
		| VideoOverlayBusInputDataCalculations
		| VideoOverlayBusInputDataInit
		| VideoOverlayBusInputDataMapMap
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
	mapSeen: Uint16Array;
	mapZoom: number;
}

export interface VideoOverlayBusOutputPayload {
	cmd: VideoOverlayBusOutputCmd;
	data: boolean | VideoOverlayBusOutputDataStats;
}
