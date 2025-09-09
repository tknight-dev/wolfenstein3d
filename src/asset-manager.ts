import * as JSZip from 'jszip';

/**
 * @author tknight-dev
 */

/*
 * LOADERS
 */

/**
 * @return is dataURL
 */
export const assetLoaderAudio = async (): Promise<Map<AssetId, string>> => {
	let assetId: AssetId,
		blob: Blob,
		data: Map<AssetId, string> = new Map(),
		dataType: string,
		filename: string,
		properties: AssetPropertiesAudio | AssetPropertiesImage | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderAudio: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetId } = {};
	for ([assetId, properties] of assets) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			continue;
		}

		properties = assets.get(assetId);

		// Filter
		if (properties === undefined || properties.type !== AssetType.AUDIO) {
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
export const assetLoaderImage = async (toDataURL?: boolean): Promise<Map<AssetId, ImageBitmap | string>> => {
	let assetId: AssetId,
		blob: Blob,
		data: Map<AssetId, ImageBitmap | string> = new Map(),
		dataType: string | undefined,
		filename: string,
		properties: AssetPropertiesAudio | AssetPropertiesImage | undefined,
		response: Response,
		zip: JSZip;

	// Load file
	response = await fetch('./assets');

	if (response.status !== 200) {
		console.error(`assetLoaderImage: failed to find '${response.url}' with status code ${response.status}: ${response.statusText}`);
		return data;
	}

	// Create a new reference map from file to assetId
	const assetsByFile: { [key: string]: AssetId } = {};
	for ([assetId, properties] of assets) {
		assetsByFile[properties.file] = assetId;
	}

	zip = <JSZip>await JSZip.loadAsync(await response.blob());
	for (filename of Object.keys(zip.files)) {
		assetId = assetsByFile[filename];

		// File found but not defined as an asset
		if (assetId === undefined) {
			continue;
		}

		properties = assets.get(assetId);

		// Filter
		if (properties === undefined || properties.type !== AssetType.IMAGE) {
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

/*
 * ASSETS
 */

export enum AssetExtAudio {
	MP3,
}

export enum AssetExtImg {
	WEBP,
}

export enum AssetId {
	AUDIO_MUSIC_MENU,
	AUDIO_MUSIC_MENU_INTRO,
	IMG_SPRITE_AMMO,
	IMG_SPRITE_BARREL,
	IMG_SPRITE_EXTRA_LIFE,
	IMG_SPRITE_FLAG,
	IMG_SPRITE_FOOD,
	IMG_SPRITE_FOOD_DOG,
	IMG_SPRITE_LIGHT_CEILING_OFF,
	IMG_SPRITE_LIGHT_CEILING_ON,
	IMG_SPRITE_LIGHT_FLOOR_ON,
	IMG_SPRITE_MEDKIT,
	IMG_SPRITE_METAL_DOOR,
	IMG_SPRITE_METAL_DOOR_INSIDE,
	IMG_SPRITE_METAL_DOOR_INSIDE2,
	IMG_SPRITE_METAL_DOOR_LOCKED,
	IMG_SPRITE_POTTED_PLANT,
	IMG_SPRITE_POTTED_TREE,
	IMG_SPRITE_RIFLE,
	IMG_SPRITE_TABLE,
	IMG_SPRITE_TREASURE_CHEST,
	IMG_SPRITE_TREASURE_CROSS,
	IMG_SPRITE_TREASURE_CROWN,
	IMG_SPRITE_TREASURE_CUP,
	IMG_WALL_BRICK_BLUE,
	IMG_WALL_BRICK_BLUE2,
	IMG_WALL_BRICK_BLUE_CELL,
	IMG_WALL_BRICK_BLUE_CELL_SKELETON,
	IMG_WALL_ELEVATOR_DOOR,
	IMG_WALL_ELEVATOR_SIDE,
	IMG_WALL_ELEVATOR_SWITCH,
	IMG_WALL_ELEVATOR_SWITCH2,
	IMG_WALL_OUTSIDE_DAY,
	IMG_WALL_OUTSIDE_NIGHT,
	IMG_WALL_STONE_GREY,
	IMG_WALL_STONE_GREY2,
	IMG_WALL_STONE_GREY3,
	IMG_WALL_STONE_GREY_EAGLE,
	IMG_WALL_STONE_GREY_FLAG,
	IMG_WALL_STONE_GREY_HITLER,
	IMG_WALL_STONE_GREY_SIGN_VERBOTEM,
	IMG_WALL_WOOD,
	IMG_WALL_WOOD_EAGLE,
	IMG_WALL_WOOD_HITLER,
	NULL = 0,
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
	type: AssetType;
	URL?: string;
}

export interface AssetPropertiesAudio extends AssetProperties {
	ext: AssetExtAudio;
	volume: number; // 0-1 range for default volume
}

export interface AssetPropertiesImage extends AssetProperties {
	alpha: boolean;
	category: AssetImgCategory;
	ext: AssetExtImg;
	hide?: boolean;
}

export const assets: Map<AssetId, AssetPropertiesAudio | AssetPropertiesImage> = new Map();

export enum AssetType {
	AUDIO,
	IMAGE,
}

/**
 * Assets: Audio - Effects
 */

/**
 * Assets: Audio - Music
 */
assets.set(AssetId.AUDIO_MUSIC_MENU, {
	author: 'Robert Prince',
	ext: AssetExtAudio.MP3,
	file: 'audio/music/menu-music.mp3',
	title: 'Get Them Before They Get You',
	type: AssetType.AUDIO,
	volume: 1,
});

assets.set(AssetId.AUDIO_MUSIC_MENU_INTRO, {
	author: 'Robert Prince',
	ext: AssetExtAudio.MP3,
	file: 'audio/music/menu-intro.mp3',
	title: 'Horst Wessel Lied',
	type: AssetType.AUDIO,
	volume: 1,
});

/**
 * Assets: Images - Sprites
 */

assets.set(AssetId.IMG_SPRITE_AMMO, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/ammo.webp',
	title: 'Ammo',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_BARREL, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/barrel.webp',
	title: 'Barrel',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_EXTRA_LIFE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/extra_life.webp',
	title: 'Extra Life',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_FLAG, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/flag.webp',
	title: 'Flag',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_FOOD, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/food.webp',
	title: 'Food',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_FOOD_DOG, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/food_dog.webp',
	title: 'Food (Dog)',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_LIGHT_CEILING_OFF, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_off.webp',
	title: 'Light Ceiling Off',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_LIGHT_CEILING_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_on.webp',
	title: 'Light Ceiling On',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_LIGHT_FLOOR_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.LIGHT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_floor_on.webp',
	title: 'Light Floor On',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_MEDKIT, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/medkit.webp',
	title: 'Medkit',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_METAL_DOOR, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door.webp',
	title: 'Metal Door',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_METAL_DOOR_INSIDE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR_SIDE,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_inside.webp',
	hide: true,
	title: 'Metal Door Inside',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_METAL_DOOR_INSIDE2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR_SIDE,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_inside2.webp',
	hide: true,
	title: 'Metal Door Inside2',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_METAL_DOOR_LOCKED, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.DOOR,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/metal_door_locked.webp',
	title: 'Metal Door Locked',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_POTTED_PLANT, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/potted_plant.webp',
	title: 'Potted Plant',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_POTTED_TREE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/potted_tree.webp',
	title: 'Potted Tree',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_RIFLE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/rifle.webp',
	title: 'Rifle',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_TABLE, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/table.webp',
	title: 'Table',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_TREASURE_CHEST, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_chest.webp',
	title: 'Treasure Chest',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_TREASURE_CROSS, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_cross.webp',
	title: 'Treasure Cross',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_TREASURE_CUP, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_cup.webp',
	title: 'Treasure Cup',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_TREASURE_CROWN, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.SPRITE_PICKUP,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/treasure_crown.webp',
	title: 'Treasure Crown',
	type: AssetType.IMAGE,
});

/**
 * Assets: Images - Walls
 */

assets.set(AssetId.IMG_WALL_BRICK_BLUE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue.webp',
	title: 'Brick Blue',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_BRICK_BLUE2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue2.webp',
	title: 'Brick Blue2',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_BRICK_BLUE_CELL, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue_cell.webp',
	title: 'Brick Blue Cell',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_BRICK_BLUE_CELL_SKELETON, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue_cell_skeleton.webp',
	title: 'Brick Blue Cell Skeleton',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_ELEVATOR_DOOR, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_door.webp',
	title: 'Elevator Door',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_ELEVATOR_SIDE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_side.webp',
	title: 'Elevator Side',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_ELEVATOR_SWITCH, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_switch.webp',
	title: 'Elevator Switch',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_ELEVATOR_SWITCH2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/elevator_switch2.webp',
	title: 'Elevator Switch2',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_OUTSIDE_DAY, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/outside_day.webp',
	title: 'Outside Day',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_OUTSIDE_NIGHT, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/outside_night.webp',
	title: 'Outside Night',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey.webp',
	title: 'Stone Grey',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey2.webp',
	title: 'Stone Grey2',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY3, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey3.webp',
	title: 'Stone Grey3',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY_EAGLE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_eagle.webp',
	title: 'Stone Grey Eagle',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY_FLAG, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_flag.webp',
	title: 'Stone Grey Flag',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY_HITLER, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_hitler.webp',
	title: 'Stone Grey Hitler',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_STONE_GREY_SIGN_VERBOTEM, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/stone_grey_sign_verbotem.webp',
	title: 'Stone Grey Sign Verbotem',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_WOOD, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood.webp',
	title: 'Wood',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_WOOD_EAGLE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood_eagle.webp',
	title: 'Wood',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_WOOD_HITLER, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/wood_hitler.webp',
	title: 'Wood',
	type: AssetType.IMAGE,
});
