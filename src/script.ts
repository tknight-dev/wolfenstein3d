import { CalcBus } from './workers/calc/calc.bus.js';
import { CalcBusOutputDataCharacterMeta, CalcBusOutputDataStats } from './workers/calc/calc.model.js';
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
import { AssetIdAudio, AssetPropertiesAudio, assetsAudio, initializeAssetManager } from './asset-manager.js';
import { Character, CharacterMetaDecode } from './models/character.model.js';

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
		CalcBus.setCallbackCharacterMeta((data: CalcBusOutputDataCharacterMeta) => {
			let character: Character;

			if (data.player1 !== undefined) {
				character = CharacterMetaDecode(data.player1);

				DOM.elPlayerOverlay1Ammo.innerText = String(character.ammo);
				DOM.elPlayerOverlay1Health.innerText = String(character.health) + '%';
				DOM.elPlayerOverlay1Lives.innerText = String(character.lives);
			}

			if (data.player2 !== undefined) {
				character = CharacterMetaDecode(data.player2);

				DOM.elPlayerOverlay1Ammo.innerText = String(character.ammo);
				DOM.elPlayerOverlay1Health.innerText = String(character.health) + '%';
				DOM.elPlayerOverlay1Lives.innerText = String(character.lives);
			}
		});

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

		DOM.spinner(true);

		setTimeout(async () => {
			/**
			 * Assets: Initialize Menu
			 */
			await initializeAssetManager();
			await Assets.initializeAssetsMenu();
			DOM.initializeScreens();

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
			Blockenstein.initializeWorkerCallbacks();
			await Blockenstein.initializeWorkers();

			/**
			 * Settings: Apply
			 */
			Blockenstein.settingsApply();

			// Loading complete
			console.log('System Loaded in', performance.now() - then, 'ms');

			// Start the game!
			DOM.screenControl(DOM.elScreenStats);

			if (Game.settingIntro === true) {
				// Menu click through
				let suspend: boolean = false,
					state: number = 0;
				let click = async () => {
					if (suspend === true) {
						return;
					}
					suspend = true;

					switch (state) {
						case 0:
							DOM.screenControl(DOM.elScreenRating);

							// play music
							Game.musicInstance = await GamingCanvas.audioControlPlay(AssetIdAudio.AUDIO_MUSIC_MENU, false, true, -1, 0, 0);
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
							break;
						case 1:
							DOM.screenControl(DOM.elScreenTitle);
							break;
						case 2:
							DOM.elScreenActive.style.display = 'none';
							Game.inputSuspend = false;
							document.removeEventListener('click', click, true);

							if (Game.musicInstance !== null) {
								GamingCanvas.audioControlStop(Game.musicInstance);
							}
							Game.musicInstance = await GamingCanvas.audioControlPlay(
								AssetIdAudio.AUDIO_MUSIC_LVL1,
								false,
								true,
								0,
								0,
								(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_LVL1)).volume,
							);
							return;
					}
					state++;

					setTimeout(() => {
						suspend = false;
					}, 2500);
				};
				document.addEventListener('click', click);
			} else {
				DOM.elScreenActive.style.display = 'none';
				Game.inputSuspend = false;

				Game.musicInstance = await GamingCanvas.audioControlPlay(
					AssetIdAudio.AUDIO_MUSIC_LVL1,
					false,
					true,
					0,
					0,
					(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_LVL1)).volume,
				);
			}

			// Done
			setTimeout(() => {
				Game.viewGame();
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
		GamingCanvas.setDebug(Game.settingDebug);
	}
}
Blockenstein.main();
