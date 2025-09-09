import { Character } from '../../models/character.model.js';
import {
	CalcBusInputCmd,
	CalcBusInputDataInit,
	CalcBusInputDataPlayerInput,
	CalcBusInputDataSettings,
	CalcBusInputPayload,
	CalcBusOutputCmd,
	CalcBusOutputPayload,
} from './calc.model.js';
import { GameGridCellMasksAndValues, GameMap } from '../../models/game.model.js';
import { GamingCanvasOrientation, GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCharacterControl,
	GamingCanvasGridCharacterControlStyle,
	GamingCanvasGridCharacterControlOptions,
	GamingCanvasGridCharacterInput,
	GamingCanvasGridRaycastResultDistanceMapInstance,
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

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: CalcBusInputPayload = event.data;

	switch (payload.cmd) {
		case CalcBusInputCmd.CAMERA:
			CalcEngine.inputCamera(<Float64Array>payload.data);
			break;
		case CalcBusInputCmd.CHARACTER_INPUT:
			CalcEngine.inputCharacterInput(<CalcBusInputDataPlayerInput>payload.data);
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

class CalcEngine {
	private static camera: Float64Array;
	private static cameraNew: boolean;
	private static characterPlayerInput: CalcBusInputDataPlayerInput;
	private static characterPlayerInputNew: boolean;
	private static characterPlayer1: Character;
	private static characterPlayer2: Character;
	private static gameMap: GameMap;
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

	public static inputCamera(data: Float64Array): void {
		CalcEngine.camera = data;
		CalcEngine.cameraNew = true;
	}

	public static inputCharacterInput(data: CalcBusInputDataPlayerInput): void {
		CalcEngine.characterPlayerInput = data;
		CalcEngine.characterPlayerInputNew = true;
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
		let camera: GamingCanvasGridCamera = new GamingCanvasGridCamera(
				CalcEngine.characterPlayer1.camera.r,
				CalcEngine.characterPlayer1.camera.x,
				CalcEngine.characterPlayer1.camera.y,
				CalcEngine.characterPlayer1.camera.z,
			),
			cameraEncoded: Float64Array,
			cameraMode: boolean = false,
			cameraUpdated: boolean = true,
			buffers: ArrayBufferLike[] = [],
			characterControlOptions: GamingCanvasGridCharacterControlOptions = {
				clip: true,
				factorPosition: 0.00425,
				factorRotation: 0.00225,
				style: GamingCanvasGridCharacterControlStyle.STRAFE,
			},
			characterPlayer1Input: GamingCanvasGridCharacterInput = {
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer1: Character = CalcEngine.characterPlayer1,
			characterPlayer1CameraEncoded: Float64Array | undefined,
			characterPlayer1Changed: boolean,
			characterPlayer1Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer1RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer1RaycastDistanceMapKeysSorted: Float64Array,
			characterPlayer1RaycastRays: Float64Array | undefined,
			characterPlayer2Input: GamingCanvasGridCharacterInput = {
				r: 0,
				x: 0,
				y: 0,
			},
			characterPlayer2: Character = CalcEngine.characterPlayer2,
			characterPlayer2CameraEncoded: Float64Array | undefined,
			characterPlayer2Changed: boolean,
			characterPlayer2RaycastDistanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>,
			characterPlayer2RaycastDistanceMapKeysSorted: Float64Array,
			characterPlayer2Raycast: GamingCanvasGridRaycastResult | undefined,
			characterPlayer2RaycastRays: Float64Array | undefined,
			cycleMinMs: number = 10,
			gameMapGrid: GamingCanvasGridUint16Array = CalcEngine.gameMap.grid,
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
			timestampDelta: number,
			timestampFPSDelta: number,
			timestampFPSThen: number = 0,
			timestampThen: number = 0;

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

				if (CalcEngine.reportNew) {
					CalcEngine.reportNew = false;

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

				if (CalcEngine.settingsNew) {
					CalcEngine.settingsNew = false;

					cameraUpdated = true; // This or position works
					raycastOptions.rayFOV = CalcEngine.settings.fov;
					settingsFPMS = 1000 / CalcEngine.settings.fps;
				}

				/**
				 * Calc: Position
				 */
				if (cameraMode === false) {
					// Player 1: Position
					characterPlayer1Changed =
						characterPlayer1Changed ||
						GamingCanvasGridCharacterControl(
							characterPlayer1,
							characterPlayer1Input,
							gameMapGrid,
							GameGridCellMasksAndValues.BLOCKING_MASK,
							characterControlOptions,
						);

					// Player 1: Raycast
					if (characterPlayer1Changed === true || reportOrientationForce === true) {
						characterPlayer1Raycast = GamingCanvasGridRaycast(
							characterPlayer1.camera,
							gameMapGrid,
							GameGridCellMasksAndValues.BLOCKING_MASK,
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
								GameGridCellMasksAndValues.BLOCKING_MASK,
								characterControlOptions,
							);

						// Player 2: Raycast
						if (characterPlayer2Changed === true || reportOrientationForce === true) {
							characterPlayer2Raycast = GamingCanvasGridRaycast(
								characterPlayer2.camera,
								gameMapGrid,
								GameGridCellMasksAndValues.BLOCKING_MASK,
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
				} else if (cameraUpdated) {
					// Camera mode means we only need one raycast no matter how many players
					characterPlayer1Raycast = GamingCanvasGridRaycast(camera, gameMapGrid, GameGridCellMasksAndValues.BLOCKING_MASK, raycastOptions);
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
			 * Video (Report)
			 */
			timestampFPSDelta = timestampNow - timestampFPSThen;
			if (timestampFPSDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampFPSThen = timestampNow - (timestampFPSDelta % settingsFPMS);

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
