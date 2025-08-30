import { CharacterControl, CharacterControlDecode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../../models/character.model';
import { CalcBusInputCmd, CalcBusInputDataInit, CalcBusInputDataSettings, CalcBusInputPayload, CalcBusOutputCmd, CalcBusOutputPayload } from './calc.model';
import { Camera, CameraDecode, CameraEncode } from '../../models/camera.model';
import { GameMap, GameMapCellMasks } from '../../models/game.model';
import { GamingCanvasReport, GamingCanvasUtilArrayExpand } from '@tknight-dev/gaming-canvas';

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
			CalcEngine.inputCamera(<Float32Array>payload.data);
			break;
		case CalcBusInputCmd.CHARACTER_CONTROL:
			CalcEngine.inputCharacterControl(<Float32Array>payload.data);
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
	private static camera: Float32Array;
	private static cameraNew: boolean;
	private static characterControl: Float32Array;
	private static characterControlNew: boolean;
	private static characterPosition: CharacterPosition;
	private static gameMap: GameMap;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settingsFOV: number;
	private static settingsFPMS: number;
	private static settingsNew: boolean;

	public static initialize(data: CalcBusInputDataInit): void {
		// Config
		CalcEngine.gameMap = data.gameMap;

		// Config: CharacterPosition
		CalcEngine.characterPosition = CharacterPositionDecode(data.characterPosition);

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

	public static inputCamera(data: Float32Array): void {
		CalcEngine.camera = data;
		CalcEngine.cameraNew = true;
	}

	public static inputCharacterControl(data: Float32Array): void {
		CalcEngine.characterControl = data;
		CalcEngine.characterControlNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		CalcEngine.report = report;

		// Last
		CalcEngine.reportNew = true;
	}

	public static inputSettings(data: CalcBusInputDataSettings): void {
		CalcEngine.settingsFOV = data.fov;
		CalcEngine.settingsFPMS = 1000 / data.fps;

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
		let camera: Camera = {
				r: CalcEngine.characterPosition.r,
				x: 0,
				y: 0,
				z: 1,
			},
			cameraEncoded: Float32Array,
			cameraMode: boolean = false,
			cameraUpdated: boolean = true,
			cameraUpdatedReport: boolean = true,
			cellSizePx: number = 1,
			characterControl: CharacterControl = {
				r: CalcEngine.characterPosition.r,
				x: 0,
				y: 0,
			},
			characterControlFactor: number = 0.06,
			characterControlX: number,
			characterControlXIndex: number,
			characterControlY: number,
			characterControlYIndex: number,
			characterPosition: CharacterPosition = CalcEngine.characterPosition,
			characterPositionEncoded: Float32Array,
			characterPositionUpdated: boolean = false,
			characterPositionUpdatedReport: boolean = false,
			characterSizeInC: number = 0.25,
			characterSizeInCEff: number,
			cycleMinMs: number = 10,
			gameMap: GameMap = CalcEngine.gameMap,
			gameMapData: Uint8Array = CalcEngine.gameMap.data,
			i: number,
			pi: number = Math.PI,
			piDouble: number = Math.PI * 2,
			rays: number[] = new Array(CalcEngine.report.canvasWidth * 2), // [ray1-x, ray1-y, ray2-x, ray2-y, ...]
			raysEncoded: Float32Array,
			raysIndex: number = 0,
			raysSize: number = 0,
			report: GamingCanvasReport = CalcEngine.report,
			settingsFOV: number = CalcEngine.settingsFOV,
			settingsFOVHalf: number = CalcEngine.settingsFOV / 2,
			settingsFOVStepAngle: number = CalcEngine.settingsFOV / 2,
			settingsFPMS: number = CalcEngine.settingsFPMS,
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

				if (CalcEngine.cameraNew) {
					CalcEngine.cameraNew = false;

					camera = CameraDecode(CalcEngine.camera);
					cameraMode = true; // Snap back to camera
					cameraUpdated = true;
					cameraUpdatedReport = true;
				}

				if (CalcEngine.reportNew) {
					CalcEngine.reportNew = false;

					report = CalcEngine.report;

					// Same as viewport but without the z factor
					cellSizePx = Math.max(1, report.canvasWidth / gameMap.dataWidth);

					if (report.canvasWidth * 2 > rays.length) {
						GamingCanvasUtilArrayExpand(rays, report.canvasWidth * 2 - rays.length);
						raysIndex = 0; // Reset ray calculation
					}
				}

				// Character Control: Update
				if (CalcEngine.characterControlNew === true) {
					CalcEngine.characterControlNew = false;

					cameraMode = false; // Snap back to player
					characterControl = CharacterControlDecode(CalcEngine.characterControl);

					if (characterPosition.r !== characterControl.r) {
						characterPosition.r = characterControl.r;
						characterPositionUpdated = true;
						characterPositionUpdatedReport = true;
					}
				}

				if (CalcEngine.settingsNew) {
					CalcEngine.settingsNew = false;

					cameraUpdated = true; // This or position works
					raysSize = report.canvasWidth;
					settingsFOV = CalcEngine.settingsFOV;
					settingsFOVHalf = settingsFOV / 2;
					settingsFPMS = CalcEngine.settingsFPMS;
					settingsFOVStepAngle = settingsFOV / report.canvasWidth;
				}

				/**
				 * Calc: Position
				 */
				if (cameraMode === false && (characterControl.x !== 0 || characterControl.y !== 0)) {
					characterPositionUpdatedReport = true;

					// X
					characterControlX =
						(Math.cos(characterControl.r) * -characterControl.x + Math.sin(characterControl.r) * -characterControl.y) * characterControlFactor;

					characterSizeInCEff = characterControlX > 0 ? characterSizeInC : -characterSizeInC;
					characterControlXIndex = ((characterPosition.x + characterControlX + characterSizeInCEff) | 0) * gameMap.dataWidth;

					if ((gameMapData[characterControlXIndex + (characterPosition.y | 0)] & GameMapCellMasks.TYPE_WALL) !== 1) {
						characterPosition.x += characterControlX;
						characterPositionUpdated = true;
						characterPositionUpdatedReport = true;
					}

					// Y
					characterControlY =
						(Math.sin(characterControl.r) * characterControl.x + Math.cos(characterControl.r) * -characterControl.y) * characterControlFactor;

					characterSizeInCEff = characterControlY > 0 ? characterSizeInC : -characterSizeInC;
					characterControlYIndex = (characterPosition.y + characterControlY + characterSizeInCEff) | 0;

					if ((gameMapData[(characterPosition.x | 0) * gameMap.dataWidth + characterControlYIndex] & GameMapCellMasks.TYPE_WALL) !== 1) {
						characterPosition.y += characterControlY;
						characterPositionUpdated = true;
						characterPositionUpdatedReport = true;
					}

					// Current cell
					characterPosition.dataIndex = (characterPosition.x | 0) * gameMap.dataWidth + (characterPosition.y | 0);
				}

				/**
				 * Calc: Raycasting (DDA Algorithm)
				 */

				if (cameraUpdated === true || characterPositionUpdated === true) {
					// let currentAngle = (cameraMode === true ? camera.r : characterPosition.r) + settingsFOVHalf;
					// let rayStartX: number = cameraMode === true ? camera.x : characterPosition.x;
					// let rayStartY: number = cameraMode === true ? camera.y : characterPosition.y;
					// // Vertical intersection
					// for (i = 0, raysIndex = 0; i < raysSize; i++, raysIndex += 2) {
					// 	let currentCos = Math.cos(currentAngle);
					// 	let currentSin = Math.sin(currentAngle);
					// 	let rayEndX: number, rayEndY: number, rayDirectionX: number, verticalDepth: number;
					// 	if (currentSin > 0) {
					// 		rayEndX = rayStartX;
					// 		rayDirectionX = 1;
					// 	} else {
					// 		rayEndX = rayStartX;
					// 		rayDirectionX = -1;
					// 	}
					// 	for (let offset = 0; offset < report.canvasWidth; offset += cellSizePx) {
					// 		verticalDepth = (rayEndX - rayStartX) / currentSin;
					// 		rayEndY = rayStartY + verticalDepth * currentCos;
					// 	}
					// }
				}
				rays[0] = 0;
				rays[1] = 0;
				raysIndex = 2;

				// Done
				cameraUpdated = false;
				characterPositionUpdated = false;
			}

			/**
			 * Video (Report)
			 */
			timestampFPSDelta = timestampNow - timestampFPSThen;
			if (timestampFPSDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampFPSThen = timestampNow - (timestampFPSDelta % settingsFPMS);

				if (cameraMode === true) {
					if (cameraUpdatedReport === true) {
						cameraUpdatedReport = false;

						cameraEncoded = CameraEncode(camera);
						raysEncoded = Float32Array.from(rays.slice(0, raysIndex));

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CAMERA,
									data: {
										camera: cameraEncoded,
										rays: raysEncoded,
									},
								},
							],
							[cameraEncoded.buffer, raysEncoded.buffer],
						);
					}
				} else {
					if (characterPositionUpdatedReport === true) {
						characterPositionUpdatedReport = false;

						characterPositionEncoded = CharacterPositionEncode(CalcEngine.characterPosition);
						raysEncoded = Float32Array.from(rays.slice(0, raysIndex));

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CALCULATIONS,
									data: {
										characterPosition: characterPositionEncoded,
										rays: raysEncoded,
									},
								},
							],
							[characterPositionEncoded.buffer, raysEncoded.buffer],
						);
					}
				}
			}
		};
		CalcEngine.go = go;
	}
}
