import { AssetId, assetLoaderAudio, assetLoaderImage } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export class Assets {
	public static dataAudio: Map<AssetId, string>;
	public static dataImage: Map<AssetId, string>;

	public static async initializeAssets(): Promise<void> {
		Assets.dataAudio = await assetLoaderAudio();
		Assets.dataImage = <Map<AssetId, string>>await assetLoaderImage(true);
	}
}
