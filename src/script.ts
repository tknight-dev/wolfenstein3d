import { CalcMainBus } from './workers/calc-main/calc-main.bus.js';
import { CalcPathBus } from './workers/calc-path/calc-path.bus.js';
import { Assets } from './modules/assets.js';
import { DOM } from './modules/dom.js';
import { Settings } from './modules/settings.js';
import { Game } from './modules/game.js';
import { GameMap } from './models/game.model.js';
import { GamingCanvas, GamingCanvasAudioType, GamingCanvasStat, GamingCanvasStatCalcType } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus.js';
import { VideoEditorBusOutputDataStats } from './workers/video-editor/video-editor.model.js';
import { VideoMainBus } from './workers/video-main/video-main.bus.js';
import { VideoMainBusOutputDataStats } from './workers/video-main/video-main.model.js';
import { GamingCanvasGridViewport } from '@tknight-dev/gaming-canvas/grid';
import { AssetIdAudio, AssetPropertiesAudio, assetsAudio, initializeAssetManager } from './asset-manager.js';
import { VideoOverlayBus } from './workers/video-overlay/video-overlay.bus.js';
import { VideoOverlayBusOutputDataStats } from './workers/video-overlay/video-overlay.model.js';
import { CalcPathBusOutputDataStats } from './workers/calc-path/calc-path.model.js';
import { CalcMainBusOutputDataStats } from './workers/calc-main/calc-main.model.js';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein {
	private static statFPS: { [key: string]: number } = {};

	private static initializeGamingCanvas(): void {
		DOM.elCanvases = GamingCanvas.initialize(DOM.elVideo, Game.settingsGamingCanvas);

		GamingCanvas.audioLoad(Assets.dataAudio);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolume, GamingCanvasAudioType.ALL);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeEffect, GamingCanvasAudioType.EFFECT);
		GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeMusic, GamingCanvasAudioType.MUSIC);
	}

	private static initializeStatCallbacks(): void {
		const displayNumber = Blockenstein.displayNumber,
			displayNumberAll = Blockenstein.displayNumberAll,
			precision: number = 2;

		/**
		 * Calc: Main
		 */
		CalcMainBus.setCallbackStats((stats: CalcMainBusOutputDataStats) => {
			const all: GamingCanvasStat = GamingCanvasStat.decode(stats.all),
				audio: GamingCanvasStat = GamingCanvasStat.decode(stats.audio);

			DOM.elPerformanceCalcMainAll.innerHTML = displayNumberAll(all, precision);
			DOM.elPerformanceCalcMainAudio.innerHTML = displayNumber(<number>GamingCanvasStat.calc(audio), precision, 'avg');
			DOM.elPerformanceCalcMainCPS.innerText = String(stats.cps);
		});

		/**
		 * Calc: Path
		 */
		CalcPathBus.setCallbackStats((stats: CalcPathBusOutputDataStats) => {
			const all: GamingCanvasStat = GamingCanvasStat.decode(stats.all),
				path: GamingCanvasStat = GamingCanvasStat.decode(stats.path);

			DOM.elPerformanceCalcPathAll.innerHTML = displayNumberAll(all, precision);
			DOM.elPerformanceCalcPathIndividual.innerHTML = `Count ${String(stats.pathCount).padStart(3, '#').replaceAll('#', '&nbsp;')}<br>${displayNumberAll(path, precision)}`;
		});

		/**
		 * Video: Editor
		 */
		VideoEditorBus.setCallbackStats((stats: VideoEditorBusOutputDataStats) => {
			const all: GamingCanvasStat = GamingCanvasStat.decode(stats.all),
				cells: GamingCanvasStat = GamingCanvasStat.decode(stats.cells),
				cv: GamingCanvasStat = GamingCanvasStat.decode(stats.cv);

			Blockenstein.statFPS['video-editor'] = stats.fps;
			Blockenstein.displayStatFPS(DOM.elStatFPS);

			DOM.elPerformanceVideoEditorAll.innerHTML = displayNumberAll(all, precision);
			DOM.elPerformanceVideoEditorCells.innerHTML = displayNumber(<number>GamingCanvasStat.calc(cells), precision, 'avg');
			DOM.elPerformanceVideoEditorCV.innerHTML = displayNumberAll(cv, precision);
			Blockenstein.displayStatFPS(DOM.elPerformanceVideoEditorFPS, stats.fps);
		});

		/**
		 * Video: Main
		 */
		VideoMainBus.setCallbackStats((player1: boolean, stats: VideoMainBusOutputDataStats) => {
			const all: GamingCanvasStat = GamingCanvasStat.decode(stats.all),
				cv: GamingCanvasStat = GamingCanvasStat.decode(stats.c_v),
				ray: GamingCanvasStat = GamingCanvasStat.decode(stats.ray),
				sprite: GamingCanvasStat = GamingCanvasStat.decode(stats.sprite);

			Blockenstein.statFPS['video-main-player' + (player1 === true ? '1' : '2')] = stats.fps;
			Blockenstein.displayStatFPS(DOM.elStatFPS);

			if (player1 === true) {
				DOM.elPerformanceVideoPlayer1All.innerHTML = displayNumberAll(all, precision);
				DOM.elPerformanceVideoPlayer1CV.innerHTML = displayNumberAll(cv, precision);
				Blockenstein.displayStatFPS(DOM.elPerformanceVideoPlayer1FPS, stats.fps);
				DOM.elPerformanceVideoPlayer1Ray.innerHTML = `Count ${String(stats.countRays).padStart(3, '#').replaceAll('#', '&nbsp;')}<br>${displayNumberAll(ray, precision)}`;
				DOM.elPerformanceVideoPlayer1Sprite.innerHTML = `Count ${String(stats.countSprites).padStart(3, '#').replaceAll('#', '&nbsp;')}<br>${displayNumberAll(sprite, precision)}`;
			} else {
				DOM.elPerformanceVideoPlayer2All.innerHTML = displayNumberAll(all, precision);
				DOM.elPerformanceVideoPlayer2CV.innerHTML = displayNumberAll(cv, precision);
				Blockenstein.displayStatFPS(DOM.elPerformanceVideoPlayer2FPS, stats.fps);
				DOM.elPerformanceVideoPlayer2Ray.innerHTML = `Count ${String(stats.countRays).padStart(3, '#').replaceAll('#', '&nbsp;')}<br>${displayNumberAll(ray, precision)}`;
				DOM.elPerformanceVideoPlayer2Sprite.innerHTML = `Count ${String(stats.countSprites).padStart(3, '#').replaceAll('#', '&nbsp;')}<br>${displayNumberAll(sprite, precision)}`;
			}
		});

		/**
		 * Video: Overlay
		 */
		VideoOverlayBus.setCallbackStats((player1: boolean, stats: VideoOverlayBusOutputDataStats) => {});
	}

	private static displayNumber(value: number, precision: number, prefix: string, postfix: string = 'ms'): string {
		return prefix.padStart(3, '#').replaceAll('#', '&nbsp;') + ' ' + value.toFixed(precision).padStart(8, '#').replaceAll('#', '&nbsp;') + postfix;
	}

	private static displayNumberAll(stat: GamingCanvasStat, precision: number): string {
		const displayNumber = Blockenstein.displayNumber;
		return `${displayNumber(<number>GamingCanvasStat.calc(stat, GamingCanvasStatCalcType.MAX), precision, 'max')}<br>
${displayNumber(<number>GamingCanvasStat.calc(stat), precision, 'avg')}<br>
${displayNumber(<number>GamingCanvasStat.calc(stat, GamingCanvasStatCalcType.STD_DEV), precision, 'σ')}<br>
${displayNumber(<number>GamingCanvasStat.calc(stat, GamingCanvasStatCalcType.MIN), precision, 'min')}`;
	}

	private static displayStatFPS(element: HTMLElement, value: number = Infinity, hardLimit?: boolean): void {
		if (value === Infinity) {
			let fps: number;
			for (fps of Object.values(Blockenstein.statFPS)) {
				value = Math.min(value, fps);
			}
		}

		element.innerText = String(value);
		if (hardLimit === true) {
			if (value < Game.settingsVideoMain.fps) {
				element.style.color = 'red';
			} else {
				element.style.color = 'green';
			}
		} else {
			if (value < Game.settingsVideoMain.fps * 0.8) {
				element.style.color = 'red';
			} else if (value < Game.settingsVideoMain.fps * 0.9) {
				element.style.color = 'yellow';
			} else {
				element.style.color = 'green';
			}
		}
	}

	private static initializeWorkers(): Promise<void> {
		let then: number = performance.now(),
			viewport: GamingCanvasGridViewport = Game.viewport;

		return new Promise<void>((resolve: any) => {
			CalcMainBus.initialize(Game.settingsCalcMain, () => {
				// Done
				console.log('CalcMainEngine Loaded in', (performance.now() - then) | 0, 'ms');

				// Load video-editor
				then = performance.now();
				CalcPathBus.initialize(Game.settingsCalcPath, () => {
					// Done
					console.log('CalcPathEngine Loaded in', (performance.now() - then) | 0, 'ms');

					// Load video-main
					then = performance.now();
					VideoEditorBus.initialize(GamingCanvas.getCanvases()[4], Game.settingsVideoEditor, viewport, () => {
						// Done
						console.log('VideoEditorEngine Loaded in', (performance.now() - then) | 0, 'ms');

						// Load video-main
						then = performance.now();
						VideoMainBus.initialize(GamingCanvas.getCanvases()[0], GamingCanvas.getCanvases()[1], Game.settingsVideoMain, () => {
							// Done
							console.log('VideoMainEngine Loaded in', (performance.now() - then) | 0, 'ms');

							// Load video-overlay
							then = performance.now();
							VideoOverlayBus.initialize(GamingCanvas.getCanvases()[2], GamingCanvas.getCanvases()[3], Game.settingsVideoOverlay, () => {
								// Done
								console.log('VideoOverlayEngine Loaded in', (performance.now() - then) | 0, 'ms');

								// Resolve initial promise
								resolve();
							});
						});
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

		DOM.spinner(true);

		setTimeout(async () => {
			/**
			 * Assets: Initialize Menu
			 */
			await initializeAssetManager();
			await Assets.initializeAssetsMenu();
			DOM.initializeScreens();
			DOM.screenControl(DOM.elScreenStats);

			/**
			 * Assets: Initialize
			 */
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
			Blockenstein.initializeStatCallbacks();
			await Blockenstein.initializeWorkers();

			/**
			 * Settings: Apply
			 */
			Blockenstein.settingsApply();

			// Loading complete
			console.log('System Loaded in', (performance.now() - then) | 0, 'ms');

			// Start the game!
			let suspend: boolean = false,
				state: number = 0;
			let click = async () => {
				if (suspend === true) {
					return;
				}
				suspend = true;

				switch (state) {
					case 0:
						// play music
						Game.musicInstance = await GamingCanvas.audioControlPlay(AssetIdAudio.AUDIO_MUSIC_MENU, GamingCanvasAudioType.MUSIC, true, -1, 0, 0);
						if (Game.musicInstance !== null) {
							GamingCanvas.audioControlPan(Game.musicInstance, 1, 5000, (instance: number) => {
								GamingCanvas.audioControlPan(instance, 0, 5000);
							});
							GamingCanvas.audioControlVolume(
								Game.musicInstance,
								(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_MENU)).volume || 1,
								5000,
							);
						}

						if (Game.settingIntro === true) {
							DOM.screenControl(DOM.elScreenRating);
						} else {
							// Game.viewEditor();
							Game.viewGame();
							// Game.viewPerformance();

							DOM.elIconsTop.classList.remove('intro');
							DOM.elScreenActive.style.display = 'none';
							Game.inputSuspend = false;
							document.removeEventListener('click', click, true);
							document.removeEventListener('keydown', click, true);

							Game.gameMenu(true);
						}
						break;
					case 1:
						DOM.screenControl(DOM.elScreenTitle);
						break;
					case 2:
						// Game.viewEditor();
						Game.viewGame();

						DOM.elIconsTop.classList.remove('intro');
						DOM.elScreenActive.style.display = 'none';
						Game.inputSuspend = false;
						document.removeEventListener('click', click, true);
						document.removeEventListener('keydown', click, true);

						Game.gameMenu(true);
						return;
				}
				state++;

				if (Game.settingIntro === true) {
					setTimeout(() => {
						suspend = false;
					}, 2000);
				}
			};
			document.addEventListener('click', click);
			document.addEventListener('keydown', click);

			// Done
			setTimeout(() => {
				DOM.spinner(false);
			});
		});
	}

	private static settingsApply(): void {
		/**
		 * DOM
		 */
		/**
		 * Algos
		 */
	}
}
Blockenstein.main();
