import { GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Values are shifted to mask position
 */
export enum GameGridCellMaskAndValues {
	ASSET_ID_MASK = 0xfff0, // 4095 possible wall images
	FLOOR_MASK = 0x01,
	FLOOR_VALUE = 1,
	NULL_MASK = 0x09,
	SPRITE_MASK = 0x02,
	SPRITE_VALUE = 2,
	LIGHT_MASK = 0x04,
	LIGHT_VALUE = 4,
	WALL_MASK = 0x08,
	WALL_VALUE = 8,
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
