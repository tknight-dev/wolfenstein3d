import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS, LightingQuality, RaycastQuality, RenderMode } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import {
	CalcMainBusActionDoorState,
	CalcMainBusOutputDataActionSwitch,
	CalcMainBusOutputDataActionTag,
	CalcMainBusOutputDataActionWallMove,
	CalcMainBusOutputDataNPCUpdate,
} from '../calc-main/calc-main.model.js';
import { CharacterWeapon } from '../../models/character.model.js';

/**
 * @author tknight-dev
 */

/*
 * Stats
 */
export enum VideoMainBusStats {
	ALL,
	NPC_C_V,
	RAY,
	RAY_C_V,
	SPRITE,
}

/*
 * Input
 */
export enum VideoMainBusInputCmd {
	ACTION_DOOR,
	ACTION_SWITCH,
	ACTION_TAG,
	ACTION_WALL_MOVE,
	CALCULATIONS,
	INIT,
	MAP,
	MAP_UPDATE,
	NPC_UPDATE,
	PAUSE,
	PLAYER_DEAD,
	REPORT,
	SETTINGS,
	WEAPON_FIRE,
	WEAPON_SELECT,
}

export interface VideoMainBusInputDataCalculations {
	camera: Float64Array;
	cameraAlt?: Float64Array;
	edit?: boolean;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
	timestampUnix: number;
}

export interface VideoMainBusInputDataInit extends VideoMainBusInputDataSettings {
	offscreenCanvas: OffscreenCanvas;
	player1: boolean;
	report: GamingCanvasReport;
}

export interface VideoMainBusInputDataSettings {
	antialias: boolean;
	crosshair: boolean;
	debug: boolean;
	difficulty: GameDifficulty;
	fov: number;
	fps: FPS;
	gamma: number; // 0 - 1 - 2
	grayscale: boolean;
	lightingQuality: LightingQuality;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
	renderMode: RenderMode;
}

export interface VideoMainBusInputPayload {
	cmd: VideoMainBusInputCmd;
	data:
		| boolean
		| CalcMainBusActionDoorState
		| CalcMainBusOutputDataActionSwitch
		| CalcMainBusOutputDataActionTag
		| CalcMainBusOutputDataActionWallMove
		| CalcMainBusOutputDataNPCUpdate
		| CharacterWeapon
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
	all: Float32Array;
	countRays: number;
	countSprites: number;
	fps: number;
	npc_c_v: Float32Array;
	ray: Float32Array;
	ray_c_v: Float32Array;
	sprite: Float32Array;
}

export interface VideoMainBusOutputPayload {
	cmd: VideoMainBusOutputCmd;
	data: boolean | VideoMainBusOutputDataStats;
}
