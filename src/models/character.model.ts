/**
 * @author tknight-dev
 */

export class Character {
	health: number;
	rDeg: number; // 0 - 360 deg
	rRad: number; // 0 - 360 deg
	x: number; // int
	y: number; // int
}

export class CharacterControl {
	rDeg: number; // 0 - 360 deg
	rRad: number; // 0 - 360 deg
	x: boolean;
	y: boolean;
}

export const CharacterControlEncode = (characterControl: CharacterControl): Float32Array => {
	return Float32Array.from([characterControl.rDeg, characterControl.rRad, characterControl.x, characterControl.y]);
};

export const CharacterControlDecode = (characterControl: Float32Array): CharacterControl => {
	return {
		rDeg: characterControl[0],
		rRad: characterControl[1],
		x: (characterControl[1] | 0) !== 0,
		y: (characterControl[2] | 0) !== 0,
	};
};

export const CharacterSizeInC: number = 0.5;
