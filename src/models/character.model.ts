import {
	GamingCanvasGridCharacter,
	GamingCanvasGridCharacterInput,
	GamingCanvasGridCharacterNPC,
	GamingCanvasGridICamera,
} from '@tknight-dev/gaming-canvas/grid';
import { GameDifficulty } from './game.model.js';
import { AssetIdImgCharacter, AssetIdImgCharacterType } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export interface Character extends GamingCanvasGridCharacter {
	ammo: number; // int16
	health: number;
	lives: number; // int16
	player1: boolean;
	score: number; // int16
	timestampUnixState: number;
	type: AssetIdImgCharacterType;
	weapon: CharacterWeapon;
	weapons: CharacterWeapon[];
}

export const CharacterMetaDecode = (data: Uint16Array, character?: Character): Character => {
	if (character === undefined) {
		character = <any>{};
	}

	(<Character>character).ammo = data[0];
	(<Character>character).health = data[1];
	(<Character>character).lives = data[2];
	(<Character>character).score = data[3];
	(<Character>character).timestampUnixState = data[4];
	(<Character>character).type = data[5];
	(<Character>character).weapon = data[6];

	(<Character>character).weapons = [];
	for (let i = 7; i < data.length; i++) {
		(<Character>character).weapons.push(data[i]);
	}

	return <Character>character;
};

export const CharacterMetaEncode = (character: Character): Uint16Array => {
	return Uint16Array.from([
		character.ammo,
		character.health,
		character.lives,
		character.score,
		character.timestampUnixState,
		character.type,
		character.weapon,
		...character.weapons,
	]);
};

export interface CharacterNPC extends GamingCanvasGridCharacterNPC {
	assetId: AssetIdImgCharacter;
	difficulty: GameDifficulty;
	health: number;
	id: number;
	moving?: boolean;
	movingRunning?: boolean;
	timestampUnixState: number;
	type: AssetIdImgCharacterType;
}

export interface CharacterNPCUpdate {
	assetId: AssetIdImgCharacter;
	camera: GamingCanvasGridICamera;
	gridIndex: number;
	id: number;
	running?: boolean;
	timestampUnixState: number;
}

export interface CharacterInput extends GamingCanvasGridCharacterInput {
	action: boolean;
	fire: boolean;
}

export enum CharacterWeapon {
	KNIFE = 0,
	PISTOL = 1,
	SUB_MACHINE_GUN = 2,
}
