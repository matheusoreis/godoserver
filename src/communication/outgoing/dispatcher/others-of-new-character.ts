import type { CharacterModel } from "../../../core/character";
import { ServerHeaders } from "../../protocol/server-headers";
import { ServerMessage } from "../../protocol/server-message";

export class OthersOfNewCharacter extends ServerMessage {
  constructor(character: CharacterModel) {
    super(ServerHeaders.OthersOfNewCharacter);

    this.putInt32(character.id);
    this.putString(character.name);
    this.putString(character.gender.name);
    this.putInt32(character.currentMap);
    this.putInt32(character.mapPositionX);
    this.putInt32(character.mapPositionY);
    this.putInt8(character.direction);
  }
}
