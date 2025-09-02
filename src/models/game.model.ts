import { GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMaskAndValues {
	ASSET_ID_MASK = 0xfff0, // 4095 Possible
	DOOR_MASK = 0x04,
	DOOR_VALUE = 0,
	FLOOR_MASK = 0x02,
	FLOOR_VALUE = 0,
	NULL_MASK = 0x01,
	NULL_VALUE = 0,
	NULL_VALUE_NOT = 1,
	RESERVED_1_MASK = 0x04,
	RESERVED_1_VALUE = 4,
	RESERVED_2_MASK = 0x08,
	RESERVED_2_VALUE = 0,
	RESERVED_3_MASK = 0x08,
	RESERVED_3_VALUE = 8,
	WALL_MASK = 0x02,
	WALL_VALUE = 2, // 1 << 1
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
