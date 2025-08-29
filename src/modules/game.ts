import { DOM } from './dom';
import { CalcBusInputDataSettings } from '../workers/calc/calc.model';
import { CalcBus } from '../workers/calc/calc.bus';
import { Camera, CameraDecode, CameraEncode } from '../models/camera.model';
import { CharacterControl, CharacterControlEncode } from '../models/character.model';
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
		const gameDataWidth: number = 64,
			cameraCenter: number = gameDataWidth / 2;

		// Camera and Viewport
		Game.camera = {
			rDeg: 90, // North
			rRad: (90 * Math.PI) / 180, // North
			x: gameDataWidth / 2 + 0.5,
			xRelative: 0.5,
			y: gameDataWidth / 2 + 0.5,
			yRelative: 0.5,
			z: 80, // Def 10
		};
		Game.viewport = new Viewport(5, gameDataWidth, gameDataWidth);

		// Game Map
		const map: Uint8Array = new Uint8Array(gameDataWidth * gameDataWidth),
			mapCenter: number = (gameDataWidth ** 2 / 2 + gameDataWidth / 2) | 0;
		// map[0] = 0xff; // top-left
		// map[(gameDataWidth ** 2 / 2 + gameDataWidth / 2) | 0] = 0xff; // center
		// map[gameDataWidth ** 2 - gameDataWidth] = 0xff; // top-right
		// map[gameDataWidth ** 2 - 1] = 0xff; // bottom-right
		// gameData[gameDataWidth - 1] = 0xff; // bottom-left

		for (let x = mapCenter - gameDataWidth * 5; x <= mapCenter + gameDataWidth * 5; x += gameDataWidth) {
			for (let y = -5; y <= 5; y++) {
				map[x + y] = 0xff;
			}
		}

		Game.dataMaps.set(0, {
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
			cameraUpdated: boolean,
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
				rDeg: Game.camera.rDeg, // initial value
				rRad: Game.camera.rRad, // initial value
				x: false,
				y: false,
			},
			down: boolean,
			downMode: boolean,
			// elementEditStyle: CSSStyleDeclaration = DOM.elementEdit.style,
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
			pxCellSize: number,
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
			queueInput: GamingCanvasInput | undefined,
			queueInputOverlay: GamingCanvasInput,
			queueTimestamp: number = -2025,
			report: GamingCanvasReport,
			touchAdded: boolean,
			touchDistance: number,
			touchDistancePrevious: number = -1,
			value: number,
			viewport: Viewport = Game.viewport,
			x: number,
			y: number;

		CalcBus.setCallbackCamera((cameraRaw: Float32Array) => {
			let cameraParsed: Camera = CameraDecode(cameraRaw);
			camera.rDeg = cameraParsed.rDeg; // TEMPORARY
			camera.rRad = cameraParsed.rRad; // TEMPORARY
			viewport.apply(camera, false);

			VideoEditorBus.outputCameraAndViewport({
				camera: CameraEncode(camera),
				viewport: viewport.encode(),
			});
			VideoMainBus.outputCamera(CameraEncode(camera));
		});

		// Limit how often a camera update can be sent via the bus
		setInterval(() => {
			if (cameraUpdated || Game.reportNew) {
				report = Game.report;

				if (modeEdit) {
					// Zoom
					if (camera.z !== cameraZoom) {
						camera.z = cameraZoom;
						viewport.applyZ(camera, report);
					} else if (cameraUpdated === true) {
						camera.x = cameraXOriginal + (cameraMoveX - cameraMoveXOriginal) * viewport.widthC;
						camera.xRelative = camera.x / viewport.cellsWidth;
						camera.y = cameraYOriginal + (cameraMoveY - cameraMoveYOriginal) * viewport.heightC;
						camera.yRelative = camera.y / viewport.cellsHeight;
					}
					viewport.apply(camera, false);

					VideoEditorBus.outputCameraAndViewport({
						camera: CameraEncode(camera),
						viewport: viewport.encode(),
					});
				} else {
					CalcBus.outputCharacterControl(CharacterControlEncode(characterControl));
				}

				cameraUpdated = false;
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
						// case GamingCanvasInputType.KEYBOARD:
						// 	processorKeyboard(queueInput);
						// 	break;
						case GamingCanvasInputType.MOUSE:
							queueInputOverlay = JSON.parse(JSON.stringify(queueInput));
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

		const processorMouse = (input: GamingCanvasInputMouse, inputOverlay: GamingCanvasInputMouse) => {
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
					if (modeEdit) {
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
					if (modeEdit) {
						if (downMode === true) {
							cameraMoveX = 1 - position1.xRelative;
							cameraMoveY = 1 - position1.yRelative;
							cameraUpdated = true;
						}
					} else {
						characterControl.rDeg = GamingCanvasScale(position1.xRelative, 0, 1, 360, 0);
						characterControl.rRad = (characterControl.rDeg * Math.PI) / 180;
						cameraUpdated = true;
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					if (modeEdit) {
						cameraZoomPrevious = cameraZoom;
						cameraZoom = Math.max(cameraZoomMin, Math.min(cameraZoomMax, cameraZoom + (down ? -cameraZoomStep : cameraZoomStep)));
						if (cameraZoom !== cameraZoomPrevious) {
							cameraUpdated = true;
						}
					}
					break;
			}
		};

		const processorTouch = (input: GamingCanvasInputTouch) => {
			// elementEditStyle.display = 'none';
			positions = input.propriatary.positions;
			if (input.propriatary.down !== undefined) {
				down = input.propriatary.down;
			}

			switch (input.propriatary.action) {
				case GamingCanvasInputTouchAction.ACTIVE:
					if (modeEdit) {
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
					if (modeEdit) {
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
												cameraUpdated = true;
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
								cameraUpdated = true;
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
