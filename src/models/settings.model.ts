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

export enum LightingQuality {
	BASIC = 1,
	NONE = 2,
	FULL = 0,
}

export enum InputDevice {
	GAMEPAD = 0,
	KEYBOARD = 1,
}

export enum RaycastQuality {
	FULL = 0, // ray = 1px
	HALF = 1, // ray = 2px
	THIRD = 2, // ray = 3px
}

export type Resolution = null | 160 | 320 | 640 | 1280 | 1920 | 2560;
