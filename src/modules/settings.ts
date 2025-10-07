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
		/**
		 * Non-worker specific
		 */
		Game.settingAudioVolume = 0.8; // def: 0.8
		Game.settingAudioVolumeEffect = 0.8; // def: 0.8
		Game.settingAudioVolumeMusic = 0.8; // def: 0.8
		Game.settingDebug = false; // def: false
		Game.settingGraphicsDPISupport = false; // def: false
		Game.settingGraphicsFPSDisplay = true; // def: true
		Game.settingGamePlayer1InputDevice = InputDevice.KEYBOARD; // def: KEYBOARD
		Game.settingGraphicsResolution = GamingCanvas.isMobileOrTablet() ? 320 : 640; // def: 320 for mobile/table & 640 for the rest
		Game.settingIntro = true;

		/**
		 * Worker specific
		 */
		Game.settingsCalcMain = {
			audioNoAction: false,
			audioWallCollisions: false,
			debug: Game.settingDebug,
			difficulty: GameDifficulty.NORMAL,
			fov: (60 * GamingCanvasConstPI_1_000) / 180, // 60 deg
			fps: FPS._60,
			player2Enable: false,
			raycastQuality: RaycastQuality.FULL,
		};

		Game.settingsCalcPath = {
			debug: Game.settingDebug,
			difficulty: Game.settingsCalcMain.difficulty,
			player2Enable: Game.settingsCalcMain.player2Enable,
		};

		Game.settingsVideoEditor = {
			antialias: false,
			debug: Game.settingDebug,
			difficulty: Game.settingsCalcMain.difficulty,
			gridDraw: true,
			fov: Game.settingsCalcMain.fov,
			fps: Game.settingsCalcMain.fps,
			player2Enable: Game.settingsCalcMain.player2Enable,
		};

		Game.settingsVideoMain = {
			antialias: Game.settingsVideoEditor.antialias,
			debug: Game.settingDebug,
			difficulty: Game.settingsCalcMain.difficulty,
			fov: Game.settingsCalcMain.fov,
			fps: Game.settingsCalcMain.fps,
			gamma: 1, // 0 - 1 (def) - 2
			grayscale: false,
			lightingQuality: LightingQuality.FULL,
			player2Enable: Game.settingsCalcMain.player2Enable,
			raycastQuality: Game.settingsCalcMain.raycastQuality,
		};

		Game.settingsVideoOverlay = {
			antialias: Game.settingsVideoEditor.antialias,
			debug: Game.settingDebug,
			grayscale: false,
			player2Enable: Game.settingsCalcMain.player2Enable,
		};

		/**
		 * URL Param
		 */
		const params: URLSearchParams = new URLSearchParams(document.location.search);
		for (let [name, value] of params.entries()) {
			switch (name.toLowerCase()) {
				case 'debug':
					Game.settingDebug = String(value).toLowerCase() === 'true';
					Game.settingsCalcMain.debug = Game.settingDebug;
					Game.settingsCalcPath.debug = Game.settingDebug;
					Game.settingsVideoEditor.debug = Game.settingDebug;
					Game.settingsVideoMain.debug = Game.settingDebug;
					Game.settingsVideoOverlay.debug = Game.settingDebug;
					break;
				case 'dpi':
					Game.settingGraphicsDPISupport = String(value).toLowerCase() === 'true';
					break;
				case 'fps':
					Game.settingGraphicsFPSDisplay = String(value).toLowerCase() === 'true';
					break;
				case 'intro':
					Game.settingIntro = String(value).toLowerCase() === 'true';
					break;
				case 'multiplayer':
					Game.settingsCalcMain.player2Enable = String(value).toLowerCase() === 'true';
					Game.settingsCalcPath.player2Enable = Game.settingsCalcMain.player2Enable;
					Game.settingsVideoEditor.player2Enable = Game.settingsCalcMain.player2Enable;
					Game.settingsVideoMain.player2Enable = Game.settingsCalcMain.player2Enable;
					Game.settingsVideoOverlay.player2Enable = Game.settingsCalcMain.player2Enable;
					break;
				case 'effect':
					Game.settingAudioVolumeEffect = Math.max(0, Math.min(1, Number(value)));
					break;
				case 'music':
					Game.settingAudioVolumeMusic = Math.max(0, Math.min(1, Number(value)));
					break;
				case 'res':
					if (String(value).toLowerCase() === 'null') {
						Game.settingGraphicsResolution = null;
					} else {
						switch (Number(value)) {
							case 160:
							case 320:
							case 640:
							case 1280:
							case 1920:
							case 2560:
								Game.settingGraphicsResolution = <Resolution>Number(value);
								break;
						}
					}
					break;
				case 'volume':
					Game.settingAudioVolume = Math.max(0, Math.min(1, Number(value)));
					break;
			}
		}

		/**
		 * GamingCanvas
		 */
		Game.settingsGamingCanvas = {
			audioEnable: true,
			canvasCount: 3,
			canvasSplit: [1, 2],
			canvasSplitLandscapeVertical: true,
			dpiSupportEnable: Game.settingGraphicsDPISupport,
			elementInteractive: DOM.elVideoInteractive,
			elementInjectAsOverlay: [DOM.elEdit],
			inputGamepadEnable: true,
			inputKeyboardEnable: true,
			inputMouseEnable: true,
			orientationCanvasRotateEnable: false,
			renderStyle: Game.settingsVideoEditor.antialias === true ? GamingCanvasRenderStyle.ANTIALIAS : GamingCanvasRenderStyle.PIXELATED,
			resolutionWidthPx: Game.settingGraphicsResolution,
		};

		// Overlay
		if (Game.settingsCalcMain.player2Enable === true) {
			if (DOM.elPlayerOverlay1.style.display === 'flex') {
				DOM.elPlayerOverlay2.style.display = 'flex';
			}

			DOM.elPlayerOverlay1.classList.add('multiplayer');
			DOM.elPlayerOverlay2.classList.add('multiplayer');
		} else {
			DOM.elPlayerOverlay2.style.display = 'none';

			DOM.elPlayerOverlay1.classList.add('remove');
			DOM.elPlayerOverlay2.classList.add('remove');
		}

		/**
		 * HTML
		 */
		Settings.set(false);
	}

	/**
	 * Use 1 screen for editing even in multiplayer
	 */
	public static singleVideoFeedOverride(state: boolean): void {
		if (state === true) {
			Game.settingsCalcMain.player2Enable = false;
			Game.settingsVideoMain.player2Enable = false;
			Game.settingsVideoOverlay.player2Enable = false;
		} else {
			Game.settingsCalcMain.player2Enable = Game.settingsVideoEditor.player2Enable;
			Game.settingsVideoMain.player2Enable = Game.settingsVideoEditor.player2Enable;
			Game.settingsVideoOverlay.player2Enable = Game.settingsVideoEditor.player2Enable;
		}

		// Send to Workers
		CalcMainBus.outputSettings(Game.settingsCalcMain);
		VideoMainBus.outputSettings(Game.settingsVideoMain);
		VideoOverlayBus.outputSettings(Game.settingsVideoOverlay);
	}

	public static set(apply: boolean): void {
		if (apply === true) {
			Game.settingAudioVolume = Number(DOM.elSettingsValueAudioVolume.value);
			Game.settingAudioVolumeEffect = Number(DOM.elSettingsValueAudioVolumeEffect.value);
			Game.settingAudioVolumeMusic = Number(DOM.elSettingsValueAudioVolumeMusic.value);
			Game.settingDebug = DOM.elSettingsValueGameDebug.checked;
			Game.settingGamePlayer1InputDevice = Number(DOM.elSettingsValueGamePlayer1InputDevice.value);
			Game.settingGraphicsDPISupport = DOM.elSettingsValueGraphicsDPI.checked;
			Game.settingGraphicsFPSDisplay = DOM.elSettingsValueGraphicsFPSShow.checked;

			if (DOM.elSettingsValueGraphicsResolution.value === 'null') {
				Game.settingGraphicsResolution = null;
			} else {
				Game.settingGraphicsResolution = <Resolution>Number(DOM.elSettingsValueGraphicsResolution.value);
			}

			Game.settingsCalcMain.audioNoAction = DOM.elSettingsValueAudioNoAction.checked;
			Game.settingsCalcMain.audioWallCollisions = DOM.elSettingsValueAudioWallCollisions.checked;
			Game.settingsCalcMain.debug = Game.settingDebug;
			Game.settingsCalcMain.difficulty = Number(DOM.elSettingsValueGameDifficulty.value);
			Game.settingsCalcMain.fov = (Number(DOM.elSettingsValueGraphicsFOV.value) * GamingCanvasConstPI_1_000) / 180;
			Game.settingsCalcMain.fps = Number(DOM.elSettingsValueGraphicsFPS.value);
			Game.settingsCalcMain.player2Enable = DOM.elSettingsValueGameMultiplayer.checked;
			Game.settingsCalcMain.raycastQuality = Number(DOM.elSettingsValueGraphicsRaycastQuality.value);

			Game.settingsCalcPath.debug = Game.settingDebug;
			Game.settingsCalcPath.difficulty = Game.settingsCalcMain.difficulty;
			Game.settingsCalcPath.player2Enable = Game.settingsCalcMain.player2Enable;

			Game.settingsVideoEditor.antialias = DOM.elSettingsValueGraphicsAntialias.checked;
			Game.settingsVideoEditor.debug = Game.settingDebug;
			Game.settingsVideoEditor.difficulty = Game.settingsCalcMain.difficulty;
			Game.settingsVideoEditor.gridDraw = DOM.elSettingsValueEditorDrawGrid.checked;
			Game.settingsVideoEditor.fov = Game.settingsCalcMain.fov;
			Game.settingsVideoEditor.fps = Game.settingsCalcMain.fps;
			Game.settingsVideoEditor.player2Enable = Game.settingsCalcMain.player2Enable;

			Game.settingsVideoMain.antialias = Game.settingsVideoEditor.antialias;
			Game.settingsVideoMain.debug = Game.settingDebug;
			Game.settingsVideoMain.difficulty = Game.settingsCalcMain.difficulty;
			Game.settingsVideoMain.fov = Game.settingsCalcMain.fov;
			Game.settingsVideoMain.fps = Game.settingsCalcMain.fps;
			Game.settingsVideoMain.gamma = Number(DOM.elSettingsValueGraphicsGamma.value);
			Game.settingsVideoMain.grayscale = DOM.elSettingsValueGraphicsGrayscale.checked;
			Game.settingsVideoMain.lightingQuality = Number(DOM.elSettingsValueGraphicsLightingQuality.value);
			Game.settingsVideoMain.player2Enable = Game.settingsCalcMain.player2Enable;
			Game.settingsVideoMain.raycastQuality = Game.settingsCalcMain.raycastQuality;

			Game.settingsVideoOverlay.antialias = Game.settingsVideoEditor.antialias;
			Game.settingsVideoOverlay.debug = Game.settingDebug;
			Game.settingsVideoOverlay.grayscale = Game.settingsVideoMain.grayscale;
			Game.settingsVideoOverlay.player2Enable = Game.settingsVideoMain.player2Enable;

			// GamingCanvas
			Game.settingsGamingCanvas.dpiSupportEnable = Game.settingGraphicsDPISupport;
			Game.settingsGamingCanvas.resolutionWidthPx = Game.settingGraphicsResolution;

			// Send to Workers
			CalcMainBus.outputSettings(Game.settingsCalcMain);
			CalcPathBus.outputSettings(Game.settingsCalcPath);
			VideoEditorBus.outputSettings(Game.settingsVideoEditor);
			VideoMainBus.outputSettings(Game.settingsVideoMain);
			VideoOverlayBus.outputSettings(Game.settingsVideoMain);
		} else {
			DOM.elSettingsValueAudioVolume.value = String(Game.settingAudioVolume);
			DOM.elSettingsValueAudioVolumeEffect.value = String(Game.settingAudioVolumeEffect);
			DOM.elSettingsValueAudioVolumeMusic.value = String(Game.settingAudioVolumeMusic);
			DOM.elSettingsValueAudioNoAction.checked = Game.settingsCalcMain.audioNoAction;
			DOM.elSettingsValueAudioWallCollisions.checked = Game.settingsCalcMain.audioWallCollisions;
			DOM.elSettingsValueEditorDrawGrid.checked = Game.settingsVideoEditor.gridDraw;
			DOM.elSettingsValueGameDebug.checked = Game.settingDebug;
			DOM.elSettingsValueGameDifficulty.value = String(Game.settingsCalcMain.difficulty);
			DOM.elSettingsValueGameMultiplayer.checked = Game.settingsCalcMain.player2Enable;
			DOM.elSettingsValueGamePlayer1InputDevice.value = String(Game.settingGamePlayer1InputDevice);
			DOM.elSettingsValueGraphicsAntialias.checked = Game.settingsVideoEditor.antialias;
			DOM.elSettingsValueGraphicsDPI.checked = Game.settingGraphicsDPISupport;
			DOM.elSettingsValueGraphicsFOV.value = String((Game.settingsCalcMain.fov * 180) / GamingCanvasConstPI_1_000);
			DOM.elSettingsValueGraphicsFPS.value = String(Game.settingsCalcMain.fps);
			DOM.elSettingsValueGraphicsFPSShow.checked = Game.settingGraphicsFPSDisplay;
			DOM.elSettingsValueGraphicsGamma.value = String(Game.settingsVideoMain.gamma);
			DOM.elSettingsValueGraphicsGrayscale.checked = Game.settingsVideoMain.grayscale;
			DOM.elSettingsValueGraphicsLightingQuality.value = String(Game.settingsVideoMain.lightingQuality);
			DOM.elSettingsValueGraphicsRaycastQuality.value = String(Game.settingsVideoMain.raycastQuality);
			DOM.elSettingsValueGraphicsResolution.value = String(Game.settingGraphicsResolution);
		}

		if (GamingCanvas.isInitialized() === true) {
			GamingCanvas.audioVolumeGlobal(Game.settingAudioVolume, GamingCanvasAudioType.ALL);
			GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeEffect, GamingCanvasAudioType.EFFECT);
			GamingCanvas.audioVolumeGlobal(Game.settingAudioVolumeMusic, GamingCanvasAudioType.MUSIC);

			GamingCanvas.setOptions(Game.settingsGamingCanvas);
		}

		if (Game.modeEdit === false) {
			if (Game.gameOver !== true) {
				CalcMainBus.outputPause(false);
				CalcPathBus.outputPause(false);
				GamingCanvas.audioControlPauseAll(false);
				VideoMainBus.outputPause(false);
			}
			VideoOverlayBus.outputPause(false);
		}
	}

	public static setMetaMap(apply: boolean): void {
		if (apply === true) {
			Game.map.position.r = (Number(DOM.elMetaMapValueStartingPositionR.value) * GamingCanvasConstPI_1_000) / 180 + 0.0001;
			Game.map.position.x = Number(DOM.elMetaMapValueStartingPositionX.value) | 0;
			Game.map.position.y = Number(DOM.elMetaMapValueStartingPositionY.value) | 0;
		} else {
			DOM.elMetaMapValueStartingPositionR.value = String((((Game.map.position.r - 0.0001) * 180) / GamingCanvasConstPI_1_000) | 0);
			DOM.elMetaMapValueStartingPositionX.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionX.value = String(Game.map.position.x);
			DOM.elMetaMapValueStartingPositionY.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionY.value = String(Game.map.position.y);
		}
	}
}
