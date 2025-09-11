import {
	AssetIdAudio,
	AssetIdImg,
	AssetIdImgCharacter,
	AssetIdImgCharacterType,
	AssetIdMap,
	assetLoaderAudio,
	assetLoaderImage,
	assetLoaderImageCharacter,
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
	public static dataMap: Map<AssetIdMap, GameMap>;

	public static async initializeAssets(): Promise<void> {
		Assets.dataAudio = await assetLoaderAudio();
		Assets.dataImage = <any>await assetLoaderImage(true);
		Assets.dataImageCharacters = <any>await assetLoaderImageCharacter(true);
		Assets.dataMap = await assetLoaderMap();
	}
}
