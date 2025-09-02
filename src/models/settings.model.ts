/**
 * @author tknight-dev
 */

export enum FPS {
	_30 = 30,
	_40 = 40,
	_60 = 60,
	_120 = 120,
	_144 = 144,
}

export enum RaycastQuality {
	FULL = 1, // ray = 1px
	HALF = 2, // ray = 2px
	THIRD = 3, // ray = 3px
}

export type Resolution = null | 160 | 320 | 640 | 1280 | 1920 | 2560;
