import { ServerHeaders } from "../../../communication/protocol/server-headers";
import { ServerMessage } from "../../../communication/protocol/server-message";

export class CharacterDisconnectedOutgoing extends ServerMessage {
	constructor(id: number, worldId: number) {
		super(ServerHeaders.DisconnectCharacter);

		this.putInt32(id);
		this.putInt32(worldId);
	}
}
