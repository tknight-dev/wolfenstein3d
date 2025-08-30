import { CharacterControl, CharacterControlDecode, CharacterPosition, CharacterPositionDecode, CharacterPositionEncode } from '../../models/character.model';
import { CalcBusInputCmd, CalcBusInputDataInit, CalcBusInputDataSettings, CalcBusInputPayload, CalcBusOutputCmd, CalcBusOutputPayload } from './calc.model';
import { GameMap, GameMapCellMasks } from '../../models/game.model';
import { CameraEncode } from '../../models/camera.model';

/**
 * @author tknight-dev
 */

/*
 * Input: from Main Thread
 */
self.onmessage = (event: MessageEvent) => {
	const payload: CalcBusInputPayload = event.data;

	switch (payload.cmd) {
		case CalcBusInputCmd.CHARACTER_CONTROL:
			CalcEngine.inputCharacterControl(<Float32Array>payload.data);
			break;
		case CalcBusInputCmd.INIT:
			CalcEngine.initialize(<CalcBusInputDataInit>payload.data);
			break;
		case CalcBusInputCmd.SETTINGS:
			CalcEngine.inputSettings(<CalcBusInputDataSettings>payload.data);
			break;
	}
};

class CalcEngine {
	private static characterControlNew: boolean;
	private static characterControlRaw: Float32Array;
	private static characterPosition: CharacterPosition;
	private static gameMap: GameMap;
	private static request: number;
	private static settingsFPMS: number;
	private static settingsNew: boolean;

	public static initialize(data: CalcBusInputDataInit): void {
		// Config
		CalcEngine.gameMap = data.gameMap;

		// Config: CharacterPosition
		CalcEngine.characterPosition = CharacterPositionDecode(data.characterPosition);

		// Config: Settings
		CalcEngine.inputSettings(data as CalcBusInputDataSettings);

		// Start
		CalcEngine.post([
			{
				cmd: CalcBusOutputCmd.INIT_COMPLETE,
				data: true,
			},
		]);

		// Start rendering thread
		CalcEngine.go__funcForward();
		CalcEngine.request = requestAnimationFrame(CalcEngine.go);
	}

	/*
	 * Input
	 */

	public static inputCharacterControl(data: Float32Array): void {
		CalcEngine.characterControlRaw = data;
		CalcEngine.characterControlNew = true;
	}

	public static inputSettings(data: CalcBusInputDataSettings): void {
		CalcEngine.settingsFPMS = 1000 / data.fps;

		// Last
		CalcEngine.settingsNew = true;
	}

	/*
	 * Output: to Main Thread
	 */
	private static post(payloads: CalcBusOutputPayload[], data?: Transferable[]): void {
		self.postMessage(payloads, (data || []) as any);
	}

	/*
	 * Main Loop
	 */

	public static go(_timestampNow: number): void {}
	public static go__funcForward(): void {
		let characterControl: CharacterControl = {
				rDeg: CalcEngine.characterPosition.rDeg,
				rRad: CalcEngine.characterPosition.rRad,
				x: 0,
				y: 0,
			},
			characterPosition: CharacterPosition = CalcEngine.characterPosition,
			characterPositionBefore: CharacterPosition = JSON.parse(JSON.stringify(CalcEngine.characterPosition)),
			characterPositionEncoded: Float32Array,
			characterPositionUpdated: boolean,
			cycleMinMs: number = 2,
			gameMap: GameMap = CalcEngine.gameMap,
			fpms: number = CalcEngine.settingsFPMS,
			timestampDelta: number,
			timestampFPSDelta: number,
			timestampFPSThen: number = 0,
			timestampThen: number = 0;

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			CalcEngine.request = requestAnimationFrame(CalcEngine.go);

			/**
			 * Calc
			 */
			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > cycleMinMs) {
				// Wait a small duration to not thread lock
				timestampThen = timestampNow;

				// Character
				if (CalcEngine.characterControlNew === true) {
					CalcEngine.characterControlNew = false;
					characterControl = CharacterControlDecode(CalcEngine.characterControlRaw);

					characterPosition.rDeg = characterControl.rDeg;
					characterPosition.rRad = characterControl.rRad;
				}

				if (characterControl.x !== 0 || characterControl.y !== 0) {
					characterPosition.x += (characterControl.x + Math.sin(characterControl.rRad) * -characterControl.y) * 0.02;
					characterPosition.y += Math.cos(characterControl.rRad) * -characterControl.y * 0.02;
					characterPosition.dataIndex = (characterPosition.x | 0) * gameMap.dataWidth + (characterPosition.y | 0);
				}

				// Collision detection
				if ((gameMap.data[characterPosition.dataIndex] & GameMapCellMasks.TYPE_WALL) === 1) {
					characterPosition.dataIndex = characterPositionBefore.dataIndex;
					characterPosition.rDeg = characterPositionBefore.rDeg;
					characterPosition.rRad = characterPositionBefore.rRad;
					characterPosition.x = characterPositionBefore.x;
					characterPosition.y = characterPositionBefore.y;
				} else {
					characterPositionUpdated = true;

					characterPositionBefore.dataIndex = characterPosition.dataIndex;
					characterPositionBefore.rDeg = characterPosition.rDeg;
					characterPositionBefore.rRad = characterPosition.rRad;
					characterPositionBefore.x = characterPosition.x;
					characterPositionBefore.y = characterPosition.y;
				}
			}

			/**
			 * Video
			 */
			timestampFPSDelta = timestampNow - timestampFPSThen;
			if (timestampFPSDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampFPSThen = timestampNow - (timestampFPSDelta % fpms);

				// Update camera position in other threads
				if (characterPositionUpdated === true) {
					characterPositionEncoded = CharacterPositionEncode(CalcEngine.characterPosition);
					CalcEngine.post(
						[
							{
								cmd: CalcBusOutputCmd.CHARACTER_POSITION,
								data: characterPositionEncoded,
							},
						],
						[characterPositionEncoded.buffer],
					);
				}
			}
		};
		CalcEngine.go = go;
	}
}
