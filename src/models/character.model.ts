/**
 * @author tknight-dev
 */

export interface Character extends CharacterPosition {
	health: number;
}

export class CharacterControl {
	r: number; // 0 - 6.28318530 rads
	x: number; // -1 to 1
	y: number; // -1 to 1
}

export const CharacterControlEncode = (characterControl: CharacterControl): Float32Array => {
	return Float32Array.from([characterControl.r, characterControl.x, characterControl.y]);
};

export const CharacterControlDecode = (characterControl: Float32Array): CharacterControl => {
	return {
		r: characterControl[0],
		x: characterControl[1],
		y: characterControl[2],
	};
};

export interface CharacterPosition {
	dataIndex: number; // int
	r: number; // 0 - 6.28318530 rads
	x: number; // float
	y: number; // float
}

export const CharacterPositionEncode = (characterPosition: CharacterPosition): Float32Array => {
	return Float32Array.from([characterPosition.dataIndex, characterPosition.r, characterPosition.x, characterPosition.y]);
};

export const CharacterPositionDecode = (characterPosition: Float32Array): CharacterPosition => {
	return {
		dataIndex: characterPosition[0] | 0,
		r: characterPosition[1],
		x: characterPosition[2],
		y: characterPosition[3],
	};
};

export const CharacterSizeInC: number = 0.5;
