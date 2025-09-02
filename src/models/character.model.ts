import { GamingCanvasGridICamera } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

export interface Character extends CharacterPosition {
	health: number;
	id: number;
}

export class CharacterControl {
	r: number; // -1 to 1
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

export interface CharacterPosition extends GamingCanvasGridICamera {
	dataIndex: number; // int
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
		z: 1,
	};
};

export const CharacterSizeInC: number = 0.5;
