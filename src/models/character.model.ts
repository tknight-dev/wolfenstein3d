import { GamingCanvasGridCharacter, GamingCanvasGridCharacterInput } from '@tknight-dev/gaming-canvas/grid';
import { GameDifficulty } from './game.model.js';
import { AssetIdImgCharacter, AssetIdImgCharacterType } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export interface Character extends CharacterNPC {
	ammo: number; // int16
	lives: number; // int16
	player1: boolean;
	score: number; // int16
	weapon: CharacterWeapon;
	weapons: CharacterWeapon[];
}

export const CharacterMetaDecode = (data: Uint16Array, character?: Character): Character => {
	if (character === undefined) {
		character = <any>{};
	}

	(<Character>character).ammo = data[0];
	(<Character>character).health = data[1];
	(<Character>character).id = data[2];
	(<Character>character).lives = data[3];
	(<Character>character).score = data[4];
	(<Character>character).weapon = data[5];

	(<Character>character).weapons = [];
	for (let i = 6; i < data.length; i++) {
		(<Character>character).weapons.push(data[i]);
	}

	return <Character>character;
};

export const CharacterMetaEncode = (character: Character): Uint16Array => {
	return Uint16Array.from([character.ammo, character.health, character.id, character.lives, character.score, character.weapon, ...character.weapons]);
};

export interface CharacterNPC extends GamingCanvasGridCharacter {
	assetId: AssetIdImgCharacter;
	difficulty: GameDifficulty; // int16
	health: number; // int16
	id: number; // int16
	type: AssetIdImgCharacterType;
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
