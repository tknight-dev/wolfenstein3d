import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { GameGridCellMaskAndValues, GameMap } from '../../models/game.model.js';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCalculations,
	VideoEditorBusInputDataInit,
	VideoEditorBusInputDataSettings,
	VideoEditorBusInputPayload,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputPayload,
} from './video-editor.model.js';
import { Character } from '../../models/character.model.js';
import { GamingCanvasGridCamera, GamingCanvasGridICamera, GamingCanvasGridUint16Array, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoEditorBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoEditorBusInputCmd.CALCULATIONS:
			VideoEditorEngine.inputCalculations(<VideoEditorBusInputDataCalculations>payload.data);
			break;
		case VideoEditorBusInputCmd.DATA_SEGMENT:
			VideoEditorEngine.inputDataSegment(<Map<number, number>>payload.data);
			break;
		case VideoEditorBusInputCmd.INIT:
			VideoEditorEngine.initialize(<VideoEditorBusInputDataInit>payload.data);
			break;
		case VideoEditorBusInputCmd.REPORT:
			VideoEditorEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoEditorBusInputCmd.SETTINGS:
			VideoEditorEngine.inputSettings(<VideoEditorBusInputDataSettings>payload.data);
			break;
	}
};

enum CacheId {
	FLOOR = GameGridCellMaskAndValues.NULL_VALUE_NOT | GameGridCellMaskAndValues.FLOOR_VALUE,
	WALL = GameGridCellMaskAndValues.NULL_VALUE_NOT | GameGridCellMaskAndValues.WALL_VALUE,
}

class VideoEditorEngine {
	private static calculations: VideoEditorBusInputDataCalculations;
	private static calculationsNew: boolean;
	private static characterPlayer1: Character;
	private static characterPlayer2: Character;
	private static gameMap: GameMap;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settings: VideoEditorBusInputDataSettings;
	private static settingsNew: boolean;

	public static initialize(data: VideoEditorBusInputDataInit): void {
		// Config
		VideoEditorEngine.gameMap = data.gameMap;
		VideoEditorEngine.gameMap.grid = GamingCanvasGridUint16Array.from(data.gameMap.grid.data);

		// Config: Canvas
		VideoEditorEngine.offscreenCanvas = data.offscreenCanvas;
		VideoEditorEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Camera and Viewport
		VideoEditorEngine.inputCalculations(data);

		// Config: Character
		VideoEditorEngine.characterPlayer1 = {
			camera: new GamingCanvasGridCamera(data.gameMap.cameraRIntial, data.gameMap.gridStartX + 0.5, data.gameMap.gridStartY + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			health: 100,
			id: 0,
			npc: false,
			player1: true,
			size: 0.25,
			timestamp: 0,
			timestampPrevious: 0,
		};
		VideoEditorEngine.characterPlayer2 = {
			camera: new GamingCanvasGridCamera(data.gameMap.cameraRIntial, data.gameMap.gridStartX + 0.5, data.gameMap.gridStartY + 0.5, 1),
			cameraPrevious: <GamingCanvasGridICamera>{},
			health: VideoEditorEngine.characterPlayer1.health,
			id: 1,
			npc: false,
			player1: false,
			size: VideoEditorEngine.characterPlayer1.size,
			timestamp: VideoEditorEngine.characterPlayer1.timestamp,
			timestampPrevious: VideoEditorEngine.characterPlayer1.timestampPrevious,
		};

		// Config: Report
		VideoEditorEngine.inputReport(data.report);

		// Config: Settings
		VideoEditorEngine.inputSettings(data as VideoEditorBusInputDataSettings);

		// Start
		if (VideoEditorEngine.offscreenCanvasContext === null) {
			console.error('VideoEditorEngine: failed acquire context');
			VideoEditorEngine.post([
				{
					cmd: VideoEditorBusOutputCmd.INIT_COMPLETE,
					data: false,
				},
			]);
		} else {
			VideoEditorEngine.post([
				{
					cmd: VideoEditorBusOutputCmd.INIT_COMPLETE,
					data: true,
				},
			]);

			// Start rendering thread
			VideoEditorEngine.go__funcForward();
			VideoEditorEngine.request = requestAnimationFrame(VideoEditorEngine.go);
		}
	}

	/*
	 * Input
	 */

	public static inputCalculations(data: VideoEditorBusInputDataCalculations): void {
		VideoEditorEngine.calculations = data;

		// Last
		VideoEditorEngine.calculationsNew = true;
	}

	public static inputDataSegment(data: Map<number, number>): void {
		let index: number, value: number;

		for ([index, value] of data) {
			VideoEditorEngine.gameMap.grid.data[index] = value;
		}
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoEditorEngine.report = report;

		// Last
		VideoEditorEngine.reportNew = true;
	}

	public static inputSettings(data: VideoEditorBusInputDataSettings): void {
		VideoEditorEngine.settings = data;

		// Last
		VideoEditorEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: VideoEditorBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let calculationsCamera: GamingCanvasGridCamera = GamingCanvasGridCamera.from(VideoEditorEngine.calculations.camera),
			calculationsGameMode: boolean,
			calculationsRayOriginXPx: number,
			calculationsRayOriginYPx: number,
			calculationsRays: Float32Array,
			calculationsViewport: GamingCanvasGridViewport = GamingCanvasGridViewport.from(VideoEditorEngine.calculations.viewport),
			calculationsViewportCellSizePx: number,
			calculationsViewportHeightStart: number,
			calculationsViewportHeightStartEff: number,
			calculationsViewportHeightStartPx: number,
			calculationsViewportHeightStopEff: number,
			calculationsViewportWidthStart: number,
			calculationsViewportWidthStartEff: number,
			calculationsViewportWidthStartPx: number,
			calculationsViewportWidthStopEff: number,
			cacheCanvas: Map<number, OffscreenCanvas> = new Map(),
			cacheCanvasContextOptionsNoAlpha = {
				alpha: false,
				antialias: false,
				depth: true,
				desynchronized: true,
				powerPreference: 'high-performance',
				preserveDrawingBuffer: true,
			},
			cacheCanvasInstance: OffscreenCanvas,
			cacheCanvasGrid: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>cacheCanvasGrid.getContext('2d', {
				...cacheCanvasContextOptionsNoAlpha,
				alpha: true,
			}),
			cacheCanvasGridH: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridHContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>(
				cacheCanvasGridH.getContext('2d', cacheCanvasContextOptionsNoAlpha)
			),
			cacheCanvasGridV: OffscreenCanvas = new OffscreenCanvas(1, 1),
			cacheCanvasGridVContext: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>(
				cacheCanvasGridV.getContext('2d', cacheCanvasContextOptionsNoAlpha)
			),
			cacheCanvasContext: Map<number, OffscreenCanvasRenderingContext2D> = new Map(),
			cacheCanvasContextInstance: OffscreenCanvasRenderingContext2D,
			cacheId: CacheId,
			characterPlayer1: Character = VideoEditorEngine.characterPlayer1,
			characterPlayer1XEff: number,
			characterPlayer1YEff: number,
			characterPlayer2: Character = VideoEditorEngine.characterPlayer2,
			characterPlayer2XEff: number,
			characterPlayer2YEff: number,
			gameMapGrid: GamingCanvasGridUint16Array = VideoEditorEngine.gameMap.grid,
			gameMapGridData: Uint16Array = VideoEditorEngine.gameMap.grid.data,
			gameMapGridSideLength: number = VideoEditorEngine.gameMap.grid.sideLength,
			i: number,
			offscreenCanvas: OffscreenCanvas = VideoEditorEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoEditorEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = 0,
			offscreenCanvasHeightPxEff: number = 0,
			offscreenCanvasWidthPx: number = 0,
			offscreenCanvasWidthPxEff: number = 0,
			frameCount: number = 0,
			pi2: number = Math.PI * 2,
			report: GamingCanvasReport = VideoEditorEngine.report,
			settingsFPMS: number = 1000 / VideoEditorEngine.settings.fps,
			settingsPlayer2Enabled: boolean = VideoEditorEngine.settings.player2Enable,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			value: number,
			x: number,
			y: number;

		// Warm cache
		for (const v of Object.values(CacheId)) {
			if (typeof v === 'number') {
				cacheCanvas.set(v, new OffscreenCanvas(1, 1));
				cacheCanvasContext.set(
					v,
					(<OffscreenCanvas>cacheCanvas.get(v)).getContext('2d', {
						alpha: true,
						antialias: false,
						depth: true,
						desynchronized: true,
						powerPreference: 'high-performance',
					}) as OffscreenCanvasRenderingContext2D,
				);
			}
		}

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoEditorEngine.request = requestAnimationFrame(VideoEditorEngine.go);

			// Main code
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > settingsFPMS) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % settingsFPMS);
				frameCount++;

				if (VideoEditorEngine.calculationsNew === true || VideoEditorEngine.reportNew === true || VideoEditorEngine.settingsNew === true) {
					VideoEditorEngine.reportNew = false;
					VideoEditorEngine.settingsNew = false;

					// Calculations
					if (VideoEditorEngine.calculationsNew === true) {
						VideoEditorEngine.calculationsNew = false;

						calculationsCamera.decode(VideoEditorEngine.calculations.camera);
						calculationsGameMode = VideoEditorEngine.calculations.gameMode;
						calculationsViewport.decode(VideoEditorEngine.calculations.viewport);

						if (VideoEditorEngine.calculations.player1Camera !== undefined) {
							(<GamingCanvasGridCamera>characterPlayer1.camera).decode(VideoEditorEngine.calculations.player1Camera);
						}
						if (VideoEditorEngine.calculations.player2Camera !== undefined) {
							(<GamingCanvasGridCamera>characterPlayer2.camera).decode(VideoEditorEngine.calculations.player2Camera);
						}
						if (VideoEditorEngine.calculations.rays !== undefined) {
							calculationsRays = VideoEditorEngine.calculations.rays;
						}

						// if (calculationsGameMode === true) {
						// 	characterPlayer1.camera.r = calculationsCamera.r;
						// 	characterPlayer1.camera.x = calculationsCamera.x;
						// 	characterPlayer1.camera.y = calculationsCamera.y;
						// }

						calculationsViewportCellSizePx = calculationsViewport.cellSizePx;
						calculationsViewportHeightStart = calculationsViewport.heightStart;
						calculationsViewportHeightStartPx = calculationsViewport.heightStartPx;
						calculationsViewportWidthStart = calculationsViewport.widthStart;
						calculationsViewportWidthStartPx = calculationsViewport.widthStartPx;

						characterPlayer1XEff = characterPlayer1.camera.x - calculationsViewportWidthStart;
						characterPlayer1YEff = characterPlayer1.camera.y - calculationsViewportHeightStart;
						characterPlayer2XEff = characterPlayer2.camera.x - calculationsViewportWidthStart;
						characterPlayer2YEff = characterPlayer2.camera.y - calculationsViewportHeightStart;
						calculationsRayOriginXPx = (calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx;
						calculationsRayOriginYPx = (calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx;
					}

					// Report
					report = VideoEditorEngine.report;
					if (offscreenCanvasHeightPx !== report.canvasHeight || offscreenCanvasWidthPx !== report.canvasWidth) {
						offscreenCanvasHeightPx = report.canvasHeight;
						offscreenCanvasWidthPx = report.canvasWidth;

						offscreenCanvas.height = offscreenCanvasHeightPx;
						offscreenCanvas.width = offscreenCanvasWidthPx;
					}

					// Settings
					settingsFPMS = 1000 / VideoEditorEngine.settings.fps;
					settingsPlayer2Enabled = VideoEditorEngine.settings.player2Enable;

					// Cache
					for ([cacheId, cacheCanvasInstance] of cacheCanvas) {
						cacheCanvasInstance.height = calculationsViewportCellSizePx;
						cacheCanvasInstance.width = calculationsViewportCellSizePx;
					}
					for ([cacheId, cacheCanvasContextInstance] of cacheCanvasContext) {
						cacheCanvasContextInstance.fillStyle = cacheId === CacheId.FLOOR ? 'rgb(255,255,255)' : 'rgb(128,128,128)';
						cacheCanvasContextInstance.fillRect(0, 0, calculationsViewportCellSizePx, calculationsViewportCellSizePx);
					}

					// Grid: Cache
					offscreenCanvasHeightPxEff = offscreenCanvasHeightPx + calculationsViewportCellSizePx * 2;
					offscreenCanvasWidthPxEff = offscreenCanvasWidthPx + calculationsViewportCellSizePx * 2;

					cacheCanvasGridH.height = 1;
					cacheCanvasGridH.width = offscreenCanvasWidthPxEff;
					cacheCanvasGridHContext.fillStyle = 'rgba(255,255,255,0.25)';
					cacheCanvasGridHContext.fillRect(0, 0, offscreenCanvasWidthPxEff, 1);

					cacheCanvasGridV.height = offscreenCanvasHeightPxEff;
					cacheCanvasGridV.width = 1;
					cacheCanvasGridVContext.fillStyle = cacheCanvasGridHContext.fillStyle;
					cacheCanvasGridVContext.fillRect(0, 0, 1, offscreenCanvasHeightPxEff);

					cacheCanvasGrid.height = offscreenCanvasHeightPxEff;
					cacheCanvasGrid.width = offscreenCanvasWidthPxEff;

					// Grid: Horizontal
					for (y = 0; y < offscreenCanvasHeightPxEff; y += calculationsViewportCellSizePx) {
						cacheCanvasGridContext.drawImage(cacheCanvasGridH, 0, y);
					}
					// Grid: Vertical
					for (x = 0; x < offscreenCanvasWidthPxEff; x += calculationsViewportCellSizePx) {
						cacheCanvasGridContext.drawImage(cacheCanvasGridV, x, 0);
					}
				}

				// Draw: Config
				// statDrawAvg.watchStart();
				calculationsViewportHeightStartEff = calculationsViewportHeightStart - 1;
				calculationsViewportHeightStopEff = calculationsViewport.heightStop + 1;
				calculationsViewportWidthStartEff = calculationsViewportWidthStart - 1;
				calculationsViewportWidthStopEff = calculationsViewport.widthStop;

				// console.log(calculationsViewportWidthStartEff, calculationsViewportWidthStopEff);

				// Draw: Clear
				offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

				// Draw: Cells
				for ([i, value] of gameMapGridData.entries()) {
					x = (i / gameMapGridSideLength) | 0;

					// if (i === 0) {
					// 	console.log(i, x, calculationsViewportWidthStartEff, calculationsViewportWidthStopEff, value, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);
					// }
					// console.log(i, x, x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff);

					if (x > calculationsViewportWidthStartEff && x < calculationsViewportWidthStopEff) {
						y = i % gameMapGridSideLength;

						if (y > calculationsViewportHeightStartEff && y < calculationsViewportHeightStopEff) {
							// if (i === 0) {
							// 	console.log(i, x, y, (x - viewport.widthStart) * cellSizePx, (y - viewport.heightStart - 1) * cellSizePx);
							// }

							if ((value & GameGridCellMaskAndValues.NULL_MASK) === GameGridCellMaskAndValues.NULL_VALUE_NOT) {
								cacheId = (value & GameGridCellMaskAndValues.WALL_MASK) === GameGridCellMaskAndValues.WALL_VALUE ? CacheId.WALL : CacheId.FLOOR;

								offscreenCanvasContext.drawImage(
									<OffscreenCanvas>cacheCanvas.get(cacheId),
									(x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
									(y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
								);
							}
						}
					}
				}

				// Draw: Grid
				offscreenCanvasContext.drawImage(
					cacheCanvasGrid,
					-(calculationsViewportWidthStartPx % calculationsViewportCellSizePx) - calculationsViewportCellSizePx,
					-(calculationsViewportHeightStartPx % calculationsViewportCellSizePx) - calculationsViewportCellSizePx,
				);

				// Draw: Cells
				// if (cells !== undefined) {
				// 	for (i = 0; i < cells.length; i++) {
				// 		x = (cells[i] / gameMapGridSideLength) | 0;
				// 		y = cells[i] % gameMapGridSideLength;

				// 		offscreenCanvasContext.fillStyle = 'rgb(192, 192, 192)';
				// 		offscreenCanvasContext.fillRect(
				// 			cellSizePx * (x - viewport.widthStart),
				// 			cellSizePx * (y - viewport.heightStart),
				// 			cellSizePx,
				// 			cellSizePx,
				// 		);
				// 	}
				// }

				// Draw: Rays
				// if (calculationsRays !== undefined) {
				// 	offscreenCanvasContext.lineWidth = 2;
				// 	for (i = 0; i < calculationsRays.length; i += 4) {
				// 		offscreenCanvasContext.strokeStyle = 'yellow';
				// 		offscreenCanvasContext.beginPath();
				// 		offscreenCanvasContext.moveTo(calculationsRayOriginXPx, calculationsRayOriginYPx); // Origin
				// 		offscreenCanvasContext.lineTo(
				// 			calculationsViewportCellSizePx * (calculationsRays[i] - calculationsViewportWidthStart),
				// 			calculationsViewportCellSizePx * (calculationsRays[i + 1] - calculationsViewportHeightStart),
				// 		);
				// 		offscreenCanvasContext.closePath();
				// 		offscreenCanvasContext.stroke();
				// 	}
				// }

				// Draw: Player1 Direction
				offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 3;
				offscreenCanvasContext.strokeStyle = 'blue';
				offscreenCanvasContext.beginPath();
				offscreenCanvasContext.moveTo(characterPlayer1XEff * calculationsViewportCellSizePx, characterPlayer1YEff * calculationsViewportCellSizePx); // Center
				offscreenCanvasContext.lineTo(
					calculationsViewportCellSizePx * (Math.sin(characterPlayer1.camera.r) + characterPlayer1XEff),
					calculationsViewportCellSizePx * (Math.cos(characterPlayer1.camera.r) + characterPlayer1YEff),
				);
				offscreenCanvasContext.closePath();
				offscreenCanvasContext.stroke();

				// Draw: Player2 Position
				offscreenCanvasContext.fillStyle = 'red';
				offscreenCanvasContext.beginPath();
				offscreenCanvasContext.arc(
					characterPlayer1XEff * calculationsViewportCellSizePx,
					characterPlayer1YEff * calculationsViewportCellSizePx,
					calculationsViewportCellSizePx / 4,
					0,
					pi2,
				);
				offscreenCanvasContext.closePath();
				offscreenCanvasContext.fill();

				if (settingsPlayer2Enabled === true) {
					// Draw: Player2 Direction
					offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 3;
					offscreenCanvasContext.strokeStyle = 'green';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.moveTo(characterPlayer2XEff * calculationsViewportCellSizePx, characterPlayer2YEff * calculationsViewportCellSizePx); // Center
					offscreenCanvasContext.lineTo(
						calculationsViewportCellSizePx * (Math.sin(characterPlayer2.camera.r) + characterPlayer2XEff),
						calculationsViewportCellSizePx * (Math.cos(characterPlayer2.camera.r) + characterPlayer2YEff),
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.stroke();

					// Draw: Player2 Position
					offscreenCanvasContext.fillStyle = 'red';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.arc(
						characterPlayer2XEff * calculationsViewportCellSizePx,
						characterPlayer2YEff * calculationsViewportCellSizePx,
						calculationsViewportCellSizePx / 4,
						0,
						pi2,
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.fill();
				}

				// Draw camera dot
				if (calculationsGameMode !== true) {
					// Direction
					offscreenCanvasContext.lineWidth = calculationsViewportCellSizePx / 5;
					offscreenCanvasContext.strokeStyle = 'magenta';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.moveTo(
						(calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
						(calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
					); // Center
					offscreenCanvasContext.lineTo(
						calculationsViewportCellSizePx * (Math.sin(calculationsCamera.r) + (calculationsCamera.x - calculationsViewportWidthStart)),
						calculationsViewportCellSizePx * (Math.cos(calculationsCamera.r) + (calculationsCamera.y - calculationsViewportHeightStart)),
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.stroke();

					// Position
					offscreenCanvasContext.fillStyle = 'magenta';
					offscreenCanvasContext.beginPath();
					offscreenCanvasContext.arc(
						(calculationsCamera.x - calculationsViewportWidthStart) * calculationsViewportCellSizePx,
						(calculationsCamera.y - calculationsViewportHeightStart) * calculationsViewportCellSizePx,
						calculationsViewportCellSizePx / 4,
						0,
						pi2,
					);
					offscreenCanvasContext.closePath();
					offscreenCanvasContext.fill();
				}

				// statDrawAvg.watchStop();
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				// Output
				VideoEditorEngine.post([
					{
						cmd: VideoEditorBusOutputCmd.STATS,
						data: {
							fps: frameCount,
						},
					},
				]);
				frameCount = 0;
			}
		};
		VideoEditorEngine.go = go;
	}
}
