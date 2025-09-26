import {
	Character,
	CharacterInput,
	CharacterMetaEncode,
	CharacterNPC,
	CharacterNPCState,
	CharacterNPCUpdate,
	CharacterNPCUpdateEncode,
	CharacterWeapon,
} from '../../models/character.model.js';
import {
	CalcMainBusActionDoorState,
	CalcMainBusActionDoorStateAutoCloseDurationInMS,
	CalcMainBusActionDoorStateChangeDurationInMS,
	CalcMainBusActionWallMoveStateChangeDurationInMS,
	CalcMainBusInputCmd,
	CalcMainBusInputDataAudio,
	CalcMainBusInputDataInit,
	CalcMainBusInputDataPlayerInput,
	CalcMainBusInputDataSettings,
	CalcMainBusInputPayload,
	CalcMainBusOutputCmd,
	CalcMainBusOutputPayload,
} from './calc-main.model.js';
import {
	GameDifficulty,
	gameGridCellMaskExtendedDoor,
	GameGridCellMasksAndValues,
	GameGridCellMasksAndValuesExtended,
	GameMap,
} from '../../models/game.model.js';
import { GamingCanvasOrientation, GamingCanvasReport, GamingCanvasUtilScale } from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCharacterControl,
	GamingCanvasGridCharacterControlStyle,
	GamingCanvasGridCharacterControlOptions,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridRaycastCellSide,
	GamingCanvasConstPI_2_00,
	GamingCanvasConstPI_1_00,
	GamingCanvasGridCharacterSeen,
	GamingCanvasGridCharacterInput,
	GamingCanvasConstPI_1_50,
	GamingCanvasConstPI_0_50,
	GamingCanvasConstPI_0_25,
	GamingCanvasConstPI_0_75,
	GamingCanvasConstPI_1_25,
	GamingCanvasConstPI_1_75,
	GamingCanvasGridPathAStarResult,
	GamingCanvasGridPathAStarMemory,
	GamingCanvasGridPathAStarOptions,
	GamingCanvasGridPathAStarOptionsPathHeuristic,
} from '@tknight-dev/gaming-canvas/grid';
import {
	GamingCanvasGridPathAStar,
	GamingCanvasGridCamera,
	GamingCanvasGridICamera,
	GamingCanvasGridRaycast,
	GamingCanvasGridRaycastOptions,
	GamingCanvasGridRaycastResult,
	GamingCanvasGridUint16Array,
} from '@tknight-dev/gaming-canvas/grid';
import { RaycastQuality } from '../../models/settings.model.js';
import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	AssetPropertiesAudio,
	assetsAudio,
	initializeAssetManager,
} from '../../asset-manager.js';
import { Assets } from '../../modules/assets.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: CalcMainBusInputPayload = event.data;

	switch (payload.cmd) {
		case CalcMainBusInputCmd.AUDIO_START:
			CalcMainEngine.inputAudio(true, <CalcMainBusInputDataAudio>payload.data);
			break;
		case CalcMainBusInputCmd.AUDIO_STOP:
			CalcMainEngine.inputAudio(false, <CalcMainBusInputDataAudio>payload.data);
			break;
		case CalcMainBusInputCmd.CAMERA:
			CalcMainEngine.inputCamera(<Float64Array>payload.data);
			break;
		case CalcMainBusInputCmd.CHARACTER_INPUT:
			CalcMainEngine.inputCharacterInput(<CalcMainBusInputDataPlayerInput>payload.data);
			break;
		case CalcMainBusInputCmd.MAP:
			CalcMainEngine.inputMap(<GameMap>payload.data);
			break;
		case CalcMainBusInputCmd.INIT:
			CalcMainEngine.initialize(<CalcMainBusInputDataInit>payload.data);
			break;
		case CalcMainBusInputCmd.PATH_UPDATE:
			CalcMainEngine.inputPath(<Map<number, number[]>>payload.data);
			break;
		case CalcMainBusInputCmd.REPORT:
			CalcMainEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case CalcMainBusInputCmd.SETTINGS:
			CalcMainEngine.inputSettings(<CalcMainBusInputDataSettings>payload.data);
			break;
	}
};

interface AudioInstance {
	assetId: AssetIdAudio;
	instance: number;
	x: number;
	y: number;
}

class CalcMainEngine {
	private static audio: Map<number, AudioInstance> = new Map();
	private static camera: Float64Array;
	private static cameraNew: boolean;
	private static characterPlayerInput: CalcMainBusInputDataPlayerInput;
	private static characterPlayerInputNew: boolean;
	private static characterPlayer1: Character;
	private static characterPlayer2: Character;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static paths: Map<number, number[]>;
	private static pathsNew: boolean;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: CalcMainBusInputDataSettings;
	private static settingsNew: boolean;

	public static async initialize(data: CalcMainBusInputDataInit): Promise<void> {
		// Asset
		await initializeAssetManager(true);

		// Config: Character
		CalcMainEngine.characterPlayer1 = {
			ammo: 8,
			camera: new GamingCanvasGridCamera(data.gameMap.position.r, data.gameMap.position.x + 0.5, data.gameMap.position.y + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			gridIndex: data.gameMap.position.x * data.gameMap.grid.sideLength + data.gameMap.position.y,
			health: 100,
			lives: 3,
			player1: true,
			score: 0,
			size: 0.25,
			weapon: CharacterWeapon.PISTOL,
			weapons: [CharacterWeapon.KNIFE, CharacterWeapon.PISTOL],
			timestamp: 0,
			timestampPrevious: 0,
			timestampUnixState: 0,
			type: AssetIdImgCharacterType.GUARD,
		};

		CalcMainEngine.characterPlayer2 = {
			ammo: CalcMainEngine.characterPlayer1.ammo,
			camera: new GamingCanvasGridCamera(data.gameMap.position.r, data.gameMap.position.x + 0.5, data.gameMap.position.y + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			gridIndex: CalcMainEngine.characterPlayer1.gridIndex,
			health: CalcMainEngine.characterPlayer1.health,
			lives: 3,
			player1: true,
			score: CalcMainEngine.characterPlayer1.score,
			size: CalcMainEngine.characterPlayer1.size,
			weapon: CalcMainEngine.characterPlayer1.weapon,
			weapons: [...CalcMainEngine.characterPlayer1.weapons],
			timestamp: CalcMainEngine.characterPlayer1.timestamp,
			timestampPrevious: CalcMainEngine.characterPlayer1.timestampPrevious,
			timestampUnixState: 0,
			type: CalcMainEngine.characterPlayer1.type,
		};

		// Config: Game Map
		CalcMainEngine.inputMap(data.gameMap);

		// Config: Report
		CalcMainEngine.inputReport(data.report);

		// Config: Settings
		CalcMainEngine.inputSettings(data as CalcMainBusInputDataSettings);

		// Start
		CalcMainEngine.post([
			{
				cmd: CalcMainBusOutputCmd.INIT_COMPLETE,
				data: true,
			},
		]);

		// Start rendering thread
		CalcMainEngine.go__funcForward();
		CalcMainEngine.request = requestAnimationFrame(CalcMainEngine.go);
	}

	/*
	 * Input
	 */

	public static inputAudio(start: boolean, data: CalcMainBusInputDataAudio): void {
		if (data.instance !== null && data.request !== undefined) {
			if (start === true) {
				const audioInstance: AudioInstance = <AudioInstance>CalcMainEngine.audio.get(data.request);

				if (audioInstance !== undefined) {
					audioInstance.instance = data.instance;
				}
			} else {
				CalcMainEngine.audio.delete(data.request);
			}
		}
	}

	public static inputCamera(data: Float64Array): void {
		CalcMainEngine.camera = data;
		CalcMainEngine.cameraNew = true;
	}

	public static inputCharacterInput(data: CalcMainBusInputDataPlayerInput): void {
		CalcMainEngine.characterPlayerInput = data;
		CalcMainEngine.characterPlayerInputNew = true;
	}

	public static inputMap(data: GameMap): void {
		CalcMainEngine.gameMap = Assets.parseMap(data);
		CalcMainEngine.gameMapNew = true;
	}

	public static inputPath(data: Map<number, number[]>): void {
		CalcMainEngine.paths = data;

		// Last
		CalcMainEngine.pathsNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		CalcMainEngine.report = report;

		// Last
		CalcMainEngine.reportNew = true;
	}

	public static inputSettings(data: CalcMainBusInputDataSettings): void {
		CalcMainEngine.settings = data;

		// Last
		CalcMainEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: CalcMainBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let actionDoors: Map<number, CalcMainBusActionDoorState> = new Map(),
			actionDoorState: CalcMainBusActionDoorState,
			assetId: number,
			audio: Map<number, AudioInstance> = CalcMainEngine.audio,
			audioEnableNoAction: boolean = CalcMainEngine.settings.audioNoAction,
			audioEnableWallCollisions: boolean = CalcMainEngine.settings.audioWallCollisions,
			audioDistanceMax: number = 25,
			audioInstance: AudioInstance,
			audioPostStack: CalcMainBusOutputPayload[],
			audioRequestCounter: number = 0,
			buffers: ArrayBufferLike[] = [],
			camera: GamingCanvasGridCamera = new GamingCanvasGridCamera(
				CalcMainEngine.characterPlayer1.camera.r,
				CalcMainEngine.characterPlayer1.camera.x,
				CalcMainEngine.characterPlayer1.camera.y,
				CalcMainEngine.characterPlayer1.camera.z,
			),
			cameraEncoded: Float64Array,
			cameraInstance: GamingCanvasGridICamera,
			cameraMode: boolean = false,
			cameraUpdated: boolean = true,
			cellSide: GamingCanvasGridRaycastCellSide,
			characterControlOptions: GamingCanvasGridCharacterControlOptions = {
				clip: true,
				factorPosition: 0.0055,
				factorRotation: 0.00225,
				style: GamingCanvasGridCharacterControlStyle.STRAFE,
			},
			characterNPC: CharacterNPC,
			characterNPCDistance: number,
			characterNPCId: number,
			characterNPCInput: GamingCanvasGridCharacterInput,
			characterNPCInputChanged: boolean,
			characterNPCInputs: Map<AssetIdImgCharacter, GamingCanvasGridCharacterInput> = new Map(),
			characterNPCPlayerIndex: number,
			characterNPCGridIndex: number,
			characterNPCPathById: Map<number, number[]> = new Map(),
			characterNPCState: CharacterNPCState | undefined,
			characterNPCStates: Map<number, CharacterNPCState> = new Map(),
			characterNPCUpdate: Float32Array,
			characterNPCUpdates: Float32Array[] = [],
			characterNPCUpdated: Set<number> = new Set(),
			characterNPCWaypoint: boolean,
			characterPlayer1Input: CharacterInput = {
				action: false,
				fire: false,
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer1: Character = CalcMainEngine.characterPlayer1,
			characterPlayer1Action: boolean = false,
			characterPlayer1CameraEncoded: Float64Array | undefined,
			characterPlayer1Changed: boolean,
			characterPlayer1ChangedMetaPickup: boolean,
			characterPlayer1ChangedMetaReport: boolean = false,
			characterPlayer1GridIndex: number,
			characterPlayer1MetaEncoded: Uint16Array | undefined,
			characterPlayer1Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer1RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer1RaycastDistanceMapKeysSorted: Float64Array | undefined,
			characterPlayer1RaycastRays: Float64Array | undefined,
			characterPlayer2Input: CharacterInput = {
				action: false,
				fire: false,
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer2: Character = CalcMainEngine.characterPlayer2,
			characterPlayer2Action: boolean = false,
			characterPlayer2CameraEncoded: Float64Array | undefined,
			characterPlayer2Changed: boolean,
			characterPlayer2ChangedMetaPickup: boolean,
			characterPlayer2ChangedMetaReport: boolean = false,
			characterPlayer2GridIndex: number,
			characterPlayer2MetaEncoded: Uint16Array | undefined,
			characterPlayer2RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer2RaycastDistanceMapKeysSorted: Float64Array | undefined,
			characterPlayer2Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer2RaycastRays: Float64Array | undefined,
			characterPlayerMulti: Character[] = [characterPlayer1, characterPlayer2],
			characterPlayers: Character[],
			characterPlayerSingle: Character[] = [characterPlayer1],
			cycleCount: number = 0,
			cycleMinMs: number = 10,
			distance: number,
			distance2: number,
			gameMap: GameMap = CalcMainEngine.gameMap,
			gameMapGrid: GamingCanvasGridUint16Array = CalcMainEngine.gameMap.grid,
			gameMapGridData: Uint16Array = CalcMainEngine.gameMap.grid.data,
			gameMapGridDataCell: number,
			gameMapGridPathOptions: GamingCanvasGridPathAStarOptions = {
				pathDiagonalsDisable: false,
				pathHeuristic: GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN,
			},
			gameMapGridPathResult: GamingCanvasGridPathAStarResult,
			gameMapIndexEff: number,
			gameMapNPC: Map<number, CharacterNPC> = CalcMainEngine.gameMap.npc,
			gameMapNPCIdByGridIndex: Map<number, number> = new Map(),
			gameMapNPCPaths: Map<number, number[]>,
			gameMapSideLength: number = CalcMainEngine.gameMap.grid.sideLength,
			gameMapUpdate: number[] = new Array(50), // arbitrary size
			gameMapUpdateEncoded: Uint16Array,
			gameMapUpdateIndex: number = 0,
			i: number,
			raycastOptions: GamingCanvasGridRaycastOptions = {
				cellEnable: true,
				distanceMapEnable: true,
				rayCount: CalcMainEngine.report.canvasWidth,
				rayFOV: CalcMainEngine.settings.fov,
			},
			report: GamingCanvasReport = CalcMainEngine.report,
			reportOrientation: GamingCanvasOrientation = CalcMainEngine.report.orientation,
			reportOrientationForce: boolean = true,
			scratchMap: Map<number, number> = new Map(),
			settingsDebug: boolean = CalcMainEngine.settings.debug,
			settingsDifficulty: GameDifficulty = CalcMainEngine.settings.difficulty,
			settingsFPMS: number = 1000 / CalcMainEngine.settings.fps,
			settingsPlayer2Enable: boolean = CalcMainEngine.settings.player2Enable,
			timestampAudio: number = 0,
			timestampDelta: number,
			timestampFPSDelta: number,
			timestampFPSThen: number = 0,
			timestampThen: number = 0,
			timestampUnix: number = Date.now(),
			x: number,
			y: number;

		// Character movements to inputs map
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_E, {
			r: 0,
			x: 1,
			y: 0,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_N, {
			r: 0,
			x: 0,
			y: -1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_NE, {
			r: 0,
			x: 1,
			y: -1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_NW, {
			r: 0,
			x: -1,
			y: -1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_S, {
			r: 0,
			x: 0,
			y: 1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_SE, {
			r: 0,
			x: 1,
			y: 1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_SW, {
			r: 0,
			x: -1,
			y: 1,
		});
		characterNPCInputs.set(AssetIdImgCharacter.MOVE1_W, {
			r: 0,
			x: -1,
			y: 0,
		});

		setTimeout(() => {
			reportOrientationForce = false;
		}, 1000);

		const actionDoor = (cellSide: GamingCanvasGridRaycastCellSide, gridIndex: number) => {
			let state: CalcMainBusActionDoorState = <CalcMainBusActionDoorState>actionDoors.get(gridIndex),
				durationEff: number,
				wait: boolean;

			if (state === undefined) {
				state = {
					cellSide: cellSide,
					closing: false,
					gridIndex: gridIndex,
					opening: false,
					open: false,
					timestampUnix: 0,
				};
				actionDoors.set(gridIndex, state);
			}

			// Don't do anything
			if (state.opening === true) {
				return;
			}

			// Calc: Action
			if (state.closing === true || state.open !== true) {
				// Open Door

				if (state.closing === true) {
					durationEff = CalcMainBusActionDoorStateChangeDurationInMS - (timestampUnix - state.timestampUnix);
				} else {
					durationEff = CalcMainBusActionDoorStateChangeDurationInMS;
				}
				state.closing = false;
				state.open = false;
				state.opening = true;
				audioPlay(AssetIdAudio.AUDIO_EFFECT_DOOR_OPEN, gridIndex);
			} else if (
				CalcMainEngine.characterPlayer1.gridIndex === gridIndex ||
				CalcMainEngine.characterPlayer2.gridIndex === gridIndex ||
				gameMapNPCIdByGridIndex.has(gridIndex) === true
			) {
				// Someone/something is in the way
				return;
			} else {
				// Close Door
				durationEff = CalcMainBusActionDoorStateChangeDurationInMS;

				state.closing = true;
				state.open = false;
				state.opening = false;
				audioPlay(AssetIdAudio.AUDIO_EFFECT_DOOR_CLOSE, gridIndex);
			}

			// Calc: Meta
			state.cellSide = cellSide;
			state.gridIndex = gridIndex;
			state.timestampUnix = timestampUnix;

			// Post to other threads
			CalcMainEngine.post([
				{
					cmd: CalcMainBusOutputCmd.ACTION_DOOR,
					data: state,
				},
			]);

			clearTimeout(state.timeout);
			state.timeout = setTimeout(() => {
				// Change state complete
				if (state.closing === true) {
					state.closing = false;
					state.open = false;
					state.opening = false;
					gameMapGridData[gridIndex] |= GameGridCellMasksAndValues.WALL_INVISIBLE;
				} else if (state.opening === true) {
					state.closing = false;
					state.open = true;
					state.opening = false;
					gameMapGridData[gridIndex] &= ~GameGridCellMasksAndValues.WALL_INVISIBLE;

					// Auto close the door
					actionDoorAutoClose(gridIndex, state);
				}
				state.timestampUnix = timestampUnix;
			}, durationEff);
		};

		const actionDoorAutoClose = (gridIndex: number, state: CalcMainBusActionDoorState) => {
			state.timeout = setTimeout(() => {
				if (
					CalcMainEngine.characterPlayer1.gridIndex === gridIndex ||
					CalcMainEngine.characterPlayer2.gridIndex === gridIndex ||
					gameMapNPCIdByGridIndex.has(gridIndex) === true
				) {
					// Someone/something is in the way
					actionDoorAutoClose(gridIndex, state);
				} else {
					state.closing = true;
					state.open = false;
					state.opening = false;
					gameMapGridData[gridIndex] |= GameGridCellMasksAndValues.WALL_INVISIBLE;

					audioPlay(AssetIdAudio.AUDIO_EFFECT_DOOR_CLOSE, gridIndex);
					state.timestampUnix = timestampUnix;

					// Post to other threads
					CalcMainEngine.post([
						{
							cmd: CalcMainBusOutputCmd.ACTION_DOOR,
							data: state,
						},
					]);

					state.timeout = setTimeout(() => {
						// Auto close complete
						state.closing = false;
						state.open = false;
						state.opening = false;
						state.timestampUnix = timestampUnix;
					}, CalcMainBusActionDoorStateChangeDurationInMS);
				}
			}, CalcMainBusActionDoorStateAutoCloseDurationInMS);
		};

		const actionSwitch = (gridIndex: number) => {
			// Calc: AssetId
			let assetId: number = gameMapGridData[gridIndex] & GameGridCellMasksAndValuesExtended.ID_MASK;
			gameMapGridData[gridIndex] &= ~GameGridCellMasksAndValuesExtended.ID_MASK;
			if (assetId === AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN) {
				assetId = AssetIdImg.WALL_ELEVATOR_SWITCH_UP;
			} else {
				assetId = AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN;
			}

			// Set: Grid
			gameMapGridData[gridIndex] |= assetId;
			gameMapGridData[gridIndex] &= ~GameGridCellMasksAndValuesExtended.SWITCH;

			// Post to other threads
			audioPlay(AssetIdAudio.AUDIO_EFFECT_SWITCH, gridIndex);
			CalcMainEngine.post([
				{
					cmd: CalcMainBusOutputCmd.ACTION_SWITCH,
					data: {
						cellValue: gameMapGridData[gridIndex],
						gridIndex: gridIndex,
					},
				},
			]);
		};

		const actionWallMovable = (cellSide: GamingCanvasGridRaycastCellSide, gridIndex: number) => {
			CalcMainEngine.post([
				{
					cmd: CalcMainBusOutputCmd.ACTION_WALL_MOVE,
					data: {
						cellSide: cellSide,
						gridIndex: gridIndex,
						timestampUnix: Date.now(),
					},
				},
			]);
			audioPlay(AssetIdAudio.AUDIO_EFFECT_WALL_MOVE, gridIndex);

			// Calc: Offset
			let offset: number;
			switch (cellSide) {
				case GamingCanvasGridRaycastCellSide.EAST:
					offset = gameMapSideLength;
					break;
				case GamingCanvasGridRaycastCellSide.NORTH:
					offset = -1;
					break;
				case GamingCanvasGridRaycastCellSide.SOUTH:
					offset = 1;
					break;
				case GamingCanvasGridRaycastCellSide.WEST:
					offset = -gameMapSideLength;
					break;
			}

			// Calc: State
			gameMapGridData[gridIndex + offset * 2] = gameMapGridData[gridIndex] & ~GameGridCellMasksAndValues.WALL_MOVABLE;

			gameMapGridData[gridIndex + offset] = GameGridCellMasksAndValues.FLOOR | GameGridCellMasksAndValues.WALL_INVISIBLE;

			gameMapGridData[gridIndex] = GameGridCellMasksAndValues.FLOOR | GameGridCellMasksAndValues.WALL_INVISIBLE;

			// Calc: Move 1st Block
			setTimeout(
				() => {
					gameMapGridData[gridIndex] = GameGridCellMasksAndValues.FLOOR;
				},
				(CalcMainBusActionWallMoveStateChangeDurationInMS / 2) | 0,
			);

			// Calc: Move 2nd Block
			setTimeout(() => {
				gameMapGridData[gridIndex + offset] = GameGridCellMasksAndValues.FLOOR;
			}, CalcMainBusActionWallMoveStateChangeDurationInMS);
		};

		/**
		 * @param gridIndex allows for 3d audio with live updates
		 */
		const audioPlay = (assetId: AssetIdAudio, gridIndex?: number): number | null => {
			let audioProperties: AssetPropertiesAudio = <AssetPropertiesAudio>assetsAudio.get(assetId);

			if (gridIndex !== undefined) {
				y = gridIndex % gameMapGrid.sideLength;

				// Cache
				const audioInstance: AudioInstance = {
						assetId: assetId,
						instance: 0,
						x: (gridIndex - y) / gameMapGrid.sideLength + 0.5, // 0.5 center
						y: y + 0.5, // 0.5 center
					},
					request: number = audioRequestCounter++;

				// Calc: Distance - Player1
				cameraInstance = characterPlayer1.camera;
				x = audioInstance.x - cameraInstance.x;
				y = audioInstance.y - cameraInstance.y;
				distance = (x * x + y * y) ** 0.5;

				// Calc: Distance - Player2, if required, and compare for closest to audio source
				if (settingsPlayer2Enable === true) {
					x = audioInstance.x - characterPlayer2.camera.x;
					y = audioInstance.y - characterPlayer2.camera.y;
					distance2 = (x * x + y * y) ** 0.5;

					// Calc: Shortest Distance
					if (distance2 < distance) {
						// Use player2 distance and rotation
						cameraInstance = characterPlayer2.camera;
						distance = distance2;
					}
				}

				// Calc: Angle
				x = cameraInstance.r - Math.atan2(x, y);

				// Corrections for rotations between 0 and 2pi
				if (x > GamingCanvasConstPI_2_00) {
					x -= GamingCanvasConstPI_2_00;
				}
				if (x > GamingCanvasConstPI_1_00) {
					x -= GamingCanvasConstPI_2_00;
				}

				// Cache
				audio.set(request, audioInstance);

				// Post to audio engine thread
				CalcMainEngine.post([
					{
						cmd: CalcMainBusOutputCmd.AUDIO,
						data: {
							assetId: assetId,
							pan: Math.max(-1, Math.min(1, x)),
							volume: audioProperties.volume * GamingCanvasUtilScale(distance, 0, audioDistanceMax, 1, 0),
							request: request,
						},
					},
				]);

				return request;
			} else {
				CalcMainEngine.post([
					{
						cmd: CalcMainBusOutputCmd.AUDIO,
						data: {
							assetId: assetId,
							pan: 0,
							volume: audioProperties.volume,
						},
					},
				]);

				return null;
			}
		};

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			CalcMainEngine.request = requestAnimationFrame(CalcMainEngine.go);

			/**
			 * Calc
			 */
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta !== 0) {
				timestampUnix = Date.now();
			}

			if (timestampDelta > cycleMinMs) {
				// Wait a small duration to not thread lock
				timestampThen = timestampNow;

				/**
				 * Calc: Environment
				 */
				cycleCount++;
				cameraUpdated = false;
				characterPlayer1.timestamp = timestampNow;
				characterPlayer1Changed = false;

				characterPlayer2.timestamp = timestampNow;
				characterPlayer2Changed = false;

				if (CalcMainEngine.cameraNew) {
					CalcMainEngine.cameraNew = false;

					camera = GamingCanvasGridCamera.from(CalcMainEngine.camera);
					cameraMode = true; // Snap back to camera
					cameraUpdated = true;
				}

				if (CalcMainEngine.gameMapNew === true) {
					CalcMainEngine.gameMapNew = false;

					for (actionDoorState of actionDoors.values()) {
						clearTimeout(actionDoorState.timeout);
					}
					actionDoors.clear();

					gameMap = CalcMainEngine.gameMap;
					gameMapGrid = CalcMainEngine.gameMap.grid;
					gameMapGridData = CalcMainEngine.gameMap.grid.data;
					gameMapNPC = CalcMainEngine.gameMap.npc;
					gameMapSideLength = CalcMainEngine.gameMap.grid.sideLength;

					characterPlayer1.camera.r = gameMap.position.r;
					characterPlayer1.camera.x = gameMap.position.x;
					characterPlayer1.camera.y = gameMap.position.y;
					characterPlayer1.camera.z = gameMap.position.z;
					characterPlayer2.camera.r = gameMap.position.r;
					characterPlayer2.camera.x = gameMap.position.x;
					characterPlayer2.camera.y = gameMap.position.y;
					characterPlayer2.camera.z = gameMap.position.z;

					characterNPCPathById.clear();
					characterNPCStates.clear();
					gameMapNPCIdByGridIndex.clear();
					for (characterNPC of gameMapNPC.values()) {
						gameMapNPCIdByGridIndex.set(characterNPC.id, characterNPC.gridIndex);

						if (characterNPC.walking === true) {
							characterNPCStates.set(characterNPC.id, CharacterNPCState.WALKING);
						} else {
							characterNPCStates.set(characterNPC.id, CharacterNPCState.STANDING);
						}
					}

					cameraUpdated = true;
				}

				if (CalcMainEngine.pathsNew === true) {
					CalcMainEngine.pathsNew = false;

					gameMapNPCPaths = CalcMainEngine.paths;
				}

				if (CalcMainEngine.reportNew === true || CalcMainEngine.settingsNew === true) {
					CalcMainEngine.reportNew = false;
					CalcMainEngine.settingsNew = false;

					// Settings
					audioEnableNoAction = CalcMainEngine.settings.audioNoAction;
					audioEnableWallCollisions = CalcMainEngine.settings.audioWallCollisions;
					cameraUpdated = true; // This or position works
					raycastOptions.rayFOV = CalcMainEngine.settings.fov;
					settingsDebug = CalcMainEngine.settings.debug;
					settingsDifficulty = CalcMainEngine.settings.difficulty;
					settingsFPMS = 1000 / CalcMainEngine.settings.fps;
					settingsPlayer2Enable = CalcMainEngine.settings.player2Enable;

					// Report
					report = CalcMainEngine.report;
					raycastOptions.rayCount = report.canvasWidth;

					if (reportOrientation !== report.orientation) {
						reportOrientation = report.orientation;
						reportOrientationForce = true;
					}

					if (CalcMainEngine.settings.player2Enable === true) {
						if (report.orientation === GamingCanvasOrientation.LANDSCAPE) {
							raycastOptions.rayCount = (report.canvasWidth / 2) | 0;
						}
					}

					if (CalcMainEngine.settings.raycastQuality !== RaycastQuality.FULL) {
						raycastOptions.rayCount = (raycastOptions.rayCount / CalcMainEngine.settings.raycastQuality) | 0;
					}
				}

				// Character Control: Update
				if (CalcMainEngine.characterPlayerInputNew === true) {
					CalcMainEngine.characterPlayerInputNew = false;

					cameraMode = false; // Snap back to player
					characterPlayer1Input = CalcMainEngine.characterPlayerInput.player1;
					characterPlayer2Input = CalcMainEngine.characterPlayerInput.player2;
				}

				/**
				 * Calc: Game Mode
				 */
				if (cameraMode === false) {
					/**
					 * Human - Position
					 */

					// Player 1: Position
					characterPlayer1Changed = GamingCanvasGridCharacterControl(
						characterPlayer1,
						characterPlayer1Input,
						gameMapGrid,
						GameGridCellMasksAndValues.BLOCKING_MASK_ALL,
						characterControlOptions,
					);

					// Player 1: Raycast
					if (characterPlayer1Changed === true || reportOrientationForce === true) {
						characterPlayer1Raycast = GamingCanvasGridRaycast(
							characterPlayer1.camera,
							gameMapGrid,
							GameGridCellMasksAndValues.BLOCKING_MASK_VISIBLE,
							raycastOptions,
						);
						characterPlayer1RaycastDistanceMap = <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>characterPlayer1Raycast.distanceMap;
						characterPlayer1RaycastDistanceMapKeysSorted = <Float64Array>characterPlayer1Raycast.distanceMapKeysSorted;
						characterPlayer1RaycastRays = characterPlayer1Raycast.rays;
					} else {
						characterPlayer1Raycast = undefined;

						if (audioEnableWallCollisions === true) {
							if (characterPlayer1Input.x !== 0 || characterPlayer1Input.y !== 0) {
								cycleCount % 4 === 0 && audioPlay(AssetIdAudio.AUDIO_EFFECT_WALL_HIT);
							}
						}
					}

					if (settingsPlayer2Enable === true) {
						// Player 2: Position
						characterPlayer2Changed = GamingCanvasGridCharacterControl(
							characterPlayer2,
							characterPlayer2Input,
							gameMapGrid,
							GameGridCellMasksAndValues.BLOCKING_MASK_ALL,
							characterControlOptions,
						);

						// Player 2: Raycast
						if (characterPlayer2Changed === true || reportOrientationForce === true) {
							characterPlayer2Raycast = GamingCanvasGridRaycast(
								characterPlayer2.camera,
								gameMapGrid,
								GameGridCellMasksAndValues.BLOCKING_MASK_VISIBLE,
								raycastOptions,
							);
							characterPlayer2RaycastDistanceMap = <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>(
								characterPlayer2Raycast.distanceMap
							);
							characterPlayer2RaycastDistanceMapKeysSorted = <Float64Array>characterPlayer2Raycast.distanceMapKeysSorted;
							characterPlayer2RaycastRays = characterPlayer2Raycast.rays;
						} else {
							characterPlayer2Raycast = undefined;

							if (audioEnableWallCollisions === true) {
								if (characterPlayer2Input.x !== 0 || characterPlayer2Input.y !== 0) {
									cycleCount % 4 === 0 && audioPlay(AssetIdAudio.AUDIO_EFFECT_WALL_HIT);
								}
							}
						}
					} else {
						characterPlayer2Raycast = undefined;
					}

					/**
					 * Human - Action
					 */
					if (characterPlayer1Action === false && characterPlayer1Input.action === true) {
						cameraInstance = characterPlayer1.camera;
						characterPlayer1Action = true;
						characterPlayer1GridIndex = (cameraInstance.x | 0) * gameMapSideLength + (cameraInstance.y | 0);

						// 45deg = 0.7854rad (NE)
						// 135deg = 2.3562rad (NW)
						// 225deg = 3.9270rad (SW)
						// 315deg = 5.4978rad (SE)
						if (cameraInstance.r > 0.7854 && cameraInstance.r < 2.3562) {
							cellSide = GamingCanvasGridRaycastCellSide.EAST;
							gameMapIndexEff = characterPlayer1GridIndex + gameMapSideLength;
						} else if (cameraInstance.r > 3.927 && cameraInstance.r < 5.4978) {
							cellSide = GamingCanvasGridRaycastCellSide.WEST;
							gameMapIndexEff = characterPlayer1GridIndex - gameMapSideLength;
						} else if (cameraInstance.r > 2.3562 && cameraInstance.r < 3.927) {
							cellSide = GamingCanvasGridRaycastCellSide.NORTH;
							gameMapIndexEff = characterPlayer1GridIndex - 1;
						} else {
							cellSide = GamingCanvasGridRaycastCellSide.SOUTH;
							gameMapIndexEff = characterPlayer1GridIndex + 1;
						}

						gameMapGridDataCell = gameMapGridData[gameMapIndexEff];
						if ((gameMapGridDataCell & GameGridCellMasksAndValues.EXTENDED) !== 0) {
							if ((gameMapGridDataCell & gameGridCellMaskExtendedDoor) !== 0) {
								actionDoor(cellSide, gameMapIndexEff);
							} else if ((gameMapGridDataCell & GameGridCellMasksAndValuesExtended.SWITCH) !== 0) {
								actionSwitch(gameMapIndexEff);
							} else {
								audioEnableNoAction === true && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
							}
						} else if ((gameMapGridDataCell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0) {
							actionWallMovable(cellSide, gameMapIndexEff);
						} else {
							audioEnableNoAction === true && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
						}
					} else if (characterPlayer1Action === true) {
						if (characterPlayer1Input.action === false) {
							characterPlayer1Action = false;
						} else {
							audioEnableNoAction === true && cycleCount % 6 === 0 && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
						}
					}

					if (settingsPlayer2Enable === true) {
						if (characterPlayer2Action === false && characterPlayer2Input.action === true) {
							cameraInstance = characterPlayer2.camera;
							characterPlayer2Action = true;
							characterPlayer2GridIndex = (cameraInstance.x | 0) * gameMapSideLength + (cameraInstance.y | 0);

							// 45deg = 0.7854rad (NE)
							// 135deg = 2.3562rad (NW)
							// 225deg = 3.9270rad (SW)
							// 315deg = 5.4978rad (SE)
							if (cameraInstance.r > 0.7854 && cameraInstance.r < 2.3562) {
								cellSide = GamingCanvasGridRaycastCellSide.EAST;
								gameMapIndexEff = characterPlayer2GridIndex + gameMapSideLength;
							} else if (cameraInstance.r > 3.927 && cameraInstance.r < 5.4978) {
								cellSide = GamingCanvasGridRaycastCellSide.WEST;
								gameMapIndexEff = characterPlayer2GridIndex - gameMapSideLength;
							} else if (cameraInstance.r > 2.3562 && cameraInstance.r < 3.927) {
								cellSide = GamingCanvasGridRaycastCellSide.NORTH;
								gameMapIndexEff = characterPlayer2GridIndex - 1;
							} else {
								cellSide = GamingCanvasGridRaycastCellSide.SOUTH;
								gameMapIndexEff = characterPlayer2GridIndex + 1;
							}

							gameMapGridDataCell = gameMapGridData[gameMapIndexEff];
							if ((gameMapGridDataCell & GameGridCellMasksAndValues.EXTENDED) !== 0) {
								if ((gameMapGridDataCell & gameGridCellMaskExtendedDoor) !== 0) {
									actionDoor(cellSide, gameMapIndexEff);
								} else if ((gameMapGridDataCell & GameGridCellMasksAndValuesExtended.SWITCH) !== 0) {
									actionSwitch(gameMapIndexEff);
								} else {
									audioEnableNoAction === true && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
								}
							} else if ((gameMapGridDataCell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0) {
								actionWallMovable(cellSide, gameMapIndexEff);
							} else {
								audioEnableNoAction === true && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
							}
						} else if (characterPlayer2Action === true && characterPlayer2Input.action === false) {
							characterPlayer2Action = false;
						} else if (characterPlayer2Action === true) {
							if (characterPlayer2Input.action === false) {
								characterPlayer2Action = false;
							} else {
								audioEnableNoAction === true && cycleCount % 6 === 0 && audioPlay(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO);
							}
						}
					}

					/**
					 * Human - Pickup
					 */
					if (characterPlayer1Changed === true) {
						characterPlayer1GridIndex = (characterPlayer1.camera.x | 0) * gameMapSideLength + (characterPlayer1.camera.y | 0);

						if ((gameMapGridData[characterPlayer1GridIndex] & GameGridCellMasksAndValues.EXTENDED) === 0) {
							characterPlayer1ChangedMetaPickup = true;

							// Character
							switch (gameMapGridData[characterPlayer1GridIndex] & GameGridCellMasksAndValues.ID_MASK) {
								case AssetIdImg.SPRITE_AMMO:
									characterPlayer1.ammo += 8;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_AMMO);
									break;
								case AssetIdImg.SPRITE_AMMO_DROPPED:
									characterPlayer1.ammo += 4;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_AMMO);
									break;
								case AssetIdImg.SPRITE_SUB_MACHINE_GUN:
									characterPlayer1.ammo += 6;
									if (characterPlayer1.weapons.includes(CharacterWeapon.SUB_MACHINE_GUN) !== true) {
										characterPlayer1.weapon = CharacterWeapon.SUB_MACHINE_GUN;
										characterPlayer1.weapons.push(CharacterWeapon.SUB_MACHINE_GUN);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_SUB_MACHINE_GUN_PICKUP);
									}
									break;
								case AssetIdImg.SPRITE_MEDKIT:
									if (characterPlayer1.health !== 100) {
										characterPlayer1.health = Math.min(100, characterPlayer1.health + 15);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_MEDKIT);
									} else {
										characterPlayer1ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_FOOD:
									if (characterPlayer1.health !== 100) {
										characterPlayer1.health = Math.min(100, characterPlayer1.health + 10);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_FOOD);
									} else {
										characterPlayer1ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_FOOD_DOG:
									if (characterPlayer1.health !== 100) {
										characterPlayer1.health = Math.min(100, characterPlayer1.health + 4);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_FOOD_DOG);
									} else {
										characterPlayer1ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_TREASURE_CHEST:
									characterPlayer1.score += 1000;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CHEST);
									break;
								case AssetIdImg.SPRITE_TREASURE_CROSS:
									characterPlayer1.score += 100;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROSS);
									break;
								case AssetIdImg.SPRITE_TREASURE_CROWN:
									characterPlayer1.score += 5000;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROWN);
									break;
								case AssetIdImg.SPRITE_TREASURE_CUP:
									characterPlayer1.score += 500;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CUP);
									break;
								default:
									characterPlayer1ChangedMetaPickup = false;
									break;
							}

							// Map
							if (characterPlayer1ChangedMetaPickup === true) {
								characterPlayer1ChangedMetaReport = true;

								gameMapGridData[characterPlayer1GridIndex] = GameGridCellMasksAndValues.FLOOR;

								gameMapUpdate[gameMapUpdateIndex++] = characterPlayer1GridIndex;
								gameMapUpdate[gameMapUpdateIndex++] = GameGridCellMasksAndValues.FLOOR;
							}
						}
					}

					if (characterPlayer2Changed === true) {
						characterPlayer2GridIndex = (characterPlayer2.camera.x | 0) * gameMapSideLength + (characterPlayer2.camera.y | 0);

						if ((gameMapGridData[characterPlayer2GridIndex] & GameGridCellMasksAndValues.EXTENDED) === 0) {
							characterPlayer2ChangedMetaPickup = true;

							// Character
							switch (gameMapGridData[characterPlayer2GridIndex] & GameGridCellMasksAndValues.ID_MASK) {
								case AssetIdImg.SPRITE_AMMO:
									characterPlayer2.ammo += 8;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_AMMO);
									break;
								case AssetIdImg.SPRITE_AMMO_DROPPED:
									characterPlayer2.ammo += 4;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_AMMO);
									break;
								case AssetIdImg.SPRITE_SUB_MACHINE_GUN:
									characterPlayer2.ammo += 6;
									if (characterPlayer2.weapons.includes(CharacterWeapon.SUB_MACHINE_GUN) !== true) {
										characterPlayer2.weapon = CharacterWeapon.SUB_MACHINE_GUN;
										characterPlayer2.weapons.push(CharacterWeapon.SUB_MACHINE_GUN);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_SUB_MACHINE_GUN_PICKUP);
									}
									break;
								case AssetIdImg.SPRITE_MEDKIT:
									if (characterPlayer2.health !== 100) {
										characterPlayer2.health = Math.min(100, characterPlayer2.health + 15);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_MEDKIT);
									} else {
										characterPlayer2ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_FOOD:
									if (characterPlayer2.health !== 100) {
										characterPlayer2.health = Math.min(100, characterPlayer2.health + 10);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_FOOD);
									} else {
										characterPlayer2ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_FOOD_DOG:
									if (characterPlayer2.health !== 100) {
										characterPlayer2.health = Math.min(100, characterPlayer2.health + 4);
										audioPlay(AssetIdAudio.AUDIO_EFFECT_FOOD_DOG);
									} else {
										characterPlayer2ChangedMetaPickup = false;
									}
									break;
								case AssetIdImg.SPRITE_TREASURE_CHEST:
									characterPlayer2.score += 1000;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CHEST);
									break;
								case AssetIdImg.SPRITE_TREASURE_CROSS:
									characterPlayer2.score += 100;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROSS);
									break;
								case AssetIdImg.SPRITE_TREASURE_CROWN:
									characterPlayer2.score += 5000;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROWN);
									break;
								case AssetIdImg.SPRITE_TREASURE_CUP:
									characterPlayer2.score += 500;
									audioPlay(AssetIdAudio.AUDIO_EFFECT_TREASURE_CUP);
									break;
								default:
									characterPlayer2ChangedMetaPickup = false;
									break;
							}

							// Map
							if (characterPlayer2ChangedMetaPickup === true) {
								characterPlayer2ChangedMetaReport = true;

								gameMapGridData[characterPlayer2GridIndex] = GameGridCellMasksAndValues.FLOOR;

								gameMapUpdate[gameMapUpdateIndex++] = characterPlayer1GridIndex;
								gameMapUpdate[gameMapUpdateIndex++] = GameGridCellMasksAndValues.FLOOR;
							}
						}
					}

					/**
					 * NPC - Position
					 */
					if (gameMapNPC.size !== 0) {
						if (settingsPlayer2Enable === true) {
							characterPlayers = characterPlayerMulti;
						} else {
							characterPlayers = characterPlayerSingle;
						}

						// Calc: Angle, Distance, and Line-of-Sight state
						GamingCanvasGridCharacterSeen(characterPlayers, gameMapNPC.values(), gameMapGrid, GameGridCellMasksAndValues.BLOCKING_MASK_VISIBLE);

						for (characterNPC of gameMapNPC.values()) {
							// characterNPC.difficulty > settingsDifficulty ?
							if (characterNPC === undefined || characterNPC.health === 0) {
								// Dead men tell no tales
								continue;
							}
							characterNPCState = characterNPCStates.get(characterNPC.id);
							characterNPC.timestamp = timestampNow;

							// Closest visible player
							characterNPCDistance = 999999;
							for (i = 0; i < characterPlayers.length; i++) {
								if (characterNPC.playerLOS[i] === true && characterNPC.playerDistance[i] < characterNPCDistance) {
									characterNPCDistance = characterNPC.playerDistance[i];
									characterNPCPlayerIndex = i.valueOf();
								}
							}

							switch (characterNPCState) {
								case CharacterNPCState.AIM:
									if (timestampUnix - characterNPC.timestampUnixState > 500) {
										audioPlay(AssetIdAudio.AUDIO_EFFECT_GUARD_FIRE, characterNPC.gridIndex);

										characterNPC.assetId = AssetIdImgCharacter.FIRE;
										characterNPC.timestampUnixState = timestampUnix;

										characterNPCUpdated.add(characterNPC.id);
										characterNPCStates.set(characterNPC.id, CharacterNPCState.FIRE);
									}
									break;
								case CharacterNPCState.FIRE:
									if (timestampUnix - characterNPC.timestampUnixState > 250) {
										characterNPC.assetId = AssetIdImgCharacter.MOVE1_E;
										characterNPC.timestampUnixState = timestampUnix;

										characterNPCUpdated.add(characterNPC.id);
										characterNPCStates.set(characterNPC.id, CharacterNPCState.RUNNING);
									}
									break;
								case CharacterNPCState.HIT:
									if (timestampUnix - characterNPC.timestampUnixState > 500) {
										characterNPC.assetId = AssetIdImgCharacter.MOVE1_E;
										characterNPC.timestampUnixState = timestampUnix;

										characterNPCUpdated.add(characterNPC.id);
										characterNPCStates.set(characterNPC.id, CharacterNPCState.RUNNING);
									}
									break;
								case CharacterNPCState.RUNNING:
									// A* algorithim here
									break;
								case CharacterNPCState.RUNNING_DOOR:
									break;
								default:
								case CharacterNPCState.STANDING:
									break;
								case CharacterNPCState.SURPRISE:
									if (timestampUnix - characterNPC.timestampUnixState > 500) {
										characterNPC.running = true;
										characterNPC.timestampUnixState = timestampUnix;
										characterNPC.walking = false;

										if (characterNPCDistance === 999999) {
											characterNPC.assetId = AssetIdImgCharacter.MOVE1_E;
											characterNPCStates.set(characterNPC.id, CharacterNPCState.RUNNING);
										} else {
											characterNPC.assetId = AssetIdImgCharacter.AIM;
											characterNPCStates.set(characterNPC.id, CharacterNPCState.AIM);
										}

										characterNPCUpdated.add(characterNPC.id);
									}
									break;
								case CharacterNPCState.WALKING:
									// Move
									characterNPCInput = <GamingCanvasGridCharacterInput>characterNPCInputs.get(characterNPC.assetId);
									gameMapNPCIdByGridIndex.delete(characterNPC.gridIndex);
									characterNPCInputChanged = GamingCanvasGridCharacterControl(
										characterNPC,
										characterNPCInput,
										gameMapGrid,
										GameGridCellMasksAndValues.BLOCKING_MASK_ALL,
										{
											clip: true,
											factorPosition: characterNPC.walkingSpeed,
											factorRotation: 0.00225,
											style: GamingCanvasGridCharacterControlStyle.FIXED,
										},
									);
									gameMapNPCIdByGridIndex.set(characterNPC.gridIndex, characterNPC.id);

									// Position
									gameMapGridDataCell = gameMapGridData[characterNPC.gridIndex];

									// Waypoint?
									if ((gameMapGridDataCell & GameGridCellMasksAndValues.EXTENDED) === 0) {
										assetId = gameMapGridDataCell & GameGridCellMasksAndValues.ID_MASK;
										if (assetId >= AssetIdImg.MISC_ARROW_EAST && assetId <= AssetIdImg.MISC_ARROW_WEST) {
											characterNPCWaypoint = false;
											x = characterNPC.camera.x % 1;
											y = characterNPC.camera.y % 1;

											if (x > 0.4 && x < 0.6 && y > 0.4 && y < 0.6) {
												switch (assetId) {
													case AssetIdImg.MISC_ARROW_EAST:
														if (characterNPC.camera.r !== 0) {
															characterNPC.camera.r = 0;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_E;
														break;
													case AssetIdImg.MISC_ARROW_NORTH:
														if (characterNPC.camera.r !== GamingCanvasConstPI_0_50) {
															characterNPC.camera.r = GamingCanvasConstPI_0_50;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_N;
														break;
													case AssetIdImg.MISC_ARROW_NORTH_EAST:
														if (characterNPC.camera.r !== GamingCanvasConstPI_0_25) {
															characterNPC.camera.r = GamingCanvasConstPI_0_25;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_NE;
														break;
													case AssetIdImg.MISC_ARROW_NORTH_WEST:
														if (characterNPC.camera.r !== GamingCanvasConstPI_0_75) {
															characterNPC.camera.r = GamingCanvasConstPI_0_75;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_NW;
														break;
													case AssetIdImg.MISC_ARROW_SOUTH:
														if (characterNPC.camera.r !== GamingCanvasConstPI_1_50) {
															characterNPC.camera.r = GamingCanvasConstPI_1_50;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_S;
														break;
													case AssetIdImg.MISC_ARROW_SOUTH_EAST:
														if (characterNPC.camera.r !== GamingCanvasConstPI_1_75) {
															characterNPC.camera.r = GamingCanvasConstPI_1_75;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_SE;
														break;
													case AssetIdImg.MISC_ARROW_SOUTH_WEST:
														if (characterNPC.camera.r !== GamingCanvasConstPI_1_25) {
															characterNPC.camera.r = GamingCanvasConstPI_1_25;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_SW;
														break;
													case AssetIdImg.MISC_ARROW_WEST:
														if (characterNPC.camera.r !== GamingCanvasConstPI_1_00) {
															characterNPC.camera.r = GamingCanvasConstPI_1_00;
															characterNPCWaypoint = true;
														}
														characterNPC.assetId = AssetIdImgCharacter.MOVE1_W;
														break;
												}

												if (characterNPCWaypoint === true) {
													characterNPC.camera.x = (characterNPC.camera.x | 0) + 0.5;
													characterNPC.camera.y = (characterNPC.camera.y | 0) + 0.5;
													characterNPC.timestampUnixState = timestampUnix;
												}
											}
										}
									}

									// Move obstructed?
									if (characterNPCInputChanged === false) {
										characterNPCGridIndex = characterNPC.gridIndex + (characterNPCInput.x * gameMapSideLength + characterNPCInput.y);
										gameMapGridDataCell = gameMapGridData[characterNPCGridIndex];

										if (
											(gameMapGridDataCell & GameGridCellMasksAndValues.EXTENDED) !== 0 &&
											(gameMapGridDataCell & GameGridCellMasksAndValuesExtended.DOOR) !== 0
										) {
											// Open door
											actionDoorState = <CalcMainBusActionDoorState>actionDoors.get(characterNPCGridIndex);
											if (actionDoorState === undefined || actionDoorState.open !== true) {
												switch (characterNPC.assetId) {
													case AssetIdImgCharacter.MOVE1_E:
														cellSide = GamingCanvasGridRaycastCellSide.WEST;
														break;
													case AssetIdImgCharacter.MOVE1_N:
														cellSide = GamingCanvasGridRaycastCellSide.SOUTH;
														break;
													case AssetIdImgCharacter.MOVE1_NE:
														if ((gameMapGridDataCell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0) {
															cellSide = GamingCanvasGridRaycastCellSide.SOUTH;
														} else {
															cellSide = GamingCanvasGridRaycastCellSide.WEST;
														}
														break;
													case AssetIdImgCharacter.MOVE1_NW:
														if ((gameMapGridDataCell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0) {
															cellSide = GamingCanvasGridRaycastCellSide.SOUTH;
														} else {
															cellSide = GamingCanvasGridRaycastCellSide.EAST;
														}
														break;
													case AssetIdImgCharacter.MOVE1_S:
														cellSide = GamingCanvasGridRaycastCellSide.NORTH;
														break;
													case AssetIdImgCharacter.MOVE1_SE:
														if ((gameMapGridDataCell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0) {
															cellSide = GamingCanvasGridRaycastCellSide.NORTH;
														} else {
															cellSide = GamingCanvasGridRaycastCellSide.WEST;
														}
														break;
													case AssetIdImgCharacter.MOVE1_SW:
														if ((gameMapGridDataCell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0) {
															cellSide = GamingCanvasGridRaycastCellSide.NORTH;
														} else {
															cellSide = GamingCanvasGridRaycastCellSide.EAST;
														}
														break;
													case AssetIdImgCharacter.MOVE1_W:
														cellSide = GamingCanvasGridRaycastCellSide.EAST;
														break;
												}

												actionDoor(cellSide, characterNPCGridIndex);

												characterNPC.timestampUnixState = timestampUnix;
												characterNPC.walking = false;
												characterNPCStates.set(characterNPC.id, CharacterNPCState.WALKING_DOOR);
											}
										} else if ((gameMapGridDataCell & GameGridCellMasksAndValues.BLOCKING_MASK_ALL) !== 0) {
											// Wall, turn around!
											switch (characterNPC.assetId) {
												case AssetIdImgCharacter.MOVE1_E:
													characterNPC.camera.r = GamingCanvasConstPI_1_00;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_W;
													break;
												case AssetIdImgCharacter.MOVE1_N:
													characterNPC.camera.r = GamingCanvasConstPI_1_50;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_S;
													break;
												case AssetIdImgCharacter.MOVE1_NE:
													characterNPC.camera.r = GamingCanvasConstPI_1_25;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_SW;
													break;
												case AssetIdImgCharacter.MOVE1_NW:
													characterNPC.camera.r = GamingCanvasConstPI_1_75;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_SE;
													break;
												case AssetIdImgCharacter.MOVE1_S:
													characterNPC.camera.r = GamingCanvasConstPI_0_50;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_N;
													break;
												case AssetIdImgCharacter.MOVE1_SE:
													characterNPC.camera.r = GamingCanvasConstPI_0_75;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_NW;
													break;
												case AssetIdImgCharacter.MOVE1_SW:
													characterNPC.camera.r = GamingCanvasConstPI_0_25;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_NE;
													break;
												case AssetIdImgCharacter.MOVE1_W:
													characterNPC.camera.r = 0;
													characterNPC.assetId = AssetIdImgCharacter.MOVE1_E;
													break;
											}
											characterNPC.timestampUnixState = timestampUnix;
										}
									}

									characterNPCUpdated.add(characterNPC.id);
									break;
								case CharacterNPCState.WALKING_DOOR:
									if (timestampUnix - characterNPC.timestampUnixState > CalcMainBusActionDoorStateChangeDurationInMS) {
										characterNPC.timestampUnixState = timestampUnix;
										characterNPC.walking = true;

										characterNPCStates.set(characterNPC.id, CharacterNPCState.WALKING);
									}
									break;
							}

							if (
								characterNPCDistance !== 999999 &&
								(characterNPCState === CharacterNPCState.STANDING ||
									characterNPCState === CharacterNPCState.WALKING ||
									characterNPCState === CharacterNPCState.WALKING_DOOR)
							) {
								// Wait for "reflex" time (guard turns, relex delay, spot!)
								if (timestampUnix - characterNPC.timestampUnixState > 200) {
									// Enemy contact!
									audioPlay(AssetIdAudio.AUDIO_EFFECT_GUARD_SURPRISE, characterNPC.gridIndex);

									characterNPC.assetId = AssetIdImgCharacter.SUPRISE;
									characterNPC.running = true;
									characterNPC.timestampUnixState = timestampUnix;
									characterNPC.walking = false;

									characterNPCUpdated.add(characterNPC.id);
									characterNPCStates.set(characterNPC.id, CharacterNPCState.SURPRISE);
								}
							}

							characterNPC.timestampPrevious = timestampNow;
						}
					}
				} else if (cameraUpdated) {
					// Camera mode means we only need one raycast no matter how many players
					characterPlayer1Raycast = GamingCanvasGridRaycast(camera, gameMapGrid, GameGridCellMasksAndValues.BLOCKING_MASK_VISIBLE, raycastOptions);
					characterPlayer1RaycastDistanceMap = <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>characterPlayer1Raycast.distanceMap;
					characterPlayer1RaycastDistanceMapKeysSorted = <Float64Array>characterPlayer1Raycast.distanceMapKeysSorted;
					characterPlayer1RaycastRays = characterPlayer1Raycast.rays;
					characterPlayer2Raycast = undefined;
				} else {
					characterPlayer1Raycast = undefined;
					characterPlayer2Raycast = undefined;
				}

				// Done
				cameraUpdated = false;
				characterPlayer1.timestampPrevious = timestampNow;
				characterPlayer2.timestampPrevious = timestampNow;
			}

			/**
			 * Audio (Pan and Volume)
			 */
			if (timestampNow - timestampAudio > 20) {
				audioPostStack = new Array();
				timestampAudio = timestampNow;

				// Don't update if the players haven't moved
				if (characterPlayer1RaycastRays !== undefined || characterPlayer2RaycastRays !== undefined) {
					for (audioInstance of audio.values()) {
						// Calc: Distance - Player1
						cameraInstance = characterPlayer1.camera;
						x = audioInstance.x - cameraInstance.x;
						y = audioInstance.y - cameraInstance.y;
						distance = (x * x + y * y) ** 0.5;

						// Calc: Distance - Player2, if required, and compare for closest to audio source
						if (settingsPlayer2Enable === true) {
							x = audioInstance.x - characterPlayer2.camera.x;
							y = audioInstance.y - characterPlayer2.camera.y;
							distance2 = (x * x + y * y) ** 0.5;

							// Calc: Shortest Distance
							if (distance2 < distance) {
								// Use player2 distance and rotation
								cameraInstance = characterPlayer2.camera;
								distance = distance2;
							}
						}

						// Calc: Angle
						x = cameraInstance.r - Math.atan2(x, y);

						// Corrections for rotations between 0 and 2pi
						if (x > GamingCanvasConstPI_2_00) {
							x -= GamingCanvasConstPI_2_00;
						}
						if (x > GamingCanvasConstPI_1_00) {
							x -= GamingCanvasConstPI_2_00;
						}

						// Buffer for audio engine thread push
						audioPostStack.push({
							cmd: CalcMainBusOutputCmd.AUDIO,
							data: {
								instance: audioInstance.instance,
								pan: x,
								volume:
									(<AssetPropertiesAudio>assetsAudio.get(audioInstance.assetId)).volume *
									GamingCanvasUtilScale(distance, 0, audioDistanceMax, 1, 0),
							},
						});
					}

					// Push to audio engine thread
					CalcMainEngine.post(audioPostStack);
				}
			}

			/**
			 * Video (Report)
			 */
			timestampFPSDelta = timestampNow - timestampFPSThen;
			if (timestampFPSDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampFPSThen = timestampNow - (timestampFPSDelta % settingsFPMS);

				// Cameras
				if (cameraMode === true) {
					if (characterPlayer1RaycastRays !== undefined && characterPlayer1RaycastDistanceMapKeysSorted !== undefined) {
						cameraEncoded = camera.encode();
						characterPlayer1CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer1.camera);
						characterPlayer2CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer2.camera);

						CalcMainEngine.post(
							[
								{
									cmd: CalcMainBusOutputCmd.CAMERA,
									data: {
										camera: cameraEncoded,
										player1Camera: characterPlayer1CameraEncoded,
										player2Camera: characterPlayer2CameraEncoded,
										rays: characterPlayer1RaycastRays,
										raysMap: characterPlayer1RaycastDistanceMap,
										raysMapKeysSorted: characterPlayer1RaycastDistanceMapKeysSorted,
									},
								},
							],
							[
								cameraEncoded.buffer,
								characterPlayer1CameraEncoded.buffer,
								characterPlayer2CameraEncoded.buffer,
								characterPlayer1RaycastRays.buffer,
								characterPlayer1RaycastDistanceMapKeysSorted.buffer,
							],
						);

						characterPlayer1RaycastRays = undefined;
					}
				} else {
					if (characterPlayer1RaycastRays !== undefined || characterPlayer2RaycastRays !== undefined) {
						buffers.length = 0;

						if (characterPlayer1RaycastRays !== undefined && characterPlayer1RaycastDistanceMapKeysSorted !== undefined) {
							buffers.push(characterPlayer1RaycastRays.buffer);
							buffers.push(characterPlayer1RaycastDistanceMapKeysSorted.buffer);

							characterPlayer1CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer1.camera);
							buffers.push(characterPlayer1CameraEncoded.buffer);
						} else {
							characterPlayer1CameraEncoded = undefined;
						}

						if (characterPlayer2RaycastRays !== undefined && characterPlayer2RaycastDistanceMapKeysSorted !== undefined) {
							buffers.push(characterPlayer2RaycastRays.buffer);
							buffers.push(characterPlayer2RaycastDistanceMapKeysSorted.buffer);

							characterPlayer2CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer2.camera);
							buffers.push(characterPlayer2CameraEncoded.buffer);
						} else {
							characterPlayer2CameraEncoded = undefined;
						}

						CalcMainEngine.post(
							[
								{
									cmd: CalcMainBusOutputCmd.CALCULATIONS,
									data: {
										characterPlayer1Camera: characterPlayer1CameraEncoded,
										characterPlayer1Rays: characterPlayer1RaycastRays,
										characterPlayer1RaysMap: characterPlayer1RaycastDistanceMap,
										characterPlayer1RaysMapKeysSorted: characterPlayer1RaycastDistanceMapKeysSorted,
										characterPlayer2Camera: characterPlayer2CameraEncoded,
										characterPlayer2Rays: characterPlayer2RaycastRays,
										characterPlayer2RaysMap: characterPlayer2RaycastDistanceMap,
										characterPlayer2RaysMapKeysSorted: characterPlayer2RaycastDistanceMapKeysSorted,
									},
								},
							],
							buffers,
						);

						characterPlayer1RaycastRays = undefined;
						characterPlayer1RaycastDistanceMapKeysSorted = undefined;
						characterPlayer2RaycastRays = undefined;
						characterPlayer2RaycastDistanceMapKeysSorted = undefined;
					}
				}

				// Character
				if (characterPlayer1ChangedMetaReport === true || characterPlayer2ChangedMetaReport === true) {
					buffers.length = 0;

					if (characterPlayer1ChangedMetaReport === true) {
						characterPlayer1MetaEncoded = CharacterMetaEncode(characterPlayer1);
						buffers.push(characterPlayer1MetaEncoded.buffer);
					}
					if (characterPlayer2ChangedMetaReport === true) {
						characterPlayer2MetaEncoded = CharacterMetaEncode(characterPlayer2);
						buffers.push(characterPlayer2MetaEncoded.buffer);
					}

					CalcMainEngine.post(
						[
							{
								cmd: CalcMainBusOutputCmd.CHARACTER_META,
								data: {
									player1: characterPlayer1MetaEncoded,
									player2: characterPlayer2MetaEncoded,
								},
							},
						],
						buffers,
					);

					characterPlayer1ChangedMetaReport = false;
					characterPlayer1MetaEncoded = undefined;
					characterPlayer2ChangedMetaReport = false;
					characterPlayer2MetaEncoded = undefined;
				}

				// Map
				if (gameMapUpdateIndex !== 0) {
					gameMapUpdateEncoded = Uint16Array.from(gameMapUpdate.slice(0, gameMapUpdateIndex));
					gameMapUpdateIndex = 0;

					CalcMainEngine.post(
						[
							{
								cmd: CalcMainBusOutputCmd.MAP_UPDATE,
								data: gameMapUpdateEncoded,
							},
						],
						[gameMapUpdateEncoded.buffer],
					);
				}

				// NPC
				if (characterNPCUpdated.size !== 0) {
					buffers.length = 0;
					characterNPCUpdates.length = 0;

					for (characterNPCId of characterNPCUpdated) {
						characterNPC = <CharacterNPC>gameMapNPC.get(characterNPCId);

						if (characterNPC === undefined) {
							continue;
						}

						characterNPCUpdate = CharacterNPCUpdateEncode({
							assetId: characterNPC.assetId,
							camera: {
								r: characterNPC.camera.r,
								x: characterNPC.camera.x,
								y: characterNPC.camera.y,
								z: characterNPC.camera.z,
							},
							gridIndex: characterNPC.gridIndex,
							id: characterNPC.id,
							running: characterNPC.running === true ? true : undefined,
							timestampUnixState: characterNPC.timestampUnixState,
							walking: characterNPC.walking === true ? true : undefined,
						});
						characterNPCUpdates.push(characterNPCUpdate);

						buffers.push(characterNPCUpdate.buffer);
					}

					CalcMainEngine.post(
						[
							{
								cmd: CalcMainBusOutputCmd.NPC_UPDATE,
								data: characterNPCUpdates,
							},
						],
						buffers,
					);
				}
			}
		};
		CalcMainEngine.go = go;
	}
}
