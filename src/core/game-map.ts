import { AlertDispatcher, AlertType } from "../communication/outgoing/dispatcher/alert";
import { CharacterDisconnected } from "../communication/outgoing/dispatcher/character-disconnected";
import { CharacterMoved } from "../communication/outgoing/dispatcher/character-moved";
import { CharacterSelected } from "../communication/outgoing/dispatcher/character-selected";
import { NotifyExistingCharacters } from "../communication/outgoing/dispatcher/notify-existing-characters";
import { OthersOfNewCharacter } from "../communication/outgoing/dispatcher/others-of-new-character";
import { CHAR_VELOCITY_X_Y, MAP_LOOP, MAX_MAP_CHARACTERS } from "../misc/constants";
import { Logger } from "../misc/logger";
import { serviceLocator } from "../misc/service-locator";
import { Slots } from "../misc/slots";
import type { CharacterModel } from "./character";
import type { Connection } from "./connection";

export class GameMap {
  constructor(id: number, name: string, sizeX: number, sizeY: number) {
    this.logger = serviceLocator.get<Logger>(Logger);

    this.id = id;
    this.name = name;
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.loop();
  }

  public id: number;
  public name: string;
  public sizeX: number;
  public sizeY: number;
  private _characters: Slots<CharacterModel> = new Slots<CharacterModel>(MAX_MAP_CHARACTERS);

  public logger: Logger;

  public addCharacter(connection: Connection, character: CharacterModel): void {
    character.loop();

    if (character.currentMap !== this.id) {
      this.sendAlert(connection, AlertType.Error, "Your character does not belong on this map!", true);

      return;
    }

    // Notificar o novo personagem selecionado
    this.sendCharacterSelected(connection, character);

    // Notificar outros personagens sobre o novo personagem
    this.sendOthersOfNewCharacter(connection, character);

    // Notificar o novo personagem sobre os personagens já presentes
    this.sendExistingCharacters(connection);

    // Adicionar o personagem ao array de personagens
    this._characters.add(character);
  }

  private sendCharacterSelected(connection: Connection, character: CharacterModel): void {
    const charSelected = new CharacterSelected(character);
    charSelected.sendTo(connection);
  }

  private sendOthersOfNewCharacter(connection: Connection, character: CharacterModel): void {
    const newChar = new OthersOfNewCharacter(character);
    newChar.sendToMapExcept(this.id, connection);
  }

  private sendExistingCharacters(connection: Connection): void {
    const charactersArray = this._characters.filter((c) => c !== undefined) as CharacterModel[];
    const mapCharsTo = new NotifyExistingCharacters(charactersArray);
    mapCharsTo.sendTo(connection);
  }

  public moveCharacter(
    connection: Connection,
    character: CharacterModel,
    action: number,
    positionX: number,
    positionY: number,
    direction: number,
    velocityX: number,
    velocityY: number,
  ): void {
    const existingCharacter = this.getCharacter(character.id);

    if (!existingCharacter) {
      console.error(`Character ${character.id} is not in this map.`);

      return;
    }

    if (!this.isCharacterInCurrentMap(character)) {
      this.sendAlert(connection, AlertType.Error, "Your character does not belong on this map!", true);
      return;
    }

    if (!this.isWithinMapBounds(positionX, positionY)) {
      this.sendAlert(connection, AlertType.Error, "Your character is trying to leave the map's boundaries!", true);
      return;
    }

    character.mapPositionX = positionX;
    character.mapPositionY = positionY;
    character.direction = direction;

    const charMoved = new CharacterMoved(character, action, positionX, positionY, direction, velocityX, velocityY);
    charMoved.sendToMapExcept(this.id, connection);
  }

  public removeCharacter(character: CharacterModel): void {
    let found = false;

    for (const index of this._characters.getFilledSlots()) {
      const existingCharacter = this._characters.get(index);

      if (existingCharacter && existingCharacter.id === character.id) {
        this._characters.remove(index);
        found = true;

        const disconnect: CharacterDisconnected = new CharacterDisconnected(character);
        disconnect.sendToMap(character.currentMap);
        break;
      }
    }

    if (!found) {
      console.error(`Character ${character.id} is not in this map.`);
    }
  }

  public getCharacter(characterId: number): CharacterModel | undefined {
    return this._characters.find((character) => character.id === characterId);
  }

  private sendAlert(connection: Connection, type: AlertType, message: string, critical: boolean): void {
    const alertDispatcher = new AlertDispatcher(type, message, critical);
    alertDispatcher.sendTo(connection);
  }

  private isWithinMapBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY;
  }

  private isCharacterInCurrentMap(character: CharacterModel): boolean {
    const existingCharacter: CharacterModel | undefined = this._characters.find(
      (currentCharacter) => currentCharacter?.id === character.id,
    );

    return existingCharacter ? existingCharacter.currentMap === this.id : false;
  }

  private async loop(): Promise<void> {
    this.logger.info(`Initializing the Map ${this.id} loop`);

    const loopInterval: number = MAP_LOOP;

    setInterval(async () => {
      //
    }, loopInterval);
  }
}
