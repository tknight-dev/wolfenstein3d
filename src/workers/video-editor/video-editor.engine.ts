import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { Camera, CameraDecode } from '../../models/camera.model';
import { GameMap, GameMapCellMasks } from '../../models/game.model';
import { Viewport } from '../../models/viewport.model';
import {
	VideoEditorBusInputCmd,
	VideoEditorBusInputDataCameraAndViewport,
	VideoEditorBusInputDataInit,
	VideoEditorBusInputDataSettings,
	VideoEditorBusInputPayload,
	VideoEditorBusOutputCmd,
	VideoEditorBusOutputPayload,
} from './video-editor.model';
import { CharacterPosition, CharacterPositionDecode } from '../../models/character.model';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoEditorBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoEditorBusInputCmd.CAMERA_VIEWPORT:
			VideoEditorEngine.inputCameraAndViewport(<VideoEditorBusInputDataCameraAndViewport>payload.data);
			break;
		case VideoEditorBusInputCmd.CHARACTER_POSITION:
			VideoEditorEngine.inputCharacterPosition(<Float32Array>payload.data);
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
	FLOOR,
	WALL,
}

class VideoEditorEngine {
	private static cameraRaw: Float32Array;
	private static characterPositionRaw: Float32Array;
	private static characterPositionNew: boolean;
	private static gameMap: GameMap;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static settingsFPMS: number;
	private static settingsNew: boolean;
	private static viewportRaw: Float32Array;
	private static viewportNew: boolean;

	public static initialize(data: VideoEditorBusInputDataInit): void {
		// Config
		VideoEditorEngine.gameMap = data.gameMap;

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
		VideoEditorEngine.inputCameraAndViewport(data as VideoEditorBusInputDataCameraAndViewport);

		// Config: Character Position
		VideoEditorEngine.inputCharacterPosition(data.characterPosition);

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

	public static inputCharacterPosition(data: Float32Array): void {
		VideoEditorEngine.characterPositionRaw = data;

		VideoEditorEngine.characterPositionNew = true;
	}

	public static inputDataSegment(data: Map<number, number>): void {
		let index: number, value: number;

		for ([index, value] of data) {
			VideoEditorEngine.gameMap.data[index] = value;
		}
	}

	public static inputCameraAndViewport(data: VideoEditorBusInputDataCameraAndViewport): void {
		VideoEditorEngine.cameraRaw = data.camera;
		VideoEditorEngine.viewportRaw = data.viewport;

		// Last
		VideoEditorEngine.viewportNew = true;
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoEditorEngine.report = report;

		// Last
		VideoEditorEngine.reportNew = true;
	}

	public static inputSettings(data: VideoEditorBusInputDataSettings): void {
		VideoEditorEngine.settingsFPMS = 1000 / data.fps;

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
		let camera: Camera,
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
			cellSizePx: number = 0,
			characterPosition: CharacterPosition,
			characterPositionXEff: number,
			characterPositionYEff: number,
			gameData: Uint8Array = VideoEditorEngine.gameMap.data,
			gameDataWidth: number = VideoEditorEngine.gameMap.dataWidth,
			fpms: number = VideoEditorEngine.settingsFPMS,
			i: number,
			offscreenCanvas: OffscreenCanvas = VideoEditorEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoEditorEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = 0,
			offscreenCanvasHeightPxEff: number = 0,
			offscreenCanvasWidthPx: number = 0,
			offscreenCanvasWidthPxEff: number = 0,
			frameCount: number = 0,
			report: GamingCanvasReport = VideoEditorEngine.report,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			value: number,
			viewport: Viewport = new Viewport(),
			viewportIncrement: number = -1,
			viewPortHeightStartCEff: number,
			viewPortHeightStopCEff: number,
			viewPortWidthStartCEff: number,
			viewPortWidthStopCEff: number,
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
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);
				frameCount++;

				if (VideoEditorEngine.characterPositionNew === true) {
					VideoEditorEngine.characterPositionNew = false;

					characterPosition = CharacterPositionDecode(VideoEditorEngine.characterPositionRaw);

					characterPositionXEff = characterPosition.x - viewport.widthStartC;
					characterPositionYEff = characterPosition.y - viewport.heightStartC;
				}

				if (VideoEditorEngine.reportNew === true || VideoEditorEngine.settingsNew === true || VideoEditorEngine.viewportNew === true) {
					VideoEditorEngine.reportNew = false;
					VideoEditorEngine.settingsNew = false;

					// Settings
					gameData = VideoEditorEngine.gameMap.data;
					fpms = VideoEditorEngine.settingsFPMS;

					// Report
					report = VideoEditorEngine.report;
					if (offscreenCanvasHeightPx !== report.canvasHeight || offscreenCanvasWidthPx !== report.canvasWidth) {
						offscreenCanvasHeightPx = report.canvasHeight;
						offscreenCanvasWidthPx = report.canvasWidth;

						offscreenCanvas.height = offscreenCanvasHeightPx;
						offscreenCanvas.width = offscreenCanvasWidthPx;
					}

					// Camera and Viewport
					if (VideoEditorEngine.viewportNew === true) {
						VideoEditorEngine.viewportNew = false;

						camera = CameraDecode(VideoEditorEngine.cameraRaw);
						viewport.decode(VideoEditorEngine.viewportRaw);

						characterPositionXEff = characterPosition.x - viewport.widthStartC;
						characterPositionYEff = characterPosition.y - viewport.heightStartC;
					}

					// Calc & Cache
					cellSizePx = viewport.cellSizePx;
					viewportIncrement = viewport.increment;

					// Cache
					for ([cacheId, cacheCanvasInstance] of cacheCanvas) {
						cacheCanvasInstance.height = cellSizePx;
						cacheCanvasInstance.width = cellSizePx;
					}
					for ([cacheId, cacheCanvasContextInstance] of cacheCanvasContext) {
						cacheCanvasContextInstance.fillStyle = cacheId === CacheId.FLOOR ? 'rgb(255,255,255)' : 'rgb(128,128,128)';
						cacheCanvasContextInstance.fillRect(0, 0, cellSizePx, cellSizePx);
					}

					// Grid: Cache
					offscreenCanvasHeightPxEff = offscreenCanvasHeightPx + cellSizePx * 2;
					offscreenCanvasWidthPxEff = offscreenCanvasWidthPx + cellSizePx * 2;

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
					for (y = 0; y < offscreenCanvasHeightPxEff; y += cellSizePx) {
						cacheCanvasGridContext.drawImage(cacheCanvasGridH, 0, y);
					}
					// Grid: Vertical
					for (x = 0; x < offscreenCanvasWidthPxEff; x += cellSizePx) {
						cacheCanvasGridContext.drawImage(cacheCanvasGridV, x, 0);
					}
				}

				// Draw: Config
				// statDrawAvg.watchStart();
				viewPortHeightStartCEff = viewport.heightStartC - 1;
				viewPortHeightStopCEff = viewport.heightStopC + 1;
				viewPortWidthStartCEff = viewport.widthStartC - 1;
				viewPortWidthStopCEff = viewport.widthStopC;

				// console.log(viewPortWidthStartCEff, viewPortWidthStopCEff);

				// Draw
				offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

				for ([i, value] of gameData.entries()) {
					cacheId = (value & GameMapCellMasks.TYPE_WALL) !== 0 ? CacheId.WALL : CacheId.FLOOR;

					x = (i / gameDataWidth) | 0;
					if (x > viewPortWidthStartCEff && x < viewPortWidthStopCEff) {
						y = i % gameDataWidth;

						if (y > viewPortHeightStartCEff && y < viewPortHeightStopCEff) {
							// if (i === 0) {
							// 	console.log(i, x, y, (x - viewport.widthStartC) * cellSizePx, (y - viewport.heightStartC - 1) * cellSizePx);
							// }

							offscreenCanvasContext.drawImage(
								<OffscreenCanvas>cacheCanvas.get(cacheId),
								(x - viewport.widthStartC) * cellSizePx,
								(y - viewport.heightStartC) * cellSizePx,
							);
						}
					}
				}

				// Draw: Grid
				offscreenCanvasContext.drawImage(
					cacheCanvasGrid,
					-(viewport.widthStartPx % cellSizePx) - cellSizePx,
					-(viewport.heightStartPx % cellSizePx) - cellSizePx,
				);

				// Character
				offscreenCanvasContext.lineWidth = viewport.cellSizePx / 3;
				offscreenCanvasContext.strokeStyle = 'blue';
				offscreenCanvasContext.beginPath();
				offscreenCanvasContext.moveTo(characterPositionXEff * cellSizePx, characterPositionYEff * cellSizePx); // Center
				offscreenCanvasContext.lineTo(
					cellSizePx * (Math.sin(characterPosition.rRad) + characterPositionXEff),
					cellSizePx * (Math.cos(characterPosition.rRad) + characterPositionYEff),
				);
				offscreenCanvasContext.closePath();
				offscreenCanvasContext.stroke();

				offscreenCanvasContext.fillStyle = 'red';
				offscreenCanvasContext.beginPath();
				offscreenCanvasContext.arc(characterPositionXEff * cellSizePx, characterPositionYEff * cellSizePx, cellSizePx / 4, 0, 2 * Math.PI);
				offscreenCanvasContext.closePath();
				offscreenCanvasContext.fill();

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
