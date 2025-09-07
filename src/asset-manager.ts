import * as JSZip from 'jszip';

/**
 * @author tknight-dev
 */

export enum AssetExtAudio {
	MP3,
}

export enum AssetExtImg {
	WEBP,
}

export enum AssetImgCategory {
	OBJECT,
	WALL,
}

interface AssetProperties {
	author?: string;
	file: string;
	license?: string;
	title?: string;
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
}

export enum AssetType {
	AUDIO,
	IMAGE,
}

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
export const assetLoaderImage = async (): Promise<Map<AssetId, ImageBitmap>> => {
	let assetId: AssetId,
		blob: Blob,
		data: Map<AssetId, ImageBitmap> = new Map(),
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

		// Convert to blob
		blob = new Blob([await (<JSZip.JSZipObject>zip.file(filename)).async('arraybuffer')], { type: dataType });

		// Convert to bitmap
		data.set(assetId, await createImageBitmap(blob));
	}

	return data;
};

/**
 * Assets: List
 */

export enum AssetId {
	AUDIO_MUSIC_MENU,
	AUDIO_MUSIC_MENU_INTRO,
	IMG_SPRITE_LIGHT_CEILING_OFF,
	IMG_SPRITE_LIGHT_CEILING_ON,
	IMG_WALL_BRICK_BLUE,
	IMG_WALL_BRICK_BLUE2,
	IMG_WALL_CELL_BLUE,
	IMG_WALL_CELL_BLUE_SKELETON,
}
export const assets: Map<AssetId, AssetPropertiesAudio | AssetPropertiesImage> = new Map();

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

assets.set(AssetId.IMG_SPRITE_LIGHT_CEILING_OFF, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.OBJECT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_off.webp',
	title: 'Object Light Ceiling Off',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_SPRITE_LIGHT_CEILING_ON, {
	alpha: true,
	author: 'Id Software',
	category: AssetImgCategory.OBJECT,
	ext: AssetExtImg.WEBP,
	file: 'img/sprite/light_ceiling_on.webp',
	title: 'Object Light Ceiling On',
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
	title: 'Wall Brick Blue',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_BRICK_BLUE2, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/brick_blue2.webp',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_CELL_BLUE, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/cell_blue.webp',
	type: AssetType.IMAGE,
});

assets.set(AssetId.IMG_WALL_CELL_BLUE_SKELETON, {
	alpha: false,
	author: 'Id Software',
	category: AssetImgCategory.WALL,
	ext: AssetExtImg.WEBP,
	file: 'img/wall/cell_blue_skeleton.webp',
	type: AssetType.IMAGE,
});
