/**
 * @author tknight-dev
 */

/**
 * Data: table cell accessed via (64 * x + y)
 */
export interface GameMap {
	data: Uint8Array;
	dataEnds: number[]; // Level ending cells array by data index
	dataLights: number[]; // Level ending cells array by data index
	dataWidth: number;
}

export enum GameMapCellMasks {
	ASSET_ID = 0xfc, // 63 possible
	TYPE_DOOR = 0x02, // 1 is door, 0 is nothing
	TYPE_WALL = 0x01, // 1 is wall, 0 is floor
}
