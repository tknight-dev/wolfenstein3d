import { DOM } from './dom.js';
import { CalcBusOutputDataCalculations, CalcBusInputDataSettings, CalcBusOutputDataCamera } from '../workers/calc/calc.model.js';
import { CalcBus } from '../workers/calc/calc.bus.js';
import { CharacterControl, CharacterControlEncode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../models/character.model.js';
import { GameGridCellMaskAndValues, GameMap } from '../models/game.model.js';
import { Resolution } from '../models/settings.model.js';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus.js';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model.js';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model.js';
import { VideoMainBus } from '../workers/video-main/video-main.bus.js';
import {
	GamingCanvas,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
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
	GamingCanvasGridInputOverlaySnapPxTopLeft,
	GamingCanvasGridUint16Array,
	GamingCanvasGridViewport,
} from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

export class Game {
	public static camera: GamingCanvasGridCamera;
	public static dataMaps: Map<number, GameMap> = new Map();
	public static inputRequest: number;
	public static modeEdit: boolean;
	public static report: GamingCanvasReport;
	public static reportNew: boolean;
	public static settingDebug: boolean;
	public static settingDPISupport: boolean;
	public static settingFOV: number;
	public static settingFPSDisplay: boolean;
	public static settingResolution: Resolution;
	public static settingsCalc: CalcBusInputDataSettings;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static viewport: GamingCanvasGridViewport;

	static {
		const grid: GamingCanvasGridUint16Array = new GamingCanvasGridUint16Array(64),
			gridSideCenter: number = grid.sideLength / 2,
			gridSideLength: number = grid.sideLength,
			// zoomInitial: number = 1.5;
			zoomInitial: number = 2;

		// Camera and Viewport
		Game.camera = new GamingCanvasGridCamera((90 * Math.PI) / 180, gridSideCenter + 0.5, gridSideCenter + 0.5, zoomInitial);
		Game.viewport = new GamingCanvasGridViewport(gridSideLength);

		const valueFloor: number = GameGridCellMaskAndValues.NULL_VALUE_NOT | GameGridCellMaskAndValues.FLOOR_VALUE,
			valueWall: number = GameGridCellMaskAndValues.NULL_VALUE_NOT | GameGridCellMaskAndValues.WALL_VALUE,
			valueWallSpecial: number = valueWall | 0x80;

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

		grid.set(gridSideCenter - 1, gridSideCenter + 2, valueWallSpecial); // Top-Left
		grid.set(gridSideCenter + 1, gridSideCenter + 2, valueWallSpecial); // Top-Right
		grid.set(gridSideCenter - 1, gridSideCenter - 2, valueWallSpecial); // Bottom-Left
		grid.set(gridSideCenter + 1, gridSideCenter - 2, valueWallSpecial); // Bottom-Right

		grid.set(gridSideCenter, gridSideCenter + 4, valueFloor); // Top-Center
		grid.set(gridSideCenter, gridSideCenter + 5, valueWallSpecial); // Top-Center
		grid.set(gridSideCenter, gridSideCenter - 4, valueFloor); // Bottom-Center
		grid.set(gridSideCenter, gridSideCenter - 5, valueWallSpecial); // Bottom-Center

		Game.dataMaps.set(0, {
			cameraZoomIntial: zoomInitial,
			grid: grid,
			gridEnds: [],
			gridLights: [],
		});
	}

	public static initializeDomInteractive(): void {
		DOM.elButtonEdit.onclick = () => {
			Game.viewEditor();
		};

		DOM.elButtonPlay.onclick = () => {
			Game.viewGame();
		};
	}

	public static initializeGame(): void {
		// Integrations
		Game.report = GamingCanvas.getReport();

		GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
			Game.camera.z = -1;
			Game.report = report;
			Game.reportNew = true;

			VideoEditorBus.outputReport(report);
			VideoMainBus.outputReport(report);
		});

		// Start inputs
		Game.processorBinder();
		Game.inputRequest = requestAnimationFrame(Game.processor);
	}

	private static processor(_: number): void {}

	private static processorBinder(): void {
		let audioClickVolume: number = 0.25,
			buffer: Set<number> = new Set(),
			camera: GamingCanvasGridCamera = Game.camera,
			cameraMoveX: number = 0,
			cameraMoveXOriginal: number = 0,
			cameraMoveY: number = 0,
			cameraMoveYOriginal: number = 0,
			cameraViewportHeightC: number = 0,
			cameraViewportStartXC: number = 0,
			cameraViewportStartYC: number = 0,
			cameraViewportWidthC: number = 0,
			cameraXOriginal: number = 0,
			cameraYOriginal: number = 0,
			cameraZoom: number = camera.z,
			cameraZoomMax: number = 2,
			cameraZoomMin: number = 0.5,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 0.05,
			characterControl: CharacterControl = {
				r: Game.camera.r, // initial value
				x: 0,
				y: 0,
			},
			down: boolean,
			downMode: boolean,
			elEditStyle: CSSStyleDeclaration = DOM.elEdit.style,
			elEditX: number,
			elEditY: number,
			gamepadMap: GameMap = <GameMap>Game.dataMaps.get(0),
			gamepadAxes: number[] | undefined,
			gamepadX: number = 0,
			gamepadY: number = 0,
			gamepadZoom: number = 0,
			inputLimitPerMs: number = GamingCanvas.getInputLimitPerMs(),
			modeEdit: boolean = Game.modeEdit,
			mouseAdded: boolean,
			position1: GamingCanvasInputPosition,
			position2: GamingCanvasInputPosition,
			positions: GamingCanvasInputPosition[] | undefined,
			cellSizePx: number = Game.viewport.cellSizePx,
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
			queueInput: GamingCanvasInput | undefined,
			queueInputOverlay: GamingCanvasInputPosition,
			queueTimestamp: number = -2025,
			report: GamingCanvasReport = Game.report,
			touchAdded: boolean,
			touchDistance: number,
			touchDistancePrevious: number = -1,
			updated: boolean,
			value: number,
			viewport: GamingCanvasGridViewport = Game.viewport,
			x: number,
			y: number;

		// Calc: Camera Mode
		CalcBus.setCallbackCamera((data: CalcBusOutputDataCamera) => {
			// First: VideoEditor
			VideoEditorBus.outputCalculations({
				camera: camera.encode(),
				gameMode: false,
				rays: Float32Array.from(data.rays), // Duplicate
				viewport: viewport.encode(),
			});

			// Second: VideoMain
			VideoMainBus.outputCalculations({
				camera: data.camera,
				rays: data.rays,
			});
		});

		// Calc: Game Mode
		CalcBus.setCallbackCalculations((data: CalcBusOutputDataCalculations) => {
			const characterPosition: CharacterPosition = CharacterPositionDecode(data.characterPosition);
			const rays: Float32Array = data.rays;
			const raysClone: Float32Array = Float32Array.from(rays);

			camera.r = characterPosition.r;
			camera.x = characterPosition.x;
			camera.y = characterPosition.y;
			camera.z = gamepadMap.cameraZoomIntial;
			raysClone.set(rays);

			if (cameraZoom !== camera.z) {
				cameraZoom = camera.z;
				viewport.applyZ(camera, report);
			}
			viewport.apply(camera);

			// First: VideoMain
			VideoMainBus.outputCalculations({
				camera: camera.encode(),
				rays: rays,
			});

			// Second: VideoEditor
			VideoEditorBus.outputCalculations({
				camera: camera.encode(),
				gameMode: true,
				rays: raysClone,
				viewport: viewport.encode(),
			});
		});

		// Limit how often a camera update can be sent via the bus
		setInterval(() => {
			if (updated || Game.reportNew) {
				report = Game.report;

				if (modeEdit === true) {
					// Zoom
					if (camera.z !== cameraZoom) {
						camera.z = cameraZoom;
						viewport.applyZ(camera, report);

						cellSizePx = viewport.cellSizePx;
					} else if (updated === true) {
						camera.x = cameraXOriginal + (cameraMoveX - cameraMoveXOriginal) * viewport.width;
						camera.y = cameraYOriginal + (cameraMoveY - cameraMoveYOriginal) * viewport.height;
					}
					viewport.apply(camera);

					// Calc: Camera Mode
					CalcBus.outputCamera(camera.encode());
				} else {
					// Calc: Game Mode
					CalcBus.outputCharacterControl(CharacterControlEncode(characterControl));
				}

				updated = false;
				Game.reportNew = false;
			}
		}, inputLimitPerMs);

		const processor = (timestampNow: number) => {
			Game.inputRequest = requestAnimationFrame(processor);

			if (timestampNow - queueTimestamp > inputLimitPerMs) {
				queueTimestamp = timestampNow;

				// Update temporary values
				modeEdit = Game.modeEdit;

				while (queue.length !== 0) {
					queueInput = <GamingCanvasInput>queue.pop();

					switch (queueInput.type) {
						// case GamingCanvasInputType.GAMEPAD:
						// 	processorGamepad(queueInput);
						// 	break;
						case GamingCanvasInputType.KEYBOARD:
							processorKeyboard(queueInput);
							break;
						case GamingCanvasInputType.MOUSE:
							queueInputOverlay = GamingCanvasInputPositionClone(queueInput.propriatary.position);
							GamingCanvas.relativizeInputToCanvas(queueInput);
							processorMouse(queueInput, queueInputOverlay);
							break;
						case GamingCanvasInputType.TOUCH:
							GamingCanvas.relativizeInputToCanvas(queueInput);
							processorTouch(queueInput);
							break;
					}
				}
			}
		};
		Game.processor = processor;

		const processorKeyboard = (input: GamingCanvasInputKeyboard) => {
			down = input.propriatary.down;

			if (modeEdit !== true) {
				switch (input.propriatary.action.code) {
					case 'ArrowLeft':
						if (down) {
							characterControl.r = -1;
						} else if (characterControl.r === -1) {
							characterControl.r = 0;
						}
						updated = true;
						break;
					case 'ArrowRight':
						if (down) {
							characterControl.r = 1;
						} else if (characterControl.r === 1) {
							characterControl.r = 0;
						}
						updated = true;
						break;
					case 'KeyA':
						if (down) {
							characterControl.x = -1;
						} else if (characterControl.x === -1) {
							characterControl.x = 0;
						}
						updated = true;
						break;
					case 'KeyD':
						if (down) {
							characterControl.x = 1;
						} else if (characterControl.x === 1) {
							characterControl.x = 0;
						}
						updated = true;
						break;
					case 'KeyW':
						if (down) {
							characterControl.y = -1;
						} else if (characterControl.y === -1) {
							characterControl.y = 0;
						}
						updated = true;
						break;
					case 'KeyS':
						if (down) {
							characterControl.y = 1;
						} else if (characterControl.y === 1) {
							characterControl.y = 0;
						}
						updated = true;
						break;
				}
			} else {
				switch (input.propriatary.action.code) {
					case 'KeyQ':
						// down
						// Rotate camera left
						break;
					case 'KeyE':
						// down
						// Rotate camera right
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
						if (down === true) {
							cameraMoveXOriginal = 1 - position1.xRelative;
							cameraMoveYOriginal = 1 - position1.yRelative;
							cameraXOriginal = camera.x;
							cameraYOriginal = camera.y;
						}
						downMode = down;
					}
					break;
				case GamingCanvasInputMouseAction.MOVE:
					// processorMouseCellHighlight(inputOverlayPosition);

					if (modeEdit === true) {
						if (downMode === true) {
							cameraMoveX = 1 - position1.xRelative;
							cameraMoveY = 1 - position1.yRelative;
							updated = true;
						}
					} else {
						// characterControl.r = (GamingCanvasUtilScale(position1.xRelative, 0, 1, 360, 0) * Math.PI) / 180;
						// updated = true;
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					// processorMouseCellHighlight(inputOverlayPosition);

					if (modeEdit === true) {
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
			setTimeout(() => {
				const leftTop: number[] = GamingCanvasGridInputOverlaySnapPxTopLeft(position, viewport);

				elEditStyle.display = 'block';
				elEditStyle.height = cellSizePx + 'px';
				elEditStyle.left = leftTop[0] + 'px';
				elEditStyle.top = leftTop[1] + 'px';
				elEditStyle.width = cellSizePx + 'px';
			}, inputLimitPerMs + 10);
		};

		const processorTouch = (input: GamingCanvasInputTouch) => {
			elEditStyle.display = 'none';
			positions = input.propriatary.positions;
			if (input.propriatary.down !== undefined) {
				down = input.propriatary.down;
			}

			switch (input.propriatary.action) {
				case GamingCanvasInputTouchAction.ACTIVE:
					if (modeEdit === true) {
						touchAdded = false;
						touchDistancePrevious = -1;

						if (down === true && positions !== undefined && positions.length === 1) {
							position1 = positions[0];

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
						if (positions !== undefined) {
							position1 = positions[0];

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
						}
					}
					break;
			}
		};
	}

	public static viewEditor(): void {
		if (Game.modeEdit !== true) {
			Game.modeEdit = true;

			// DOM
			DOM.elButtonEdit.classList.add('active');
			DOM.elButtonPlay.classList.remove('active');
			DOM.elCanvases[1].classList.remove('hide');
		}
	}

	public static viewGame(): void {
		if (Game.modeEdit !== false) {
			Game.modeEdit = false;

			// DOM
			// DOM.elButtonEdit.classList.remove('active');
			// DOM.elButtonPlay.classList.add('active');
			// DOM.elCanvases[1].classList.add('hide');

			// TMP FOR CALC WORK ON POSITION AND ROTATION
			DOM.elButtonEdit.classList.add('active');
			DOM.elButtonPlay.classList.remove('active');
			DOM.elCanvases[1].classList.remove('hide');
		}
	}
}
