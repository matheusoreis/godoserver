import { ServerHeaders } from "../../../protocol/server-headers";
import { ServerMessage } from "../../../protocol/server-message";

export class CharacterDeleted extends ServerMessage {
  constructor() {
    super(ServerHeaders.CharacterDeleted);
  }
}
