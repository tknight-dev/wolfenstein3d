import { CharacterNPC, CharacterNPCUpdateDecodeAndApply, CharacterNPCUpdateDecodeId } from '../../models/character.model.js';
import {
	CalcPathBusInputCmd,
	CalcPathBusInputDataInit,
	CalcPathBusInputDataPlayerUpdate,
	CalcPathBusInputDataSettings,
	CalcPathBusInputPayload,
	CalcPathBusOutputCmd,
	CalcPathBusOutputPayload,
} from './calc-path.model.js';
import { GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../../models/game.model.js';
import {
	GamingCanvasGridPathAStarResult,
	GamingCanvasGridPathAStarOptions,
	GamingCanvasGridPathAStarOptionsPathHeuristic,
	GamingCanvasGridUtilDistance,
	GamingCanvasGridRaycastCellSide,
} from '@tknight-dev/gaming-canvas/grid';
import { GamingCanvasGridPathAStar, GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';
import { Assets } from '../../modules/assets.js';
import { CalcMainBusActionWallMoveStateChangeDurationInMS, CalcMainBusOutputDataActionWallMove } from '../calc-main/calc-main.model.js';
import { GamingCanvasUtilTimers } from '@tknight-dev/gaming-canvas';

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
			CalcPathEngine.inputNPCUpdate(<Float32Array[]>payload.data);
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
	private static timers: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();

	public static async initialize(data: CalcPathBusInputDataInit): Promise<void> {
		// Config: Game Map
		CalcPathEngine.inputMap(data.gameMap);

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
		const gameMapGridData: Uint16Array = CalcPathEngine.gameMap.grid.data;

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
		CalcPathEngine.gameMap = Assets.parseMap(data);
		CalcPathEngine.gameMapNew = true;
	}

	public static inputNPCUpdate(data: Float32Array[]): void {
		CalcPathEngine.npcUpdate = data;
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
			gameMap: GameMap = CalcPathEngine.gameMap,
			gameMapGrid: GamingCanvasGridUint16Array = CalcPathEngine.gameMap.grid,
			gameMapGridIndex: number,
			gameMapGridPathOptions: GamingCanvasGridPathAStarOptions = {
				// pathClosest: false,
				// pathDiagonalsDisable: true,
				// pathHeuristic: GamingCanvasGridPathAStarOptionsPathHeuristic.DIAGONAL,
			},
			gameMapGridPathResult: GamingCanvasGridPathAStarResult,
			gameMapNPCs: Map<number, CharacterNPC> = CalcPathEngine.gameMap.npc,
			gameMapNPCsById: Map<number, CharacterNPC> = new Map(),
			pathBlocking = (cell: number, gridIndex: number) => {
				if ((cell & GameGridCellMasksAndValues.EXTENDED) !== 0 && (cell & GameGridCellMasksAndValuesExtended.DOOR) !== 0) {
					return false;
				}

				return (cell & GameGridCellMasksAndValues.BLOCKING_MASK_ALL) !== 0;
			},
			pathWeight = (cell: number, gridIndex: number, heuristic: (heuristic?: GamingCanvasGridPathAStarOptionsPathHeuristic) => number) => {
				if ((cell & GameGridCellMasksAndValues.EXTENDED) !== 0 && (cell & GameGridCellMasksAndValuesExtended.DOOR) !== 0) {
					// Prefer not to use doors
					return heuristic() + 1;
				}

				return 0; // just use heuristic
			},
			pause: boolean = CalcPathEngine.pause,
			settingsDebug: boolean = CalcPathEngine.settings.debug,
			settingsPlayer2Enable: boolean = CalcPathEngine.settings.player2Enable,
			timers: GamingCanvasUtilTimers = CalcPathEngine.timers,
			timestampDelta: number,
			timestampThen: number = 0;

		characterPlayer1GridIndex = gameMap.position.x * gameMapGrid.sideLength + gameMap.position.y;
		characterPlayer2GridIndex = characterPlayer1GridIndex;

		for (characterNPC of gameMapNPCs.values()) {
			gameMapNPCsById.set(characterNPC.id, characterNPC);
		}

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			CalcPathEngine.request = requestAnimationFrame(CalcPathEngine.go);

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (CalcPathEngine.pause !== pause) {
				pause = CalcPathEngine.pause;

				if (pause !== true) {
					timers.clockUpdate(timestampNow);
				}
			}
			if (pause !== true) {
				timers.tick(timestampNow);
			}

			if (timestampDelta > 1000) {
				timestampThen = timestampNow;

				if (CalcPathEngine.gameMapNew === true) {
					CalcPathEngine.gameMapNew = false;

					gameMap = CalcPathEngine.gameMap;
					gameMapGrid = CalcPathEngine.gameMap.grid;
					gameMapNPCs = CalcPathEngine.gameMap.npc;

					characterPlayer1GridIndex = gameMap.position.x * gameMapGrid.sideLength + gameMap.position.y;
					characterPlayer2GridIndex = characterPlayer1GridIndex;
				}

				if (CalcPathEngine.npcUpdateNew === true) {
					CalcPathEngine.npcUpdateNew = false;

					for (characterNPCUpdateEncoded of CalcPathEngine.npcUpdate) {
						// Reference
						characterNPCId = CharacterNPCUpdateDecodeId(characterNPCUpdateEncoded);
						characterNPC = <CharacterNPC>gameMapNPCsById.get(characterNPCId);

						if (characterNPC === undefined) {
							continue;
						}

						// Prepare
						gameMapNPCs.delete(characterNPC.gridIndex);

						// Update
						CharacterNPCUpdateDecodeAndApply(characterNPCUpdateEncoded, characterNPC, 0);

						// Apply
						gameMapNPCs.set(characterNPC.gridIndex, characterNPC);
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
				}

				if (CalcPathEngine.settingsNew === true) {
					CalcPathEngine.settingsNew = false;

					settingsDebug = CalcPathEngine.settings.debug;
					settingsPlayer2Enable = CalcPathEngine.settings.player2Enable;
				}

				/**
				 * Paths
				 */
				for (characterNPC of gameMapNPCs.values()) {
					if (settingsPlayer2Enable !== true) {
						gameMapGridIndex = characterPlayer1GridIndex;
					} else {
						gameMapGridIndex = Math.min(
							GamingCanvasGridUtilDistance(characterPlayer1GridIndex, characterNPC.gridIndex, gameMapGrid),
							GamingCanvasGridUtilDistance(characterPlayer2GridIndex, characterNPC.gridIndex, gameMapGrid),
						);
					}

					// Calc path
					gameMapGridPathResult = GamingCanvasGridPathAStar(
						characterNPC.gridIndex,
						gameMapGridIndex,
						gameMapGrid,
						pathBlocking,
						pathWeight,
						gameMapGridPathOptions,
					);
					gameMapGridPathOptions.memory = gameMapGridPathResult.memory;

					// Set path
					characterNPCPathById.set(characterNPC.id, gameMapGridPathResult.path || []);
				}

				if (settingsDebug === true) {
					CalcPathEngine.post([
						{
							cmd: CalcPathBusOutputCmd.PATH_UPDATE,
							data: characterNPCPathById,
						},
					]);
				}
			}
		};
		CalcPathEngine.go = go;
	}
}
