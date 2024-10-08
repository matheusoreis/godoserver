import type { Character } from "../../game/character/character";
import type { Connection } from "../../connection";
import { SelectCharacterOutgoing } from "./select-character.outgoing";

export class SelectCharacterCore {
	constructor(connection: Connection, character: Character) {
		this.connection = connection;
		this.character = character;
	}

	public readonly connection: Connection;
	public readonly character: Character;

	public select(): void {
		new SelectCharacterOutgoing(this.character).sendTo(this.connection);
	}
}
