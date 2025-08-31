import { GamingCanvasGridUint8ClampedArray } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	cameraZoomIntial: number;
	grid: GamingCanvasGridUint8ClampedArray;
	gridEnds: number[]; // Level ending cells array by data index
	gridLights: number[]; // Level ending cells array by data index
}

export enum GameMapCellMasks {
	ASSET_ID = 0xfc, // 63 possible
	TYPE_DOOR = 0x02, // 1 is door, 0 is nothing
	TYPE_WALL = 0x01, // 1 is wall, 0 is floor
}
