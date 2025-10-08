/**
 * @author tknight-dev
 */

import { GameDifficulty, GameMap } from '../../models/game.model.js';
import { CalcMainBusOutputDataActionWallMove } from '../calc-main/calc-main.model.js';

/*
 * Stats
 */
export enum CalcPathBusStats {
	ALL,
	PATH,
}

/*
 * Input
 */
export enum CalcPathBusInputCmd {
	ACTION_WALL_MOVE,
	INIT,
	MAP,
	NPC_UPDATE,
	PAUSE,
	PLAYER_UPDATE,
	SETTINGS,
	UPDATE,
}

export interface CalcPathBusInputDataInit extends CalcPathBusInputDataSettings {
	gameMap: GameMap;
}

export interface CalcPathBusInputDataPlayerUpdate {
	player1GridIndex?: number;
	player2GridIndex?: number;
}

export interface CalcPathBusInputDataSettings {
	debug: boolean;
	difficulty: GameDifficulty;
	player2Enable: boolean;
}

export interface CalcPathBusInputPayload {
	cmd: CalcPathBusInputCmd;
	data:
		| boolean
		| CalcPathBusInputDataInit
		| CalcPathBusInputDataPlayerUpdate
		| CalcPathBusInputDataSettings
		| CalcMainBusOutputDataActionWallMove
		| Float32Array[]
		| GameMap;
}

/*
 * Output
 */
export enum CalcPathBusOutputCmd {
	INIT_COMPLETE,
	PATH_UPDATE,
	STATS,
}

export interface CalcPathBusOutputDataStats {
	all: Float32Array;
	path: Float32Array;
	pathCount: number;
}

export interface CalcPathBusOutputPayload {
	cmd: CalcPathBusOutputCmd;
	data: boolean | Map<number, number[]> | CalcPathBusOutputDataStats;
}
