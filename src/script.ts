import { CalcBus } from './workers/calc/calc.bus';
import { CalcBusOutputDataStats } from './workers/calc/calc.model';
import { DOM } from './modules/dom';
import { Game } from './modules/game';
import { Camera } from './models/camera.model';
import { GameMap } from './models/game.model';
import { FPS, Resolution } from './models/settings.model';
import { Viewport } from './models/viewport.model';
import { GamingCanvas, GamingCanvasReport, GamingCanvasResolutionScaleType } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus';
import { VideoEditorBusOutputDataStats } from './workers/video-editor/video-editor.model';
import { VideoMainBus } from './workers/video-main/video-main.bus';
import { VideoMainBusOutputDataStats } from './workers/video-main/video-main.model';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein {
	private static initializeGamingCanvas(): void {
		DOM.elCanvases = GamingCanvas.initialize(DOM.elVideo, {
			canvasCount: 2,
			dpiSupportEnable: Game.settingDPISupport,
			// elementInteractive: DOM.elVideoInteractive,
			elementInjectAsOverlay: [DOM.elEdit],
			inputKeyboardEnable: true,
			inputMouseEnable: true,
			inputTouchEnable: true,
			orientationCanvasRotateEnable: false,
			resolutionWidthPx: Game.settingResolution,
			resolutionScaleType: GamingCanvasResolutionScaleType.PIXELATED,
		});

		// TODO: AUDIO
		// TODO: AUDIO
		// TODO: AUDIO
		// TODO: AUDIO
	}

	private static initializeSettings(): void {
		/**
		 * Non-worker specific
		 */
		Game.settingDebug = false; // def: false
		Game.settingDPISupport = false; // def: false
		Game.settingFPSDisplay = true; // def: true
		// Game.settingResolution = GamingCanvas.isMobileOrTablet() ? 320 : 640; // def: 320 for mobile/table & 640 for the rest
		Game.settingResolution = null;

		/**
		 * Worker specific
		 */
		Game.settingsCalc = {
			fov: (60 * Math.PI) / 180, // 60 deg
			fps: FPS._60,
		};

		Game.settingsVideoEditor = {
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
		};

		Game.settingsVideoMain = {
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
		};

		/**
		 * URL Param
		 */
		const params: URLSearchParams = new URLSearchParams(document.location.search);
		for (let [name, value] of params.entries()) {
			switch (name.toLowerCase()) {
				case 'debug':
					Game.settingDebug = String(value).toLowerCase() === 'true';
					break;
				case 'dpi':
					Game.settingDPISupport = String(value).toLowerCase() === 'true';
					break;
				case 'fps':
					Game.settingFPSDisplay = String(value).toLowerCase() === 'true';
					break;
				case 'res':
					if (String(value).toLowerCase() === 'null') {
						Game.settingResolution = null;
					} else {
						switch (Number(value)) {
							case 160:
							case 320:
							case 640:
							case 1280:
							case 1920:
							case 2560:
								Game.settingResolution = <Resolution>Number(value);
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
		CalcBus.setCallbackCamera(() => {});
		CalcBus.setCallbackCalculations(() => {});
		CalcBus.setCallbackStats((stats: CalcBusOutputDataStats) => {});

		/**
		 * GamingCanvas
		 */

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
		let camera: Camera = Game.camera,
			gameMap: GameMap = <GameMap>Game.dataMaps.get(0),
			then: number = performance.now(),
			viewport: Viewport = Game.viewport;

		// Camera to viewport
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		return new Promise<void>((resolve: any) => {
			CalcBus.initialize(camera, Game.settingsCalc, gameMap, () => {
				// Done
				console.log('CalcEngine Loaded in', performance.now() - then, 'ms');

				// Load video-editor
				then = performance.now();
				VideoEditorBus.initialize(camera, GamingCanvas.getCanvases()[1], gameMap, Game.settingsVideoEditor, viewport, () => {
					// Done
					console.log('VideoEditorEngine Loaded in', performance.now() - then, 'ms');

					// Load video-main
					then = performance.now();
					VideoMainBus.initialize(camera, GamingCanvas.getCanvases()[0], gameMap, Game.settingsVideoMain, () => {
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
		DOM.initializeDom();
		Game.initializeDomInteractive();

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
		Game.initializeGame();
		// Game.viewEditor();
		Game.viewGame();
		console.log('System Loaded in', performance.now() - then, 'ms');
	}

	private static settingsApply(): void {
		/**
		 * DOM
		 */

		/**
		 * Algos
		 */
		GamingCanvas.setDebug(Game.settingDebug);
	}
}
Blockenstein.main();
