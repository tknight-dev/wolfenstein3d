import { DOM } from './dom';
import { CalcBusInputDataSettings } from '../workers/calc/calc.model';
import { Camera, CameraEncode } from '../models/camera.model';
import { GameMap } from '../models/game.model';
import { Resolution } from '../models/settings.model';
import { Viewport } from '../models/viewport.model';
import { VideoEditorBus } from '../workers/video-editor/video-editor.bus';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model';
import {
	GamingCanvas,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputMouse,
	GamingCanvasInputMouseAction,
	GamingCanvasInputPosition,
	GamingCanvasInputType,
} from '@tknight-dev/gaming-canvas';

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
	public static settingDebug: boolean;
	public static settingDPISupport: boolean;
	public static settingFPSDisplay: boolean;
	public static settingResolution: Resolution;
	public static settingsCalc: CalcBusInputDataSettings;
	public static settingsVideoEditor: VideoEditorBusInputDataSettings;
	public static settingsVideoMain: VideoMainBusInputDataSettings;
	public static viewport: Viewport;

	static {
		const gameDataWidth: number = 64;

		// Camera and Viewport
		Game.camera = {
			r: 90, // North
			x: (gameDataWidth / 2) | 0,
			xRelative: ((gameDataWidth / 2) | 0) / gameDataWidth,
			y: (gameDataWidth / 2) | 0,
			yRelative: ((gameDataWidth / 2) | 0) / gameDataWidth,
			z: 1,
		};
		Game.viewport = new Viewport(10, gameDataWidth, gameDataWidth);

		// Game Map
		Game.dataMaps.set(0, {
			data: new Uint8Array(gameDataWidth * gameDataWidth),
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
		Game.processorBinder();
		Game.inputRequest = requestAnimationFrame(Game.processor);
	}

	private static processor(_: number): void {}

	private static processorBinder(): void {
		let audioClickVolume: number = 0.25,
			buffer: Set<number> = new Set(),
			camera: Camera = Game.camera,
			cameraRelX: number = 0,
			cameraRelXOriginal: number = 0,
			cameraRelY: number = 0,
			cameraRelYOriginal: number = 0,
			cameraUpdated: boolean,
			cameraViewportHeightC: number = 0,
			cameraViewportStartXC: number = 0,
			cameraViewportStartYC: number = 0,
			cameraViewportWidthC: number = 0,
			cameraZoom: number = 0,
			cameraZoomMax: number = 100,
			cameraZoomMin: number = 1,
			cameraZoomPrevious: number = cameraZoomMin,
			cameraZoomStep: number = 5,
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
			touchAdded: boolean,
			touchDistance: number,
			touchDistancePrevious: number = -1,
			value: number,
			viewport: Viewport = Game.viewport,
			x: number,
			y: number;

		// Limit how often a camera update can be sent via the bus
		setInterval(() => {
			if (cameraUpdated) {
				cameraUpdated = false;

				camera.xRelative += cameraRelX;
				camera.x = camera.xRelative * viewport.widthPx;
				camera.yRelative += cameraRelY;
				camera.y = camera.yRelative * viewport.heightPx;
				camera.z = cameraZoom;

				console.log('request', camera.x, camera.y);

				viewport.apply(camera, false, GamingCanvas.getReport());

				console.log('  >> final', camera.x, camera.y);

				VideoEditorBus.outputCameraAndViewport({
					camera: CameraEncode(camera),
					viewport: viewport.encode(),
				});
			}
		}, inputLimitPerMs);

		const processor = (timestampNow: number) => {
			Game.inputRequest = requestAnimationFrame(processor);

			if (timestampNow - queueTimestamp > inputLimitPerMs) {
				queueTimestamp = timestampNow;

				// Update temporary values

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
						// case GamingCanvasInputType.TOUCH:
						// 	GamingCanvas.relativizeInputToCanvas(queueInput);
						// 	processorTouch(queueInput);
						// 	break;
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
			}

			switch (input.propriatary.action) {
				case GamingCanvasInputMouseAction.LEFT:
					cameraRelXOriginal = position1.xRelative;
					cameraRelYOriginal = position1.yRelative;

					if (down) {
						cameraRelXOriginal = position1.xRelative;
						cameraRelYOriginal = position1.yRelative;
						downMode = true;
					} else {
						downMode = false;
						cameraRelXOriginal = 0;
						cameraRelYOriginal = 0;
					}
					break;
				case GamingCanvasInputMouseAction.MOVE:
					if (downMode && !position1.out && cameraRelX !== position1.xRelative && cameraRelY !== position1.yRelative) {
						cameraRelX = 1 - (position1.xRelative - cameraRelXOriginal);
						cameraRelY = 1 - (position1.yRelative - cameraRelYOriginal);
						cameraUpdated = true;
					}
					break;
				case GamingCanvasInputMouseAction.SCROLL:
					cameraZoomPrevious = cameraZoom;
					cameraZoom = Math.max(cameraZoomMin, Math.min(cameraZoomMax, cameraZoom + (down ? -cameraZoomStep : cameraZoomStep)));
					downMode = false;
					if (cameraZoom !== cameraZoomPrevious) {
						cameraUpdated = true;
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
			DOM.elButtonEdit.classList.remove('active');
			DOM.elButtonPlay.classList.add('active');
			DOM.elCanvases[1].classList.add('hide');
		}
	}
}
