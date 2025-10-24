import { GamingCanvasGridICamera, GamingCanvasGridUint32Array } from '@tknight-dev/gaming-canvas/grid';
import { CharacterNPC } from './character.model.js';
import { AssetIdAudio, AssetIdMap } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export enum GameGridCellMasksAndValues {
	ID_MASK = 0x00000fff, // 4095 possible
	NULL = 0x00000000,
	TAG = 0x00001000, // MUX_1
	MUX_2 = 0x00002000,
	MUX_3 = 0x00004000,
	MUX_4 = 0x00008000,
	DISABLED = 0x00010000,
	DOOR = 0x00020000,
	FLOOR = 0x00040000,
	LIGHT = 0x00080000,
	LOCKED_1 = 0x00100000,
	LOCKED_2 = 0x00200000,
	SPRITE_FIXED_EW = 0x00400000,
	SPRITE_FIXED_NS = 0x00800000,
	SWITCH = 0x01000000,
	SWITCH_SECRET = 0x02000000,
	WALL = 0x04000000,
	WALL_INVISIBLE = 0x08000000,
	WALL_MOVABLE = 0x10000000,
	RESERVED_01 = 0x20000000,
	RESERVED_02 = 0x40000000,
	RESERVED_03 = 0x80000000,
}

export enum GameGridCellMasksAndValuesTag {
	EPISODE_END = 0x00000000,
	RESERVED_02 = 0x00000001,
	RESERVED_03 = 0x00000002,
	RESERVED_04 = 0x00000004,
	RESERVED_05 = 0x00000008,
	RESERVED_06 = 0x00000010,
	RESERVED_07 = 0x00000020,
	RESERVED_08 = 0x00000040,
	RESERVED_09 = 0x00000080,
	RESERVED_10 = 0x00000100,
	RESERVED_11 = 0x00000200,
	RESERVED_12 = 0x00000400,
	RESERVED_13 = 0x00000800,
}

export const GameGridCellMaskBlockingAll: number =
	GameGridCellMasksAndValues.WALL | GameGridCellMasksAndValues.WALL_INVISIBLE | GameGridCellMasksAndValues.WALL_MOVABLE;

export const GameGridCellMaskBlockingVisible: number = GameGridCellMasksAndValues.WALL | GameGridCellMasksAndValues.WALL_MOVABLE;

export const gameGridCellMaskMux: number =
	GameGridCellMasksAndValues.TAG | GameGridCellMasksAndValues.MUX_2 | GameGridCellMasksAndValues.MUX_3 | GameGridCellMasksAndValues.MUX_4;

export const gameGridCellMaskSpriteFixed: number = GameGridCellMasksAndValues.SPRITE_FIXED_EW | GameGridCellMasksAndValues.SPRITE_FIXED_NS;

export enum GameDifficulty {
	EASY = 0,
	NORMAL = 1,
	HARD = 2,
	INSANE = 3,
}

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	colorCeiling: number;
	colorFloor: number;
	id: AssetIdMap;
	grid: GamingCanvasGridUint32Array;
	music: AssetIdAudio;
	npcById: Map<number, CharacterNPC>; // number is id
	position: GamingCanvasGridICamera;
	timeParInMS: number;
}
