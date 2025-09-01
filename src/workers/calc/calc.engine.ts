import { CharacterControl, CharacterControlDecode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../../models/character.model.js';
import { CalcBusInputCmd, CalcBusInputDataInit, CalcBusInputDataSettings, CalcBusInputPayload, CalcBusOutputCmd, CalcBusOutputPayload } from './calc.model.js';
import { GameMap, GameMapCellMasks } from '../../models/game.model.js';
import { GamingCanvasReport, GamingCanvasUtilArrayExpand } from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridRaycast,
	GamingCanvasGridRaycastOptions,
	GamingCanvasGridRaycastResult,
	GamingCanvasGridUint8ClampedArray,
} from '@tknight-dev/gaming-canvas/grid';

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
		CalcEngine.gameMap.grid = GamingCanvasGridUint8ClampedArray.from(data.gameMap.grid.data);

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
		let camera: GamingCanvasGridCamera = new GamingCanvasGridCamera(CalcEngine.characterPosition.r),
			cameraEncoded: Float32Array,
			cameraMode: boolean = false,
			cameraUpdated: boolean = true,
			cameraUpdatedReport: boolean = true,
			cells: Set<Number>,
			cellsEncoded: Uint8Array,
			// cellSizePx: number,
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
			gameMapGrid: GamingCanvasGridUint8ClampedArray = CalcEngine.gameMap.grid,
			gameMapGridData: Uint8ClampedArray = CalcEngine.gameMap.grid.data,
			gameMapGridSideLength: number = CalcEngine.gameMap.grid.sideLength,
			rays: Float32Array,
			report: GamingCanvasReport = CalcEngine.report,
			settingsFOV: number = CalcEngine.settingsFOV,
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

					camera = GamingCanvasGridCamera.from(CalcEngine.camera);
					cameraMode = true; // Snap back to camera
					cameraUpdated = true;
					cameraUpdatedReport = true;
				}

				if (CalcEngine.reportNew) {
					CalcEngine.reportNew = false;

					report = CalcEngine.report;

					// Same as viewport but without the z factor
					// cellSizePx = Math.max(1, report.canvasWidth / gameMapGrid.sideLength);

					// if (report.canvasWidth * 2 > rays.length) {
					// 	GamingCanvasUtilArrayExpand(rays, report.canvasWidth * 2 - rays.length);
					// 	raysIndex = 0; // Reset ray calculation
					// }
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
					// raysSize = report.canvasWidth;
					settingsFOV = CalcEngine.settingsFOV;
					settingsFPMS = CalcEngine.settingsFPMS;
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
					characterControlXIndex = ((characterPosition.x + characterControlX + characterSizeInCEff) | 0) * gameMapGridSideLength;

					if ((gameMapGridData[characterControlXIndex + (characterPosition.y | 0)] & GameMapCellMasks.TYPE_WALL) !== 1) {
						characterPosition.x += characterControlX;
						characterPositionUpdated = true;
						characterPositionUpdatedReport = true;
					}

					// Y
					characterControlY =
						(Math.sin(characterControl.r) * characterControl.x + Math.cos(characterControl.r) * -characterControl.y) * characterControlFactor;

					characterSizeInCEff = characterControlY > 0 ? characterSizeInC : -characterSizeInC;
					characterControlYIndex = (characterPosition.y + characterControlY + characterSizeInCEff) | 0;

					if ((gameMapGridData[(characterPosition.x | 0) * gameMapGridSideLength + characterControlYIndex] & GameMapCellMasks.TYPE_WALL) !== 1) {
						characterPosition.y += characterControlY;
						characterPositionUpdated = true;
						characterPositionUpdatedReport = true;
					}

					// Current cell
					characterPosition.dataIndex = (characterPosition.x | 0) * gameMapGridSideLength + (characterPosition.y | 0);
				}

				/**
				 * Calc: Raycasting (DDA Algorithm)
				 */

				if (cameraUpdated === true || characterPositionUpdated === true) {
					let data: GamingCanvasGridRaycastResult;

					let options: GamingCanvasGridRaycastOptions = {
						cellEnable: true,
						rayCount: 50,
						// rayCount: report.canvasWidth,
						rayFOV: (60 * Math.PI) / 180,
					};

					if (cameraMode === true) {
						data = GamingCanvasGridRaycast(camera, gameMapGrid, 0x01, 0x01, options);
					} else {
						data = GamingCanvasGridRaycast(characterPosition, gameMapGrid, 0x01, 0x01, options);
					}

					cells = <Set<Number>>data.cells;
					rays = <Float32Array>data.rays;
				}

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

						cameraEncoded = camera.encode();
						cellsEncoded = Uint8Array.from(cells);

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CAMERA,
									data: {
										camera: cameraEncoded,
										cells: cellsEncoded,
										rays: rays,
									},
								},
							],
							[cameraEncoded.buffer, cellsEncoded.buffer],
						);
					}
				} else {
					if (characterPositionUpdatedReport === true) {
						characterPositionUpdatedReport = false;

						characterPositionEncoded = CharacterPositionEncode(CalcEngine.characterPosition);
						cellsEncoded = Uint8Array.from(cells);

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CALCULATIONS,
									data: {
										cells: cellsEncoded,
										characterPosition: characterPositionEncoded,
										rays: rays,
									},
								},
							],
							[cellsEncoded.buffer, characterPositionEncoded.buffer],
						);
					}
				}
			}
		};
		CalcEngine.go = go;
	}
}
