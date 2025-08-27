import { DOM } from './dom';
import { CalcBusInputDataSettings } from '../workers/calc/calc.model';
import { Resolution } from '../model';
import { VideoEditorBusInputDataSettings } from '../workers/video-editor/video-editor.model';
import { VideoMainBusInputDataSettings } from '../workers/video-main/video-main.model';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

export class Input extends DOM {
	protected static settingDebug: boolean;
	protected static settingFPSDisplay: boolean;
	protected static settingResolution: Resolution;
	protected static settingsCalc: CalcBusInputDataSettings;
	protected static settingsVideoEditor: VideoEditorBusInputDataSettings;
	protected static settingsVideoMain: VideoMainBusInputDataSettings;
}
