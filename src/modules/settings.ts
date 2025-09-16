import { GamingCanvas, GamingCanvasAudioType, GamingCanvasConstPI, GamingCanvasRenderStyle } from '@tknight-dev/gaming-canvas';
import { FPS, InputDevice, LightingQuality, RaycastQuality, Resolution } from '../models/settings.model.js';
import { DOM } from './dom.js';
import { Game } from './game.js';
import { CalcBus } from '../workers/calc/calc.bus.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';

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
		Game.settingGamePlayer2InputDevice = InputDevice.GAMEPAD; // def: GAMEPAD
		Game.settingGraphicsResolution = GamingCanvas.isMobileOrTablet() ? 320 : 640; // def: 320 for mobile/table & 640 for the rest
		// Game.settingGraphicsResolution = 320;
		Game.settingIntro = true;

		/**
		 * Worker specific
		 */
		Game.settingsCalc = {
			audioNoAction: false,
			audioWallCollisions: false,
			fov: (60 * GamingCanvasConstPI) / 180, // 60 deg
			fps: FPS._60,
			player2Enable: false,
			raycastQuality: RaycastQuality.FULL,
		};

		Game.settingsVideoEditor = {
			antialias: false,
			gridDraw: true,
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
			player2Enable: Game.settingsCalc.player2Enable,
		};

		Game.settingsVideoMain = {
			antialias: Game.settingsVideoEditor.antialias,
			fov: Game.settingsCalc.fov,
			fps: Game.settingsCalc.fps,
			gamma: 1, // 0 - 1 (def) - 2
			grayscale: false,
			lightingQuality: LightingQuality.FULL,
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
					Game.settingGraphicsDPISupport = String(value).toLowerCase() === 'true';
					break;
				case 'effects':
					Game.settingAudioVolumeEffect = Math.max(0, Math.min(1, Number(value)));
					break;
				case 'fps':
					Game.settingGraphicsFPSDisplay = String(value).toLowerCase() === 'true';
					break;
				case 'intro':
					Game.settingIntro = String(value).toLowerCase() === 'true';
					break;
				case 'multiplayer':
					Game.settingsCalc.player2Enable = String(value).toLowerCase() === 'true';
					Game.settingsVideoEditor.player2Enable = Game.settingsCalc.player2Enable;
					Game.settingsVideoMain.player2Enable = Game.settingsCalc.player2Enable;
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
			}
		}

		/**
		 * GamingCanvas
		 */
		Game.settingsGamingCanvas = {
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
			renderStyle: Game.settingsVideoEditor.antialias === true ? GamingCanvasRenderStyle.ANTIALIAS : GamingCanvasRenderStyle.PIXELATED,
			resolutionWidthPx: Game.settingGraphicsResolution,
		};

		// Overlay
		if (Game.settingsCalc.player2Enable === true) {
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
			Game.settingsCalc.player2Enable = false;
			Game.settingsVideoMain.player2Enable = false;
		} else {
			Game.settingsCalc.player2Enable = Game.settingsVideoEditor.player2Enable;
			Game.settingsVideoMain.player2Enable = Game.settingsVideoEditor.player2Enable;
		}

		// Send to Workers
		CalcBus.outputSettings(Game.settingsCalc);
		VideoMainBus.outputSettings(Game.settingsVideoMain);
	}

	public static set(apply: boolean): void {
		if (apply === true) {
			Game.settingAudioVolume = Number(DOM.elSettingsValueAudioVolume.value);
			Game.settingAudioVolumeEffect = Number(DOM.elSettingsValueAudioVolumeEffect.value);
			Game.settingAudioVolumeMusic = Number(DOM.elSettingsValueAudioVolumeMusic.value);
			Game.settingGamePlayer2InputDevice = Number(DOM.elSettingsValueGamePlayer2InputDevice.value);
			Game.settingGraphicsDPISupport = DOM.elSettingsValueGraphicsDPI.checked;
			Game.settingGraphicsFPSDisplay = DOM.elSettingsValueGraphicsFPSShow.checked;

			if (DOM.elSettingsValueGraphicsResolution.value === 'null') {
				Game.settingGraphicsResolution = null;
			} else {
				Game.settingGraphicsResolution = <Resolution>Number(DOM.elSettingsValueGraphicsResolution.value);
			}

			Game.settingsCalc.audioNoAction = DOM.elSettingsValueAudioNoAction.checked;
			Game.settingsCalc.audioWallCollisions = DOM.elSettingsValueAudioWallCollisions.checked;
			Game.settingsCalc.fov = (Number(DOM.elSettingsValueGraphicsFOV.value) * GamingCanvasConstPI) / 180;
			Game.settingsCalc.fps = Number(DOM.elSettingsValueGraphicsFPS.value);
			Game.settingsCalc.player2Enable = DOM.elSettingsValueGameMultiplayer.checked;
			Game.settingsCalc.raycastQuality = Number(DOM.elSettingsValueGraphicsRaycastQuality.value);

			Game.settingsVideoEditor.antialias = DOM.elSettingsValueGraphicsAntialias.checked;
			Game.settingsVideoEditor.gridDraw = DOM.elSettingsValueEditorDrawGrid.checked;
			Game.settingsVideoEditor.fov = Game.settingsCalc.fov;
			Game.settingsVideoEditor.fps = Game.settingsCalc.fps;
			Game.settingsVideoEditor.player2Enable = Game.settingsCalc.player2Enable;

			Game.settingsVideoMain.antialias = Game.settingsVideoEditor.antialias;
			Game.settingsVideoMain.fov = Game.settingsCalc.fov;
			Game.settingsVideoMain.fps = Game.settingsCalc.fps;
			Game.settingsVideoMain.gamma = Number(DOM.elSettingsValueGraphicsGamma.value);
			Game.settingsVideoMain.grayscale = DOM.elSettingsValueGraphicsGrayscale.checked;
			Game.settingsVideoMain.lightingQuality = Number(DOM.elSettingsValueGraphicsLightingQuality.value);
			Game.settingsVideoMain.player2Enable = Game.settingsCalc.player2Enable;
			Game.settingsVideoMain.raycastQuality = Game.settingsCalc.raycastQuality;

			// GamingCanvas
			Game.settingsGamingCanvas.dpiSupportEnable = Game.settingGraphicsDPISupport;
			Game.settingsGamingCanvas.resolutionWidthPx = Game.settingGraphicsResolution;

			// Send to Workers
			CalcBus.outputSettings(Game.settingsCalc);
			VideoEditorBus.outputSettings(Game.settingsVideoEditor);
			VideoMainBus.outputSettings(Game.settingsVideoMain);
		} else {
			DOM.elSettingsValueAudioVolume.value = String(Game.settingAudioVolume);
			DOM.elSettingsValueAudioVolumeEffect.value = String(Game.settingAudioVolumeEffect);
			DOM.elSettingsValueAudioVolumeMusic.value = String(Game.settingAudioVolumeMusic);
			DOM.elSettingsValueAudioNoAction.checked = Game.settingsCalc.audioNoAction;
			DOM.elSettingsValueAudioWallCollisions.checked = Game.settingsCalc.audioWallCollisions;
			DOM.elSettingsValueEditorDrawGrid.checked = Game.settingsVideoEditor.gridDraw;
			DOM.elSettingsValueGameMultiplayer.checked = Game.settingsCalc.player2Enable;
			DOM.elSettingsValueGamePlayer2InputDevice.value = String(Game.settingGamePlayer2InputDevice);
			DOM.elSettingsValueGraphicsAntialias.checked = Game.settingsVideoEditor.antialias;
			DOM.elSettingsValueGraphicsDPI.checked = Game.settingGraphicsDPISupport;
			DOM.elSettingsValueGraphicsFOV.value = String((Game.settingsCalc.fov * 180) / GamingCanvasConstPI);
			DOM.elSettingsValueGraphicsFPS.value = String(Game.settingsCalc.fps);
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
	}

	public static setMetaMap(apply: boolean): void {
		if (apply === true) {
			Game.map.position.r = (Number(DOM.elMetaMapValueStartingPositionR.value) * GamingCanvasConstPI) / 180 + 0.0001;
			Game.map.position.x = Number(DOM.elMetaMapValueStartingPositionX.value) | 0;
			Game.map.position.y = Number(DOM.elMetaMapValueStartingPositionY.value) | 0;
		} else {
			DOM.elMetaMapValueStartingPositionR.value = String((((Game.map.position.r - 0.0001) * 180) / GamingCanvasConstPI) | 0);
			DOM.elMetaMapValueStartingPositionX.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionX.value = String(Game.map.position.x);
			DOM.elMetaMapValueStartingPositionY.max = String(Game.map.grid.sideLength);
			DOM.elMetaMapValueStartingPositionY.value = String(Game.map.position.y);
		}
	}
}
