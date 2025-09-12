import { CalcBus } from './workers/calc/calc.bus.js';
import { CalcBusOutputDataStats } from './workers/calc/calc.model.js';
import { Assets } from './modules/assets.js';
import { DOM } from './modules/dom.js';
import { Settings } from './modules/settings.js';
import { Game } from './modules/game.js';
import { GameMap } from './models/game.model.js';
import { GamingCanvas, GamingCanvasAudioType, GamingCanvasResolutionScaleType, GamingCanvasStat } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus.js';
import { VideoEditorBusOutputDataStats } from './workers/video-editor/video-editor.model.js';
import { VideoMainBus } from './workers/video-main/video-main.bus.js';
import { VideoMainBusOutputDataStats } from './workers/video-main/video-main.model.js';
import { GamingCanvasGridCamera, GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';
import { AssetIdAudio, initializeAssetManager } from './asset-manager.js';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein {
	private static statFPS: { [key: string]: number } = {};

	private static initializeGamingCanvas(): void {
		DOM.elCanvases = GamingCanvas.initialize(DOM.elVideo, {
			audioEnable: true,
			canvasCount: 2,
			canvasSplit: [1],
			canvasSplitLandscapeVertical: true,
			dpiSupportEnable: Game.settingGraphicsDPISupport,
			elementInteractive: DOM.elVideoInteractive,
			elementInjectAsOverlay: [DOM.elEdit],
			inputGamepadEnable: true,
			inputKeyboardEnable: true,
			inputMouseEnable: true,
			orientationCanvasRotateEnable: false,
			resolutionWidthPx: Game.settingGraphicsResolution,
			resolutionScaleType: GamingCanvasResolutionScaleType.PIXELATED,
		});

		GamingCanvas.audioLoad(Assets.dataAudio);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolume, GamingCanvasAudioType.ALL);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeEffect, GamingCanvasAudioType.EFFECT);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeMusic, GamingCanvasAudioType.MUSIC);
	}

	private static initializeWorkerCallbacks(): void {
		/**
		 * Calc
		 */

		/**
		 * GamingCanvas
		 */

		/**
		 * Video: Editor
		 */
		VideoEditorBus.setCallbackStats((stats: VideoEditorBusOutputDataStats) => {
			Blockenstein.statFPS['video-editor'] = stats.fps;
			Blockenstein.displayStatFPS();
		});

		/**
		 * Video: Main
		 */
		VideoMainBus.setCallbackStats((player1: boolean, stats: VideoMainBusOutputDataStats) => {
			Blockenstein.statFPS['video-main-player' + (player1 === true ? '1' : '2')] = stats.fps;
			Blockenstein.displayStatFPS();
		});
	}

	private static displayStatFPS(): void {
		let value: number = Infinity;

		for (let fps of Object.values(Blockenstein.statFPS)) {
			value = Math.min(value, fps);
		}

		DOM.elStatFPS.innerText = String(value);
		if (value < Game.settingsVideoMain.fps * 0.8) {
			DOM.elStatFPS.style.color = 'red';
		} else if (value < Game.settingsVideoMain.fps * 0.9) {
			DOM.elStatFPS.style.color = 'yellow';
		} else {
			DOM.elStatFPS.style.color = 'green';
		}
	}

	private static initializeWorkers(): Promise<void> {
		let gameMap: GameMap = Game.map,
			then: number = performance.now(),
			viewport: GamingCanvasGridViewport = Game.viewport;

		return new Promise<void>((resolve: any) => {
			CalcBus.initialize(Game.settingsCalc, gameMap, () => {
				// Done
				console.log('CalcEngine Loaded in', performance.now() - then, 'ms');

				// Load video-editor
				then = performance.now();
				VideoEditorBus.initialize(GamingCanvas.getCanvases()[2], gameMap, Game.settingsVideoEditor, viewport, () => {
					// Done
					console.log('VideoEditorEngine Loaded in', performance.now() - then, 'ms');

					// Load video-main
					then = performance.now();
					VideoMainBus.initialize(GamingCanvas.getCanvases()[0], GamingCanvas.getCanvases()[1], gameMap, Game.settingsVideoMain, () => {
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
		DOM.initialize();

		/**
		 * Assets: Initialize
		 */
		await initializeAssetManager();
		await Assets.initializeAssets();

		/**
		 * DOM: part 2
		 */
		DOM.initializeDomEditMenu();
		Game.initializeDomInteractive();

		/**
		 * Settings: Intialize
		 */
		Settings.initialize();

		/**
		 * GamingCanvas
		 */
		Blockenstein.initializeGamingCanvas();

		/**
		 * Game
		 */
		Game.initialize();

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
		// Game.viewEditor();
		Game.viewGame();
		console.log('System Loaded in', performance.now() - then, 'ms');

		// Start the music!!
		// let bufferId: number | null = await GamingCanvas.audioControlPlay(AssetIdAudio.AUDIO_MUSIC_MENU, false, true, -1, 0, 0);
		// if (bufferId !== null) {
		// 	GamingCanvas.audioControlPan(bufferId, 1, 5000, (bufferId: number) => {
		// 		GamingCanvas.audioControlPan(bufferId, 0, 5000);
		// 	});
		// 	GamingCanvas.audioControlVolume(bufferId, 1, 5000);
		// }
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
