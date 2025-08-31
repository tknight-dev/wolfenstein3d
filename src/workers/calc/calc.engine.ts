import { CharacterControl, CharacterControlDecode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../../models/character.model.js';
import { CalcBusInputCmd, CalcBusInputDataInit, CalcBusInputDataSettings, CalcBusInputPayload, CalcBusOutputCmd, CalcBusOutputPayload } from './calc.model.js';
import { GameMap, GameMapCellMasks } from '../../models/game.model.js';
import { GamingCanvasReport, GamingCanvasUtilArrayExpand } from '@tknight-dev/gaming-canvas';
import { GamingCanvasGridCamera, GamingCanvasGridUint8ClampedArray } from '@tknight-dev/gaming-canvas/grid';

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

interface GamingCanvasGridRaycastOptions {
	fovInDegrees?: number;
	fovPixels?: number;
	skipCells?: boolean;
	skipRays?: boolean;
}

interface GamingCanvasGridRaycastResult {
	cells?: Set<number>; // to be Uint*Array typed with in the actual canvas project with types available
	rays?: Float32Array;
}

/**
 * If either `fovInDegrees` or `fovPixels` is undefiend then only one ray is cast
 *
 * @param fovInDegrees (integer) how wide of a field-of-view to cast rays in
 * @param fovPixels (integer) how many rays to cast
 */
const GamingCanvasGridRaycast = (
	r: number,
	x: number,
	y: number,
	cellSizePx: number,
	grid: any,
	options?: GamingCanvasGridRaycastOptions,
): GamingCanvasGridRaycastResult => {
	let cells: Set<number> | undefined,
		fovInDegreesStart: number = 0,
		gridData: any = grid.data,
		gridSideLength: number = grid.sideLength,
		gridSize: number = gridSideLength * gridSideLength,
		i: number = 0,
		j: number,
		length: number = 1,
		rayIndex: number = 0,
		rays: Float32Array | undefined; // Cast 1 ray by default

	if (options !== undefined) {
		if (options.fovInDegrees !== undefined && options.fovPixels !== undefined) {
			options.fovInDegrees = options.fovInDegrees | 0;

			fovInDegreesStart = options.fovInDegrees - ((options.fovInDegrees / 2) | 0);

			length = options.fovPixels | 0;
		}

		if (options.skipCells !== true) {
			cells = new Set();
			cells.add((x | 0) * gridSideLength + (y | 0)); // Add the origin cell
		}

		if (options.skipRays !== true) {
			rays = new Float32Array(length * 2); // [x1-ray, y1-ray, x2-ray, y2-ray, ... ]
		}

		if (cells === undefined && rays === undefined) {
			return {};
		}
	} else {
		cells = new Set();
		cells.add((x | 0) * gridSideLength + (y | 0)); // Add the origin cell

		rays = new Float32Array(length * 2); // [x1-ray, y1-ray, x2-ray, y2-ray, ... ]
	}

	// Start the algo
	let distance: number,
		gridIndex: number,
		xAngle: number,
		xIndex: number,
		xRayLength: number,
		xStepRay: number,
		xStep: number,
		yAngle: number,
		yIndex: number,
		yRayLength: number,
		yStepRay: number,
		yStep: number;

	for (; i < length; i++, fovInDegreesStart++, rayIndex += 2) {
		// Initial angle
		xAngle = Math.sin(r);
		yAngle = Math.cos(r);

		// Initial index
		xIndex = x | 0;
		yIndex = y | 0;

		// Step size to next cell
		xStep = Math.sign(xAngle);
		xStepRay = (1 + (yAngle / xAngle) * (yAngle / xAngle)) ** 0.5;
		yStep = Math.sign(yAngle);
		yStepRay = (1 + (xAngle / yAngle) * (xAngle / yAngle)) ** 0.5;

		// Offset ray length by current position within cell
		xRayLength = (xAngle < 0 ? x - xIndex : 1 - (x - xIndex)) * xStepRay;
		yRayLength = (yAngle < 0 ? y - yIndex : 1 - (y - yIndex)) * yStepRay;

		// Increment ray cell by cell
		for (j = 0; j < gridSideLength; j++) {
			// Next cell
			if (xRayLength < yRayLength) {
				distance = xRayLength;
				xIndex += xStep;
				xRayLength += xStepRay;
			} else {
				distance = yRayLength;
				yIndex += yStep;
				yRayLength += yStepRay;
			}

			// Convert to grid index
			gridIndex = xIndex * gridSideLength + yIndex;

			// Within grid?
			if (gridIndex < 0 || gridIndex >= gridSize) {
				break;
			}

			// Is terminated?
			if (gridData[gridIndex] === 1) {
				if (rays !== undefined) {
					rays[0] = x + xAngle * distance;
					rays[1] = y + yAngle * distance;
				}
				break;
			} else if (cells !== undefined) {
				cells.add(gridIndex);
			}
		}
	}

	// Done
	return {
		cells: cells,
		rays: rays,
	};
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
			cells: Set<number>,
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
			gameMapGrid: GamingCanvasGridUint8ClampedArray = CalcEngine.gameMap.grid,
			gameMapGridData: Uint8ClampedArray = CalcEngine.gameMap.grid.data,
			gameMapGridSideLength: number = CalcEngine.gameMap.grid.sideLength,
			i: number,
			pi: number = Math.PI,
			piDouble: number = Math.PI * 2,
			rays: Float32Array,
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

					camera = GamingCanvasGridCamera.from(CalcEngine.camera);
					cameraMode = true; // Snap back to camera
					cameraUpdated = true;
					cameraUpdatedReport = true;
				}

				if (CalcEngine.reportNew) {
					CalcEngine.reportNew = false;

					report = CalcEngine.report;

					// Same as viewport but without the z factor
					cellSizePx = Math.max(1, report.canvasWidth / gameMapGrid.sideLength);

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

					if (cameraMode === true) {
						data = GamingCanvasGridRaycast(camera.r, camera.x, camera.y, cellSizePx, gameMapGrid);
					} else {
						data = GamingCanvasGridRaycast(characterPosition.r, characterPosition.x, characterPosition.y, cellSizePx, gameMapGrid);
					}

					cells = <Set<number>>data.cells;
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

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CAMERA,
									data: {
										camera: cameraEncoded,
										cells: Array.from(cells),
										rays: rays,
									},
								},
							],
							[cameraEncoded.buffer],
						);
					}
				} else {
					if (characterPositionUpdatedReport === true) {
						characterPositionUpdatedReport = false;

						characterPositionEncoded = CharacterPositionEncode(CalcEngine.characterPosition);

						CalcEngine.post(
							[
								{
									cmd: CalcBusOutputCmd.CALCULATIONS,
									data: {
										cells: Array.from(cells),
										characterPosition: characterPositionEncoded,
										rays: rays,
									},
								},
							],
							[characterPositionEncoded.buffer],
						);
					}
				}
			}
		};
		CalcEngine.go = go;
	}
}
