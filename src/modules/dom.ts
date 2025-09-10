import { Assets } from './assets.js';
import { AssetId, AssetImgCategory, AssetPropertiesAudio, AssetPropertiesImage, assets, AssetType } from '../asset-manager.js';
import packageJSON from '../../package.json' with { type: 'json' };

/**
 * @author tknight-dev
 */

export class DOM {
	public static elButtonApply: HTMLElement;
	public static elButtonDownload: HTMLElement;
	public static elButtonEdit: HTMLElement;
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
	public static elEditorContainer: HTMLElement;
	public static elEditorContainerPickups: HTMLElement;
	public static elEditorContainerPickupsContent: HTMLElement;
	public static elEditorContainerSpecial: HTMLElement;
	public static elEditorContainerSpecialContent: HTMLElement;
	public static elEditorContainerSprites: HTMLElement;
	public static elEditorContainerSpritesContent: HTMLElement;
	public static elEditorContainerWalls: HTMLElement;
	public static elEditorContainerWallsContent: HTMLElement;
	public static elEditorHandleArrow: HTMLElement;
	public static elEditorHandleHide: HTMLElement;
	public static elEditorItemActive: HTMLElement | undefined;
	public static elEditorItems: HTMLElement[] = [];
	public static elEditorProperties: HTMLElement;
	public static elEditorPropertiesHandleArrow: HTMLElement;
	public static elEditorPropertiesHandleHide: HTMLElement;
	public static elEditorPropertiesInputs: HTMLInputElement[];
	public static elEditorPropertiesInputExtended: HTMLInputElement;
	public static elEditorPropertiesInputFloor: HTMLInputElement;
	public static elEditorPropertiesInputLight: HTMLInputElement;
	public static elEditorPropertiesInputSpriteFixedH: HTMLInputElement;
	public static elEditorPropertiesInputSpriteFixedV: HTMLInputElement;
	public static elEditorPropertiesInputSpriteRotating: HTMLInputElement;
	public static elEditorPropertiesInputSpriteWall: HTMLInputElement;
	public static elEditorPropertiesInputSpriteWallInvisible: HTMLInputElement;
	public static elEditorPropertiesOutputAssetId: HTMLElement;
	public static elEditorPropertiesOutputProperties: HTMLElement;
	public static elEditorPropertiesOutputValue: HTMLElement;
	public static elGame: HTMLElement;
	public static elIconsBottom: HTMLElement;
	public static elIconsTop: HTMLElement;
	public static elInfoMenu: HTMLElement;
	public static elInfoSettings: HTMLElement;
	public static elLogo: HTMLElement;
	public static elMenuContent: HTMLElement;
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
	public static elSettingsValueAudioWallCollisions: HTMLInputElement;
	public static elSettingsValueEditorDrawGrid: HTMLInputElement;
	public static elSettingsValueGameMultiplayer: HTMLInputElement;
	public static elSettingsValueGamePlayer2InputDevice: HTMLInputElement;
	public static elSettingsValueGraphicsDPI: HTMLInputElement;
	public static elSettingsValueGraphicsFOV: HTMLInputElement;
	public static elSettingsValueGraphicsFPS: HTMLInputElement;
	public static elSettingsValueGraphicsFPSShow: HTMLInputElement;
	public static elSettingsValueGraphicsGamma: HTMLInputElement;
	public static elSettingsValueGraphicsGrayscale: HTMLInputElement;
	public static elSettingsValueGraphicsLightingQuality: HTMLInputElement;
	public static elSettingsValueGraphicsRaycastQuality: HTMLInputElement;
	public static elSettingsValueGraphicsResolution: HTMLInputElement;
	public static elVideo: HTMLElement;
	public static elVideoInteractive: HTMLElement;
	public static elVersion: HTMLAnchorElement;

	public static initializeDom(): void {
		DOM.elButtonApply = <HTMLElement>document.getElementById('button-apply');
		DOM.elButtonDownload = <HTMLElement>document.getElementById('button-download');
		DOM.elButtonEdit = <HTMLElement>document.getElementById('button-edit');
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
		DOM.elEditorContainer = <HTMLElement>document.getElementById('editor-container');
		DOM.elEditorContainerPickups = <HTMLElement>document.getElementById('editor-container-pickups');
		DOM.elEditorContainerPickupsContent = <HTMLElement>document.getElementById('editor-container-pickups-content');
		DOM.elEditorContainerSpecial = <HTMLElement>document.getElementById('editor-container-special');
		DOM.elEditorContainerSpecialContent = <HTMLElement>document.getElementById('editor-container-special-content');
		DOM.elEditorContainerSprites = <HTMLElement>document.getElementById('editor-container-sprites');
		DOM.elEditorContainerSpritesContent = <HTMLElement>document.getElementById('editor-container-sprites-content');
		DOM.elEditorContainerWalls = <HTMLElement>document.getElementById('editor-container-walls');
		DOM.elEditorContainerWallsContent = <HTMLElement>document.getElementById('editor-container-walls-content');

		DOM.elEditorHandleArrow = <HTMLElement>document.getElementById('editor-handle-arrow');
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

		DOM.elEditorHandleHide = <HTMLElement>document.getElementById('editor-handle-hide');
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

		DOM.elEditorProperties = <HTMLElement>document.getElementById('editor-properties');

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

		DOM.elEditorPropertiesInputExtended = <HTMLInputElement>document.getElementById('editor-extended');
		DOM.elEditorPropertiesInputFloor = <HTMLInputElement>document.getElementById('editor-floor');
		DOM.elEditorPropertiesInputLight = <HTMLInputElement>document.getElementById('editor-light');
		DOM.elEditorPropertiesInputSpriteFixedH = <HTMLInputElement>document.getElementById('editor-sprite-fixed-ns');
		DOM.elEditorPropertiesInputSpriteFixedV = <HTMLInputElement>document.getElementById('editor-sprite-fixed-ew');
		DOM.elEditorPropertiesInputSpriteRotating = <HTMLInputElement>document.getElementById('editor-sprite-rotating');
		DOM.elEditorPropertiesInputSpriteWall = <HTMLInputElement>document.getElementById('editor-sprite-wall');
		DOM.elEditorPropertiesInputSpriteWallInvisible = <HTMLInputElement>document.getElementById('editor-sprite-wall-invisible');
		DOM.elEditorPropertiesInputs = [
			DOM.elEditorPropertiesInputExtended,
			DOM.elEditorPropertiesInputFloor,
			DOM.elEditorPropertiesInputLight,
			DOM.elEditorPropertiesInputSpriteFixedH,
			DOM.elEditorPropertiesInputSpriteFixedV,
			DOM.elEditorPropertiesInputSpriteRotating,
			DOM.elEditorPropertiesInputSpriteWall,
			DOM.elEditorPropertiesInputSpriteWallInvisible,
		];

		DOM.elEditorPropertiesOutputAssetId = <HTMLElement>document.getElementById('editor-properties-output-assetid');
		DOM.elEditorPropertiesOutputProperties = <HTMLElement>document.getElementById('editor-properties-output-properties');
		DOM.elEditorPropertiesOutputValue = <HTMLElement>document.getElementById('editor-properties-output-value');

		DOM.elGame = <HTMLElement>document.getElementById('game');
		DOM.elIconsBottom = <HTMLElement>document.getElementById('icons-bottom');
		DOM.elIconsTop = <HTMLElement>document.getElementById('icons-top');
		DOM.elInfoMenu = <HTMLElement>document.getElementById('info-menu');
		DOM.elInfoSettings = <HTMLElement>document.getElementById('info-settings');
		DOM.elLogo = <HTMLElement>document.getElementById('logo');
		DOM.elMenuContent = <HTMLElement>document.getElementById('menu-content');
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
		DOM.elSettingsValueAudioWallCollisions = <HTMLInputElement>document.getElementById('settings-value-audio-wall-collision');
		DOM.elSettingsValueEditorDrawGrid = <HTMLInputElement>document.getElementById('settings-value-editor-draw-grid');
		DOM.elSettingsValueGameMultiplayer = <HTMLInputElement>document.getElementById('settings-value-game-multiplayer');
		DOM.elSettingsValueGamePlayer2InputDevice = <HTMLInputElement>document.getElementById('settings-value-game-player2-input');
		DOM.elSettingsValueGraphicsDPI = <HTMLInputElement>document.getElementById('settings-value-graphics-dpi');
		DOM.elSettingsValueGraphicsFOV = <HTMLInputElement>document.getElementById('settings-value-graphics-fov');
		DOM.elSettingsValueGraphicsFPS = <HTMLInputElement>document.getElementById('settings-value-graphics-fps');
		DOM.elSettingsValueGraphicsFPSShow = <HTMLInputElement>document.getElementById('settings-value-graphics-fps-show');
		DOM.elSettingsValueGraphicsGamma = <HTMLInputElement>document.getElementById('settings-value-graphics-gamma');
		DOM.elSettingsValueGraphicsGrayscale = <HTMLInputElement>document.getElementById('settings-value-graphics-grayscale');
		DOM.elSettingsValueGraphicsLightingQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-lighting');
		DOM.elSettingsValueGraphicsRaycastQuality = <HTMLInputElement>document.getElementById('settings-value-graphics-raycast-quality');
		DOM.elSettingsValueGraphicsResolution = <HTMLInputElement>document.getElementById('settings-value-graphics-resolution');

		DOM.elVideo = <HTMLElement>document.getElementById('video');
		DOM.elVideoInteractive = <HTMLElement>document.getElementById('video-interactive');
		DOM.elVersion = <HTMLAnchorElement>document.getElementById('version');

		// Done
		DOM.elVersion.innerText = packageJSON.version;
	}

	public static initializeDomEditMenu(): void {
		let assetImageData: Map<AssetId, string> = Assets.dataImage,
			assetId: AssetId,
			element: HTMLElement,
			elementContainer: HTMLElement,
			elementContent: HTMLElement,
			elementContentImage: HTMLImageElement,
			elementContentTitle: HTMLElement,
			properties: AssetPropertiesAudio | AssetPropertiesImage;

		/**
		 * Populate Content
		 */

		for ([assetId, properties] of assets) {
			if (properties.type !== AssetType.IMAGE || (<AssetPropertiesImage>properties).hide === true) {
				continue;
			}

			switch ((<AssetPropertiesImage>properties).category) {
				case AssetImgCategory.DOOR:
				case AssetImgCategory.DOOR_SIDE:
				case AssetImgCategory.LIGHT:
				case AssetImgCategory.SPRITE:
					elementContainer = DOM.elEditorContainerSpritesContent;
					break;
				case AssetImgCategory.SPRITE_PICKUP:
					elementContainer = DOM.elEditorContainerPickupsContent;
					break;
				case AssetImgCategory.WALL:
					elementContainer = DOM.elEditorContainerWallsContent;
					break;
			}

			elementContent = document.createElement('div');
			elementContent.className = 'item';
			elementContent.id = String(assetId);
			elementContainer.appendChild(elementContent);
			DOM.elEditorItems.push(elementContent);

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
}
