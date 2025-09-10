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
 * @return is dataURL
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
			case AssetExtImg.WEBP:
				dataType = 'image/webp';
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
	WEBP,
}

export enum AssetIdAudio {
	AUDIO_EFFECT_AMMO,
	AUDIO_EFFECT_DOOR_CLOSE,
	AUDIO_EFFECT_DOOR_OPEN,
	AUDIO_EFFECT_EXTRA_LIFE,
	AUDIO_EFFECT_FOOD,
	AUDIO_EFFECT_GUARD_DEATH,
	AUDIO_EFFECT_GUARD_DEATH2,
	AUDIO_EFFECT_GUARD_FIRE,
	AUDIO_EFFECT_GUARD_SURPRISE,
	AUDIO_EFFECT_MACHINE_GUN_FIRE,
	AUDIO_EFFECT_PISTOL_FIRE,
	AUDIO_EFFECT_SWITCH,
	AUDIO_EFFECT_TREASURE_CHEST,
	AUDIO_EFFECT_TREASURE_CROSS,
	AUDIO_EFFECT_TREASURE_CROWN,
	AUDIO_EFFECT_TREASURE_CUP,
	AUDIO_EFFECT_WALL_HIT,
	AUDIO_EFFECT_WALL_MOVE,
	AUDIO_MUSIC_LVL1,
	AUDIO_MUSIC_MENU,
	AUDIO_MUSIC_MENU_INTRO,
}

export enum AssetIdImg {
	NULL = 0,
	SPRITE_AMMO,
	SPRITE_BARREL_GREEN,
	SPRITE_BARREL_WOOD,
	SPRITE_EXTRA_LIFE,
	SPRITE_FLAG,
	SPRITE_FOOD,
	SPRITE_FOOD_DOG,
	SPRITE_LIGHT_CEILING_OFF,
	SPRITE_LIGHT_CEILING_ON,
	SPRITE_LIGHT_CHANDELIER_OFF,
	SPRITE_LIGHT_CHANDELIER_ON,
	SPRITE_LIGHT_FLOOR_OFF,
	SPRITE_LIGHT_FLOOR_ON,
	SPRITE_MEDKIT,
	SPRITE_METAL_DOOR,
	SPRITE_METAL_DOOR_INSIDE,
	SPRITE_METAL_DOOR_INSIDE2,
	SPRITE_METAL_DOOR_LOCKED,
	SPRITE_POTTED_PLANT,
	SPRITE_POTTED_TREE,
	SPRITE_RIFLE,
	SPRITE_TABLE,
	SPRITE_TABLE_CHAIRS,
	SPRITE_TREASURE_CHEST,
	SPRITE_TREASURE_CROSS,
	SPRITE_TREASURE_CROWN,
	SPRITE_TREASURE_CUP,
	SPRITE_VASE,
	SPRITE_WATER,
	SPRITE_WELL_WATER,
	SPRITE_WELL_EMPTY,
	WALL_BRICK_BLUE,
	WALL_BRICK_BLUE2,
	WALL_BRICK_BLUE_CELL,
	WALL_BRICK_BLUE_CELL_SKELETON,
	WALL_ELEVATOR_DOOR,
	WALL_ELEVATOR_SIDE,
	WALL_ELEVATOR_SWITCH,
	WALL_ELEVATOR_SWITCH2,
	WALL_OUTSIDE_DAY,
	WALL_OUTSIDE_NIGHT,
	WALL_STONE_GREY,
	WALL_STONE_GREY2,
	WALL_STONE_GREY3,
	WALL_STONE_GREY_EAGLE,
	WALL_STONE_GREY_FLAG,
	WALL_STONE_GREY_HITLER,
	WALL_STONE_GREY_SIGN_VERBOTEM,
	WALL_WOOD,
	WALL_WOOD_EAGLE,
	WALL_WOOD_HITLER,
}

export enum AssetIdMap {
	EPISODE_01_LEVEL01,
}

export enum AssetImgCategory {
	DOOR,
	DOOR_SIDE,
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

export interface AssetPropertiesImage extends AssetProperties {
	alpha: boolean;
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
export const assetsMaps: Map<AssetIdMap, AssetPropertiesMap> = new Map();

/**
 * Assets: Maps
 */

assetsMaps.set(AssetIdMap.EPISODE_01_LEVEL01, {
	episode: 1,
	file: 'map/episode_01_level_01.map',
	level: 1,
	title: 'Ammo',
});

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
	volume: 1,
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

assetsImages.set(AssetIdImg.SPRITE_AMMO, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/ammo.webp',
	title: 'Ammo',
});

assetsImages.set(AssetIdImg.SPRITE_BARREL_GREEN, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/barrel_green.webp',
	title: 'Barrel Green',
});

assetsImages.set(AssetIdImg.SPRITE_BARREL_WOOD, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/barrel_wood.webp',
	title: 'Barrel Wood',
});

assetsImages.set(AssetIdImg.SPRITE_EXTRA_LIFE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/extra_life.webp',
	title: 'Extra Life',
});

assetsImages.set(AssetIdImg.SPRITE_FLAG, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/flag.webp',
	title: 'Flag',
});

assetsImages.set(AssetIdImg.SPRITE_FOOD, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/food.webp',
	title: 'Food',
});

assetsImages.set(AssetIdImg.SPRITE_FOOD_DOG, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/food_dog.webp',
	title: 'Food (Dog)',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_CEILING_OFF, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_off.webp',
	title: 'Light Ceiling Off',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_CEILING_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_on.webp',
	title: 'Light Ceiling On',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_CHANDELIER_OFF, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_chandelier_off.webp',
	title: 'Light Chandelier Off',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_CHANDELIER_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_chandelier_on.webp',
	title: 'Light Chandelier On',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_FLOOR_OFF, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_floor_off.webp',
	title: 'Light Floor Off',
});

assetsImages.set(AssetIdImg.SPRITE_LIGHT_FLOOR_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_floor_on.webp',
	title: 'Light Floor On',
});

assetsImages.set(AssetIdImg.SPRITE_MEDKIT, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/medkit.webp',
	title: 'Medkit',
});

assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door.webp',
	title: 'Metal Door',
});

assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR_INSIDE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR_SIDE,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_inside.webp',
	hide: true,
	title: 'Metal Door Inside',
});

assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR_INSIDE2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR_SIDE,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_inside2.webp',
	hide: true,
	title: 'Metal Door Inside2',
});

assetsImages.set(AssetIdImg.SPRITE_METAL_DOOR_LOCKED, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_locked.webp',
	title: 'Metal Door Locked',
});

assetsImages.set(AssetIdImg.SPRITE_POTTED_PLANT, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/potted_plant.webp',
	title: 'Potted Plant',
});

assetsImages.set(AssetIdImg.SPRITE_POTTED_TREE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/potted_tree.webp',
	title: 'Potted Tree',
});

assetsImages.set(AssetIdImg.SPRITE_RIFLE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/rifle.webp',
	title: 'Rifle',
});

assetsImages.set(AssetIdImg.SPRITE_TABLE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/table.webp',
	title: 'Table',
});

assetsImages.set(AssetIdImg.SPRITE_TABLE_CHAIRS, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/table_chairs.webp',
	title: 'Table Chairs',
});

assetsImages.set(AssetIdImg.SPRITE_TREASURE_CHEST, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_chest.webp',
	title: 'Treasure Chest',
});

assetsImages.set(AssetIdImg.SPRITE_TREASURE_CROSS, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_cross.webp',
	title: 'Treasure Cross',
});

assetsImages.set(AssetIdImg.SPRITE_TREASURE_CUP, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_cup.webp',
	title: 'Treasure Cup',
});

assetsImages.set(AssetIdImg.SPRITE_TREASURE_CROWN, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_crown.webp',
	title: 'Treasure Crown',
});

assetsImages.set(AssetIdImg.SPRITE_VASE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/vase.webp',
	title: 'Vase',
});

assetsImages.set(AssetIdImg.SPRITE_WATER, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/water.webp',
	title: 'Water',
});

assetsImages.set(AssetIdImg.SPRITE_WELL_EMPTY, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/well_empty.webp',
	title: 'Well Empty',
});

assetsImages.set(AssetIdImg.SPRITE_WELL_WATER, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/well_water.webp',
	title: 'Well Water',
});

/**
 * Assets: Images - Walls
 */

assetsImages.set(AssetIdImg.WALL_BRICK_BLUE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue.webp',
	title: 'Brick Blue',
});

assetsImages.set(AssetIdImg.WALL_BRICK_BLUE2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue2.webp',
	title: 'Brick Blue2',
});

assetsImages.set(AssetIdImg.WALL_BRICK_BLUE_CELL, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue_cell.webp',
	title: 'Brick Blue Cell',
});

assetsImages.set(AssetIdImg.WALL_BRICK_BLUE_CELL_SKELETON, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue_cell_skeleton.webp',
	title: 'Brick Blue Cell Skeleton',
});

assetsImages.set(AssetIdImg.WALL_ELEVATOR_DOOR, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_door.webp',
	title: 'Elevator Door',
});

assetsImages.set(AssetIdImg.WALL_ELEVATOR_SIDE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_side.webp',
	title: 'Elevator Side',
});

assetsImages.set(AssetIdImg.WALL_ELEVATOR_SWITCH, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_switch.webp',
	title: 'Elevator Switch',
});

assetsImages.set(AssetIdImg.WALL_ELEVATOR_SWITCH2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_switch2.webp',
	title: 'Elevator Switch2',
});

assetsImages.set(AssetIdImg.WALL_OUTSIDE_DAY, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/outside_day.webp',
	title: 'Outside Day',
});

assetsImages.set(AssetIdImg.WALL_OUTSIDE_NIGHT, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/outside_night.webp',
	title: 'Outside Night',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey.webp',
	title: 'Stone Grey',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey2.webp',
	title: 'Stone Grey2',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY3, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey3.webp',
	title: 'Stone Grey3',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY_EAGLE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_eagle.webp',
	title: 'Stone Grey Eagle',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY_FLAG, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_flag.webp',
	title: 'Stone Grey Flag',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY_HITLER, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_hitler.webp',
	title: 'Stone Grey Hitler',
});

assetsImages.set(AssetIdImg.WALL_STONE_GREY_SIGN_VERBOTEM, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_sign_verbotem.webp',
	title: 'Stone Grey Sign Verbotem',
});

assetsImages.set(AssetIdImg.WALL_WOOD, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood.webp',
	title: 'Wood',
});

assetsImages.set(AssetIdImg.WALL_WOOD_EAGLE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood_eagle.webp',
	title: 'Wood',
});

assetsImages.set(AssetIdImg.WALL_WOOD_HITLER, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood_hitler.webp',
	title: 'Wood',
});
