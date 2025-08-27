import { GamingCanvasReport } from '@tknight-dev/gaming-canvas';
import { CalcBusInputCmd, CalcBusInputDataSettings, CalcBusOutputCmd, CalcBusOutputDataStats, CalcBusOutputPayload } from './calc.model';

/**
 * @author tknight-dev
 */

export class CalcBus {
	private static callbackInitComplete: (status: boolean) => void;
	private static callbackStats: (data: CalcBusOutputDataStats) => void;
	private static worker: Worker;

	public static initialize(settings: CalcBusInputDataSettings, callback: (status: boolean) => void): void {
		CalcBus.callbackInitComplete = callback;

		// Spawn the WebWorker
		if (window.Worker) {
			CalcBus.worker = new Worker(new URL('./calc.engine.mjs', import.meta.url), {
				name: 'CalcEngine',
				type: 'module', // ESM
			});

			// Listen for a response from the WebWorker
			CalcBus.input();

			// Init the webworker
			CalcBus.worker.postMessage(
				{
					cmd: CalcBusInputCmd.INIT,
					data: Object.assign({}, settings),
				},
				[],
			);
		} else {
			alert('Web Workers are not supported by your browser');
			CalcBus.callbackInitComplete(false);
		}
	}

	private static input(): void {
		let payload: CalcBusOutputPayload, payloads: CalcBusOutputPayload[];

		CalcBus.worker.onmessage = async (event: MessageEvent) => {
			payloads = event.data;

			for (payload of payloads) {
				switch (payload.cmd) {
					case CalcBusOutputCmd.INIT_COMPLETE:
						CalcBus.callbackInitComplete(<boolean>payload.data);
						break;
					case CalcBusOutputCmd.STATS:
						CalcBus.callbackStats(<CalcBusOutputDataStats>payload.data);
						break;
				}
			}
		};
	}

	/*
	 * Output
	 */

	// Non-fixed resolution canvas has changed in size
	public static outputReport(report: GamingCanvasReport): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.REPORT,
			data: report,
		});
	}

	// User changed their settings
	public static outputSettings(settings: CalcBusInputDataSettings): void {
		CalcBus.worker.postMessage({
			cmd: CalcBusInputCmd.SETTINGS,
			data: settings,
		});
	}

	public static setCallbackStats(callbackStats: (data: CalcBusOutputDataStats) => void): void {
		CalcBus.callbackStats = callbackStats;
	}
}
