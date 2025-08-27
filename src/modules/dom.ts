/**
 * @author tknight-dev
 */

export class DOM {
	protected static elCanvases: HTMLCanvasElement[];
	protected static elVideo: HTMLElement;
	protected static elVersion: HTMLAnchorElement;

	protected static initializeDom(): void {
		DOM.elVideo = <HTMLElement>document.getElementById('video');
		DOM.elVersion = <HTMLAnchorElement>document.getElementById('version');
	}
}
