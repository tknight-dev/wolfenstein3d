import { Assets } from './assets.js';
import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	AssetIdImgMenu,
	AssetIdMap,
	AssetIdMusicLevels,
	AssetImgCategory,
	AssetPropertiesAudio,
	AssetPropertiesCharacter,
	AssetPropertiesImage,
	assetsAudio,
	assetsImageCharacters,
	assetsImageMenusFontEndLevel,
	assetsImageMenusFontHUD,
	assetsImages,
} from '../asset-manager.js';
import { Settings } from './settings.js';
import { DOM } from './dom.js';
import {
	CalcMainBusOutputDataCalculations,
	CalcMainBusInputDataPlayerInput,
	CalcMainBusInputDataSettings,
	CalcMainBusOutputDataCamera,
	CalcMainBusActionDoorState,
	CalcMainBusOutputDataAudio,
	CalcMainBusOutputDataActionWallMove,
	CalcMainBusOutputDataActionSwitch,
	CalcMainBusOutputDataWeaponSelect,
	CalcMainBusOutputDataCharacterMeta,
	CalcMainBusOutputDataWeaponFire,
	CalcMainBusOutputDataPlayerHit,
	CalcMainBusPlayerDeadFallDurationInMS,
	CalcMainBusOutputDataWeaponSave,
	CalcMainBusOutputDataNPCUpdate,
	CalcMainBusOutputDataActionDoorLocked,
	CalcMainBusOutputDataActionTag,
} from '../workers/calc-main/calc-main.model.js';
import { CalcMainBus } from '../workers/calc-main/calc-main.bus.js';
import { GameGridCellMasksAndValues, GameMap } from '../models/game.model.js';
import { InputDevice, Resolution } from '../models/settings.model.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model.js';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';
import {
	GamingCanvas,
	GamingCanvasAudioType,
	GamingCanvasConstPI_1_000,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputGamepad,
	GamingCanvasInputGamepadControllerButtons,
	GamingCanvasInputKeyboard,
	GamingCanvasInputMouse,
	GamingCanvasInputMouseAction,
	GamingCanvasInputPosition,
	GamingCanvasInputPositionBasic,
	GamingCanvasInputPositionClone,
	GamingCanvasInputPositionDistance,
	GamingCanvasInputPositionOverlay,
	GamingCanvasInputPositionsClone,
	GamingCanvasInputTouch,
	GamingCanvasInputTouchAction,
	GamingCanvasInputType,
	GamingCanvasOptions,
	GamingCanvasOrientation,
	GamingCanvasReport,
} from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridInputOverlaySnapPxTopLeft,
	GamingCanvasGridViewport,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridInputToCoordinate,
	GamingCanvasGridICamera,
	GamingCanvasGridEditor,
} from '@tknight-dev/gaming-canvas/grid';
import { Character, CharacterInput, CharacterMetaDecode, CharacterNPC, CharacterWeapon } from '../models/character.model.js';
import { CalcPathBus } from '../workers/calc-path/calc-path.bus.js';
import { CalcPathBusInputDataSettings } from '../workers/calc-path/calc-path.model.js';
import { VideoOverlayBusInputDataSettings } from '../workers/video-overlay/video-overlay.model.js';
import { VideoOverlayBus } from '../workers/video-overlay/video-overlay.bus.js';

/**
 * Guards are 100 points
 *
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

enum EditApplyType {
	FILL,
	PENCIL,
}

enum EditType {
	APPLY,
	ERASE,
	INSPECT,
	PAN_ZOOM,
}

enum GameMenuAction {
	DOWN,
	ENTER,
	ESC,
	UP,
}

export class Game {
	public static camera: GamingCanvasGridCamera = new GamingCanvasGridCamera();
	public static editorAssetIdImg: number = 0;
	public static editorAssetCharacterId: AssetIdImgCharacter = 0;
	public static editorAssetCharacterType: AssetIdImgCharacterType = 0;
	public static editorAssetProperties: AssetPropertiesImage;
	public static editorAssetPropertiesCharacter: AssetPropertiesCharacter;
	public static editorCellHighlightEnable: boolean;
	public static editorCellValue: number = 0;
	public static editorHide: boolean;
	public static elButtonApplyApplied: boolean;
	public static elButtonApplyTimeout: ReturnType<typeof setTimeout>;
	public static fullscreen: boolean;
	public static gameOver: boolean;
	public static gameMenuActive: boolean;
	public static gameMenuEpisode: number;
	public static gameMenuIndex: number;
	public static gameMenuSize: number;
	public static gameMenuSlotSave: boolean;
	public static gameMenuSlotSaveId: number | undefined;
	public static inputRequest: number;
	public static inputSuspend: boolean = true;
	public static localStoragePrefix: string = 'tknight-dev-wolfenstein3d-';
	public static map: GameMap;
	public static mapBackup: GameMap;
	public static mapBackupRestored: boolean;
	public static mapEditor: GamingCanvasGridEditor;
	public static mapEnded: boolean;
	public static mapEnding: boolean;
	public static mapEndingSkip: boolean;
	public static mapNew: boolean;
	public static mapUpdated: boolean;
	public static modeEdit: boolean;
	public static modeEditApplyType: EditApplyType = EditApplyType.PENCIL;
	public static modeEditType: EditType = EditType.PAN_ZOOM;
	public static modePerformance: boolean;
	public static musicInstance: number | null = null;
	public static position: GamingCanvasInputPositionBasic;
	public static positionCellHighlight: GamingCanvasInputPositionOverlay;
	public static report: GamingCanvasReport;
	public static reportNew: boolean;
	public static settings: {
		audioVolume: number;
		audioVolumeEffect: number;
		audioVolumeMusic: number;
		debug: boolean;
		graphicsDPISupport: boolean;
		graphicsFOV: number;
		graphicsFPSDisplay: boolean;
		gamePlayer2InputDevice: InputDevice;
		graphicsResolution: Resolution;
		intro: boolean;
		threadCalcMain: CalcMainBusInputDataSettings;
		threadCalcPath: CalcPathBusInputDataSettings;
		threadGamingCanvas: GamingCanvasOptions;
		threadVideoEditor: VideoEditorBusInputDataSettings;
		threadVideoMain: VideoMainBusInputDataSettings;
		threadVideoOverlay: VideoOverlayBusInputDataSettings;
	} = {} as any;
	public static started: boolean;
	public static switchAlt: boolean;
	public static tagRunAndJump: boolean;
	public static viewport: GamingCanvasGridViewport;

	private static cellApply(): void {
		Game.editorCellValue = Game.editorAssetIdImg;

		DOM.elEditorPropertiesCellInputDisabled.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.DISABLED);
		DOM.elEditorPropertiesCellInputDoor.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.DOOR);
		DOM.elEditorPropertiesCellInputFloor.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.FLOOR);
		DOM.elEditorPropertiesCellInputLight.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.LIGHT);
		DOM.elEditorPropertiesCellInputLocked1.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.LOCKED_1);
		DOM.elEditorPropertiesCellInputLocked2.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.LOCKED_2);
		DOM.elEditorPropertiesCellInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);

		if (DOM.elEditorPropertiesCellInputSpriteFixedH.checked !== true && DOM.elEditorPropertiesCellInputSpriteFixedV.checked === true) {
			DOM.elEditorPropertiesCellInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);
			Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_EW;
		}

		DOM.elEditorPropertiesCellInputSwitch.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SWITCH);
		DOM.elEditorPropertiesCellInputSwitchSecret.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SWITCH_SECRET);
		DOM.elEditorPropertiesCellInputTagRunAndJump.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.TAG_RUN_AND_JUMP);
		DOM.elEditorPropertiesCellInputWall.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL);
		DOM.elEditorPropertiesCellInputWallInvisible.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL_INVISIBLE);
		DOM.elEditorPropertiesCellInputWallMovable.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL_MOVABLE);

		DOM.elEditorPropertiesCellOutputAssetId.innerText = Game.editorAssetIdImg.toString(16).toUpperCase().padStart(2, '0');
		DOM.elEditorPropertiesCellOutputProperties.innerText = (Game.editorCellValue & ~GameGridCellMasksAndValues.ID_MASK)
			.toString(16)
			.toUpperCase()
			.padStart(2, '0');
		DOM.elEditorPropertiesCellOutputValue.innerText = Game.editorCellValue.toString(16).toUpperCase().padStart(4, '0');
	}

	private static cellClear(): void {
		Game.editorAssetIdImg = 0;
		Game.editorCellValue = 0;

		let element: HTMLInputElement;
		for (element of DOM.elEditorPropertiesCellInputs) {
			element.checked = false;
		}

		DOM.elEditorPropertiesCellOutputAssetId.innerText = '0000';
		DOM.elEditorPropertiesCellOutputProperties.innerText = '0000';
		DOM.elEditorPropertiesCellOutputValue.innerText = '0000';
	}

	public static loadNextLevel(): void {
		if (Game.inputSuspend === true) {
			return;
		}

		Game.inputSuspend = true;

		if (Game.mapBackup.id % 10 === 8) {
			// episode complete
			if (Game.musicInstance !== null) {
				GamingCanvas.audioControlVolume(Game.musicInstance, 0, 1500);
			}
			setTimeout(async () => {
				Game.inputSuspend = false;
				Game.gameMenu(true);
				Game.gameMusicPlay(AssetIdAudio.AUDIO_MUSIC_WONDERING);
			}, 1500);

			DOM.elGameMenuMainGameSave.classList.add('disable');
			Game.mapEnded = false;
			Game.mapEnding = false;
			Game.mapEndingSkip = false;
			Game.started = false;
		} else {
			let assetIdMapNext: AssetIdMap;

			if (Game.mapBackup.id % 10 === 9) {
				// secret level complete
				assetIdMapNext = Game.mapBackup.id - 8; // goto level 2
			} else {
				if (Game.switchAlt === true) {
					// regular level complete: goto secret level
					assetIdMapNext = Game.mapBackup.id + 9;
					Game.switchAlt = false;
				} else {
					// regular level complete
					assetIdMapNext = Game.mapBackup.id + 1;
				}
			}

			if (Assets.dataMap.has(assetIdMapNext) !== true) {
				alert("That's it for this build!");
			} else {
				// GameMap
				Game.map = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(assetIdMapNext))));
				Game.mapBackup = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(assetIdMapNext))));
				Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
				Game.mapEnded = false;
				Game.mapEnding = false;

				Game.camera.r = Game.map.position.r;
				Game.camera.x = Game.map.position.x + 0.5;
				Game.camera.y = Game.map.position.y + 0.5;
				Game.camera.z = Game.map.position.z;

				Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
				Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
				Game.viewport.apply(Game.camera, false);

				DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];
				Game.tagRunAndJump = false;

				Game.gameMusicPlay(Game.mapBackup.music);

				CalcMainBus.outputMap(Game.mapBackup);
				CalcPathBus.outputMap(Game.mapBackup);
				VideoEditorBus.outputMap(Game.mapBackup);
				VideoMainBus.outputMap(Game.mapBackup);
				VideoOverlayBus.outputReset();

				// End menu
				setTimeout(() => {
					Game.gameMenu(false);
					DOM.elIconsTop.classList.remove('intro');
					DOM.elScreenActive.style.display = 'none';
					Game.inputSuspend = false;
					Game.pause(false);
				}, 200);
			}
		}
	}

	/**
	 * @param enable undefined means toggle
	 */
	public static gameMenu(enable?: boolean, pauseAudio?: boolean): void {
		if (Game.gameMenuActive === enable) {
			if (Game.gameMenuActive === true) {
				GamingCanvas.audioControlPauseAll(pauseAudio === true);
			}
			return;
		}

		if (Game.started === true) {
			DOM.elGameMenuMainContinue.style.display = 'block';
			Game.gameMenuSize = 6;
		} else {
			DOM.elGameMenuMainContinue.style.display = 'none';
			Game.gameMenuSize = 5;
		}

		// Hide performance overlay
		if (Game.modeEdit !== false) {
			Game.viewEditor();
		} else {
			Game.viewGame();
		}

		DOM.elGameMenuContent.classList.remove('tall');
		DOM.elGameMenuBanners.style.display = 'flex';
		DOM.elGameMenuBannersGameLoad.style.display = 'none';
		DOM.elGameMenuBannersGameSave.style.display = 'none';
		DOM.elGameMenuBannersOptions.style.display = 'block';

		DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
		DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
		DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
		DOM.elGameMenuEpisodesItems.forEach((v) => v.classList.remove('active'));
		DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('active'));
		DOM.elGameMenuMainItems[0].classList.add('active');

		DOM.elGameMenuDifficulty.style.display = 'none';
		DOM.elGameMenuDifficultyDesc.style.display = 'none';
		DOM.elGameMenuMain.style.display = 'block';
		DOM.elGameMenuEpisodes.style.display = 'none';
		DOM.elGameMenuEpisodesDesc.style.display = 'none';
		DOM.elGameMenuPistol.style.top = '0';
		DOM.elGameMenuSlots.style.display = 'none';
		Game.gameMenuIndex = 0;

		if (enable === true) {
			DOM.elIconsTop.classList.add('intro');
			DOM.elGameMenu.classList.add('show');
			DOM.elGameMenuBannersOptions.style.display = 'block';

			Game.gameMenuActive = true;
			Game.pause(true, !pauseAudio);
		} else if (enable === false || DOM.elGameMenu.classList.contains('show') === true) {
			DOM.elIconsTop.classList.remove('intro');
			DOM.elGameMenu.classList.remove('show');
			Game.gameMenuActive = false;
			Game.pause(false);
		} else {
			DOM.elIconsTop.classList.add('intro');
			DOM.elGameMenu.classList.add('show');
			DOM.elGameMenuBannersOptions.style.display = 'block';

			Game.gameMenuActive = true;
			Game.pause(true, !pauseAudio);
		}
	}

	public static async gameMenuAction(action: GameMenuAction, mute?: boolean): Promise<void> {
		switch (action) {
			case GameMenuAction.DOWN:
				Game.gameMenuIndex = (Game.gameMenuIndex + 1) % Game.gameMenuSize;

				mute !== true && Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				if (DOM.elGameMenuMain.style.display !== 'none') {
					while (DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.contains('disable') === true) {
						Game.gameMenuIndex = (Game.gameMenuIndex + 1) % Game.gameMenuSize;
					}

					DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
				} else if (DOM.elGameMenuDifficulty.style.display !== 'none') {
					DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
					DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
					DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
				} else if (DOM.elGameMenuEpisodes.style.display !== 'none') {
					while (DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.contains('disable') === true) {
						Game.gameMenuIndex = (Game.gameMenuIndex + 1) % Game.gameMenuSize;
					}

					DOM.elGameMenuEpisodesItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
				} else {
					DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuSlotsItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
				}
				break;
			case GameMenuAction.ENTER:
				if (DOM.elGameMenuMain.style.display !== 'none') {
					switch (Game.gameMenuIndex) {
						case 0:
							DOM.elGameMenuMainGameNew.click();
							break;
						case 1:
							DOM.elGameMenuMainControls.click();
							break;
						case 2:
							DOM.elGameMenuMainGameLoad.click();
							break;
						case 3:
							DOM.elGameMenuMainGameSave.click();
							break;
						case 4:
							DOM.elGameMenuMainSettings.click();
							break;
						case 5:
							Game.gameMenu(false);
							break;
					}
				} else if (DOM.elGameMenuDifficulty.style.display !== 'none') {
					Game.gameMenuActionLoad();
				} else if (DOM.elGameMenuEpisodes.style.display !== 'none') {
					if (Game.gameMenuIndex === 0) {
						DOM.elGameMenuEpisodes1.click();
					}
				} else {
					if (Game.gameMenuIndex === 0) {
						DOM.elGameMenuSlots1.click();
					} else if (Game.gameMenuIndex === 1) {
						DOM.elGameMenuSlots2.click();
					} else {
						DOM.elGameMenuSlots3.click();
					}
				}
				break;
			case GameMenuAction.ESC:
				if (DOM.elGameMenuDifficulty.style.display !== 'none') {
					Game.gameMenuIndex = 0;
					Game.gameMenuSize = 6;

					DOM.elGameMenuEpisodesItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = '20px';

					DOM.elGameMenuContent.classList.add('tall');
					DOM.elGameMenuBanners.style.display = 'none';
					DOM.elGameMenuDifficulty.style.display = 'none';
					DOM.elGameMenuDifficultyDesc.style.display = 'none';
					DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
					DOM.elGameMenuEpisodes.style.display = 'block';
					DOM.elGameMenuEpisodesDesc.style.display = 'flex';
					DOM.elGameMenuSlots.style.display = 'none';
					DOM.elGameMenuMain.style.display = 'none';

					mute !== true && Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_EXIT);
				} else if (DOM.elGameMenuMain.style.display === 'none') {
					Game.gameMenuIndex = 0;
					if (Game.started === true) {
						DOM.elGameMenuMainContinue.style.display = 'block';
						Game.gameMenuSize = 6;
					} else {
						DOM.elGameMenuMainContinue.style.display = 'none';
						Game.gameMenuSize = 5;
					}

					DOM.elGameMenuBannersGameLoad.style.display = 'none';
					DOM.elGameMenuBannersGameSave.style.display = 'none';
					DOM.elGameMenuBannersOptions.style.display = 'block';

					DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = '0';

					DOM.elGameMenuContent.classList.remove('tall');
					DOM.elGameMenuBanners.style.display = 'flex';
					DOM.elGameMenuDifficulty.style.display = 'none';
					DOM.elGameMenuDifficultyDesc.style.display = 'none';
					DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
					DOM.elGameMenuEpisodes.style.display = 'none';
					DOM.elGameMenuEpisodesDesc.style.display = 'none';
					DOM.elGameMenuSlots.style.display = 'none';
					DOM.elGameMenuMain.style.display = 'block';

					mute !== true && Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_EXIT);
				} else if (Game.started === true) {
					mute !== true && Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_EXIT);
					DOM.elGameMenuMainContinue.click();
				}
				break;
			case GameMenuAction.UP:
				Game.gameMenuIndex--;
				if (Game.gameMenuIndex === -1) {
					Game.gameMenuIndex = Game.gameMenuSize - 1;
				}

				mute !== true && Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				if (DOM.elGameMenuMain.style.display !== 'none') {
					while (DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.contains('disable') === true) {
						Game.gameMenuIndex--;
						if (Game.gameMenuIndex === -1) {
							Game.gameMenuIndex = Game.gameMenuSize - 1;
						}
					}

					DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
				} else if (DOM.elGameMenuDifficulty.style.display !== 'none') {
					DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
					DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
					DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
				} else if (DOM.elGameMenuEpisodes.style.display !== 'none') {
					while (DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.contains('disable') === true) {
						Game.gameMenuIndex--;
						if (Game.gameMenuIndex === -1) {
							Game.gameMenuIndex = Game.gameMenuSize - 1;
						}
					}

					DOM.elGameMenuEpisodesItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
				} else {
					DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('active'));
					DOM.elGameMenuSlotsItems[Game.gameMenuIndex].classList.add('active');
					DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
				}
				break;
		}
	}

	private static async gameMenuActionLoad(): Promise<void> {
		Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);
		GamingCanvas.audioControlStopAll(GamingCanvasAudioType.EFFECT);

		DOM.elIconsTop.classList.remove('intro');
		DOM.elScreenActive.style.display = 'none';

		// Difficulty
		DOM.elSettingsValueGameDifficulty.value = String(Game.gameMenuIndex);
		Settings.set(true);

		// GameMap
		switch (Game.gameMenuEpisode) {
			case 0:
				Game.map = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_FLOOR_01))));
				Game.mapBackup = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_FLOOR_01))));

				DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];
				break;
		}
		Game.camera.r = Game.map.position.r;
		Game.camera.x = Game.map.position.x + 0.5;
		Game.camera.y = Game.map.position.y + 0.5;
		Game.camera.z = Game.map.position.z;

		Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
		Game.mapEnded = false;
		Game.mapEnding = false;

		Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];
		Game.tagRunAndJump = false;

		Game.gameMusicPlay(Game.mapBackup.music);

		CalcMainBus.outputMap(Game.mapBackup);
		CalcPathBus.outputMap(Game.mapBackup);
		VideoEditorBus.outputMap(Game.mapBackup);
		VideoMainBus.outputMap(Game.mapBackup);
		VideoOverlayBus.outputReset();

		// End menu
		setTimeout(() => {
			Game.gameMenu(false);
			Game.started = true;
			DOM.elGameMenuMainGameSave.classList.remove('disable');

			CalcMainBus.outputMetaReset();
		}, 200);
	}

	private static async gameMenuActionSlot(id: number): Promise<boolean> {
		try {
			if (Game.gameMenuSlotSave === true) {
				const blob: Blob | null = await GamingCanvas.screenshot(Game.modeEdit === true ? [] : [3]);

				if (blob !== null) {
					const fileReader: FileReader = new FileReader();
					fileReader.onload = async (event: ProgressEvent) => {
						localStorage.setItem(
							Game.localStoragePrefix + 'map-desc-' + id,
							JSON.stringify({
								image: (<any>event.target).result,
								mapId: Game.map.id,
								timestamp: Date.now(),
							}),
						);
						Game.gameMenuSlotSaveId = id;
						CalcMainBus.outputSave();
					};
					fileReader.readAsDataURL(blob);
				} else {
					localStorage.setItem(
						Game.localStoragePrefix + 'map-desc-' + id,
						JSON.stringify({
							mapId: Game.map.id,
							timestamp: Date.now(),
						}),
					);
					Game.gameMenuSlotSaveId = id;
					CalcMainBus.outputSave();
				}
			} else {
				const rawMap: string | null = localStorage.getItem(Game.localStoragePrefix + 'map-' + id),
					rawMeta: string | null = localStorage.getItem(Game.localStoragePrefix + 'map-meta-' + id);

				if (rawMap === null || rawMeta === null) {
					return false;
				}
				const parsed: GameMap = Assets.mapParse(JSON.parse(rawMap)),
					parsed2: GameMap = Assets.mapParse(JSON.parse(rawMap));

				// Adjust
				Game.camera.r = parsed.position.r;
				Game.camera.x = parsed.position.x;
				Game.camera.y = parsed.position.y;
				Game.camera.z = parsed.position.z;
				Game.map = parsed;
				Game.mapBackup = parsed2;
				Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
				Game.mapEnded = false;
				Game.mapEnding = false;

				// Done
				Game.gameOver = false;
				Game.mapNew = true;

				DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];

				CalcMainBus.outputMap(parsed);
				CalcPathBus.outputMap(parsed);
				VideoEditorBus.outputMap(parsed);
				VideoMainBus.outputMap(parsed);
				VideoOverlayBus.outputReset();

				Game.gameMusicPlay(parsed.music);

				setTimeout(() => {
					CalcMainBus.outputMeta(rawMeta);
					Game.gameMenu(false);
				}, 200);
			}

			return true;
		} catch (error) {
			console.error('gameMenuActionSlot: failed with', error);
			return false;
		}
	}

	private static async gameMenuActionSlotsLoad(): Promise<void> {
		let data: any, date: Date, element: HTMLElement, raw: string | null;

		try {
			for (let i = 0; i < 3; i++) {
				element = DOM.elGameMenuSlotsItems[i];
				raw = localStorage.getItem(Game.localStoragePrefix + 'map-desc-' + i);

				if (raw === null) {
					(<HTMLElement>element.children[0]).innerText = 'Empty';

					if (Game.gameMenuSlotSave === false) {
						element.classList.add('empty');
					}
					continue;
				}

				data = JSON.parse(raw);
				date = new Date(data.timestamp);
				element.classList.remove('empty');

				(<HTMLElement>element.children[0]).innerText = AssetIdMap[data.mapId].replaceAll('_', ' ').replace(' LEV', ': LEV');
				(<HTMLElement>element.children[1]).style.backgroundImage = data.image !== undefined ? `url(${data.image})` : 'none';
				(<HTMLElement>element.children[2]).innerText =
					`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDay()} ${date.toLocaleString('en-US', { minute: 'numeric', hour: 'numeric', hour12: true })}`;
			}
		} catch (error) {
			console.error('gameMenuActionSlotsLoad: failed with', error);
		}
	}

	private static gameMenuActionPlay(assetId: AssetIdAudio): void {
		const properties: AssetPropertiesAudio = <AssetPropertiesAudio>assetsAudio.get(assetId);

		if (properties !== undefined) {
			GamingCanvas.audioControlPlay(assetId, GamingCanvasAudioType.EFFECT, false, 0, 0, properties.volume);
		}
	}

	public static gameMenuInitialize(): void {
		DOM.elGameMenuBack.onclick = () => {
			Game.gameMenuAction(GameMenuAction.ESC);
		};

		DOM.elGameMenuMainContinue.onclick = () => {
			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

			setTimeout(() => {
				Game.gameMenu(false);
			}, 200);
		};
		DOM.elGameMenuMainContinue.onmouseover = () => {
			if (Game.gameMenuIndex !== 5) {
				Game.gameMenuIndex = 5;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuMainControls.onclick = () => {
			if (DOM.elGameMenuMainControls.classList.contains('disable') === true) {
				return;
			}

			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);
			DOM.elInfoControls.click();
		};
		DOM.elGameMenuMainControls.onmouseover = () => {
			if (Game.gameMenuIndex !== 1 && DOM.elGameMenuMainSettings.classList.contains('disable') !== true) {
				Game.gameMenuIndex = 1;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuDifficulty1.onclick = () => {
			Game.gameMenuActionLoad();
		};
		DOM.elGameMenuDifficulty1.onmouseover = () => {
			if (Game.gameMenuIndex !== 0) {
				Game.gameMenuIndex = 0;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
				DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
				DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuDifficulty2.onclick = () => {
			Game.gameMenuActionLoad();
		};
		DOM.elGameMenuDifficulty2.onmouseover = () => {
			if (Game.gameMenuIndex !== 1) {
				Game.gameMenuIndex = 1;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
				DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
				DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuDifficulty3.onclick = () => {
			Game.gameMenuActionLoad();
		};
		DOM.elGameMenuDifficulty3.onmouseover = () => {
			if (Game.gameMenuIndex !== 2) {
				Game.gameMenuIndex = 2;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
				DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
				DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuDifficulty4.onclick = () => {
			Game.gameMenuActionLoad();
		};
		DOM.elGameMenuDifficulty4.onmouseover = () => {
			if (Game.gameMenuIndex !== 3) {
				Game.gameMenuIndex = 3;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
				DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
				DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuEpisodes1.onclick = () => {
			Game.gameMenuEpisode = 0;

			DOM.elGameMenuContent.classList.add('tall');
			DOM.elGameMenuBanners.style.display = 'none';
			DOM.elGameMenuDifficulty.style.display = 'block';
			DOM.elGameMenuDifficultyDesc.style.display = 'flex';
			DOM.elGameMenuMain.style.display = 'none';
			DOM.elGameMenuEpisodes.style.display = 'none';
			DOM.elGameMenuEpisodesDesc.style.display = 'none';

			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

			Game.gameMenuIndex = 0;
			Game.gameMenuSize = 4;
			DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
			DOM.elGameMenuDifficultyHeadItems[Game.gameMenuIndex].style.display = 'block';
			DOM.elGameMenuDifficultyItems.forEach((v) => v.classList.remove('active'));
			DOM.elGameMenuDifficultyItems[Game.gameMenuIndex].classList.add('active');
			DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
		};

		DOM.elGameMenuMainGameLoad.onclick = () => {
			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

			Game.gameMenuIndex = 0;
			Game.gameMenuSize = 3;
			Game.gameMenuSlotSave = false;

			DOM.elGameMenuContent.classList.remove('tall');
			DOM.elGameMenuBanners.style.display = 'flex';
			DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('active'));
			DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('empty'));
			DOM.elGameMenuSlotsItems[Game.gameMenuIndex].classList.add('active');
			DOM.elGameMenuPistol.style.top = '20px';

			Game.gameMenuActionSlotsLoad();

			DOM.elGameMenuBannersGameLoad.style.display = 'block';
			DOM.elGameMenuBannersGameSave.style.display = 'none';
			DOM.elGameMenuBannersOptions.style.display = 'none';

			DOM.elGameMenuMain.style.display = 'none';
			DOM.elGameMenuSlots.style.display = 'block';
		};
		DOM.elGameMenuMainGameLoad.onmouseover = () => {
			if (Game.gameMenuIndex !== 2) {
				Game.gameMenuIndex = 2;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuContent.classList.remove('tall');
				DOM.elGameMenuBanners.style.display = 'flex';
				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuMainGameNew.onclick = () => {
			DOM.elGameMenuContent.classList.add('tall');
			DOM.elGameMenuBanners.style.display = 'none';
			DOM.elGameMenuDifficulty.style.display = 'none';
			DOM.elGameMenuDifficultyDesc.style.display = 'none';
			DOM.elGameMenuDifficultyHeadItems.forEach((v) => (v.style.display = 'none'));
			DOM.elGameMenuMain.style.display = 'none';
			DOM.elGameMenuEpisodes.style.display = 'block';
			DOM.elGameMenuEpisodesDesc.style.display = 'flex';

			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

			Game.gameMenuIndex = 0;
			Game.gameMenuSize = 6;
			DOM.elGameMenuEpisodesItems.forEach((v) => v.classList.remove('active'));
			DOM.elGameMenuEpisodesItems[Game.gameMenuIndex].classList.add('active');
			DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
		};
		DOM.elGameMenuMainGameNew.onmouseover = () => {
			if (Game.gameMenuIndex !== 0) {
				Game.gameMenuIndex = 0;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuMainGameSave.onclick = () => {
			if (DOM.elGameMenuMainGameSave.classList.contains('disable') === true) {
				return;
			}

			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);
			Game.gameMenuIndex = 0;
			Game.gameMenuSize = 3;
			Game.gameMenuSlotSave = true;

			DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('active'));
			DOM.elGameMenuSlotsItems.forEach((v) => v.classList.remove('empty'));
			DOM.elGameMenuSlotsItems[Game.gameMenuIndex].classList.add('active');
			DOM.elGameMenuPistol.style.top = '20px';

			Game.gameMenuActionSlotsLoad();

			DOM.elGameMenuContent.classList.remove('tall');
			DOM.elGameMenuBanners.style.display = 'flex';
			DOM.elGameMenuBannersGameLoad.style.display = 'none';
			DOM.elGameMenuBannersGameSave.style.display = 'block';
			DOM.elGameMenuBannersOptions.style.display = 'none';

			DOM.elGameMenuMain.style.display = 'none';
			DOM.elGameMenuSlots.style.display = 'block';
		};
		DOM.elGameMenuMainGameSave.onmouseover = () => {
			if (Game.gameMenuIndex !== 3 && DOM.elGameMenuMainGameSave.classList.contains('disable') !== true) {
				Game.gameMenuIndex = 3;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuMainSettings.onclick = () => {
			if (DOM.elGameMenuMainSettings.classList.contains('disable') === true) {
				return;
			}

			Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);
			DOM.elInfoSettings.click();
		};
		DOM.elGameMenuMainSettings.onmouseover = () => {
			if (Game.gameMenuIndex !== 4 && DOM.elGameMenuMainSettings.classList.contains('disable') !== true) {
				Game.gameMenuIndex = 4;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 40 + 'px';
			}
		};

		DOM.elGameMenuSlots1.onclick = async () => {
			Game.gameMenuIndex = 1;
			if ((await Game.gameMenuActionSlot(0)) === true) {
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

				if (Game.gameMenuSlotSave === true) {
					Game.gameMenuAction(GameMenuAction.ESC, true);
				} else {
					Game.started = true;
					DOM.elGameMenuMainGameSave.classList.remove('disable');
				}
			}
		};
		DOM.elGameMenuSlots1.onmouseover = () => {
			if (Game.gameMenuIndex !== 0) {
				Game.gameMenuIndex = 0;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
			}
		};

		DOM.elGameMenuSlots2.onclick = async () => {
			Game.gameMenuIndex = 1;
			if ((await Game.gameMenuActionSlot(1)) === true) {
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

				if (Game.gameMenuSlotSave === true) {
					Game.gameMenuAction(GameMenuAction.ESC, true);
				} else {
					Game.started = true;
					DOM.elGameMenuMainGameSave.classList.remove('disable');
				}
			}
		};
		DOM.elGameMenuSlots2.onmouseover = () => {
			if (Game.gameMenuIndex !== 1) {
				Game.gameMenuIndex = 1;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
			}
		};

		DOM.elGameMenuSlots3.onclick = async () => {
			Game.gameMenuIndex = 2;
			if ((await Game.gameMenuActionSlot(2)) === true) {
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN);

				if (Game.gameMenuSlotSave === true) {
					Game.gameMenuAction(GameMenuAction.ESC, true);
				} else {
					Game.started = true;
					DOM.elGameMenuMainGameSave.classList.remove('disable');
				}
			}
		};
		DOM.elGameMenuSlots3.onmouseover = () => {
			if (Game.gameMenuIndex !== 2) {
				Game.gameMenuIndex = 2;
				Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE);

				DOM.elGameMenuMainItems.forEach((v) => v.classList.remove('active'));
				DOM.elGameMenuMainItems[Game.gameMenuIndex].classList.add('active');
				DOM.elGameMenuPistol.style.top = Game.gameMenuIndex * 80 + 20 + 'px';
			}
		};
	}

	public static async gameMusicPlay(assetId: AssetIdAudio): Promise<number | null> {
		if (Game.musicInstance !== null) {
			GamingCanvas.audioControlStop(Game.musicInstance);
		}
		Game.musicInstance = await GamingCanvas.audioControlPlay(
			assetId,
			GamingCanvasAudioType.MUSIC,
			true,
			0,
			0,
			(<AssetPropertiesAudio>assetsAudio.get(assetId)).volume,
		);
		return Game.musicInstance;
	}

	public static initializeDomInteractive(): void {
		Game.gameMenuInitialize();

		DOM.elButtonEdit.onclick = () => {
			Game.viewEditor();
		};

		DOM.elButtonPerformance.onclick = () => {
			Game.viewPerformance();
		};

		DOM.elButtonPlay.onclick = () => {
			Game.viewGame();
		};

		// Controls
		DOM.elControlsClose.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'none';
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
			DOM.elControlsSubMouse.classList.remove('active');
			DOM.elControlsSubTouch.classList.remove('active');

			DOM.elControls.style.display = 'none';

			Game.inputSuspend = false;
			if (Game.modeEdit === false) {
				Game.pause(false);
			}
		};

		DOM.elControlsSubGamepad.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'block';
			DOM.elControlsBodyKeyboard.style.display = 'none';
			DOM.elControlsBodyMouse.style.display = 'none';
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.add('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
			DOM.elControlsSubMouse.classList.remove('active');
			DOM.elControlsSubTouch.classList.remove('active');
		};

		DOM.elControlsSubKeyboard.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'block';
			DOM.elControlsBodyMouse.style.display = 'none';
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.add('active');
			DOM.elControlsSubMouse.classList.remove('active');
			DOM.elControlsSubTouch.classList.remove('active');
		};

		DOM.elControlsSubMouse.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'none';
			DOM.elControlsBodyMouse.style.display = 'block';
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
			DOM.elControlsSubMouse.classList.add('active');
			DOM.elControlsSubTouch.classList.remove('active');
		};

		DOM.elControlsSubTouch.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'none';
			DOM.elControlsBodyMouse.style.display = 'none';
			DOM.elControlsBodyTouch.style.display = 'block';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
			DOM.elControlsSubMouse.classList.remove('active');
			DOM.elControlsSubTouch.classList.add('active');
		};

		// Editor buttons
		DOM.elButtonApply.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') !== true) {
				DOM.elButtonEye.click();
			}

			if (DOM.elButtonApply.classList.contains('active') !== true) {
				DOM.elButtonApply.classList.add('active');
				DOM.elButtonEraser.classList.remove('active');
				DOM.elButtonInspect.classList.remove('active');
				DOM.elButtonMove.classList.remove('active');

				DOM.elEdit.style.background = 'transparent';
				DOM.elEdit.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

				DOM.elVideoInteractive.classList.remove('cursor-grab');
				DOM.elVideoInteractive.classList.add('cursor-pointer');
				Game.editorCellHighlightEnable = true;

				Game.modeEditApplyType = EditApplyType.PENCIL;
				DOM.elButtonApply.children[0].classList.remove('fill');
				DOM.elButtonApply.children[0].classList.add('pencil');

				Game.modeEditType = EditType.APPLY;
			} else if (Game.elButtonApplyApplied !== true) {
				Game.modeEditApplyType = EditApplyType.PENCIL;
				DOM.elButtonApply.children[0].classList.remove('fill');
				DOM.elButtonApply.children[0].classList.add('pencil');
			}
			Game.elButtonApplyApplied = false;
		};
		DOM.elButtonApply.onmousedown = () => {
			if (DOM.elButtonApply.classList.contains('active') === true) {
				clearTimeout(Game.elButtonApplyTimeout);
				Game.elButtonApplyTimeout = setTimeout(() => {
					Game.elButtonApplyApplied = true;
					if (Game.modeEditApplyType !== EditApplyType.FILL) {
						Game.modeEditApplyType = EditApplyType.FILL;
						DOM.elButtonApply.children[0].classList.add('fill');
						DOM.elButtonApply.children[0].classList.remove('pencil');
					} else {
						Game.modeEditApplyType = EditApplyType.PENCIL;
						DOM.elButtonApply.children[0].classList.remove('fill');
						DOM.elButtonApply.children[0].classList.add('pencil');
					}
				}, 750);
			}
		};
		DOM.elButtonApply.onmouseup = () => {
			clearTimeout(Game.elButtonApplyTimeout);
		};

		DOM.elButtonDownload.onclick = () => {
			DOM.elButtonDownload.classList.add('active');
			DOM.spinner(true);

			setTimeout(() => {
				const a: HTMLAnchorElement = document.createElement('a'),
					downloadData = 'data:text/json;charset=utf-8,' + btoa(Assets.mapToJSONString(Game.map));

				a.classList.add('hidden');
				a.download = 'wolfenstein3d.map';
				a.href = downloadData;

				// Download
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);

				setTimeout(() => {
					DOM.elButtonDownload.classList.remove('active');
					DOM.spinner(false);
				}, 250);
			}, 250);
		};

		DOM.elButtonEraser.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') !== true) {
				DOM.elButtonEye.click();
			}

			if (DOM.elButtonEraser.classList.contains('active') !== true) {
				DOM.elButtonApply.classList.remove('active');
				DOM.elButtonEraser.classList.add('active');
				DOM.elButtonInspect.classList.remove('active');
				DOM.elButtonMove.classList.remove('active');

				DOM.elEdit.style.background = 'transparent';
				DOM.elEdit.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

				DOM.elVideoInteractive.classList.remove('cursor-grab');
				DOM.elVideoInteractive.classList.add('cursor-pointer');
				Game.editorCellHighlightEnable = true;
				Game.modeEditType = EditType.ERASE;
			}
		};

		DOM.elButtonEye.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') === true) {
				DOM.elButtonEye.classList.remove('active');
				DOM.elCanvases[4].classList.add('hide');

				DOM.elButtonMove.click();
				Game.editorHide = true;

				DOM.elEditor.style.display = 'none';
				DOM.elEditorProperties.style.display = 'none';
			} else {
				DOM.elButtonEye.classList.add('active');
				DOM.elCanvases[4].classList.remove('hide');

				Game.editorHide = false;

				DOM.elPlayerJoystick1.classList.remove('show');
				DOM.elPlayerJoystick2.classList.remove('show');

				DOM.elEditor.style.display = 'flex';
				DOM.elEditorProperties.style.display = 'flex';
			}
		};

		DOM.elButtonInspect.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') !== true) {
				DOM.elButtonEye.click();
			}

			if (DOM.elButtonInspect.classList.contains('active') !== true) {
				DOM.elButtonApply.classList.remove('active');
				DOM.elButtonEraser.classList.remove('active');
				DOM.elButtonInspect.classList.add('active');
				DOM.elButtonMove.classList.remove('active');

				if (DOM.elEditorItemActive !== undefined) {
					DOM.elEditorItemActive.classList.remove('active');
				}

				DOM.elEdit.style.background = 'transparent';
				DOM.elEdit.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

				DOM.elVideoInteractive.classList.remove('cursor-grab');
				DOM.elVideoInteractive.classList.add('cursor-pointer');
				Game.editorCellHighlightEnable = true;
				Game.modeEditType = EditType.INSPECT;
			}
		};

		DOM.elButtonMove.onclick = () => {
			if (DOM.elButtonMove.classList.contains('active') !== true) {
				DOM.elButtonApply.classList.remove('active');
				DOM.elButtonInspect.classList.remove('active');
				DOM.elButtonMove.classList.add('active');

				if (DOM.elEditorItemActive !== undefined) {
					DOM.elEditorItemActive.classList.remove('active');
				}

				DOM.elEdit.style.display = 'none';
				DOM.elVideoInteractive.classList.add('cursor-grab');
				DOM.elVideoInteractive.classList.remove('cursor-pointer');
				Game.editorCellHighlightEnable = false;
				Game.modeEditType = EditType.PAN_ZOOM;
			}
		};

		DOM.elButtonUpload.onclick = () => {
			DOM.elFile.oncancel = () => {
				DOM.elButtonUpload.classList.remove('active');
			};
			DOM.elFile.onchange = (data: any) => {
				if (data.target.files.length === 0) {
					DOM.elButtonUpload.classList.remove('active');
					return;
				}
				DOM.spinner(true);

				setTimeout(() => {
					const fileReader: FileReader = new FileReader();

					fileReader.onloadend = () => {
						try {
							const parsed: GameMap = Assets.mapParse(JSON.parse(atob(<string>fileReader.result))),
								parsed2: GameMap = Assets.mapParse(JSON.parse(atob(<string>fileReader.result)));

							// Adjust
							Game.camera.r = parsed.position.r;
							Game.camera.x = parsed.position.x;
							Game.camera.y = parsed.position.y;
							Game.camera.z = parsed.position.z;
							Game.map = parsed;
							Game.mapBackup = parsed2;
							Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
							Game.mapEnded = false;
							Game.mapEnding = false;

							// Done
							Game.gameOver = false;
							Game.mapNew = true;

							DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];

							CalcMainBus.outputMap(parsed);
							CalcPathBus.outputMap(parsed);
							VideoEditorBus.outputMap(parsed);
							VideoMainBus.outputMap(parsed);
							VideoOverlayBus.outputReset();
						} catch (error) {
							console.error('upload failed with', error);

							DOM.error();
						}

						setTimeout(() => {
							CalcMainBus.outputMetaReset();

							DOM.elButtonUpload.classList.remove('active');
							DOM.spinner(false);
						}, 250);
					};
					fileReader.readAsBinaryString(data.target.files[0]);
				}, 250);
			};
			DOM.elButtonUpload.classList.add('active');
			DOM.elFile.click();
		};

		// Editor commands
		DOM.elEditorCommandFindAndReplace.onclick = () => {
			DOM.elEditorFindAndReplaceValueFind.value = Game.editorCellValue.toString(16).padStart(4, '0');
			DOM.elEditorFindAndReplaceValueReplace.value = '';
			DOM.elEditorFindAndReplace.style.display = 'flex';
			Game.inputSuspend = true;
		};

		DOM.elEditorFindAndReplaceApply.onclick = () => {
			let cell: number,
				data: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = Game.map.grid.data,
				find: number = parseInt(DOM.elEditorFindAndReplaceValueFind.value, 16),
				i: number,
				replace: number = parseInt(DOM.elEditorFindAndReplaceValueReplace.value, 16);

			for ([i, cell] of data.entries()) {
				if (cell === find) {
					data[i] = replace;
				}
			}

			CalcMainBus.outputMap(Game.map);
			CalcPathBus.outputMap(Game.map);
			VideoEditorBus.outputMap(Game.map);
			VideoMainBus.outputMap(Game.map);

			DOM.elEditorFindAndReplace.style.display = 'none';
			Game.inputSuspend = false;
			Game.tagRunAndJump = false;
		};

		DOM.elEditorFindAndReplaceCancel.onclick = () => {
			DOM.elEditorFindAndReplace.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elEditorCommandOptions.onclick = () => {
			Settings.setMapOptions(false);
			DOM.elMapOptions.style.display = 'block';
			Game.inputSuspend = true;
		};

		DOM.elEditorCommandResetMap.onclick = () => {
			// Convert map
			let npcById: Map<number, CharacterNPC> = Game.mapBackup.npcById;
			Game.mapBackup.npcById = <any>{};
			for (let [i, value] of npcById.entries()) {
				(<any>Game.mapBackup.npcById)[String(i)] = value;
			}

			const parsed: GameMap = Assets.mapParse(JSON.parse(Assets.mapToJSONString(Game.mapBackup)));

			// Restore map
			Game.gameOver = false;
			Game.map = parsed;
			Game.mapBackup.npcById = npcById;
			Game.mapBackupRestored = true;
			Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
			Game.mapEnded = false;
			Game.mapEnding = false;

			Game.camera.r = parsed.position.r;
			Game.camera.x = parsed.position.x;
			Game.camera.y = parsed.position.y;
			Game.camera.z = parsed.position.z;

			DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];

			CalcMainBus.outputMap(parsed);
			CalcPathBus.outputMap(parsed);
			VideoEditorBus.outputMap(parsed);
			VideoMainBus.outputMap(parsed);
			VideoOverlayBus.outputReset();

			setTimeout(() => {
				CalcMainBus.outputMetaReset();
			});
		};

		// Editor items
		DOM.elEditorPropertiesCellInputs.forEach((element: HTMLInputElement) => {
			element.onchange = () => {
				Game.cellApply();
			};
		});

		// Editor items: Characters
		DOM.elEditorItemsCharacters.forEach((element: HTMLElement) => {
			element.onclick = () => {
				if (DOM.elEditorItemActive !== element) {
					DOM.elEditorItemActive && DOM.elEditorItemActive.classList.remove('active');

					DOM.elEditorItemActive = element;

					DOM.elButtonApply.click();
					element.classList.add('active');

					// Containers
					DOM.elEditorProperties.classList.add('character');
					DOM.elEditorPropertiesCellContainer.style.display = 'none';
					DOM.elEditorPropertiesCharacterContainer.style.display = 'block';
					DOM.elEditorPropertiesCommandsCell.style.display = 'none';

					// Asset configuraiton
					Game.editorAssetCharacterId = Number(element.id.split('__')[1]);
					Game.editorAssetCharacterType = Number(element.id.split('__')[0]);
					Game.editorAssetPropertiesCharacter = (<any>assetsImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId);

					DOM.elEditorPropertiesCharacterInputAngle.value = String(
						Math.round(((Game.editorAssetPropertiesCharacter.angle || 0) * 180) / GamingCanvasConstPI_1_000),
					);
					// DOM.elEditorPropertiesCharacterInputDifficulty.value = String(GameDifficulty.EASY);
					// DOM.elEditorPropertiesCharacterInputFOV.value = String(Math.round(characterNPC.fov * 180 / GamingCanvasConstPI_1_000)) + '°';
					// DOM.elEditorPropertiesCharacterInputId.value = String(characterNPC.id);

					// Highlighter based on asset
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${(<any>Assets.dataImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}
			};
		});

		// Editor items: Objects (+Extended)
		DOM.elEditorItemsObjects.forEach((element: HTMLElement) => {
			element.onclick = () => {
				if (DOM.elEditorItemActive !== element) {
					DOM.elEditorItemActive && DOM.elEditorItemActive.classList.remove('active');

					DOM.elEditorItemActive = element;

					DOM.elButtonApply.click();
					element.classList.add('active');

					// Containers
					DOM.elEditorProperties.classList.remove('character');
					DOM.elEditorPropertiesCellContainer.style.display = 'block';
					DOM.elEditorPropertiesCharacterContainer.style.display = 'none';
					DOM.elEditorPropertiesCommandsCell.style.display = 'block';

					// Asset configuraiton
					Game.cellClear();
					Game.editorAssetIdImg = Number(element.id);
					Game.editorAssetProperties = <AssetPropertiesImage>assetsImages.get(Game.editorAssetIdImg);

					if (Game.editorAssetProperties.blocking === true) {
						DOM.elEditorPropertiesCellInputWallInvisible.checked = true;
					}

					switch (Game.editorAssetProperties.category) {
						case AssetImgCategory.EXTENDED:
							switch (Game.editorAssetIdImg) {
								case AssetIdImg.NULL:
									DOM.elEditorPropertiesCellInputFloor.checked = true;
									break;
								case AssetIdImg.SPRITE_ELEVATOR_DOOR:
								case AssetIdImg.SPRITE_METAL_DOOR:
									DOM.elEditorPropertiesCellInputDoor.checked = true;
									DOM.elEditorPropertiesCellInputSpriteFixedV.checked = true;
									DOM.elEditorPropertiesCellInputWallInvisible.checked = true;
									break;
								case AssetIdImg.SPRITE_METAL_LOCKED:
									DOM.elEditorPropertiesCellInputDoor.checked = true;
									DOM.elEditorPropertiesCellInputLocked1.checked = true;
									DOM.elEditorPropertiesCellInputSpriteFixedV.checked = true;
									DOM.elEditorPropertiesCellInputWallInvisible.checked = true;
									break;
								case AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN:
								case AssetIdImg.WALL_ELEVATOR_SWITCH_UP:
									DOM.elEditorPropertiesCellInputSwitch.checked = true;
									DOM.elEditorPropertiesCellInputWall.checked = true;
									break;
							}
							break;
						case AssetImgCategory.LIGHT:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							DOM.elEditorPropertiesCellInputLight.checked = true;
							break;
						case AssetImgCategory.SPRITE:
						case AssetImgCategory.SPRITE_PICKUP:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							break;
						case AssetImgCategory.TAG:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							break;
						case AssetImgCategory.WALL:
							DOM.elEditorPropertiesCellInputWall.checked = true;
							break;
						case AssetImgCategory.WAYPOINT:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							break;
					}
					Game.cellApply();

					// Highlighter based on asset
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${Assets.dataImage.get(Game.editorAssetIdImg)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}
			};
		});

		// Editor sections
		DOM.elEditorSectionCharacters.onclick = () => {
			if (DOM.elEditorSectionCharacters.classList.contains('active') !== true) {
				DOM.elEditorSectionCharacters.classList.add('active');
				DOM.elEditorSectionObjects.classList.remove('active');
				DOM.elEditorSectionExtended.classList.remove('active');

				DOM.elEditorContainerCharacters.style.display = 'block';
				DOM.elEditorContainerObjects.style.display = 'none';
				DOM.elEditorContainerExtended.style.display = 'none';
			}
		};
		DOM.elEditorSectionExtended.onclick = () => {
			if (DOM.elEditorSectionExtended.classList.contains('active') !== true) {
				DOM.elEditorSectionCharacters.classList.remove('active');
				DOM.elEditorSectionExtended.classList.add('active');
				DOM.elEditorSectionObjects.classList.remove('active');

				DOM.elEditorContainerCharacters.style.display = 'none';
				DOM.elEditorContainerObjects.style.display = 'none';
				DOM.elEditorContainerExtended.style.display = 'block';
			}
		};
		DOM.elEditorSectionObjects.onclick = () => {
			if (DOM.elEditorSectionObjects.classList.contains('active') !== true) {
				DOM.elEditorSectionCharacters.classList.remove('active');
				DOM.elEditorSectionExtended.classList.remove('active');
				DOM.elEditorSectionObjects.classList.add('active');

				DOM.elEditorContainerCharacters.style.display = 'none';
				DOM.elEditorContainerObjects.style.display = 'block';
				DOM.elEditorContainerExtended.style.display = 'none';
			}
		};

		// Fullscreen
		DOM.elButtonFullscreen.onclick = async () => {
			if (DOM.elButtonFullscreen.classList.contains('active') === true) {
				Game.fullscreen = false;
				await GamingCanvas.setFullscreen(false);
				await GamingCanvas.wakeLock(false);
			} else {
				Game.fullscreen = true;
				await GamingCanvas.setFullscreen(true, DOM.elGame);
				await GamingCanvas.wakeLock(true);
			}
		};
		GamingCanvas.setCallbackFullscreen((state: boolean) => {
			if (state === true) {
				DOM.elButtonFullscreen.classList.add('active');
				DOM.elButtonFullscreen.children[0].classList.remove('fullscreen');

				DOM.elButtonFullscreen.children[0].classList.add('fullscreen-exit');
			} else {
				DOM.elButtonFullscreen.classList.remove('active');
				DOM.elButtonFullscreen.children[0].classList.add('fullscreen');

				DOM.elButtonFullscreen.children[0].classList.remove('fullscreen-exit');

				// Game menu if not clicked() (EG Escape key)
				if (Game.fullscreen !== false) {
					Game.gameMenu(true);
				}
			}

			Game.fullscreen = state;
		});

		// Menu
		DOM.elInfoControls.onclick = () => {
			DOM.elLogo.classList.remove('open');
			DOM.elMenuContent.classList.remove('open');

			if (GamingCanvas.detectDevice() === true) {
				DOM.elControlsSubTouch.click();
			} else {
				DOM.elControlsSubKeyboard.click();
			}

			DOM.elSettingsCancel.click();

			DOM.elControls.style.display = 'block';
			Game.inputSuspend = true;

			if (Game.modeEdit === false) {
				Game.pause(true);
			}
		};

		DOM.elInfoGameMenu.onclick = () => {
			DOM.elLogo.classList.remove('open');
			DOM.elMenuContent.classList.remove('open');

			DOM.elControls.style.display = 'none';
			DOM.elSettingsCancel.click();

			Game.gameMenu(true);
		};

		DOM.elInfoMenu.onclick = () => {
			DOM.elLogo.classList.toggle('open');
			DOM.elMenuContent.classList.toggle('open');
		};

		DOM.elInfoSettings.onclick = () => {
			DOM.elLogo.classList.remove('open');
			DOM.elMenuContent.classList.remove('open');

			DOM.elControls.style.display = 'none';

			DOM.elSettingsSubGame.click();
			DOM.elSettings.style.display = 'block';
			Game.inputSuspend = true;

			if (Game.modeEdit === false) {
				Game.pause(true);
			}
		};

		document.addEventListener('click', (event: any) => {
			if (event.target.id !== DOM.elInfoMenu.id) {
				DOM.elLogo.classList.remove('open');
				DOM.elMenuContent.classList.remove('open');
			}
		});

		// Meta: Map
		DOM.elMapOptionsApply.onclick = () => {
			Settings.setMapOptions(true);
			DOM.elMapOptions.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elMapOptionsCancel.onclick = () => {
			Settings.setMapOptions(false);
			DOM.elMapOptions.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elMapOptionsLocation.onclick = () => {
			DOM.elMapOptionsValueStartingPositionR.value = String(((Game.camera.r * 180) / GamingCanvasConstPI_1_000) | 0);
			DOM.elMapOptionsValueStartingPositionX.value = String(Game.camera.x | 0);
			DOM.elMapOptionsValueStartingPositionY.value = String(Game.camera.y | 0);
		};

		// Mute
		DOM.elButtonMute.onclick = () => {
			if (DOM.elButtonMute.classList.contains('active') === true) {
				GamingCanvas.audioMute(true);
				DOM.elButtonMute.classList.remove('active');
				DOM.elButtonMute.children[0].classList.remove('volume');

				DOM.elButtonMute.children[0].classList.add('volume-mute');
			} else {
				GamingCanvas.audioMute(false);
				DOM.elButtonMute.classList.add('active');
				DOM.elButtonMute.children[0].classList.add('volume');

				DOM.elButtonMute.children[0].classList.remove('volume-mute');
			}
		};

		// Settings
		DOM.elSettingsSubAudio.onclick = () => {
			DOM.elSettingsBodyAudio.style.display = 'block';
			DOM.elSettingsBodyEditor.style.display = 'none';
			DOM.elSettingsBodyGame.style.display = 'none';
			DOM.elSettingsBodyGraphics.style.display = 'none';

			DOM.elSettingsSubAudio.classList.add('active');
			DOM.elSettingsSubEditor.classList.remove('active');
			DOM.elSettingsSubGame.classList.remove('active');
			DOM.elSettingsSubGraphics.classList.remove('active');
		};
		DOM.elSettingsValueAudioVolume.oninput = () => {
			GamingCanvas.audioVolumeGlobal(Number(DOM.elSettingsValueAudioVolume.value), GamingCanvasAudioType.ALL);
			DOM.elSettingsValueAudioVolumeReadout.value = (Number(DOM.elSettingsValueAudioVolume.value) * 100).toFixed(0) + '%';
		};
		DOM.elSettingsValueAudioVolumeEffect.oninput = () => {
			GamingCanvas.audioVolumeGlobal(Number(DOM.elSettingsValueAudioVolumeEffect.value), GamingCanvasAudioType.EFFECT);
			DOM.elSettingsValueAudioVolumeEffectReadout.value = (Number(DOM.elSettingsValueAudioVolumeEffect.value) * 100).toFixed(0) + '%';
		};
		DOM.elSettingsValueAudioVolumeMusic.oninput = () => {
			GamingCanvas.audioVolumeGlobal(Number(DOM.elSettingsValueAudioVolumeMusic.value), GamingCanvasAudioType.MUSIC);
			DOM.elSettingsValueAudioVolumeMusicReadout.value = (Number(DOM.elSettingsValueAudioVolumeMusic.value) * 100).toFixed(0) + '%';
		};

		DOM.elSettingsSubEditor.onclick = () => {
			DOM.elSettingsBodyAudio.style.display = 'none';
			DOM.elSettingsBodyEditor.style.display = 'block';
			DOM.elSettingsBodyGame.style.display = 'none';
			DOM.elSettingsBodyGraphics.style.display = 'none';

			DOM.elSettingsSubAudio.classList.remove('active');
			DOM.elSettingsSubEditor.classList.add('active');
			DOM.elSettingsSubGame.classList.remove('active');
			DOM.elSettingsSubGraphics.classList.remove('active');
		};

		DOM.elSettingsSubGame.onclick = () => {
			DOM.elSettingsBodyAudio.style.display = 'none';
			DOM.elSettingsBodyEditor.style.display = 'none';
			DOM.elSettingsBodyGame.style.display = 'block';
			DOM.elSettingsBodyGraphics.style.display = 'none';

			DOM.elSettingsSubAudio.classList.remove('active');
			DOM.elSettingsSubEditor.classList.remove('active');
			DOM.elSettingsSubGame.classList.add('active');
			DOM.elSettingsSubGraphics.classList.remove('active');
		};

		DOM.elSettingsSubGraphics.onclick = () => {
			DOM.elSettingsBodyAudio.style.display = 'none';
			DOM.elSettingsBodyEditor.style.display = 'none';
			DOM.elSettingsBodyGame.style.display = 'none';
			DOM.elSettingsBodyGraphics.style.display = 'block';

			DOM.elSettingsSubAudio.classList.remove('active');
			DOM.elSettingsSubEditor.classList.remove('active');
			DOM.elSettingsSubGame.classList.remove('active');
			DOM.elSettingsSubGraphics.classList.add('active');
		};

		DOM.elSettingsApply.onclick = () => {
			Settings.set(true);

			DOM.elSettings.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elSettingsCancel.onclick = () => {
			Settings.set(false);

			DOM.elSettings.style.display = 'none';
			Game.inputSuspend = false;
		};
	}

	public static initialize(): void {
		// Integrations
		Game.report = GamingCanvas.getReport();

		// GameMap
		Game.map = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_FLOOR_01))));
		Game.mapBackup = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_FLOOR_01))));
		Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
		Game.mapEnded = false;
		Game.mapEnding = false;

		Game.camera.r = Game.map.position.r;
		Game.camera.x = Game.map.position.x + 0.5;
		Game.camera.y = Game.map.position.y + 0.5;
		Game.camera.z = Game.map.position.z;

		Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];

		// Overlay
		if (GamingCanvas.getReport().orientation === GamingCanvasOrientation.PORTRAIT) {
			DOM.elPlayerOverlay1.classList.add('portrait');
			DOM.elPlayerOverlay2.classList.add('portrait');
		} else {
			DOM.elPlayerOverlay1.classList.remove('portrait');
			DOM.elPlayerOverlay2.classList.remove('portrait');
		}

		// Report
		GamingCanvas.setCallbackVisibility((state: boolean) => {
			if (state !== true) {
				Game.gameMenu(true, true);
			}
		});
		GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
			Game.report = report;
			Game.reportNew = true;

			if (report.orientation === GamingCanvasOrientation.PORTRAIT) {
				DOM.elPlayerOverlay1.classList.add('portrait');
				DOM.elPlayerOverlay2.classList.add('portrait');
			} else {
				DOM.elPlayerOverlay1.classList.remove('portrait');
				DOM.elPlayerOverlay2.classList.remove('portrait');
			}

			CalcMainBus.outputReport(report);
			VideoEditorBus.outputReport(report);
			VideoMainBus.outputReport(report);
			VideoOverlayBus.outputReport(report);
		});

		// Start inputs
		Game.processorBinder();
		Game.inputRequest = requestAnimationFrame(Game.processor);
	}

	private static processor(_: number): void {}

	private static processorBinder(): void {
		let camera: GamingCanvasGridCamera = Game.camera,
			cameraMoveX: number = 0,
			cameraMoveXOriginal: number = 0,
			cameraMoveY: number = 0,
			cameraMoveYOriginal: number = 0,
			cameraScratch: GamingCanvasGridCamera = new GamingCanvasGridCamera(),
			cameraXOriginal: number = 0,
			cameraYOriginal: number = 0,
			cameraZoom: number = Game.camera.z,
			cameraZoomMax: number = 15,
			cameraZoomMin: number = 0.5,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 0.3,
			characterPlayerInput: CalcMainBusInputDataPlayerInput = {
				player1: {
					action: false,
					fire: false,
					r: 0, // -1 to 1 (-1 is increase r)
					x: 0, // -1 to 1 (-1 is left)
					y: 0, // -1 to 1 (-1 is up)
				},
				player2: {
					action: false,
					fire: false,
					r: 0, // -1 to 1 (-1 is increase r)
					x: 0, // -1 to 1 (-1 is left)
					y: 0, // -1 to 1 (-1 is up)
				},
			},
			characterPlayerInputPlayer: CharacterInput,
			characterWalking: boolean | undefined,
			dataUpdated: boolean,
			doorLockedTimeout: ReturnType<typeof setTimeout>,
			down: boolean,
			downMode: boolean,
			downModeWheel: boolean,
			elEditStyle: CSSStyleDeclaration = DOM.elEdit.style,
			gridIndexPlayer1: number | undefined,
			gridIndexPlayer2: number | undefined,
			id: number,
			inputLimitPerMs: number = GamingCanvas.getInputLimitPerMs(),
			keyState: Map<string, boolean> = new Map(),
			modeEdit: boolean = Game.modeEdit,
			modeEditType: EditType = Game.modeEditType,
			player1: boolean,
			position1: GamingCanvasInputPosition,
			position2: GamingCanvasInputPosition,
			positions: GamingCanvasInputPosition[],
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
			queueInput: GamingCanvasInput | undefined,
			queueInputOverlay: GamingCanvasInputPosition,
			queueInputOverlays: GamingCanvasInputPosition[],
			queueTimestamp: number = -2025,
			report: GamingCanvasReport = Game.report,
			touchDistancePrevious: number,
			touchDistance: number,
			touchJoystickDeadBand: number = 0.2,
			touchJoystickSize: number = 150,
			touchJoystickSizeHalf: number = touchJoystickSize / 2,
			touchJoystickSizeQuarter: number = touchJoystickSize / 4,
			touchJoystickSizeEighth: number = touchJoystickSize / 8,
			touchJoystick1Show: boolean,
			touchJoystick1X: number,
			touchJoystick1XThumb: number,
			touchJoystick1Y: number,
			touchJoystick1YThumb: number,
			touchJoystick2Show: boolean,
			touchJoystick2X: number,
			touchJoystick2XThumb: number,
			touchJoystick2Y: number,
			touchJoystick2YThumb: number,
			updated: boolean,
			updatedR: boolean,
			viewport: GamingCanvasGridViewport = Game.viewport;

		// Calc: Action Door Open
		CalcMainBus.setCallbackActionDoor((data: CalcMainBusActionDoorState) => {
			VideoMainBus.outputActionDoor(data);
		});

		CalcMainBus.setCallbackActionDoorLocked((data: CalcMainBusOutputDataActionDoorLocked) => {
			VideoOverlayBus.outputLocked(data.player1, data.keys);

			for (let key of data.keys) {
				if (key === 1) {
					if (data.player1 === true) {
						(<HTMLElement>DOM.elPlayerOverlay1Key1.parentNode).classList.add('invalid');
					} else {
						(<HTMLElement>DOM.elPlayerOverlay2Key1.parentNode).classList.add('invalid');
					}
				} else {
					if (data.player1 === true) {
						(<HTMLElement>DOM.elPlayerOverlay1Key2.parentNode).classList.add('invalid');
					} else {
						(<HTMLElement>DOM.elPlayerOverlay2Key2.parentNode).classList.add('invalid');
					}
				}
			}

			clearTimeout(doorLockedTimeout);
			doorLockedTimeout = setTimeout(() => {
				(<HTMLElement>DOM.elPlayerOverlay1Key1.parentNode).classList.remove('invalid');
				(<HTMLElement>DOM.elPlayerOverlay1Key2.parentNode).classList.remove('invalid');
				(<HTMLElement>DOM.elPlayerOverlay2Key1.parentNode).classList.remove('invalid');
				(<HTMLElement>DOM.elPlayerOverlay2Key2.parentNode).classList.remove('invalid');
			}, 2000);
		});

		// Calc: Action Switch
		CalcMainBus.setCallbackActionSwitch((data: CalcMainBusOutputDataActionSwitch) => {
			Game.mapEnding = true;
			data.gridIndex !== -1 && VideoMainBus.outputActionSwitch(data);

			Game.switchAlt = data.gridSwitchAlt;
			Game.tagRunAndJump !== true && GamingCanvas.audioControlStopAll(GamingCanvasAudioType.EFFECT);

			CalcMainBus.outputPause(true);
			CalcPathBus.outputPause(true);
			VideoMainBus.outputPause(true);
			VideoOverlayBus.outputPause(true);

			setTimeout(() => {
				DOM.elIconsTop.classList.add('intro');
				DOM.screenControl(DOM.elScreenEnding);

				// Music
				if (Game.musicInstance !== null) {
					GamingCanvas.audioControlVolume(Game.musicInstance, 0, 1500);
				}
				setTimeout(async () => {
					if (Game.mapBackup.id % 10 === 8) {
						Game.gameMusicPlay(AssetIdAudio.AUDIO_MUSIC_EPISODE_END);
					} else {
						Game.gameMusicPlay(AssetIdAudio.AUDIO_MUSIC_END_OF_LEVEL);
					}
				}, 1500);
			}, 500);

			// Stats: Display
			if (Game.mapBackup.id % 10 === 8) {
				// Episode End
				DOM.elScreenEndingEpisodeImage1.style.display = 'block';
				// DOM.elScreenEndingEpisodeImage2.style.display = 'block';
				DOM.elScreenEndingFloorImage1.style.display = 'none';
				DOM.elScreenEndingFloorImage2.style.display = 'none';

				utilStringToHTML(DOM.elScreenEndingFloorBonus, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorCompleted, `You Win!`, true);
				utilStringToHTML(DOM.elScreenEndingFloorFloor, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorTime, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorTimePar, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorRatioKill, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorRatioSecret, ``, true);
				utilStringToHTML(DOM.elScreenEndingFloorRatioTreasure, ``, true);

				Game.mapEndingSkip = false;
				setTimeout(() => {
					Game.mapEnded = true;
				}, 3500);
			} else {
				// Stats
				let floor: number = (Game.mapBackup.id % 10) + 1,
					ratioKill: number = ((data.player1Meta.ratioKill + data.player2Meta.ratioKill) * 100) | 0,
					ratioSecret: number = ((data.player1Meta.ratioSecret + data.player2Meta.ratioSecret) * 100) | 0,
					ratioTreasure: number = ((data.player1Meta.ratioTreasure + data.player2Meta.ratioTreasure) * 100) | 0,
					timeInSPar: number = (Game.map.timeParInMS / 1000) | 0,
					timeInSPlayer = (data.player1Meta.timeInMS / 1000) | 0;

				// Image
				DOM.elScreenEndingEpisodeImage1.style.display = 'none';
				DOM.elScreenEndingEpisodeImage2.style.display = 'none';
				DOM.elScreenEndingFloorImage1.style.display = 'block';
				DOM.elScreenEndingFloorImage2.style.display = 'block';

				// Stats: Display
				if (Game.mapBackup.id % 10 === 9) {
					// Secret floor
					utilStringToHTML(DOM.elScreenEndingFloorBonus, ` Completed`, true);
					utilStringToHTML(DOM.elScreenEndingFloorCompleted, `Secret Floor`, true);
					utilStringToHTML(DOM.elScreenEndingFloorFloor, ``, true);
					utilStringToHTML(DOM.elScreenEndingFloorTime, ``, true);
					utilStringToHTML(DOM.elScreenEndingFloorTimePar, ``, true);
					utilStringToHTML(DOM.elScreenEndingFloorRatioKill, ``, true);
					utilStringToHTML(DOM.elScreenEndingFloorRatioSecret, `${data.player1Meta.bonus} Bonus!   `, true);
					utilStringToHTML(DOM.elScreenEndingFloorRatioTreasure, ``, true);

					Game.mapEndingSkip = false;
					setTimeout(() => {
						Game.mapEnded = true;
					}, 2500);
				} else {
					// Normal floor
					utilStringToHTML(DOM.elScreenEndingFloorBonus, `Bonus`, true);
					utilStringToHTML(DOM.elScreenEndingFloorCompleted, `Completed`, true);
					utilStringToHTML(DOM.elScreenEndingFloorFloor, `Floor ${floor}`, true);
					utilStringToHTML(
						DOM.elScreenEndingFloorTime,
						` Time ${((timeInSPlayer / 60) | 0).toFixed(0).padStart(2, '0')}:${(timeInSPlayer % 60).toFixed(0).padStart(2, '0')}`,
						true,
					);
					utilStringToHTML(
						DOM.elScreenEndingFloorTimePar,
						`  Par ${((timeInSPar / 60) | 0).toFixed(0).padStart(2, '0')}:${(timeInSPar % 60).toFixed(0).padStart(2, '0')}`,
						true,
					);
					utilStringToHTML(DOM.elScreenEndingFloorRatioKill, `Kill Ratio    %`, true);
					utilStringToHTML(DOM.elScreenEndingFloorRatioSecret, `Secret Ratio    %`, true);
					utilStringToHTML(DOM.elScreenEndingFloorRatioTreasure, `Treasure Ratio    %`, true);

					setTimeout(() => {
						Game.mapEndingSkip = false;
						if (data.player1Meta.bonus === 0) {
							Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_NONE);
						} else {
							Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE);
						}
						utilStringToHTML(DOM.elScreenEndingFloorBonus, `Bonus ${data.player1Meta.bonus}`, true);

						setTimeout(
							() => {
								if (Game.mapEndingSkip !== true) {
									if (ratioKill === 0) {
										Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_NONE);
									} else if (ratioKill < 10) {
										Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE);
									} else {
										Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_MULTIPLE);
									}
								}
								utilStringToHTML(DOM.elScreenEndingFloorRatioKill, `Kill Ratio ${String(ratioKill).padStart(3, ' ')}%`, true);

								setTimeout(
									() => {
										if (Game.mapEndingSkip !== true) {
											if (ratioSecret === 0) {
												Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_NONE);
											} else if (ratioSecret < 10) {
												Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE);
											} else {
												Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_MULTIPLE);
											}
										}
										utilStringToHTML(DOM.elScreenEndingFloorRatioSecret, `Secret Ratio ${String(ratioSecret).padStart(3, ' ')}%`, true);

										setTimeout(
											() => {
												if (Game.mapEndingSkip !== true) {
													if (ratioTreasure === 0) {
														Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_NONE);
													} else if (ratioTreasure < 10) {
														Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE);
													} else {
														Game.gameMenuActionPlay(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_MULTIPLE);
													}
												}
												utilStringToHTML(
													DOM.elScreenEndingFloorRatioTreasure,
													`Treasure Ratio ${String(ratioTreasure).padStart(3, ' ')}%`,
													true,
												);
												Game.mapEnded = true;
											},
											Game.mapEndingSkip === true ? 0 : 1000,
										);
									},
									Game.mapEndingSkip === true ? 0 : 1000,
								);
							},
							<any>Game.mapEndingSkip === true ? 0 : 1000,
						);
					}, 2500);
				}
			}
		});

		CalcMainBus.setCallbackActionTag((data: CalcMainBusOutputDataActionTag) => {
			VideoMainBus.outputActionTag(data);
			if ((Game.map.grid.data[data.gridIndex] & GameGridCellMasksAndValues.TAG_RUN_AND_JUMP) !== 0) {
				Game.tagRunAndJump = true;

				setTimeout(() => {
					// Stop all audio for the end animation
					// Normally the callback back for ActionSwitch does this
					// But that would cut off the "yeah!" audio at the end
					GamingCanvas.audioControlStopAll(GamingCanvasAudioType.EFFECT);
				}, 3000);
			}
		});

		// Calc: Action Wall Move
		CalcMainBus.setCallbackActionWallMove((data: CalcMainBusOutputDataActionWallMove) => {
			CalcPathBus.outputActionWallMove(data);
			VideoMainBus.outputActionWallMove(data);
		});

		// Calc: Audio
		CalcMainBus.setCallbackAudio(async (data: CalcMainBusOutputDataAudio) => {
			if (data.assetId !== undefined) {
				const instance: number | null = await GamingCanvas.audioControlPlay(
					data.assetId,
					GamingCanvasAudioType.EFFECT,
					false,
					data.pan,
					0,
					data.volume,
					(instance: number) => {
						CalcMainBus.outputAudioStop({
							instance: instance,
							request: data.request,
						});
					},
				);
				CalcMainBus.outputAudioStart({
					instance: instance,
					request: data.request,
				});
			} else if (data.instance !== undefined) {
				if (data.stop === true) {
					GamingCanvas.audioControlStop(data.instance);
				} else {
					if (data.pan !== undefined) {
						GamingCanvas.audioControlPan(data.instance, data.pan);
					}
					if (data.volume !== undefined) {
						GamingCanvas.audioControlVolume(data.instance, data.volume);
					}
				}
			}
		});

		// Calc: Camera Mode
		CalcMainBus.setCallbackCamera((data: CalcMainBusOutputDataCamera) => {
			camera.decode(data.camera);

			// First: VideoEditor
			VideoEditorBus.outputCalculations({
				camera: camera.encode(),
				player1Camera: data.player1Camera,
				player2Camera: data.player2Camera,
				gameMode: false,
				viewport: viewport.encode(),
				timestampUnix: data.timestampUnix,
			});

			// Second: VideoMain
			VideoMainBus.outputCalculations(true, {
				camera: Float64Array.from(data.camera),
				edit: true,
				rays: Float64Array.from(data.rays),
				raysMap: data.raysMap,
				raysMapKeysSorted: Float64Array.from(data.raysMapKeysSorted),
				timestampUnix: data.timestampUnix,
			});
			VideoMainBus.outputCalculations(false, {
				camera: data.camera,
				edit: true,
				rays: data.rays,
				raysMap: data.raysMap,
				raysMapKeysSorted: data.raysMapKeysSorted,
				timestampUnix: data.timestampUnix,
			});
		});

		// Calc: Game Mode
		CalcMainBus.setCallbackCalculations((data: CalcMainBusOutputDataCalculations) => {
			if (data.characterPlayer1Camera !== undefined) {
				camera.decode(data.characterPlayer1Camera);
				camera.z = Game.map.position.z;

				if (cameraZoom !== camera.z) {
					cameraZoom = camera.z;
					viewport.applyZ(camera, report);
				}
				viewport.apply(camera);

				gridIndexPlayer1 = (camera.x | 0) * Game.map.grid.sideLength + (camera.y | 0);

				// First: VideoMain
				VideoMainBus.outputCalculations(true, {
					camera: camera.encode(),
					cameraAlt: data.characterPlayer2Camera !== undefined ? Float64Array.from(data.characterPlayer2Camera) : undefined, // Clone
					rays: <Float64Array>data.characterPlayer1Rays,
					raysMap: <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>data.characterPlayer1RaysMap,
					raysMapKeysSorted: <Float64Array>data.characterPlayer1RaysMapKeysSorted,
					timestampUnix: data.timestampUnix,
				});

				// Second: VideoEditor
				VideoEditorBus.outputCalculations({
					camera: camera.encode(),
					player1Camera: Float64Array.from(data.characterPlayer1Camera),
					player2Camera: data.characterPlayer2Camera !== undefined ? Float64Array.from(data.characterPlayer2Camera) : undefined, // Clone
					gameMode: true,
					viewport: viewport.encode(),
					timestampUnix: data.timestampUnix,
				});
			} else {
				gridIndexPlayer1 = undefined;

				// Second: VideoEditor
				VideoEditorBus.outputCalculations({
					camera: camera.encode(),
					player2Camera: data.characterPlayer2Camera !== undefined ? Float64Array.from(data.characterPlayer2Camera) : undefined, // Clone
					gameMode: true,
					viewport: viewport.encode(),
					timestampUnix: data.timestampUnix,
				});
			}

			if (data.characterPlayer2Camera !== undefined) {
				cameraScratch.decode(data.characterPlayer2Camera);

				gridIndexPlayer2 = (cameraScratch.x | 0) * Game.map.grid.sideLength + (cameraScratch.y | 0);

				VideoMainBus.outputCalculations(false, {
					camera: data.characterPlayer2Camera,
					cameraAlt: data.characterPlayer1Camera,
					rays: <Float64Array>data.characterPlayer2Rays,
					raysMap: <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>data.characterPlayer2RaysMap,
					raysMapKeysSorted: <Float64Array>data.characterPlayer2RaysMapKeysSorted,
					timestampUnix: data.timestampUnix,
				});
			} else {
				gridIndexPlayer2 = undefined;
			}

			CalcPathBus.outputPlayerUpdate({
				player1GridIndex: gridIndexPlayer1,
				player2GridIndex: gridIndexPlayer2,
			});
		});

		// Calc: NPCs
		CalcMainBus.setCallbackCharacterMeta((data: CalcMainBusOutputDataCharacterMeta) => {
			let character: Character;

			if (data.player1 !== undefined) {
				character = CharacterMetaDecode(data.player1);

				utilStringToHTML(DOM.elPlayerOverlay1Ammo, String(character.ammo));
				utilStringToHTML(DOM.elPlayerOverlay1Health, String(character.health) + '%');

				DOM.elPlayerOverlay1Key1.style.display = character.key1 === true ? 'block' : 'none';
				DOM.elPlayerOverlay1Key2.style.display = character.key2 === true ? 'block' : 'none';

				utilStringToHTML(DOM.elPlayerOverlay1Lives, String(character.lives));
			}

			if (data.player2 !== undefined) {
				character = CharacterMetaDecode(data.player2);

				utilStringToHTML(DOM.elPlayerOverlay2Ammo, String(character.ammo));
				utilStringToHTML(DOM.elPlayerOverlay2Health, String(character.health) + '%');

				DOM.elPlayerOverlay2Key1.style.display = character.key1 === true ? 'block' : 'none';
				DOM.elPlayerOverlay2Key2.style.display = character.key2 === true ? 'block' : 'none';

				utilStringToHTML(DOM.elPlayerOverlay2Lives, String(character.lives));
			}
		});

		// Calc: Game Over
		CalcMainBus.setCallbackGameover(() => {
			Game.gameOver = true;

			DOM.elPlayerJoystick1.classList.remove('show');
			DOM.elPlayerJoystick2.classList.remove('show');

			if (Game.musicInstance !== null) {
				GamingCanvas.audioControlVolume(Game.musicInstance, 0, (CalcMainBusPlayerDeadFallDurationInMS / 2) | 0, (instance: number) => {
					GamingCanvas.audioControlStop(instance);
				});
			}

			CalcMainBus.outputPause(true);
			CalcPathBus.outputPause(true);
			VideoMainBus.outputPause(true);

			VideoOverlayBus.outputGameOver();
		});

		// Calc: NPCs
		CalcMainBus.setCallbackNPCUpdate((data: CalcMainBusOutputDataNPCUpdate) => {
			CalcPathBus.outputNPCUpdate(data); // Clones
			VideoMainBus.outputNPCUpdate(data); // Clones
			VideoEditorBus.outputNPCUpdate(data);
		});

		// Calc: Player died
		CalcMainBus.setCallbackPlayerDied((player1: boolean) => {
			VideoMainBus.outputPlayerDead(player1);
			VideoOverlayBus.outputPlayerDead(player1);
		});

		// Calc: Player hit
		CalcMainBus.setCallbackPlayerHit((data: CalcMainBusOutputDataPlayerHit) => {
			VideoOverlayBus.outputPlayerHit(data.angle, data.player1);
		});

		// Calc: Weapon Fire
		CalcMainBus.setCallbackSave((data: CalcMainBusOutputDataWeaponSave) => {
			if (Game.gameMenuSlotSaveId !== undefined) {
				localStorage.setItem(Game.localStoragePrefix + 'map-' + Game.gameMenuSlotSaveId, data.mapRaw);
				localStorage.setItem(Game.localStoragePrefix + 'map-meta-' + Game.gameMenuSlotSaveId, data.metaRaw);
				Game.gameMenuSlotSaveId = undefined;
			}
		});

		// Calc: Weapon Fire
		CalcMainBus.setCallbackWeaponFire((data: CalcMainBusOutputDataWeaponFire) => {
			VideoMainBus.weaponFire(data.player1, data.refire);
		});

		// Calc: Weapon Selection
		CalcMainBus.setCallbackWeaponSelect((data: CalcMainBusOutputDataWeaponSelect) => {
			VideoMainBus.weaponSelect(data);
		});

		// Calc: Paths
		CalcPathBus.setCallbackPathUpdate((data: Map<number, number[]>) => {
			CalcMainBus.outputPathUpdate(data);
			VideoEditorBus.outputPathUpdate(data);
		});

		// Camera
		setInterval(() => {
			if (updated === true || updatedR === true || Game.reportNew === true || Game.mapBackupRestored === true) {
				Game.mapBackupRestored = false;
				report = Game.report;

				if (Game.reportNew === true) {
					viewport.updateReport(report);
				}

				if (modeEdit === true) {
					// Calc: Camera Mode
					if (Game.editorHide === true) {
						CalcMainBus.outputCamera({
							camera: camera.encode(),
							input: characterPlayerInput,
						});
					} else {
						// Zoom
						if (camera.z !== cameraZoom) {
							camera.z = cameraZoom;
							viewport.applyZ(camera, report);
						} else if (Game.reportNew !== true && (updated === true || updatedR !== true)) {
							camera.x = cameraXOriginal + (cameraMoveX - cameraMoveXOriginal) * viewport.width;
							camera.y = cameraYOriginal + (cameraMoveY - cameraMoveYOriginal) * viewport.height;
						}
						viewport.apply(camera);

						CalcMainBus.outputCamera({
							camera: camera.encode(),
						});

						characterPlayerInput.player1.r = 0;
						characterPlayerInput.player1.x = 0;
						characterPlayerInput.player1.y = 0;
					}
				} else {
					// Calc: Game Mode
					CalcMainBus.outputCharacterInput(characterPlayerInput);
				}

				updated = false;
				updatedR = false;
				Game.reportNew = false;
			}
		}, inputLimitPerMs);

		// Data
		setInterval(() => {
			if (dataUpdated === true || Game.mapUpdated === true) {
				dataUpdated = false;
				Game.mapUpdated = false;
				Game.tagRunAndJump = false;

				CalcMainBus.outputMap(Game.map);
				CalcPathBus.outputMap(Game.map);
				VideoEditorBus.outputMap(Game.map);
				VideoMainBus.outputMap(Game.map);
			}
		}, 100);

		const cheatCodeCheck = (player1: boolean, gamepad?: boolean) => {
			if (gamepad === true || (keyState.get('KeyI') === true && keyState.get('KeyL') === true && keyState.get('KeyM') === true)) {
				CalcMainBus.outputCheatCode(player1);
			}
		};

		const dataApply = (position: GamingCanvasInputPosition, erase?: boolean) => {
			const cooridnate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

			if (erase === true) {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					Game.map.npcById.delete(cooridnate.x * Game.map.grid.sideLength + cooridnate.y);
				} else {
					Game.mapEditor.singleErase(cooridnate.x * Game.map.grid.sideLength + cooridnate.y);
				}
			} else {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					// Character
					id = cooridnate.x * Game.map.grid.sideLength + cooridnate.y;

					switch (Game.editorAssetCharacterId) {
						case AssetIdImgCharacter.STAND_E:
						case AssetIdImgCharacter.STAND_N:
						case AssetIdImgCharacter.STAND_NE:
						case AssetIdImgCharacter.STAND_NW:
						case AssetIdImgCharacter.STAND_S:
						case AssetIdImgCharacter.STAND_SE:
						case AssetIdImgCharacter.STAND_SW:
						case AssetIdImgCharacter.STAND_W:
							characterWalking = undefined;
							break;
						default:
							characterWalking = true;
							break;
					}

					Game.map.npcById.set(id, {
						assetId: Game.editorAssetCharacterId,
						camera: new GamingCanvasGridCamera(Game.editorAssetPropertiesCharacter.angle || 0, cooridnate.x + 0.5, cooridnate.y + 0.5, 1),
						cameraPrevious: <GamingCanvasGridICamera>{},
						difficulty: Number(DOM.elEditorPropertiesCharacterInputDifficulty.value),
						gridIndex: id,
						fov: (120 * GamingCanvasConstPI_1_000) / 180,
						fovDistanceMax: 20,
						health: 100,
						id: id,
						seenAngleById: new Map(),
						seenDistanceById: new Map(),
						seenLOSById: new Map(),
						size: 0.25,
						timestamp: 0,
						timestampPrevious: 0,
						timestampUnixState: 0,
						type: Game.editorAssetCharacterType,
						walking: characterWalking,
					});

					DOM.elEditorPropertiesCharacterInputId.value = String(id);
					DOM.elEditorPropertiesCharacterInputFOV.value = String(120) + '°';
				} else {
					// Cell
					switch (Game.modeEditApplyType) {
						case EditApplyType.FILL:
							Game.mapEditor.fillApply(cooridnate.x * Game.map.grid.sideLength + cooridnate.y, Game.editorCellValue);
							break;
						case EditApplyType.PENCIL:
							Game.mapEditor.singleApply(cooridnate.x * Game.map.grid.sideLength + cooridnate.y, Game.editorCellValue);
							break;
					}
				}
			}

			dataUpdated = true;
		};

		const inspect = (position: GamingCanvasInputPosition) => {
			let clicked: boolean = false,
				element: HTMLElement;

			down = false;
			downMode = false;

			if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
				const coordinate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

				const characterNPC: CharacterNPC | undefined = Game.map.npcById.get(coordinate.x * Game.map.grid.sideLength + coordinate.y);

				if (characterNPC === undefined) {
					DOM.elEditorSectionObjects.click();
					inspect(position);
					return;
				}

				// Click associated asset
				DOM.elEditorSectionCharacters.click();
				for (element of DOM.elEditorItemsCharacters) {
					if (element.id === `${characterNPC.type}__${characterNPC.assetId}`) {
						clicked = true;
						DOM.elEditorItemActive = undefined;
						element.click();
						element.scrollIntoView({ behavior: 'smooth' });
						break;
					}
				}

				// Containers
				DOM.elEditorProperties.classList.add('character');
				DOM.elEditorPropertiesCellContainer.style.display = 'none';
				DOM.elEditorPropertiesCharacterContainer.style.display = 'block';
				DOM.elEditorPropertiesCommandsCell.style.display = 'none';

				DOM.elButtonApply.click();

				// Asset configuraiton
				Game.editorAssetCharacterId = <any>characterNPC.assetId;
				Game.editorAssetCharacterType = characterNPC.type;
				Game.editorAssetPropertiesCharacter = (<any>assetsImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId);

				DOM.elEditorPropertiesCharacterInputAngle.value = String(
					Math.round(((Game.editorAssetPropertiesCharacter.angle || 0) * 180) / GamingCanvasConstPI_1_000),
				);
				DOM.elEditorPropertiesCharacterInputDifficulty.value = String(characterNPC.difficulty);
				DOM.elEditorPropertiesCharacterInputFOV.value = String(Math.round((characterNPC.fov * 180) / GamingCanvasConstPI_1_000)) + '°';
				DOM.elEditorPropertiesCharacterInputId.value = String(characterNPC.id);

				if (clicked === false) {
					// Highlighter based on asset
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${(<any>Assets.dataImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}
			} else {
				const cell: number | undefined = Game.map.grid.getBasic(GamingCanvasGridInputToCoordinate(position, viewport));

				if (cell === undefined) {
					return;
				}

				const assetId: number = cell & GameGridCellMasksAndValues.ID_MASK;
				const assetIdStr: String = String(assetId);

				// Values
				Game.editorAssetIdImg = assetId;
				Game.editorAssetProperties = <AssetPropertiesImage>assetsImages.get(Game.editorAssetIdImg);

				if (Game.editorAssetProperties.category === AssetImgCategory.EXTENDED) {
					DOM.elEditorSectionExtended.click();
				} else {
					DOM.elEditorSectionObjects.click();
				}
				if (cell === GameGridCellMasksAndValues.FLOOR) {
					// Containers
					DOM.elEditorProperties.classList.remove('character');
					DOM.elEditorPropertiesCellContainer.style.display = 'block';
					DOM.elEditorPropertiesCharacterContainer.style.display = 'none';
					DOM.elEditorPropertiesCommandsCell.style.display = 'block';
				} else {
					// Click associated asset
					for (element of DOM.elEditorItemsObjects) {
						if (element.id === assetIdStr) {
							clicked = true;
							DOM.elEditorItemActive = undefined;
							element.click();
							element.scrollIntoView({ behavior: 'smooth' });
							break;
						}
					}
				}

				if (clicked === false) {
					// Asset based
					DOM.elButtonApply.click();
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${Assets.dataImage.get(Game.editorAssetIdImg)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}

				// Apply
				DOM.elEditorPropertiesCellInputDisabled.checked = (cell & GameGridCellMasksAndValues.DISABLED) !== 0;
				DOM.elEditorPropertiesCellInputDoor.checked = (cell & GameGridCellMasksAndValues.DOOR) !== 0;
				DOM.elEditorPropertiesCellInputFloor.checked = (cell & GameGridCellMasksAndValues.FLOOR) !== 0;
				DOM.elEditorPropertiesCellInputLight.checked = (cell & GameGridCellMasksAndValues.LIGHT) !== 0;
				DOM.elEditorPropertiesCellInputLocked1.checked = (cell & GameGridCellMasksAndValues.LOCKED_1) !== 0;
				DOM.elEditorPropertiesCellInputLocked2.checked = (cell & GameGridCellMasksAndValues.LOCKED_2) !== 0;
				DOM.elEditorPropertiesCellInputSpriteFixedH.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_NS) !== 0;

				if (DOM.elEditorPropertiesCellInputSpriteFixedH.checked === true) {
					DOM.elEditorPropertiesCellInputSpriteFixedV.checked = false;
				} else {
					DOM.elEditorPropertiesCellInputSpriteFixedV.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0;
				}
				DOM.elEditorPropertiesCellInputSwitch.checked = (cell & GameGridCellMasksAndValues.SWITCH) !== 0;
				DOM.elEditorPropertiesCellInputSwitchSecret.checked = (cell & GameGridCellMasksAndValues.SWITCH_SECRET) !== 0;
				DOM.elEditorPropertiesCellInputTagRunAndJump.checked = (cell & GameGridCellMasksAndValues.TAG_RUN_AND_JUMP) !== 0;
				DOM.elEditorPropertiesCellInputWall.checked = (cell & GameGridCellMasksAndValues.WALL) !== 0;
				DOM.elEditorPropertiesCellInputWallInvisible.checked = (cell & GameGridCellMasksAndValues.WALL_INVISIBLE) !== 0;
				DOM.elEditorPropertiesCellInputWallMovable.checked = (cell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0;
				Game.cellApply();
			}
		};

		const positionMeta = (position: GamingCanvasInputPosition) => {
			Game.position = GamingCanvasGridInputToCoordinate(position, viewport, Game.position);
			DOM.elEditorPropertiesCellOutputIndex.innerText = String((Game.position.x | 0) * Game.map.grid.sideLength + (Game.position.y | 0)).padStart(4, '0');
			DOM.elEditorPropertiesCellOutputPosition.innerText = `(${String(Game.position.x).padStart(3, '0')}, ${String(Game.position.y).padStart(3, '0')}) ${((camera.r * 180) / GamingCanvasConstPI_1_000) | 0}°`;
		};

		const processor = (timestampNow: number) => {
			Game.inputRequest = requestAnimationFrame(processor);

			if (timestampNow - queueTimestamp > inputLimitPerMs) {
				queueTimestamp = timestampNow;

				// Update temporary values
				modeEdit = Game.modeEdit;
				modeEditType = Game.modeEditType;

				if (Game.mapNew === true) {
					Game.mapNew = false;

					camera = Game.camera;
					cameraZoom = camera.z;
					characterPlayerInput.player1.action = false;
					characterPlayerInput.player1.fire = false;
					characterPlayerInput.player1.r = 0;
					characterPlayerInput.player1.x = 0;
					characterPlayerInput.player1.y = 0;
					characterPlayerInput.player2.action = false;
					characterPlayerInput.player2.fire = false;
					characterPlayerInput.player2.r = 0;
					characterPlayerInput.player2.x = 0;
					characterPlayerInput.player2.y = 0;
					dataUpdated = false;
					updated = false;
					updatedR = true;

					Game.reportNew = true;
				}

				while (queue.length !== 0) {
					queueInput = <GamingCanvasInput>queue.pop();

					if (Game.inputSuspend === true) {
						continue;
					}

					if (Game.mapEnded === true) {
						if (queueInput.type !== GamingCanvasInputType.MOUSE) {
							Game.loadNextLevel();
						}
						continue;
					} else if (Game.mapEnding === true) {
						if (queueInput.type !== GamingCanvasInputType.MOUSE) {
							Game.mapEndingSkip = true;
						}
						continue;
					}

					switch (queueInput.type) {
						case GamingCanvasInputType.GAMEPAD:
							processorGamepad(queueInput);
							break;
						case GamingCanvasInputType.KEYBOARD:
							processorKeyboard(queueInput);
							break;
						case GamingCanvasInputType.MOUSE:
							queueInputOverlay = GamingCanvasInputPositionClone(queueInput.propriatary.position);
							GamingCanvas.relativizeInputToCanvas(queueInput);
							processorMouse(queueInput, queueInputOverlay);
							break;
						case GamingCanvasInputType.TOUCH:
							queueInputOverlays = GamingCanvasInputPositionsClone(queueInput.propriatary.positions);
							GamingCanvas.relativizeInputToCanvas(queueInput);
							processorTouch(queueInput, queueInputOverlays);
							break;
					}
				}
			}
		};
		Game.processor = processor;

		const processorGamepad = (input: GamingCanvasInputGamepad) => {
			if (modeEdit !== true) {
				if (Game.settings.threadCalcMain.player2Enable === true) {
					if (Game.settings.gamePlayer2InputDevice === InputDevice.GAMEPAD) {
						characterPlayerInputPlayer = characterPlayerInput.player2;
						player1 = false;
					} else {
						characterPlayerInputPlayer = characterPlayerInput.player1;
						player1 = true;
					}
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player1;
					player1 = true;
				}
				characterPlayerInputPlayer.type === GamingCanvasInputType.GAMEPAD;

				if (Game.gameMenuActive === true) {
					if (input.propriatary.buttons !== undefined) {
						if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__DOWN] === true) {
							Game.gameMenuAction(GameMenuAction.DOWN);
						} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.A__X] === true) {
							Game.gameMenuAction(GameMenuAction.ENTER);
						} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.B__O] === true) {
							Game.gameMenuAction(GameMenuAction.ESC);
						} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__UP] === true) {
							Game.gameMenuAction(GameMenuAction.UP);
						}
					}
				} else {
					if (input.propriatary.axes !== undefined) {
						characterPlayerInputPlayer.x = input.propriatary.axes[0];
						characterPlayerInputPlayer.y = input.propriatary.axes[1];
						characterPlayerInputPlayer.r = input.propriatary.axes[2];
					}

					if (input.propriatary.buttons !== undefined) {
						if (
							input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.A__X] === true &&
							input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.B__O] === true &&
							input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.X__TRIANGE] === true &&
							input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.Y__SQUARE] === true
						) {
							cheatCodeCheck(player1, true);
						} else {
							characterPlayerInputPlayer.action =
								input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.A__X] ||
								input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.STICK__LEFT] ||
								false;
							characterPlayerInputPlayer.fire =
								input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.BUMPER__RIGHT] ||
								input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.STICK__RIGHT] ||
								false;

							if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__DOWN] === true) {
								CalcMainBus.weaponSelect(player1, CharacterWeapon.KNIFE);
							} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__LEFT] === true) {
								CalcMainBus.weaponSelect(player1, CharacterWeapon.SUB_MACHINE_GUN);
							} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__RIGHT] === true) {
								CalcMainBus.weaponSelect(player1, CharacterWeapon.MACHINE_GUN);
							} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.DPAD__UP] === true) {
								CalcMainBus.weaponSelect(player1, CharacterWeapon.PISTOL);
							} else if (input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.MENU__OPTIONS] === true) {
								Game.gameMenu();
							}
						}
					}
				}

				updated = true;
			}
		};

		const processorKeyboard = (input: GamingCanvasInputKeyboard) => {
			down = input.propriatary.down;
			keyState.set(input.propriatary.action.code, down);

			if (Game.gameMenuActive === true) {
				if (down === true) {
					switch (input.propriatary.action.code) {
						case 'ArrowDown':
						case 'KeyS':
							Game.gameMenuAction(GameMenuAction.DOWN);
							break;
						case 'ArrowUp':
						case 'KeyW':
							Game.gameMenuAction(GameMenuAction.UP);
							break;
						case 'Enter':
						case 'Space':
							Game.gameMenuAction(GameMenuAction.ENTER);
							break;
						case 'Escape':
							Game.gameMenuAction(GameMenuAction.ESC);
							break;
					}
				}
			} else if (modeEdit !== true || Game.editorHide === true) {
				if (Game.settings.threadCalcMain.player2Enable === true) {
					if (Game.settings.gamePlayer2InputDevice === InputDevice.KEYBOARD) {
						characterPlayerInputPlayer = characterPlayerInput.player2;
						player1 = false;
					} else {
						characterPlayerInputPlayer = characterPlayerInput.player1;
						player1 = true;
					}
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player1;
					player1 = true;
				}
				characterPlayerInputPlayer.type === GamingCanvasInputType.KEYBOARD;

				switch (input.propriatary.action.code) {
					case 'ArrowDown':
					case 'Space':
						if (down) {
							characterPlayerInputPlayer.action = true;
						} else if ((characterPlayerInputPlayer.action = true)) {
							characterPlayerInputPlayer.action = false;
						}
						updated = true;
						break;
					case 'ArrowLeft':
						if (down) {
							characterPlayerInputPlayer.r = -1;
						} else if (characterPlayerInputPlayer.r === -1) {
							characterPlayerInputPlayer.r = 0;
						}
						updated = true;
						break;
					case 'ArrowRight':
						if (down) {
							characterPlayerInputPlayer.r = 1;
						} else if (characterPlayerInputPlayer.r === 1) {
							characterPlayerInputPlayer.r = 0;
						}
						updated = true;
						break;
					case 'ArrowUp':
					case 'ShiftLeft':
						if (down) {
							characterPlayerInputPlayer.fire = true;
						} else if ((characterPlayerInputPlayer.fire = true)) {
							characterPlayerInputPlayer.fire = false;
						}
						updated = true;
						break;
					case 'Digit1':
						if (down) {
							CalcMainBus.weaponSelect(player1, CharacterWeapon.KNIFE);
						}
						break;
					case 'Digit2':
						if (down) {
							CalcMainBus.weaponSelect(player1, CharacterWeapon.PISTOL);
						}
						break;
					case 'Digit3':
						if (down) {
							CalcMainBus.weaponSelect(player1, CharacterWeapon.SUB_MACHINE_GUN);
						}
						break;
					case 'Digit4':
						if (down) {
							CalcMainBus.weaponSelect(player1, CharacterWeapon.MACHINE_GUN);
						}
						break;
					case 'Escape':
						Game.gameMenu();
						break;
					case 'KeyA':
						if (down) {
							characterPlayerInputPlayer.x = -1;
						} else if (characterPlayerInputPlayer.x === -1) {
							characterPlayerInputPlayer.x = 0;
						}
						updated = true;
						break;
					case 'KeyD':
						if (down) {
							characterPlayerInputPlayer.x = 1;
						} else if (characterPlayerInputPlayer.x === 1) {
							characterPlayerInputPlayer.x = 0;
						}
						updated = true;
						break;
					case 'KeyE':
						if (keyState.get('Tab') === true && down) {
							keyState.set('Tab', false);
							CalcMainBus.outputMapEnd();
						}
						break;
					case 'KeyF':
						if (keyState.get('Tab') === true && down) {
							keyState.set('Tab', false);
							alert(`GridIndex: ${(camera.x * Game.map.grid.sideLength + camera.y) | 0}
R: ${((camera.r * 180) / GamingCanvasConstPI_1_000) | 0}°
X: ${camera.x | 0}
Y: ${camera.y | 0}`);
						}
						break;
					case 'KeyH':
						if (keyState.get('Tab') === true && down) {
							keyState.set('Tab', false);
							CalcMainBus.outputDebugHit();
						}
						break;
					case 'KeyI':
					case 'KeyL':
					case 'KeyM':
						if (down) {
							cheatCodeCheck(player1);
						}
						break;
					case 'KeyW':
						if (keyState.get('Tab') === true && down) {
							keyState.set('Tab', false);
							keyState.set('KeyW', false);

							// Warp to level
							let level: number | string | null = prompt('Warp to level? [1-10]');
							if (level !== null) {
								level = Number(level);
								if (Number.isInteger(level) !== true || level < 1 || level > 10) {
									break;
								}
								Game.inputSuspend = true;
								Game.pause(true);
								GamingCanvas.audioControlStopAll(GamingCanvasAudioType.EFFECT);

								let assetIdMapNext: AssetIdMap = Game.mapBackup.id - (Game.mapBackup.id % 10) + (level - 1);

								// GameMap
								Game.map = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(assetIdMapNext))));
								Game.mapBackup = Assets.mapParse(JSON.parse(Assets.mapToJSONString(<GameMap>Assets.dataMap.get(assetIdMapNext))));
								Game.mapEditor = new GamingCanvasGridEditor(Game.map.grid);
								Game.mapEnded = false;
								Game.mapEnding = false;

								Game.camera.r = Game.map.position.r;
								Game.camera.x = Game.map.position.x + 0.5;
								Game.camera.y = Game.map.position.y + 0.5;
								Game.camera.z = Game.map.position.z;

								Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
								Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
								Game.viewport.apply(Game.camera, false);

								DOM.elEditorHandleEpisodeLevel.innerText = AssetIdMap[Game.mapBackup.id];
								Game.tagRunAndJump = false;

								Game.gameMusicPlay(Game.mapBackup.music);

								CalcMainBus.outputMap(Game.mapBackup);
								CalcPathBus.outputMap(Game.mapBackup);
								VideoEditorBus.outputMap(Game.mapBackup);
								VideoMainBus.outputMap(Game.mapBackup);
								VideoOverlayBus.outputReset();

								// End menu
								setTimeout(() => {
									DOM.elIconsTop.classList.remove('intro');
									Game.gameMenu(false);
									Game.started = true;
									Game.inputSuspend = false;
									Game.pause(false);
								}, 200);
							}
						} else {
							if (down) {
								characterPlayerInputPlayer.y = -1;
							} else if (characterPlayerInputPlayer.y === -1) {
								characterPlayerInputPlayer.y = 0;
							}
							updated = true;
						}
						break;
					case 'KeyS':
						if (down) {
							characterPlayerInputPlayer.y = 1;
						} else if (characterPlayerInputPlayer.y === 1) {
							characterPlayerInputPlayer.y = 0;
						}
						updated = true;
						break;
				}
			} else {
				switch (input.propriatary.action.code) {
					case 'KeyD':
						down === true && DOM.elButtonDownload.click();
						break;
					case 'KeyE':
						down === true && DOM.elButtonEraser.click();
						break;
					case 'KeyI':
						down === true && DOM.elButtonInspect.click();
						break;
					case 'KeyF':
						down === true && DOM.elEditorCommandFindAndReplace.click();
						break;
					case 'KeyM':
						down === true && DOM.elButtonMove.click();
						break;
					case 'KeyO':
						down === true && DOM.elEditorCommandOptions.click();
						break;
					case 'KeyR':
						if (down === true) {
							if (keyState.get('ShiftLeft') === true) {
								Game.map.npcById.clear();
								Game.map.grid.data.fill(0);
								Game.mapEditor.historyClear();
								dataUpdated = true;
							} else {
								DOM.elEditorCommandResetMap.click();
							}
						}
						break;
					case 'KeyU':
						down === true && DOM.elButtonUpload.click();
						break;
					case 'KeyY':
						if (keyState.get('ControlLeft') === true && down) {
							dataUpdated = Game.mapEditor.historyRedo();
						}
						break;
					case 'KeyZ':
						if (keyState.get('ControlLeft') === true && down) {
							dataUpdated = Game.mapEditor.historyUndo();
						}
						break;
				}
			}
		};

		const processorMouse = (input: GamingCanvasInputMouse, inputOverlayPosition: GamingCanvasInputPosition) => {
			position1 = input.propriatary.position;
			if (input.propriatary.down !== undefined) {
				down = input.propriatary.down;
			}
			if (position1.out) {
				down = false;
				downMode = false;
			}

			switch (input.propriatary.action) {
				case GamingCanvasInputMouseAction.LEFT:
					positionMeta(position1);
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							if (down === true) {
								cameraMoveXOriginal = 1 - position1.xRelative;
								cameraMoveYOriginal = 1 - position1.yRelative;
								cameraXOriginal = camera.x;
								cameraYOriginal = camera.y;
							}
						} else {
							if (down === true) {
								switch (modeEditType) {
									case EditType.APPLY:
										dataApply(position1);
										break;
									case EditType.ERASE:
										dataApply(position1, true);
										break;
									case EditType.INSPECT:
										inspect(position1);
										break;
								}
							}
						}
						downMode = down;
					}
					break;
				case GamingCanvasInputMouseAction.WHEEL:
					positionMeta(position1);
					if (modeEdit === true) {
						if (modeEditType !== EditType.PAN_ZOOM) {
							if (down === true) {
								cameraMoveXOriginal = 1 - position1.xRelative;
								cameraMoveYOriginal = 1 - position1.yRelative;
								cameraXOriginal = camera.x;
								cameraYOriginal = camera.y;
							}
						}
						downModeWheel = down;
					}
					break;
				case GamingCanvasInputMouseAction.MOVE:
					positionMeta(position1);
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							if (downMode === true) {
								cameraMoveX = 1 - position1.xRelative;
								cameraMoveY = 1 - position1.yRelative;
								updated = true;
							} else if (downModeWheel === true) {
								camera.r = position1.xRelative * 2 * GamingCanvasConstPI_1_000;
								updatedR = true;
							}
						} else {
							processorMouseCellHighlight(inputOverlayPosition);

							if (downModeWheel === true) {
								cameraMoveX = 1 - position1.xRelative;
								cameraMoveY = 1 - position1.yRelative;
								updated = true;
							}

							if (downMode === true) {
								switch (modeEditType) {
									case EditType.APPLY:
										dataApply(position1);
										break;
									case EditType.ERASE:
										dataApply(position1, true);
										break;
									case EditType.INSPECT:
										inspect(position1);
										break;
								}
							}
						}
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					if (modeEdit === true) {
						processorMouseCellHighlight(inputOverlayPosition);

						cameraZoomPrevious = cameraZoom;
						cameraZoom = Math.max(cameraZoomMin, Math.min(cameraZoomMax, cameraZoom + (down ? -cameraZoomStep : cameraZoomStep)));
						if (cameraZoom !== cameraZoomPrevious) {
							updated = true;
						}
					}
					break;
			}
		};

		const processorMouseCellHighlight = (position: GamingCanvasInputPosition) => {
			// Timeout allows for the viewport to be updated before the input before fitting the cell highlight
			if (Game.editorCellHighlightEnable === true) {
				setTimeout(() => {
					Game.positionCellHighlight = GamingCanvasGridInputOverlaySnapPxTopLeft(position, report, viewport, Game.positionCellHighlight);

					elEditStyle.display = 'block';
					elEditStyle.height = Game.positionCellHighlight.cellSizePx + 'px';
					elEditStyle.left = Game.positionCellHighlight.left + 'px';
					elEditStyle.top = Game.positionCellHighlight.top + 'px';
					elEditStyle.width = Game.positionCellHighlight.cellSizePx + 'px';
				}, inputLimitPerMs + 10);
			} else {
				elEditStyle.display = 'none';
			}
		};

		const processorTouch = (input: GamingCanvasInputTouch, inputOverlayPositions: GamingCanvasInputPosition[]) => {
			elEditStyle.display = 'none';
			positions = input.propriatary.positions;
			if (input.propriatary.down !== undefined) {
				down = input.propriatary.down;
			}

			if (Game.gameOver !== true && (modeEdit === false || Game.editorHide === true)) {
				characterPlayerInputPlayer = characterPlayerInput.player1;
				characterPlayerInputPlayer.type === GamingCanvasInputType.TOUCH;
				player1 = true;

				// Left Joystick
				position1 = <any>undefined;
				if (inputOverlayPositions.length !== 0 && inputOverlayPositions[0].xRelative < 0.5) {
					position1 = inputOverlayPositions[0];
				} else if (inputOverlayPositions.length > 1 && inputOverlayPositions[1].xRelative < 0.5) {
					position1 = inputOverlayPositions[1];
				}

				if (position1 !== undefined) {
					if (touchJoystick1Show !== true) {
						touchJoystick1X = Math.max(touchJoystickSizeHalf, position1.x);
						touchJoystick1Y = Math.min(report.canvasHeight * report.scaler - touchJoystickSizeHalf, position1.y);

						DOM.elPlayerJoystick1.style.left = touchJoystick1X - touchJoystickSizeHalf + 'px';
						DOM.elPlayerJoystick1.style.top = touchJoystick1Y - touchJoystickSizeHalf + 'px';

						DOM.elPlayerJoystick1Thumb.style.left = touchJoystick1X + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick1Thumb.style.top = touchJoystick1Y + touchJoystickSizeQuarter + 'px';
					} else {
						touchJoystick1XThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position1.x - touchJoystick1X));
						touchJoystick1YThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position1.y - touchJoystick1Y));

						DOM.elPlayerJoystick1Thumb.style.left = touchJoystick1XThumb + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick1Thumb.style.top = touchJoystick1YThumb + touchJoystickSizeQuarter + 'px';

						characterPlayerInputPlayer.x = (touchJoystick1XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf;
						// DOM.elDebug.innerText = `${((touchJoystick1XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						if (characterPlayerInputPlayer.x > -touchJoystickDeadBand && characterPlayerInputPlayer.x < touchJoystickDeadBand) {
							characterPlayerInputPlayer.x = 0;
						}

						characterPlayerInputPlayer.y = (touchJoystick1YThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf;
						// DOM.elDebug.innerText += `x${((touchJoystick1YThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						if (characterPlayerInputPlayer.y > -touchJoystickDeadBand && characterPlayerInputPlayer.y < touchJoystickDeadBand) {
							characterPlayerInputPlayer.y = 0;
						}

						updated = true;
					}

					DOM.elPlayerJoystick1.classList.add('show');
					touchJoystick1Show = true;
				} else {
					characterPlayerInputPlayer.action = false;
					characterPlayerInputPlayer.x = 0;
					characterPlayerInputPlayer.y = 0;
					updated = true;

					DOM.elPlayerJoystick1.classList.remove('show');
					touchJoystick1Show = false;
				}

				// Right Joystick
				position2 = <any>undefined;
				if (inputOverlayPositions.length !== 0 && inputOverlayPositions[0].xRelative >= 0.5) {
					position2 = inputOverlayPositions[0];
				} else if (inputOverlayPositions.length > 1 && inputOverlayPositions[1].xRelative >= 0.5) {
					position2 = inputOverlayPositions[1];
				}

				if (position2 !== undefined) {
					if (touchJoystick2Show !== true) {
						touchJoystick2X = Math.min(report.canvasWidth * report.scaler - touchJoystickSizeHalf, position2.x);
						touchJoystick2Y = Math.min(report.canvasHeight * report.scaler - touchJoystickSizeHalf, position2.y);

						DOM.elPlayerJoystick2.style.left = touchJoystick2X - touchJoystickSizeHalf + 'px';
						DOM.elPlayerJoystick2.style.top = touchJoystick2Y - touchJoystickSizeHalf + 'px';

						DOM.elPlayerJoystick2Thumb.style.left = touchJoystick2X + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick2Thumb.style.top = touchJoystick2Y + touchJoystickSizeQuarter + 'px';
					} else {
						touchJoystick2XThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position2.x - touchJoystick2X));
						touchJoystick2YThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position2.y - touchJoystick2Y));

						DOM.elPlayerJoystick2Thumb.style.left = touchJoystick2XThumb + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick2Thumb.style.top = touchJoystick2YThumb + touchJoystickSizeQuarter + 'px';

						characterPlayerInputPlayer.r = ((touchJoystick2XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf) * 1.1;
						// DOM.elDebug.innerHTML += `<br>${((touchJoystick2XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						// DOM.elDebug.innerText += `x${((touchJoystick2YThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						if (characterPlayerInputPlayer.r > -touchJoystickDeadBand && characterPlayerInputPlayer.r < touchJoystickDeadBand) {
							characterPlayerInputPlayer.r = 0;
						}

						if ((touchJoystick2YThumb / touchJoystickSizeHalf) * 2 > 1.9) {
							characterPlayerInputPlayer.action = true;
							DOM.elPlayerJoystick2Thumb.classList.add('press-green');
						} else {
							characterPlayerInputPlayer.action = false;
							DOM.elPlayerJoystick2Thumb.classList.remove('press-green');
						}

						if ((touchJoystick2YThumb / touchJoystickSizeHalf) * 2 < -0.9) {
							characterPlayerInputPlayer.fire = true;
							DOM.elPlayerJoystick2Thumb.classList.add('press-red');
						} else {
							characterPlayerInputPlayer.fire = false;
							DOM.elPlayerJoystick2Thumb.classList.remove('press-red');
						}

						updated = true;
					}

					DOM.elPlayerJoystick2.classList.add('show');
					touchJoystick2Show = true;
				} else {
					characterPlayerInputPlayer.action = false;
					characterPlayerInputPlayer.fire = false;
					characterPlayerInputPlayer.r = 0;
					updated = true;

					DOM.elPlayerJoystick2Thumb.classList.remove('press-green');
					DOM.elPlayerJoystick2Thumb.classList.remove('press-red');
					DOM.elPlayerJoystick2.classList.remove('show');
					touchJoystick2Show = false;
				}

				// Cheat Code
				if (inputOverlayPositions.length === 4) {
					cheatCodeCheck(player1, true);
				} else if (inputOverlayPositions.length === 3) {
					// Weapon Select

					Game.pause(true);
					DOM.elWeapons.classList.add('show');

					DOM.elWeapon1.onclick = () => {
						CalcMainBus.weaponSelect(player1, CharacterWeapon.KNIFE);
						DOM.elWeapons.classList.remove('show');
						Game.pause(false);
					};

					DOM.elWeapon2.onclick = () => {
						CalcMainBus.weaponSelect(player1, CharacterWeapon.PISTOL);
						DOM.elWeapons.classList.remove('show');
						Game.pause(false);
					};

					DOM.elWeapon3.onclick = () => {
						CalcMainBus.weaponSelect(player1, CharacterWeapon.SUB_MACHINE_GUN);
						DOM.elWeapons.classList.remove('show');
						Game.pause(false);
					};

					DOM.elWeapon4.onclick = () => {
						CalcMainBus.weaponSelect(player1, CharacterWeapon.MACHINE_GUN);
						DOM.elWeapons.classList.remove('show');
						Game.pause(false);
					};
				}
			} else {
				switch (input.propriatary.action) {
					case GamingCanvasInputTouchAction.ACTIVE:
						if (modeEdit === true) {
							touchDistancePrevious = -1;

							if (down === true && positions.length === 1) {
								position1 = positions[0];
								positionMeta(position1);

								cameraMoveXOriginal = 1 - position1.xRelative;
								cameraMoveYOriginal = 1 - position1.yRelative;
								cameraXOriginal = camera.x;
								cameraYOriginal = camera.y;
							}
							downMode = down;
						}
						break;
					case GamingCanvasInputTouchAction.MOVE:
						if (modeEdit === true) {
							if (positions.length !== 0) {
								position1 = positions[0];
								positionMeta(position1);

								DOM.elPlayerJoystick1.classList.remove('show');
								DOM.elPlayerJoystick2.classList.remove('show');
								touchJoystick1Show = false;
								touchJoystick2Show = false;

								if (modeEditType === EditType.PAN_ZOOM) {
									if (position1.out === true) {
										down = false;
									}

									if (positions.length !== 1) {
										// Zoom
										if (down === true) {
											position2 = positions[1];

											if (touchDistancePrevious !== -1) {
												touchDistance = GamingCanvasInputPositionDistance(position1, position2) - touchDistancePrevious;
												if (Math.abs(touchDistance) > 20) {
													cameraZoomPrevious = cameraZoom;
													cameraZoom = Math.max(
														cameraZoomMin,
														Math.min(cameraZoomMax, cameraZoom + (touchDistance > 0 ? cameraZoomStep : -cameraZoomStep)),
													);
													if (cameraZoom !== cameraZoomPrevious) {
														updated = true;
													}
													touchDistancePrevious = touchDistance + touchDistancePrevious;
												}
											} else {
												touchDistancePrevious = GamingCanvasInputPositionDistance(position1, position2);
											}
										} else {
											touchDistancePrevious = -1;
										}
									} else {
										touchDistancePrevious = -1;
									}

									// Move
									if (downMode === true) {
										cameraMoveX = 1 - position1.xRelative;
										cameraMoveY = 1 - position1.yRelative;
										updated = true;
									}
								} else {
									if (downMode === true) {
										switch (modeEditType) {
											case EditType.APPLY:
												dataApply(position1);
												break;
											case EditType.ERASE:
												dataApply(position1, true);
												break;
											case EditType.INSPECT:
												inspect(position1);
												break;
										}
									}
								}
							}
						}
						break;
				}
			}
		};

		const utilStringToHTML = (element: HTMLElement, string: string, stats?: boolean): void => {
			let character: string, characterMap: Map<string, AssetIdImgMenu>, img: HTMLImageElement, prefix: string;

			// Clear existing
			element.innerText = '';

			// Asset pack selector
			if (stats === true) {
				characterMap = assetsImageMenusFontEndLevel;
				prefix = 'font-end-level-';
			} else {
				characterMap = assetsImageMenusFontHUD;
				prefix = 'font-hud-';
			}

			// String to assets
			string = (string || '').toLowerCase();
			for (character of string) {
				img = document.createElement('img');
				img.className = 'font-string-img';

				if (character !== ' ') {
					img.id = prefix + character;
					img.src = <string>Assets.dataImageMenus.get(<number>characterMap.get(character));
				} else {
					img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
				}

				element.appendChild(img);
			}
		};
	}

	public static pause(state: boolean, skipAudio?: boolean): void {
		if (state === true) {
			CalcMainBus.outputPause(true);
			CalcPathBus.outputPause(true);
			skipAudio !== true && GamingCanvas.audioControlPauseAll(true);
			VideoMainBus.outputPause(true);
			VideoOverlayBus.outputPause(true);
		} else {
			if (Game.gameOver !== true) {
				CalcMainBus.outputPause(false);
				CalcPathBus.outputPause(false);
				skipAudio !== true && GamingCanvas.audioControlPauseAll(false);
				VideoMainBus.outputPause(false);
				VideoOverlayBus.outputPause(false);
			}
		}
	}

	public static viewEditor(): void {
		if (Game.modeEdit !== true || Game.modePerformance === true) {
			Game.modeEdit = true;
			Game.modePerformance = false;

			// Game
			Game.pause(true);

			// DOM
			DOM.elButtonApply.classList.remove('active');
			DOM.elButtonEye.classList.add('active');
			DOM.elButtonInspect.classList.remove('active');
			DOM.elButtonMove.classList.add('active');
			DOM.elButtonEdit.classList.add('active');
			DOM.elButtonPerformance.classList.remove('active');
			DOM.elButtonPlay.classList.remove('active');
			DOM.elCanvases[4].classList.remove('hide');
			DOM.elEditor.classList.remove('hide');
			DOM.elEditor.style.display = 'flex';
			DOM.elEditorProperties.classList.remove('hide');
			DOM.elEditorProperties.style.display = 'flex';
			DOM.elIconsBottom.classList.remove('hide');
			DOM.elIconsBottom.style.display = 'flex';
			DOM.elIconsTop.style.display = 'flex';
			DOM.elPerformance.style.display = 'none';
			DOM.elPerformanceVideoEditor.style.display = 'flex';

			DOM.elVideoInteractive.classList.add('cursor-grab');
			DOM.elVideoInteractive.classList.remove('cursor-pointer');
			Game.modeEditType = EditType.PAN_ZOOM;

			// Overlay
			Game.editorHide = false;
			DOM.elPlayerOverlay1.style.display = 'none';
			DOM.elPlayerOverlay2.style.display = 'none';

			// Video
			Settings.singleVideoFeedOverride(true);
			VideoEditorBus.outputEnable(true);
		}
	}

	public static viewGame(): void {
		if (Game.modeEdit !== false || Game.modePerformance === true) {
			Game.modeEdit = false;
			Game.modePerformance = false;

			// DOM
			DOM.elButtonEdit.classList.remove('active');
			DOM.elButtonPerformance.classList.remove('active');
			DOM.elButtonPlay.classList.add('active');
			DOM.elCanvases[4].classList.add('hide');
			DOM.elEditor.classList.add('hide');
			DOM.elEditor.style.display = 'flex';
			DOM.elEditorProperties.classList.add('hide');
			DOM.elEditorProperties.style.display = 'flex';
			DOM.elIconsBottom.classList.add('hide');
			DOM.elIconsBottom.style.display = 'flex';
			DOM.elIconsTop.style.display = 'flex';
			DOM.elPerformance.style.display = 'none';
			DOM.elPerformanceVideoEditor.style.display = 'none';

			// DOM: Editor
			if (DOM.elEditorItemActive !== undefined) {
				DOM.elEditorItemActive.classList.remove('active');
				DOM.elEditorItemActive = undefined;

				Game.editorCellHighlightEnable = false;
			}
			DOM.elEdit.style.display = 'none';

			DOM.elVideoInteractive.classList.remove('cursor-grab');
			DOM.elVideoInteractive.classList.remove('cursor-pointer');
			Game.modeEditType = EditType.PAN_ZOOM;

			let element: HTMLInputElement;
			for (element of DOM.elEditorPropertiesCellInputs) {
				element.checked = false;
			}

			// Overlay
			DOM.elPlayerOverlay1.style.display = 'flex';

			if (Game.settings.threadCalcMain.player2Enable === true) {
				DOM.elPlayerOverlay2.style.display = 'flex';
			} else {
				DOM.elPlayerOverlay2.style.display = 'none';
			}

			// Video
			setTimeout(() => {
				Game.reportNew = true;

				setTimeout(() => {
					// Game
					Game.pause(false);
				}, 500);
			});
			CalcMainBus.outputCharacterInput({
				player1: {
					action: false,
					fire: false,
					r: 0,
					x: 0,
					y: 0,
				},
				player2: {
					action: false,
					fire: false,
					r: 0,
					x: 0,
					y: 0,
				},
			});
			Settings.singleVideoFeedOverride(false);
			VideoEditorBus.outputEnable(false);
		}
	}

	public static viewPerformance(): void {
		if (Game.modePerformance !== true) {
			Game.modeEdit = false;
			Game.modePerformance = true;

			// Game
			// Game.pause(true);

			// DOM
			DOM.elButtonEdit.classList.remove('active');
			DOM.elButtonPerformance.classList.add('active');
			DOM.elButtonPlay.classList.remove('active');
			DOM.elIconsTop.style.display = 'flex';

			// DOM: Editor
			if (DOM.elEditorItemActive !== undefined) {
				DOM.elEditorItemActive.classList.remove('active');
				DOM.elEditorItemActive = undefined;

				Game.editorCellHighlightEnable = false;
			}
			DOM.elEdit.style.display = 'none';

			DOM.elVideoInteractive.classList.remove('cursor-grab');
			DOM.elVideoInteractive.classList.remove('cursor-pointer');
			Game.modeEditType = EditType.PAN_ZOOM;

			let element: HTMLInputElement;
			for (element of DOM.elEditorPropertiesCellInputs) {
				element.checked = false;
			}

			// Overlay
			DOM.elPerformance.style.display = 'flex';
		}
	}
}
