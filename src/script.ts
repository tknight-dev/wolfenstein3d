import { DOM } from './modules/dom';
import { CalcBus } from './workers/calc/calc.bus';
import { CalcBusInputDataSettings } from './workers/calc/calc.model';
import { GamingCanvas, GamingCanvasResolutionScaleType } from '@tknight-dev/gaming-canvas';
import { VideoEditorBus } from './workers/video-editor/video-editor.bus';
import { VideoEditorBusInputDataSettings } from './workers/video-editor/video-editor.model';
import { VideoMainBus } from './workers/video-main/video-main.bus';
import { VideoMainBusInputDataSettings } from './workers/video-main/video-main.model';
import packageJSON from '../package.json';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

class Blockenstein extends DOM {
	private static settingsCalc: CalcBusInputDataSettings;
	private static settingsVideoEditor: VideoEditorBusInputDataSettings;
	private static settingsVideoMain: VideoMainBusInputDataSettings;

	private static initializeGamingCanvas(): void {
		DOM.elCanvases = GamingCanvas.initialize(DOM.elVideo, {
			aspectRatio: 16 / 9,
			canvasCount: 2,
			resolutionWidthPx: 640,
			resolutionScaleType: GamingCanvasResolutionScaleType.PIXELATED,
		});
	}

	private static initializeWorkers(): Promise<void> {
		let then: number = performance.now();

		return new Promise<void>((resolve: any) => {
			CalcBus.initialize(Blockenstein.settingsCalc, () => {
				// Done
				console.log('CalcEngine Loaded in', performance.now() - then, 'ms');

				// Load video-editor
				then = performance.now();
				VideoEditorBus.initialize(GamingCanvas.getCanvases()[1], Blockenstein.settingsVideoEditor, () => {
					// Done
					console.log('VideoEditorEngine Loaded in', performance.now() - then, 'ms');

					// Load video-main
					then = performance.now();
					VideoMainBus.initialize(GamingCanvas.getCanvases()[0], Blockenstein.settingsVideoMain, () => {
						// Done
						console.log('VideoMainEngine Loaded in', performance.now() - then, 'ms');

						// Resolve initial promise
						resolve();
					});
				});
			});
		});
	}

	public static async main(): Promise<void> {
		const then: number = performance.now();

		/**
		 * DOM
		 */
		DOM.initializeDom();
		DOM.elVersion.innerText = packageJSON.version;

		/**
		 * GamingCanvas
		 */
		Blockenstein.initializeGamingCanvas();

		/**
		 * WebWorkers
		 */
		await Blockenstein.initializeWorkers();

		// Done
		console.log('System Loaded in', performance.now() - then, 'ms');
	}
}
Blockenstein.main();
