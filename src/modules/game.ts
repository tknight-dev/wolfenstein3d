import { Assets } from './assets.js';
import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdMap,
	AssetImgCategory,
	AssetPropertiesAudio,
	AssetPropertiesImage,
	assetsAudio,
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
import { GameGridCellMasksAndValues, GameGridCellMasksAndValuesExtended, GameMap } from '../models/game.model.js';
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
} from '@tknight-dev/gaming-canvas/grid';
import { CharacterInput } from '../models/character.model.js';

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
	public static editorAssetProperties: AssetPropertiesImage;
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

		DOM.elEditorPropertiesInputExtended.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.EXTENDED);

		if (DOM.elEditorPropertiesInputExtended.checked) {
			DOM.elEditorPropertiesExtendedInputDoor.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR);
			DOM.elEditorPropertiesExtendedInputDoorLocked1.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR_LOCKED_1);
			DOM.elEditorPropertiesExtendedInputDoorLocked2.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.DOOR_LOCKED_2);
			DOM.elEditorPropertiesExtendedInputSwitch.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.SWITCH);
			// DOM.elEditorPropertiesExtendedInputTeleport.checked && (Game.editorCellValue |= GameGridCellMasksAndValuesExtended.TELEPORT);
		}

		DOM.elEditorPropertiesInputFloor.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.FLOOR);
		DOM.elEditorPropertiesInputLight.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.LIGHT);
		DOM.elEditorPropertiesInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);

		if (DOM.elEditorPropertiesInputSpriteFixedH.checked !== true && DOM.elEditorPropertiesInputSpriteFixedV.checked === true) {
			DOM.elEditorPropertiesInputSpriteFixedH.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_NS);
			Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_EW;
		}

		DOM.elEditorPropertiesInputWall.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL);
		DOM.elEditorPropertiesInputWallInvisible.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL_INVISIBLE);
		DOM.elEditorPropertiesInputWallMovable.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL_MOVABLE);

		DOM.elEditorPropertiesOutputAssetId.innerText = Game.editorAssetIdImg.toString(16).toUpperCase().padStart(2, '0');
		DOM.elEditorPropertiesOutputProperties.innerText = (Game.editorCellValue & ~GameGridCellMasksAndValues.ID_MASK)
			.toString(16)
			.toUpperCase()
			.padStart(2, '0');
		DOM.elEditorPropertiesOutputValue.innerText = Game.editorCellValue.toString(16).toUpperCase().padStart(4, '0');
	}

	private static cellClear(): void {
		Game.editorAssetIdImg = 0;
		Game.editorCellValue = 0;

		let element: HTMLInputElement;
		for (element of DOM.elEditorPropertiesExtendedInputs) {
			element.checked = false;
		}
		for (element of DOM.elEditorPropertiesInputs) {
			element.checked = false;
		}

		DOM.elEditorPropertiesOutputAssetId.innerText = '0000';
		DOM.elEditorPropertiesOutputProperties.innerText = '0000';
		DOM.elEditorPropertiesOutputValue.innerText = '0000';
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
				const a: HTMLAnchorElement = document.createElement('a'),
					downloadData = 'data:text/json;charset=utf-8,' + btoa(JSON.stringify(Game.map));

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
							const parsed: GameMap = JSON.parse(atob(<string>fileReader.result));
							parsed.grid = GamingCanvasGridUint16Array.from(<Uint16Array>parsed.grid.data);

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
		};

		DOM.elEditorCommandMetaMenu.onclick = () => {
			Settings.setMetaMap(false);
			DOM.elMetaMap.style.display = 'block';
			Game.inputSuspend = true;
		};

		// Editor items
		DOM.elEditorPropertiesExtendedInputs.forEach((element: HTMLInputElement) => {
			element.onchange = () => {
				Game.cellApply();
			};
		});
		DOM.elEditorPropertiesInputs.forEach((element: HTMLInputElement) => {
			element.onchange = () => {
				Game.cellApply();
			};
		});

		// Editor items
		DOM.elEditorItemsObjects.forEach((element: HTMLElement) => {
			element.onclick = () => {
				if (DOM.elEditorItemActive !== element) {
					DOM.elEditorItemActive && DOM.elEditorItemActive.classList.remove('active');

					DOM.elEditorItemActive = element;

					DOM.elButtonApply.click();
					element.classList.add('active');

					// Asset configuraiton
					Game.cellClear();
					Game.editorAssetIdImg = Number(element.id);
					Game.editorAssetProperties = <AssetPropertiesImage>assetsImages.get(Game.editorAssetIdImg);

					if (Game.editorAssetProperties.blocking === true) {
						DOM.elEditorPropertiesInputWallInvisible.checked = true;
					}

					switch (Game.editorAssetProperties.category) {
						case AssetImgCategory.EXTENDED:
							DOM.elEditorPropertiesInputExtended.checked = true;
							DOM.elEditorPropertiesExtended.classList.add('show');

							switch (Game.editorAssetIdImg) {
								case AssetIdImg.SPRITE_ELEVATOR_DOOR:
								case AssetIdImg.SPRITE_METAL_DOOR:
									DOM.elEditorPropertiesExtendedInputDoor.checked = true;
									DOM.elEditorPropertiesInputSpriteFixedH.checked = true;
									break;
								case AssetIdImg.SPRITE_METAL_DOOR_LOCKED:
									DOM.elEditorPropertiesExtendedInputDoor.checked = true;
									DOM.elEditorPropertiesInputSpriteFixedH.checked = true;
									break;
								case AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN:
								case AssetIdImg.WALL_ELEVATOR_SWITCH_UP:
									DOM.elEditorPropertiesExtendedInputSwitch.checked = true;
									DOM.elEditorPropertiesInputWall.checked = true;
									break;
							}
							break;
						case AssetImgCategory.LIGHT:
							DOM.elEditorPropertiesInputLight.checked = true;
							DOM.elEditorPropertiesExtended.classList.remove('show');
							break;
						case AssetImgCategory.SPRITE:
						case AssetImgCategory.SPRITE_PICKUP:
							DOM.elEditorPropertiesExtended.classList.remove('show');
							break;
						case AssetImgCategory.WALL:
							DOM.elEditorPropertiesInputWall.checked = true;
							DOM.elEditorPropertiesExtended.classList.remove('show');
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
		};

		DOM.elSettingsCancel.onclick = () => {
			Settings.set(false);

			DOM.elSettings.style.display = 'none';
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

	public static start(): void {
		// Integrations
		Game.report = GamingCanvas.getReport();

		// GameMap
		Game.map = <GameMap>Assets.dataMap.get(AssetIdMap.EPISODE_01_LEVEL01);

		Game.camera = new GamingCanvasGridCamera(Game.map.position.r, Game.map.position.x + 0.5, Game.map.position.y + 0.5, Game.map.position.z);

		Game.viewport = new GamingCanvasGridViewport(Game.map.grid.sideLength);
		Game.viewport.applyZ(Game.camera, GamingCanvas.getReport());
		Game.viewport.apply(Game.camera, false);

		// Report
		GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
			Game.report = report;
			Game.reportNew = true;

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

		const constDataApply = (position: GamingCanvasInputPosition, erase?: boolean) => {
			map.grid.setBasic(GamingCanvasGridInputToCoordinate(position, viewport), erase === true ? 0 : Game.editorCellValue);
			dataUpdated = true;
		};

		const inspect = (position: GamingCanvasInputPosition) => {
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

			if (clicked === false) {
				// Special
				DOM.elButtonApply.click();
				Game.editorCellHighlightEnable = true;
				DOM.elEdit.style.background = `url(${Assets.dataImage.get(Game.editorAssetIdImg)})`;
				DOM.elEdit.style.backgroundColor = '#980066';
			}

			// Apply
			DOM.elEditorPropertiesInputExtended.checked = (cell & GameGridCellMasksAndValues.EXTENDED) !== 0;

			if (DOM.elEditorPropertiesInputExtended.checked === true) {
				DOM.elEditorPropertiesExtended.classList.add('show');

				DOM.elEditorPropertiesExtendedInputDoor.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR) !== 0;
				DOM.elEditorPropertiesExtendedInputDoorLocked1.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR_LOCKED_1) !== 0;
				DOM.elEditorPropertiesExtendedInputDoorLocked2.checked = (cell & GameGridCellMasksAndValuesExtended.DOOR_LOCKED_2) !== 0;
				DOM.elEditorPropertiesExtendedInputSwitch.checked = (cell & GameGridCellMasksAndValuesExtended.SWITCH) !== 0;
				// DOM.elEditorPropertiesExtendedInputTeleport.checked = (cell & GameGridCellMasksAndValuesExtended.TELEPORT) !== 0;
			} else {
				DOM.elEditorPropertiesExtended.classList.remove('show');

				for (element of DOM.elEditorPropertiesExtendedInputs) {
					(<HTMLInputElement>element).checked = false;
				}
			}

			DOM.elEditorPropertiesInputFloor.checked = (cell & GameGridCellMasksAndValues.FLOOR) !== 0;
			DOM.elEditorPropertiesInputLight.checked = (cell & GameGridCellMasksAndValues.LIGHT) !== 0;
			DOM.elEditorPropertiesInputSpriteFixedH.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_NS) !== 0;

			if (DOM.elEditorPropertiesInputSpriteFixedH.checked === true) {
				DOM.elEditorPropertiesInputSpriteFixedV.checked = false;
			} else {
				DOM.elEditorPropertiesInputSpriteFixedV.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_EW) !== 0;
			}
			DOM.elEditorPropertiesInputWall.checked = (cell & GameGridCellMasksAndValues.WALL) !== 0;
			DOM.elEditorPropertiesInputWallInvisible.checked = (cell & GameGridCellMasksAndValues.WALL_INVISIBLE) !== 0;
			DOM.elEditorPropertiesInputWallMovable.checked = (cell & GameGridCellMasksAndValues.WALL_MOVABLE) !== 0;
			Game.cellApply();
		};

		const position = (position: GamingCanvasInputPosition) => {
			Game.position = GamingCanvasGridInputToCoordinate(position, viewport, Game.position);
			DOM.elEditorPropertiesOutputIndex.innerText = String((Game.position.x | 0) * Game.map.grid.sideLength + (Game.position.y | 0)).padStart(4, '0');
			DOM.elEditorPropertiesOutputPosition.innerText = `(${String(Game.position.x).padStart(3, '0')}, ${String(Game.position.y).padStart(3, '0')}) ${((camera.r * 180) / GamingCanvasConstPI) | 0}°`;
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

				if (input.propriatary.axes) {
					characterPlayerInputPlayer.x = input.propriatary.axes[0];
					characterPlayerInputPlayer.y = input.propriatary.axes[1];
					characterPlayerInputPlayer.r = input.propriatary.axes[2];
				}

				if (input.propriatary.buttons) {
					characterPlayerInputPlayer.action === input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.BUMPER__LEFT];
					characterPlayerInputPlayer.fire === input.propriatary.buttons[GamingCanvasInputGamepadControllerButtons.BUMPER__RIGHT];
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
										constDataApply(position1);
										break;
									case EditType.ERASE:
										constDataApply(position1, true);
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
										constDataApply(position1);
										break;
									case EditType.ERASE:
										constDataApply(position1, true);
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
			DOM.elEditorPropertiesExtended.classList.remove('show');
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
			DOM.elEditorPropertiesExtended.classList.remove('show');
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
			for (element of DOM.elEditorPropertiesExtendedInputs) {
				element.checked = false;
			}
			for (element of DOM.elEditorPropertiesInputs) {
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
		}
	}
}
