import { Input } from './modules/input';
import { CalcBus } from './workers/calc/calc.bus';
import { CalcBusOutputDataStats } from './workers/calc/calc.model';
import { FPS, Resolution } from './model';
import { GamingCanvas, GamingCanvasResolutionScaleType } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus';
import { VideoEditorBusOutputDataStats } from './workers/video-editor/video-editor.model';
import { VideoMainBus } from './workers/video-main/video-main.bus';
import { VideoMainBusOutputDataStats } from './workers/video-main/video-main.model';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein extends Input {
	private static initializeGamingCanvas(): void {
		Blockenstein.elCanvases = GamingCanvas.initialize(Blockenstein.elVideo, {
			canvasCount: 2,
			resolutionWidthPx: Blockenstein.settingResolution,
			resolutionScaleType: GamingCanvasResolutionScaleType.PIXELATED,
		});
	}

	private static initializeSettings(): void {
		/**
		 * Non-worker specific
		 */
		Blockenstein.settingDebug = false;
		Blockenstein.settingFPSDisplay = true;
		Blockenstein.settingResolution = null;

		/**
		 * Worker specific
		 */
		Blockenstein.settingsCalc = {
			fps: FPS._60,
		};

		Blockenstein.settingsVideoEditor = {
			fps: Blockenstein.settingsCalc.fps,
		};

		Blockenstein.settingsVideoMain = {
			fps: Blockenstein.settingsCalc.fps,
		};

		/**
		 * URL Param
		 */
		const params: URLSearchParams = new URLSearchParams(document.location.search);
		for (let [name, value] of params.entries()) {
			switch (name.toLowerCase()) {
				case 'debug':
					Blockenstein.settingDebug = String(value).toLowerCase() === 'true';
					break;
				case 'fps':
					Blockenstein.settingFPSDisplay = String(value).toLowerCase() === 'true';
					break;
				case 'res':
					if (String(value).toLowerCase() === 'null') {
						Blockenstein.settingResolution = null;
					} else {
						switch (Number(value)) {
							case 160:
							case 320:
							case 640:
							case 1280:
							case 1920:
							case 2560:
								Blockenstein.settingResolution = <Resolution>Number(value);
								break;
						}
					}
					break;
			}
		}
	}

	private static initializeWorkerCallbacks(): void {
		/**
		 * Calc
		 */
		CalcBus.setCallbackStats((stats: CalcBusOutputDataStats) => {});

		/**
		 * Video: Editor
		 */
		VideoEditorBus.setCallbackStats((stats: VideoEditorBusOutputDataStats) => {});

		/**
		 * Video: Main
		 */
		VideoMainBus.setCallbackStats((stats: VideoMainBusOutputDataStats) => {});
	}

	private static initializeWorkers(): Promise<void> {
		let then: number = performance.now();

		return new Promise<void>((resolve: any) => {
			CalcBus.initialize(Blockenstein.settingsCalc, () => {
				// Done
				console.log('CalcEngine Loaded in', performance.now() - then, 'ms');

				// Load video-editor
				then = performance.now();
				VideoEditorBus.initialize(GamingCanvas.getCanvases()[1], Blockenstein.settingsVideoEditor, () => {
					// Done
					console.log('VideoEditorEngine Loaded in', performance.now() - then, 'ms');

					// Load video-main
					then = performance.now();
					VideoMainBus.initialize(GamingCanvas.getCanvases()[0], Blockenstein.settingsVideoMain, () => {
						// Done
						console.log('VideoMainEngine Loaded in', performance.now() - then, 'ms');

						// Resolve initial promise
						resolve();
					});
				});
			});
		});
	}

	public static async main(): Promise<void> {
		const then: number = performance.now();

		/**
		 * DOM
		 */
		Blockenstein.initializeDom();

		/**
		 * Settings: Intialize
		 */
		Blockenstein.initializeSettings();

		/**
		 * GamingCanvas
		 */
		Blockenstein.initializeGamingCanvas();

		/**
		 * WebWorkers
		 */
		Blockenstein.initializeWorkerCallbacks();
		await Blockenstein.initializeWorkers();

		/**
		 * Settings: Apply
		 */
		Blockenstein.settingsApply();

		// Done
		console.log('System Loaded in', performance.now() - then, 'ms');
	}

	private static settingsApply(): void {
		/**
		 * DOM
		 */

		/**
		 * Algos
		 */
		GamingCanvas.setDebug(Blockenstein.settingDebug);
	}
}
Blockenstein.main();
