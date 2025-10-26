import { GamingCanvas, GamingCanvasConstPI_0_500, GamingCanvasRenderStyle, GamingCanvasReport, GamingCanvasUtilTimers } from '@tknight-dev/gaming-canvas';
import {
	VideoOverlayBusInputCmd,
	VideoOverlayBusInputDataInit,
	VideoOverlayBusInputDataSettings,
	VideoOverlayBusInputPayload,
	VideoOverlayBusOutputCmd,
	VideoOverlayBusOutputPayload,
} from './video-overlay.model.js';
import { GamingCanvasOrientation } from '@tknight-dev/gaming-canvas';
import {
	CalcMainBusOutputDataActionTag,
	CalcMainBusPlayerDeadFadeDurationInMS,
	CalcMainBusPlayerDeadFallDurationInMS,
	CalcMainBusPlayerHitDurationInMS,
} from '../calc-main/calc-main.model.js';
import { GameGridCellMasksAndValues } from '../../models/game.model.js';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: VideoOverlayBusInputPayload = event.data;

	switch (payload.cmd) {
		case VideoOverlayBusInputCmd.ACTION_TAG:
			VideoOverlayEngine.inputActionTag(<CalcMainBusOutputDataActionTag>payload.data);
			break;
		case VideoOverlayBusInputCmd.GAME_OVER:
			VideoOverlayEngine.inputGameOver();
			break;
		case VideoOverlayBusInputCmd.INIT:
			VideoOverlayEngine.initialize(<VideoOverlayBusInputDataInit>payload.data);
			break;
		case VideoOverlayBusInputCmd.LOCKED:
			VideoOverlayEngine.inputLocked(<number[]>payload.data);
			break;
		case VideoOverlayBusInputCmd.PAUSE:
			VideoOverlayEngine.inputPause(<boolean>payload.data);
			break;
		case VideoOverlayBusInputCmd.PLAYER_DEAD:
			VideoOverlayEngine.inputPlayerDead();
			break;
		case VideoOverlayBusInputCmd.PLAYER_HIT:
			VideoOverlayEngine.inputPlayerHit(<number>payload.data);
			break;
		case VideoOverlayBusInputCmd.REPORT:
			VideoOverlayEngine.inputReport(<GamingCanvasReport>payload.data);
			break;
		case VideoOverlayBusInputCmd.RESET:
			VideoOverlayEngine.inputReset();
			break;
		case VideoOverlayBusInputCmd.SETTINGS:
			VideoOverlayEngine.inputSettings(<VideoOverlayBusInputDataSettings>payload.data);
			break;
	}
};

class VideoOverlayEngine {
	private static dead: boolean;
	private static deadTimestamp: number;
	private static gameover: boolean;
	private static hitGradientsByTimerId: Map<number, CanvasGradient> = new Map();
	private static hitsByTimerId: Map<number, number> = new Map();
	private static locked: number[];
	private static lockedNew: boolean;
	private static offscreenCanvas: OffscreenCanvas;
	private static offscreenCanvasContext: OffscreenCanvasRenderingContext2D;
	private static player1: boolean;
	private static pause: boolean = true;
	private static pauseTimestampUnix: number = Date.now();
	private static report: GamingCanvasReport;
	private static reportNew: boolean;
	private static request: number;
	private static reset: boolean;
	private static settings: VideoOverlayBusInputDataSettings;
	private static settingsNew: boolean;
	private static tagRunAndJump: boolean;
	private static tagRunAndJumpOptions: any;
	private static timers: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();

	public static async initialize(data: VideoOverlayBusInputDataInit): Promise<void> {
		// Config: Canvas
		VideoOverlayEngine.offscreenCanvas = data.offscreenCanvas;
		VideoOverlayEngine.offscreenCanvasContext = data.offscreenCanvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;

		// Config: Report
		VideoOverlayEngine.inputReport(data.report);

		// Config: Settings
		VideoOverlayEngine.inputSettings(data as VideoOverlayBusInputDataSettings);
		VideoOverlayEngine.player1 = data.player1;

		// Start
		if (VideoOverlayEngine.offscreenCanvasContext === null) {
			VideoOverlayEngine.post([
				{
					cmd: VideoOverlayBusOutputCmd.INIT_COMPLETE,
					data: false,
				},
			]);
		} else {
			VideoOverlayEngine.post([
				{
					cmd: VideoOverlayBusOutputCmd.INIT_COMPLETE,
					data: true,
				},
			]);

			// Start rendering thread
			VideoOverlayEngine.go__funcForward();
			VideoOverlayEngine.request = requestAnimationFrame(VideoOverlayEngine.go);
		}
	}

	/*
	 * Input
	 */

	public static inputActionTag(data: CalcMainBusOutputDataActionTag): void {
		if (data.type === GameGridCellMasksAndValues.TAG_RUN_AND_JUMP) {
			VideoOverlayEngine.tagRunAndJump = true;
			VideoOverlayEngine.tagRunAndJumpOptions = data.options;
		}
	}

	public static inputGameOver(): void {
		VideoOverlayEngine.dead = true;
		VideoOverlayEngine.gameover = true;
	}

	public static inputLocked(locked: number[]): void {
		VideoOverlayEngine.locked = locked;
		VideoOverlayEngine.lockedNew = true;
	}

	public static inputPause(state: boolean): void {
		VideoOverlayEngine.pause = state;
	}

	public static inputPlayerDead(): void {
		VideoOverlayEngine.deadTimestamp = performance.now();
		VideoOverlayEngine.dead = true;

		VideoOverlayEngine.timers.clearAll();
		VideoOverlayEngine.hitsByTimerId.clear();
		VideoOverlayEngine.hitGradientsByTimerId.clear();

		VideoOverlayEngine.timers.add(() => {
			if (VideoOverlayEngine.gameover !== true) {
				VideoOverlayEngine.dead = false; // Respawn
			}
		}, CalcMainBusPlayerDeadFadeDurationInMS + CalcMainBusPlayerDeadFallDurationInMS);
	}

	public static inputPlayerHit(angle: number): void {
		if (VideoOverlayEngine.dead === true || VideoOverlayEngine.gameover === true) {
			return;
		}

		VideoOverlayEngine.hitsByTimerId.set(
			VideoOverlayEngine.timers.add((_durationInMS: number, id: number) => {
				VideoOverlayEngine.hitsByTimerId.delete(id);
				VideoOverlayEngine.hitGradientsByTimerId.delete(id);
			}, CalcMainBusPlayerHitDurationInMS),
			angle,
		);
	}

	public static inputReport(report: GamingCanvasReport): void {
		VideoOverlayEngine.report = report;
		VideoOverlayEngine.reportNew = true;
	}

	public static inputReset(): void {
		VideoOverlayEngine.reset = true;
	}

	public static inputSettings(data: VideoOverlayBusInputDataSettings): void {
		VideoOverlayEngine.settings = data;
		VideoOverlayEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: VideoOverlayBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let offscreenCanvas: OffscreenCanvas = VideoOverlayEngine.offscreenCanvas,
			offscreenCanvasContext: OffscreenCanvasRenderingContext2D = VideoOverlayEngine.offscreenCanvasContext,
			offscreenCanvasHeightPx: number = VideoOverlayEngine.report.canvasHeightSplit,
			offscreenCanvasHeightPxHalf: number = (offscreenCanvasHeightPx / 2) | 0,
			offscreenCanvasWidthPx: number = VideoOverlayEngine.report.canvasWidthSplit,
			offscreenCanvasWidthPxHalf: number = (offscreenCanvasWidthPx / 2) | 0,
			frameCount: number = 0,
			fpms: number = 1000 / 30, // Fixed 30fps
			hitAngle: number,
			hitGradientsByTimerId: Map<number, CanvasGradient> = VideoOverlayEngine.hitGradientsByTimerId,
			hitsByTimerId: Map<number, number> = VideoOverlayEngine.hitsByTimerId,
			player1: boolean = VideoOverlayEngine.player1,
			pause: boolean = VideoOverlayEngine.pause,
			renderDead: boolean = VideoOverlayEngine.dead,
			renderDeadFadeOut: boolean,
			renderDeadFall: boolean,
			renderDeadTimestamp: number,
			renderFilter: string,
			renderFilterNone: string = 'none',
			renderGameOver: boolean = VideoOverlayEngine.gameover,
			renderGradient: CanvasGradient,
			renderGrayscale: boolean,
			renderGrayscaleFilter: string = 'grayscale(1)',
			renderLocked: number[],
			renderLockedDelta: number,
			renderLockedTimestampUnix: number,
			tagRunAndJump: boolean,
			tagRunAndJumpOptions: any,
			timerId: number,
			timers: GamingCanvasUtilTimers = VideoOverlayEngine.timers,
			timestampDelta: number,
			timestampFPS: number = 0,
			timestampThen: number = 0,
			timestampUnix: number,
			timestampUnixPause: number,
			timestampUnixPauseDelta: number,
			x: number,
			y: number;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			VideoOverlayEngine.request = requestAnimationFrame(VideoOverlayEngine.go);
			timestampNow = timestampNow | 0;

			// Timing
			timestampDelta = timestampNow - timestampThen;

			if (timestampDelta !== 0) {
				timestampUnix = Date.now();

				if (VideoOverlayEngine.pause !== pause) {
					pause = VideoOverlayEngine.pause;

					timestampUnixPause = Date.now();
					timestampUnixPauseDelta = timestampUnixPause - VideoOverlayEngine.pauseTimestampUnix;

					if (pause !== true) {
						timers.clockUpdate(timestampNow);

						if (renderDead === true) {
							VideoOverlayEngine.deadTimestamp += timestampUnixPauseDelta;
							renderDeadTimestamp += timestampUnixPauseDelta;
						}
					}

					VideoOverlayEngine.pauseTimestampUnix = timestampUnixPause;
				}
				if (pause !== true) {
					timers.tick(timestampNow);
				}
			}

			// Main code
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);
				frameCount++;

				/*
				 * Modifiers
				 */

				if (VideoOverlayEngine.dead !== renderDead) {
					renderDead = VideoOverlayEngine.dead;

					if (renderDead === true) {
						renderDeadFadeOut = false;
						renderDeadFall = true;
						renderDeadTimestamp = VideoOverlayEngine.deadTimestamp;
					}
				}

				if (VideoOverlayEngine.gameover !== renderGameOver) {
					renderGameOver = VideoOverlayEngine.gameover;

					if (renderGameOver === true) {
						renderDeadFadeOut = false;
						renderDeadFall = true;
						renderDeadTimestamp = timestampNow;
					}
				}

				if (VideoOverlayEngine.lockedNew === true) {
					VideoOverlayEngine.lockedNew = false;

					renderLocked = VideoOverlayEngine.locked;
					renderLockedTimestampUnix = timestampUnix;
				}

				if (VideoOverlayEngine.reportNew === true || VideoOverlayEngine.settingsNew === true) {
					// Settings
					renderGrayscale = VideoOverlayEngine.settings.grayscale;

					// Report
					if (VideoOverlayEngine.settings.player2Enable === true) {
						offscreenCanvasHeightPx = VideoOverlayEngine.report.canvasHeightSplit;
						offscreenCanvasWidthPx = VideoOverlayEngine.report.canvasWidthSplit;
					} else if (player1 === true) {
						offscreenCanvasHeightPx = VideoOverlayEngine.report.canvasHeight;
						offscreenCanvasWidthPx = VideoOverlayEngine.report.canvasWidth;
					} else {
						offscreenCanvasHeightPx = 1;
						offscreenCanvasWidthPx = 1;
					}

					offscreenCanvasHeightPxHalf = (offscreenCanvasHeightPx / 2) | 0;
					offscreenCanvasWidthPxHalf = (offscreenCanvasWidthPx / 2) | 0;

					offscreenCanvas.height = offscreenCanvasHeightPx;
					offscreenCanvas.width = offscreenCanvasWidthPx;

					if (VideoOverlayEngine.settings.antialias === true) {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.ANTIALIAS);
					} else {
						GamingCanvas.renderStyle(offscreenCanvasContext, GamingCanvasRenderStyle.PIXELATED);
					}
				}

				// Background cache
				if (VideoOverlayEngine.reportNew === true || VideoOverlayEngine.settingsNew) {
					VideoOverlayEngine.reportNew = false;
					VideoOverlayEngine.settingsNew = false;
				}

				if (VideoOverlayEngine.reset === true) {
					VideoOverlayEngine.reset = false;

					VideoOverlayEngine.dead = false;
					VideoOverlayEngine.gameover = false;
					VideoOverlayEngine.timers.clearAll();
					VideoOverlayEngine.hitsByTimerId.clear();
					VideoOverlayEngine.hitGradientsByTimerId.clear();
					VideoOverlayEngine.tagRunAndJump = false;

					renderDead = false;
					renderGameOver = false;
					tagRunAndJump = false;
				}

				if (VideoOverlayEngine.tagRunAndJump !== tagRunAndJump) {
					tagRunAndJump = VideoOverlayEngine.tagRunAndJump;
					tagRunAndJumpOptions = VideoOverlayEngine.tagRunAndJumpOptions;
				}

				/*
				 * Render
				 */

				// Render: Lighting
				if (renderGrayscale === true) {
					renderFilter = renderGrayscaleFilter;
				} else {
					renderFilter = renderFilterNone;
				}
				offscreenCanvasContext.filter = renderFilter;

				if (tagRunAndJump === true) {
					offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
					return;
				}

				if (pause !== true) {
					if (renderDead === true || renderGameOver === true) {
						// Death
						if (renderDeadFadeOut === false || renderGameOver === true) {
							if (timestampNow - renderDeadTimestamp < CalcMainBusPlayerDeadFallDurationInMS / 2) {
								offscreenCanvasContext.fillStyle = 'rgba(225,0,0, 0.01)'; // bright red
							} else {
								offscreenCanvasContext.fillStyle = 'rgba(125,0,0, 0.075)'; // dark red
							}
							for (x = 0; x < offscreenCanvasWidthPx; x += offscreenCanvasWidthPx / 64) {
								for (y = 0; y < offscreenCanvasHeightPx; y += offscreenCanvasWidthPx / 64) {
									if (Math.random() < 0.5) {
										offscreenCanvasContext.fillRect(x, y, offscreenCanvasWidthPx / 64, offscreenCanvasWidthPx / 64);
									}
								}
							}

							if (renderDeadFall === true && timestampNow - renderDeadTimestamp > CalcMainBusPlayerDeadFallDurationInMS) {
								renderDeadFall = false;
								renderDeadTimestamp = timestampNow;
							}

							if (renderDeadFall === false) {
								if (timestampNow - renderDeadTimestamp < CalcMainBusPlayerDeadFadeDurationInMS / 2) {
									offscreenCanvasContext.fillStyle = `rgba(0,0,0,.1)`;
									offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
								} else {
									renderDeadFadeOut = true;
									renderDeadTimestamp = timestampNow;
								}
							}

							offscreenCanvasContext.fillStyle = 'white';
							if (VideoOverlayEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 15}px serif`;
							} else {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 6}px serif`;
							}
							offscreenCanvasContext.textAlign = 'center';

							if (renderGameOver === true) {
								offscreenCanvasContext.fillText('Game Over', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 2);
							} else {
								offscreenCanvasContext.fillText('You Died', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 2.5);
							}
						} else {
							offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

							offscreenCanvasContext.fillStyle = `rgba(0,0,0,${1 - (timestampNow - renderDeadTimestamp) / (CalcMainBusPlayerDeadFadeDurationInMS / 2)})`;
							offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
						}
					} else {
						offscreenCanvasContext.clearRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);

						// Hit
						for ([timerId, hitAngle] of hitsByTimerId.entries()) {
							// Gradient
							renderGradient = <CanvasGradient>hitGradientsByTimerId.get(timerId);
							if (renderGradient === undefined) {
								renderGradient = offscreenCanvasContext.createLinearGradient(
									offscreenCanvasWidthPxHalf,
									offscreenCanvasHeightPxHalf,
									offscreenCanvasWidthPxHalf - offscreenCanvasWidthPx * 0.875 * Math.cos(hitAngle - GamingCanvasConstPI_0_500),
									offscreenCanvasHeightPxHalf - offscreenCanvasHeightPx * -Math.sin(hitAngle - GamingCanvasConstPI_0_500),
								);

								renderGradient.addColorStop(0, 'transparent');
								renderGradient.addColorStop(0.25, 'transparent');
								renderGradient.addColorStop(0.75, '#e10000'); // bright red
								// renderGradient.addColorStop(0.875, '#bd0000'); // medium red
								renderGradient.addColorStop(1, '#7d0000'); // dark red

								hitGradientsByTimerId.set(timerId, renderGradient);
							}

							// Render
							offscreenCanvasContext.globalAlpha = (timers.getTimeRemaining(timerId) || 0) / CalcMainBusPlayerHitDurationInMS;
							offscreenCanvasContext.fillStyle = renderGradient;
							offscreenCanvasContext.fillRect(0, 0, offscreenCanvasWidthPx, offscreenCanvasHeightPx);
						}
						offscreenCanvasContext.globalAlpha = 1;

						// Key Required
						renderLockedDelta = timestampUnix - renderLockedTimestampUnix;
						if (renderLockedDelta < 3000) {
							if (renderLockedDelta < 1000) {
								offscreenCanvasContext.globalAlpha = renderLockedDelta / 1000;
							} else if (renderLockedDelta > 2000) {
								offscreenCanvasContext.globalAlpha = (3000 - renderLockedDelta) / 1000;
							} else {
								offscreenCanvasContext.globalAlpha = 1;
							}

							offscreenCanvasContext.fillStyle = 'white';
							if (VideoOverlayEngine.report.orientation === GamingCanvasOrientation.LANDSCAPE) {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 15}px serif`;
							} else {
								offscreenCanvasContext.font = `${offscreenCanvasWidthPx / 6}px serif`;
							}
							offscreenCanvasContext.textAlign = 'center';

							offscreenCanvasContext.fillText(
								`Key ${renderLocked[0]}${renderLocked.length === 2 ? ' and ' + renderLocked[1] : ''}`,
								offscreenCanvasWidthPx / 2,
								offscreenCanvasHeightPx / 5,
							);
							offscreenCanvasContext.fillText('Required', offscreenCanvasWidthPx / 2, offscreenCanvasHeightPx / 3);

							offscreenCanvasContext.globalAlpha = 1;
						}
					}
				}
			}

			// Stats: sent once per second
			if (timestampNow - timestampFPS > 999) {
				timestampFPS = timestampNow;

				// Output
				VideoOverlayEngine.post([
					{
						cmd: VideoOverlayBusOutputCmd.STATS,
						data: {
							fps: frameCount,
						},
					},
				]);
				frameCount = 0;
			}
		};
		VideoOverlayEngine.go = go;
	}
}
