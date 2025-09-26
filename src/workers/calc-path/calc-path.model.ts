/**
 * @author tknight-dev
 */

import { GameDifficulty, GameMap } from '../../models/game.model.js';

/*
 * Input
 */
export enum CalcPathBusInputCmd {
	INIT,
	MAP,
	NPC_UPDATE,
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
	data: CalcPathBusInputDataInit | CalcPathBusInputDataPlayerUpdate | CalcPathBusInputDataSettings | Float32Array[] | GameMap;
}

/*
 * Output
 */
export enum CalcPathBusOutputCmd {
	INIT_COMPLETE,
	PATH_UPDATE,
	STATS,
}

export interface CalcPathBusOutputDataStats {}

export interface CalcPathBusOutputPayload {
	cmd: CalcPathBusOutputCmd;
	data: boolean | Map<number, number[]> | CalcPathBusOutputDataStats;
}
