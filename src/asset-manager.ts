import * as JSZip from 'jszip';
import { GameMap } from './models/game.model.js';
import { GamingCanvasGridUint16Array, GamingCanvasGridUint32Array } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

/*
 * LOADERS
 */

/**
 * @return is dataURL
 */
export const assetLoaderAudio = async (): Promise<Map<AssetIdAudio, string>> => {
	let assetId: AssetIdAudio,
		data: Map<AssetIdAudio, string> = new Map(),
		dataType: string,
		filename: string,
		properties: AssetPropertiesAudio | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderAudio: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetIdAudio } = {};
	for ([assetId, properties] of assetsAudio) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			// console.log('UNKNOWN ASSET ID', filename);
			continue;
		}

		properties = assetsAudio.get(assetId);

		// Filter
		if (properties === undefined) {
			continue;
		}

		switch (properties.ext) {
			case AssetExtAudio.MP3:
				dataType = 'audio/mp3';
				break;
			default:
				console.error(`assetLoaderAudio: unsupported file type ${properties.ext} for file ${properties.file}`);
				continue;
		}

		// Convert to dataURL
		data.set(
			assetId,
			`data:${dataType};base64,` +
				btoa(
					new Uint8Array(await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')).reduce(
						(acc, i) => (acc += String.fromCharCode.apply(null, [i])),
						'',
					),
				),
		);
	}

	return data;
};

/**
 * @return is dataURL or BitMap
 */
export const assetLoaderImage = async (toDataURL?: boolean): Promise<Map<AssetIdImg, ImageBitmap | string>> => {
	let assetId: AssetIdImg,
		blob: Blob,
		data: Map<AssetIdImg, ImageBitmap | string> = new Map(),
		dataType: string | undefined,
		filename: string,
		properties: AssetPropertiesImage | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderImage: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetIdImg } = {};
	for ([assetId, properties] of assetsImages) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			continue;
		}

		properties = assetsImages.get(assetId);

		// Filter
		if (properties === undefined) {
			continue;
		}

		switch (properties.ext) {
			case AssetExtImg.PNG:
				dataType = 'image/png';
				break;
			default:
				console.error(`assetLoaderImage: unsupported file type ${properties.ext} for file ${properties.file}`);
				continue;
		}

		if (toDataURL === true) {
			data.set(
				assetId,
				`data:${dataType};base64,` +
					btoa(
						new Uint8Array(await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')).reduce(
							(acc, i) => (acc += String.fromCharCode.apply(null, [i])),
							'',
						),
					),
			);
		} else {
			// Convert to blob
			blob = new Blob([await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')], { type: dataType });

			// Convert to bitmap
			data.set(assetId, await createImageBitmap(blob));
		}
	}

	return data;
};

/**
 * @return is dataURL or BitMap
 */
export const assetLoaderImageCharacter = async (toDataURL?: boolean): Promise<Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, ImageBitmap | string>>> => {
	let blob: Blob,
		character: AssetIdImgCharacter,
		characterType: AssetIdImgCharacterType,
		characterInstance: Map<AssetIdImgCharacter, AssetPropertiesImage>,
		data: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, ImageBitmap | string>> = new Map(),
		dataInstance: Map<AssetIdImgCharacter, ImageBitmap | string>,
		dataType: string | undefined,
		filename: string,
		properties: AssetPropertiesImage | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderCharacter: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: number[] } = {};
	for ([characterType, characterInstance] of assetsImageCharacters) {
		for ([character, properties] of characterInstance) {
			assetsByFile[properties.file] = [characterType, character];
		}
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		if (assetsByFile[filename] === undefined) {
			continue;
		}
		characterType = assetsByFile[filename][0];
		character = assetsByFile[filename][1];

		properties = (<any>assetsImageCharacters.get(characterType)).get(character);

		// Filter
		if (properties === undefined) {
			continue;
		}

		dataInstance = <any>data.get(characterType);
		if (dataInstance === undefined) {
			dataInstance = new Map();
			data.set(characterType, dataInstance);
		}

		switch (properties.ext) {
			case AssetExtImg.PNG:
				dataType = 'image/png';
				break;
			default:
				console.error(`assetLoaderCharacter: unsupported file type ${properties.ext} for file ${properties.file}`);
				continue;
		}

		if (toDataURL === true) {
			dataInstance.set(
				character,
				`data:${dataType};base64,` +
					btoa(
						new Uint8Array(await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')).reduce(
							(acc, i) => (acc += String.fromCharCode.apply(null, [i])),
							'',
						),
					),
			);
		} else {
			// Convert to blob
			blob = new Blob([await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')], { type: dataType });

			// Convert to bitmap
			dataInstance.set(character, await createImageBitmap(blob));
		}
	}

	return data;
};

/**
 * @return is dataURL
 */
export const assetLoaderImageMenu = async (): Promise<Map<AssetIdImgMenu, string>> => {
	let assetId: AssetIdImgMenu,
		data: Map<AssetIdImgMenu, string> = new Map(),
		dataType: string | undefined,
		filename: string,
		properties: AssetPropertiesImage | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderImageMenu: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetIdImgMenu } = {};
	for ([assetId, properties] of assetsImageMenus) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			continue;
		}

		properties = assetsImageMenus.get(assetId);

		// Filter
		if (properties === undefined) {
			continue;
		}

		switch (properties.ext) {
			case AssetExtImg.PNG:
				dataType = 'image/png';
				break;
			default:
				console.error(`assetLoaderImageMenu: unsupported file type ${properties.ext} for file ${properties.file}`);
				continue;
		}

		data.set(
			assetId,
			`data:${dataType};base64,` +
				btoa(
					new Uint8Array(await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')).reduce(
						(acc, i) => (acc += String.fromCharCode.apply(null, [i])),
						'',
					),
				),
		);
	}

	return data;
};

export const assetLoaderMap = async (): Promise<Map<AssetIdMap, GameMap>> => {
	let assetId: AssetIdMap,
		data: Map<AssetIdMap, GameMap> = new Map(),
		filename: string,
		gameMap: GameMap,
		properties: AssetPropertiesMap | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderMap: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetIdMap } = {};
	for ([assetId, properties] of assetsMaps) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			continue;
		}

		properties = assetsMaps.get(assetId);

		// Filter
		if (properties === undefined) {
			continue;
		}

		try {
			gameMap = JSON.parse(
				atob(
					new Uint8Array(await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')).reduce(
						(acc, i) => (acc += String.fromCharCode.apply(null, [i])),
						'',
					),
				),
			);
			gameMap.grid = GamingCanvasGridUint32Array.from(<Uint32Array>gameMap.grid.data);

			data.set(assetId, gameMap);
		} catch (error) {
			console.error('AssetManager > map: failed to parse map', AssetIdMap[assetId]);
		}
	}

	return data;
};

/*
 * ASSETS
 */

export enum AssetExtAudio {
	MP3,
}

export enum AssetExtImg {
	PNG,
}

export enum AssetIdAudio {
	AUDIO_EFFECT_AMMO,
	AUDIO_EFFECT_BOSS_HANS_GROSSE_DEATH,
	AUDIO_EFFECT_BOSS_HANS_GROSSE_FIRE,
	AUDIO_EFFECT_BOSS_HANS_GROSSE_SURPRISE,
	AUDIO_EFFECT_DOOR_CLOSE,
	AUDIO_EFFECT_DOOR_OPEN,
	AUDIO_EFFECT_END_FLOOR_SCORE_MULTIPLE,
	AUDIO_EFFECT_END_FLOOR_SCORE_NONE,
	AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE,
	AUDIO_EFFECT_EVIL_LAUGH,
	AUDIO_EFFECT_EXTRA_LIFE,
	AUDIO_EFFECT_FOOD,
	AUDIO_EFFECT_FOOD_DOG,
	AUDIO_EFFECT_GUARD_DEATH,
	AUDIO_EFFECT_GUARD_DEATH2,
	AUDIO_EFFECT_GUARD_DEATH3,
	AUDIO_EFFECT_GUARD_DEATH4,
	AUDIO_EFFECT_GUARD_DEATH5,
	AUDIO_EFFECT_GUARD_FIRE,
	AUDIO_EFFECT_GUARD_SURPRISE,
	AUDIO_EFFECT_KEY,
	AUDIO_EFFECT_KNIFE,
	AUDIO_EFFECT_MACHINE_GUN,
	AUDIO_EFFECT_MACHINE_GUN_PICKUP,
	AUDIO_EFFECT_MEDKIT,
	AUDIO_EFFECT_MENU_EXIT,
	AUDIO_EFFECT_MENU_OPEN,
	AUDIO_EFFECT_MENU_SELECT,
	AUDIO_EFFECT_MENU_SELECT_DOUBLE,
	AUDIO_EFFECT_NOTHING_TO_DO,
	AUDIO_EFFECT_PISTOL,
	AUDIO_EFFECT_RAT_DEATH,
	AUDIO_EFFECT_RAT_FIRE,
	AUDIO_EFFECT_RAT_SURPRISE,
	AUDIO_EFFECT_SS_DEATH,
	AUDIO_EFFECT_SS_FIRE,
	AUDIO_EFFECT_SS_SURPRISE,
	AUDIO_EFFECT_SUB_MACHINE_GUN,
	AUDIO_EFFECT_SUB_MACHINE_GUN_PICKUP,
	AUDIO_EFFECT_SWITCH,
	AUDIO_EFFECT_TREASURE_CHEST,
	AUDIO_EFFECT_TREASURE_CROSS,
	AUDIO_EFFECT_TREASURE_CROWN,
	AUDIO_EFFECT_TREASURE_CUP,
	AUDIO_EFFECT_WALL_HIT,
	AUDIO_EFFECT_WALL_MOVE,
	AUDIO_EFFECT_YEAH,
	AUDIO_MUSIC_END_OF_LEVEL = 10000,
	AUDIO_MUSIC_ENEMY_AROUND_THE_CORNER = 10007,
	AUDIO_MUSIC_EPISODE_END = 10008,
	AUDIO_MUSIC_GET_THEM = 10001,
	AUDIO_MUSIC_MARCH_TO_WAR = 10006,
	AUDIO_MUSIC_POW = 10004,
	AUDIO_MUSIC_SEARCHN = 10002,
	AUDIO_MUSIC_SUSPENSE = 10005,
	AUDIO_MUSIC_WONDERING = 10003,
}

export const AssetIdMusicLevels: AssetIdAudio[] = [
	AssetIdAudio.AUDIO_MUSIC_ENEMY_AROUND_THE_CORNER,
	AssetIdAudio.AUDIO_MUSIC_GET_THEM,
	AssetIdAudio.AUDIO_MUSIC_MARCH_TO_WAR,
	AssetIdAudio.AUDIO_MUSIC_POW,
	AssetIdAudio.AUDIO_MUSIC_SEARCHN,
	AssetIdAudio.AUDIO_MUSIC_SUSPENSE,
];

// Values less than 1000 are not rendered by VideoMain
export enum AssetIdImg {
	MISC_ARROW_EAST = 1,
	MISC_ARROW_NORTH = 2,
	MISC_ARROW_NORTH_EAST = 3,
	MISC_ARROW_NORTH_WEST = 4,
	MISC_ARROW_SOUTH = 5,
	MISC_ARROW_SOUTH_EAST = 6,
	MISC_ARROW_SOUTH_WEST = 7,
	MISC_ARROW_WEST = 8,
	MISC_X = 9,
	NULL = 0,
	SPRITE_AMMO = 1000,
	SPRITE_AMMO_DROPPED = 1001,
	SPRITE_ARMOR = 1002,
	SPRITE_BARREL_GREEN = 1003,
	SPRITE_BARREL_WOOD = 1004,
	SPRITE_BASKET = 1005,
	SPRITE_BED = 1006,
	SPRITE_BLOOD = 1007,
	SPRITE_BONE_PILE = 1008,
	SPRITE_BONE_RUBISH_1 = 1009,
	SPRITE_BONE_RUBISH_2 = 1010,
	SPRITE_BONE_RUBISH_3 = 1011,
	SPRITE_CAGE = 1012,
	SPRITE_CAGE_SKELETON = 1013,
	SPRITE_ELEVATOR_DOOR = 1014,
	SPRITE_EXTRA_LIFE = 1015,
	SPRITE_FAUCET = 1016,
	SPRITE_FLAG = 1017,
	SPRITE_FOOD = 1018,
	SPRITE_FOOD_DOG = 1019,
	SPRITE_FURNACE = 1020,
	SPRITE_GUARD_CORPSE = 1021,
	SPRITE_KEY1 = 1022,
	SPRITE_KEY2 = 1023,
	SPRITE_KITCHEN_UTENSILS_1 = 1024,
	SPRITE_KITCHEN_UTENSILS_2 = 1025,
	SPRITE_LIGHT_CEILING_OFF = 1026,
	SPRITE_LIGHT_CEILING_ON = 1027,
	SPRITE_LIGHT_CHANDELIER_OFF = 1028,
	SPRITE_LIGHT_CHANDELIER_ON = 1029,
	SPRITE_LIGHT_FLOOR_OFF = 1030,
	SPRITE_LIGHT_FLOOR_ON = 1031,
	SPRITE_MACHINE_GUN = 1032,
	SPRITE_MEDKIT = 1033,
	SPRITE_METAL_DOOR = 1034,
	SPRITE_METAL_DOOR_INSIDE = 1035,
	SPRITE_METAL_LOCKED = 1036,
	SPRITE_PILLAR_STONE = 1037,
	SPRITE_POTTED_PLANT = 1038,
	SPRITE_POTTED_TREE = 1039,
	SPRITE_SKELETON = 1040,
	SPRITE_SKELETON_BLOOD = 1041,
	SPRITE_SKELETON_HANGING = 1042,
	SPRITE_SPEARS = 1043,
	SPRITE_SUB_MACHINE_GUN = 1044,
	SPRITE_TABLE = 1045,
	SPRITE_TABLE_CHAIRS = 1046,
	SPRITE_TREASURE_CHEST = 1047,
	SPRITE_TREASURE_CROSS = 1048,
	SPRITE_TREASURE_CROWN = 1049,
	SPRITE_TREASURE_CUP = 1050,
	SPRITE_VASE = 1051,
	SPRITE_VINES = 1052,
	SPRITE_WATER = 1053,
	SPRITE_WELL_EMPTY = 1054,
	SPRITE_WELL_WATER = 1055,
	WALL_BRICK_BLUE = 2000,
	WALL_BRICK_BLUE2 = 2001,
	WALL_BRICK_BLUE_CELL = 2002,
	WALL_BRICK_BLUE_CELL_SKELETON = 2003,
	WALL_BRICK_RED = 2004,
	WALL_BRICK_RED_EAGLE = 2005,
	WALL_BRICK_RED_LAURAL = 2006,
	WALL_ELEVATOR_SIDE = 2007,
	WALL_ELEVATOR_SWITCH_DOWN = 2008,
	WALL_ELEVATOR_SWITCH_UP = 2009,
	WALL_METAL = 2010,
	WALL_METAL_ACHTUNG = 2011,
	WALL_METAL_VERBOTEM = 2012,
	WALL_OUTSIDE_DAY = 2013,
	WALL_OUTSIDE_NIGHT = 2014,
	WALL_ROCK_PURPLE = 2015,
	WALL_ROCK_PURPLE_BLOOD = 2016,
	WALL_STONE_GREY = 2017,
	WALL_STONE_GREY2 = 2018,
	// WALL_STONE_GREY3 = 2019,
	WALL_STONE_GREY_EAGLE = 2020,
	WALL_STONE_GREY_FLAG = 2021,
	WALL_STONE_GREY_HITLER = 2022,
	WALL_STONE_GREY_SIGN_VERBOTEM = 2023,
	WALL_WOOD = 2024,
	WALL_WOOD_EAGLE = 2025,
	WALL_WOOD_HITLER = 2026,
	WEAPON_KNIFE_1 = 10000,
	WEAPON_KNIFE_2 = 10001,
	WEAPON_KNIFE_3 = 10002,
	WEAPON_KNIFE_4 = 10003,
	WEAPON_KNIFE_5 = 10004,
	WEAPON_MACHINE_GUN_1 = 10015,
	WEAPON_MACHINE_GUN_2 = 10016,
	WEAPON_MACHINE_GUN_3 = 10017,
	WEAPON_MACHINE_GUN_4 = 10018,
	WEAPON_MACHINE_GUN_5 = 10019,
	WEAPON_PISTOL_1 = 10005,
	WEAPON_PISTOL_2 = 10006,
	WEAPON_PISTOL_3 = 10007,
	WEAPON_PISTOL_4 = 10008,
	WEAPON_PISTOL_5 = 10009,
	WEAPON_SUB_MACHINE_GUN_1 = 10010,
	WEAPON_SUB_MACHINE_GUN_2 = 10011,
	WEAPON_SUB_MACHINE_GUN_3 = 10012,
	WEAPON_SUB_MACHINE_GUN_4 = 10013,
	WEAPON_SUB_MACHINE_GUN_5 = 10014,
}

export const AssetIdImgWeaponSequenceKnife: AssetIdImg[] = [
	AssetIdImg.WEAPON_KNIFE_1,
	AssetIdImg.WEAPON_KNIFE_2,
	AssetIdImg.WEAPON_KNIFE_3,
	AssetIdImg.WEAPON_KNIFE_4,
	AssetIdImg.WEAPON_KNIFE_5,
];

export const AssetIdImgWeaponSequenceMachineGun: AssetIdImg[] = [
	AssetIdImg.WEAPON_MACHINE_GUN_1,
	AssetIdImg.WEAPON_MACHINE_GUN_2,
	AssetIdImg.WEAPON_MACHINE_GUN_3,
	AssetIdImg.WEAPON_MACHINE_GUN_4,
	AssetIdImg.WEAPON_MACHINE_GUN_5,
];

export const AssetIdImgWeaponSequencePistol: AssetIdImg[] = [
	AssetIdImg.WEAPON_PISTOL_1,
	AssetIdImg.WEAPON_PISTOL_2,
	AssetIdImg.WEAPON_PISTOL_3,
	AssetIdImg.WEAPON_PISTOL_4,
	AssetIdImg.WEAPON_PISTOL_5,
];

export const AssetIdImgWeaponSequenceSubMachineGun: AssetIdImg[] = [
	AssetIdImg.WEAPON_SUB_MACHINE_GUN_1,
	AssetIdImg.WEAPON_SUB_MACHINE_GUN_2,
	AssetIdImg.WEAPON_SUB_MACHINE_GUN_3,
	AssetIdImg.WEAPON_SUB_MACHINE_GUN_4,
	AssetIdImg.WEAPON_SUB_MACHINE_GUN_5,
];

export enum AssetIdImgCharacter {
	AIM = 200,
	CORPSE = 201,
	DIE1 = 202,
	DIE2 = 203,
	DIE3 = 204,
	DIE4 = 205,
	FIRE = 206,
	FIRE2 = 207,
	HIT1 = 208,
	HIT2 = 209,
	JUMP1_S = 100,
	JUMP2_S = 101,
	JUMP3_S = 102,
	JUMP4_S = 103,
	MOVE1_E = 8,
	MOVE1_N = 9,
	MOVE1_NE = 10,
	MOVE1_NW = 11,
	MOVE1_S = 12,
	MOVE1_SE = 13,
	MOVE1_SW = 14,
	MOVE1_W = 15,
	MOVE2_E = 16,
	MOVE2_N = 17,
	MOVE2_NE = 18,
	MOVE2_NW = 19,
	MOVE2_S = 20,
	MOVE2_SE = 21,
	MOVE2_SW = 22,
	MOVE2_W = 23,
	MOVE3_E = 24,
	MOVE3_N = 25,
	MOVE3_NE = 26,
	MOVE3_NW = 27,
	MOVE3_S = 28,
	MOVE3_SE = 29,
	MOVE3_SW = 30,
	MOVE3_W = 31,
	MOVE4_E = 32,
	MOVE4_N = 33,
	MOVE4_NE = 34,
	MOVE4_NW = 35,
	MOVE4_S = 36,
	MOVE4_SE = 37,
	MOVE4_SW = 38,
	MOVE4_W = 39,
	STAND_E = 40,
	STAND_N = 41,
	STAND_NE = 42,
	STAND_NW = 43,
	STAND_S = 44,
	STAND_SE = 46,
	STAND_SW = 47,
	STAND_W = 48,
	SUPRISE = 49,
}

export const assetIdImgCharacterDie: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.DIE1,
	AssetIdImgCharacter.DIE2,
	AssetIdImgCharacter.DIE3,
	AssetIdImgCharacter.DIE4,
	AssetIdImgCharacter.CORPSE,
];

export const assetIdImgCharacterFire: AssetIdImgCharacter[] = [AssetIdImgCharacter.FIRE, AssetIdImgCharacter.FIRE2];

export const assetIdImgCharacterMenu: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.MOVE1_E,
	AssetIdImgCharacter.STAND_E,
	AssetIdImgCharacter.MOVE1_N,
	AssetIdImgCharacter.STAND_N,
	AssetIdImgCharacter.MOVE1_NE,
	AssetIdImgCharacter.STAND_NE,
	AssetIdImgCharacter.MOVE1_NW,
	AssetIdImgCharacter.STAND_NW,
	AssetIdImgCharacter.MOVE1_S,
	AssetIdImgCharacter.STAND_S,
	AssetIdImgCharacter.MOVE1_SE,
	AssetIdImgCharacter.STAND_SE,
	AssetIdImgCharacter.MOVE1_SW,
	AssetIdImgCharacter.STAND_SW,
	AssetIdImgCharacter.MOVE1_W,
	AssetIdImgCharacter.STAND_W,
];

export const assetIdImgCharacterJumpS: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.JUMP1_S,
	AssetIdImgCharacter.JUMP2_S,
	AssetIdImgCharacter.JUMP3_S,
	AssetIdImgCharacter.JUMP4_S,
];

export const assetIdImgCharacterMoveE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_E,
	AssetIdImgCharacter.MOVE1_E,
	AssetIdImgCharacter.MOVE2_E,
	AssetIdImgCharacter.MOVE3_E,
	AssetIdImgCharacter.MOVE4_E,
];

export const assetIdImgCharacterMoveN: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_N,
	AssetIdImgCharacter.MOVE1_N,
	AssetIdImgCharacter.MOVE2_N,
	AssetIdImgCharacter.MOVE3_N,
	AssetIdImgCharacter.MOVE4_N,
];

export const assetIdImgCharacterMoveNE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_NE,
	AssetIdImgCharacter.MOVE1_NE,
	AssetIdImgCharacter.MOVE2_NE,
	AssetIdImgCharacter.MOVE3_NE,
	AssetIdImgCharacter.MOVE4_NE,
];

export const assetIdImgCharacterMoveNW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_NW,
	AssetIdImgCharacter.MOVE1_NW,
	AssetIdImgCharacter.MOVE2_NW,
	AssetIdImgCharacter.MOVE3_NW,
	AssetIdImgCharacter.MOVE4_NW,
];

export const assetIdImgCharacterMoveS: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_S,
	AssetIdImgCharacter.MOVE1_S,
	AssetIdImgCharacter.MOVE2_S,
	AssetIdImgCharacter.MOVE3_S,
	AssetIdImgCharacter.MOVE4_S,
];

export const assetIdImgCharacterMoveSE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_SE,
	AssetIdImgCharacter.MOVE1_SE,
	AssetIdImgCharacter.MOVE2_SE,
	AssetIdImgCharacter.MOVE3_SE,
	AssetIdImgCharacter.MOVE4_SE,
];

export const assetIdImgCharacterMoveSW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_SW,
	AssetIdImgCharacter.MOVE1_SW,
	AssetIdImgCharacter.MOVE2_SW,
	AssetIdImgCharacter.MOVE3_SW,
	AssetIdImgCharacter.MOVE4_SW,
];

export const assetIdImgCharacterMoveW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_W,
	AssetIdImgCharacter.MOVE1_W,
	AssetIdImgCharacter.MOVE2_W,
	AssetIdImgCharacter.MOVE3_W,
	AssetIdImgCharacter.MOVE4_W,
];

const assetIdImgCharacterMoveAll: AssetIdImgCharacter[][] = [
	assetIdImgCharacterMoveE,
	assetIdImgCharacterMoveN,
	assetIdImgCharacterMoveNE,
	assetIdImgCharacterMoveNW,
	assetIdImgCharacterMoveS,
	assetIdImgCharacterMoveSE,
	assetIdImgCharacterMoveSW,
	assetIdImgCharacterMoveW,
];
const assetIdImgCharacterMoveAllFilePrefixes: string[] = ['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w'];

export enum AssetIdImgCharacterType {
	BOSS_HANS_GROSSE = 4,
	GUARD = 0,
	OFFICER = 1,
	RAT = 3,
	SS = 2,
	WILLIAM_BJ_BLAZKOWICZ = 5,
}

export enum AssetIdImgMenu {
	CREDITS,
	BANNER_BAR,
	BANNER_GAME_LOAD,
	BANNER_GAME_SAVE,
	BANNER_OPTIONS,
	DIFFICULTY_EASY,
	DIFFICULTY_NORMAL,
	DIFFICULTY_HARD,
	DIFFICULTY_INSANE,
	END_FLOOR_FONT_0,
	END_FLOOR_FONT_1,
	END_FLOOR_FONT_2,
	END_FLOOR_FONT_3,
	END_FLOOR_FONT_4,
	END_FLOOR_FONT_5,
	END_FLOOR_FONT_6,
	END_FLOOR_FONT_7,
	END_FLOOR_FONT_8,
	END_FLOOR_FONT_9,
	END_FLOOR_FONT_A,
	END_FLOOR_FONT_APOSTROPHE,
	END_FLOOR_FONT_B,
	END_FLOOR_FONT_C,
	END_FLOOR_FONT_COLON,
	END_FLOOR_FONT_D,
	END_FLOOR_FONT_E,
	END_FLOOR_FONT_EXCLAMATION,
	END_FLOOR_FONT_F,
	END_FLOOR_FONT_G,
	END_FLOOR_FONT_H,
	END_FLOOR_FONT_HYPHON,
	END_FLOOR_FONT_I,
	END_FLOOR_FONT_J,
	END_FLOOR_FONT_K,
	END_FLOOR_FONT_L,
	END_FLOOR_FONT_M,
	END_FLOOR_FONT_N,
	END_FLOOR_FONT_O,
	END_FLOOR_FONT_P,
	END_FLOOR_FONT_PERCENT,
	END_FLOOR_FONT_Q,
	END_FLOOR_FONT_R,
	END_FLOOR_FONT_S,
	END_FLOOR_FONT_T,
	END_FLOOR_FONT_U,
	END_FLOOR_FONT_V,
	END_FLOOR_FONT_W,
	END_FLOOR_FONT_X,
	END_FLOOR_FONT_Y,
	END_FLOOR_FONT_Z,
	END_FLOOR_PISTOL_1,
	END_FLOOR_PISTOL_2,
	EPISODE_1,
	EPISODE_2,
	EPISODE_3,
	EPISODE_4,
	EPISODE_5,
	EPISODE_6,
	EPISODE_END_DOUBLE,
	EPISODE_END_SINGLE,
	GET_PSYCHED,
	HUD_AMMO,
	HUD_FONT_0,
	HUD_FONT_1,
	HUD_FONT_2,
	HUD_FONT_3,
	HUD_FONT_4,
	HUD_FONT_5,
	HUD_FONT_6,
	HUD_FONT_7,
	HUD_FONT_8,
	HUD_FONT_9,
	HUD_FONT_PERCENT,
	HUD_HEALTH,
	HUD_KEY_1,
	HUD_KEY_2,
	HUD_LIVES,
	KEYS,
	MENU_PISTOL,
	RATING,
	SCREEN_STATS,
	SCREEN_TITLE,
	WEAPONS_BACKGROUND,
	WEAPONS_1,
	WEAPONS_2,
	WEAPONS_3,
	WEAPONS_4,
}

export enum AssetIdMap {
	EPISODE_01_FLOOR_01 = 0,
	EPISODE_01_FLOOR_02 = 1,
	EPISODE_01_FLOOR_03 = 2,
	EPISODE_01_FLOOR_04 = 3,
	EPISODE_01_FLOOR_05 = 4,
	EPISODE_01_FLOOR_06 = 5,
	EPISODE_01_FLOOR_07 = 6,
	EPISODE_01_FLOOR_08 = 7,
	EPISODE_01_FLOOR_09 = 8,
	EPISODE_01_FLOOR_10 = 9,
	EPISODE_02_FLOOR_01 = 10,
	EPISODE_02_FLOOR_02 = 11,
	EPISODE_02_FLOOR_03 = 12,
	EPISODE_02_FLOOR_04 = 13,
	EPISODE_02_FLOOR_05 = 14,
	EPISODE_02_FLOOR_06 = 15,
	EPISODE_02_FLOOR_07 = 16,
	EPISODE_02_FLOOR_08 = 17,
	EPISODE_02_FLOOR_09 = 18,
	EPISODE_02_FLOOR_10 = 19,
	EPISODE_03_FLOOR_01 = 20,
	EPISODE_03_FLOOR_02 = 21,
	EPISODE_03_FLOOR_03 = 22,
	EPISODE_03_FLOOR_04 = 23,
	EPISODE_03_FLOOR_05 = 24,
	EPISODE_03_FLOOR_06 = 25,
	EPISODE_03_FLOOR_07 = 26,
	EPISODE_03_FLOOR_08 = 27,
	EPISODE_03_FLOOR_09 = 28,
	EPISODE_03_FLOOR_10 = 29,
	EPISODE_04_FLOOR_01 = 30,
	EPISODE_04_FLOOR_02 = 31,
	EPISODE_04_FLOOR_03 = 32,
	EPISODE_04_FLOOR_04 = 33,
	EPISODE_04_FLOOR_05 = 34,
	EPISODE_04_FLOOR_06 = 35,
	EPISODE_04_FLOOR_07 = 36,
	EPISODE_04_FLOOR_08 = 37,
	EPISODE_04_FLOOR_09 = 38,
	EPISODE_04_FLOOR_10 = 39,
	EPISODE_05_FLOOR_01 = 40,
	EPISODE_05_FLOOR_02 = 41,
	EPISODE_05_FLOOR_03 = 42,
	EPISODE_05_FLOOR_04 = 43,
	EPISODE_05_FLOOR_05 = 44,
	EPISODE_05_FLOOR_06 = 45,
	EPISODE_05_FLOOR_07 = 46,
	EPISODE_05_FLOOR_08 = 47,
	EPISODE_05_FLOOR_09 = 48,
	EPISODE_05_FLOOR_10 = 49,
	EPISODE_06_FLOOR_01 = 50,
	EPISODE_06_FLOOR_02 = 51,
	EPISODE_06_FLOOR_03 = 52,
	EPISODE_06_FLOOR_04 = 53,
	EPISODE_06_FLOOR_05 = 54,
	EPISODE_06_FLOOR_06 = 55,
	EPISODE_06_FLOOR_07 = 56,
	EPISODE_06_FLOOR_08 = 57,
	EPISODE_06_FLOOR_09 = 58,
	EPISODE_06_FLOOR_10 = 59,
}

export enum AssetImgCategory {
	CHARACTER,
	EXTENDED,
	LIGHT,
	MENU,
	SPRITE,
	SPRITE_PICKUP,
	TAG,
	WALL,
	WEAPON,
	WAYPOINT,
}

interface AssetProperties {
	author?: string;
	file: string;
	license?: string;
	title: string;
	url?: string;
}

export interface AssetPropertiesAudio extends AssetProperties {
	effect: boolean;
	ext: AssetExtAudio;
	volume: number; // 0-1 range for default volume
}

export interface AssetPropertiesCharacter extends AssetPropertiesImage {
	angle?: number;
}

export interface AssetPropertiesImage extends AssetProperties {
	alpha: boolean;
	blocking?: boolean;
	category: AssetImgCategory;
	ext: AssetExtImg;
	hide?: boolean;
}

export interface AssetPropertiesMap extends AssetProperties {
	episode: number;
	floor: number;
}

export const assetsAudio: Map<AssetIdAudio, AssetPropertiesAudio> = new Map();
export const assetsImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, AssetPropertiesCharacter>> = new Map();
export const assetsImageMenus: Map<AssetIdImgMenu, AssetPropertiesImage> = new Map();
export const assetsImageMenusFontEndLevel: Map<string, AssetIdImgMenu> = new Map();
export const assetsImageMenusFontHUD: Map<string, AssetIdImgMenu> = new Map();
export const assetsImages: Map<AssetIdImg, AssetPropertiesImage> = new Map();
export const assetsMaps: Map<AssetIdMap, AssetPropertiesMap> = new Map();

export const initializeAssetManager = async (audioOnly?: boolean) => {
	let cAngle: number,
		cAssetIdImgCharacter: AssetIdImgCharacter,
		cAuthor: string,
		cBoss: boolean,
		cDir: string,
		cFilePrefix: string,
		cHide: boolean,
		cI: number,
		cInstance: Map<AssetIdImgCharacter, AssetPropertiesCharacter>,
		cMovement: AssetIdImgCharacter[],
		cName: string;

	/**
	 * Assets: Audio - Effects
	 */

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_AMMO, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/ammo.mp3',
		title: 'Ammo',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_BOSS_HANS_GROSSE_DEATH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/boss_hans_grosse_death.mp3',
		title: 'Hans Grosse Death',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_BOSS_HANS_GROSSE_FIRE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/boss_hans_grosse_fire.mp3',
		title: 'Hans Grosse Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_BOSS_HANS_GROSSE_SURPRISE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/boss_hans_grosse_surprise.mp3',
		title: 'Hans Grosse Surprise',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_DOOR_CLOSE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/door_close.mp3',
		title: 'Door Close',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_DOOR_OPEN, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/door_open.mp3',
		title: 'Door Open',
		volume: 0.8,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_MULTIPLE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/end_level_score_multiple.mp3',
		title: 'End Level Score Multiple',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_NONE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/end_level_score_none.mp3',
		title: 'End Level Score None',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_END_FLOOR_SCORE_SINGLE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/end_level_score_single.mp3',
		title: 'End Level Score Single',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_EVIL_LAUGH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/evil_laugh.mp3',
		title: 'Evil Laugh',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_EXTRA_LIFE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/extra_life.mp3',
		title: 'Extra Life',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_FOOD, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/food.mp3',
		title: 'Food',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_FOOD_DOG, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/food_dog.mp3',
		title: 'Food Dog',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death_1.mp3',
		title: 'Guard Death',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH2, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death_2.mp3',
		title: 'Guard Death2',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH3, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death_3.mp3',
		title: 'Guard Death3',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH4, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death_4.mp3',
		title: 'Guard Death4',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH5, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death_5.mp3',
		title: 'Guard Death5',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_FIRE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_fire.mp3',
		title: 'Guard Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_SURPRISE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_surprise.mp3',
		title: 'Guard Surprise',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_KEY, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/key.mp3',
		title: 'Key',
		volume: 0.5,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_KNIFE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/knife.mp3',
		title: 'Knife',
		volume: 0.5,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MACHINE_GUN, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/machine_gun.mp3',
		title: 'Machine Gun Fire',
		volume: 0.5,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MACHINE_GUN_PICKUP, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/machine_gun_pickup.mp3',
		title: 'Machine Gun Pickup',
		volume: 0.25,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MEDKIT, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/medkit.mp3',
		title: 'Medkit',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MENU_EXIT, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/menu_exit.mp3',
		title: 'Menu Exit',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MENU_OPEN, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/menu_open.mp3',
		title: 'Menu Open',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/menu_select.mp3',
		title: 'Menu Select',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MENU_SELECT_DOUBLE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/menu_select_double.mp3',
		title: 'Menu Select Double',
		volume: 0.25,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_NOTHING_TO_DO, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/action_nothing_to_do.mp3',
		title: 'Nothing To Do',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_PISTOL, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/pistol.mp3',
		title: 'Pistol Fire',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_RAT_DEATH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/rat_death.mp3',
		title: 'Rat Death',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_RAT_FIRE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/rat_fire.mp3',
		title: 'Rat Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_RAT_SURPRISE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/rat_surprise.mp3',
		title: 'Rat Surprise',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SS_DEATH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/ss_death.mp3',
		title: 'SS Death',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SS_FIRE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/ss_fire.mp3',
		title: 'SS Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SS_SURPRISE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/ss_surprise.mp3',
		title: 'SS Surprise',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SUB_MACHINE_GUN, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/sub_machine_gun.mp3',
		title: 'Sub Machine Gun Fire',
		volume: 0.75,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SUB_MACHINE_GUN_PICKUP, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/sub_machine_gun_pickup.mp3',
		title: 'Sub Machine Gun Pickup',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SWITCH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/switch.mp3',
		title: 'Switch',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CHEST, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_chest.mp3',
		title: 'Treasure Chest',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROSS, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_cross.mp3',
		title: 'Treasure Cross',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROWN, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_crown.mp3',
		title: 'Treasure Crown',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CUP, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_cup.mp3',
		title: 'Treasure Cup',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_WALL_HIT, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/wall_hit.mp3',
		title: 'Wall Hit',
		volume: 0.2,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_WALL_MOVE, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/wall_move.mp3',
		title: 'Wall Move',
		volume: 0.8,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_YEAH, {
		author: 'Id Software',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/yeah.mp3',
		title: 'Yeah',
		volume: 0.8,
	});

	/**
	 * Assets: Audio - Music
	 */

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_END_OF_LEVEL, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/end_of_level.mp3',
		title: 'End Of Level',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_ENEMY_AROUND_THE_CORNER, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/enemy_around_the_corner.mp3',
		title: 'Enemy Around the Corner',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_EPISODE_END, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/episode_end.mp3',
		title: 'Episode End',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_GET_THEM, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/get_them_before_they_get_you.mp3',
		title: 'Get Them Before They Get You',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_MARCH_TO_WAR, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/march_to_war.mp3',
		title: 'March to War',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_POW, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/pow.mp3',
		title: 'P.O.W.',
		volume: 0.4,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_SEARCHN, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/searching_for_the_enemy.mp3',
		title: 'Searching For The Enemy',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_SUSPENSE, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/suspense.mp3',
		title: 'Suspense',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_WONDERING, {
		author: 'Id Software',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/wondering_about_my_loved_ones.mp3',
		title: 'Wondering About My Loved Ones',
		volume: 0.8,
	});

	/**
	 * Assets: Characters
	 */

	if (audioOnly !== true) {
		for (const characterType of Object.values(AssetIdImgCharacterType)) {
			if (typeof characterType !== 'number') {
				continue;
			}

			switch (characterType) {
				case AssetIdImgCharacterType.GUARD:
					cAuthor = 'Id Software';
					cBoss = false;
					cDir = 'guard';
					cHide = false;
					cName = 'Guard';
					break;
				case AssetIdImgCharacterType.BOSS_HANS_GROSSE:
					cAuthor = 'Id Software';
					cBoss = true;
					cDir = 'hans_grosse';
					cHide = true;
					cName = 'Hans Grosse';
					break;
				case AssetIdImgCharacterType.OFFICER:
					cAuthor = 'Id Software';
					cBoss = false;
					cDir = 'officer';
					cHide = true;
					cName = 'Officer';
					break;
				case AssetIdImgCharacterType.RAT:
					cAuthor = 'Capstone Software';
					cBoss = false;
					cDir = 'rat';
					cHide = true;
					cName = 'Rat';
					break;
				case AssetIdImgCharacterType.SS:
					cAuthor = 'Id Software';
					cBoss = false;
					cDir = 'ss';
					cHide = true;
					cName = 'SS';
					break;
				case AssetIdImgCharacterType.WILLIAM_BJ_BLAZKOWICZ:
					cAuthor = 'Id Software';
					cBoss = true;
					cDir = 'bj';
					cHide = true;
					cName = 'William Joseph "BJ" Blazkowics';
					break;
			}

			cInstance = new Map();
			assetsImageCharacters.set(characterType, cInstance);

			/**
			 * Standard
			 */

			cInstance.set(AssetIdImgCharacter.AIM, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/aim.png`,
				hide: cHide,
				title: `${cName} Aim`,
			});

			cInstance.set(AssetIdImgCharacter.CORPSE, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/corpse.png`,
				hide: cHide,
				title: `${cName} Corpse`,
			});

			cInstance.set(AssetIdImgCharacter.DIE1, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die1.png`,
				hide: cHide,
				title: `${cName} Die1`,
			});

			cInstance.set(AssetIdImgCharacter.DIE2, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die2.png`,
				hide: cHide,
				title: `${cName} Die2`,
			});

			cInstance.set(AssetIdImgCharacter.DIE3, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die3.png`,
				hide: cHide,
				title: `${cName} Die3`,
			});

			cInstance.set(AssetIdImgCharacter.DIE4, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die4.png`,
				hide: cHide,
				title: `${cName} Die4`,
			});

			cInstance.set(AssetIdImgCharacter.FIRE, {
				alpha: true,
				author: cAuthor,
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/fire.png`,
				hide: cHide,
				title: `${cName} Fire`,
			});

			if (cBoss === true) {
				cInstance.set(AssetIdImgCharacter.FIRE2, {
					alpha: true,
					author: cAuthor,
					category: AssetImgCategory.CHARACTER,
					ext: AssetExtImg.PNG,
					file: `img/character/${cDir}/fire2.png`,
					hide: cHide,
					title: `${cName} Fire`,
				});
			}

			if (cBoss !== true) {
				cInstance.set(AssetIdImgCharacter.HIT1, {
					alpha: true,
					author: cAuthor,
					category: AssetImgCategory.CHARACTER,
					ext: AssetExtImg.PNG,
					file: `img/character/${cDir}/hit1.png`,
					hide: cHide,
					title: `${cName} Hit1`,
				});

				cInstance.set(AssetIdImgCharacter.HIT2, {
					alpha: true,
					author: cAuthor,
					category: AssetImgCategory.CHARACTER,
					ext: AssetExtImg.PNG,
					file: `img/character/${cDir}/hit2.png`,
					hide: cHide,
					title: `${cName} Hit2`,
				});

				cInstance.set(AssetIdImgCharacter.SUPRISE, {
					alpha: true,
					author: cAuthor,
					category: AssetImgCategory.CHARACTER,
					ext: AssetExtImg.PNG,
					file: `img/character/${cDir}/surprise.png`,
					hide: cHide,
					title: `${cName} Surprise`,
				});
			}

			/**
			 * Movement
			 */
			for ([cI, cMovement] of assetIdImgCharacterMoveAll.entries()) {
				cFilePrefix = assetIdImgCharacterMoveAllFilePrefixes[cI];

				switch (cFilePrefix) {
					case 'e':
						cAngle = 0; // 0 deg
						break;
					case 'n':
						cAngle = 1.5708; // 90 deg
						break;
					case 'ne':
						cAngle = 0.7855; // 45 deg
						break;
					case 'nw':
						cAngle = 2.3562; // 135 deg
						break;
					case 's':
						cAngle = 4.7124; // 270 deg
						break;
					case 'se':
						cAngle = 5.4978; // 315 deg
						break;
					case 'sw':
						cAngle = 3.927; // 225 deg
						break;
					case 'w':
						cAngle = 3.1416; // 180 deg
						break;
					default:
						cAngle = -1;
						break;
				}

				if (cBoss !== true || cAngle === 4.7124) {
					for ([cI, cAssetIdImgCharacter] of cMovement.entries()) {
						cInstance.set(cAssetIdImgCharacter, {
							alpha: true,
							angle: cAngle,
							author: cAuthor,
							category: AssetImgCategory.CHARACTER,
							ext: AssetExtImg.PNG,
							file: `img/character/${cDir}/${cFilePrefix}_${cI === 0 ? 'stand' : `move${cI}`}.png`,
							hide: cHide,
							title: `${cName} ${cI === 0 ? 'Stand' : 'Move'} ${cFilePrefix.toUpperCase()}`,
						});
					}
				}

				if (cAngle === 4.7124 && characterType === AssetIdImgCharacterType.WILLIAM_BJ_BLAZKOWICZ) {
					for ([cI, cAssetIdImgCharacter] of assetIdImgCharacterJumpS.entries()) {
						cInstance.set(cAssetIdImgCharacter, {
							alpha: true,
							angle: cAngle,
							author: cAuthor,
							category: AssetImgCategory.CHARACTER,
							ext: AssetExtImg.PNG,
							file: `img/character/${cDir}/${cFilePrefix}_${`jump${cI + 1}`}.png`,
							hide: cHide,
							title: `${cName} ${'Jump'} ${cFilePrefix.toUpperCase()}`,
						});
					}
				}
			}
		}
	}

	/**
	 * Assets: Maps
	 */

	if (audioOnly !== true) {
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_01, {
			episode: 1,
			file: 'map/episode_01_floor_01.map',
			floor: 1,
			title: 'Episode 01: Floor 01',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_02, {
			episode: 1,
			file: 'map/episode_01_floor_02.map',
			floor: 2,
			title: 'Episode 01: Floor 02',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_03, {
			episode: 1,
			file: 'map/episode_01_floor_03.map',
			floor: 3,
			title: 'Episode 01: Floor 03',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_04, {
			episode: 1,
			file: 'map/episode_01_floor_04.map',
			floor: 4,
			title: 'Episode 01: Floor 04',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_05, {
			episode: 1,
			file: 'map/episode_01_floor_05.map',
			floor: 5,
			title: 'Episode 01: Floor 05',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_06, {
			episode: 1,
			file: 'map/episode_01_floor_06.map',
			floor: 6,
			title: 'Episode 01: Floor 06',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_07, {
			episode: 1,
			file: 'map/episode_01_floor_07.map',
			floor: 7,
			title: 'Episode 01: Floor 07',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_08, {
			episode: 1,
			file: 'map/episode_01_floor_08.map',
			floor: 8,
			title: 'Episode 01: Floor 08',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_09, {
			episode: 1,
			file: 'map/episode_01_floor_09.map',
			floor: 9,
			title: 'Episode 01: Floor 09',
		});
		assetsMaps.set(AssetIdMap.EPISODE_01_FLOOR_10, {
			episode: 1,
			file: 'map/episode_01_floor_10.map',
			floor: 10,
			title: 'Episode 01: Floor 10',
		});
	}

	/**
	 * Assets: Images
	 */
	if (audioOnly !== true) {
		/**
		 * Assets: Images - Sprites
		 */
		assetsImages.set(AssetIdImg.NULL, {
			alpha: true,
			author: 'tknight-dev',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/null.png',
			title: 'Null',
		});

		assetsImages.set(AssetIdImg.SPRITE_AMMO, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/ammo.png',
			title: 'Ammo',
		});

		assetsImages.set(AssetIdImg.SPRITE_AMMO_DROPPED, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/ammo_dropped.png',
			hide: true,
			title: 'Ammo Dropped',
		});

		assetsImages.set(AssetIdImg.SPRITE_ARMOR, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/armor.png',
			title: 'Armor',
		});

		assetsImages.set(AssetIdImg.SPRITE_BARREL_GREEN, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/barrel_green.png',
			title: 'Barrel Green',
		});

		assetsImages.set(AssetIdImg.SPRITE_BARREL_WOOD, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/barrel_wood.png',
			title: 'Barrel Wood',
		});

		assetsImages.set(AssetIdImg.SPRITE_BASKET, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/basket.png',
			title: 'Basket',
		});

		assetsImages.set(AssetIdImg.SPRITE_BED, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bed.png',
			title: 'Bed',
		});

		assetsImages.set(AssetIdImg.SPRITE_BLOOD, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/blood.png',
			title: 'Blood',
		});

		assetsImages.set(AssetIdImg.SPRITE_BONE_PILE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bone_pile.png',
			title: 'Bone Pile',
		});

		assetsImages.set(AssetIdImg.SPRITE_BONE_RUBISH_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bone_rubish_1.png',
			title: 'Bone Rubish 1',
		});

		assetsImages.set(AssetIdImg.SPRITE_BONE_RUBISH_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bone_rubish_2.png',
			title: 'Bone Rubish 2',
		});

		assetsImages.set(AssetIdImg.SPRITE_BONE_RUBISH_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bone_rubish_3.png',
			title: 'Bone Rubish 3',
		});

		assetsImages.set(AssetIdImg.SPRITE_CAGE, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/cage.png',
			title: 'Cage',
		});

		assetsImages.set(AssetIdImg.SPRITE_CAGE_SKELETON, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/cage_skeleton.png',
			title: 'Cage Skeleton',
		});

		assetsImages.set(AssetIdImg.SPRITE_ELEVATOR_DOOR, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/elevator_door.png',
			title: 'Elevator Door',
		});

		assetsImages.set(AssetIdImg.SPRITE_EXTRA_LIFE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/extra_life.png',
			title: 'Extra Life',
		});

		assetsImages.set(AssetIdImg.SPRITE_FAUCET, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/faucet.png',
			title: 'Faucet',
		});

		assetsImages.set(AssetIdImg.SPRITE_FLAG, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/flag.png',
			title: 'Flag',
		});

		assetsImages.set(AssetIdImg.SPRITE_FOOD, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/food.png',
			title: 'Food',
		});

		assetsImages.set(AssetIdImg.SPRITE_FOOD_DOG, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/food_dog.png',
			title: 'Food (Dog)',
		});

		assetsImages.set(AssetIdImg.SPRITE_FURNACE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/furnace.png',
			title: 'Furnace',
		});

		assetsImages.set(AssetIdImg.SPRITE_GUARD_CORPSE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/character/guard/corpse.png',
			title: 'Guard Corpse',
		});

		assetsImages.set(AssetIdImg.SPRITE_KEY1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/key_1.png',
			title: 'Key 1',
		});

		assetsImages.set(AssetIdImg.SPRITE_KEY2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/key_2.png',
			title: 'Key 2',
		});

		assetsImages.set(AssetIdImg.SPRITE_KITCHEN_UTENSILS_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/kitchen_utensils.png',
			title: 'Kitchen Utensils 1',
		});

		assetsImages.set(AssetIdImg.SPRITE_KITCHEN_UTENSILS_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/kitchen_utensils2.png',
			title: 'Kitchen Utensils 2',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_CEILING_OFF, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_ceiling_off.png',
			title: 'Light Ceiling Off',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_CEILING_ON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_ceiling_on.png',
			title: 'Light Ceiling On',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_CHANDELIER_OFF, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_chandelier_off.png',
			title: 'Light Chandelier Off',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_CHANDELIER_ON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_chandelier_on.png',
			title: 'Light Chandelier On',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_FLOOR_OFF, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_floor_off.png',
			title: 'Light Floor Off',
		});

		assetsImages.set(AssetIdImg.SPRITE_LIGHT_FLOOR_ON, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.LIGHT,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/light_floor_on.png',
			title: 'Light Floor On',
		});

		assetsImages.set(AssetIdImg.SPRITE_MACHINE_GUN, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/machine_gun.png',
			title: 'Machine Gun',
		});

		assetsImages.set(AssetIdImg.SPRITE_MEDKIT, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/medkit.png',
			title: 'Medkit',
		});

		assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/metal_door.png',
			title: 'Metal Door',
		});

		assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR_INSIDE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/metal_door_inside.png',
			hide: true,
			title: 'Metal Door Inside',
		});

		assetsImages.set(AssetIdImg.SPRITE_METAL_LOCKED, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/metal_door_locked.png',
			title: 'Metal Door Locked',
		});

		assetsImages.set(AssetIdImg.SPRITE_PILLAR_STONE, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/pillar_stone.png',
			title: 'Pillar Stone',
		});

		assetsImages.set(AssetIdImg.SPRITE_POTTED_PLANT, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/potted_plant.png',
			title: 'Potted Plant',
		});

		assetsImages.set(AssetIdImg.SPRITE_POTTED_TREE, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/potted_tree.png',
			title: 'Potted Tree',
		});

		assetsImages.set(AssetIdImg.SPRITE_SKELETON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/skeleton.png',
			title: 'Skeleton',
		});

		assetsImages.set(AssetIdImg.SPRITE_SKELETON_BLOOD, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/skeleton_blood.png',
			title: 'Skeleton Blood',
		});

		assetsImages.set(AssetIdImg.SPRITE_SKELETON_HANGING, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/skeleton_hanging.png',
			title: 'Skeleton Hanging',
		});

		assetsImages.set(AssetIdImg.SPRITE_SPEARS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/spears.png',
			title: 'Spears',
		});

		assetsImages.set(AssetIdImg.SPRITE_SUB_MACHINE_GUN, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/sub_machine_gun.png',
			title: 'Sub Machine Gun',
		});

		assetsImages.set(AssetIdImg.SPRITE_TABLE, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/table.png',
			title: 'Table',
		});

		assetsImages.set(AssetIdImg.SPRITE_TABLE_CHAIRS, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/table_chairs.png',
			title: 'Table Chairs',
		});

		assetsImages.set(AssetIdImg.SPRITE_TREASURE_CHEST, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/treasure_chest.png',
			title: 'Treasure Chest',
		});

		assetsImages.set(AssetIdImg.SPRITE_TREASURE_CROSS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/treasure_cross.png',
			title: 'Treasure Cross',
		});

		assetsImages.set(AssetIdImg.SPRITE_TREASURE_CUP, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/treasure_cup.png',
			title: 'Treasure Cup',
		});

		assetsImages.set(AssetIdImg.SPRITE_TREASURE_CROWN, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/treasure_crown.png',
			title: 'Treasure Crown',
		});

		assetsImages.set(AssetIdImg.SPRITE_VASE, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/vase.png',
			title: 'Vase',
		});

		assetsImages.set(AssetIdImg.SPRITE_VINES, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/vines.png',
			title: 'Vines',
		});

		assetsImages.set(AssetIdImg.SPRITE_WATER, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/water.png',
			title: 'Water',
		});

		assetsImages.set(AssetIdImg.SPRITE_WELL_EMPTY, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/well_empty.png',
			title: 'Well Empty',
		});

		assetsImages.set(AssetIdImg.SPRITE_WELL_WATER, {
			alpha: true,
			author: 'Id Software',
			blocking: true,
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/well_water.png',
			title: 'Well Water',
		});

		/**
		 * Assets: Images - Menu
		 */

		assetsImageMenus.set(AssetIdImgMenu.CREDITS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/credits.png',
			title: 'Credits',
		});

		assetsImageMenus.set(AssetIdImgMenu.BANNER_BAR, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/bar.png',
			title: 'Bar',
		});

		assetsImageMenus.set(AssetIdImgMenu.BANNER_GAME_LOAD, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/game_load.png',
			title: 'Game Load',
		});

		assetsImageMenus.set(AssetIdImgMenu.BANNER_GAME_SAVE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/game_save.png',
			title: 'Game Save',
		});

		assetsImageMenus.set(AssetIdImgMenu.BANNER_OPTIONS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/options.png',
			title: 'Options',
		});

		assetsImageMenus.set(AssetIdImgMenu.DIFFICULTY_EASY, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/difficulty_easy.png',
			title: 'Difficulty Easy',
		});

		assetsImageMenus.set(AssetIdImgMenu.DIFFICULTY_NORMAL, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/difficulty_normal.png',
			title: 'Difficulty Normal',
		});

		assetsImageMenus.set(AssetIdImgMenu.DIFFICULTY_HARD, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/difficulty_hard.png',
			title: 'Difficulty Hard',
		});

		assetsImageMenus.set(AssetIdImgMenu.DIFFICULTY_INSANE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/difficulty_insane.png',
			title: 'Difficulty Insane',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_PISTOL_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/end_level_pistol1.png',
			title: 'End Level Pistol 1',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_PISTOL_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/end_level_pistol2.png',
			title: 'End Level Pistol 2',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_0, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/0.png',
			title: 'End Level Font 0',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/1.png',
			title: 'End Level Font 1',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/2.png',
			title: 'End Level Font 2',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/3.png',
			title: 'End Level Font 3',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/4.png',
			title: 'End Level Font 4',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/5.png',
			title: 'End Level Font 5',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_6, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/6.png',
			title: 'End Level Font 6',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_7, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/7.png',
			title: 'End Level Font 7',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_8, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/8.png',
			title: 'End Level Font 8',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_9, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/9.png',
			title: 'End Level Font 9',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_A, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/a.png',
			title: 'End Level Font A',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_APOSTROPHE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/apostrophe.png',
			title: 'End Level Font Apostrophe',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_B, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/b.png',
			title: 'End Level Font B',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_C, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/c.png',
			title: 'End Level Font C',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_COLON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/colon.png',
			title: 'End Level Font Colon',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_D, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/d.png',
			title: 'End Level Font D',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_E, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/e.png',
			title: 'End Level Font E',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_EXCLAMATION, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/exclamation.png',
			title: 'End Level Font Exclamation',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_F, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/f.png',
			title: 'End Level Font F',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_G, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/g.png',
			title: 'End Level Font G',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_H, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/h.png',
			title: 'End Level Font H',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_HYPHON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/hyphon.png',
			title: 'End Level Font Hyphon',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_I, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/i.png',
			title: 'End Level Font I',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_J, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/j.png',
			title: 'End Level Font J',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_K, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/k.png',
			title: 'End Level Font K',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_L, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/l.png',
			title: 'End Level Font L',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_M, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/m.png',
			title: 'End Level Font M',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_N, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/n.png',
			title: 'End Level Font N',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_O, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/o.png',
			title: 'End Level Font O',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_P, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/p.png',
			title: 'End Level Font P',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_PERCENT, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/percent.png',
			title: 'End Level Font Percent',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_Q, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/q.png',
			title: 'End Level Font Q',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_R, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/r.png',
			title: 'End Level Font R',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_S, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/s.png',
			title: 'End Level Font S',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_T, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/t.png',
			title: 'End Level Font T',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_U, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/u.png',
			title: 'End Level Font U',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_V, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/v.png',
			title: 'End Level Font V',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_W, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/w.png',
			title: 'End Level Font W',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_X, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/x.png',
			title: 'End Level Font X',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_Y, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/y.png',
			title: 'End Level Font Y',
		});

		assetsImageMenus.set(AssetIdImgMenu.END_FLOOR_FONT_Z, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/end_level/z.png',
			title: 'End Level Font Z',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode1.png',
			title: 'Episode 1',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode2.png',
			title: 'Episode 2',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode3.png',
			title: 'Episode 3',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode4.png',
			title: 'Episode 4',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode5.png',
			title: 'Episode 5',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_6, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode6.png',
			title: 'Episode 6',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_END_DOUBLE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode_end_double.png',
			title: 'Episode End Double',
		});

		assetsImageMenus.set(AssetIdImgMenu.EPISODE_END_SINGLE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/episode_end_single.png',
			title: 'Episode End Single',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_AMMO, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/hud/ammo.png',
			title: 'HUD Ammo',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_0, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/0.png',
			title: 'HUD Font 0',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/1.png',
			title: 'HUD Font 1',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/2.png',
			title: 'HUD Font 2',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/3.png',
			title: 'HUD Font 3',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/4.png',
			title: 'HUD Font 4',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/5.png',
			title: 'HUD Font 5',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_6, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/6.png',
			title: 'HUD Font 6',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_7, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/7.png',
			title: 'HUD Font 7',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_8, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/8.png',
			title: 'HUD Font 8',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_9, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/9.png',
			title: 'HUD Font 9',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_FONT_PERCENT, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/font/hud/percent.png',
			title: 'HUD Font Percent',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_HEALTH, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/hud/health.png',
			title: 'HUD Health',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_KEY_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/hud/key_1.png',
			title: 'HUD Key 1',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_KEY_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/hud/key_2.png',
			title: 'HUD Key 2',
		});

		assetsImageMenus.set(AssetIdImgMenu.HUD_LIVES, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/hud/lives.png',
			title: 'HUD Lives',
		});

		assetsImageMenus.set(AssetIdImgMenu.GET_PSYCHED, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/get_psyched.png',
			title: 'Get Psyched!',
		});

		assetsImageMenus.set(AssetIdImgMenu.KEYS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/keys.png',
			title: 'Menu Keys',
		});

		assetsImageMenus.set(AssetIdImgMenu.MENU_PISTOL, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/menu_pistol.png',
			title: 'Menu Pistol',
		});

		assetsImageMenus.set(AssetIdImgMenu.RATING, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/rating.png',
			title: 'Rating',
		});

		assetsImageMenus.set(AssetIdImgMenu.SCREEN_STATS, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/screen_stats.png',
			title: 'Screen Stats',
		});

		assetsImageMenus.set(AssetIdImgMenu.SCREEN_TITLE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/screen_title.png',
			title: 'Screen Title',
		});

		assetsImageMenus.set(AssetIdImgMenu.WEAPONS_BACKGROUND, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/weapons_background.png',
			title: 'Weapons Background',
		});

		assetsImageMenus.set(AssetIdImgMenu.WEAPONS_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/weapon_knife.png',
			title: 'Weapon Knife',
		});

		assetsImageMenus.set(AssetIdImgMenu.WEAPONS_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/weapon_pistol.png',
			title: 'Weapon Pistol',
		});

		assetsImageMenus.set(AssetIdImgMenu.WEAPONS_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/weapon_sub_machine_gun.png',
			title: 'Weapon Sub Machine Gun',
		});

		assetsImageMenus.set(AssetIdImgMenu.WEAPONS_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.MENU,
			ext: AssetExtImg.PNG,
			file: 'img/menu/weapon_machine_gun.png',
			title: 'Weapon Machine Gun',
		});

		/**
		 * Assets: Menu Fonts
		 */

		assetsImageMenusFontEndLevel.set('0', AssetIdImgMenu.END_FLOOR_FONT_0);
		assetsImageMenusFontEndLevel.set('1', AssetIdImgMenu.END_FLOOR_FONT_1);
		assetsImageMenusFontEndLevel.set('2', AssetIdImgMenu.END_FLOOR_FONT_2);
		assetsImageMenusFontEndLevel.set('3', AssetIdImgMenu.END_FLOOR_FONT_3);
		assetsImageMenusFontEndLevel.set('4', AssetIdImgMenu.END_FLOOR_FONT_4);
		assetsImageMenusFontEndLevel.set('5', AssetIdImgMenu.END_FLOOR_FONT_5);
		assetsImageMenusFontEndLevel.set('6', AssetIdImgMenu.END_FLOOR_FONT_6);
		assetsImageMenusFontEndLevel.set('7', AssetIdImgMenu.END_FLOOR_FONT_7);
		assetsImageMenusFontEndLevel.set('8', AssetIdImgMenu.END_FLOOR_FONT_8);
		assetsImageMenusFontEndLevel.set('9', AssetIdImgMenu.END_FLOOR_FONT_9);
		assetsImageMenusFontEndLevel.set('a', AssetIdImgMenu.END_FLOOR_FONT_A);
		assetsImageMenusFontEndLevel.set("'", AssetIdImgMenu.END_FLOOR_FONT_APOSTROPHE);
		assetsImageMenusFontEndLevel.set('b', AssetIdImgMenu.END_FLOOR_FONT_B);
		assetsImageMenusFontEndLevel.set('c', AssetIdImgMenu.END_FLOOR_FONT_C);
		assetsImageMenusFontEndLevel.set(':', AssetIdImgMenu.END_FLOOR_FONT_COLON);
		assetsImageMenusFontEndLevel.set('d', AssetIdImgMenu.END_FLOOR_FONT_D);
		assetsImageMenusFontEndLevel.set('e', AssetIdImgMenu.END_FLOOR_FONT_E);
		assetsImageMenusFontEndLevel.set('!', AssetIdImgMenu.END_FLOOR_FONT_EXCLAMATION);
		assetsImageMenusFontEndLevel.set('f', AssetIdImgMenu.END_FLOOR_FONT_F);
		assetsImageMenusFontEndLevel.set('g', AssetIdImgMenu.END_FLOOR_FONT_G);
		assetsImageMenusFontEndLevel.set('h', AssetIdImgMenu.END_FLOOR_FONT_H);
		assetsImageMenusFontEndLevel.set('-', AssetIdImgMenu.END_FLOOR_FONT_HYPHON);
		assetsImageMenusFontEndLevel.set('i', AssetIdImgMenu.END_FLOOR_FONT_I);
		assetsImageMenusFontEndLevel.set('j', AssetIdImgMenu.END_FLOOR_FONT_J);
		assetsImageMenusFontEndLevel.set('k', AssetIdImgMenu.END_FLOOR_FONT_K);
		assetsImageMenusFontEndLevel.set('l', AssetIdImgMenu.END_FLOOR_FONT_L);
		assetsImageMenusFontEndLevel.set('m', AssetIdImgMenu.END_FLOOR_FONT_M);
		assetsImageMenusFontEndLevel.set('n', AssetIdImgMenu.END_FLOOR_FONT_N);
		assetsImageMenusFontEndLevel.set('o', AssetIdImgMenu.END_FLOOR_FONT_O);
		assetsImageMenusFontEndLevel.set('p', AssetIdImgMenu.END_FLOOR_FONT_P);
		assetsImageMenusFontEndLevel.set('%', AssetIdImgMenu.END_FLOOR_FONT_PERCENT);
		assetsImageMenusFontEndLevel.set('q', AssetIdImgMenu.END_FLOOR_FONT_Q);
		assetsImageMenusFontEndLevel.set('r', AssetIdImgMenu.END_FLOOR_FONT_R);
		assetsImageMenusFontEndLevel.set('s', AssetIdImgMenu.END_FLOOR_FONT_S);
		assetsImageMenusFontEndLevel.set('t', AssetIdImgMenu.END_FLOOR_FONT_T);
		assetsImageMenusFontEndLevel.set('u', AssetIdImgMenu.END_FLOOR_FONT_U);
		assetsImageMenusFontEndLevel.set('v', AssetIdImgMenu.END_FLOOR_FONT_V);
		assetsImageMenusFontEndLevel.set('w', AssetIdImgMenu.END_FLOOR_FONT_W);
		assetsImageMenusFontEndLevel.set('x', AssetIdImgMenu.END_FLOOR_FONT_X);
		assetsImageMenusFontEndLevel.set('y', AssetIdImgMenu.END_FLOOR_FONT_Y);
		assetsImageMenusFontEndLevel.set('z', AssetIdImgMenu.END_FLOOR_FONT_Z);

		assetsImageMenusFontHUD.set('0', AssetIdImgMenu.HUD_FONT_0);
		assetsImageMenusFontHUD.set('1', AssetIdImgMenu.HUD_FONT_1);
		assetsImageMenusFontHUD.set('2', AssetIdImgMenu.HUD_FONT_2);
		assetsImageMenusFontHUD.set('3', AssetIdImgMenu.HUD_FONT_3);
		assetsImageMenusFontHUD.set('4', AssetIdImgMenu.HUD_FONT_4);
		assetsImageMenusFontHUD.set('5', AssetIdImgMenu.HUD_FONT_5);
		assetsImageMenusFontHUD.set('6', AssetIdImgMenu.HUD_FONT_6);
		assetsImageMenusFontHUD.set('7', AssetIdImgMenu.HUD_FONT_7);
		assetsImageMenusFontHUD.set('8', AssetIdImgMenu.HUD_FONT_8);
		assetsImageMenusFontHUD.set('9', AssetIdImgMenu.HUD_FONT_9);
		assetsImageMenusFontHUD.set('%', AssetIdImgMenu.HUD_FONT_PERCENT);

		/**
		 * Assets: Images - Tags
		 */
		assetsImages.set(AssetIdImg.MISC_X, {
			alpha: true,
			category: AssetImgCategory.TAG,
			ext: AssetExtImg.PNG,
			file: 'img/misc/x.png',
			hide: true,
			title: 'X',
		});

		/**
		 * Assets: Images - Walls
		 */

		assetsImages.set(AssetIdImg.WALL_BRICK_BLUE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_blue.png',
			title: 'Brick Blue',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_BLUE2, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_blue2.png',
			title: 'Brick Blue2',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_BLUE_CELL, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_blue_cell.png',
			title: 'Brick Blue Cell',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_BLUE_CELL_SKELETON, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_blue_cell_skeleton.png',
			title: 'Brick Blue Cell Skeleton',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_RED, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_red.png',
			title: 'Brick Red',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_RED_EAGLE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_red_eagle.png',
			title: 'Brick Red Eagle',
		});

		assetsImages.set(AssetIdImg.WALL_BRICK_RED_LAURAL, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/brick_red_laural.png',
			title: 'Brick Red Laural',
		});

		assetsImages.set(AssetIdImg.WALL_ELEVATOR_SIDE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/elevator_side.png',
			title: 'Elevator Side',
		});

		assetsImages.set(AssetIdImg.WALL_ELEVATOR_SWITCH_DOWN, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/wall/elevator_switch_down.png',
			title: 'Switch Down',
		});

		assetsImages.set(AssetIdImg.WALL_ELEVATOR_SWITCH_UP, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/wall/elevator_switch_up.png',
			title: 'Switch Up',
		});

		assetsImages.set(AssetIdImg.WALL_METAL, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/metal.png',
			title: 'Metal',
		});

		assetsImages.set(AssetIdImg.WALL_METAL_ACHTUNG, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/metal_achtung.png',
			title: 'Metal Auchtung',
		});

		assetsImages.set(AssetIdImg.WALL_METAL_VERBOTEM, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/metal_verbotem.png',
			title: 'Metal Verbotem',
		});

		assetsImages.set(AssetIdImg.WALL_OUTSIDE_DAY, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/outside_day.png',
			title: 'Outside Day',
		});

		assetsImages.set(AssetIdImg.WALL_OUTSIDE_NIGHT, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/outside_night.png',
			title: 'Outside Night',
		});

		assetsImages.set(AssetIdImg.WALL_ROCK_PURPLE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/rock_purple.png',
			title: 'Rock Purple',
		});

		assetsImages.set(AssetIdImg.WALL_ROCK_PURPLE_BLOOD, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/rock_purple_blood.png',
			title: 'Rock Purple Blood',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey.png',
			title: 'Stone Grey',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY2, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey2.png',
			title: 'Stone Grey2',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY_EAGLE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey_eagle.png',
			title: 'Stone Grey Eagle',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY_FLAG, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey_flag.png',
			title: 'Stone Grey Flag',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY_HITLER, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey_hitler.png',
			title: 'Stone Grey Hitler',
		});

		assetsImages.set(AssetIdImg.WALL_STONE_GREY_SIGN_VERBOTEM, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey_sign_verbotem.png',
			title: 'Stone Grey Sign Verbotem',
		});

		assetsImages.set(AssetIdImg.WALL_WOOD, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/wood.png',
			title: 'Wood',
		});

		assetsImages.set(AssetIdImg.WALL_WOOD_EAGLE, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/wood_eagle.png',
			title: 'Wood',
		});

		assetsImages.set(AssetIdImg.WALL_WOOD_HITLER, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/wood_hitler.png',
			title: 'Wood',
		});

		/**
		 * Assets: Images - Waypoints
		 */

		assetsImages.set(AssetIdImg.MISC_ARROW_EAST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_e.png',
			title: 'Arrow (East)',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_NORTH, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_n.png',
			title: 'Arrow (North)',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_NORTH_EAST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_ne.png',
			title: 'Arrow (North East)',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_NORTH_WEST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_nw.png',
			title: 'Arrow: North West',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_SOUTH, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_s.png',
			title: 'Arrow: South',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_SOUTH_EAST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_se.png',
			title: 'Arrow: South East',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_SOUTH_WEST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_sw.png',
			title: 'Arrow: South West',
		});
		assetsImages.set(AssetIdImg.MISC_ARROW_WEST, {
			alpha: true,
			category: AssetImgCategory.WAYPOINT,
			ext: AssetExtImg.PNG,
			file: 'img/misc/arrow_w.png',
			title: 'Arrow: West',
		});

		/**
		 * Assets: Images - Weapons
		 */

		assetsImages.set(AssetIdImg.WEAPON_KNIFE_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/knife_1.png',
			title: 'Knife 1',
		});

		assetsImages.set(AssetIdImg.WEAPON_KNIFE_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/knife_2.png',
			title: 'Knife 2',
		});

		assetsImages.set(AssetIdImg.WEAPON_KNIFE_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/knife_3.png',
			title: 'Knife 3',
		});

		assetsImages.set(AssetIdImg.WEAPON_KNIFE_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/knife_4.png',
			title: 'Knife 4',
		});

		assetsImages.set(AssetIdImg.WEAPON_KNIFE_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/knife_5.png',
			title: 'Knife 5',
		});

		assetsImages.set(AssetIdImg.WEAPON_MACHINE_GUN_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/machine_gun_1.png',
			title: 'Machine Gun 1',
		});

		assetsImages.set(AssetIdImg.WEAPON_MACHINE_GUN_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/machine_gun_2.png',
			title: 'Machine Gun 2',
		});

		assetsImages.set(AssetIdImg.WEAPON_MACHINE_GUN_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/machine_gun_3.png',
			title: 'Machine Gun 3',
		});

		assetsImages.set(AssetIdImg.WEAPON_MACHINE_GUN_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/machine_gun_4.png',
			title: 'Machine Gun 4',
		});

		assetsImages.set(AssetIdImg.WEAPON_MACHINE_GUN_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/machine_gun_5.png',
			title: 'Machine Gun 5',
		});

		assetsImages.set(AssetIdImg.WEAPON_PISTOL_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/pistol_1.png',
			title: 'Pistol 1',
		});

		assetsImages.set(AssetIdImg.WEAPON_PISTOL_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/pistol_2.png',
			title: 'Pistol 2',
		});

		assetsImages.set(AssetIdImg.WEAPON_PISTOL_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/pistol_3.png',
			title: 'Pistol 3',
		});

		assetsImages.set(AssetIdImg.WEAPON_PISTOL_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/pistol_4.png',
			title: 'Pistol 4',
		});

		assetsImages.set(AssetIdImg.WEAPON_PISTOL_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/pistol_5.png',
			title: 'Pistol 5',
		});

		assetsImages.set(AssetIdImg.WEAPON_SUB_MACHINE_GUN_1, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/sub_machine_gun_1.png',
			title: 'Sub Machine Gun 1',
		});

		assetsImages.set(AssetIdImg.WEAPON_SUB_MACHINE_GUN_2, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/sub_machine_gun_2.png',
			title: 'Sub Machine Gun 2',
		});

		assetsImages.set(AssetIdImg.WEAPON_SUB_MACHINE_GUN_3, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/sub_machine_gun_3.png',
			title: 'Sub Machine Gun 3',
		});

		assetsImages.set(AssetIdImg.WEAPON_SUB_MACHINE_GUN_4, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/sub_machine_gun_4.png',
			title: 'Sub Machine Gun 4',
		});

		assetsImages.set(AssetIdImg.WEAPON_SUB_MACHINE_GUN_5, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.WEAPON,
			ext: AssetExtImg.PNG,
			file: 'img/weapon/sub_machine_gun_5.png',
			title: 'Sub Machine Gun 5',
		});
	}
};
