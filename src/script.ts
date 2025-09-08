import { AssetId, assetLoaderAudio } from './asset-manager.js';
import { CalcBus } from './workers/calc/calc.bus.js';
import { CalcBusOutputDataStats } from './workers/calc/calc.model.js';
import { DOM } from './modules/dom.js';
import { Game } from './modules/game.js';
import { GameMap } from './models/game.model.js';
import { FPS, LightingQuality, RaycastQuality, Resolution } from './models/settings.model.js';
import { GamingCanvas, GamingCanvasConstPI, GamingCanvasResolutionScaleType } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus.js';
import { VideoEditorBusOutputDataStats } from './workers/video-editor/video-editor.model.js';
import { VideoMainBus } from './workers/video-main/video-main.bus.js';
import { VideoMainBusOutputDataStats } from './workers/video-main/video-main.model.js';
import { GamingCanvasGridCamera, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein {
	private static async initializeAssets(): Promise<void> {
		const assets: Map<AssetId, string> = await assetLoaderAudio();

		// Audio
		GamingCanvas.audioLoad(assets);

		// setTimeout(() => {
		// 	GamingCanvas.audioControlPlay(AssetId.AUDIO_MUSIC_MENU);
		// }, 500);
	}

	private static initializeGamingCanvas(): void {
		DOM.elCanvases = GamingCanvas.initialize(DOM.elVideo, {
			audioEnable: true,
			canvasCount: 2,
			canvasSplit: [1],
			canvasSplitLandscapeVertical: true,
			dpiSupportEnable: Game.settingDPISupport,
			// elementInteractive: DOM.elVideoInteractive,
			elementInjectAsOverlay: [DOM.elEdit],
			inputGamepadEnable: true,
			inputKeyboardEnable: true,
			inputMouseEnable: true,
			orientationCanvasRotateEnable: false,
			resolutionWidthPx: Game.settingResolution,
			resolutionScaleType: GamingCanvasResolutionScaleType.PIXELATED,
		});
	}

	private static initializeSettings(): void {
		/**
		 * Non-worker specific
		 */
		Game.settingDebug = false; // def: false
		Game.settingDPISupport = false; // def: false
		Game.settingFPSDisplay = true; // def: true
		Game.settingPlayer1Keyboard = true; // def: true, false is gamepad (player 2 is the inverse)
		// Game.settingResolution = GamingCanvas.isMobileOrTablet() ? 320 : 640; // def: 320 for mobile/table & 640 for the rest
		Game.settingResolution = 640;

		/**
		 * Worker specific
		 */
		Game.settingsCalc = {
			fov: (60 * GamingCanvasConstPI) / 180, // 60 deg
			fps: FPS._60,
			player2Enable: false,
			raycastQuality: RaycastQuality.FULL,
		};

		Game.settingsVideoEditor = {
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
			player2Enable: Game.settingsCalc.player2Enable,
		};

		Game.settingsVideoMain = {
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
			gamma: 1, // 0 - 1 (def) - 2
			grayscale: false,
			lightingQuality: LightingQuality.NONE,
			player2Enable: Game.settingsCalc.player2Enable,
			raycastQuality: Game.settingsCalc.raycastQuality,
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
		VideoMainBus.setCallbackStats((player1: boolean, stats: VideoMainBusOutputDataStats) => {});
	}

	private static initializeWorkers(): Promise<void> {
		let camera: GamingCanvasGridCamera = Game.camera,
			gameMap: GameMap = <GameMap>Game.dataMaps.get(0),
			then: number = performance.now(),
			viewport: GamingCanvasGridViewport = Game.viewport;

		// Camera to viewport
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		return new Promise<void>((resolve: any) => {
			CalcBus.initialize(Game.settingsCalc, gameMap, () => {
				// Done
				console.log('CalcEngine Loaded in', performance.now() - then, 'ms');

				// Load video-editor
				then = performance.now();
				VideoEditorBus.initialize(camera, GamingCanvas.getCanvases()[2], gameMap, Game.settingsVideoEditor, viewport, () => {
					// Done
					console.log('VideoEditorEngine Loaded in', performance.now() - then, 'ms');

					// Load video-main
					then = performance.now();
					VideoMainBus.initialize(camera, GamingCanvas.getCanvases()[0], GamingCanvas.getCanvases()[1], gameMap, Game.settingsVideoMain, () => {
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
		 * Assets: Initialize
		 */
		await Blockenstein.initializeAssets();

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
