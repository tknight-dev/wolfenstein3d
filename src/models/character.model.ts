import { GamingCanvasGridCharacter, GamingCanvasGridCharacterInput } from '@tknight-dev/gaming-canvas/grid';

/**
 * @author tknight-dev
 */

export interface Character extends GamingCanvasGridCharacter {
	health: number;
	id: number;
	npc: boolean;
	player1: boolean;
}

export interface CharacterInput extends GamingCanvasGridCharacterInput {
	action: boolean;
	fire: boolean;
}
