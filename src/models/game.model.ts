import { GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMasksAndValues {
	BLOCKING_MASK = 0x0040, // WALL
	EXTENDED = 0x0001, // true is id reference to object else asset id
	FLOOR = 0x0002,
	ID_MASK = 0xff00, // 255 possible
	ID_SHIFT = 9, // ID_MASK << 9
	LIGHT = 0x0004,
	NULL = 0x0000,
	SPRITE_FIXED_H = 0x0008,
	SPRITE_FIXED_V = 0x0010,
	SPRITE_ROTATING = 0x0020,
	WALL = 0x0040,
	WALL_INVISIBLE = 0x0080,
}

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	cameraRIntial: number;
	cameraZoomIntial: number;
	grid: GamingCanvasGridUint16Array;
	gridEnds: number[]; // Level ending cells array by data index
	gridStartX: number;
	gridStartY: number;
}
