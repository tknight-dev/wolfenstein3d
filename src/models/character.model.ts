/**
 * @author tknight-dev
 */

export interface Character extends CharacterPosition {
	health: number;
}

export class CharacterControl {
	rDeg: number; // 0 - 360 deg
	rRad: number; // 0 - 6.28318530 rads
	x: number; // -1 to 1
	y: number; // -1 to 1
}

export const CharacterControlEncode = (characterControl: CharacterControl): Float32Array => {
	return Float32Array.from([characterControl.rDeg, characterControl.rRad, characterControl.x, characterControl.y]);
};

export const CharacterControlDecode = (characterControl: Float32Array): CharacterControl => {
	return {
		rDeg: characterControl[0],
		rRad: characterControl[1],
		x: characterControl[2],
		y: characterControl[3],
	};
};

export interface CharacterPosition {
	rDeg: number; // 0 - 360 deg
	rRad: number; // 0 - 6.28318530 rads
	x: number; // int
	y: number; // int
}

export const CharacterPositionEncode = (characterPosition: CharacterPosition): Float32Array => {
	return Float32Array.from([characterPosition.rDeg, characterPosition.rRad, characterPosition.x, characterPosition.y]);
};

export const CharacterPositionDecode = (characterPosition: Float32Array): CharacterPosition => {
	return {
		rDeg: characterPosition[0],
		rRad: characterPosition[1],
		x: characterPosition[2],
		y: characterPosition[3],
	};
};

export const CharacterSizeInC: number = 0.5;
