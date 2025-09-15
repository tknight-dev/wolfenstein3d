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

		if (Assets.dataImageMenus === undefined) {
			Assets.dataImageMenus = <any>await assetLoaderImageMenu();
		}
	}

	public static async initializeAssetsMenu(): Promise<void> {
		Assets.dataImageMenus = <any>await assetLoaderImageMenu();
	}
}
