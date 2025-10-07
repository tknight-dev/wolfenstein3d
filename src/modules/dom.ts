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
	public static elButtonPlay: HTMLElement;
	public static elButtonUpload: HTMLElement;
	public static elCanvases: HTMLCanvasElement[];
	public static elEdit: HTMLElement;
	public static elEditor: HTMLElement;
	public static elEditorCommandFindAndReplace: HTMLElement;
	public static elEditorCommandMetaMenu: HTMLElement;
	public static elEditorCommandResetMap: HTMLElement;
	public static elEditorContainerCharacters: HTMLElement;
	public static elEditorContainerCharactersGuardContent: HTMLElement;
	public static elEditorContainerObjects: HTMLElement;
	public static elEditorContainerObjectsPickups: HTMLElement;
	public static elEditorContainerObjectsPickupsContent: HTMLElement;
	public static elEditorContainerObjectsSprites: HTMLElement;
	public static elEditorContainerObjectsSpritesContent: HTMLElement;
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
	public static elEditorHandleHide: HTMLElement;
	public static elEditorItemActive: HTMLElement | undefined;
	public static elEditorItemsCharacters: HTMLElement[] = [];
	public static elEditorItemsObjects: HTMLElement[] = [];
	public static elEditorProperties: HTMLElement;
	public static elEditorPropertiesCellContainer: HTMLElement;
	public static elEditorPropertiesCellInputs: HTMLInputElement[];
	public static elEditorPropertiesCellInputExtended: HTMLInputElement;
	public static elEditorPropertiesCellInputFloor: HTMLInputElement;
	public static elEditorPropertiesCellInputLight: HTMLInputElement;
	public static elEditorPropertiesCellInputSpriteFixedH: HTMLInputElement;
	public static elEditorPropertiesCellInputSpriteFixedV: HTMLInputElement;
	public static elEditorPropertiesCellInputWallMovable: HTMLInputElement;
	public static elEditorPropertiesCellInputWall: HTMLInputElement;
	public static elEditorPropertiesCellInputWallInvisible: HTMLInputElement;
	public static elEditorPropertiesCellOutputAssetId: HTMLElement;
	public static elEditorPropertiesCellOutputIndex: HTMLElement;
	public static elEditorPropertiesCellOutputPosition: HTMLElement;
	public static elEditorPropertiesCellOutputProperties: HTMLElement;
	public static elEditorPropertiesCellOutputValue: HTMLElement;
	public static elEditorPropertiesCellExtended: HTMLElement;
	public static elEditorPropertiesCellExtendedInputTeleport: HTMLInputElement;
	public static elEditorPropertiesCellExtendedInputDoor: HTMLInputElement;
	public static elEditorPropertiesCellExtendedInputDoorLocked1: HTMLInputElement;
	public static elEditorPropertiesCellExtendedInputDoorLocked2: HTMLInputElement;
	public static elEditorPropertiesCellExtendedInputs: HTMLInputElement[];
	public static elEditorPropertiesCellExtendedInputSwitch: HTMLInputElement;
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
	public static elIconsBottom: HTMLElement;
	public static elIconsTop: HTMLElement;
	public static elInfoMenu: HTMLElement;
	public static elInfoSettings: HTMLElement;
	public static elLogo: HTMLElement;
	public static elMenuContent: HTMLElement;
	public static elMetaMap: HTMLElement;
	public static elMetaMapApply: HTMLElement;
	public static elMetaMapCancel: HTMLElement;
	public static elMetaMapLocation: HTMLElement;
	public static elMetaMapValueStartingPositionR: HTMLInputElement;
	public static elMetaMapValueStartingPositionX: HTMLInputElement;
	public static elMetaMapValueStartingPositionY: HTMLInputElement;
	public static elPlayerOverlay1: HTMLElement;
	public static elPlayerOverlay1Ammo: HTMLElement;
	public static elPlayerOverlay1Health: HTMLElement;
	public static elPlayerOverlay1Lives: HTMLElement;
	public static elPlayerOverlay2: HTMLElement;
	public static elPlayerOverlay2Ammo: HTMLElement;
	public static elPlayerOverlay2Health: HTMLElement;
	public static elPlayerOverlay2Lives: HTMLElement;
	public static elScreenActive: HTMLElement;
	public static elScreenBlack: HTMLElement;
	public static elScreenLevelEnd: HTMLElement;
	public static elScreenLevelEndImage1: HTMLImageElement;
	public static elScreenLevelEndImage2: HTMLImageElement;
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
	public static elSettingsValueAudioVolumeEffect: HTMLInputElement;
	public static elSettingsValueAudioVolumeMusic: HTMLInputElement;
	public static elSettingsValueAudioNoAction: HTMLInputElement;
	public static elSettingsValueAudioWallCollisions: HTMLInputElement;
	public static elSettingsValueEditorDrawGrid: HTMLInputElement;
	public static elSettingsValueGameDebug: HTMLInputElement;
	public static elSettingsValueGameDifficulty: HTMLInputElement;
	public static elSettingsValueGameMultiplayer: HTMLInputElement;
	public static elSettingsValueGamePlayer1InputDevice: HTMLInputElement;
	public static elSettingsValueGraphicsAntialias: HTMLInputElement;
	public static elSettingsValueGraphicsDPI: HTMLInputElement;
	public static elSettingsValueGraphicsFOV: HTMLInputElement;
	public static elSettingsValueGraphicsFPS: HTMLInputElement;
	public static elSettingsValueGraphicsFPSShow: HTMLInputElement;
	public static elSettingsValueGraphicsGamma: HTMLInputElement;
	public static elSettingsValueGraphicsGrayscale: HTMLInputElement;
	public static elSettingsValueGraphicsLightingQuality: HTMLInputElement;
	public static elSettingsValueGraphicsRaycastQuality: HTMLInputElement;
	public static elSettingsValueGraphicsResolution: HTMLInputElement;
	public static elSpinner: HTMLElement;
	public static elStatFPS: HTMLElement;
	public static elVideo: HTMLElement;
	public static elVideoInteractive: HTMLElement;
	public static elVersion: HTMLAnchorElement;
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
		DOM.elButtonPlay = <HTMLElement>document.getElementById('button-play');
		DOM.elButtonUpload = <HTMLElement>document.getElementById('button-upload');

		DOM.elEdit = document.createElement('div');
		DOM.elEdit.className = 'edit';
		DOM.elEdit.id = 'edit';

		DOM.elEditor = <HTMLElement>document.getElementById('editor');
		DOM.elEditorCommandFindAndReplace = <HTMLElement>document.getElementById('editor-cell-command-toggle-find-and-replace');
		DOM.elEditorCommandMetaMenu = <HTMLElement>document.getElementById('editor-cell-command-toggle-meta');
		DOM.elEditorCommandResetMap = <HTMLElement>document.getElementById('editor-cell-command-toggle-reset');
		DOM.elEditorContainerCharacters = <HTMLElement>document.getElementById('editor-cell-container-characters');
		DOM.elEditorContainerCharactersGuardContent = <HTMLElement>document.getElementById('editor-cell-container-characters-guard-content');
		DOM.elEditorContainerObjects = <HTMLElement>document.getElementById('editor-cell-container-objects');
		DOM.elEditorContainerObjectsPickups = <HTMLElement>document.getElementById('editor-cell-container-pickups');
		DOM.elEditorContainerObjectsPickupsContent = <HTMLElement>document.getElementById('editor-cell-container-pickups-content');
		DOM.elEditorContainerObjectsSprites = <HTMLElement>document.getElementById('editor-cell-container-sprites');
		DOM.elEditorContainerObjectsSpritesContent = <HTMLElement>document.getElementById('editor-cell-container-sprites-content');
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
		DOM.elEditorPropertiesCellInputExtended = <HTMLInputElement>document.getElementById('editor-cell-extended');
		DOM.elEditorPropertiesCellInputExtended.oninput = () => {
			if (DOM.elEditorPropertiesCellInputExtended.checked === true) {
				DOM.elEditorPropertiesCellExtended.classList.add('show');
			} else {
				DOM.elEditorPropertiesCellExtended.classList.remove('show');
			}
		};

		DOM.elEditorPropertiesCellInputFloor = <HTMLInputElement>document.getElementById('editor-cell-floor');
		DOM.elEditorPropertiesCellInputLight = <HTMLInputElement>document.getElementById('editor-cell-light');

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

		DOM.elEditorPropertiesCellInputWall = <HTMLInputElement>document.getElementById('editor-cell-wall');
		DOM.elEditorPropertiesCellInputWallInvisible = <HTMLInputElement>document.getElementById('editor-cell-wall-invisible');
		DOM.elEditorPropertiesCellInputWallMovable = <HTMLInputElement>document.getElementById('editor-cell-wall-movable');
		DOM.elEditorPropertiesCellInputs = [
			DOM.elEditorPropertiesCellInputExtended,
			DOM.elEditorPropertiesCellInputFloor,
			DOM.elEditorPropertiesCellInputLight,
			DOM.elEditorPropertiesCellInputSpriteFixedH,
			DOM.elEditorPropertiesCellInputSpriteFixedV,
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

		DOM.elEditorPropertiesCellExtended = <HTMLElement>document.getElementById('editor-properties-cell-extended');
		DOM.elEditorPropertiesCellExtendedInputDoor = <HTMLInputElement>document.getElementById('editor-cell-cell-extended-door');
		DOM.elEditorPropertiesCellExtendedInputDoorLocked1 = <HTMLInputElement>document.getElementById('editor-cell-cell-extended-door-locked1');
		DOM.elEditorPropertiesCellExtendedInputDoorLocked2 = <HTMLInputElement>document.getElementById('editor-cell-cell-extended-door-locked2');
		DOM.elEditorPropertiesCellExtendedInputSwitch = <HTMLInputElement>document.getElementById('editor-cell-extended-switch');
		DOM.elEditorPropertiesCellExtendedInputTeleport = <HTMLInputElement>document.getElementById('editor-cell-extended-teleport');
		DOM.elEditorPropertiesCellExtendedInputs = [
			DOM.elEditorPropertiesCellExtendedInputDoor,
			DOM.elEditorPropertiesCellExtendedInputDoorLocked1,
			DOM.elEditorPropertiesCellExtendedInputDoorLocked2,
			DOM.elEditorPropertiesCellExtendedInputSwitch,
			// DOM.elEditorPropertiesCellExtendedInputTeleport,
		];

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
		DOM.elIconsBottom = <HTMLElement>document.getElementById('icons-bottom');
		DOM.elIconsTop = <HTMLElement>document.getElementById('icons-top');
		DOM.elInfoMenu = <HTMLElement>document.getElementById('info-menu');
		DOM.elInfoSettings = <HTMLElement>document.getElementById('info-settings');
		DOM.elLogo = <HTMLElement>document.getElementById('logo');
		DOM.elMenuContent = <HTMLElement>document.getElementById('menu-content');

		DOM.elMetaMap = <HTMLElement>document.getElementById('meta-map');
		DOM.elMetaMapApply = <HTMLElement>document.getElementById('meta-map-apply');
		DOM.elMetaMapCancel = <HTMLElement>document.getElementById('meta-map-cancel');
		DOM.elMetaMapLocation = <HTMLElement>document.getElementById('meta-map-location');
		DOM.elMetaMapValueStartingPositionR = <HTMLInputElement>document.getElementById('meta-map-value-starting-position-r');
		DOM.elMetaMapValueStartingPositionX = <HTMLInputElement>document.getElementById('meta-map-value-starting-position-x');
		DOM.elMetaMapValueStartingPositionY = <HTMLInputElement>document.getElementById('meta-map-value-starting-position-y');

		DOM.elPlayerOverlay1 = <HTMLElement>document.getElementById('player-overlay-1');
		DOM.elPlayerOverlay1Ammo = <HTMLElement>document.getElementById('player-overlay-1-ammo');
		DOM.elPlayerOverlay1Health = <HTMLElement>document.getElementById('player-overlay-1-health');
		DOM.elPlayerOverlay1Lives = <HTMLElement>document.getElementById('player-overlay-1-lives');
		DOM.elPlayerOverlay2 = <HTMLElement>document.getElementById('player-overlay-2');
		DOM.elPlayerOverlay2Ammo = <HTMLElement>document.getElementById('player-overlay-2-ammo');
		DOM.elPlayerOverlay2Health = <HTMLElement>document.getElementById('player-overlay-2-health');
		DOM.elPlayerOverlay2Lives = <HTMLElement>document.getElementById('player-overlay-2-lives');

		DOM.elScreenBlack = <HTMLElement>document.getElementById('screen-black');
		DOM.elScreenLevelEnd = <HTMLElement>document.getElementById('screen-level-end');
		DOM.elScreenLevelEndImage1 = <HTMLImageElement>document.getElementById('screen-level-end-image1');
		DOM.elScreenLevelEndImage2 = <HTMLImageElement>document.getElementById('screen-level-end-image2');
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
		DOM.elSettingsValueAudioVolumeEffect = <HTMLInputElement>document.getElementById('settings-value-audio-volume-effect');
		DOM.elSettingsValueAudioVolumeMusic = <HTMLInputElement>document.getElementById('settings-value-audio-volume-music');
		DOM.elSettingsValueAudioNoAction = <HTMLInputElement>document.getElementById('settings-value-audio-no-action');
		DOM.elSettingsValueAudioWallCollisions = <HTMLInputElement>document.getElementById('settings-value-audio-wall-collision');
		DOM.elSettingsValueEditorDrawGrid = <HTMLInputElement>document.getElementById('settings-value-editor-cell-draw-grid');
		DOM.elSettingsValueGameDebug = <HTMLInputElement>document.getElementById('settings-value-game-debug');
		DOM.elSettingsValueGameDifficulty = <HTMLInputElement>document.getElementById('settings-value-game-difficulty');
		DOM.elSettingsValueGameMultiplayer = <HTMLInputElement>document.getElementById('settings-value-game-multiplayer');
		DOM.elSettingsValueGamePlayer1InputDevice = <HTMLInputElement>document.getElementById('settings-value-game-player1-input');
		DOM.elSettingsValueGraphicsAntialias = <HTMLInputElement>document.getElementById('settings-value-graphics-antialias');
		DOM.elSettingsValueGraphicsDPI = <HTMLInputElement>document.getElementById('settings-value-graphics-dpi');
		DOM.elSettingsValueGraphicsFOV = <HTMLInputElement>document.getElementById('settings-value-graphics-fov');
		DOM.elSettingsValueGraphicsFPS = <HTMLInputElement>document.getElementById('settings-value-graphics-fps');
		DOM.elSettingsValueGraphicsFPSShow = <HTMLInputElement>document.getElementById('settings-value-graphics-fps-show');
		DOM.elSettingsValueGraphicsGamma = <HTMLInputElement>document.getElementById('settings-value-graphics-gamma');
		DOM.elSettingsValueGraphicsGrayscale = <HTMLInputElement>document.getElementById('settings-value-graphics-grayscale');
		DOM.elSettingsValueGraphicsLightingQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-lighting');
		DOM.elSettingsValueGraphicsRaycastQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-raycast-quality');
		DOM.elSettingsValueGraphicsResolution = <HTMLInputElement>document.getElementById('settings-value-graphics-resolution');

		DOM.elSpinner = <HTMLElement>document.getElementById('spinner');
		DOM.elStatFPS = <HTMLElement>document.getElementById('stat-fps');

		DOM.elVideo = <HTMLElement>document.getElementById('video');
		DOM.elVideoInteractive = <HTMLElement>document.getElementById('video-interactive');
		DOM.elVersion = <HTMLAnchorElement>document.getElementById('version');

		// Done
		DOM.elVersion.innerText = packageJSON.version;
	}

	public static initializeDomEditMenu(): void {
		let assetImageData: Map<AssetIdImg, string> = Assets.dataImage,
			assetImageDataCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, string>> = Assets.dataImageCharacters,
			assetImageDataCharactersInstance: Map<AssetIdImgCharacter, string>,
			assetId: AssetIdImg,
			character: AssetIdImgCharacter,
			characterMenu: AssetIdImgCharacter[] = assetIdImgCharacterMenu,
			characterType: AssetIdImgCharacterType,
			data: string | ImageBitmap,
			element: HTMLElement,
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
					case AssetIdImgCharacterType.GUARD:
						elementContainer = DOM.elEditorContainerCharactersGuardContent;
						break;
					case AssetIdImgCharacterType.OFFICER:
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
				case AssetImgCategory.WEAPON:
					continue;
				case AssetImgCategory.EXTENDED:
					elementContainer = DOM.elEditorContainerExtendedContent;
					break;
				case AssetImgCategory.WAYPOINT:
					elementContainer = DOM.elEditorContainerObjectsWaypointsContent;
					break;
				case AssetImgCategory.LIGHT:
				case AssetImgCategory.SPRITE:
					elementContainer = DOM.elEditorContainerObjectsSpritesContent;
					break;
				case AssetImgCategory.SPRITE_PICKUP:
					elementContainer = DOM.elEditorContainerObjectsPickupsContent;
					break;
				case AssetImgCategory.WALL:
					elementContainer = DOM.elEditorContainerObjectsWallsContent;
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
		DOM.elScreenLevelEndImage1.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.END_LEVEL_PISTOL_1);
		DOM.elScreenLevelEndImage2.src = <string>Assets.dataImageMenus.get(AssetIdImgMenu.END_LEVEL_PISTOL_2);
		DOM.elScreenRating.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.RATING)})`;
		DOM.elScreenStats.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.SCREEN_STATS)})`;
		DOM.elScreenTitle.style.backgroundImage = `url(${<string>Assets.dataImageMenus.get(AssetIdImgMenu.SCREEN_TITLE)})`;
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
					}, 1000);
				}, 1000);
			}, 1000);
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
