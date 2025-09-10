import { AssetIdAudio, AssetIdImg, AssetIdMap, assetLoaderAudio, assetLoaderImage, assetLoaderMap } from '../asset-manager.js';
import { GameMap } from '../models/game.model.js';

/**
 * @author tknight-dev
 */

export class Assets {
	public static dataAudio: Map<AssetIdAudio, string>;
	public static dataImage: Map<AssetIdImg, string>;
	public static dataMap: Map<AssetIdMap, GameMap>;

	public static async initializeAssets(): Promise<void> {
		Assets.dataAudio = await assetLoaderAudio();
		Assets.dataImage = <Map<AssetIdImg, string>>await assetLoaderImage(true);
		Assets.dataMap = await assetLoaderMap();
	}
}
