import { CharacterNPC, CharacterNPCUpdateDecodeAndApply, CharacterNPCUpdateDecodeId } from '../../models/character.model.js';
import {
	CalcPathBusInputCmd,
	CalcPathBusInputDataInit,
	CalcPathBusInputDataPlayerUpdate,
	CalcPathBusInputDataSettings,
	CalcPathBusInputPayload,
	CalcPathBusOutputCmd,
	CalcPathBusOutputPayload,
	CalcPathBusStats,
} from './calc-path.model.js';
import { GameDifficulty, GameGridCellMaskBlockingAll, GameGridCellMasksAndValues, GameMap } from '../../models/game.model.js';
import {
	GamingCanvasGridPathAStarResult,
	GamingCanvasGridPathAStarOptions,
	GamingCanvasGridPathAStarOptionsPathHeuristic,
	GamingCanvasGridUtilDistance,
	GamingCanvasGridRaycastCellSide,
	GamingCanvasGridUint32Array,
} from '@tknight-dev/gaming-canvas/grid';
import { GamingCanvasGridPathAStar, GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';
import { Assets } from '../../modules/assets.js';
import {
	CalcMainBusActionWallMoveStateChangeDurationInMS,
	CalcMainBusOutputDataActionWallMove,
	CalcMainBusOutputDataNPCUpdate,
} from '../calc-main/calc-main.model.js';
import { GamingCanvasStat, GamingCanvasUtilTimers } from '@tknight-dev/gaming-canvas';
import { AssetIdImgCharacter } from '../../asset-manager.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: CalcPathBusInputPayload = event.data;

	switch (payload.cmd) {
		case CalcPathBusInputCmd.ACTION_WALL_MOVE:
			CalcPathEngine.inputActionWallMove(<CalcMainBusOutputDataActionWallMove>payload.data);
			break;
		case CalcPathBusInputCmd.MAP:
			CalcPathEngine.inputMap(<GameMap>payload.data);
			break;
		case CalcPathBusInputCmd.INIT:
			CalcPathEngine.initialize(<CalcPathBusInputDataInit>payload.data);
			break;
		case CalcPathBusInputCmd.NPC_UPDATE:
			CalcPathEngine.inputNPCUpdate(<CalcMainBusOutputDataNPCUpdate>payload.data);
			break;
		case CalcPathBusInputCmd.PAUSE:
			CalcPathEngine.inputPause(<boolean>payload.data);
			break;
		case CalcPathBusInputCmd.PLAYER_UPDATE:
			CalcPathEngine.inputPlayerUpdate(<CalcPathBusInputDataPlayerUpdate>payload.data);
			break;
		case CalcPathBusInputCmd.SETTINGS:
			CalcPathEngine.inputSettings(<CalcPathBusInputDataSettings>payload.data);
			break;
	}
};

class CalcPathEngine {
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static npcUpdate: Float32Array[];
	private static npcUpdateNew: boolean;
	private static playerUpdate: CalcPathBusInputDataPlayerUpdate;
	private static playerUpdateNew: boolean;
	private static pause: boolean = true;
	private static request: number;
	private static settings: CalcPathBusInputDataSettings;
	private static settingsNew: boolean;
	private static stats: { [key: number]: GamingCanvasStat } = {};
	private static timers: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();

	public static async initialize(data: CalcPathBusInputDataInit): Promise<void> {
		// Stats
		CalcPathEngine.stats[CalcPathBusStats.ALL] = new GamingCanvasStat(50);
		CalcPathEngine.stats[CalcPathBusStats.PATH] = new GamingCanvasStat(50);

		// Config: Settings
		CalcPathEngine.inputSettings(data as CalcPathBusInputDataSettings);

		// Start
		CalcPathEngine.post([
			{
				cmd: CalcPathBusOutputCmd.INIT_COMPLETE,
				data: true,
			},
		]);

		// Start rendering thread
		CalcPathEngine.go__funcForward();
		CalcPathEngine.request = requestAnimationFrame(CalcPathEngine.go);
	}

	/*
	 * Input
	 */
	public static inputActionWallMove(data: CalcMainBusOutputDataActionWallMove): void {
		const gameMapGridData: Uint32Array = CalcPathEngine.gameMap.grid.data;

		// Calc: Offset
		let offset: number, spriteType: number;
		switch (data.cellSide) {
			case GamingCanvasGridRaycastCellSide.EAST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = CalcPathEngine.gameMap.grid.sideLength;
				break;
			case GamingCanvasGridRaycastCellSide.NORTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = -1;
				break;
			case GamingCanvasGridRaycastCellSide.SOUTH:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_EW;
				offset = 1;
				break;
			case GamingCanvasGridRaycastCellSide.WEST:
				spriteType = GameGridCellMasksAndValues.SPRITE_FIXED_NS;
				offset = -CalcPathEngine.gameMap.grid.sideLength;
				break;
		}

		// Calc: State
		gameMapGridData[data.gridIndex + offset * 2] = gameMapGridData[data.gridIndex] & ~GameGridCellMasksAndValues.WALL_MOVABLE;

		gameMapGridData[data.gridIndex] &= ~GameGridCellMasksAndValues.WALL;
		gameMapGridData[data.gridIndex] |= spriteType;

		// Calc: Move 1st Block
		CalcPathEngine.timers.add(
			() => {
				// 2nd block
				gameMapGridData[data.gridIndex + offset] = gameMapGridData[data.gridIndex];

				data.timestampUnix += (CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0;

				// 1st block
				gameMapGridData[data.gridIndex] = GameGridCellMasksAndValues.FLOOR;

				// Calc: Move 2nd Block
				CalcPathEngine.timers.add(
					() => {
						gameMapGridData[data.gridIndex + offset] = GameGridCellMasksAndValues.FLOOR;
					},
					(CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0,
				);
			},
			(CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0,
		);
	}

	public static inputMap(data: GameMap): void {
		CalcPathEngine.gameMap = Assets.mapParse(data);
		CalcPathEngine.gameMapNew = true;
	}

	public static inputNPCUpdate(data: CalcMainBusOutputDataNPCUpdate): void {
		CalcPathEngine.npcUpdate = data.npcs;
		CalcPathEngine.npcUpdateNew = true;
	}

	public static inputPause(state: boolean): void {
		CalcPathEngine.pause = state;
	}

	public static inputPlayerUpdate(data: CalcPathBusInputDataPlayerUpdate): void {
		CalcPathEngine.playerUpdate = data;
		CalcPathEngine.playerUpdateNew = true;
	}

	public static inputSettings(data: CalcPathBusInputDataSettings): void {
		CalcPathEngine.settings = data;
		CalcPathEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: CalcPathBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let characterNPC: CharacterNPC,
			characterNPCId: number,
			characterNPCPathById: Map<number, number[]> = new Map(),
			characterNPCUpdateEncoded: Float32Array,
			characterPlayer1GridIndex: number = 0,
			characterPlayer2GridIndex: number = 0,
			count: number = 0,
			gameMap: GameMap,
			gameMapGrid: GamingCanvasGridUint32Array,
			gameMapGridIndex: number,
			gameMapGridPathOptions: GamingCanvasGridPathAStarOptions = {
				// pathClosest: false,
				// pathDiagonalsDisable: true,
				// pathHeuristic: GamingCanvasGridPathAStarOptionsPathHeuristic.DIAGONAL,
			},
			gameMapGridPathResult: GamingCanvasGridPathAStarResult,
			gameMapNPCById: Map<number, CharacterNPC>,
			pathBlocking = (cell: number, gridIndex: number) => {
				if ((cell & GameGridCellMasksAndValues.DOOR) !== 0) {
					return false;
				}

				return (cell & GameGridCellMaskBlockingAll) !== 0;
			},
			pathWeight = (cell: number, gridIndex: number, heuristic: (heuristic?: GamingCanvasGridPathAStarOptionsPathHeuristic) => number) => {
				if ((cell & GameGridCellMasksAndValues.DOOR) !== 0) {
					// Prefer not to use doors
					return heuristic() + 1;
				}

				return 0; // just use heuristic
			},
			pause: boolean = CalcPathEngine.pause,
			settingsDebug: boolean = CalcPathEngine.settings.debug,
			settingsDifficulty: GameDifficulty = CalcPathEngine.settings.difficulty,
			settingsPlayer2Enable: boolean = CalcPathEngine.settings.player2Enable,
			statAll: GamingCanvasStat = CalcPathEngine.stats[CalcPathBusStats.ALL],
			statAllRaw: Float32Array,
			statPath: GamingCanvasStat = CalcPathEngine.stats[CalcPathBusStats.PATH],
			statPathRaw: Float32Array,
			timers: GamingCanvasUtilTimers = CalcPathEngine.timers,
			timestampDelta: number,
			timestampStats: number = 0,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			CalcPathEngine.request = requestAnimationFrame(go);

			// Timing
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta !== 0) {
				if (CalcPathEngine.pause !== pause) {
					pause = CalcPathEngine.pause;

					if (pause !== true) {
						timers.clockUpdate(timestampNow);
					}
				}
				if (pause !== true) {
					timers.tick(timestampNow);
				}
			}

			if (timestampDelta > 1000) {
				timestampThen = timestampNow;
				statAll.watchStart();

				if (CalcPathEngine.gameMapNew === true) {
					CalcPathEngine.gameMapNew = false;

					gameMap = CalcPathEngine.gameMap;
					gameMapGrid = CalcPathEngine.gameMap.grid;
					gameMapNPCById = CalcPathEngine.gameMap.npcById;

					characterPlayer1GridIndex = gameMap.position.x * gameMapGrid.sideLength + gameMap.position.y;
					characterPlayer2GridIndex = characterPlayer1GridIndex;
				}

				if (CalcPathEngine.npcUpdateNew === true) {
					CalcPathEngine.npcUpdateNew = false;

					for (characterNPCUpdateEncoded of CalcPathEngine.npcUpdate) {
						// Reference
						characterNPCId = CharacterNPCUpdateDecodeId(characterNPCUpdateEncoded);
						characterNPC = <CharacterNPC>gameMapNPCById.get(characterNPCId);

						if (characterNPC === undefined) {
							continue;
						}

						// Update
						CharacterNPCUpdateDecodeAndApply(characterNPCUpdateEncoded, characterNPC, 0);
					}
				}

				if (CalcPathEngine.playerUpdateNew === true) {
					CalcPathEngine.playerUpdateNew = false;

					if (CalcPathEngine.playerUpdate.player1GridIndex !== undefined) {
						characterPlayer1GridIndex = CalcPathEngine.playerUpdate.player1GridIndex;
					}

					if (CalcPathEngine.playerUpdate.player2GridIndex !== undefined) {
						characterPlayer2GridIndex = CalcPathEngine.playerUpdate.player2GridIndex;
					}
					// console.log(characterPlayer1GridIndex, characterPlayer2GridIndex);
				}

				if (CalcPathEngine.settingsNew === true) {
					CalcPathEngine.settingsNew = false;

					settingsDebug = CalcPathEngine.settings.debug;
					settingsDifficulty = CalcPathEngine.settings.difficulty;
					settingsPlayer2Enable = CalcPathEngine.settings.player2Enable;
				}

				/**
				 * Paths
				 */
				count = 0;

				if (gameMap === undefined) {
					return;
				}

				for (characterNPC of gameMapNPCById.values()) {
					if (characterNPC.assetId === AssetIdImgCharacter.CORPSE || characterNPC.difficulty > settingsDifficulty) {
						continue;
					}
					count++;

					if (settingsPlayer2Enable !== true) {
						gameMapGridIndex = characterPlayer1GridIndex;
					} else {
						if (
							GamingCanvasGridUtilDistance(characterPlayer1GridIndex, characterNPC.gridIndex, gameMapGrid) <
							GamingCanvasGridUtilDistance(characterPlayer2GridIndex, characterNPC.gridIndex, gameMapGrid)
						) {
							gameMapGridIndex = characterPlayer1GridIndex;
						} else {
							gameMapGridIndex = characterPlayer2GridIndex;
						}
					}

					// Calc path
					statPath.watchStart();
					gameMapGridPathResult = GamingCanvasGridPathAStar(
						characterNPC.gridIndex,
						gameMapGridIndex,
						gameMapGrid,
						pathBlocking,
						pathWeight,
						gameMapGridPathOptions,
					);
					statPath.watchStop();
					gameMapGridPathOptions.memory = gameMapGridPathResult.memory;

					// Set path
					characterNPCPathById.set(characterNPC.id, gameMapGridPathResult.path || []);
				}

				CalcPathEngine.post([
					{
						cmd: CalcPathBusOutputCmd.PATH_UPDATE,
						data: characterNPCPathById,
					},
				]);
				statAll.watchStop();
			}

			// Stats: sent once per second
			if (timestampNow - timestampStats > 999) {
				timestampStats = timestampNow;

				statPathRaw = <Float32Array>statPath.encode();
				statAllRaw = <Float32Array>statAll.encode();

				// Output
				CalcPathEngine.post(
					[
						{
							cmd: CalcPathBusOutputCmd.STATS,
							data: {
								all: statAllRaw,
								path: statPathRaw,
								pathCount: count,
							},
						},
					],
					[statAllRaw.buffer, statPathRaw.buffer],
				);
			}
		};
		CalcPathEngine.go = go;
	}
}
