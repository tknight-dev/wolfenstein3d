import { Character, CharacterInput } from '../../models/character.model.js';
import {
	CalcBusActionDoorState,
	CalcBusActionDoorStateAutoCloseDurationInMS,
	CalcBusActionDoorStateChangeDurationInMS,
	CalcBusActionWallMoveStateChangeDurationInMS,
	CalcBusInputCmd,
	CalcBusInputDataAudio,
	CalcBusInputDataInit,
	CalcBusInputDataPlayerInput,
	CalcBusInputDataSettings,
	CalcBusInputPayload,
	CalcBusOutputCmd,
	CalcBusOutputPayload,
} from './calc.model.js';
import { gameGridCellMaskExtendedDoor, GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../../models/game.model.js';
import { GamingCanvasOrientation, GamingCanvasReport, GamingCanvasUtilScale } from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCharacterControl,
	GamingCanvasGridCharacterControlStyle,
	GamingCanvasGridCharacterControlOptions,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridRaycastCellSide,
	GamingCanvasConstPIDouble,
	GamingCanvasConstPI,
} from '@tknight-dev/gaming-canvas/grid';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridICamera,
	GamingCanvasGridRaycast,
	GamingCanvasGridRaycastOptions,
	GamingCanvasGridRaycastResult,
	GamingCanvasGridUint16Array,
} from '@tknight-dev/gaming-canvas/grid';
import { RaycastQuality } from '../../models/settings.model.js';
import { AssetIdAudio } from '../../asset-manager.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: CalcBusInputPayload = event.data;

	switch (payload.cmd) {
		case CalcBusInputCmd.AUDIO_START:
			CalcEngine.inputAudio(true, <CalcBusInputDataAudio>payload.data);
			break;
		case CalcBusInputCmd.AUDIO_STOP:
			CalcEngine.inputAudio(false, <CalcBusInputDataAudio>payload.data);
			break;
		case CalcBusInputCmd.CAMERA:
			CalcEngine.inputCamera(<Float64Array>payload.data);
			break;
		case CalcBusInputCmd.CHARACTER_INPUT:
			CalcEngine.inputCharacterInput(<CalcBusInputDataPlayerInput>payload.data);
			break;
		case CalcBusInputCmd.MAP:
			CalcEngine.inputMap(<GameMap>payload.data);
			break;
		case CalcBusInputCmd.INIT:
			CalcEngine.initialize(<CalcBusInputDataInit>payload.data);
			break;
		case CalcBusInputCmd.REPORT:
			CalcEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case CalcBusInputCmd.SETTINGS:
			CalcEngine.inputSettings(<CalcBusInputDataSettings>payload.data);
			break;
	}
};

interface AudioInstance {
	assetId: AssetIdAudio;
	instance: number;
	x: number;
	y: number;
}

class CalcEngine {
	private static audio: Map<number, AudioInstance> = new Map();
	private static camera: Float64Array;
	private static cameraNew: boolean;
	private static characterPlayerInput: CalcBusInputDataPlayerInput;
	private static characterPlayerInputNew: boolean;
	private static characterPlayer1: Character;
	private static characterPlayer2: Character;
	private static gameMap: GameMap;
	private static gameMapNew: boolean;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: CalcBusInputDataSettings;
	private static settingsNew: boolean;

	public static initialize(data: CalcBusInputDataInit): void {
		// Config: Character
		CalcEngine.characterPlayer1 = {
			camera: new GamingCanvasGridCamera(data.gameMap.position.r, data.gameMap.position.x + 0.5, data.gameMap.position.y + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			health: 100,
			id: 0,
			npc: false,
			player1: true,
			size: 0.25,
			timestamp: 0,
			timestampPrevious: 0,
		};
		CalcEngine.characterPlayer2 = {
			camera: new GamingCanvasGridCamera(data.gameMap.position.r, data.gameMap.position.x + 0.5, data.gameMap.position.y + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			health: CalcEngine.characterPlayer1.health,
			id: 1,
			npc: false,
			player1: false,
			size: CalcEngine.characterPlayer1.size,
			timestamp: CalcEngine.characterPlayer1.timestamp,
			timestampPrevious: CalcEngine.characterPlayer1.timestampPrevious,
		};

		// Config: Game Map
		CalcEngine.gameMap = data.gameMap;
		CalcEngine.gameMap.grid = GamingCanvasGridUint16Array.from(data.gameMap.grid.data);

		// Config: Report
		CalcEngine.inputReport(data.report);

		// Config: Settings
		CalcEngine.inputSettings(data as CalcBusInputDataSettings);

		// Start
		CalcEngine.post([
			{
				cmd: CalcBusOutputCmd.INIT_COMPLETE,
				data: true,
			},
		]);

		// Start rendering thread
		CalcEngine.go__funcForward();
		CalcEngine.request = requestAnimationFrame(CalcEngine.go);
	}

	/*
	 * Input
	 */

	public static inputAudio(start: boolean, data: CalcBusInputDataAudio): void {
		if (data.instance !== null && data.request !== undefined) {
			if (start === true) {
				const audioInstance: AudioInstance = <AudioInstance>CalcEngine.audio.get(data.request);

				if (audioInstance !== undefined) {
					audioInstance.instance = data.instance;
				}
			} else {
				CalcEngine.audio.delete(data.request);
			}
		}
	}

	public static inputCamera(data: Float64Array): void {
		CalcEngine.camera = data;
		CalcEngine.cameraNew = true;
	}

	public static inputCharacterInput(data: CalcBusInputDataPlayerInput): void {
		CalcEngine.characterPlayerInput = data;
		CalcEngine.characterPlayerInputNew = true;
	}

	public static inputMap(data: GameMap): void {
		data.grid = GamingCanvasGridUint16Array.from(data.grid.data);

		CalcEngine.gameMap = data;
		CalcEngine.gameMapNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		CalcEngine.report = report;

		// Last
		CalcEngine.reportNew = true;
	}

	public static inputSettings(data: CalcBusInputDataSettings): void {
		CalcEngine.settings = data;

		// Last
		CalcEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: CalcBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let actionDoors: Map<number, CalcBusActionDoorState> = new Map(),
			actionDoorState: CalcBusActionDoorState,
			audio: Map<number, AudioInstance> = CalcEngine.audio,
			audioDistanceMax: number = 30,
			audioInstance: AudioInstance,
			audioPostStack: CalcBusOutputPayload[],
			audioRequest: number,
			audioRequestCounter: number = 0,
			buffers: ArrayBufferLike[] = [],
			camera: GamingCanvasGridCamera = new GamingCanvasGridCamera(
				CalcEngine.characterPlayer1.camera.r,
				CalcEngine.characterPlayer1.camera.x,
				CalcEngine.characterPlayer1.camera.y,
				CalcEngine.characterPlayer1.camera.z,
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
			characterPlayer1Input: CharacterInput = {
				action: false,
				fire: false,
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer1: Character = CalcEngine.characterPlayer1,
			characterPlayer1Action: boolean = false,
			characterPlayer1CameraEncoded: Float64Array | undefined,
			characterPlayer1Changed: boolean,
			characterPlayer1GridIndex: number,
			characterPlayer1Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer1RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer1RaycastDistanceMapKeysSorted: Float64Array,
			characterPlayer1RaycastRays: Float64Array | undefined,
			characterPlayer2Input: CharacterInput = {
				action: false,
				fire: false,
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer2: Character = CalcEngine.characterPlayer2,
			characterPlayer2Action: boolean = false,
			characterPlayer2CameraEncoded: Float64Array | undefined,
			characterPlayer2Changed: boolean,
			characterPlayer2GridIndex: number,
			characterPlayer2RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer2RaycastDistanceMapKeysSorted: Float64Array,
			characterPlayer2Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer2RaycastRays: Float64Array | undefined,
			cycleMinMs: number = 10,
			distance: number,
			distance2: number,
			gameMapGrid: GamingCanvasGridUint16Array = CalcEngine.gameMap.grid,
			gameMapGridData: Uint16Array = CalcEngine.gameMap.grid.data,
			gameMapIndexEff: number,
			gameMapSideLength: number = CalcEngine.gameMap.grid.sideLength,
			raycastOptions: GamingCanvasGridRaycastOptions = {
				cellEnable: true,
				distanceMapEnable: true,
				rayCount: CalcEngine.report.canvasWidth,
				rayFOV: CalcEngine.settings.fov,
			},
			report: GamingCanvasReport = CalcEngine.report,
			reportOrientation: GamingCanvasOrientation = CalcEngine.report.orientation,
			reportOrientationForce: boolean = true,
			settingsFPMS: number = 1000 / CalcEngine.settings.fps,
			settingsPlayer2Enable: boolean = CalcEngine.settings.player2Enable,
			timestampAudio: number = 0,
			timestampDelta: number,
			timestampFPSDelta: number,
			timestampFPSThen: number = 0,
			timestampThen: number = 0,
			x: number,
			y: number;

		const actionDoor = (cellSide: GamingCanvasGridRaycastCellSide, gridIndex: number) => {
			let state: CalcBusActionDoorState = <CalcBusActionDoorState>actionDoors.get(gridIndex),
				durationEff: number;

			if (state === undefined) {
				state = {
					cellSide: cellSide,
					closed: false,
					closing: false,
					open: false,
					timestampUnix: 0,
				};
				actionDoors.set(gridIndex, state);
			}

			if (state.open === false) {
				if (state.closing === true) {
					durationEff = CalcBusActionDoorStateChangeDurationInMS - (Date.now() - state.timestampUnix);
				} else {
					durationEff = CalcBusActionDoorStateChangeDurationInMS;
				}

				state.closed = false;
				state.closing = false;
				state.timestampUnix = Date.now();
				CalcEngine.post([
					{
						cmd: CalcBusOutputCmd.ACTION_DOOR_OPEN,
						data: {
							cellSide: cellSide,
							gridIndex: gridIndex,
							timestampUnix: state.timestampUnix,
						},
					},
				]);
				audioPlay(AssetIdAudio.AUDIO_EFFECT_DOOR_OPEN, gridIndex);

				clearTimeout(state.timeout);
				state.timeout = setTimeout(() => {
					gameMapGridData[gridIndex] &= ~GameGridCellMasksAndValues.WALL_INVISIBLE;
					state.open = true;

					setTimeout(() => {
						gameMapGridData[gridIndex] |= GameGridCellMasksAndValues.WALL_INVISIBLE;
						state.closing = true;
						state.open = false;
						state.timestampUnix = new Date().getTime();

						audioPlay(AssetIdAudio.AUDIO_EFFECT_DOOR_CLOSE, gridIndex);

						state.timeout = setTimeout(() => {
							state.closed = false;
							state.closing = false;
							state.open = false;
						}, CalcBusActionDoorStateChangeDurationInMS);
					}, CalcBusActionDoorStateAutoCloseDurationInMS);
				}, durationEff);
			}
		};

		const actionWallMovable = (cellSide: GamingCanvasGridRaycastCellSide, gridIndex: number) => {
			CalcEngine.post([
				{
					cmd: CalcBusOutputCmd.ACTION_WALL_MOVE,
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
				(CalcBusActionWallMoveStateChangeDurationInMS / 2) | 0,
			);

			// Calc: Move 2nd Block
			setTimeout(() => {
				gameMapGridData[gridIndex + offset] = GameGridCellMasksAndValues.FLOOR;
			}, CalcBusActionWallMoveStateChangeDurationInMS);
		};

		const audioPlay = (assetId: AssetIdAudio, gridIndex: number) => {
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
			if (x > GamingCanvasConstPIDouble) {
				x -= GamingCanvasConstPIDouble;
			}
			if (x > GamingCanvasConstPI) {
				x -= GamingCanvasConstPIDouble;
			}

			// Cache
			audio.set(request, audioInstance);

			// Post to audio engine thread
			CalcEngine.post([
				{
					cmd: CalcBusOutputCmd.AUDIO,
					data: {
						assetId: assetId,
						pan: x,
						volume: GamingCanvasUtilScale(distance, 0, audioDistanceMax, 1, 0),
						request: request,
					},
				},
			]);

			return request;
		};

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			CalcEngine.request = requestAnimationFrame(CalcEngine.go);

			/**
			 * Calc
			 */
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > cycleMinMs) {
				// Wait a small duration to not thread lock
				timestampThen = timestampNow;

				/**
				 * Calc: Environment
				 */
				cameraUpdated = false;
				characterPlayer1.timestamp = timestampNow;
				characterPlayer1Changed = false;

				characterPlayer2.timestamp = timestampNow;
				characterPlayer2Changed = false;

				if (CalcEngine.cameraNew) {
					CalcEngine.cameraNew = false;

					camera = GamingCanvasGridCamera.from(CalcEngine.camera);
					cameraMode = true; // Snap back to camera
					cameraUpdated = true;
				}

				if (CalcEngine.gameMapNew === true) {
					CalcEngine.gameMapNew = false;

					for (actionDoorState of actionDoors.values()) {
						clearTimeout(actionDoorState.timeout);
					}
					actionDoors.clear();

					gameMapGrid = CalcEngine.gameMap.grid;
					((gameMapGridData = CalcEngine.gameMap.grid.data), (gameMapSideLength = CalcEngine.gameMap.grid.sideLength));

					cameraUpdated = true;
				}

				if (CalcEngine.reportNew === true || CalcEngine.settingsNew === true) {
					CalcEngine.reportNew = false;
					CalcEngine.settingsNew = false;

					// Settings
					cameraUpdated = true; // This or position works
					raycastOptions.rayFOV = CalcEngine.settings.fov;
					settingsFPMS = 1000 / CalcEngine.settings.fps;
					settingsPlayer2Enable = CalcEngine.settings.player2Enable;

					// Report
					report = CalcEngine.report;
					raycastOptions.rayCount = report.canvasWidth;

					if (reportOrientation !== report.orientation) {
						reportOrientation = report.orientation;
						reportOrientationForce = true;
					}

					if (CalcEngine.settings.player2Enable === true) {
						if (report.orientation === GamingCanvasOrientation.LANDSCAPE) {
							raycastOptions.rayCount = (report.canvasWidth / 2) | 0;
						}
					}

					if (CalcEngine.settings.raycastQuality !== RaycastQuality.FULL) {
						raycastOptions.rayCount = (raycastOptions.rayCount / CalcEngine.settings.raycastQuality) | 0;
					}
				}

				// Character Control: Update
				if (CalcEngine.characterPlayerInputNew === true) {
					CalcEngine.characterPlayerInputNew = false;

					cameraMode = false; // Snap back to player
					characterPlayer1Input = CalcEngine.characterPlayerInput.player1;
					characterPlayer2Input = CalcEngine.characterPlayerInput.player2;
				}

				/**
				 * Calc: Position
				 */
				if (cameraMode === false) {
					/**
					 * Position
					 */

					// Player 1: Position
					characterPlayer1Changed =
						characterPlayer1Changed ||
						GamingCanvasGridCharacterControl(
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
					}

					if (settingsPlayer2Enable === true) {
						// Player 2: Position
						characterPlayer2Changed =
							characterPlayer2Changed ||
							GamingCanvasGridCharacterControl(
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
						}
					} else {
						characterPlayer2Raycast = undefined;
					}

					/**
					 * Action
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

						if ((gameMapGridData[gameMapIndexEff] & GameGridCellMasksAndValues.EXTENDED) !== 0) {
							if ((gameMapGridData[gameMapIndexEff] & gameGridCellMaskExtendedDoor) !== 0) {
								actionDoor(cellSide, gameMapIndexEff);
							}
						} else if ((gameMapGridData[gameMapIndexEff] & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0) {
							actionWallMovable(cellSide, gameMapIndexEff);
						}
					} else if (characterPlayer1Action === true && characterPlayer1Input.action === false) {
						characterPlayer1Action = false;
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

							if ((gameMapGridData[gameMapIndexEff] & GameGridCellMasksAndValues.EXTENDED) !== 0) {
								if ((gameMapGridData[gameMapIndexEff] & gameGridCellMaskExtendedDoor) !== 0) {
									actionDoor(cellSide, gameMapIndexEff);
								}
							} else if ((gameMapGridData[gameMapIndexEff] & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0) {
								actionWallMovable(cellSide, gameMapIndexEff);
							}
						} else if (characterPlayer2Action === true && characterPlayer2Input.action === false) {
							characterPlayer2Action = false;
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
						if (x > GamingCanvasConstPIDouble) {
							x -= GamingCanvasConstPIDouble;
						}
						if (x > GamingCanvasConstPI) {
							x -= GamingCanvasConstPIDouble;
						}

						// Buffer for audio engine thread push
						audioPostStack.push({
							cmd: CalcBusOutputCmd.AUDIO,
							data: {
								instance: audioInstance.instance,
								pan: x,
								volume: GamingCanvasUtilScale(distance, 0, audioDistanceMax, 1, 0),
							},
						});
					}

					// Push to audio engine thread
					CalcEngine.post(audioPostStack);
				}
			}

			/**
			 * Video (Report)
			 */
			timestampFPSDelta = timestampNow - timestampFPSThen;
			if (timestampFPSDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampFPSThen = timestampNow - (timestampFPSDelta % settingsFPMS);

				// if (characterPlayer1RaycastRays !== undefined) {
				// 	console.log('rays', characterPlayer1RaycastRays.length / 6, (characterPlayer1RaycastDistanceMapKeysSorted || []).length);
				// }

				if (cameraMode === true) {
					if (characterPlayer1RaycastRays !== undefined) {
						cameraEncoded = camera.encode();
						characterPlayer1CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer1.camera);
						characterPlayer2CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer2.camera);

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CAMERA,
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

						if (characterPlayer1RaycastRays !== undefined) {
							buffers.push(characterPlayer1RaycastRays.buffer);
							buffers.push(characterPlayer1RaycastDistanceMapKeysSorted.buffer);

							characterPlayer1CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer1.camera);
							buffers.push(characterPlayer1CameraEncoded.buffer);
						} else {
							characterPlayer1CameraEncoded = undefined;
						}

						if (characterPlayer2RaycastRays !== undefined) {
							buffers.push(characterPlayer2RaycastRays.buffer);
							buffers.push(characterPlayer2RaycastDistanceMapKeysSorted.buffer);

							characterPlayer2CameraEncoded = GamingCanvasGridCamera.encodeSingle(characterPlayer2.camera);
							buffers.push(characterPlayer2CameraEncoded.buffer);
						} else {
							characterPlayer2CameraEncoded = undefined;
						}

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CALCULATIONS,
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
						characterPlayer2RaycastRays = undefined;
					}
				}
			}
		};
		CalcEngine.go = go;
	}
}
