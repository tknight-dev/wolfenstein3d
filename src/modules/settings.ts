import { GamingCanvas, GamingCanvasAudioType, GamingCanvasConstPI_1_000, GamingCanvasRenderStyle } from '@tknight-dev/gaming-canvas';
import { FPS, InputDevice, LightingQuality, RaycastQuality, Resolution } from '../models/settings.model.js';
import { DOM } from './dom.js';
import { Game } from './game.js';
import { CalcMainBus } from '../workers/calc-main/calc-main.bus.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';
import { GameDifficulty } from '../models/game.model.js';
import { CalcPathBus } from '../workers/calc-path/calc-path.bus.js';
import { VideoOverlayBus } from '../workers/video-overlay/video-overlay.bus.js';

/**
 * @author tknight-dev
 */

export class Settings {
	public static initialize(): void {
		let setttingsRaw: string | null = <string>localStorage.getItem(Game.localStoragePrefix + 'settings');

		if (setttingsRaw !== null) {
			try {
				Game.settings = JSON.parse(<string>localStorage.getItem(Game.localStoragePrefix + 'settings'));
			} catch (error) {
				setttingsRaw = null;
			}
		}

		if (setttingsRaw === null) {
			/**
			 * Non-worker specific
			 */
			Game.settings.audioVolume = 0.8; // def: 0.8
			Game.settings.audioVolumeEffect = 0.8; // def: 0.8
			Game.settings.audioVolumeMusic = 0.8; // def: 0.8
			Game.settings.debug = false; // def: false
			Game.settings.graphicsDPISupport = false; // def: false
			Game.settings.graphicsFPSDisplay = true; // def: true
			Game.settings.gamePlayer2InputDevice = InputDevice.GAMEPAD; // def: GAMEPAD
			Game.settings.graphicsResolution = 320;
			Game.settings.intro = true;

			/**
			 * Worker specific
			 */
			Game.settings.threadCalcMain = {
				audioNoAction: false,
				audioWallCollisions: false,
				debug: Game.settings.debug,
				difficulty: GameDifficulty.NORMAL,
				fov: (60 * GamingCanvasConstPI_1_000) / 180, // 60 deg
				fps: GamingCanvas.detectDevice(true, true) ? FPS._40 : FPS._60,
				player2Enable: false,
				raycastQuality: GamingCanvas.detectDevice(true, true) ? RaycastQuality.HALF : RaycastQuality.FULL,
			};

			Game.settings.threadCalcPath = {
				debug: Game.settings.debug,
				difficulty: Game.settings.threadCalcMain.difficulty,
				player2Enable: Game.settings.threadCalcMain.player2Enable,
			};

			Game.settings.threadVideoEditor = {
				antialias: false,
				debug: Game.settings.debug,
				difficulty: Game.settings.threadCalcMain.difficulty,
				gridDraw: true,
				fov: Game.settings.threadCalcMain.fov,
				fps: Game.settings.threadCalcMain.fps,
				player2Enable: Game.settings.threadCalcMain.player2Enable,
			};

			Game.settings.threadVideoMain = {
				antialias: Game.settings.threadVideoEditor.antialias,
				crosshair: false,
				debug: Game.settings.debug,
				difficulty: Game.settings.threadCalcMain.difficulty,
				fov: Game.settings.threadCalcMain.fov,
				fps: Game.settings.threadCalcMain.fps,
				gamma: 1, // 0 - 1 (def) - 2
				grayscale: false,
				lightingQuality: LightingQuality.FULL,
				player2Enable: Game.settings.threadCalcMain.player2Enable,
				raycastQuality: Game.settings.threadCalcMain.raycastQuality,
			};

			Game.settings.threadVideoOverlay = {
				antialias: Game.settings.threadVideoEditor.antialias,
				debug: Game.settings.debug,
				grayscale: false,
				player2Enable: Game.settings.threadCalcMain.player2Enable,
			};

			// Done
			localStorage.setItem(Game.localStoragePrefix + 'settings', JSON.stringify(Game.settings));
		}

		// Always set
		Game.settings.intro = true;

		/**
		 * URL Param
		 */
		const params: URLSearchParams = new URLSearchParams(document.location.search);
		for (let [name, value] of params.entries()) {
			switch (name.toLowerCase()) {
				case 'crosshair':
					Game.settings.threadVideoMain.crosshair = String(value).toLowerCase() === 'true';
					break;
				case 'debug':
					Game.settings.debug = String(value).toLowerCase() === 'true';
					Game.settings.threadCalcMain.debug = Game.settings.debug;
					Game.settings.threadCalcPath.debug = Game.settings.debug;
					Game.settings.threadVideoEditor.debug = Game.settings.debug;
					Game.settings.threadVideoMain.debug = Game.settings.debug;
					Game.settings.threadVideoOverlay.debug = Game.settings.debug;
					break;
				case 'dpi':
					Game.settings.graphicsDPISupport = String(value).toLowerCase() === 'true';
					break;
				case 'fps':
					Game.settings.graphicsFPSDisplay = String(value).toLowerCase() === 'true';
					break;
				case 'intro':
					Game.settings.intro = String(value).toLowerCase() === 'true';
					break;
				case 'multiplayer':
					Game.settings.threadCalcMain.player2Enable = String(value).toLowerCase() === 'true';
					Game.settings.threadCalcPath.player2Enable = Game.settings.threadCalcMain.player2Enable;
					Game.settings.threadVideoEditor.player2Enable = Game.settings.threadCalcMain.player2Enable;
					Game.settings.threadVideoMain.player2Enable = Game.settings.threadCalcMain.player2Enable;
					Game.settings.threadVideoOverlay.player2Enable = Game.settings.threadCalcMain.player2Enable;
					break;
				case 'effect':
					Game.settings.audioVolumeEffect = Math.max(0, Math.min(1, Number(value)));
					break;
				case 'music':
					Game.settings.audioVolumeMusic = Math.max(0, Math.min(1, Number(value)));
					break;
				case 'res':
					if (String(value).toLowerCase() === 'null') {
						Game.settings.graphicsResolution = null;
					} else {
						switch (Number(value)) {
							case 160:
							case 320:
							case 640:
							case 1280:
							case 1920:
							case 2560:
								Game.settings.graphicsResolution = <Resolution>Number(value);
								break;
						}
					}
					break;
				case 'volume':
					Game.settings.audioVolume = Math.max(0, Math.min(1, Number(value)));
					break;
			}
		}

		/**
		 * GamingCanvas
		 */
		Game.settings.threadGamingCanvas = {
			audioEnable: true,
			canvasCount: 3,
			canvasSplit: [1, 2],
			canvasSplitLandscapeVertical: true,
			dpiSupportEnable: Game.settings.graphicsDPISupport,
			elementInteractive: DOM.elVideoInteractive,
			elementInjectAsOverlay: [DOM.elEdit, DOM.elPlayerJoystick1, DOM.elPlayerJoystick2],
			inputGamepadEnable: true,
			inputKeyboardEnable: true,
			inputMouseEnable: true,
			inputTouchEnable: true,
			orientationCanvasRotateEnable: false,
			renderStyle: Game.settings.threadVideoEditor.antialias === true ? GamingCanvasRenderStyle.ANTIALIAS : GamingCanvasRenderStyle.PIXELATED,
			resolutionWidthPx: Game.settings.graphicsResolution,
		};

		// Overlay
		if (Game.settings.threadCalcMain.player2Enable === true) {
			if (DOM.elPlayerOverlay1.style.display === 'flex') {
				DOM.elPlayerOverlay2.style.display = 'flex';
			}

			DOM.elPlayerOverlay1.classList.add('multiplayer');
			DOM.elPlayerOverlay2.classList.add('multiplayer');
		} else {
			DOM.elPlayerOverlay2.style.display = 'none';

			DOM.elPlayerOverlay1.classList.remove('multiplayer');
			DOM.elPlayerOverlay2.classList.remove('multiplayer');
		}

		/**
		 * HTML
		 */
		Settings.set(false);

		// Performance
		if (Game.settings.threadCalcMain.player2Enable === true) {
			DOM.elPerformanceVideoPlayer2.style.display = 'block';
		} else {
			DOM.elPerformanceVideoPlayer2.style.display = 'none';
		}
	}

	/**
	 * Use 1 screen for editing even in multiplayer
	 */
	public static singleVideoFeedOverride(state: boolean): void {
		if (state === true) {
			Game.settings.threadCalcMain.player2Enable = false;
			Game.settings.threadVideoMain.player2Enable = false;
			Game.settings.threadVideoOverlay.player2Enable = false;
		} else {
			Game.settings.threadCalcMain.player2Enable = Game.settings.threadVideoEditor.player2Enable;
			Game.settings.threadVideoMain.player2Enable = Game.settings.threadVideoEditor.player2Enable;
			Game.settings.threadVideoOverlay.player2Enable = Game.settings.threadVideoEditor.player2Enable;
		}

		// Send to Workers
		CalcMainBus.outputSettings(Game.settings.threadCalcMain);
		VideoMainBus.outputSettings(Game.settings.threadVideoMain);
		VideoOverlayBus.outputSettings(Game.settings.threadVideoOverlay);
	}

	public static set(apply: boolean): void {
		if (apply === true) {
			Game.settings.audioVolume = Number(DOM.elSettingsValueAudioVolume.value);
			Game.settings.audioVolumeEffect = Number(DOM.elSettingsValueAudioVolumeEffect.value);
			Game.settings.audioVolumeMusic = Number(DOM.elSettingsValueAudioVolumeMusic.value);
			Game.settings.debug = DOM.elSettingsValueGameDebug.checked;
			Game.settings.gamePlayer2InputDevice = Number(DOM.elSettingsValueGamePlayer2InputDevice.value);
			Game.settings.graphicsDPISupport = DOM.elSettingsValueGraphicsDPI.checked;
			Game.settings.graphicsFPSDisplay = DOM.elSettingsValueGraphicsFPSShow.checked;

			if (DOM.elSettingsValueGraphicsResolution.value === 'null') {
				Game.settings.graphicsResolution = null;
			} else {
				Game.settings.graphicsResolution = <Resolution>Number(DOM.elSettingsValueGraphicsResolution.value);
			}

			Game.settings.threadCalcMain.audioNoAction = DOM.elSettingsValueAudioNoAction.checked;
			Game.settings.threadCalcMain.audioWallCollisions = DOM.elSettingsValueAudioWallCollisions.checked;
			Game.settings.threadCalcMain.debug = Game.settings.debug;
			Game.settings.threadCalcMain.difficulty = Number(DOM.elSettingsValueGameDifficulty.value);
			Game.settings.threadCalcMain.fov = (Number(DOM.elSettingsValueGraphicsFOV.value) * GamingCanvasConstPI_1_000) / 180;
			Game.settings.threadCalcMain.fps = Number(DOM.elSettingsValueGraphicsFPS.value);
			Game.settings.threadCalcMain.player2Enable = DOM.elSettingsValueGameMultiplayer.checked;
			Game.settings.threadCalcMain.raycastQuality = Number(DOM.elSettingsValueGraphicsRaycastQuality.value);

			Game.settings.threadCalcPath.debug = Game.settings.debug;
			Game.settings.threadCalcPath.difficulty = Game.settings.threadCalcMain.difficulty;
			Game.settings.threadCalcPath.player2Enable = Game.settings.threadCalcMain.player2Enable;

			Game.settings.threadVideoEditor.antialias = DOM.elSettingsValueGraphicsAntialias.checked;
			Game.settings.threadVideoEditor.debug = Game.settings.debug;
			Game.settings.threadVideoEditor.difficulty = Game.settings.threadCalcMain.difficulty;
			Game.settings.threadVideoEditor.gridDraw = DOM.elSettingsValueEditorDrawGrid.checked;
			Game.settings.threadVideoEditor.fov = Game.settings.threadCalcMain.fov;
			Game.settings.threadVideoEditor.fps = Game.settings.threadCalcMain.fps;
			Game.settings.threadVideoEditor.player2Enable = Game.settings.threadCalcMain.player2Enable;

			Game.settings.threadVideoMain.antialias = Game.settings.threadVideoEditor.antialias;
			Game.settings.threadVideoMain.crosshair = DOM.elSettingsValueGameCrosshair.checked;
			Game.settings.threadVideoMain.debug = Game.settings.debug;
			Game.settings.threadVideoMain.difficulty = Game.settings.threadCalcMain.difficulty;
			Game.settings.threadVideoMain.fov = Game.settings.threadCalcMain.fov;
			Game.settings.threadVideoMain.fps = Game.settings.threadCalcMain.fps;
			Game.settings.threadVideoMain.gamma = Number(DOM.elSettingsValueGraphicsGamma.value);
			Game.settings.threadVideoMain.grayscale = DOM.elSettingsValueGraphicsGrayscale.checked;
			Game.settings.threadVideoMain.lightingQuality = Number(DOM.elSettingsValueGraphicsLightingQuality.value);
			Game.settings.threadVideoMain.player2Enable = Game.settings.threadCalcMain.player2Enable;
			Game.settings.threadVideoMain.raycastQuality = Game.settings.threadCalcMain.raycastQuality;

			Game.settings.threadVideoOverlay.antialias = Game.settings.threadVideoEditor.antialias;
			Game.settings.threadVideoOverlay.debug = Game.settings.debug;
			Game.settings.threadVideoOverlay.grayscale = Game.settings.threadVideoMain.grayscale;
			Game.settings.threadVideoOverlay.player2Enable = Game.settings.threadVideoMain.player2Enable;

			// GamingCanvas
			Game.settings.threadGamingCanvas.dpiSupportEnable = Game.settings.graphicsDPISupport;
			Game.settings.threadGamingCanvas.resolutionWidthPx = Game.settings.graphicsResolution;

			// Overlay
			if (Game.settings.threadCalcMain.player2Enable === true) {
				if (DOM.elPlayerOverlay1.style.display === 'flex') {
					DOM.elPlayerOverlay2.style.display = 'flex';
				}

				DOM.elPlayerOverlay1.classList.add('multiplayer');
				DOM.elPlayerOverlay2.classList.add('multiplayer');
			} else {
				DOM.elPlayerOverlay2.style.display = 'none';

				DOM.elPlayerOverlay1.classList.remove('multiplayer');
				DOM.elPlayerOverlay2.classList.remove('multiplayer');
			}

			// Send to Workers
			CalcMainBus.outputSettings(Game.settings.threadCalcMain);
			CalcPathBus.outputSettings(Game.settings.threadCalcPath);
			VideoEditorBus.outputSettings(Game.settings.threadVideoEditor);
			VideoMainBus.outputSettings(Game.settings.threadVideoMain);
			VideoOverlayBus.outputSettings(Game.settings.threadVideoMain);

			// Performance
			if (Game.settings.threadCalcMain.player2Enable === true) {
				DOM.elPerformanceVideoPlayer2.style.display = 'block';
			} else {
				DOM.elPerformanceVideoPlayer2.style.display = 'none';
			}

			// Done
			localStorage.setItem(Game.localStoragePrefix + 'settings', JSON.stringify(Game.settings));
		} else {
			DOM.elSettingsValueAudioVolume.value = String(Game.settings.audioVolume);
			DOM.elSettingsValueAudioVolumeReadout.value = (Number(DOM.elSettingsValueAudioVolume.value) * 100).toFixed(0) + '%';
			DOM.elSettingsValueAudioVolumeEffect.value = String(Game.settings.audioVolumeEffect);
			DOM.elSettingsValueAudioVolumeEffectReadout.value = (Number(DOM.elSettingsValueAudioVolumeEffect.value) * 100).toFixed(0) + '%';
			DOM.elSettingsValueAudioVolumeMusic.value = String(Game.settings.audioVolumeMusic);
			DOM.elSettingsValueAudioVolumeMusicReadout.value = (Number(DOM.elSettingsValueAudioVolumeMusic.value) * 100).toFixed(0) + '%';
			DOM.elSettingsValueAudioNoAction.checked = Game.settings.threadCalcMain.audioNoAction;
			DOM.elSettingsValueAudioWallCollisions.checked = Game.settings.threadCalcMain.audioWallCollisions;
			DOM.elSettingsValueEditorDrawGrid.checked = Game.settings.threadVideoEditor.gridDraw;
			DOM.elSettingsValueGameCrosshair.checked = Game.settings.threadVideoMain.crosshair;
			DOM.elSettingsValueGameDebug.checked = Game.settings.debug;
			DOM.elSettingsValueGameDifficulty.value = String(Game.settings.threadCalcMain.difficulty);
			DOM.elSettingsValueGameMultiplayer.checked = Game.settings.threadCalcMain.player2Enable;
			DOM.elSettingsValueGamePlayer2InputDevice.value = String(Game.settings.gamePlayer2InputDevice);
			DOM.elSettingsValueGraphicsAntialias.checked = Game.settings.threadVideoEditor.antialias;
			DOM.elSettingsValueGraphicsDPI.checked = Game.settings.graphicsDPISupport;
			DOM.elSettingsValueGraphicsFOV.value = String((Game.settings.threadCalcMain.fov * 180) / GamingCanvasConstPI_1_000);
			DOM.elSettingsValueGraphicsFOVReadout.value = DOM.elSettingsValueGraphicsFOV.value + '°';
			DOM.elSettingsValueGraphicsFOVReadout.value = DOM.elSettingsValueGraphicsFOV.value + '°';
			DOM.elSettingsValueGraphicsFPS.value = String(Game.settings.threadCalcMain.fps);
			DOM.elSettingsValueGraphicsFPSShow.checked = Game.settings.graphicsFPSDisplay;
			DOM.elSettingsValueGraphicsGamma.value = String(Game.settings.threadVideoMain.gamma);
			DOM.elSettingsValueGraphicsGammaReadout.value = (Number(DOM.elSettingsValueGraphicsGamma.value) - 1).toFixed(1).padStart(4, ' ');
			DOM.elSettingsValueGraphicsGrayscale.checked = Game.settings.threadVideoMain.grayscale;
			DOM.elSettingsValueGraphicsLightingQuality.value = String(Game.settings.threadVideoMain.lightingQuality);
			DOM.elSettingsValueGraphicsRaycastQuality.value = String(Game.settings.threadVideoMain.raycastQuality);
			DOM.elSettingsValueGraphicsResolution.value = String(Game.settings.graphicsResolution);
		}

		if (GamingCanvas.isInitialized() === true) {
			GamingCanvas.audioVolumeGlobal(Game.settings.audioVolume, GamingCanvasAudioType.ALL);
			GamingCanvas.audioVolumeGlobal(Game.settings.audioVolumeEffect, GamingCanvasAudioType.EFFECT);
			GamingCanvas.audioVolumeGlobal(Game.settings.audioVolumeMusic, GamingCanvasAudioType.MUSIC);

			GamingCanvas.setOptions(Game.settings.threadGamingCanvas);
		}

		if (Game.modeEdit === false) {
			Game.pause(false);
		}
	}

	public static setMetaMap(apply: boolean): void {
		if (apply === true) {
			Game.map.id = Number(DOM.elMetaMapValueId.value);
			Game.map.position.r = (Number(DOM.elMetaMapValueStartingPositionR.value) * GamingCanvasConstPI_1_000) / 180 + 0.0001;
			Game.map.position.x = (Number(DOM.elMetaMapValueStartingPositionX.value) | 0) + 0.5;
			Game.map.position.y = (Number(DOM.elMetaMapValueStartingPositionY.value) | 0) + 0.5;
			Game.map.timeParInMS = Number(DOM.elMetaMapValueTimeParInSeconds.value) * 1000;
		} else {
			DOM.elMetaMapValueId.value = String(Game.map.id);
			DOM.elMetaMapValueStartingPositionR.value = String((((Game.map.position.r - 0.0001) * 180) / GamingCanvasConstPI_1_000) | 0);
			DOM.elMetaMapValueStartingPositionX.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionX.value = String(Game.map.position.x | 0);
			DOM.elMetaMapValueStartingPositionY.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionY.value = String(Game.map.position.y | 0);
			DOM.elMetaMapValueTimeParInSeconds.value = String((Game.map.timeParInMS / 1000) | 0);
		}
	}
}
