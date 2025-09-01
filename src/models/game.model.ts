import { GamingCanvasGridUint8ClampedArray } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMaskAndValues {
	NULL_MASK = 0x01,
	NULL_VALUE = 0,
	NULL_VALUE_NOT = 1,
	FLOOR_MASK = 0x02,
	FLOOR_VALUE = 0,
	WALL_MASK = 0x02,
	WALL_VALUE = 2, // 1 << 1
}

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	cameraZoomIntial: number;
	grid: GamingCanvasGridUint8ClampedArray;
	gridEnds: number[]; // Level ending cells array by data index
	gridLights: number[]; // Level ending cells array by data index
}

// export enum GameMapCellMasks {
// 	ASSET_ID = 0xfc, // 63 possible
// 	TYPE_DOOR = 0x02, // 1 is door, 0 is nothing
// 	TYPE_WALL = 0x01, // 1 is wall, 0 is floor
// }
