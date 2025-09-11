import { GamingCanvasGridUint16Array, GamingCanvasGridICamera } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMasksAndValues {
	BLOCKING_ALL_MASK = 0x4000 | 0x8000, // WALL * WALL_INVISIBLE
	BLOCKING_VISIBLE_MASK = 0x4000, // WALL
	EXTENDED = 0x0100, // asset id is now also a reference to an object
	FLOOR = 0x0200,
	ID_MASK = 0x00ff, // 255 possible
	LIGHT = 0x0400,
	NULL = 0x0000,
	SPRITE_FIXED_NS = 0x0800,
	SPRITE_FIXED_EW = 0x1000,
	SPRITE_ROTATING = 0x2000,
	WALL = 0x4000,
	WALL_INVISIBLE = 0x8000,
}

export interface GameGridExtended {}

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	grid: GamingCanvasGridUint16Array;
	gridExtended: Map<number, GameGridExtended>;
	position: GamingCanvasGridICamera;
}
