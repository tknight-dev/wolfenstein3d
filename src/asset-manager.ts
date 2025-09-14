import * as JSZip from 'jszip';
import { GameMap } from './models/game.model.js';
import { GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';

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
		blob: Blob,
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
			gameMap.grid = GamingCanvasGridUint16Array.from(<Uint16Array>gameMap.grid.data);

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
	AUDIO_EFFECT_AMMO = 0,
	AUDIO_EFFECT_DOOR_CLOSE = 1,
	AUDIO_EFFECT_DOOR_OPEN = 2,
	AUDIO_EFFECT_EXTRA_LIFE = 3,
	AUDIO_EFFECT_FOOD = 4,
	AUDIO_EFFECT_GUARD_DEATH = 5,
	AUDIO_EFFECT_GUARD_DEATH2 = 6,
	AUDIO_EFFECT_GUARD_FIRE = 7,
	AUDIO_EFFECT_GUARD_SURPRISE = 8,
	AUDIO_EFFECT_MACHINE_GUN_FIRE = 9,
	AUDIO_EFFECT_PISTOL_FIRE = 10,
	AUDIO_EFFECT_SWITCH = 11,
	AUDIO_EFFECT_TREASURE_CHEST = 12,
	AUDIO_EFFECT_TREASURE_CROSS = 13,
	AUDIO_EFFECT_TREASURE_CROWN = 14,
	AUDIO_EFFECT_TREASURE_CUP = 15,
	AUDIO_EFFECT_WALL_HIT = 16,
	AUDIO_EFFECT_WALL_MOVE = 17,
	AUDIO_MUSIC_LVL1 = 18,
	AUDIO_MUSIC_MENU = 19,
	AUDIO_MUSIC_MENU_INTRO = 20,
}

export enum AssetIdImg {
	NULL = 0,
	SPRITE_ELEVATOR_DOOR = 1, // Extended AssetId
	SPRITE_METAL_DOOR = 2, // Extended AssetId
	SPRITE_METAL_DOOR_LOCKED = 3, // Extended AssetId
	WALL_ELEVATOR_SWITCH_UP = 4, // Extended AssetId
	WALL_ELEVATOR_SWITCH_DOWN = 5, // Extended AssetId
	EXTENDED_RESERVED6 = 6, // Extended AssetId
	EXTENDED_RESERVED7 = 7, // Extended AssetId
	SPRITE_AMMO = 57,
	SPRITE_ARMOR = 58,
	SPRITE_BARREL_GREEN = 59,
	SPRITE_BARREL_WOOD = 60,
	SPRITE_BASKET = 61,
	SPRITE_BONE_PILE = 62,
	SPRITE_EXTRA_LIFE = 63,
	SPRITE_FLAG = 8,
	SPRITE_FOOD = 9,
	SPRITE_FOOD_DOG = 10,
	SPRITE_GUARD_CORPSE = 56,
	SPRITE_LIGHT_CEILING_OFF = 11,
	SPRITE_LIGHT_CEILING_ON = 12,
	SPRITE_LIGHT_CHANDELIER_OFF = 13,
	SPRITE_LIGHT_CHANDELIER_ON = 14,
	SPRITE_LIGHT_FLOOR_OFF = 15,
	SPRITE_LIGHT_FLOOR_ON = 16,
	SPRITE_MEDKIT = 17,
	SPRITE_VINES = 18,
	SPRITE_METAL_DOOR_INSIDE = 19,
	// SPRITE_METAL_DOOR_INSIDE2 = 20,
	// SPRITE_METAL_DOOR_LOCKED = 21,
	SPRITE_POTTED_PLANT = 22,
	SPRITE_POTTED_TREE = 23,
	SPRITE_RIFLE = 24,
	SPRITE_SKELETON = 25,
	SPRITE_TABLE = 26,
	SPRITE_TABLE_CHAIRS = 27,
	SPRITE_TREASURE_CHEST = 28,
	SPRITE_TREASURE_CROSS = 29,
	SPRITE_TREASURE_CROWN = 30,
	SPRITE_TREASURE_CUP = 31,
	SPRITE_VASE = 32,
	SPRITE_WATER = 33,
	SPRITE_WELL_WATER = 34,
	SPRITE_WELL_EMPTY = 35,
	WALL_BRICK_BLUE = 36,
	WALL_BRICK_BLUE2 = 37,
	WALL_BRICK_BLUE_CELL = 38,
	WALL_BRICK_BLUE_CELL_SKELETON = 39,
	// SPRITE_ELEVATOR_DOOR = 40,
	WALL_ELEVATOR_SIDE = 41,
	// WALL_ELEVATOR_SWITCH_UP = 42,
	// WALL_ELEVATOR_SWITCH_DOWN = 43,
	WALL_OUTSIDE_DAY = 44,
	WALL_OUTSIDE_NIGHT = 45,
	WALL_STONE_GREY = 46,
	WALL_STONE_GREY2 = 47,
	WALL_STONE_GREY3 = 48,
	WALL_STONE_GREY_EAGLE = 49,
	WALL_STONE_GREY_FLAG = 50,
	WALL_STONE_GREY_HITLER = 51,
	WALL_STONE_GREY_SIGN_VERBOTEM = 52,
	WALL_WOOD = 53,
	WALL_WOOD_EAGLE = 54,
	WALL_WOOD_HITLER = 55,
}

export enum AssetIdImgCharacter {
	AIM = 0,
	CORPSE = 1,
	DIE1 = 2,
	DIE2 = 3,
	DIE3 = 4,
	DIE4 = 5,
	FIRE = 6,
	HIT = 7,
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

export const assetIdImgCharacterMenu: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.MOVE1_S,
	AssetIdImgCharacter.STAND_S,
	AssetIdImgCharacter.MOVE1_SW,
	AssetIdImgCharacter.STAND_SW,
	AssetIdImgCharacter.MOVE1_W,
	AssetIdImgCharacter.STAND_W,
	AssetIdImgCharacter.MOVE1_NW,
	AssetIdImgCharacter.STAND_NW,
	AssetIdImgCharacter.MOVE1_N,
	AssetIdImgCharacter.STAND_N,
	AssetIdImgCharacter.MOVE1_NE,
	AssetIdImgCharacter.STAND_NE,
	AssetIdImgCharacter.MOVE1_E,
	AssetIdImgCharacter.STAND_E,
	AssetIdImgCharacter.MOVE1_SE,
	AssetIdImgCharacter.STAND_SE,
];

export const assetIdImgCharacterMovementE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_E,
	AssetIdImgCharacter.MOVE1_E,
	AssetIdImgCharacter.MOVE2_E,
	AssetIdImgCharacter.MOVE3_E,
	AssetIdImgCharacter.MOVE4_E,
];

export const assetIdImgCharacterMovementN: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_N,
	AssetIdImgCharacter.MOVE1_N,
	AssetIdImgCharacter.MOVE2_N,
	AssetIdImgCharacter.MOVE3_N,
	AssetIdImgCharacter.MOVE4_N,
];

export const assetIdImgCharacterMovementNE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_NE,
	AssetIdImgCharacter.MOVE1_NE,
	AssetIdImgCharacter.MOVE2_NE,
	AssetIdImgCharacter.MOVE3_NE,
	AssetIdImgCharacter.MOVE4_NE,
];

export const assetIdImgCharacterMovementNW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_NW,
	AssetIdImgCharacter.MOVE1_NW,
	AssetIdImgCharacter.MOVE2_NW,
	AssetIdImgCharacter.MOVE3_NW,
	AssetIdImgCharacter.MOVE4_NW,
];

export const assetIdImgCharacterMovementS: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_S,
	AssetIdImgCharacter.MOVE1_S,
	AssetIdImgCharacter.MOVE2_S,
	AssetIdImgCharacter.MOVE3_S,
	AssetIdImgCharacter.MOVE4_S,
];

export const assetIdImgCharacterMovementSE: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_SE,
	AssetIdImgCharacter.MOVE1_SE,
	AssetIdImgCharacter.MOVE2_SE,
	AssetIdImgCharacter.MOVE3_SE,
	AssetIdImgCharacter.MOVE4_SE,
];

export const assetIdImgCharacterMovementSW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_SW,
	AssetIdImgCharacter.MOVE1_SW,
	AssetIdImgCharacter.MOVE2_SW,
	AssetIdImgCharacter.MOVE3_SW,
	AssetIdImgCharacter.MOVE4_SW,
];

export const assetIdImgCharacterMovementW: AssetIdImgCharacter[] = [
	AssetIdImgCharacter.STAND_W,
	AssetIdImgCharacter.MOVE1_W,
	AssetIdImgCharacter.MOVE2_W,
	AssetIdImgCharacter.MOVE3_W,
	AssetIdImgCharacter.MOVE4_W,
];

const assetIdImgCharacterMovementAll: AssetIdImgCharacter[][] = [
	assetIdImgCharacterMovementE,
	assetIdImgCharacterMovementN,
	assetIdImgCharacterMovementNE,
	assetIdImgCharacterMovementNW,
	assetIdImgCharacterMovementS,
	assetIdImgCharacterMovementSE,
	assetIdImgCharacterMovementSW,
	assetIdImgCharacterMovementW,
];
const assetIdImgCharacterMovementAllFilePrefixes: string[] = ['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w'];

export enum AssetIdImgCharacterType {
	GUARD,
}

export enum AssetIdMap {
	EPISODE_01_LEVEL01,
}

export enum AssetImgCategory {
	CHARACTER,
	EXTENDED,
	LIGHT,
	SPRITE,
	SPRITE_PICKUP,
	WALL,
}

interface AssetProperties {
	author?: string;
	file: string;
	license?: string;
	title: string;
	URL?: string;
}

export interface AssetPropertiesAudio extends AssetProperties {
	effect: boolean;
	ext: AssetExtAudio;
	volume: number; // 0-1 range for default volume
}

export interface AssetPropertiesCharacter extends AssetPropertiesImage {}

export interface AssetPropertiesImage extends AssetProperties {
	alpha: boolean;
	blocking?: boolean;
	category: AssetImgCategory;
	ext: AssetExtImg;
	hide?: boolean;
}

export interface AssetPropertiesMap extends AssetProperties {
	episode: number;
	level: number;
}

export const assetsAudio: Map<AssetIdAudio, AssetPropertiesAudio> = new Map();
export const assetsImages: Map<AssetIdImg, AssetPropertiesImage> = new Map();
export const assetsImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, AssetPropertiesCharacter>> = new Map();
export const assetsMaps: Map<AssetIdMap, AssetPropertiesMap> = new Map();

export const initializeAssetManager = async (audioOnly?: boolean) => {
	let cAssetIdImgCharacter: AssetIdImgCharacter,
		cDir: string,
		cFilePrefix: string,
		cHide: boolean,
		cI: number,
		cInstance: Map<AssetIdImgCharacter, AssetPropertiesCharacter>,
		cMovement: AssetIdImgCharacter[],
		cName: string;

	if (audioOnly !== true) {
		for (const characterType of Object.values(AssetIdImgCharacterType)) {
			if (typeof characterType !== 'number') {
				continue;
			}

			switch (characterType) {
				case AssetIdImgCharacterType.GUARD:
					cDir = 'guard';
					cHide = false;
					cName = 'Guard';
					break;
			}

			cInstance = new Map();
			assetsImageCharacters.set(characterType, cInstance);

			/**
			 * Standard
			 */

			cInstance.set(AssetIdImgCharacter.AIM, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/aim.png`,
				hide: cHide,
				title: `${cName} Aim`,
			});

			cInstance.set(AssetIdImgCharacter.CORPSE, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/corpse.png`,
				hide: cHide,
				title: `${cName} Corpse`,
			});

			cInstance.set(AssetIdImgCharacter.DIE1, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die1.png`,
				hide: cHide,
				title: `${cName} Die1`,
			});

			cInstance.set(AssetIdImgCharacter.DIE2, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die2.png`,
				hide: cHide,
				title: `${cName} Die2`,
			});

			cInstance.set(AssetIdImgCharacter.DIE3, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die3.png`,
				hide: cHide,
				title: `${cName} Die3`,
			});

			cInstance.set(AssetIdImgCharacter.DIE4, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/die4.png`,
				hide: cHide,
				title: `${cName} Die4`,
			});

			cInstance.set(AssetIdImgCharacter.FIRE, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/fire.png`,
				hide: cHide,
				title: `${cName} Fire`,
			});

			cInstance.set(AssetIdImgCharacter.HIT, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/hit.png`,
				hide: cHide,
				title: `${cName} Hit`,
			});

			cInstance.set(AssetIdImgCharacter.SUPRISE, {
				alpha: true,
				author: 'Id Software',
				category: AssetImgCategory.CHARACTER,
				ext: AssetExtImg.PNG,
				file: `img/character/${cDir}/surprise.png`,
				hide: cHide,
				title: `${cName} Surprise`,
			});

			/**
			 * Movement
			 */
			for ([cI, cMovement] of assetIdImgCharacterMovementAll.entries()) {
				cFilePrefix = assetIdImgCharacterMovementAllFilePrefixes[cI];

				for ([cI, cAssetIdImgCharacter] of cMovement.entries()) {
					cInstance.set(cAssetIdImgCharacter, {
						alpha: true,
						author: 'Id Software',
						category: AssetImgCategory.CHARACTER,
						ext: AssetExtImg.PNG,
						file: `img/character/${cDir}/${cFilePrefix}_${cI === 0 ? 'stand' : `move${cI}`}.png`,
						hide: cHide,
						title: `${cName} ${cI === 0 ? 'Stand' : 'Move'} ${cFilePrefix.toUpperCase()}`,
					});
				}
			}
		}
	}

	/**
	 * Assets: Maps
	 */

	if (audioOnly !== true) {
		assetsMaps.set(AssetIdMap.EPISODE_01_LEVEL01, {
			episode: 1,
			file: 'map/episode_01_level_01.map',
			level: 1,
			title: 'Ammo',
		});
	}

	/**
	 * Assets: Audio - Effects
	 */

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_AMMO, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/ammo.mp3',
		title: 'Ammo',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_DOOR_CLOSE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/door_close.mp3',
		title: 'Door Close',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_DOOR_OPEN, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/door_open.mp3',
		title: 'Door Open',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_EXTRA_LIFE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/extra_life.mp3',
		title: 'Extra Life',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_FOOD, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/food.mp3',
		title: 'Food',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death.mp3',
		title: 'Guard Death',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_DEATH2, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_death2.mp3',
		title: 'Guard Death2',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_FIRE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_fire.mp3',
		title: 'Guard Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_GUARD_SURPRISE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/guard_suprise.mp3',
		title: 'Guard Surprise',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_MACHINE_GUN_FIRE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/machine_gun_fire.mp3',
		title: 'Machine Gun Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_PISTOL_FIRE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/pistol_fire.mp3',
		title: 'Pistol Fire',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_SWITCH, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/switch.mp3',
		title: 'Switch',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CHEST, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_chest.mp3',
		title: 'Treasure Chest',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROSS, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_cross.mp3',
		title: 'Treasure Cross',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CROWN, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_crown.mp3',
		title: 'Treasure Crown',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_TREASURE_CUP, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/treasure_cup.mp3',
		title: 'Treasure Cup',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_WALL_HIT, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/wall_hit.mp3',
		title: 'Wall Hit',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_EFFECT_WALL_MOVE, {
		author: 'Robert Prince',
		effect: true,
		ext: AssetExtAudio.MP3,
		file: 'audio/effect/wall_move.mp3',
		title: 'Wall Move',
		volume: 1,
	});

	/**
	 * Assets: Audio - Music
	 */

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_LVL1, {
		author: 'Robert Prince',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/lvl1.mp3',
		title: 'Get Them Before They Get You',
		volume: 0.6,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_MENU, {
		author: 'Robert Prince',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/menu-music.mp3',
		title: 'Wondering About My Loved Ones',
		volume: 1,
	});

	assetsAudio.set(AssetIdAudio.AUDIO_MUSIC_MENU_INTRO, {
		author: 'Robert Prince',
		effect: false,
		ext: AssetExtAudio.MP3,
		file: 'audio/music/menu-intro.mp3',
		title: 'Horst Wessel Lied',
		volume: 1,
	});

	/**
	 * Assets: Images - Sprites
	 */
	if (audioOnly !== true) {
		assetsImages.set(AssetIdImg.SPRITE_AMMO, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/ammo.png',
			title: 'Ammo',
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

		assetsImages.set(AssetIdImg.SPRITE_BASKET, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/basket.png',
			title: 'Basket',
		});

		assetsImages.set(AssetIdImg.SPRITE_BONE_PILE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/bone_pile.png',
			title: 'Bone Pile',
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

		assetsImages.set(AssetIdImg.SPRITE_GUARD_CORPSE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/character/guard/corpse.png',
			title: 'Guard Corpse',
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

		assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR_LOCKED, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.EXTENDED,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/metal_door_locked.png',
			title: 'Metal Door Locked',
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

		assetsImages.set(AssetIdImg.SPRITE_RIFLE, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE_PICKUP,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/rifle.png',
			title: 'Rifle',
		});

		assetsImages.set(AssetIdImg.SPRITE_SKELETON, {
			alpha: true,
			author: 'Id Software',
			category: AssetImgCategory.SPRITE,
			ext: AssetExtImg.PNG,
			file: 'img/sprite/skeleton.png',
			title: 'Skeleton',
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

		assetsImages.set(AssetIdImg.WALL_STONE_GREY3, {
			alpha: false,
			author: 'Id Software',
			category: AssetImgCategory.WALL,
			ext: AssetExtImg.PNG,
			file: 'img/wall/stone_grey3.png',
			title: 'Stone Grey3',
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
	}
};
