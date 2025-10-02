import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS, LightingQuality, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import { CalcMainBusActionDoorState, CalcMainBusOutputDataActionSwitch, CalcMainBusOutputDataActionWallMove } from '../calc-main/calc-main.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	ACTION_DOOR,
	ACTION_SWITCH,
	ACTION_WALL_MOVE,
	CALCULATIONS,
	INIT,
	MAP,
	MAP_UPDATE,
	NPC_UPDATE,
	PAUSE,
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
	debug: boolean;
	difficulty: GameDifficulty;
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
	data:
		| boolean
		| CalcMainBusActionDoorState
		| CalcMainBusOutputDataActionSwitch
		| CalcMainBusOutputDataActionWallMove
		| Float32Array[]
		| Float64Array
		| GameMap
		| GamingCanvasReport
		| Uint16Array
		| VideoMainBusInputDataCalculations
		| VideoMainBusInputDataInit
		| VideoMainBusInputDataSettings;
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
