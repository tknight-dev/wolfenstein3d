import { GamingCanvasGridUint16Array, GamingCanvasGridICamera } from '@tknight-dev/gaming-canvas/grid';
import { CharacterNPC } from './character.model.js';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMasksAndValues {
	BLOCKING_MASK_ALL = 0x2000 | 0x4000 | 0x8000,
	BLOCKING_MASK_VISIBLE = 0x2000 | 0x8000,
	FLOOR = 0x0100,
	EXTENDED = 0x0200, // asset id is now also a reference to an object
	ID_MASK = 0x00ff, // 255 possible
	LIGHT = 0x0400,
	NULL = 0x0000,
	SPRITE_FIXED_EW = 0x0800,
	SPRITE_FIXED_NS = 0x1000,
	WALL = 0x2000,
	WALL_INVISIBLE = 0x4000,
	WALL_MOVABLE = 0x8000,
}

export enum GameGridCellMasksAndValuesExtended {
	DOOR = 0x0080,
	DOOR_LOCKED_1 = 0x0040,
	DOOR_LOCKED_2 = 0x0020,
	ID_MASK = 0x0007, // 7 possible
	SWITCH = 0x0010,
	TELEPORT = 0x0008,
}

export const gameGridCellMaskExtendedDoor: number =
	GameGridCellMasksAndValuesExtended.DOOR | GameGridCellMasksAndValuesExtended.DOOR_LOCKED_1 | GameGridCellMasksAndValuesExtended.DOOR_LOCKED_2;

export const gameGridCellMaskSpriteFixed: number = GameGridCellMasksAndValues.SPRITE_FIXED_EW | GameGridCellMasksAndValues.SPRITE_FIXED_NS;

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	grid: GamingCanvasGridUint16Array;
	npc: Map<number, CharacterNPC>; // number is id
	position: GamingCanvasGridICamera;
}

export enum GameDifficulty {
	EASY = 0,
	NORMAL = 1,
	HARD = 2,
	INSANE = 3,
}
