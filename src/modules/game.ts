import { Assets } from './assets.js';
import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	AssetIdMap,
	AssetImgCategory,
	AssetPropertiesAudio,
	AssetPropertiesCharacter,
	AssetPropertiesImage,
	assetsAudio,
	assetsImageCharacters,
	assetsImages,
} from '../asset-manager.js';
import { Settings } from './settings.js';
import { DOM } from './dom.js';
import {
	CalcBusOutputDataCalculations,
	CalcBusInputDataPlayerInput,
	CalcBusInputDataSettings,
	CalcBusOutputDataCamera,
	CalcBusActionDoorState,
	CalcBusOutputDataAudio,
	CalcBusOutputDataActionWallMove,
	CalcBusOutputDataActionSwitch,
} from '../workers/calc/calc.model.js';
import { CalcBus } from '../workers/calc/calc.bus.js';
import { GameDifficulty, GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../models/game.model.js';
import { InputDevice, Resolution } from '../models/settings.model.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model.js';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';
import {
	GamingCanvas,
	GamingCanvasAudioType,
	GamingCanvasConstPI,
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
	GamingCanvasInputPositionOverlay,
	GamingCanvasInputType,
	GamingCanvasOptions,
	GamingCanvasOrientation,
	GamingCanvasReport,
} from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridInputOverlaySnapPxTopLeft,
	GamingCanvasGridUint16Array,
	GamingCanvasGridViewport,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridInputToCoordinate,
	GamingCanvasGridICamera,
} from '@tknight-dev/gaming-canvas/grid';
import { CharacterInput, CharacterNPC } from '../models/character.model.js';

/**
 * Guards are 100 points
 *
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

enum EditType {
	APPLY,
	ERASE,
	INSPECT,
	PAN_ZOOM,
}

export class Game {
	public static camera: GamingCanvasGridCamera;
	public static editorAssetIdImg: number = 0;
	public static editorAssetCharacterId: number = 0;
	public static editorAssetCharacterType: number = 0;
	public static editorAssetProperties: AssetPropertiesImage;
	public static editorAssetPropertiesCharacter: AssetPropertiesCharacter;
	public static editorCellHighlightEnable: boolean;
	public static editorCellValue: number = 0;
	public static editorHide: boolean;
	public static inputRequest: number;
	public static inputSuspend: boolean = true;
	public static map: GameMap;
	public static mapNew: boolean;
	public static modeEdit: boolean;
	public static modeEditType: EditType = EditType.PAN_ZOOM;
	public static musicInstance: number | null;
	public static position: GamingCanvasInputPositionBasic;
	public static positionCellHighlight: GamingCanvasInputPositionOverlay;
	public static report: GamingCanvasReport;
	public static reportNew: boolean;
	public static settingAudioVolume: number;
	public static settingAudioVolumeEffect: number;
	public static settingAudioVolumeMusic: number;
	public static settingDebug: boolean;
	public static settingGraphicsDPISupport: boolean;
	public static settingGraphicsFOV: number;
	public static settingGraphicsFPSDisplay: boolean;
	public static settingGamePlayer2InputDevice: InputDevice;
	public static settingGraphicsResolution: Resolution;
	public static settingIntro: boolean;
	public static settingsCalc: CalcBusInputDataSettings;
	public static settingsGamingCanvas: GamingCanvasOptions;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static viewport: GamingCanvasGridViewport;

	private static cellApply(): void {
		let element: HTMLInputElement;

		Game.editorCellValue = Game.editorAssetIdImg;

		DOM.elEditorPropertiesCellInputExtended.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.EXTENDED);

		if (DOM.elEditorPropertiesCellInputExtended.checked) {
			DOM.elEditorPropertiesCellExtendedInputDoor.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR);
			DOM.elEditorPropertiesCellExtendedInputDoorLocked1.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR_LOCKED_1);
			DOM.elEditorPropertiesCellExtendedInputDoorLocked2.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR_LOCKED_2);
			DOM.elEditorPropertiesCellExtendedInputSwitch.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.SWITCH);
			// DOM.elEditorPropertiesCellExtendedInputTeleport.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.TELEPORT);
		}

		DOM.elEditorPropertiesCellInputFloor.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.FLOOR);
		DOM.elEditorPropertiesCellInputLight.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.LIGHT);
		DOM.elEditorPropertiesCellInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);

		if (DOM.elEditorPropertiesCellInputSpriteFixedH.checked !== true && DOM.elEditorPropertiesCellInputSpriteFixedV.checked === true) {
			DOM.elEditorPropertiesCellInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);
			Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_EW;
		}

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
		for (element of DOM.elEditorPropertiesCellExtendedInputs) {
			element.checked = false;
		}
		for (element of DOM.elEditorPropertiesCellInputs) {
			element.checked = false;
		}

		DOM.elEditorPropertiesCellOutputAssetId.innerText = '0000';
		DOM.elEditorPropertiesCellOutputProperties.innerText = '0000';
		DOM.elEditorPropertiesCellOutputValue.innerText = '0000';
	}

	public static initializeDomInteractive(): void {
		DOM.elButtonEdit.onclick = () => {
			Game.viewEditor();
		};

		DOM.elButtonPlay.onclick = () => {
			Game.viewGame();
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
				Game.modeEditType = EditType.APPLY;
			}
		};

		DOM.elButtonDownload.onclick = () => {
			DOM.elButtonDownload.classList.add('active');
			DOM.spinner(true);

			setTimeout(() => {
				// Convert map
				let npc: Map<number, CharacterNPC> = Game.map.npc;
				Game.map.npc = <any>{};
				for (let [i, value] of npc.entries()) {
					(<any>Game.map.npc)[String(i)] = value;
				}

				const a: HTMLAnchorElement = document.createElement('a'),
					downloadData = 'data:text/json;charset=utf-8,' + btoa(JSON.stringify(Game.map));

				// Restore map
				Game.map.npc = npc;

				a.classList.add('hidden');
				a.download = 'blockenstein.map';
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
				DOM.elCanvases[2].classList.add('hide');

				DOM.elButtonMove.click();
				Game.editorHide = false;
			} else {
				DOM.elButtonEye.classList.add('active');
				DOM.elCanvases[2].classList.remove('hide');

				Game.editorHide = true;
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
							const parsed: GameMap = Assets.parseMap(JSON.parse(atob(<string>fileReader.result)));

							// Adjust
							Game.camera.r = parsed.position.r;
							Game.camera.x = parsed.position.x + 0.5;
							Game.camera.y = parsed.position.y + 0.5;
							Game.camera.z = parsed.position.z;
							Game.map = parsed;

							// Done
							Game.mapNew = true;

							CalcBus.outputMap(parsed);
							VideoEditorBus.outputMap(parsed);
							VideoMainBus.outputMap(parsed);
						} catch (error) {
							console.error('upload failed with', error);

							DOM.error();
						}

						setTimeout(() => {
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
			DOM.elEditorFindAndReplaceValueFind.value = '';
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

			CalcBus.outputMap(Game.map);
			VideoEditorBus.outputMap(Game.map);
			VideoMainBus.outputMap(Game.map);

			DOM.elEditorFindAndReplace.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elEditorFindAndReplaceCancel.onclick = () => {
			DOM.elEditorFindAndReplace.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elEditorCommandMetaMenu.onclick = () => {
			Settings.setMetaMap(false);
			DOM.elMetaMap.style.display = 'block';
			Game.inputSuspend = true;
		};

		// Editor items
		DOM.elEditorPropertiesCellExtendedInputs.forEach((element: HTMLInputElement) => {
			element.onchange = () => {
				Game.cellApply();
			};
		});
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
					DOM.elEditorPropertiesCellExtended.style.display = 'none';
					DOM.elEditorPropertiesCharacterContainer.style.display = 'block';
					DOM.elEditorPropertiesCommandsCell.style.display = 'none';

					// Asset configuraiton
					Game.editorAssetCharacterId = Number(element.id.split('__')[1]);
					Game.editorAssetCharacterType = Number(element.id.split('__')[0]);
					Game.editorAssetPropertiesCharacter = (<any>assetsImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId);

					DOM.elEditorPropertiesCharacterInputAngle.value = String(
						Math.round(((Game.editorAssetPropertiesCharacter.angle || 0) * 180) / GamingCanvasConstPI),
					);
					// DOM.elEditorPropertiesCharacterInputDifficulty.value = String(GameDifficulty.EASY);
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
					DOM.elEditorPropertiesCellExtended.style.display = 'block';
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
							DOM.elEditorPropertiesCellInputExtended.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.add('show');

							switch (Game.editorAssetIdImg) {
								case AssetIdImg.SPRITE_ELEVATOR_DOOR:
								case AssetIdImg.SPRITE_METAL_DOOR:
									DOM.elEditorPropertiesCellExtendedInputDoor.checked = true;
									DOM.elEditorPropertiesCellInputSpriteFixedH.checked = true;
									break;
								case AssetIdImg.SPRITE_METAL_DOOR_LOCKED:
									DOM.elEditorPropertiesCellExtendedInputDoor.checked = true;
									DOM.elEditorPropertiesCellInputSpriteFixedH.checked = true;
									break;
								case AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN:
								case AssetIdImg.WALL_ELEVATOR_SWITCH_UP:
									DOM.elEditorPropertiesCellExtendedInputSwitch.checked = true;
									DOM.elEditorPropertiesCellInputWall.checked = true;
									break;
							}
							break;
						case AssetImgCategory.LIGHT:
							DOM.elEditorPropertiesCellInputLight.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
							break;
						case AssetImgCategory.SPRITE:
						case AssetImgCategory.SPRITE_PICKUP:
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
							break;
						case AssetImgCategory.WALL:
							DOM.elEditorPropertiesCellInputWall.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
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
				DOM.elEditorSectionSpecial.classList.remove('active');

				DOM.elEditorContainerCharacters.style.display = 'block';
				DOM.elEditorContainerObjects.style.display = 'none';
				DOM.elEditorContainerExtended.style.display = 'none';
			}
		};
		DOM.elEditorSectionObjects.onclick = () => {
			if (DOM.elEditorSectionObjects.classList.contains('active') !== true) {
				DOM.elEditorSectionCharacters.classList.remove('active');
				DOM.elEditorSectionObjects.classList.add('active');
				DOM.elEditorSectionSpecial.classList.remove('active');

				DOM.elEditorContainerCharacters.style.display = 'none';
				DOM.elEditorContainerObjects.style.display = 'block';
				DOM.elEditorContainerExtended.style.display = 'none';
			}
		};
		DOM.elEditorSectionSpecial.onclick = () => {
			if (DOM.elEditorSectionSpecial.classList.contains('active') !== true) {
				DOM.elEditorSectionCharacters.classList.remove('active');
				DOM.elEditorSectionObjects.classList.remove('active');
				DOM.elEditorSectionSpecial.classList.add('active');

				DOM.elEditorContainerCharacters.style.display = 'none';
				DOM.elEditorContainerObjects.style.display = 'none';
				DOM.elEditorContainerExtended.style.display = 'block';
			}
		};

		// Fullscreen
		DOM.elButtonFullscreen.onclick = async () => {
			if (DOM.elButtonFullscreen.classList.contains('active') === true) {
				await GamingCanvas.setFullscreen(false);
			} else {
				await GamingCanvas.setFullscreen(true, DOM.elGame);
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
			}
		});

		// Menu
		DOM.elInfoMenu.onclick = () => {
			DOM.elLogo.classList.toggle('open');
			DOM.elMenuContent.classList.toggle('open');
		};
		DOM.elInfoSettings.onclick = () => {
			DOM.elLogo.classList.remove('open');
			DOM.elMenuContent.classList.remove('open');

			DOM.elSettingsSubGame.click();
			DOM.elSettings.style.display = 'block';
			Game.inputSuspend = true;
		};

		document.addEventListener('click', (event: any) => {
			if (event.target.id !== DOM.elInfoMenu.id) {
				DOM.elLogo.classList.remove('open');
				DOM.elMenuContent.classList.remove('open');
			}
		});

		// Meta: Map
		DOM.elMetaMapApply.onclick = () => {
			Settings.setMetaMap(true);
			DOM.elMetaMap.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elMetaMapCancel.onclick = () => {
			Settings.setMetaMap(false);
			DOM.elMetaMap.style.display = 'none';
			Game.inputSuspend = false;
		};

		DOM.elMetaMapLocation.onclick = () => {
			DOM.elMetaMapValueStartingPositionR.value = String(((Game.camera.r * 180) / GamingCanvasConstPI) | 0);
			DOM.elMetaMapValueStartingPositionX.value = String(Game.camera.x | 0);
			DOM.elMetaMapValueStartingPositionY.value = String(Game.camera.y | 0);
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
		};
		DOM.elSettingsValueAudioVolumeEffect.oninput = () => {
			GamingCanvas.audioVolumeGlobal(Number(DOM.elSettingsValueAudioVolumeEffect.value), GamingCanvasAudioType.EFFECT);
		};
		DOM.elSettingsValueAudioVolumeMusic.oninput = () => {
			GamingCanvas.audioVolumeGlobal(Number(DOM.elSettingsValueAudioVolumeMusic.value), GamingCanvasAudioType.MUSIC);
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
		Game.map = <GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_LEVEL01);

		Game.camera = new GamingCanvasGridCamera(Game.map.position.r, Game.map.position.x + 0.5, Game.map.position.y + 0.5, Game.map.position.z);

		Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		// Overlay
		if (GamingCanvas.getReport().orientation === GamingCanvasOrientation.PORTRAIT) {
			DOM.elPlayerOverlay1.classList.add('portrait');
			DOM.elPlayerOverlay2.classList.add('portrait');
		} else {
			DOM.elPlayerOverlay1.classList.remove('portrait');
			DOM.elPlayerOverlay2.classList.remove('portrait');
		}

		// Report
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

			CalcBus.outputReport(report);
			VideoEditorBus.outputReport(report);
			VideoMainBus.outputReport(report);
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
			cameraXOriginal: number = 0,
			cameraYOriginal: number = 0,
			cameraZoom: number = Game.camera.z,
			cameraZoomMax: number = 15,
			cameraZoomMin: number = 0.5,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 0.3,
			characterPlayerInput: CalcBusInputDataPlayerInput = {
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
			dataUpdated: boolean,
			down: boolean,
			downMode: boolean,
			downModeWheel: boolean,
			elEditStyle: CSSStyleDeclaration = DOM.elEdit.style,
			id: number,
			map: GameMap = Game.map,
			inputLimitPerMs: number = GamingCanvas.getInputLimitPerMs(),
			modeEdit: boolean = Game.modeEdit,
			modeEditType: EditType = Game.modeEditType,
			position1: GamingCanvasInputPosition,
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
			queueInput: GamingCanvasInput | undefined,
			queueInputOverlay: GamingCanvasInputPosition,
			queueTimestamp: number = -2025,
			report: GamingCanvasReport = Game.report,
			updated: boolean,
			updatedR: boolean,
			viewport: GamingCanvasGridViewport = Game.viewport;

		// Calc: Action Door Open
		CalcBus.setCallbackActionDoor((data: CalcBusActionDoorState) => {
			VideoMainBus.outputActionDoor(data);
		});

		// Calc: Action Switch
		CalcBus.setCallbackActionSwitch((data: CalcBusOutputDataActionSwitch) => {
			VideoMainBus.outputActionSwitch(data);

			Game.inputSuspend = true;

			setTimeout(() => {
				DOM.screenControl(DOM.elScreenLevelEnd);

				if (Game.musicInstance !== null) {
					GamingCanvas.audioControlVolume(Game.musicInstance, 0, 1500);
				}

				setTimeout(async () => {
					if (Game.musicInstance !== null) {
						GamingCanvas.audioControlStop(Game.musicInstance);
					}
					Game.musicInstance = await GamingCanvas.audioControlPlay(
						AssetIdAudio.AUDIO_MUSIC_END_OF_LEVEL,
						false,
						false,
						0,
						0,
						(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_LVL1)).volume,
					);
				}, 1500);
			}, 500);
		});

		// Calc: Action Wall Move
		CalcBus.setCallbackActionWallMove((data: CalcBusOutputDataActionWallMove) => {
			VideoMainBus.outputActionWallMove(data);
		});

		// Calc: Audio
		CalcBus.setCallbackAudio(async (data: CalcBusOutputDataAudio) => {
			if (data.assetId !== undefined) {
				const instance: number | null = await GamingCanvas.audioControlPlay(data.assetId, true, false, data.pan, 0, data.volume, (instance: number) => {
					CalcBus.outputAudioStop({
						instance: instance,
						request: data.request,
					});
				});
				CalcBus.outputAudioStart({
					instance: instance,
					request: data.request,
				});
			} else if (data.instance !== undefined) {
				if (data.pan !== undefined) {
					GamingCanvas.audioControlPan(data.instance, data.pan);
				}
				if (data.volume !== undefined) {
					GamingCanvas.audioControlVolume(data.instance, data.volume);
				}
			}
		});

		// Calc: Camera Mode
		CalcBus.setCallbackCamera((data: CalcBusOutputDataCamera) => {
			// First: VideoEditor
			VideoEditorBus.outputCalculations({
				camera: camera.encode(),
				player1Camera: data.player1Camera,
				player2Camera: data.player2Camera,
				gameMode: false,
				viewport: viewport.encode(),
			});

			// Second: VideoMain
			VideoMainBus.outputCalculations(true, {
				camera: Float64Array.from(data.camera),
				rays: Float64Array.from(data.rays),
				raysMap: data.raysMap,
				raysMapKeysSorted: Float64Array.from(data.raysMapKeysSorted),
			});
			VideoMainBus.outputCalculations(false, {
				camera: data.camera,
				rays: data.rays,
				raysMap: data.raysMap,
				raysMapKeysSorted: data.raysMapKeysSorted,
			});
		});

		// Calc: Game Mode
		CalcBus.setCallbackCalculations((data: CalcBusOutputDataCalculations) => {
			if (data.characterPlayer1Camera) {
				camera.decode(data.characterPlayer1Camera);
				camera.z = map.position.z;

				if (cameraZoom !== camera.z) {
					cameraZoom = camera.z;
					viewport.applyZ(camera, report);
				}
				viewport.apply(camera);

				// First: VideoMain
				VideoMainBus.outputCalculations(true, {
					camera: camera.encode(),
					rays: <Float64Array>data.characterPlayer1Rays,
					raysMap: <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>data.characterPlayer1RaysMap,
					raysMapKeysSorted: <Float64Array>data.characterPlayer1RaysMapKeysSorted,
				});

				// Second: VideoEditor
				VideoEditorBus.outputCalculations({
					camera: camera.encode(),
					player1Camera: data.characterPlayer1Camera,
					player2Camera: data.characterPlayer2Camera ? Float64Array.from(data.characterPlayer2Camera) : undefined, // Clone
					gameMode: true,
					viewport: viewport.encode(),
				});
			} else {
				// Second: VideoEditor
				VideoEditorBus.outputCalculations({
					camera: camera.encode(),
					player2Camera: data.characterPlayer2Camera ? Float64Array.from(data.characterPlayer2Camera) : undefined, // Clone
					gameMode: true,
					viewport: viewport.encode(),
				});
			}

			if (data.characterPlayer2Camera) {
				VideoMainBus.outputCalculations(false, {
					camera: data.characterPlayer2Camera,
					rays: <Float64Array>data.characterPlayer2Rays,
					raysMap: <Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>>data.characterPlayer2RaysMap,
					raysMapKeysSorted: <Float64Array>data.characterPlayer2RaysMapKeysSorted,
				});
			}
		});

		// Camera
		setInterval(() => {
			if (updated === true || updatedR === true || Game.reportNew === true) {
				report = Game.report;

				if (modeEdit === true) {
					// Zoom
					if (camera.z !== cameraZoom) {
						camera.z = cameraZoom;
						viewport.applyZ(camera, report);
					} else if (updated === true || updatedR !== true) {
						camera.x = cameraXOriginal + (cameraMoveX - cameraMoveXOriginal) * viewport.width;
						camera.y = cameraYOriginal + (cameraMoveY - cameraMoveYOriginal) * viewport.height;
					}
					viewport.apply(camera);

					// Calc: Camera Mode
					CalcBus.outputCamera(camera.encode());
				} else {
					// Calc: Game Mode
					CalcBus.outputCharacterInput(characterPlayerInput);
				}

				updated = false;
				updatedR = false;
				Game.reportNew = false;
			}
		}, inputLimitPerMs);

		// Data
		setInterval(() => {
			if (dataUpdated === true) {
				dataUpdated = false;

				CalcBus.outputMap(map);
				VideoEditorBus.outputMap(map);
				VideoMainBus.outputMap(map);
			}
		}, 100);

		const dataApply = (position: GamingCanvasInputPosition, erase?: boolean) => {
			const cooridnate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

			if (erase === true) {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					map.npc.delete(cooridnate.x * map.grid.sideLength + cooridnate.y);
				} else {
					map.grid.setBasic(cooridnate, 0);
				}
			} else {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					// Character
					id = (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
					while (idUnique(id) === false) {
						id = (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
					}

					map.npc.set(cooridnate.x * map.grid.sideLength + cooridnate.y, {
						assetId: Game.editorAssetCharacterId,
						camera: new GamingCanvasGridCamera(Game.editorAssetPropertiesCharacter.angle || 0, cooridnate.x + 0.5, cooridnate.y + 0.5, 1),
						cameraPrevious: <GamingCanvasGridICamera>{},
						difficulty: Number(DOM.elEditorPropertiesCharacterInputDifficulty.value),
						gridIndex: cooridnate.x * map.grid.sideLength + cooridnate.y,
						health: 100,
						id: id,
						size: 0.25,
						timestamp: 0,
						timestampPrevious: 0,
						timestampUnixState: 0,
						type: Game.editorAssetCharacterType,
					});

					DOM.elEditorPropertiesCharacterInputId.value = String(id);
				} else {
					// Cell
					map.grid.setBasic(cooridnate, Game.editorCellValue);
				}
			}

			dataUpdated = true;
		};

		const idUnique = (id: number): boolean => {
			let npc: CharacterNPC;
			for (npc of Game.map.npc.values()) {
				if (npc.id === id) {
					return false;
				}
			}
			return true;
		};

		const inspect = (position: GamingCanvasInputPosition) => {
			if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
				const coordinate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

				const characterNPC: CharacterNPC | undefined = map.npc.get(coordinate.x * map.grid.sideLength + coordinate.y);

				if (characterNPC === undefined) {
					return;
				}

				// Containers
				DOM.elEditorProperties.classList.add('character');
				DOM.elEditorPropertiesCellContainer.style.display = 'none';
				DOM.elEditorPropertiesCellExtended.style.display = 'none';
				DOM.elEditorPropertiesCharacterContainer.style.display = 'block';
				DOM.elEditorPropertiesCommandsCell.style.display = 'none';

				DOM.elButtonApply.click();

				// Asset configuraiton
				Game.editorAssetCharacterId = <any>characterNPC.assetId;
				Game.editorAssetCharacterType = characterNPC.type;
				Game.editorAssetPropertiesCharacter = (<any>assetsImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId);

				DOM.elEditorPropertiesCharacterInputAngle.value = String(
					Math.round(((Game.editorAssetPropertiesCharacter.angle || 0) * 180) / GamingCanvasConstPI),
				);
				DOM.elEditorPropertiesCharacterInputDifficulty.value = String(characterNPC.difficulty);
				DOM.elEditorPropertiesCharacterInputId.value = String(characterNPC.id);

				// Highlighter based on asset
				Game.editorCellHighlightEnable = true;
				DOM.elEdit.style.background = `url(${(<any>Assets.dataImageCharacters.get(Game.editorAssetCharacterType)).get(Game.editorAssetCharacterId)})`;
				DOM.elEdit.style.backgroundColor = '#980066';
			} else {
				const cell: number | undefined = map.grid.getBasic(GamingCanvasGridInputToCoordinate(position, viewport));

				if (cell === undefined) {
					return;
				}

				const assetId: number = cell & GameGridCellMasksAndValues.ID_MASK;
				const assetIdStr: String = String(assetId);
				let clicked: boolean = false,
					element: HTMLElement;

				// Values
				Game.editorAssetIdImg = assetId;
				Game.editorAssetProperties = <AssetPropertiesImage>assetsImages.get(Game.editorAssetIdImg);

				if (cell === GameGridCellMasksAndValues.FLOOR) {
					// Containers
					DOM.elEditorProperties.classList.remove('character');
					DOM.elEditorPropertiesCellContainer.style.display = 'block';
					DOM.elEditorPropertiesCellExtended.style.display = 'block';
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
					// Special
					DOM.elButtonApply.click();
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${Assets.dataImage.get(Game.editorAssetIdImg)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}

				// Apply
				DOM.elEditorPropertiesCellInputExtended.checked = (cell & GameGridCellMasksAndValues.EXTENDED) !== 0;

				if (DOM.elEditorPropertiesCellInputExtended.checked === true) {
					DOM.elEditorPropertiesCellExtended.classList.add('show');

					DOM.elEditorPropertiesCellExtendedInputDoor.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR) !== 0;
					DOM.elEditorPropertiesCellExtendedInputDoorLocked1.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR_LOCKED_1) !== 0;
					DOM.elEditorPropertiesCellExtendedInputDoorLocked2.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR_LOCKED_2) !== 0;
					DOM.elEditorPropertiesCellExtendedInputSwitch.checked = (cell & GameGridCellMasksAndValuesExtended.SWITCH) !== 0;
					// DOM.elEditorPropertiesCellExtendedInputTeleport.checked = (cell & GameGridCellMasksAndValuesExtended.TELEPORT) !== 0;
				} else {
					DOM.elEditorPropertiesCellExtended.classList.remove('show');

					for (element of DOM.elEditorPropertiesCellExtendedInputs) {
						(<HTMLInputElement>element).checked = false;
					}
				}

				DOM.elEditorPropertiesCellInputFloor.checked = (cell & GameGridCellMasksAndValues.FLOOR) !== 0;
				DOM.elEditorPropertiesCellInputLight.checked = (cell & GameGridCellMasksAndValues.LIGHT) !== 0;
				DOM.elEditorPropertiesCellInputSpriteFixedH.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_NS) !== 0;

				if (DOM.elEditorPropertiesCellInputSpriteFixedH.checked === true) {
					DOM.elEditorPropertiesCellInputSpriteFixedV.checked = false;
				} else {
					DOM.elEditorPropertiesCellInputSpriteFixedV.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0;
				}
				DOM.elEditorPropertiesCellInputWall.checked = (cell & GameGridCellMasksAndValues.WALL) !== 0;
				DOM.elEditorPropertiesCellInputWallInvisible.checked = (cell & GameGridCellMasksAndValues.WALL_INVISIBLE) !== 0;
				DOM.elEditorPropertiesCellInputWallMovable.checked = (cell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0;
				Game.cellApply();
			}
		};

		const position = (position: GamingCanvasInputPosition) => {
			Game.position = GamingCanvasGridInputToCoordinate(position, viewport, Game.position);
			DOM.elEditorPropertiesCellOutputIndex.innerText = String((Game.position.x | 0) * Game.map.grid.sideLength + (Game.position.y | 0)).padStart(4, '0');
			DOM.elEditorPropertiesCellOutputPosition.innerText = `(${String(Game.position.x).padStart(3, '0')}, ${String(Game.position.y).padStart(3, '0')}) ${((camera.r * 180) / GamingCanvasConstPI) | 0}°`;
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
					map = Game.map;
					updated = false;
					updatedR = true;

					Game.reportNew = true;
				}

				while (queue.length !== 0) {
					queueInput = <GamingCanvasInput>queue.pop();

					if (Game.inputSuspend === true) {
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
						// case GamingCanvasInputType.TOUCH:
						// 	GamingCanvas.relativizeInputToCanvas(queueInput);
						// 	processorTouch(queueInput);
						// 	break;
					}
				}
			}
		};
		Game.processor = processor;

		const processorGamepad = (input: GamingCanvasInputGamepad) => {
			if (modeEdit !== true) {
				if (Game.settingsCalc.player2Enable === true) {
					if (Game.settingGamePlayer2InputDevice === InputDevice.GAMEPAD) {
						characterPlayerInputPlayer = characterPlayerInput.player2;
					} else {
						characterPlayerInputPlayer = characterPlayerInput.player1;
					}
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player1;
				}

				if (input.propriatary.axes !== undefined) {
					characterPlayerInputPlayer.x = input.propriatary.axes[0];
					characterPlayerInputPlayer.y = input.propriatary.axes[1];
					characterPlayerInputPlayer.r = input.propriatary.axes[2];
				}

				if (input.propriatary.buttons !== undefined) {
					characterPlayerInputPlayer.action = input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.BUMPER__LEFT] || false;
					characterPlayerInputPlayer.fire = input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.BUMPER__RIGHT] || false;
				}

				updated = true;
			}
		};

		const processorKeyboard = (input: GamingCanvasInputKeyboard) => {
			down = input.propriatary.down;

			if (modeEdit !== true) {
				if (Game.settingsCalc.player2Enable === true) {
					if (Game.settingGamePlayer2InputDevice === InputDevice.KEYBOARD) {
						characterPlayerInputPlayer = characterPlayerInput.player2;
					} else {
						characterPlayerInputPlayer = characterPlayerInput.player1;
					}
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player1;
				}

				switch (input.propriatary.action.code) {
					case 'ArrowDown':
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
						if (down) {
							characterPlayerInputPlayer.fire = true;
						} else if ((characterPlayerInputPlayer.fire = true)) {
							characterPlayerInputPlayer.fire = false;
						}
						updated = true;
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
					case 'KeyW':
						if (down) {
							characterPlayerInputPlayer.y = -1;
						} else if (characterPlayerInputPlayer.y === -1) {
							characterPlayerInputPlayer.y = 0;
						}
						updated = true;
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
			} else if (down === true) {
				switch (input.propriatary.action.code) {
					case 'KeyF':
						DOM.elEditorCommandFindAndReplace.click();
						break;
					case 'KeyM':
						DOM.elEditorCommandMetaMenu.click();
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
					position(position1);
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
					position(position1);
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
					position(position1);
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							if (downMode === true) {
								// USE Game.editorHide to move relative to the camera angle when not viewing the editor

								cameraMoveX = 1 - position1.xRelative;
								cameraMoveY = 1 - position1.yRelative;
								updated = true;
							} else if (downModeWheel === true) {
								camera.r = position1.xRelative * 2 * GamingCanvasConstPI;
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

		// const processorTouch = (input: GamingCanvasInputTouch) => {
		// 	elEditStyle.display = 'none';
		// 	positions = input.propriatary.positions;
		// 	if (input.propriatary.down !== undefined) {
		// 		down = input.propriatary.down;
		// 	}

		// 	switch (input.propriatary.action) {
		// 		case GamingCanvasInputTouchAction.ACTIVE:
		// 			if (modeEdit === true) {
		// 				touchAdded = false;
		// 				touchDistancePrevious = -1;

		// 				if (down === true && positions !== undefined && positions.length === 1) {
		// 					position1 = positions[0];

		// 					cameraMoveXOriginal = 1 - position1.xRelative;
		// 					cameraMoveYOriginal = 1 - position1.yRelative;
		// 					cameraXOriginal = camera.x;
		// 					cameraYOriginal = camera.y;
		// 				}
		// 				downMode = down;
		// 			}
		// 			break;
		// 		case GamingCanvasInputTouchAction.MOVE:
		// 			if (modeEdit === true) {
		// 				if (positions !== undefined) {
		// 					position1 = positions[0];

		// 					if (position1.out === true) {
		// 						down = false;
		// 					}

		// 					if (positions.length !== 1) {
		// 						// Zoom
		// 						if (down === true) {
		// 							position2 = positions[1];

		// 							if (touchDistancePrevious !== -1) {
		// 								touchDistance = GamingCanvasInputPositionDistance(position1, position2) - touchDistancePrevious;
		// 								if (Math.abs(touchDistance) > 20) {
		// 									cameraZoomPrevious = cameraZoom;
		// 									cameraZoom = Math.max(
		// 										cameraZoomMin,
		// 										Math.min(cameraZoomMax, cameraZoom + (touchDistance > 0 ? cameraZoomStep : -cameraZoomStep)),
		// 									);
		// 									if (cameraZoom !== cameraZoomPrevious) {
		// 										updated = true;
		// 									}
		// 									touchDistancePrevious = touchDistance + touchDistancePrevious;
		// 								}
		// 							} else {
		// 								touchDistancePrevious = GamingCanvasInputPositionDistance(position1, position2);
		// 							}
		// 						} else {
		// 							touchDistancePrevious = -1;
		// 						}
		// 					} else {
		// 						touchDistancePrevious = -1;
		// 					}

		// 					// Move
		// 					if (downMode === true) {
		// 						cameraMoveX = 1 - position1.xRelative;
		// 						cameraMoveY = 1 - position1.yRelative;
		// 						updated = true;
		// 					}
		// 				}
		// 			}
		// 			break;
		// 	}
		// };
	}

	public static viewEditor(): void {
		if (Game.modeEdit !== true) {
			Game.modeEdit = true;

			// DOM
			DOM.elButtonApply.classList.remove('active');
			DOM.elButtonEye.classList.add('active');
			DOM.elButtonInspect.classList.remove('active');
			DOM.elButtonMove.classList.add('active');
			DOM.elButtonEdit.classList.add('active');
			DOM.elButtonPlay.classList.remove('active');
			DOM.elCanvases[2].classList.remove('hide');
			DOM.elEditor.classList.remove('hide');
			DOM.elEditor.style.display = 'flex';
			DOM.elEditorProperties.classList.remove('hide');
			DOM.elEditorProperties.style.display = 'flex';
			DOM.elEditorPropertiesCellExtended.classList.remove('show');
			DOM.elIconsBottom.classList.remove('hide');
			DOM.elIconsBottom.style.display = 'flex';
			DOM.elIconsTop.style.display = 'flex';

			DOM.elVideoInteractive.classList.add('cursor-grab');
			DOM.elVideoInteractive.classList.remove('cursor-pointer');
			Game.modeEditType = EditType.PAN_ZOOM;

			// Overlay
			DOM.elPlayerOverlay1.style.display = 'none';
			DOM.elPlayerOverlay2.style.display = 'none';

			// Video
			Settings.singleVideoFeedOverride(true);
			VideoEditorBus.outputEnable(true);
		}
	}

	public static viewGame(): void {
		if (Game.modeEdit !== false) {
			Game.modeEdit = false;

			// DOM
			DOM.elButtonEdit.classList.remove('active');
			DOM.elButtonPlay.classList.add('active');
			DOM.elCanvases[2].classList.add('hide');
			DOM.elEditor.classList.add('hide');
			DOM.elEditor.style.display = 'flex';
			DOM.elEditorProperties.classList.add('hide');
			DOM.elEditorProperties.style.display = 'flex';
			DOM.elEditorPropertiesCellExtended.classList.remove('show');
			DOM.elIconsBottom.classList.add('hide');
			DOM.elIconsBottom.style.display = 'flex';
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
			for (element of DOM.elEditorPropertiesCellExtendedInputs) {
				element.checked = false;
			}
			for (element of DOM.elEditorPropertiesCellInputs) {
				element.checked = false;
			}

			// Overlay
			DOM.elPlayerOverlay1.style.display = 'flex';

			if (Game.settingsCalc.player2Enable === true) {
				DOM.elPlayerOverlay2.style.display = 'flex';
			} else {
				DOM.elPlayerOverlay2.style.display = 'none';
			}

			// Video
			setTimeout(() => {
				Game.reportNew = true;
			});
			Settings.singleVideoFeedOverride(false);
			VideoEditorBus.outputEnable(false);
		}
	}
}
