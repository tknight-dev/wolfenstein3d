import packageJSON from '../../package.json';

/**
 * @author tknight-dev
 */

export class DOM {
	public static elButtonEdit: HTMLElement;
	public static elButtonPlay: HTMLElement;
	public static elCanvases: HTMLCanvasElement[];
	public static elVideo: HTMLElement;
	// public static elVideoInteractive: HTMLElement;
	public static elVersion: HTMLAnchorElement;

	public static initializeDom(): void {
		DOM.elButtonEdit = <HTMLElement>document.getElementById('button-edit');
		DOM.elButtonPlay = <HTMLElement>document.getElementById('button-play');
		DOM.elVideo = <HTMLElement>document.getElementById('video');
		// DOM.elVideoInteractive = <HTMLElement>document.getElementById('video-interactive');
		DOM.elVersion = <HTMLAnchorElement>document.getElementById('version');

		// Done
		DOM.elVersion.innerText = packageJSON.version;
	}
}
