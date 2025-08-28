import { Camera } from './camera.model';
import { GamingCanvasReport, GamingCanvasScale } from '@tknight-dev/gaming-canvas';

/**
 * @author tknight-dev
 */

export class Viewport {
	public cameraZScaleMax: number; // float
	public cellsHeight: number; // int
	public cellsWidth: number; // int
	public cellSizePx: number; // float
	public heightC: number; // float
	public heightPx: number; // int
	public heightStartC: number; // float
	public heightStartPx: number; // float
	public heightStopC: number; // float
	public heightStopPx: number; // float
	public increment: number = 0; // int
	public widthC: number; // float
	public widthPx: number; // int
	public widthStartC: number; // float
	public widthStartPx: number; // float
	public widthStopC: number; // float
	public widthStopPx: number; // float

	public constructor(cameraZScaleMax: number = 0, cellsHeight: number = 0, cellsWidth: number = 0) {
		this.cameraZScaleMax = cameraZScaleMax;
		this.cellsHeight = cellsHeight;
		this.cellsWidth = cellsWidth;
	}

	/**
	 * @param cameraFitToView if true, modifies the camera object as required to fit within the viewport
	 */
	public apply(camera: Camera, cameraFitToView: boolean, report: GamingCanvasReport): void {
		this.cellSizePx = Math.max(1, (report.canvasWidth / this.cellsWidth) * GamingCanvasScale(camera.z, 1, 100, 1, this.cameraZScaleMax));
		this.increment++;

		this.heightC = report.canvasHeight / this.cellSizePx;
		this.heightPx = report.canvasHeight;
		this.widthC = report.canvasWidth / this.cellSizePx;
		this.widthPx = report.canvasWidth;

		// Height + position bounded
		this.heightStartPx = Math.round((camera.y - this.heightPx / 2) * 1000) / 1000;
		if (cameraFitToView === true) {
			if (this.heightStartPx < 0) {
				camera.y = this.heightPx / 2;
				camera.yRelative = 0.5;

				this.heightStartC = 0;
				this.heightStartPx = 0;

				this.heightStopC = this.heightC;
				this.heightStopPx = this.heightPx;
			} else if (this.heightStartPx + this.heightPx > this.cellsHeight) {
				camera.y = this.cellsHeight / this.cellSizePx - this.heightPx / 2;
				camera.yRelative = camera.y / this.heightPx;

				this.heightStopC = this.cellsHeight;
				this.heightStopPx = this.heightStopC * this.cellSizePx;

				this.heightStartC = this.heightStopC - this.heightC;
				this.heightStartPx = this.heightStartC * this.cellSizePx;
			} else {
				this.heightStartC = this.heightStopC - this.heightC;

				this.heightStopC = this.heightStartC + this.heightC;
				this.heightStopPx = this.heightStopC * this.cellSizePx;
			}
		} else {
			this.heightStartC = this.heightStopC - this.heightC;

			this.heightStopC = this.heightStartC + this.heightC;
			this.heightStopPx = this.heightStopC * this.cellSizePx;
		}

		// Width + position bounded
		this.widthStartPx = Math.round((camera.x - this.widthPx / 2) * 1000) / 1000;
		if (cameraFitToView === true) {
			if (this.widthStartPx < 0) {
				camera.x = this.widthPx / 2;
				camera.xRelative = 0.5;

				this.widthStartC = 0;
				this.widthStartPx = 0;

				this.widthStopC = this.widthC;
				this.widthStopPx = this.widthPx;
			} else if (this.widthStartPx + this.widthPx > this.cellsWidth) {
				camera.x = this.cellsWidth / this.cellSizePx - this.widthPx / 2;
				camera.xRelative = camera.x / this.widthPx;

				this.widthStopC = this.cellsWidth;
				this.widthStopPx = this.widthStopC * this.cellSizePx;

				this.widthStartC = this.widthStopC - this.widthC;
				this.widthStartPx = this.widthStartC * this.cellSizePx;
			} else {
				this.widthStartC = this.widthStopC - this.widthC;

				this.widthStopC = this.widthStartC + this.widthC;
				this.widthStopPx = this.widthStopC * this.cellSizePx;
			}
		} else {
			this.widthStartC = this.widthStopC - this.widthC;

			this.widthStopC = this.widthStartC + this.widthC;
			this.widthStopPx = this.widthStopC * this.cellSizePx;
		}
	}

	public decode(data: Float32Array): void {
		this.cameraZScaleMax = data[0];
		this.cellsHeight = data[1] | 0;
		this.cellsWidth = data[2] | 0;
		this.cellSizePx = data[3];
		this.heightC = data[4];
		this.heightPx = data[5] | 0;
		this.heightStartC = data[6];
		this.heightStartPx = data[7];
		this.heightStopC = data[8];
		this.heightStopPx = data[9];
		this.increment = data[10] | 0;
		this.widthC = data[11];
		this.widthPx = data[12];
		this.widthStartC = data[13];
		this.widthStartPx = data[14];
		this.widthStopC = data[15];
		this.widthStopPx = data[16];
	}

	public encode(): Float32Array {
		return Float32Array.from([
			this.cameraZScaleMax,
			this.cellsHeight,
			this.cellsWidth,
			this.cellSizePx,
			this.heightC,
			this.heightPx,
			this.heightStartC,
			this.heightStartPx,
			this.heightStopC,
			this.heightStopPx,
			this.increment,
			this.widthC,
			this.widthPx,
			this.widthStartC,
			this.widthStartPx,
			this.widthStopC,
			this.widthStopPx,
		]);
	}
}
