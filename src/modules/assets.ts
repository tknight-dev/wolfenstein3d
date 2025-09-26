import { GamingCanvasGridCamera, GamingCanvasGridUint16Array } from '@tknight-dev/gaming-canvas/grid';
import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	AssetIdImgMenu,
	AssetIdMap,
	assetLoaderAudio,
	assetLoaderImage,
	assetLoaderImageCharacter,
	assetLoaderImageMenu,
	assetLoaderMap,
} from '../asset-manager.js';
import { CharacterNPC } from '../models/character.model.js';
import { GameMap } from '../models/game.model.js';

/**
 * @author tknight-dev
 */

export class Assets {
	public static dataAudio: Map<AssetIdAudio, string>;
	public static dataImage: Map<AssetIdImg, string>;
	public static dataImageCharacters: Map<AssetIdImgCharacterType, Map<AssetIdImgCharacter, string>>;
	public static dataImageMenus: Map<AssetIdImgMenu, string>;
	public static dataMap: Map<AssetIdMap, GameMap>;

	public static async initializeAssets(): Promise<void> {
		Assets.dataAudio = await assetLoaderAudio();
		Assets.dataImage = <any>await assetLoaderImage(true);
		Assets.dataImageCharacters = <any>await assetLoaderImageCharacter(true);

		Assets.dataMap = await assetLoaderMap();
		for (let map of Assets.dataMap.values()) {
			Assets.parseMap(map);
		}

		if (Assets.dataImageMenus === undefined) {
			Assets.dataImageMenus = <any>await assetLoaderImageMenu();
		}
	}

	public static async initializeAssetsMenu(): Promise<void> {
		Assets.dataImageMenus = <any>await assetLoaderImageMenu();
	}

	public static parseMap(map: GameMap): GameMap {
		let key: string, npc: Map<number, CharacterNPC>, value: any;

		map.grid = GamingCanvasGridUint16Array.from(<Uint16Array>map.grid.data);

		if (map.npc !== undefined) {
			if (map.npc instanceof Map !== true) {
				npc = new Map();

				for ([key, value] of Object.entries(map.npc)) {
					value.camera = new GamingCanvasGridCamera(value.camera.r, value.camera.x, value.camera.y, value.camera.z);

					// value.gridIndex = value.id;
					// value.runningSpeed = 0.00055;
					// value.walkingSpeed = 0.000275;

					npc.set(Number(key), value);
				}

				map.npc = npc;
			}
		}

		return map;
	}
}
