import type { Incoming } from "../communication/incoming/incoming";
import { AccessAccountRequest } from "../communication/incoming/requests/access-account";
import type { ChangePasswordRequest } from "../communication/incoming/requests/change-password";
import { CharListRequest } from "../communication/incoming/requests/char-list";
import { CreateAccountRequest } from "../communication/incoming/requests/create-account";
import { CreateCharRequest } from "../communication/incoming/requests/create-char";
import { DeleteAccountRequest } from "../communication/incoming/requests/delete-account";
import { DeleteCharRequest } from "../communication/incoming/requests/delete-char";
import { MoveCharRequest } from "../communication/incoming/requests/move-char";
import { Pong } from "../communication/incoming/requests/ping";
import { RecoverAccountRequest } from "../communication/incoming/requests/recover-account";
import { SelectCharRequest } from "../communication/incoming/requests/select-char";
import { ClientHeaders } from "../communication/protocol/client-headers";
import type { ClientMessage } from "../communication/protocol/client-message";
import type { Connection } from "../core/connection";
import { serviceLocator } from "../misc/service-locator";

/**
 * A classe `Handler` é responsável por gerenciar e despachar mensagens recebidas
 * para seus respectivos handlers com base nos cabeçalhos das mensagens de cliente.
 */
export class Handler {
  /**
   * Cria uma instância da classe `Handler`.
   * Inicializa o registro de handlers e registra os requests.
   */
  constructor() {
    this.requestHandlers = {};
    this.registerRequests();
  }

  /**
   * Mapeia cabeçalhos de mensagens de cliente para handlers específicos.
   * Cada cabeçalho (`ClientHeaders`) pode ter um handler associado que implementa a interface `Incoming`.
   */
  private requestHandlers: Partial<Record<ClientHeaders, Incoming>>;

  /**
   * Despacha a mensagem recebida para o handler apropriado com base no ID da mensagem.
   * Se não houver handler registrado para o ID da mensagem, a conexão é fechada.
   *
   * @param {Connection} connection - A conexão WebSocket associada ao cliente.
   * @param {ClientMessage} message - A mensagem recebida do cliente.
   */
  public handleMessage(connection: Connection, message: ClientMessage): void {
    const messageId = message.getId() as ClientHeaders;

    if (this.requestHandlers[messageId]) {
      const handler = this.requestHandlers[messageId];

      try {
        handler?.handle(connection, message);
      } catch (error) {
        console.error(`Error handling ${handler?.constructor.name}:`, error);
        connection.close();
      }
    } else {
      console.debug(`No handler for id: ${messageId}`);
      connection.close();
    }
  }

  /**
   * Registra os handlers de requests associando os cabeçalhos de cliente a suas implementações específicas.
   * Este método é responsável por preencher o mapeamento `requestHandlers`.
   */
  private registerRequests() {
    const pingRequest = serviceLocator.get<Pong>(Pong);
    const accessAccountRequest = serviceLocator.get<AccessAccountRequest>(AccessAccountRequest);
    const createAccountRequest = serviceLocator.get<CreateAccountRequest>(CreateAccountRequest);
    const deleteAccountRequest = serviceLocator.get<DeleteAccountRequest>(DeleteAccountRequest);
    const recoverAccountRequest = serviceLocator.get<RecoverAccountRequest>(RecoverAccountRequest);
    const changePasswordRequest = serviceLocator.get<ChangePasswordRequest>(DeleteAccountRequest);
    const charListRequest = serviceLocator.get<CharListRequest>(CharListRequest);
    const createCharRequest = serviceLocator.get<CreateCharRequest>(CreateCharRequest);
    const deleteCharRequest = serviceLocator.get<DeleteCharRequest>(DeleteCharRequest);
    const selectCharRequest = serviceLocator.get<SelectCharRequest>(SelectCharRequest);
    const moveCharRequest = serviceLocator.get<MoveCharRequest>(MoveCharRequest);

    this.requestHandlers[ClientHeaders.Ping] = pingRequest;
    this.requestHandlers[ClientHeaders.AccessAccount] = accessAccountRequest;
    this.requestHandlers[ClientHeaders.CreateAccount] = createAccountRequest;
    this.requestHandlers[ClientHeaders.DeleteAccount] = deleteAccountRequest;
    this.requestHandlers[ClientHeaders.RecoverAccount] = recoverAccountRequest;
    this.requestHandlers[ClientHeaders.ChangePassword] = changePasswordRequest;
    this.requestHandlers[ClientHeaders.CharList] = charListRequest;
    this.requestHandlers[ClientHeaders.CreateChar] = createCharRequest;
    this.requestHandlers[ClientHeaders.DeleteChar] = deleteCharRequest;
    this.requestHandlers[ClientHeaders.SelectChar] = selectCharRequest;
    this.requestHandlers[ClientHeaders.MoveChar] = moveCharRequest;
  }
}
