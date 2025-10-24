import { Assets } from './assets.js';
import {
	AssetIdImg,
	AssetIdImgCharacter,
	assetIdImgCharacterMenu,
	AssetIdImgCharacterType,
	AssetIdImgMenu,
	AssetImgCategory,
	AssetPropertiesAudio,
	AssetPropertiesImage,
	assetsImages,
	assetsImageCharacters,
	AssetIdMap,
	AssetIdMusicLevels,
	assetsAudio,
} from '../asset-manager.js';
import packageJSON from '../../package.json' with { type: 'json' };

/**
 * @author tknight-dev
 */

export class DOM {
	public static elButtonApply: HTMLElement;
	public static elButtonDownload: HTMLElement;
	public static elButtonEdit: HTMLElement;
	public static elButtonEraser: HTMLElement;
	public static elButtonEye: HTMLElement;
	public static elButtonFullscreen: HTMLElement;
	public static elButtonInspect: HTMLElement;
	public static elButtonMove: HTMLElement;
	public static elButtonMute: HTMLElement;
	public static elButtonPerformance: HTMLElement;
	public static elButtonPlay: HTMLElement;
	public static elButtonUpload: HTMLElement;
	public static elCanvases: HTMLCanvasElement[];
	public static elControls: HTMLElement;
	public static elControlsBodyGamepad: HTMLElement;
	public static elControlsBodyKeyboard: HTMLElement;
	public static elControlsBodyMouse: HTMLElement;
	public static elControlsBodyTouch: HTMLElement;
	public static elControlsClose: HTMLElement;
	public static elControlsSubGamepad: HTMLElement;
	public static elControlsSubKeyboard: HTMLElement;
	public static elControlsSubMouse: HTMLElement;
	public static elControlsSubTouch: HTMLElement;
	public static elDebug: HTMLElement;
	public static elEdit: HTMLElement;
	public static elEditor: HTMLElement;
	public static elEditorCommandFindAndReplace: HTMLElement;
	public static elEditorCommandOptions: HTMLElement;
	public static elEditorCommandResetMap: HTMLElement;
	public static elEditorContainerCharacters: HTMLElement;
	public static elEditorContainerCharactersBossContent: HTMLElement;
	public static elEditorContainerCharactersGuardContent: HTMLElement;
	public static elEditorContainerCharactersOfficerContent: HTMLElement;
	public static elEditorContainerCharactersRatContent: HTMLElement;
	public static elEditorContainerCharactersSSContent: HTMLElement;
	public static elEditorContainerObjects: HTMLElement;
	public static elEditorContainerObjectsPickups: HTMLElement;
	public static elEditorContainerObjectsPickupsContent: HTMLElement;
	public static elEditorContainerObjectsSprites: HTMLElement;
	public static elEditorContainerObjectsSpritesContent: HTMLElement;
	public static elEditorContainerObjectsSpritesLights: HTMLElement;
	public static elEditorContainerObjectsSpritesLightsContent: HTMLElement;
	public static elEditorContainerObjectsTagsContent: HTMLElement;
	public static elEditorContainerObjectsWalls: HTMLElement;
	public static elEditorContainerObjectsWallsContent: HTMLElement;
	public static elEditorContainerObjectsWaypointsContent: HTMLElement;
	public static elEditorContainerExtended: HTMLElement;
	public static elEditorContainerExtendedContent: HTMLElement;
	public static elEditorFindAndReplace: HTMLElement;
	public static elEditorFindAndReplaceApply: HTMLElement;
	public static elEditorFindAndReplaceCancel: HTMLElement;
	public static elEditorFindAndReplaceValueFind: HTMLInputElement;
	public static elEditorFindAndReplaceValueReplace: HTMLInputElement;
	public static elEditorHandleArrow: HTMLElement;
	public static elEditorHandleEpisodeLevel: HTMLElement;
	public static elEditorHandleHide: HTMLElement;
	public static elEditorItemActive: HTMLElement | undefined;
	public static elEditorItemsCharacters: HTMLElement[] = [];
	public static elEditorItemsObjects: HTMLElement[] = [];
	public static elEditorProperties: HTMLElement;
	public static elEditorPropertiesCellContainer: HTMLElement;
	public static elEditorPropertiesCellInputs: HTMLInputElement[];
	public static elEditorPropertiesCellInputDisabled: HTMLInputElement;
	public static elEditorPropertiesCellInputDoor: HTMLInputElement;
	public static elEditorPropertiesCellInputFloor: HTMLInputElement;
	public static elEditorPropertiesCellInputLight: HTMLInputElement;
	public static elEditorPropertiesCellInputLocked1: HTMLInputElement;
	public static elEditorPropertiesCellInputLocked2: HTMLInputElement;
	public static elEditorPropertiesCellInputTag: HTMLInputElement;
	public static elEditorPropertiesCellInputSpriteFixedH: HTMLInputElement;
	public static elEditorPropertiesCellInputSpriteFixedV: HTMLInputElement;
	public static elEditorPropertiesCellInputSwitch: HTMLInputElement;
	public static elEditorPropertiesCellInputSwitchSecret: HTMLInputElement;
	public static elEditorPropertiesCellInputWallMovable: HTMLInputElement;
	public static elEditorPropertiesCellInputWall: HTMLInputElement;
	public static elEditorPropertiesCellInputWallInvisible: HTMLInputElement;
	public static elEditorPropertiesCellOutputAssetId: HTMLElement;
	public static elEditorPropertiesCellOutputIndex: HTMLElement;
	public static elEditorPropertiesCellOutputPosition: HTMLElement;
	public static elEditorPropertiesCellOutputProperties: HTMLElement;
	public static elEditorPropertiesCellOutputValue: HTMLElement;
	public static elEditorPropertiesCellTag: HTMLElement;
	public static elEditorPropertiesCellTags: HTMLInputElement[];
	public static elEditorPropertiesCellTagInputEpisodeEnd: HTMLInputElement;
	public static elEditorPropertiesCharacterContainer: HTMLElement;
	public static elEditorPropertiesCharacterInputAngle: HTMLInputElement;
	public static elEditorPropertiesCharacterInputDifficulty: HTMLInputElement;
	public static elEditorPropertiesCharacterInputFOV: HTMLInputElement;
	public static elEditorPropertiesCharacterInputId: HTMLInputElement;
	public static elEditorPropertiesCommandsCell: HTMLElement;
	public static elEditorPropertiesHandleArrow: HTMLElement;
	public static elEditorPropertiesHandleHide: HTMLElement;
	public static elEditorSectionCharacters: HTMLElement;
	public static elEditorSectionObjects: HTMLElement;
	public static elEditorSectionExtended: HTMLElement;
	public static elError: HTMLElement;
	public static elFile: HTMLElement;
	public static elGame: HTMLElement;
	public static elGameMenu: HTMLElement;
	public static elGameMenuBack: HTMLElement;
	public static elGameMenuBanners: HTMLElement;
	public static elGameMenuBannersGameLoad: HTMLImageElement;
	public static elGameMenuBannersGameSave: HTMLImageElement;
	public static elGameMenuBannersOptions: HTMLImageElement;
	public static elGameMenuContent: HTMLImageElement;
	public static elGameMenuDifficulty: HTMLElement;
	public static elGameMenuDifficultyDesc: HTMLElement;
	public static elGameMenuDifficulty1: HTMLElement;
	public static elGameMenuDifficulty2: HTMLElement;
	public static elGameMenuDifficulty3: HTMLElement;
	public static elGameMenuDifficulty4: HTMLElement;
	public static elGameMenuDifficultyHead1: HTMLElement;
	public static elGameMenuDifficultyHead2: HTMLElement;
	public static elGameMenuDifficultyHead3: HTMLElement;
	public static elGameMenuDifficultyHead4: HTMLElement;
	public static elGameMenuDifficultyHeadItems: HTMLElement[];
	public static elGameMenuDifficultyItems: HTMLElement[];
	public static elGameMenuInstructions: HTMLElement;
	public static elGameMenuEpisodes: HTMLElement;
	public static elGameMenuEpisodesDesc: HTMLElement;
	public static elGameMenuEpisodes1: HTMLElement;
	public static elGameMenuEpisodes2: HTMLElement;
	public static elGameMenuEpisodes3: HTMLElement;
	public static elGameMenuEpisodes4: HTMLElement;
	public static elGameMenuEpisodes5: HTMLElement;
	public static elGameMenuEpisodes6: HTMLElement;
	public static elGameMenuEpisodesItems: HTMLElement[];
	public static elGameMenuMain: HTMLElement;
	public static elGameMenuMainContinue: HTMLElement;
	public static elGameMenuMainControls: HTMLElement;
	public static elGameMenuMainItems: HTMLElement[];
	public static elGameMenuMainGameLoad: HTMLElement;
	public static elGameMenuMainGameNew: HTMLElement;
	public static elGameMenuMainGameSave: HTMLElement;
	public static elGameMenuMainSettings: HTMLElement;
	public static elGameMenuPistol: HTMLElement;
	public static elGameMenuSlots: HTMLElement;
	public static elGameMenuSlots1: HTMLElement;
	public static elGameMenuSlots2: HTMLElement;
	public static elGameMenuSlots3: HTMLElement;
	public static elGameMenuSlotsItems: HTMLElement[];
	public static elIconsBottom: HTMLElement;
	public static elIconsTop: HTMLElement;
	public static elInfoControls: HTMLElement;
	public static elInfoMenu: HTMLElement;
	public static elInfoGameMenu: HTMLElement;
	public static elInfoSettings: HTMLElement;
	public static elLogo: HTMLElement;
	public static elMenuContent: HTMLElement;
	public static elMapOptions: HTMLElement;
	public static elMapOptionsApply: HTMLElement;
	public static elMapOptionsCancel: HTMLElement;
	public static elMapOptionsLocation: HTMLElement;
	public static elMapOptionsValueColorCeiling: HTMLInputElement;
	public static elMapOptionsValueColorFloor: HTMLInputElement;
	public static elMapOptionsValueId: HTMLInputElement;
	public static elMapOptionsValueMusic: HTMLInputElement;
	public static elMapOptionsValueStartingPositionR: HTMLInputElement;
	public static elMapOptionsValueStartingPositionX: HTMLInputElement;
	public static elMapOptionsValueStartingPositionY: HTMLInputElement;
	public static elMapOptionsValueTimeParInSeconds: HTMLInputElement;
	public static elPerformance: HTMLElement;
	public static elPerformanceCalcMain: HTMLElement;
	public static elPerformanceCalcMainAll: HTMLElement;
	public static elPerformanceCalcMainAudio: HTMLElement;
	public static elPerformanceCalcMainCPS: HTMLElement;
	public static elPerformanceCalcPath: HTMLElement;
	public static elPerformanceCalcPathAll: HTMLElement;
	public static elPerformanceCalcPathIndividual: HTMLElement;
	public static elPerformanceVideoEditor: HTMLElement;
	public static elPerformanceVideoEditorAll: HTMLElement;
	public static elPerformanceVideoEditorCells: HTMLElement;
	public static elPerformanceVideoEditorCV: HTMLElement;
	public static elPerformanceVideoEditorFPS: HTMLElement;
	public static elPerformanceVideoPlayer1: HTMLElement;
	public static elPerformanceVideoPlayer1All: HTMLElement;
	public static elPerformanceVideoPlayer1RayCV: HTMLElement;
	public static elPerformanceVideoPlayer1FPS: HTMLElement;
	public static elPerformanceVideoPlayer1NPCCV: HTMLElement;
	public static elPerformanceVideoPlayer1Ray: HTMLElement;
	public static elPerformanceVideoPlayer1Sprite: HTMLElement;
	public static elPerformanceVideoPlayer2: HTMLElement;
	public static elPerformanceVideoPlayer2All: HTMLElement;
	public static elPerformanceVideoPlayer2FPS: HTMLElement;
	public static elPerformanceVideoPlayer2NPCCV: HTMLElement;
	public static elPerformanceVideoPlayer2Ray: HTMLElement;
	public static elPerformanceVideoPlayer2RayCV: HTMLElement;
	public static elPerformanceVideoPlayer2Sprite: HTMLElement;
	public static elPlayerJoystick1: HTMLElement;
	public static elPlayerJoystick1Thumb: HTMLElement;
	public static elPlayerJoystick1Wrapper: HTMLElement;
	public static elPlayerJoystick2: HTMLElement;
	public static elPlayerJoystick2Thumb: HTMLElement;
	public static elPlayerJoystick2Wrapper: HTMLElement;
	public static elPlayerOverlay1: HTMLElement;
	public static elPlayerOverlay1Ammo: HTMLElement;
	public static elPlayerOverlay1AmmoTitle: HTMLElement;
	public static elPlayerOverlay1Health: HTMLElement;
	public static elPlayerOverlay1HealthTitle: HTMLElement;
	public static elPlayerOverlay1Key1: HTMLElement;
	public static elPlayerOverlay1Key2: HTMLElement;
	public static elPlayerOverlay1Lives: HTMLElement;
	public static elPlayerOverlay1LivesTitle: HTMLElement;
	public static elPlayerOverlay2: HTMLElement;
	public static elPlayerOverlay2Ammo: HTMLElement;
	public static elPlayerOverlay2AmmoTitle: HTMLElement;
	public static elPlayerOverlay2Health: HTMLElement;
	public static elPlayerOverlay2HealthTitle: HTMLElement;
	public static elPlayerOverlay2Key1: HTMLElement;
	public static elPlayerOverlay2Key2: HTMLElement;
	public static elPlayerOverlay2Lives: HTMLElement;
	public static elPlayerOverlay2LivesTitle: HTMLElement;
	public static elScreenActive: HTMLElement;
	public static elScreenBlack: HTMLElement;
	public static elScreenCredits: HTMLElement;
	public static elScreenLevelEnd: HTMLElement;
	public static elScreenLevelEndBonus: HTMLElement;
	public static elScreenLevelEndCompleted: HTMLElement;
	public static elScreenLevelEndImage1: HTMLImageElement;
	public static elScreenLevelEndImage2: HTMLImageElement;
	public static elScreenLevelEndFloor: HTMLElement;
	public static elScreenLevelEndRatioKill: HTMLElement;
	public static elScreenLevelEndRatioSecret: HTMLElement;
	public static elScreenLevelEndRatioTreasure: HTMLElement;
	public static elScreenLevelEndTime: HTMLElement;
	public static elScreenLevelEndTimePar: HTMLElement;
	public static elScreenRating: HTMLElement;
	public static elScreenStats: HTMLElement;
	public static elScreenTitle: HTMLElement;
	public static elSettings: HTMLElement;
	public static elSettingsApply: HTMLElement;
	public static elSettingsBodyAudio: HTMLElement;
	public static elSettingsBodyEditor: HTMLElement;
	public static elSettingsBodyGame: HTMLElement;
	public static elSettingsBodyGraphics: HTMLElement;
	public static elSettingsCancel: HTMLElement;
	public static elSettingsSubAudio: HTMLElement;
	public static elSettingsSubEditor: HTMLElement;
	public static elSettingsSubGame: HTMLElement;
	public static elSettingsSubGraphics: HTMLElement;
	public static elSettingsValueAudioVolume: HTMLInputElement;
	public static elSettingsValueAudioVolumeReadout: HTMLInputElement;
	public static elSettingsValueAudioVolumeEffect: HTMLInputElement;
	public static elSettingsValueAudioVolumeEffectReadout: HTMLInputElement;
	public static elSettingsValueAudioVolumeEffect2: HTMLInputElement;
	public static elSettingsValueAudioVolumeEffect2Readout: HTMLInputElement;
	public static elSettingsValueAudioVolumeMusic: HTMLInputElement;
	public static elSettingsValueAudioVolumeMusicReadout: HTMLInputElement;
	public static elSettingsValueAudioNoAction: HTMLInputElement;
	public static elSettingsValueAudioWallCollisions: HTMLInputElement;
	public static elSettingsValueEditorDrawGrid: HTMLInputElement;
	public static elSettingsValueGameCrosshair: HTMLInputElement;
	public static elSettingsValueGameDebug: HTMLInputElement;
	public static elSettingsValueGameDifficulty: HTMLInputElement;
	public static elSettingsValueGameMultiplayer: HTMLInputElement;
	public static elSettingsValueGamePlayer2InputDevice: HTMLInputElement;
	public static elSettingsValueGraphicsAntialias: HTMLInputElement;
	public static elSettingsValueGraphicsDPI: HTMLInputElement;
	public static elSettingsValueGraphicsFOV: HTMLInputElement;
	public static elSettingsValueGraphicsFOVReadout: HTMLInputElement;
	public static elSettingsValueGraphicsFPS: HTMLInputElement;
	public static elSettingsValueGraphicsFPSShow: HTMLInputElement;
	public static elSettingsValueGraphicsGamma: HTMLInputElement;
	public static elSettingsValueGraphicsGammaReadout: HTMLInputElement;
	public static elSettingsValueGraphicsGrayscale: HTMLInputElement;
	public static elSettingsValueGraphicsLightingQuality: HTMLInputElement;
	public static elSettingsValueGraphicsRaycastQuality: HTMLInputElement;
	public static elSettingsValueGraphicsResolution: HTMLInputElement;
	public static elSpinner: HTMLElement;
	public static elStatFPS: HTMLElement;
	public static elVideo: HTMLElement;
	public static elVideoInteractive: HTMLElement;
	public static elVersion: HTMLAnchorElement;
	public static elWeapons: HTMLElement;
	public static elWeapon1: HTMLElement;
	public static elWeapon2: HTMLElement;
	public static elWeapon3: HTMLElement;
	public static elWeapon4: HTMLElement;
	private static timeoutError: ReturnType<typeof setTimeout>;
	private static timeoutScreen: ReturnType<typeof setTimeout>;
	private static timeoutSpinner: ReturnType<typeof setTimeout>;

	public static initialize(): void {
		DOM.elButtonApply = <HTMLElement>document.getElementById('button-apply');
		DOM.elButtonDownload = <HTMLElement>document.getElementById('button-download');
		DOM.elButtonEdit = <HTMLElement>document.getElementById('button-edit');
		DOM.elButtonEraser = <HTMLElement>document.getElementById('button-eraser');
		DOM.elButtonEye = <HTMLElement>document.getElementById('button-eye');
		DOM.elButtonFullscreen = <HTMLElement>document.getElementById('button-fullscreen');
		DOM.elButtonInspect = <HTMLElement>document.getElementById('button-inspect');
		DOM.elButtonMove = <HTMLElement>document.getElementById('button-move');
		DOM.elButtonMute = <HTMLElement>document.getElementById('button-mute');
		DOM.elButtonPerformance = <HTMLElement>document.getElementById('button-performance');
		DOM.elButtonPlay = <HTMLElement>document.getElementById('button-play');
		DOM.elButtonUpload = <HTMLElement>document.getElementById('button-upload');

		DOM.elControls = <HTMLElement>document.getElementById('controls');
		DOM.elControlsBodyGamepad = <HTMLElement>document.getElementById('controls-body-gamepad');
		DOM.elControlsBodyKeyboard = <HTMLElement>document.getElementById('controls-body-keyboard');
		DOM.elControlsBodyMouse = <HTMLElement>document.getElementById('controls-body-mouse');
		DOM.elControlsBodyTouch = <HTMLElement>document.getElementById('controls-body-touch');
		DOM.elControlsClose = <HTMLElement>document.getElementById('controls-close');
		DOM.elControlsSubGamepad = <HTMLElement>document.getElementById('controls-sub-gamepad');
		DOM.elControlsSubKeyboard = <HTMLElement>document.getElementById('controls-sub-keyboard');
		DOM.elControlsSubMouse = <HTMLElement>document.getElementById('controls-sub-mouse');
		DOM.elControlsSubTouch = <HTMLElement>document.getElementById('controls-sub-touch');

		DOM.elDebug = <HTMLElement>document.getElementById('debug');

		DOM.elEdit = document.createElement('div');
		DOM.elEdit.className = 'edit';
		DOM.elEdit.id = 'edit';

		DOM.elEditor = <HTMLElement>document.getElementById('editor');
		DOM.elEditorCommandFindAndReplace = <HTMLElement>document.getElementById('editor-cell-command-toggle-find-and-replace');
		DOM.elEditorCommandOptions = <HTMLElement>document.getElementById('editor-cell-command-toggle-options');
		DOM.elEditorCommandResetMap = <HTMLElement>document.getElementById('editor-cell-command-toggle-reset');
		DOM.elEditorContainerCharacters = <HTMLElement>document.getElementById('editor-cell-container-characters');
		DOM.elEditorContainerCharactersBossContent = <HTMLElement>document.getElementById('editor-cell-container-characters-boss-content');
		DOM.elEditorContainerCharactersGuardContent = <HTMLElement>document.getElementById('editor-cell-container-characters-guard-content');
		DOM.elEditorContainerCharactersOfficerContent = <HTMLElement>document.getElementById('editor-cell-container-characters-officer-content');
		DOM.elEditorContainerCharactersRatContent = <HTMLElement>document.getElementById('editor-cell-container-characters-rat-content');
		DOM.elEditorContainerCharactersSSContent = <HTMLElement>document.getElementById('editor-cell-container-characters-ss-content');
		DOM.elEditorContainerObjects = <HTMLElement>document.getElementById('editor-cell-container-objects');
		DOM.elEditorContainerObjectsPickups = <HTMLElement>document.getElementById('editor-cell-container-pickups');
		DOM.elEditorContainerObjectsPickupsContent = <HTMLElement>document.getElementById('editor-cell-container-pickups-content');
		DOM.elEditorContainerObjectsSprites = <HTMLElement>document.getElementById('editor-cell-container-sprites');
		DOM.elEditorContainerObjectsSpritesContent = <HTMLElement>document.getElementById('editor-cell-container-sprites-content');
		DOM.elEditorContainerObjectsSpritesLights = <HTMLElement>document.getElementById('editor-cell-container-sprites-lights');
		DOM.elEditorContainerObjectsSpritesLightsContent = <HTMLElement>document.getElementById('editor-cell-container-sprites-lights-content');
		DOM.elEditorContainerObjectsWalls = <HTMLElement>document.getElementById('editor-cell-container-walls');
		DOM.elEditorContainerObjectsWallsContent = <HTMLElement>document.getElementById('editor-cell-container-walls-content');
		DOM.elEditorContainerObjectsWaypointsContent = <HTMLElement>document.getElementById('editor-cell-container-waypoints-content');
		DOM.elEditorContainerExtended = <HTMLElement>document.getElementById('editor-cell-container-extended');
		DOM.elEditorContainerExtendedContent = <HTMLElement>document.getElementById('editor-cell-container-interactive-content');

		DOM.elEditorHandleArrow = <HTMLElement>document.getElementById('editor-cell-handle-arrow');
		DOM.elEditorHandleArrow.onclick = () => {
			if (DOM.elEditorHandleArrow.classList.contains('invert') === true) {
				DOM.elEditor.classList.remove('left');
				DOM.elEditorHandleArrow.classList.remove('invert');
				DOM.elEditorHandleArrow.innerText = '🡠';

				DOM.elEditorProperties.classList.add('left');
				DOM.elEditorPropertiesHandleArrow.classList.remove('invert');
				DOM.elEditorPropertiesHandleArrow.innerText = '🡢';
			} else {
				DOM.elEditor.classList.add('left');
				DOM.elEditorHandleArrow.classList.add('invert');
				DOM.elEditorHandleArrow.innerText = '🡢';

				DOM.elEditorProperties.classList.remove('left');
				DOM.elEditorPropertiesHandleArrow.classList.add('invert');
				DOM.elEditorPropertiesHandleArrow.innerText = '🡠';
			}
		};

		DOM.elEditorHandleEpisodeLevel = <HTMLElement>document.getElementById('editor-cell-handle-episode-level');

		DOM.elEditorHandleHide = <HTMLElement>document.getElementById('editor-cell-handle-hide');
		DOM.elEditorHandleHide.onclick = () => {
			if (DOM.elEditorHandleHide.classList.contains('invert') === true) {
				DOM.elEditor.classList.remove('shrink');
				DOM.elEditorHandleHide.classList.remove('invert');
				DOM.elEditorHandleHide.innerText = '_';
			} else {
				DOM.elEditor.classList.add('shrink');
				DOM.elEditorHandleHide.classList.add('invert');
				DOM.elEditorHandleHide.innerText = '□';
			}
		};

		DOM.elEditorFindAndReplace = <HTMLElement>document.getElementById('editor-cell-find-and-replace');
		DOM.elEditorFindAndReplaceApply = <HTMLElement>document.getElementById('editor-cell-find-and-replace-apply');

		DOM.elEditorFindAndReplaceCancel = <HTMLElement>document.getElementById('editor-cell-find-and-replace-cancel');

		DOM.elEditorFindAndReplaceValueFind = <HTMLInputElement>document.getElementById('editor-cell-find-and-replace-value-find');
		DOM.elEditorFindAndReplaceValueReplace = <HTMLInputElement>document.getElementById('editor-cell-find-and-replace-value-replace');

		DOM.elEditorPropertiesCellContainer = <HTMLInputElement>document.getElementById('editor-properties-cell-container');

		DOM.elEditorPropertiesCellInputDisabled = <HTMLInputElement>document.getElementById('editor-cell-disabled');
		DOM.elEditorPropertiesCellInputDoor = <HTMLInputElement>document.getElementById('editor-cell-door');
		DOM.elEditorPropertiesCellInputFloor = <HTMLInputElement>document.getElementById('editor-cell-floor');
		DOM.elEditorPropertiesCellInputLight = <HTMLInputElement>document.getElementById('editor-cell-light');
		DOM.elEditorPropertiesCellInputLocked1 = <HTMLInputElement>document.getElementById('editor-cell-locked-1');
		DOM.elEditorPropertiesCellInputLocked2 = <HTMLInputElement>document.getElementById('editor-cell-locked-2');

		DOM.elEditorPropertiesCellInputSpriteFixedV = <HTMLInputElement>document.getElementById('editor-cell-sprite-fixed-ew');
		DOM.elEditorPropertiesCellInputSpriteFixedV.oninput = () => {
			if (DOM.elEditorPropertiesCellInputSpriteFixedV.checked === true) {
				DOM.elEditorPropertiesCellInputSpriteFixedH.checked = false;
			}
		};

		DOM.elEditorPropertiesCellInputSpriteFixedH = <HTMLInputElement>document.getElementById('editor-cell-sprite-fixed-ns');
		DOM.elEditorPropertiesCellInputSpriteFixedH.oninput = () => {
			if (DOM.elEditorPropertiesCellInputSpriteFixedH.checked === true) {
				DOM.elEditorPropertiesCellInputSpriteFixedV.checked = false;
			}
		};

		DOM.elEditorPropertiesCellInputSwitch = <HTMLInputElement>document.getElementById('editor-cell-switch');
		DOM.elEditorPropertiesCellInputSwitchSecret = <HTMLInputElement>document.getElementById('editor-cell-switch-secret');

		DOM.elEditorPropertiesCellInputTag = <HTMLInputElement>document.getElementById('editor-cell-tag');
		DOM.elEditorPropertiesCellInputTag.oninput = () => {
			if (DOM.elEditorPropertiesCellInputTag.checked === true) {
				DOM.elEditorPropertiesCellTag.classList.add('show');
			} else {
				DOM.elEditorPropertiesCellTag.classList.remove('show');
			}
		};

		DOM.elEditorPropertiesCellTag = <HTMLElement>document.getElementById('editor-properties-cell-tag');
		DOM.elEditorPropertiesCellTagInputEpisodeEnd = <HTMLInputElement>document.getElementById('editor-properties-cell-tag-episode-end');
		DOM.elEditorPropertiesCellTags = [DOM.elEditorPropertiesCellTagInputEpisodeEnd];

		DOM.elEditorPropertiesCellInputWall = <HTMLInputElement>document.getElementById('editor-cell-wall');
		DOM.elEditorPropertiesCellInputWallInvisible = <HTMLInputElement>document.getElementById('editor-cell-wall-invisible');
		DOM.elEditorPropertiesCellInputWallMovable = <HTMLInputElement>document.getElementById('editor-cell-wall-movable');
		DOM.elEditorPropertiesCellInputs = [
			DOM.elEditorPropertiesCellInputDisabled,
			DOM.elEditorPropertiesCellInputDoor,
			DOM.elEditorPropertiesCellInputFloor,
			DOM.elEditorPropertiesCellInputLight,
			DOM.elEditorPropertiesCellInputLocked1,
			DOM.elEditorPropertiesCellInputLocked2,
			DOM.elEditorPropertiesCellInputSpriteFixedH,
			DOM.elEditorPropertiesCellInputSpriteFixedV,
			DOM.elEditorPropertiesCellInputSwitch,
			DOM.elEditorPropertiesCellInputSwitchSecret,
			DOM.elEditorPropertiesCellInputTag,
			DOM.elEditorPropertiesCellInputWallMovable,
			DOM.elEditorPropertiesCellInputWall,
			DOM.elEditorPropertiesCellInputWallInvisible,
		];

		DOM.elEditorProperties = <HTMLElement>document.getElementById('editor-properties');

		DOM.elEditorPropertiesCharacterContainer = <HTMLElement>document.getElementById('editor-properties-character-container');
		DOM.elEditorPropertiesCharacterInputAngle = <HTMLInputElement>document.getElementById('editor-character-angle');
		DOM.elEditorPropertiesCharacterInputDifficulty = <HTMLInputElement>document.getElementById('editor-character-difficulty');
		DOM.elEditorPropertiesCharacterInputFOV = <HTMLInputElement>document.getElementById('editor-character-fov');
		DOM.elEditorPropertiesCharacterInputId = <HTMLInputElement>document.getElementById('editor-character-id');

		DOM.elEditorPropertiesCommandsCell = <HTMLElement>document.getElementById('editor-properties-commands-cell');

		DOM.elEditorPropertiesHandleArrow = <HTMLElement>document.getElementById('editor-properties-handle-arrow');
		DOM.elEditorPropertiesHandleArrow.onclick = DOM.elEditorHandleArrow.onclick;

		DOM.elEditorPropertiesHandleHide = <HTMLElement>document.getElementById('editor-properties-handle-hide');
		DOM.elEditorPropertiesHandleHide.onclick = () => {
			if (DOM.elEditorPropertiesHandleHide.classList.contains('invert') === true) {
				DOM.elEditorProperties.classList.remove('shrink');
				DOM.elEditorPropertiesHandleHide.classList.remove('invert');
				DOM.elEditorPropertiesHandleHide.innerText = '_';
			} else {
				DOM.elEditorProperties.classList.add('shrink');
				DOM.elEditorPropertiesHandleHide.classList.add('invert');
				DOM.elEditorPropertiesHandleHide.innerText = '□';
			}
		};

		DOM.elEditorPropertiesCellOutputAssetId = <HTMLElement>document.getElementById('editor-properties-output-assetid');
		DOM.elEditorPropertiesCellOutputIndex = <HTMLElement>document.getElementById('editor-properties-output-index');
		DOM.elEditorPropertiesCellOutputPosition = <HTMLElement>document.getElementById('editor-properties-output-position');
		DOM.elEditorPropertiesCellOutputProperties = <HTMLElement>document.getElementById('editor-properties-output-properties');
		DOM.elEditorPropertiesCellOutputValue = <HTMLElement>document.getElementById('editor-properties-output-value');

		DOM.elEditorSectionCharacters = <HTMLElement>document.getElementById('editor-cell-section-characters');
		DOM.elEditorSectionObjects = <HTMLElement>document.getElementById('editor-cell-section-objects');
		DOM.elEditorSectionExtended = <HTMLElement>document.getElementById('editor-cell-section-extended');

		DOM.elError = <HTMLElement>document.getElementById('error');
		DOM.elFile = <HTMLElement>document.getElementById('file');
		DOM.elGame = <HTMLElement>document.getElementById('game');
		DOM.elGameMenu = <HTMLElement>document.getElementById('game-menu');
		DOM.elGameMenuBack = <HTMLElement>document.getElementById('game-menu-back');
		DOM.elGameMenuBanners = <HTMLElement>document.getElementById('game-menu-banners');
		DOM.elGameMenuBannersGameLoad = <HTMLImageElement>document.getElementById('game-menu-banners-game-load');
		DOM.elGameMenuBannersGameSave = <HTMLImageElement>document.getElementById('game-menu-banners-game-save');
		DOM.elGameMenuBannersOptions = <HTMLImageElement>document.getElementById('game-menu-banners-options');
		DOM.elGameMenuContent = <HTMLImageElement>document.getElementById('game-menu-content');
		DOM.elGameMenuInstructions = <HTMLImageElement>document.getElementById('game-menu-instructions');

		DOM.elGameMenuDifficulty = <HTMLElement>document.getElementById('game-menu-difficulty');
		DOM.elGameMenuDifficultyDesc = <HTMLElement>document.getElementById('game-menu-difficulty-desc');
		DOM.elGameMenuDifficulty1 = <HTMLElement>document.getElementById('game-menu-difficulty-1');
		DOM.elGameMenuDifficulty2 = <HTMLElement>document.getElementById('game-menu-difficulty-2');
		DOM.elGameMenuDifficulty3 = <HTMLElement>document.getElementById('game-menu-difficulty-3');
		DOM.elGameMenuDifficulty4 = <HTMLElement>document.getElementById('game-menu-difficulty-4');
		DOM.elGameMenuDifficultyItems = [DOM.elGameMenuDifficulty1, DOM.elGameMenuDifficulty2, DOM.elGameMenuDifficulty3, DOM.elGameMenuDifficulty4];
		DOM.elGameMenuDifficultyHead1 = <HTMLElement>document.getElementById('game-menu-difficulty-head-1');
		DOM.elGameMenuDifficultyHead2 = <HTMLElement>document.getElementById('game-menu-difficulty-head-2');
		DOM.elGameMenuDifficultyHead3 = <HTMLElement>document.getElementById('game-menu-difficulty-head-3');
		DOM.elGameMenuDifficultyHead4 = <HTMLElement>document.getElementById('game-menu-difficulty-head-4');
		DOM.elGameMenuDifficultyHeadItems = [
			DOM.elGameMenuDifficultyHead1,
			DOM.elGameMenuDifficultyHead2,
			DOM.elGameMenuDifficultyHead3,
			DOM.elGameMenuDifficultyHead4,
		];

		DOM.elGameMenuEpisodes = <HTMLElement>document.getElementById('game-menu-episodes');
		DOM.elGameMenuEpisodesDesc = <HTMLElement>document.getElementById('game-menu-episodes-desc');
		DOM.elGameMenuEpisodes1 = <HTMLElement>document.getElementById('game-menu-episode-1');
		DOM.elGameMenuEpisodes2 = <HTMLElement>document.getElementById('game-menu-episode-2');
		DOM.elGameMenuEpisodes3 = <HTMLElement>document.getElementById('game-menu-episode-3');
		DOM.elGameMenuEpisodes4 = <HTMLElement>document.getElementById('game-menu-episode-4');
		DOM.elGameMenuEpisodes5 = <HTMLElement>document.getElementById('game-menu-episode-5');
		DOM.elGameMenuEpisodes6 = <HTMLElement>document.getElementById('game-menu-episode-6');
		DOM.elGameMenuEpisodesItems = [
			DOM.elGameMenuEpisodes1,
			DOM.elGameMenuEpisodes2,
			DOM.elGameMenuEpisodes3,
			DOM.elGameMenuEpisodes4,
			DOM.elGameMenuEpisodes5,
			DOM.elGameMenuEpisodes6,
		];

		DOM.elGameMenuMain = <HTMLElement>document.getElementById('game-menu-main');
		DOM.elGameMenuMainContinue = <HTMLElement>document.getElementById('game-menu-continue');
		DOM.elGameMenuMainControls = <HTMLElement>document.getElementById('game-menu-main-controls');
		DOM.elGameMenuMainGameLoad = <HTMLElement>document.getElementById('game-menu-main-game-load');
		DOM.elGameMenuMainGameNew = <HTMLElement>document.getElementById('game-menu-main-game-new');
		DOM.elGameMenuMainGameSave = <HTMLElement>document.getElementById('game-menu-main-game-save');
		DOM.elGameMenuMainSettings = <HTMLElement>document.getElementById('game-menu-main-settings');
		DOM.elGameMenuMainItems = [
			DOM.elGameMenuMainGameNew,
			DOM.elGameMenuMainControls,
			DOM.elGameMenuMainGameLoad,
			DOM.elGameMenuMainGameSave,
			DOM.elGameMenuMainSettings,
			DOM.elGameMenuMainContinue,
		];

		DOM.elGameMenuSlots = <HTMLElement>document.getElementById('game-menu-slots');
		DOM.elGameMenuSlots1 = <HTMLElement>document.getElementById('game-menu-slot-1');
		DOM.elGameMenuSlots2 = <HTMLElement>document.getElementById('game-menu-slot-2');
		DOM.elGameMenuSlots3 = <HTMLElement>document.getElementById('game-menu-slot-3');
		DOM.elGameMenuSlotsItems = [DOM.elGameMenuSlots1, DOM.elGameMenuSlots2, DOM.elGameMenuSlots3];

		DOM.elGameMenuPistol = <HTMLElement>document.getElementById('game-menu-pistol');
		DOM.elIconsBottom = <HTMLElement>document.getElementById('icons-bottom');
		DOM.elIconsTop = <HTMLElement>document.getElementById('icons-top');
		DOM.elInfoControls = <HTMLElement>document.getElementById('info-controls');
		DOM.elInfoGameMenu = <HTMLElement>document.getElementById('info-game-menu');
		DOM.elInfoMenu = <HTMLElement>document.getElementById('info-menu');
		DOM.elInfoSettings = <HTMLElement>document.getElementById('info-settings');
		DOM.elLogo = <HTMLElement>document.getElementById('logo');
		DOM.elMenuContent = <HTMLElement>document.getElementById('menu-content');

		DOM.elMapOptions = <HTMLElement>document.getElementById('meta-map');
		DOM.elMapOptionsApply = <HTMLElement>document.getElementById('map-options-apply');
		DOM.elMapOptionsCancel = <HTMLElement>document.getElementById('map-options-cancel');
		DOM.elMapOptionsLocation = <HTMLElement>document.getElementById('map-options-location');
		DOM.elMapOptionsValueColorCeiling = <HTMLInputElement>document.getElementById('map-options-value-color-ceiling');
		DOM.elMapOptionsValueColorFloor = <HTMLInputElement>document.getElementById('map-options-value-color-floor');
		DOM.elMapOptionsValueId = <HTMLInputElement>document.getElementById('map-options-value-id');
		DOM.elMapOptionsValueMusic = <HTMLInputElement>document.getElementById('map-options-value-music');
		DOM.elMapOptionsValueStartingPositionR = <HTMLInputElement>document.getElementById('map-options-value-starting-position-r');
		DOM.elMapOptionsValueStartingPositionX = <HTMLInputElement>document.getElementById('map-options-value-starting-position-x');
		DOM.elMapOptionsValueStartingPositionY = <HTMLInputElement>document.getElementById('map-options-value-starting-position-y');
		DOM.elMapOptionsValueTimeParInSeconds = <HTMLInputElement>document.getElementById('map-options-value-time-par-seconds');

		DOM.elPerformance = <HTMLElement>document.getElementById('performance');
		DOM.elPerformanceCalcMain = <HTMLElement>document.getElementById('performance-calc-main');
		DOM.elPerformanceCalcMainAll = <HTMLElement>document.getElementById('performance-calc-main-all');
		DOM.elPerformanceCalcMainAudio = <HTMLElement>document.getElementById('performance-calc-main-audio');
		DOM.elPerformanceCalcMainCPS = <HTMLElement>document.getElementById('performance-calc-main-cps');
		DOM.elPerformanceCalcPath = <HTMLElement>document.getElementById('performance-calc-path');
		DOM.elPerformanceCalcPathAll = <HTMLElement>document.getElementById('performance-calc-path-all');
		DOM.elPerformanceCalcPathIndividual = <HTMLElement>document.getElementById('performance-calc-path-individual');
		DOM.elPerformanceVideoEditor = <HTMLElement>document.getElementById('performance-video-editor');
		DOM.elPerformanceVideoEditorAll = <HTMLElement>document.getElementById('performance-video-editor-all');
		DOM.elPerformanceVideoEditorCells = <HTMLElement>document.getElementById('performance-video-editor-cells');
		DOM.elPerformanceVideoEditorCV = <HTMLElement>document.getElementById('performance-video-editor-cv');
		DOM.elPerformanceVideoEditorFPS = <HTMLElement>document.getElementById('performance-video-editor-fps');
		DOM.elPerformanceVideoPlayer1 = <HTMLElement>document.getElementById('performance-video-player1');
		DOM.elPerformanceVideoPlayer1All = <HTMLElement>document.getElementById('performance-video-player1-all');
		DOM.elPerformanceVideoPlayer1FPS = <HTMLElement>document.getElementById('performance-video-player1-fps');
		DOM.elPerformanceVideoPlayer1NPCCV = <HTMLElement>document.getElementById('performance-video-player1-npc-cv');
		DOM.elPerformanceVideoPlayer1Ray = <HTMLElement>document.getElementById('performance-video-player1-ray');
		DOM.elPerformanceVideoPlayer1RayCV = <HTMLElement>document.getElementById('performance-video-player1-ray-cv');
		DOM.elPerformanceVideoPlayer1Sprite = <HTMLElement>document.getElementById('performance-video-player1-sprite');
		DOM.elPerformanceVideoPlayer2 = <HTMLElement>document.getElementById('performance-video-player2');
		DOM.elPerformanceVideoPlayer2All = <HTMLElement>document.getElementById('performance-video-player2-all');
		DOM.elPerformanceVideoPlayer2FPS = <HTMLElement>document.getElementById('performance-video-player2-fps');
		DOM.elPerformanceVideoPlayer2NPCCV = <HTMLElement>document.getElementById('performance-video-player2-npc-cv');
		DOM.elPerformanceVideoPlayer2Ray = <HTMLElement>document.getElementById('performance-video-player2-ray');
		DOM.elPerformanceVideoPlayer2RayCV = <HTMLElement>document.getElementById('performance-video-player2-ray-cv');
		DOM.elPerformanceVideoPlayer2Sprite = <HTMLElement>document.getElementById('performance-video-player2-sprite');

		DOM.elPlayerJoystick1 = document.createElement('div');
		DOM.elPlayerJoystick1.className = 'joystick';
		DOM.elPlayerJoystick1.id = 'joystick1';
		DOM.elPlayerJoystick1Thumb = document.createElement('div');
		DOM.elPlayerJoystick1Thumb.className = 'thumb';
		DOM.elPlayerJoystick1Thumb.id = 'joystick1-thumb';
		DOM.elPlayerJoystick1Wrapper = document.createElement('div');
		DOM.elPlayerJoystick1Wrapper.className = 'wrapper';
		DOM.elPlayerJoystick1.appendChild(DOM.elPlayerJoystick1Wrapper);
		DOM.elPlayerJoystick1Wrapper.appendChild(DOM.elPlayerJoystick1Thumb);

		DOM.elPlayerJoystick2 = document.createElement('div');
		DOM.elPlayerJoystick2.className = 'joystick';
		DOM.elPlayerJoystick2.id = 'joystick2';
		DOM.elPlayerJoystick2Thumb = document.createElement('div');
		DOM.elPlayerJoystick2Thumb.className = 'thumb';
		DOM.elPlayerJoystick2Thumb.id = 'joystick2-thumb';
		DOM.elPlayerJoystick2Wrapper = document.createElement('div');
		DOM.elPlayerJoystick2Wrapper.className = 'wrapper';
		DOM.elPlayerJoystick2.appendChild(DOM.elPlayerJoystick2Wrapper);
		DOM.elPlayerJoystick2Wrapper.appendChild(DOM.elPlayerJoystick2Thumb);

		DOM.elPlayerOverlay1 = <HTMLElement>document.getElementById('player-overlay-1');
		DOM.elPlayerOverlay1Ammo = <HTMLElement>document.getElementById('player-overlay-1-ammo');
		DOM.elPlayerOverlay1AmmoTitle = <HTMLElement>document.getElementById('player-overlay-1-ammo-title');
		DOM.elPlayerOverlay1Health = <HTMLElement>document.getElementById('player-overlay-1-health');
		DOM.elPlayerOverlay1HealthTitle = <HTMLElement>document.getElementById('player-overlay-1-health-title');
		DOM.elPlayerOverlay1Key1 = <HTMLElement>document.getElementById('player-overlay-1-key1');
		DOM.elPlayerOverlay1Key2 = <HTMLElement>document.getElementById('player-overlay-1-key2');
		DOM.elPlayerOverlay1Lives = <HTMLElement>document.getElementById('player-overlay-1-lives');
		DOM.elPlayerOverlay1LivesTitle = <HTMLElement>document.getElementById('player-overlay-1-lives-title');
		DOM.elPlayerOverlay2 = <HTMLElement>document.getElementById('player-overlay-2');
		DOM.elPlayerOverlay2Ammo = <HTMLElement>document.getElementById('player-overlay-2-ammo');
		DOM.elPlayerOverlay2AmmoTitle = <HTMLElement>document.getElementById('player-overlay-2-ammo-title');
		DOM.elPlayerOverlay2Health = <HTMLElement>document.getElementById('player-overlay-2-health');
		DOM.elPlayerOverlay2HealthTitle = <HTMLElement>document.getElementById('player-overlay-2-health-title');
		DOM.elPlayerOverlay2Key1 = <HTMLElement>document.getElementById('player-overlay-2-key1');
		DOM.elPlayerOverlay2Key2 = <HTMLElement>document.getElementById('player-overlay-2-key2');
		DOM.elPlayerOverlay2Lives = <HTMLElement>document.getElementById('player-overlay-2-lives');
		DOM.elPlayerOverlay2LivesTitle = <HTMLElement>document.getElementById('player-overlay-2-lives-title');

		DOM.elScreenBlack = <HTMLElement>document.getElementById('screen-black');
		DOM.elScreenCredits = <HTMLElement>document.getElementById('screen-credits');

		DOM.elScreenLevelEnd = <HTMLElement>document.getElementById('screen-level-end');
		DOM.elScreenLevelEndBonus = <HTMLElement>document.getElementById('screen-level-end-bonus');
		DOM.elScreenLevelEndCompleted = <HTMLElement>document.getElementById('screen-level-end-completed');
		DOM.elScreenLevelEndImage1 = <HTMLImageElement>document.getElementById('screen-level-end-image1');
		DOM.elScreenLevelEndImage2 = <HTMLImageElement>document.getElementById('screen-level-end-image2');
		DOM.elScreenLevelEndFloor = <HTMLElement>document.getElementById('screen-level-end-floor');
		DOM.elScreenLevelEndRatioKill = <HTMLElement>document.getElementById('screen-level-end-ratio-kill');
		DOM.elScreenLevelEndRatioSecret = <HTMLElement>document.getElementById('screen-level-end-ratio-secret');
		DOM.elScreenLevelEndRatioTreasure = <HTMLElement>document.getElementById('screen-level-end-ratio-treasure');
		DOM.elScreenLevelEndTime = <HTMLElement>document.getElementById('screen-level-end-time');
		DOM.elScreenLevelEndTimePar = <HTMLElement>document.getElementById('screen-level-end-time-par');

		DOM.elScreenRating = <HTMLElement>document.getElementById('screen-rating');
		DOM.elScreenStats = <HTMLElement>document.getElementById('screen-stats');
		DOM.elScreenTitle = <HTMLElement>document.getElementById('screen-title');

		DOM.elSettings = <HTMLElement>document.getElementById('settings');
		DOM.elSettingsApply = <HTMLElement>document.getElementById('settings-apply');
		DOM.elSettingsBodyAudio = <HTMLElement>document.getElementById('settings-body-audio');
		DOM.elSettingsBodyEditor = <HTMLElement>document.getElementById('settings-body-editor');
		DOM.elSettingsBodyGame = <HTMLElement>document.getElementById('settings-body-game');
		DOM.elSettingsBodyGraphics = <HTMLElement>document.getElementById('settings-body-graphics');
		DOM.elSettingsCancel = <HTMLElement>document.getElementById('settings-cancel');
		DOM.elSettingsSubAudio = <HTMLElement>document.getElementById('settings-sub-audio');
		DOM.elSettingsSubEditor = <HTMLElement>document.getElementById('settings-sub-editor');
		DOM.elSettingsSubGame = <HTMLElement>document.getElementById('settings-sub-game');
		DOM.elSettingsSubGraphics = <HTMLElement>document.getElementById('settings-sub-graphics');

		DOM.elSettingsValueAudioVolume = <HTMLInputElement>document.getElementById('settings-value-audio-volume');
		DOM.elSettingsValueAudioVolumeReadout = <HTMLInputElement>document.getElementById('settings-value-audio-volume-readout');

		DOM.elSettingsValueAudioVolumeEffect = <HTMLInputElement>document.getElementById('settings-value-audio-volume-effect');
		DOM.elSettingsValueAudioVolumeEffectReadout = <HTMLInputElement>document.getElementById('settings-value-audio-volume-effect-readout');

		DOM.elSettingsValueAudioVolumeMusic = <HTMLInputElement>document.getElementById('settings-value-audio-volume-music');
		DOM.elSettingsValueAudioVolumeMusicReadout = <HTMLInputElement>document.getElementById('settings-value-audio-volume-music-readout');

		DOM.elSettingsValueAudioNoAction = <HTMLInputElement>document.getElementById('settings-value-audio-no-action');
		DOM.elSettingsValueAudioWallCollisions = <HTMLInputElement>document.getElementById('settings-value-audio-wall-collision');
		DOM.elSettingsValueEditorDrawGrid = <HTMLInputElement>document.getElementById('settings-value-editor-cell-draw-grid');
		DOM.elSettingsValueGameCrosshair = <HTMLInputElement>document.getElementById('settings-value-game-crosshair');
		DOM.elSettingsValueGameDebug = <HTMLInputElement>document.getElementById('settings-value-game-debug');
		DOM.elSettingsValueGameDifficulty = <HTMLInputElement>document.getElementById('settings-value-game-difficulty');
		DOM.elSettingsValueGameMultiplayer = <HTMLInputElement>document.getElementById('settings-value-game-multiplayer');
		DOM.elSettingsValueGamePlayer2InputDevice = <HTMLInputElement>document.getElementById('settings-value-game-player2-input');
		DOM.elSettingsValueGraphicsAntialias = <HTMLInputElement>document.getElementById('settings-value-graphics-antialias');
		DOM.elSettingsValueGraphicsDPI = <HTMLInputElement>document.getElementById('settings-value-graphics-dpi');

		DOM.elSettingsValueGraphicsFOV = <HTMLInputElement>document.getElementById('settings-value-graphics-fov');
		DOM.elSettingsValueGraphicsFOV.oninput = () => {
			DOM.elSettingsValueGraphicsFOVReadout.value = DOM.elSettingsValueGraphicsFOV.value + '°';
		};
		DOM.elSettingsValueGraphicsFOVReadout = <HTMLInputElement>document.getElementById('settings-value-graphics-fov-readout');

		DOM.elSettingsValueGraphicsFPS = <HTMLInputElement>document.getElementById('settings-value-graphics-fps');
		DOM.elSettingsValueGraphicsFPSShow = <HTMLInputElement>document.getElementById('settings-value-graphics-fps-show');

		DOM.elSettingsValueGraphicsGamma = <HTMLInputElement>document.getElementById('settings-value-graphics-gamma');
		DOM.elSettingsValueGraphicsGamma.oninput = () => {
			DOM.elSettingsValueGraphicsGammaReadout.value = (Number(DOM.elSettingsValueGraphicsGamma.value) - 1).toFixed(1).padStart(4, ' ');
		};
		DOM.elSettingsValueGraphicsGammaReadout = <HTMLInputElement>document.getElementById('settings-value-graphics-gamma-readout');

		DOM.elSettingsValueGraphicsGrayscale = <HTMLInputElement>document.getElementById('settings-value-graphics-grayscale');
		DOM.elSettingsValueGraphicsLightingQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-lighting');
		DOM.elSettingsValueGraphicsRaycastQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-raycast-quality');
		DOM.elSettingsValueGraphicsResolution = <HTMLInputElement>document.getElementById('settings-value-graphics-resolution');

		DOM.elSpinner = <HTMLElement>document.getElementById('spinner');
		DOM.elStatFPS = <HTMLElement>document.getElementById('stat-fps');

		DOM.elVideo = <HTMLElement>document.getElementById('video');
		DOM.elVideoInteractive = <HTMLElement>document.getElementById('video-interactive');
		DOM.elVersion = <HTMLAnchorElement>document.getElementById('version');

		DOM.elWeapons = <HTMLElement>document.getElementById('weapons');
		DOM.elWeapon1 = <HTMLElement>document.getElementById('weapon1');
		DOM.elWeapon2 = <HTMLElement>document.getElementById('weapon2');
		DOM.elWeapon3 = <HTMLElement>document.getElementById('weapon3');
		DOM.elWeapon4 = <HTMLElement>document.getElementById('weapon4');

		// Done
		DOM.elVersion.innerText = packageJSON.version;
	}

	public static initializeDomEditMenu(): void {
		let assetImageData: Map<AssetIdImg, string> = Assets.dataImage,
			assetImageDataCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, string>> = Assets.dataImageCharacters,
			assetImageDataCharactersInstance: Map<AssetIdImgCharacter, string>,
			assetId: AssetIdImg,
			boss: boolean,
			character: AssetIdImgCharacter,
			characterMenu: AssetIdImgCharacter[] = assetIdImgCharacterMenu,
			characterType: AssetIdImgCharacterType,
			elementContainer: HTMLElement,
			elementContent: HTMLElement,
			elementContentImage: HTMLImageElement,
			elementContentTitle: HTMLElement,
			properties: AssetPropertiesAudio | AssetPropertiesImage;

		/**
		 * Populate Content
		 */

		// Characters
		for ([characterType, assetImageDataCharactersInstance] of assetImageDataCharacters) {
			for (character of characterMenu) {
				properties = (<any>assetsImageCharacters.get(characterType)).get(character);

				switch (characterType) {
					case AssetIdImgCharacterType.BOSS_HANS_GROSSE:
						boss = true;
						elementContainer = DOM.elEditorContainerCharactersBossContent;
						break;
					case AssetIdImgCharacterType.GUARD:
						boss = false;
						elementContainer = DOM.elEditorContainerCharactersGuardContent;
						break;
					case AssetIdImgCharacterType.OFFICER:
						boss = false;
						elementContainer = DOM.elEditorContainerCharactersOfficerContent;
						break;
					case AssetIdImgCharacterType.RAT:
						boss = false;
						elementContainer = DOM.elEditorContainerCharactersRatContent;
						break;
					case AssetIdImgCharacterType.SS:
						boss = false;
						elementContainer = DOM.elEditorContainerCharactersSSContent;
						break;
				}

				if (boss === true && character !== AssetIdImgCharacter.MOVE1_S && character !== AssetIdImgCharacter.STAND_S) {
					continue;
				}

				elementContent = document.createElement('div');
				elementContent.className = 'item';
				elementContent.id = `${characterType}__${character}`;
				elementContainer.appendChild(elementContent);
				DOM.elEditorItemsCharacters.push(elementContent);

				elementContentImage = document.createElement('img');
				elementContentImage.className = 'image';
				elementContentImage.src = <string>assetImageDataCharactersInstance.get(character);
				elementContent.appendChild(elementContentImage);

				elementContentTitle = document.createElement('div');
				elementContentTitle.className = 'title';
				elementContentTitle.innerText = properties.title;
				elementContent.appendChild(elementContentTitle);
			}
		}

		// Objects
		for ([assetId, properties] of assetsImages) {
			if ((<AssetPropertiesImage>properties).hide === true) {
				continue;
			}

			switch ((<AssetPropertiesImage>properties).category) {
				case AssetImgCategory.CHARACTER:
				case AssetImgCategory.MENU:
				case AssetImgCategory.TAG:
				case AssetImgCategory.WEAPON:
					continue;
				case AssetImgCategory.EXTENDED:
					elementContainer = DOM.elEditorContainerExtendedContent;
					break;
				case AssetImgCategory.LIGHT:
					elementContainer = DOM.elEditorContainerObjectsSpritesLightsContent;
					break;
				case AssetImgCategory.SPRITE:
					elementContainer = DOM.elEditorContainerObjectsSpritesContent;
					break;
				case AssetImgCategory.SPRITE_PICKUP:
					elementContainer = DOM.elEditorContainerObjectsPickupsContent;
					break;
				case AssetImgCategory.WALL:
					elementContainer = DOM.elEditorContainerObjectsWallsContent;
					break;
				case AssetImgCategory.WAYPOINT:
					elementContainer = DOM.elEditorContainerObjectsWaypointsContent;
					break;
			}

			elementContent = document.createElement('div');
			elementContent.className = 'item';
			elementContent.id = String(assetId);
			elementContainer.appendChild(elementContent);
			DOM.elEditorItemsObjects.push(elementContent);

			elementContentImage = document.createElement('img');
			elementContentImage.className = 'image';
			elementContentImage.src = <string>assetImageData.get(assetId);
			elementContent.appendChild(elementContentImage);

			elementContentTitle = document.createElement('div');
			elementContentTitle.className = 'title';
			elementContentTitle.innerText = properties.title;
			elementContent.appendChild(elementContentTitle);
		}
	}

	// Assets needs to be loaded
	public static initializeScreens(): void {
		DOM.elGameMenuBanners.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.BANNER_BAR)})`;
		DOM.elGameMenuBannersGameLoad.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.BANNER_GAME_LOAD);
		DOM.elGameMenuBannersGameSave.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.BANNER_GAME_SAVE);
		DOM.elGameMenuBannersOptions.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.BANNER_OPTIONS);
		DOM.elGameMenuDifficultyHead1.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.DIFFICULTY_EASY)})`;
		DOM.elGameMenuDifficultyHead2.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.DIFFICULTY_NORMAL)})`;
		DOM.elGameMenuDifficultyHead3.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.DIFFICULTY_HARD)})`;
		DOM.elGameMenuDifficultyHead4.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.DIFFICULTY_INSANE)})`;
		DOM.elGameMenuInstructions.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.KEYS)})`;

		// Meta menu options
		let option: HTMLOptionElement;
		for (let i = 0; i < 60; i++) {
			option = document.createElement('option');
			option.innerText = AssetIdMap[i];
			option.value = String(i);
			DOM.elMapOptionsValueId.appendChild(option);
		}
		for (let assetIdAudio of AssetIdMusicLevels) {
			option = document.createElement('option');
			option.innerText = (assetsAudio.get(assetIdAudio) || {}).title || '???';
			option.value = String(assetIdAudio);
			DOM.elMapOptionsValueMusic.appendChild(option);
		}

		DOM.elPlayerOverlay1AmmoTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_AMMO)})`;
		DOM.elPlayerOverlay1HealthTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_HEALTH)})`;
		DOM.elPlayerOverlay1Key1.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_KEY_1)})`;
		DOM.elPlayerOverlay1Key2.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_KEY_2)})`;
		DOM.elPlayerOverlay1LivesTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_LIVES)})`;

		DOM.elPlayerOverlay2AmmoTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_AMMO)})`;
		DOM.elPlayerOverlay2HealthTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_HEALTH)})`;
		DOM.elPlayerOverlay2Key1.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_KEY_1)})`;
		DOM.elPlayerOverlay2Key2.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_KEY_2)})`;
		DOM.elPlayerOverlay2LivesTitle.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.HUD_LIVES)})`;

		(<HTMLElement>DOM.elGameMenuEpisodes1.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_1)})`;
		(<HTMLElement>DOM.elGameMenuEpisodes2.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_2)})`;
		(<HTMLElement>DOM.elGameMenuEpisodes3.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_3)})`;
		(<HTMLElement>DOM.elGameMenuEpisodes4.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_4)})`;
		(<HTMLElement>DOM.elGameMenuEpisodes5.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_5)})`;
		(<HTMLElement>DOM.elGameMenuEpisodes6.children[0]).style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.EPISODE_6)})`;

		DOM.elGameMenuPistol.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.MENU_PISTOL)})`;

		DOM.elScreenLevelEndImage1.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.END_FLOOR_PISTOL_1);
		DOM.elScreenLevelEndImage2.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.END_FLOOR_PISTOL_2);
		DOM.elScreenCredits.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.CREDITS)})`;
		DOM.elScreenRating.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.RATING)})`;
		DOM.elScreenStats.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.SCREEN_STATS)})`;
		DOM.elScreenTitle.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.SCREEN_TITLE)})`;

		DOM.elWeapons.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.WEAPONS_BACKGROUND)})`;
		DOM.elWeapon1.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.WEAPONS_1)})`;
		DOM.elWeapon2.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.WEAPONS_2)})`;
		DOM.elWeapon3.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.WEAPONS_3)})`;
		DOM.elWeapon4.style.backgroundImage = `url(${Assets.dataImageMenus.get(AssetIdImgMenu.WEAPONS_4)})`;
	}

	public static screenControl(screen: HTMLElement): void {
		if (DOM.elScreenActive === undefined) {
			screen.style.display = 'flex';

			DOM.elScreenActive = screen;
		} else {
			clearTimeout(DOM.timeoutScreen);
			DOM.elScreenBlack.classList.remove('fadein');
			DOM.elScreenBlack.style.display = 'flex';

			DOM.timeoutScreen = setTimeout(() => {
				DOM.elScreenBlack.classList.add('fadein');

				// Now black
				DOM.timeoutScreen = setTimeout(() => {
					DOM.elScreenActive.style.display = 'none';
					screen.style.display = 'flex';

					DOM.elScreenActive = screen;
					DOM.elScreenBlack.classList.remove('fadein');

					DOM.timeoutScreen = setTimeout(() => {
						DOM.elScreenBlack.style.display = 'none';
					}, 500);
				}, 500);
			}, 500);
		}
	}

	public static error() {
		DOM.elError.style.display = 'flex';
		setTimeout(() => {
			DOM.elError.classList.add('show');

			clearTimeout(DOM.timeoutError);
			DOM.timeoutError = setTimeout(() => {
				DOM.elError.classList.remove('show');

				DOM.timeoutError = setTimeout(() => {
					DOM.elError.style.display = 'none';
				}, 1000);
			}, 3000);

			DOM.spinner(false);
		}, 10);
	}

	public static spinner(enable: boolean) {
		clearTimeout(DOM.timeoutSpinner);

		if (enable === true) {
			DOM.timeoutSpinner = setTimeout(() => {
				if (DOM.elSpinner.style.display !== 'flex') {
					DOM.elSpinner.classList.remove('show');
					DOM.elSpinner.style.display = 'flex';

					DOM.timeoutSpinner = setTimeout(() => {
						DOM.elSpinner.classList.add('show');
					}, 10);
				} else {
					DOM.elSpinner.classList.add('show');
				}
			}, 10);
		} else {
			DOM.timeoutSpinner = setTimeout(() => {
				DOM.elSpinner.classList.remove('show');

				DOM.timeoutSpinner = setTimeout(() => {
					DOM.elSpinner.style.display = 'none';
				}, 1000);
			}, 10);
		}
	}
}
