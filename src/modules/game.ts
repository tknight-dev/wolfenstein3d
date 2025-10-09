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
} from '../workers/calc-main/calc-main.model.js';
import { CalcMainBus } from '../workers/calc-main/calc-main.bus.js';
import { GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../models/game.model.js';
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

enum EditType {
	APPLY,
	ERASE,
	INSPECT,
	PAN_ZOOM,
}

export class Game {
	public static camera: GamingCanvasGridCamera;
	public static editorAssetIdImg: number = 0;
	public static editorAssetCharacterId: AssetIdImgCharacter = 0;
	public static editorAssetCharacterType: AssetIdImgCharacterType = 0;
	public static editorAssetProperties: AssetPropertiesImage;
	public static editorAssetPropertiesCharacter: AssetPropertiesCharacter;
	public static editorCellHighlightEnable: boolean;
	public static editorCellValue: number = 0;
	public static editorHide: boolean;
	public static gameOver: boolean;
	public static inputRequest: number;
	public static inputSuspend: boolean = true;
	public static map: GameMap;
	public static mapBackup: GameMap;
	public static mapBackupRestored: boolean;
	public static mapNew: boolean;
	public static modeEdit: boolean;
	public static modeEditType: EditType = EditType.PAN_ZOOM;
	public static modePerformance: boolean;
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
	public static settingsCalcMain: CalcMainBusInputDataSettings;
	public static settingsCalcPath: CalcPathBusInputDataSettings;
	public static settingsGamingCanvas: GamingCanvasOptions;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static settingsVideoOverlay: VideoOverlayBusInputDataSettings;
	public static viewport: GamingCanvasGridViewport;

	private static cellApply(): void {
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
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.add('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
			DOM.elControlsSubTouch.classList.remove('active');
		};

		DOM.elControlsSubKeyboard.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'block';
			DOM.elControlsBodyTouch.style.display = 'none';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.add('active');
			DOM.elControlsSubTouch.classList.remove('active');
		};

		DOM.elControlsSubTouch.onclick = () => {
			DOM.elControlsBodyGamepad.style.display = 'none';
			DOM.elControlsBodyKeyboard.style.display = 'none';
			DOM.elControlsBodyTouch.style.display = 'block';

			DOM.elControlsSubGamepad.classList.remove('active');
			DOM.elControlsSubKeyboard.classList.remove('active');
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
				Game.modeEditType = EditType.APPLY;
			}
		};

		DOM.elButtonDownload.onclick = () => {
			DOM.elButtonDownload.classList.add('active');
			DOM.spinner(true);

			setTimeout(() => {
				// Convert map
				let npcById: Map<number, CharacterNPC> = Game.map.npcById;
				Game.map.npcById = <any>{};
				for (let [i, value] of npcById.entries()) {
					(<any>Game.map.npcById)[String(i)] = value;
				}

				const a: HTMLAnchorElement = document.createElement('a'),
					downloadData = 'data:text/json;charset=utf-8,' + btoa(JSON.stringify(Game.map));

				// Restore map
				Game.map.npcById = npcById;

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
							const parsed: GameMap = Assets.parseMap(JSON.parse(atob(<string>fileReader.result))),
								parsed2: GameMap = Assets.parseMap(JSON.parse(atob(<string>fileReader.result)));

							// Adjust
							Game.camera.r = parsed.position.r;
							Game.camera.x = parsed.position.x + 0.5;
							Game.camera.y = parsed.position.y + 0.5;
							Game.camera.z = parsed.position.z;
							Game.map = parsed;
							Game.mapBackup = parsed2;

							// Done
							Game.gameOver = false;
							Game.mapNew = true;

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

		DOM.elEditorCommandResetMap.onclick = () => {
			// Convert map
			let npcById: Map<number, CharacterNPC> = Game.mapBackup.npcById;
			Game.mapBackup.npcById = <any>{};
			for (let [i, value] of npcById.entries()) {
				(<any>Game.mapBackup.npcById)[String(i)] = value;
			}

			const parsed: GameMap = Assets.parseMap(JSON.parse(JSON.stringify(Game.mapBackup)));

			// Restore map
			Game.gameOver = false;
			Game.mapBackup.npcById = npcById;

			Game.camera.r = parsed.position.r;
			Game.camera.x = parsed.position.x + 0.5;
			Game.camera.y = parsed.position.y + 0.5;
			Game.camera.z = parsed.position.z;
			Game.map = parsed;
			Game.mapBackupRestored = true;

			CalcMainBus.outputMap(parsed);
			CalcPathBus.outputMap(parsed);
			VideoEditorBus.outputMap(parsed);
			VideoMainBus.outputMap(parsed);
			VideoOverlayBus.outputReset();
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
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							DOM.elEditorPropertiesCellInputLight.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
							break;
						case AssetImgCategory.SPRITE:
						case AssetImgCategory.SPRITE_PICKUP:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
							break;
						case AssetImgCategory.WALL:
							DOM.elEditorPropertiesCellInputWall.checked = true;
							DOM.elEditorPropertiesCellExtended.classList.remove('show');
							break;
						case AssetImgCategory.WAYPOINT:
							DOM.elEditorPropertiesCellInputFloor.checked = true;
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
		DOM.elInfoControls.onclick = () => {
			DOM.elLogo.classList.remove('open');
			DOM.elMenuContent.classList.remove('open');

			if (GamingCanvas.detectDevice(true, true) === true) {
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
			DOM.elMetaMapValueStartingPositionR.value = String(((Game.camera.r * 180) / GamingCanvasConstPI_1_000) | 0);
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
		Game.map = <GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_LEVEL01);
		Game.mapBackup = <GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_LEVEL01);

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
		GamingCanvas.setCallbackVisibility((state: boolean) => {
			if (state !== true) {
				DOM.elInfoSettings.click();
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
			cheatCode: Map<string, boolean> = new Map(),
			dataUpdated: boolean,
			down: boolean,
			downMode: boolean,
			downModeWheel: boolean,
			elEditStyle: CSSStyleDeclaration = DOM.elEdit.style,
			gridIndexPlayer1: number | undefined,
			gridIndexPlayer2: number | undefined,
			id: number,
			map: GameMap = Game.map,
			inputLimitPerMs: number = GamingCanvas.getInputLimitPerMs(),
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
			viewport: GamingCanvasGridViewport = Game.viewport,
			x: number,
			y: number;

		// Calc: Action Door Open
		CalcMainBus.setCallbackActionDoor((data: CalcMainBusActionDoorState) => {
			VideoMainBus.outputActionDoor(data);
		});

		// Calc: Action Switch
		CalcMainBus.setCallbackActionSwitch((data: CalcMainBusOutputDataActionSwitch) => {
			VideoMainBus.outputActionSwitch(data);

			Game.inputSuspend = true;
			CalcMainBus.outputPause(true);
			CalcPathBus.outputPause(true);
			VideoMainBus.outputPause(true);
			VideoOverlayBus.outputPause(true);

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
						GamingCanvasAudioType.MUSIC,
						false,
						0,
						0,
						(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_LVL1)).volume,
					);
				}, 1500);
			}, 500);
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
				camera.z = map.position.z;

				if (cameraZoom !== camera.z) {
					cameraZoom = camera.z;
					viewport.applyZ(camera, report);
				}
				viewport.apply(camera);

				gridIndexPlayer1 = (camera.x | 0) * map.grid.sideLength + (camera.y | 0);

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

				gridIndexPlayer2 = (cameraScratch.x | 0) * map.grid.sideLength + (cameraScratch.y | 0);

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

				DOM.elPlayerOverlay1Ammo.innerText = String(character.ammo);
				DOM.elPlayerOverlay1Health.innerText = String(character.health) + '%';
				DOM.elPlayerOverlay1Lives.innerText = String(character.lives);
			}

			if (data.player2 !== undefined) {
				character = CharacterMetaDecode(data.player2);

				DOM.elPlayerOverlay2Ammo.innerText = String(character.ammo);
				DOM.elPlayerOverlay2Health.innerText = String(character.health) + '%';
				DOM.elPlayerOverlay2Lives.innerText = String(character.lives);
			}
		});

		// Calc: Game Over
		CalcMainBus.setCallbackGameover(() => {
			Game.gameOver = true;

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
		CalcMainBus.setCallbackNPCUpdate((data: Float32Array[]) => {
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
						} else if (updated === true || updatedR !== true) {
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
			if (dataUpdated === true) {
				dataUpdated = false;

				CalcMainBus.outputMap(map);
				CalcPathBus.outputMap(map);
				VideoEditorBus.outputMap(map);
				VideoMainBus.outputMap(map);
			}
		}, 100);

		const cheatCodeCheck = (player1: boolean, gamepad?: boolean) => {
			if (gamepad === true || (cheatCode.get('i') === true && cheatCode.get('l') === true && cheatCode.get('m') === true)) {
				CalcMainBus.outputCheatCode(player1);
			}
		};

		const dataApply = (position: GamingCanvasInputPosition, erase?: boolean) => {
			const cooridnate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

			if (erase === true) {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					map.npcById.delete(cooridnate.x * map.grid.sideLength + cooridnate.y);
				} else {
					map.grid.setBasic(cooridnate, 0);
				}
			} else {
				if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
					// Character
					id = cooridnate.x * map.grid.sideLength + cooridnate.y;

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

					map.npcById.set(id, {
						assetId: Game.editorAssetCharacterId,
						camera: new GamingCanvasGridCamera(Game.editorAssetPropertiesCharacter.angle || 0, cooridnate.x + 0.5, cooridnate.y + 0.5, 1),
						cameraPrevious: <GamingCanvasGridICamera>{},
						difficulty: Number(DOM.elEditorPropertiesCharacterInputDifficulty.value),
						gridIndex: id,
						fov: (120 * GamingCanvasConstPI_1_000) / 180,
						fovDistanceMax: 20,
						health: 100,
						id: id,
						runningSpeed: 0.00055,
						seenAngleById: new Map(),
						seenDistanceById: new Map(),
						seenLOSById: new Map(),
						size: 0.25,
						timestamp: 0,
						timestampPrevious: 0,
						timestampUnixState: 0,
						type: Game.editorAssetCharacterType,
						walking: characterWalking,
						walkingSpeed: 0.000275,
					});

					DOM.elEditorPropertiesCharacterInputId.value = String(id);
					DOM.elEditorPropertiesCharacterInputFOV.value = String(120) + '°';
				} else {
					// Cell
					map.grid.setBasic(cooridnate, Game.editorCellValue);
				}
			}

			dataUpdated = true;
		};

		const inspect = (position: GamingCanvasInputPosition) => {
			if (DOM.elEditorSectionCharacters.classList.contains('active') === true) {
				const coordinate: GamingCanvasInputPositionBasic = GamingCanvasGridInputToCoordinate(position, viewport);

				const characterNPC: CharacterNPC | undefined = map.npcById.get(coordinate.x * map.grid.sideLength + coordinate.y);

				if (characterNPC === undefined) {
					DOM.elEditorSectionObjects.click();
					inspect(position);
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
					Math.round(((Game.editorAssetPropertiesCharacter.angle || 0) * 180) / GamingCanvasConstPI_1_000),
				);
				DOM.elEditorPropertiesCharacterInputDifficulty.value = String(characterNPC.difficulty);
				DOM.elEditorPropertiesCharacterInputFOV.value = String(Math.round((characterNPC.fov * 180) / GamingCanvasConstPI_1_000)) + '°';
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
					// Asset based
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

				if (DOM.elEditorPropertiesCellInputExtended.checked) {
					DOM.elEditorSectionExtended.click();
				} else {
					DOM.elEditorSectionObjects.click();
				}
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
					map = Game.map;
					updated = false;
					updatedR = true;

					Game.reportNew = true;
				}

				// Skipping the intro can cause the initial audio to not be permitted
				if (Game.musicInstance === null && GamingCanvas.isAudioPermitted() === true) {
					// Prevent another cycle from starting while waiting for the play to start
					Game.musicInstance = -1;

					setTimeout(async () => {
						Game.musicInstance = await GamingCanvas.audioControlPlay(
							AssetIdAudio.AUDIO_MUSIC_LVL1,
							GamingCanvasAudioType.MUSIC,
							true,
							0,
							0,
							(<AssetPropertiesAudio>assetsAudio.get(AssetIdAudio.AUDIO_MUSIC_LVL1)).volume,
						);
					});
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
				if (Game.settingsCalcMain.player2Enable === true) {
					if (Game.settingGamePlayer2InputDevice === InputDevice.GAMEPAD) {
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
							DOM.elInfoSettings.click();
						}
					}
				}

				updated = true;
			}
		};

		const processorKeyboard = (input: GamingCanvasInputKeyboard) => {
			down = input.propriatary.down;

			if (modeEdit !== true || Game.editorHide === true) {
				if (Game.settingsCalcMain.player2Enable === true) {
					if (Game.settingGamePlayer2InputDevice === InputDevice.KEYBOARD) {
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
						DOM.elInfoSettings.click();
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
					case 'KeyI':
						if (down) {
							cheatCode.set('i', true);
							cheatCodeCheck(player1);
						} else {
							cheatCode.set('i', false);
						}
						break;
					case 'KeyL':
						if (down) {
							cheatCode.set('l', true);
							cheatCodeCheck(player1);
						} else {
							cheatCode.set('l', false);
						}
						break;
					case 'KeyM':
						if (down) {
							cheatCode.set('m', true);
							cheatCodeCheck(player1);
						} else {
							cheatCode.set('m', false);
						}
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
					case 'KeyR':
						DOM.elEditorCommandResetMap.click();
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
					console.log(Game.positionCellHighlight.left, report.canvasWidth * report.scaler, report.canvasHeight * report.scaler);

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
						// touchJoystick2X = position2.x;
						// touchJoystick2Y = position2.y;

						// DOM.elDebug.innerText = `${position2.x.toFixed(3)}x${position2.y.toFixed(3)}`;
						// DOM.elDebug.innerHTML += `<br>${(report.canvasWidth * report.scaler).toFixed(3)}x${(report.canvasHeight * report.scaler).toFixed(3)}`;

						DOM.elPlayerJoystick2.style.left = touchJoystick2X - touchJoystickSizeHalf + 'px';
						DOM.elPlayerJoystick2.style.top = touchJoystick2Y - touchJoystickSizeHalf + 'px';

						DOM.elPlayerJoystick2Thumb.style.left = touchJoystick2X + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick2Thumb.style.top = touchJoystick2Y + touchJoystickSizeQuarter + 'px';
					} else {
						touchJoystick2XThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position2.x - touchJoystick2X));
						touchJoystick2YThumb = Math.max(-touchJoystickSizeQuarter, Math.min(touchJoystickSizeHalf, position2.y - touchJoystick2Y));

						DOM.elPlayerJoystick2Thumb.style.left = touchJoystick2XThumb + touchJoystickSizeQuarter + 'px';
						DOM.elPlayerJoystick2Thumb.style.top = touchJoystick2YThumb + touchJoystickSizeQuarter + 'px';

						characterPlayerInputPlayer.r = (touchJoystick2XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf;
						// DOM.elDebug.innerHTML += `<br>${((touchJoystick2XThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						// DOM.elDebug.innerText += `x${((touchJoystick2YThumb - touchJoystickSizeEighth) / touchJoystickSizeHalf).toFixed(3)}`;
						if (characterPlayerInputPlayer.r > -touchJoystickDeadBand && characterPlayerInputPlayer.r < touchJoystickDeadBand) {
							characterPlayerInputPlayer.r = 0;
						}

						DOM.elEditorPropertiesCellOutputAssetId.innerText = `${(touchJoystick2XThumb + touchJoystickSizeQuarter) / touchJoystickSizeHalf - 1}`;
						if ((touchJoystick2YThumb / touchJoystickSizeHalf) * 2 === 2) {
							characterPlayerInputPlayer.action = true;
							DOM.elPlayerJoystick2Thumb.classList.add('press-green');
						} else {
							characterPlayerInputPlayer.action = false;
							DOM.elPlayerJoystick2Thumb.classList.remove('press-green');
						}

						if ((touchJoystick2YThumb / touchJoystickSizeHalf) * 2 === -1) {
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

				// Weapon Select
				if (inputOverlayPositions.length === 3) {
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

				// Cheat Code
				if (inputOverlayPositions.length === 4) {
					cheatCodeCheck(player1, true);
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
	}

	public static pause(state: boolean): void {
		if (state === true) {
			CalcMainBus.outputPause(true);
			CalcPathBus.outputPause(true);
			GamingCanvas.audioControlPauseAll(true);
			VideoMainBus.outputPause(true);
			VideoOverlayBus.outputPause(true);
		} else {
			if (Game.gameOver !== true) {
				CalcMainBus.outputPause(false);
				CalcPathBus.outputPause(false);
				GamingCanvas.audioControlPauseAll(false);
				VideoMainBus.outputPause(false);
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
			DOM.elEditorPropertiesCellExtended.classList.remove('show');
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
			DOM.elEditorPropertiesCellExtended.classList.remove('show');
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
			for (element of DOM.elEditorPropertiesCellExtendedInputs) {
				element.checked = false;
			}
			for (element of DOM.elEditorPropertiesCellInputs) {
				element.checked = false;
			}

			// Overlay
			DOM.elPlayerOverlay1.style.display = 'flex';

			if (Game.settingsCalcMain.player2Enable === true) {
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
			for (element of DOM.elEditorPropertiesCellExtendedInputs) {
				element.checked = false;
			}
			for (element of DOM.elEditorPropertiesCellInputs) {
				element.checked = false;
			}

			// Overlay
			DOM.elPerformance.style.display = 'flex';
		}
	}
}
