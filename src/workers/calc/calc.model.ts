/**
 * @author tknight-dev
 */

/*
 * Input
 */
export enum CalcBusInputCmd {
	INIT,
	REPORT,
	SETTINGS,
}

export interface CalcBusInputDataInit extends CalcBusInputDataSettings {}

export interface CalcBusInputDataSettings {
	fps: number;
}

export interface CalcBusInputPayload {
	cmd: CalcBusInputCmd;
	data: CalcBusInputDataInit | CalcBusInputDataSettings;
}

/*
 * Output
 */
export enum CalcBusOutputCmd {
	INIT_COMPLETE,
	STATS,
}

export interface CalcBusOutputDataStats {}

export interface CalcBusOutputPayload {
	cmd: CalcBusOutputCmd;
	data: boolean | CalcBusOutputDataStats;
}
