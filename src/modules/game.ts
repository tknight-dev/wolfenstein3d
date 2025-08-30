import { DOM } from './dom';
import { CalcBusInputDataSettings } from '../workers/calc/calc.model';
import { CalcBus } from '../workers/calc/calc.bus';
import { Camera, CameraDecode, CameraEncode } from '../models/camera.model';
import { CharacterControl, CharacterControlEncode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../models/character.model';
import { GameMap } from '../models/game.model';
import { Resolution } from '../models/settings.model';
import { Viewport } from '../models/viewport.model';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model';
import { VideoMainBus } from '../workers/video-main/video-main.bus';
import {
	GamingCanvas,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputKeyboard,
	GamingCanvasInputMouse,
	GamingCanvasInputMouseAction,
	GamingCanvasInputPosition,
	GamingCanvasInputPositionDistance,
	GamingCanvasInputTouch,
	GamingCanvasInputTouchAction,
	GamingCanvasInputType,
	GamingCanvasOrientation,
	GamingCanvasReport,
	GamingCanvasScale,
} from '@tknight-dev/gaming-canvas';
import { GamingCanvasInputGamepadControllerVendor } from '@tknight-dev/gaming-canvas/dist/engines/gamepad.engine';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

export class Game {
	public static camera: Camera;
	public static dataMaps: Map<number, GameMap> = new Map();
	public static inputRequest: number;
	public static modeEdit: boolean;
	public static report: GamingCanvasReport;
	public static reportNew: boolean;
	public static settingDebug: boolean;
	public static settingDPISupport: boolean;
	public static settingFPSDisplay: boolean;
	public static settingResolution: Resolution;
	public static settingsCalc: CalcBusInputDataSettings;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static viewport: Viewport;

	static {
		const gameCameraZoomInitial: number = 80,
			gameDataWidth: number = 64,
			positionCenter: number = gameDataWidth / 2;

		// Camera and Viewport
		Game.camera = {
			fov: (60 * Math.PI) / 180, // 60deg
			r: (90 * Math.PI) / 180, // North
			x: gameDataWidth / 2 + 0.5,
			y: gameDataWidth / 2 + 0.5,
			z: gameCameraZoomInitial, // Def 10
		};
		Game.viewport = new Viewport(5, gameDataWidth, gameDataWidth);

		// Game Map
		const map: Uint8Array = new Uint8Array(gameDataWidth * gameDataWidth),
			mapCenter: number = (gameDataWidth ** 2 / 2 + gameDataWidth / 2) | 0,
			valueFlooor: number = 0x00,
			valueWall: number = 0x01;

		// Map basic layout
		map.fill(valueWall);

		// Boundaries
		// map[0] = 0xff; // top-left
		// map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2) | 0] = 0xff; // center
		// map[gameDataWidth ** 2 - gameDataWidth] = 0xff; // top-right
		// map[gameDataWidth ** 2 - 1] = 0xff; // bottom-right
		// gameData[gameDataWidth - 1] = 0xff; // bottom-left

		// Central square...ish
		let boxSize: number = 3;
		for (let x = mapCenter - gameDataWidth * boxSize; x <= mapCenter + gameDataWidth * boxSize; x += gameDataWidth) {
			for (let y = -boxSize; y <= boxSize; y++) {
				map[x + y] = valueFlooor;
			}
		}

		map[(gameDataWidth ** 2 / 2 - gameDataWidth / 2 - 2) | 0] = valueWall; // Top-Left
		map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2 + gameDataWidth - 2) | 0] = valueWall; // Top-Right
		map[(gameDataWidth ** 2 / 2 - gameDataWidth / 2 + 2) | 0] = valueWall; // Bottom-Left
		map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2 + gameDataWidth + 2) | 0] = valueWall; // Bottom-Right

		map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2 - (boxSize + 1)) | 0] = valueFlooor; // Top-Center
		map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2 + (boxSize + 1)) | 0] = valueFlooor; // Bottom-Center

		Game.dataMaps.set(0, {
			cameraZoomIntial: gameCameraZoomInitial,
			data: map,
			dataEnds: [],
			dataLights: [],
			dataWidth: gameDataWidth,
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
			camera: Camera = Game.camera,
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
			cameraZoomMax: number = 100,
			cameraZoomMin: number = 10,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 10,
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
			queueInputOverlay: GamingCanvasInput,
			queueTimestamp: number = -2025,
			report: GamingCanvasReport = Game.report,
			touchAdded: boolean,
			touchDistance: number,
			touchDistancePrevious: number = -1,
			updated: boolean,
			value: number,
			viewport: Viewport = Game.viewport,
			x: number,
			y: number;

		CalcBus.setCallbackCharacterPostion((characterPositionRaw: Float32Array) => {
			if (modeEdit === false) {
				const characterPosition: CharacterPosition = CharacterPositionDecode(characterPositionRaw);

				camera.r = characterPosition.r;
				camera.x = characterPosition.x;
				camera.y = characterPosition.y;
				camera.z = gamepadMap.cameraZoomIntial;
				cameraZoom = camera.z;

				// First: VideoMain
				VideoMainBus.outputCamera(CameraEncode(camera));

				// Second: VideoEditor
				VideoEditorBus.outputCharacterPosition(CharacterPositionEncode(characterPosition));

				viewport.applyZ(camera, report);
				cellSizePx = viewport.cellSizePx;
				viewport.apply(camera, false);
				VideoEditorBus.outputCameraAndViewport({
					camera: CameraEncode(camera),
					viewport: viewport.encode(),
				});
			}
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
						camera.x = cameraXOriginal + (cameraMoveX - cameraMoveXOriginal) * viewport.widthC;
						camera.y = cameraYOriginal + (cameraMoveY - cameraMoveYOriginal) * viewport.heightC;
					}
					viewport.apply(camera, false);

					VideoEditorBus.outputCameraAndViewport({
						camera: CameraEncode(camera),
						viewport: viewport.encode(),
					});
					VideoMainBus.outputCamera(CameraEncode(camera));
				} else {
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
							GamingCanvas.relativizeInputToCanvas(queueInput);
							processorMouse(queueInput);
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
					case 'KeyA':
						if (down) {
							characterControl.x = -1;
						} else if (characterControl.x === -1) {
							characterControl.x = 0;
						}
						break;
					case 'KeyD':
						if (down) {
							characterControl.x = 1;
						} else if (characterControl.x === 1) {
							characterControl.x = 0;
						}
						break;
					case 'KeyW':
						if (down) {
							characterControl.y = -1;
						} else if (characterControl.y === -1) {
							characterControl.y = 0;
						}
						break;
					case 'KeyS':
						if (down) {
							characterControl.y = 1;
						} else if (characterControl.y === 1) {
							characterControl.y = 0;
						}
						break;
				}

				updated = true;
			}
		};

		const processorMouse = (input: GamingCanvasInputMouse) => {
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
					// processorMouseCellHighlight(input.propriatary.position);

					if (modeEdit === true) {
						if (downMode === true) {
							cameraMoveX = 1 - position1.xRelative;
							cameraMoveY = 1 - position1.yRelative;
							updated = true;
						}
					} else {
						characterControl.r = (GamingCanvasScale(position1.xRelative, 0, 1, 360, 0) * Math.PI) / 180;
						updated = true;
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					// processorMouseCellHighlight(input.propriatary.position);

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
				elEditStyle.display = 'block';
				elEditStyle.height = cellSizePx + 'px';
				elEditStyle.left =
					(position.xRelative * viewport.widthC - ((position.xRelative * viewport.widthC + viewport.widthStartC) % 1)) * cellSizePx + 'px';
				elEditStyle.top =
					(position.yRelative * viewport.heightC - ((position.yRelative * viewport.heightC + viewport.heightStartC) % 1)) * cellSizePx + 'px';
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
