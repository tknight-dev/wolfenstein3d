import { GamingCanvasGridCharacter } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

export interface Character extends GamingCanvasGridCharacter {
	health: number;
	id: number;
	npc: boolean;
	player1: boolean;
}
