import { GamingCanvasConstPI_1_000, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { FPS, RaycastQuality } from '../../models/settings.model.js';
import { GamingCanvasGridRaycastCellSide, GamingCanvasGridRaycastResultDistanceMapInstance } from '@tknight-dev/gaming-canvas/grid';
import { CharacterInput, CharacterWeapon } from '../../models/character.model.js';

/**
 * @author tknight-dev
 */

/*
 * Stats
 */
export enum CalcMainBusStats {
	ALL,
	AUDIO,
}

/*
 * Actions
 */

export interface CalcMainBusActionDoorState {
	cellSide: GamingCanvasGridRaycastCellSide;
	closed: boolean;
	closing: boolean;
	gridIndex: number;
	open: boolean;
	opening: boolean;
	timestampUnix: number; // Unix Timestamp for syncing between threads (WebWorkers)
	timeout?: number;
}
export const CalcMainBusActionDoorStateAutoCloseDurationInMS: number = 5000;
export const CalcMainBusActionDoorStateChangeDurationInMS: number = 1000;
export const CalcMainBusActionWallMoveStateChangeDurationInMS: number = 5000;

export const CalcMainBusDieFrameDurationInMS: number = 250;

export const CalcMainBusFOVByDifficulty: Map<GameDifficulty, number> = new Map();
CalcMainBusFOVByDifficulty.set(GameDifficulty.EASY, (22 * GamingCanvasConstPI_1_000) / 180);
CalcMainBusFOVByDifficulty.set(GameDifficulty.NORMAL, (20 * GamingCanvasConstPI_1_000) / 180);
CalcMainBusFOVByDifficulty.set(GameDifficulty.HARD, (18 * GamingCanvasConstPI_1_000) / 180);
CalcMainBusFOVByDifficulty.set(GameDifficulty.INSANE, (16 * GamingCanvasConstPI_1_000) / 180);

export const CalcMainBusPlayerDamageByDifficulty: Map<GameDifficulty, number> = new Map();
CalcMainBusPlayerDamageByDifficulty.set(GameDifficulty.EASY, 10);
CalcMainBusPlayerDamageByDifficulty.set(GameDifficulty.NORMAL, 20);
CalcMainBusPlayerDamageByDifficulty.set(GameDifficulty.HARD, 30);
CalcMainBusPlayerDamageByDifficulty.set(GameDifficulty.INSANE, 50);

export const CalcMainBusPlayerDeadFadeDurationInMS: number = 4000;
export const CalcMainBusPlayerDeadFallDurationInMS: number = 5000;
export const CalcMainBusPlayerHitDurationInMS: number = 1000;

export const CalcMainBusWeaponDamage: Map<CharacterWeapon, number> = new Map();
CalcMainBusWeaponDamage.set(CharacterWeapon.KNIFE, 20);
CalcMainBusWeaponDamage.set(CharacterWeapon.MACHINE_GUN, 100);
CalcMainBusWeaponDamage.set(CharacterWeapon.PISTOL, 100);
CalcMainBusWeaponDamage.set(CharacterWeapon.SUB_MACHINE_GUN, 100);

export const CalcMainBusWeaponFireDurationsInMS: Map<CharacterWeapon, number[]> = new Map();
CalcMainBusWeaponFireDurationsInMS.set(CharacterWeapon.KNIFE, [100, 100, 100, 100, 100]);
CalcMainBusWeaponFireDurationsInMS.set(CharacterWeapon.MACHINE_GUN, [100, 100, 100, 100, 100]);
CalcMainBusWeaponFireDurationsInMS.set(CharacterWeapon.PISTOL, [100, 100, 100, 100, 100]);
CalcMainBusWeaponFireDurationsInMS.set(CharacterWeapon.SUB_MACHINE_GUN, [100, 100, 100, 100, 100]);

export const CalcMainBusWeaponFireFrame: Map<number, number> = new Map();
CalcMainBusWeaponFireFrame.set(CharacterWeapon.KNIFE, 3);
CalcMainBusWeaponFireFrame.set(CharacterWeapon.MACHINE_GUN, 2);
CalcMainBusWeaponFireFrame.set(CharacterWeapon.PISTOL, 2);
CalcMainBusWeaponFireFrame.set(CharacterWeapon.SUB_MACHINE_GUN, 2);

/*
 * Input
 */
export enum CalcMainBusInputCmd {
	AUDIO_START,
	AUDIO_STOP,
	CAMERA,
	CHARACTER_INPUT,
	CHEAT_CODE,
	INIT,
	MAP,
	META,
	META_RESET,
	PATH_UPDATE,
	PAUSE,
	REPORT,
	SAVE,
	SETTINGS,
	WEAPON_SELECT,
}

export interface CalcMainBusInputDataAudio {
	instance: number | null; // null on failure
	request?: number; // unique to calc engine
}

export interface CalcMainBusInputDataCamera {
	camera: Float64Array;
	input?: CalcMainBusInputDataPlayerInput;
}

export interface CalcMainBusInputDataInit extends CalcMainBusInputDataSettings {
	report: GamingCanvasReport;
}

export interface CalcMainBusInputDataPlayerInput {
	player1: CharacterInput;
	player2: CharacterInput;
}

export interface CalcMainBusInputDataSettings {
	audioNoAction: boolean;
	audioWallCollisions: boolean;
	debug: boolean;
	difficulty: GameDifficulty;
	fov: number;
	fps: FPS;
	player2Enable: boolean;
	raycastQuality: RaycastQuality;
}

export interface CalcMainBusInputDataWeaponSelect {
	player1: boolean;
	weapon: CharacterWeapon;
}

export interface CalcMainBusInputPayload {
	cmd: CalcMainBusInputCmd;
	data:
		| boolean
		| CalcMainBusInputDataAudio
		| CalcMainBusInputDataCamera
		| CalcMainBusInputDataInit
		| CalcMainBusInputDataPlayerInput
		| CalcMainBusInputDataSettings
		| CalcMainBusInputDataWeaponSelect
		| CharacterInput
		| Float64Array
		| GameMap
		| GamingCanvasReport
		| Map<number, number[]>
		| string;
}

/*
 * Output
 */
export enum CalcMainBusOutputCmd {
	ACTION_DOOR,
	ACTION_SWITCH,
	ACTION_WALL_MOVE,
	AUDIO,
	CAMERA,
	CALCULATIONS,
	CHARACTER_META,
	GAME_OVER,
	INIT_COMPLETE,
	MAP_UPDATE,
	NPC_UPDATE,
	PATH_UPDATE,
	PLAYER_DIED,
	PLAYER_HIT,
	SAVE,
	STATS,
	WEAPON_FIRE,
	WEAPON_SELECT,
}

export interface CalcMainBusOutputDataActionSwitch {
	cellValue: number;
	gridIndex: number;
}

export interface CalcMainBusOutputDataActionWallMove {
	cellSide: GamingCanvasGridRaycastCellSide;
	gridIndex: number;
	timestampUnix: number;
}

export interface CalcMainBusOutputDataAudio {
	assetId?: number; // no assetId is modify existing instance
	instance?: number; // assetId and instance is stop old instance; assetId and no instance is play new asset
	pan?: number;
	stop?: boolean;
	volume?: number;
	request?: number; // unique to calc engine
}

export interface CalcMainBusOutputDataCamera {
	camera: Float64Array;
	player1Camera: Float64Array;
	player2Camera: Float64Array;
	rays: Float64Array;
	raysMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	raysMapKeysSorted: Float64Array;
	timestampUnix: number;
}

export interface CalcMainBusOutputDataCharacterMeta {
	player1?: Uint16Array;
	player2?: Uint16Array;
}

export interface CalcMainBusOutputDataCalculations {
	characterPlayer1Camera?: Float64Array;
	characterPlayer1Rays?: Float64Array;
	characterPlayer1RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer1RaysMapKeysSorted?: Float64Array;
	characterPlayer2Camera?: Float64Array;
	characterPlayer2Rays?: Float64Array;
	characterPlayer2RaysMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>;
	characterPlayer2RaysMapKeysSorted?: Float64Array;
	timestampUnix: number;
}

export interface CalcMainBusOutputDataPlayerHit {
	angle: number;
	player1: boolean;
}

export interface CalcMainBusOutputDataStats {
	all: Float32Array;
	audio: Float32Array;
	cps: number;
}

export interface CalcMainBusOutputDataWeaponFire {
	player1: boolean;
	refire?: boolean;
}

export interface CalcMainBusOutputDataWeaponSave {
	mapRaw: string;
	metaRaw: string;
}

export interface CalcMainBusOutputDataWeaponSelect {
	player1: boolean;
	weapon: CharacterWeapon;
}

export interface CalcMainBusOutputPayload {
	cmd: CalcMainBusOutputCmd;
	data:
		| boolean
		| CalcMainBusOutputDataActionSwitch
		| CalcMainBusOutputDataActionWallMove
		| CalcMainBusActionDoorState
		| CalcMainBusOutputDataAudio
		| CalcMainBusOutputDataCamera
		| CalcMainBusOutputDataCalculations
		| CalcMainBusOutputDataCharacterMeta
		| CalcMainBusOutputDataPlayerHit
		| CalcMainBusOutputDataStats
		| CalcMainBusOutputDataWeaponFire
		| CalcMainBusOutputDataWeaponSave
		| CalcMainBusOutputDataWeaponSelect
		| Float32Array[]
		| Map<number, number[]>
		| Uint16Array
		| undefined;
}
