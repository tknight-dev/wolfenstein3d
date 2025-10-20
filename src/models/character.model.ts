import { GamingCanvasGridCharacter, GamingCanvasGridCharacterInput, GamingCanvasGridICamera } from '@tknight-dev/gaming-canvas/grid';
import { GameDifficulty } from './game.model.js';
import { AssetIdImgCharacter, AssetIdImgCharacterType } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export interface Character extends GamingCanvasGridCharacter {
	ammo: number; // int16
	health: number;
	key1: boolean;
	key2: boolean;
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
	(<Character>character).key1 = data[2] !== 0;
	(<Character>character).key2 = data[3] !== 0;
	(<Character>character).lives = data[4];
	(<Character>character).score = data[5];
	(<Character>character).type = data[6];
	(<Character>character).weapon = data[7];

	(<Character>character).weapons = [];
	for (let i = 8; i < data.length; i++) {
		(<Character>character).weapons.push(data[i]);
	}

	return <Character>character;
};

export const CharacterMetaEncode = (character: Character): Uint16Array => {
	return Uint16Array.from([
		character.ammo,
		character.health,
		character.key1 === true ? 1 : 0,
		character.key2 === true ? 1 : 0,
		character.lives,
		character.score,
		character.type,
		character.weapon,
		...character.weapons,
	]);
};

export interface CharacterNPC extends GamingCanvasGridCharacter {
	assetId: AssetIdImgCharacter;
	difficulty: GameDifficulty;
	fireCount?: number;
	health: number;
	id: number;
	running?: boolean;
	timestampUnixState: number;
	type: AssetIdImgCharacterType;
	walking?: boolean;
}

export enum CharacterNPCState {
	AIM,
	CORPSE,
	HIT,
	RUNNING,
	RUNNING_DOOR,
	FIRE,
	STANDING,
	SURPRISE,
	WALKING,
	WALKING_DOOR,
}

export interface CharacterNPCUpdate {
	assetId: AssetIdImgCharacter;
	camera: GamingCanvasGridICamera;
	gridIndex: number;
	id: number;
	running?: boolean;
	timestampUnixState: number;
	walking?: boolean;
}

export const CharacterNPCUpdateDecodeAndApply = (data: Float32Array, character: CharacterNPC, timestampUnix: number = Date.now()): void => {
	character.assetId = data[0] | 0;
	character.camera.r = data[1];
	character.camera.x = data[2];
	character.camera.y = data[3];
	character.camera.z = data[4];
	character.gridIndex = data[5] | 0;
	character.id = data[6] | 0;
	character.running = data[7] === 1;
	character.timestampUnixState = (timestampUnix & ~0xffffff) | data[8];
	character.walking = data[9] === 1;
};

export const CharacterNPCUpdateDecodeId = (data: Float32Array): number => {
	return data[6] | 0;
};

export const CharacterNPCUpdateEncode = (update: CharacterNPCUpdate): Float32Array => {
	return Float32Array.from([
		update.assetId,
		update.camera.r,
		update.camera.x,
		update.camera.y,
		update.camera.z,
		update.gridIndex,
		update.id,
		update.running === true ? 1 : 0,
		update.timestampUnixState & 0xffffff,
		update.walking === true ? 1 : 0,
	]);
};

export interface CharacterInput extends GamingCanvasGridCharacterInput {
	action: boolean;
	fire: boolean;
}

export enum CharacterWeapon {
	KNIFE = 0,
	MACHINE_GUN = 3,
	PISTOL = 1,
	SUB_MACHINE_GUN = 2,
}
