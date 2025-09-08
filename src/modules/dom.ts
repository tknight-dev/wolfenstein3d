import { Assets } from './assets.js';
import { AssetId, AssetImgCategory, AssetPropertiesAudio, AssetPropertiesImage, assets, AssetType } from '../asset-manager.js';
import packageJSON from '../../package.json' with { type: 'json' };

/**
 * @author tknight-dev
 */

export class DOM {
	public static elButtonEdit: HTMLElement;
	public static elButtonPlay: HTMLElement;
	public static elCanvases: HTMLCanvasElement[];
	public static elEdit: HTMLElement;
	public static elEditor: HTMLElement;
	public static elEditorContainer: HTMLElement;
	public static elEditorContainerPickups: HTMLElement;
	public static elEditorContainerPickupsContent: HTMLElement;
	public static elEditorContainerSprites: HTMLElement;
	public static elEditorContainerSpritesContent: HTMLElement;
	public static elEditorContainerWalls: HTMLElement;
	public static elEditorContainerWallsContent: HTMLElement;
	public static elEditorHandle: HTMLElement;
	public static elEditorHandleArrow: HTMLElement;
	public static elEditorHandleHide: HTMLElement;
	public static elEditorItems: HTMLElement[] = [];
	public static elVideo: HTMLElement;
	public static elVideoInteractive: HTMLElement;
	public static elVersion: HTMLAnchorElement;

	public static initializeDom(): void {
		DOM.elButtonEdit = <HTMLElement>document.getElementById('button-edit');
		DOM.elButtonPlay = <HTMLElement>document.getElementById('button-play');

		DOM.elEdit = document.createElement('div');
		DOM.elEdit.className = 'edit';
		DOM.elEdit.id = 'edit';

		DOM.elEditor = <HTMLElement>document.getElementById('editor');
		DOM.elEditorContainer = <HTMLElement>document.getElementById('editor-container');
		DOM.elEditorContainerPickups = <HTMLElement>document.getElementById('editor-container-pickups');
		DOM.elEditorContainerPickupsContent = <HTMLElement>document.getElementById('editor-container-pickups-content');
		DOM.elEditorContainerSprites = <HTMLElement>document.getElementById('editor-container-sprites');
		DOM.elEditorContainerSpritesContent = <HTMLElement>document.getElementById('editor-container-sprites-content');
		DOM.elEditorContainerWalls = <HTMLElement>document.getElementById('editor-container-walls');
		DOM.elEditorContainerWallsContent = <HTMLElement>document.getElementById('editor-container-walls-content');

		DOM.elEditorHandle = <HTMLElement>document.getElementById('editor-handle');
		DOM.elEditorHandleArrow = <HTMLElement>document.getElementById('editor-handle-arrow');
		DOM.elEditorHandleArrow.onclick = () => {
			if (DOM.elEditorHandleArrow.classList.contains('invert') === true) {
				DOM.elEditor.classList.remove('left');
				DOM.elEditorHandleArrow.classList.remove('invert');
				DOM.elEditorHandleArrow.innerText = '🡠';
			} else {
				DOM.elEditor.classList.add('left');
				DOM.elEditorHandleArrow.classList.add('invert');
				DOM.elEditorHandleArrow.innerText = '🡢';
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
