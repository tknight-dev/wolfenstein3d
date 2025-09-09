import { Assets } from './assets.js';
import { AssetId, AssetImgCategory, AssetPropertiesImage, assets } from '../asset-manager.js';
import { DOM } from './dom.js';
import { CalcBusOutputDataCalculations, CalcBusInputDataPlayerInput, CalcBusInputDataSettings, CalcBusOutputDataCamera } from '../workers/calc/calc.model.js';
import { CalcBus } from '../workers/calc/calc.bus.js';
import { GameGridCellMasksAndValues, GameMap } from '../models/game.model.js';
import { Resolution } from '../models/settings.model.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model.js';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';
import {
	GamingCanvas,
	GamingCanvasConstPI,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputGamepad,
	GamingCanvasInputKeyboard,
	GamingCanvasInputMouse,
	GamingCanvasInputMouseAction,
	GamingCanvasInputPosition,
	GamingCanvasInputPositionClone,
	GamingCanvasInputPositionDistance,
	GamingCanvasInputTouch,
	GamingCanvasInputTouchAction,
	GamingCanvasInputType,
	GamingCanvasOrientation,
	GamingCanvasReport,
	GamingCanvasUtilScale,
} from '@tknight-dev/gaming-canvas';
import {
	GamingCanvasGridCamera,
	GamingCanvasGridICamera,
	GamingCanvasGridCharacterInput,
	GamingCanvasGridInputOverlaySnapPxTopLeft,
	GamingCanvasGridUint16Array,
	GamingCanvasGridViewport,
	GamingCanvasGridRaycastResultDistanceMapInstance,
	GamingCanvasGridInputToCoordinate,
} from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

enum EditType {
	APPLY,
	INSPECT,
	PAN_ZOOM,
}

export class Game {
	public static camera: GamingCanvasGridCamera;
	public static dataMap: GameMap;
	public static dataMaps: Map<number, GameMap> = new Map();
	public static editorAssetId: number;
	public static editorAssetProperties: AssetPropertiesImage;
	public static editorCellHighlightEnable: boolean;
	public static editorCellValue: number;
	public static inputRequest: number;
	public static modeEdit: boolean;
	public static modeEditType: EditType = EditType.PAN_ZOOM;
	public static report: GamingCanvasReport;
	public static reportNew: boolean;
	public static settingDebug: boolean;
	public static settingDPISupport: boolean;
	public static settingFOV: number;
	public static settingFPSDisplay: boolean;
	public static settingPlayer1Keyboard: boolean;
	public static settingResolution: Resolution;
	public static settingsCalc: CalcBusInputDataSettings;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static viewport: GamingCanvasGridViewport;

	static {
		const grid: GamingCanvasGridUint16Array = new GamingCanvasGridUint16Array(192),
			gridSideCenter: number = grid.sideLength / 2,
			gridSideLength: number = grid.sideLength,
			position: GamingCanvasGridICamera = {
				r: (180.0001 * GamingCanvasConstPI) / 180, // .0001 fixes initial render glitch idk
				x: gridSideCenter,
				y: gridSideCenter,
				z: 2.5,
			};

		const valueFloor: number = GameGridCellMasksAndValues.FLOOR,
			valueSprite: number =
				valueFloor |
				GameGridCellMasksAndValues.LIGHT |
				GameGridCellMasksAndValues.SPRITE_ROTATING |
				(AssetId.IMG_SPRITE_LIGHT_CEILING_ON << GameGridCellMasksAndValues.ID_SHIFT),
			valueWall: number = GameGridCellMasksAndValues.WALL | (AssetId.IMG_WALL_BRICK_BLUE << GameGridCellMasksAndValues.ID_SHIFT),
			valueWallCell: number = GameGridCellMasksAndValues.WALL | (AssetId.IMG_WALL_BRICK_BLUE_CELL << GameGridCellMasksAndValues.ID_SHIFT),
			valueWallCellSkeleton: number =
				GameGridCellMasksAndValues.WALL | (AssetId.IMG_WALL_BRICK_BLUE_CELL_SKELETON << GameGridCellMasksAndValues.ID_SHIFT);

		// Camera and Viewport
		Game.camera = new GamingCanvasGridCamera(position.r, gridSideCenter + 0.5, gridSideCenter + 0.5, position.z);
		Game.viewport = new GamingCanvasGridViewport(gridSideLength);

		// Walls
		let boxSize: number = 4;
		for (let x = -boxSize; x <= boxSize; x++) {
			for (let y = -boxSize; y <= boxSize; y++) {
				grid.set(x + gridSideCenter, y + gridSideCenter, valueWall);
			}
		}

		// Floors
		boxSize = 3;
		for (let x = -boxSize; x <= boxSize; x++) {
			for (let y = -boxSize; y <= boxSize; y++) {
				grid.set(x + gridSideCenter, y + gridSideCenter, valueFloor);
			}
		}

		grid.set(gridSideCenter - 1, gridSideCenter + 3, valueSprite); // Bottom-Left
		grid.set(gridSideCenter + 1, gridSideCenter + 3, valueSprite); // Bottom-Right
		grid.set(gridSideCenter - 1, gridSideCenter - 3, valueSprite); // Top-Left
		grid.set(gridSideCenter + 1, gridSideCenter - 3, valueSprite); // Top-Right

		grid.set(gridSideCenter - 1, gridSideCenter + 1, valueSprite); // Bottom-Left
		grid.set(gridSideCenter + 1, gridSideCenter + 1, valueSprite); // Bottom-Right
		grid.set(gridSideCenter - 1, gridSideCenter - 1, valueSprite); // Top-Left
		grid.set(gridSideCenter + 1, gridSideCenter - 1, valueSprite); // Top-Right

		grid.set(gridSideCenter - 1, gridSideCenter - 2, valueWall); // Top-Left
		grid.set(gridSideCenter + 1, gridSideCenter - 2, valueWall); // Top-Right
		grid.set(gridSideCenter - 1, gridSideCenter + 2, valueWall); // Bottom-Left
		grid.set(gridSideCenter + 1, gridSideCenter + 2, valueWall); // Bottom-Right

		grid.set(gridSideCenter, gridSideCenter + 4, valueFloor); // Bottom-Center
		grid.set(gridSideCenter, gridSideCenter + 5, valueWallCellSkeleton); // Bottom-Center
		grid.set(gridSideCenter, gridSideCenter - 4, valueFloor); // Top-Center
		grid.set(gridSideCenter, gridSideCenter - 5, valueWallCell); // Top-Center

		Game.dataMap = {
			grid: grid,
			gridExtended: new Map(),
			position: position,
		};
		Game.dataMaps.set(0, Game.dataMap);
	}

	private static cellApply(): void {
		Game.editorCellValue = Game.editorAssetId << GameGridCellMasksAndValues.ID_SHIFT;

		DOM.elEditorPropertiesInputExtended.checked && (Game.editorCellValue |= GameGridCellMasksAndValues.EXTENDED);
		DOM.elEditorPropertiesInputFloor && (Game.editorCellValue |= GameGridCellMasksAndValues.FLOOR);
		DOM.elEditorPropertiesInputLight && (Game.editorCellValue |= GameGridCellMasksAndValues.LIGHT);
		DOM.elEditorPropertiesInputSpriteFixedH && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_H);
		DOM.elEditorPropertiesInputSpriteFixedV && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_FIXED_V);
		DOM.elEditorPropertiesInputSpriteRotating && (Game.editorCellValue |= GameGridCellMasksAndValues.SPRITE_ROTATING);
		DOM.elEditorPropertiesInputSpriteWall && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL);
		DOM.elEditorPropertiesInputSpriteWallInvisible && (Game.editorCellValue |= GameGridCellMasksAndValues.WALL_INVISIBLE);

		DOM.elEditorPropertiesOutputAssetId.innerText = Game.editorAssetId.toString(16).toUpperCase().padStart(2, '0');
		DOM.elEditorPropertiesOutputProperties.innerText = (Game.editorCellValue & ~GameGridCellMasksAndValues.ID_MASK)
			.toString(16)
			.toUpperCase()
			.padStart(2, '0');
		DOM.elEditorPropertiesOutputValue.innerText = Game.editorCellValue.toString(16).toUpperCase().padStart(4, '0');
	}

	private static cellClear(): void {
		Game.editorAssetId = 0;
		Game.editorCellValue = 0;

		let element: HTMLInputElement;
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

		DOM.elButtonEye.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') === true) {
				DOM.elButtonEye.classList.remove('active');
				DOM.elCanvases[2].classList.add('hide');

				DOM.elButtonMove.click();
			} else {
				DOM.elButtonEye.classList.add('active');
				DOM.elCanvases[2].classList.remove('hide');
			}
		};

		DOM.elButtonInspect.onclick = () => {
			if (DOM.elButtonEye.classList.contains('active') !== true) {
				DOM.elButtonEye.click();
			}

			if (DOM.elButtonInspect.classList.contains('active') !== true) {
				DOM.elButtonApply.classList.remove('active');
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

		// Editor items
		DOM.elEditorItems.forEach((element: HTMLElement) => {
			element.onclick = () => {
				if (DOM.elEditorItemActive !== element) {
					DOM.elEditorItemActive && DOM.elEditorItemActive.classList.remove('active');

					DOM.elEditorItemActive = element;

					DOM.elButtonApply.click();
					element.classList.add('active');

					// Asset configuraiton
					Game.cellClear();
					Game.editorAssetId = Number(element.id);
					Game.editorAssetProperties = <AssetPropertiesImage>assets.get(Game.editorAssetId);

					switch (Game.editorAssetProperties.category) {
						case AssetImgCategory.DOOR:
							DOM.elEditorPropertiesInputFloor.checked = true;
							DOM.elEditorPropertiesInputSpriteFixedH.checked = true;
							break;
						case AssetImgCategory.LIGHT:
							DOM.elEditorPropertiesInputFloor.checked = true;
							DOM.elEditorPropertiesInputLight.checked = true;
							DOM.elEditorPropertiesInputSpriteRotating.checked = true;
							break;
						case AssetImgCategory.SPRITE:
							DOM.elEditorPropertiesInputFloor.checked = true;
							DOM.elEditorPropertiesInputSpriteRotating.checked = true;
							break;
						case AssetImgCategory.SPRITE_PICKUP:
							DOM.elEditorPropertiesInputFloor.checked = true;
							DOM.elEditorPropertiesInputSpriteRotating.checked = true;
							break;
						case AssetImgCategory.WALL:
							DOM.elEditorPropertiesInputSpriteWall.checked = true;
							break;
					}
					Game.cellApply();

					// Highlighter based on asset
					Game.editorCellHighlightEnable = true;
					DOM.elEdit.style.background = `url(${Assets.dataImage.get(Game.editorAssetId)})`;
					DOM.elEdit.style.backgroundColor = '#980066';
				}
			};
		});
	}

	public static initializeGame(): void {
		// Integrations
		Game.report = GamingCanvas.getReport();

		GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
			Game.camera.z = -1;
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
			cameraZoom: number = camera.z,
			cameraZoomMax: number = 15,
			cameraZoomMin: number = 0.5,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 0.3,
			characterPlayerInput: CalcBusInputDataPlayerInput = {
				player1: {
					r: 0, // -1 to 1 (-1 is increase r)
					x: 0, // -1 to 1 (-1 is left)
					y: 0, // -1 to 1 (-1 is up)
				},
				player2: {
					r: 0, // -1 to 1 (-1 is increase r)
					x: 0, // -1 to 1 (-1 is left)
					y: 0, // -1 to 1 (-1 is up)
				},
			},
			characterPlayerInputPlayer: GamingCanvasGridCharacterInput,
			down: boolean,
			downMode: boolean,
			downModeWheel: boolean,
			elEditStyle: CSSStyleDeclaration = DOM.elEdit.style,
			gameMap: GameMap = <GameMap>Game.dataMaps.get(0),
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
				camera.z = gameMap.position.z;

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

		// Limit how often a camera update can be sent via the bus
		setInterval(() => {
			if (updated || updatedR || Game.reportNew) {
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

		const inspect = (position: GamingCanvasInputPosition) => {
			const cell: number | undefined = Game.dataMap.grid.getBasic(GamingCanvasGridInputToCoordinate(position, viewport));

			if (cell === undefined) {
				return;
			}
			const assetId: number = (cell & GameGridCellMasksAndValues.ID_MASK) >> GameGridCellMasksAndValues.ID_SHIFT;
			const assetIdStr: String = String(assetId);
			let clicked: boolean = false,
				element: HTMLElement;

			// Values
			Game.editorAssetId = assetId;
			Game.editorAssetProperties = <AssetPropertiesImage>assets.get(Game.editorAssetId);

			// Click associated asset
			for (element of DOM.elEditorItems) {
				if (element.id === assetIdStr) {
					clicked = true;
					element.click();
					element.scrollIntoView({ behavior: 'smooth' });
					break;
				}
			}

			if (clicked === false) {
				// Special
			}

			// Apply
			DOM.elEditorPropertiesInputExtended.checked = (cell & GameGridCellMasksAndValues.EXTENDED) !== 0;
			DOM.elEditorPropertiesInputFloor.checked = (cell & GameGridCellMasksAndValues.FLOOR) !== 0;
			DOM.elEditorPropertiesInputLight.checked = (cell & GameGridCellMasksAndValues.LIGHT) !== 0;
			DOM.elEditorPropertiesInputSpriteFixedH.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_H) !== 0;
			DOM.elEditorPropertiesInputSpriteFixedV.checked = (cell & GameGridCellMasksAndValues.SPRITE_FIXED_V) !== 0;
			DOM.elEditorPropertiesInputSpriteRotating.checked = (cell & GameGridCellMasksAndValues.SPRITE_ROTATING) !== 0;
			DOM.elEditorPropertiesInputSpriteWall.checked = (cell & GameGridCellMasksAndValues.WALL) !== 0;
			DOM.elEditorPropertiesInputSpriteWallInvisible.checked = (cell & GameGridCellMasksAndValues.WALL_INVISIBLE) !== 0;
			Game.cellApply();
		};

		const processor = (timestampNow: number) => {
			Game.inputRequest = requestAnimationFrame(processor);

			if (timestampNow - queueTimestamp > inputLimitPerMs) {
				queueTimestamp = timestampNow;

				// Update temporary values
				modeEdit = Game.modeEdit;
				modeEditType = Game.modeEditType;

				while (queue.length !== 0) {
					queueInput = <GamingCanvasInput>queue.pop();

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
				if (Game.settingPlayer1Keyboard === true) {
					characterPlayerInputPlayer = characterPlayerInput.player2;
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player1;
				}

				if (input.propriatary.axes) {
					characterPlayerInputPlayer.x = input.propriatary.axes[0];
					characterPlayerInputPlayer.y = input.propriatary.axes[1];
					characterPlayerInputPlayer.r = input.propriatary.axes[2];
				} else {
					// Button
				}

				updated = true;
			}
		};

		const processorKeyboard = (input: GamingCanvasInputKeyboard) => {
			down = input.propriatary.down;

			if (modeEdit !== true) {
				if (Game.settingPlayer1Keyboard === true) {
					characterPlayerInputPlayer = characterPlayerInput.player1;
				} else {
					characterPlayerInputPlayer = characterPlayerInput.player2;
				}

				switch (input.propriatary.action.code) {
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
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							if (down === true) {
								cameraMoveXOriginal = 1 - position1.xRelative;
								cameraMoveYOriginal = 1 - position1.yRelative;
								cameraXOriginal = camera.x;
								cameraYOriginal = camera.y;
							}
							downMode = down;
						} else {
							if (down === true) {
								if (modeEditType === EditType.APPLY) {
									console.log('CLICK');
								} else {
									inspect(position1);
								}
							}
						}
					}
					break;
				case GamingCanvasInputMouseAction.WHEEL:
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							downModeWheel = down;
						}
					}
					break;
				case GamingCanvasInputMouseAction.MOVE:
					if (modeEdit === true) {
						if (modeEditType === EditType.PAN_ZOOM) {
							if (modeEdit === true) {
								if (downMode === true) {
									cameraMoveX = 1 - position1.xRelative;
									cameraMoveY = 1 - position1.yRelative;
									updated = true;
								} else if (downModeWheel === true) {
									camera.r = position1.xRelative * 2 * GamingCanvasConstPI;
									updatedR = true;
								}
							}
						} else {
							processorMouseCellHighlight(inputOverlayPosition);
						}
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					if (modeEdit === true) {
						processorMouseCellHighlight(inputOverlayPosition);

						if (modeEditType === EditType.PAN_ZOOM) {
							cameraZoomPrevious = cameraZoom;
							cameraZoom = Math.max(cameraZoomMin, Math.min(cameraZoomMax, cameraZoom + (down ? -cameraZoomStep : cameraZoomStep)));
							if (cameraZoom !== cameraZoomPrevious) {
								updated = true;
							}
						} else {
							processorMouseCellHighlight(inputOverlayPosition);
						}
					}
					break;
			}
		};

		const processorMouseCellHighlight = (position: GamingCanvasInputPosition) => {
			// Timeout allows for the viewport to be updated before the input before fitting the cell highlight
			if (Game.editorCellHighlightEnable === true) {
				setTimeout(() => {
					const cellSizePxLeftTop: number[] = GamingCanvasGridInputOverlaySnapPxTopLeft(position, report, viewport);

					elEditStyle.display = 'block';
					elEditStyle.height = cellSizePxLeftTop[0] + 'px';
					elEditStyle.left = cellSizePxLeftTop[1] + 'px';
					elEditStyle.top = cellSizePxLeftTop[2] + 'px';
					elEditStyle.width = cellSizePxLeftTop[0] + 'px';
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

			DOM.elVideoInteractive.classList.add('cursor-grab');
			DOM.elVideoInteractive.classList.remove('cursor-pointer');
			Game.modeEditType = EditType.PAN_ZOOM;
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

			// TMP FOR CALC WORK ON POSITION AND ROTATION
			// DOM.elButtonEdit.classList.add('active');
			// DOM.elButtonPlay.classList.remove('active');
			// DOM.elCanvases[1].classList.remove('hide');
		}
	}
}
