import { AssetIdAudio, AssetIdImg, assetLoaderAudio, assetLoaderImage } from '../asset-manager.js';

/**
 * @author tknight-dev
 */

export class Assets {
	public static dataAudio: Map<AssetIdAudio, string>;
	public static dataImage: Map<AssetIdImg, string>;

	public static async initializeAssets(): Promise<void> {
		Assets.dataAudio = await assetLoaderAudio();
		Assets.dataImage = <Map<AssetIdImg, string>>await assetLoaderImage(true);
	}
}
