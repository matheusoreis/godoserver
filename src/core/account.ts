import { PrismaClient } from "@prisma/client";
import { AccessSuccessful } from "../communication/outgoing/dispatcher/access-successful";
import { VersionChecker } from "../misc/check-version";
import type { Connection } from "./connection";
import { Alert, AlertType } from "../communication/outgoing/dispatcher/alert";
import { Password } from "../misc/password";
import { serviceLocator } from "../misc/service-locator";
import { AccountCreated } from "../communication/outgoing/dispatcher/account-created";

export class Account {
  constructor(connection: Connection, email: string, password: string, major: number, minor: number, revision: number) {
    this.connection = connection;
    this.email = email;
    this.password = password;
    this.major = major;
    this.minor = minor;
    this.revision = revision;
    this.prisma = serviceLocator.get<PrismaClient>(PrismaClient);
    this.passwordHash = serviceLocator.get<Password>(Password);
  }

  connection: Connection;
  email: string;
  password: string;
  major: number;
  minor: number;
  revision: number;
  prisma: PrismaClient;
  passwordHash: Password;

  public async accessAccount(): Promise<void> {
    if (!VersionChecker.checkAndAlert(this.major, this.minor, this.revision, this.connection)) {
      return;
    }

    if (!this.email || !this.password) {
      const alertDispatcher: Alert = new Alert(AlertType.Warn, "Email and password are mandatory.", false);
      alertDispatcher.sendTo(this.connection);
    }

    try {
      const account = await this.prisma.account.findUnique({
        where: { email: this.email },
      });

      if (!account) {
        const alertDispatcher: Alert = new Alert(AlertType.Warn, "Account not found.", false);
        alertDispatcher.sendTo(this.connection);

        return;
      }

      const isPasswordValid = await this.passwordHash.verify(this.password, account!.password);

      if (!isPasswordValid) {
        const alertDispatcher: Alert = new Alert(AlertType.Warn, "Wrong password.", false);
        alertDispatcher.sendTo(this.connection);

        return;
      }

      this.connection.addDatabaseId(account!.id);

      const dispatcher: AccessSuccessful = new AccessSuccessful();
      dispatcher.sendTo(this.connection);
    } catch (error) {
      const alertDispatcher: Alert = new Alert(AlertType.Error, `Error: ${error}`, false);
      alertDispatcher.sendTo(this.connection);
    }
  }

  public async createAccount() {
    if (!VersionChecker.checkAndAlert(this.major, this.minor, this.revision, this.connection)) {
      return;
    }

    if (!this.email || !this.password) {
      const alertDispatcher: Alert = new Alert(AlertType.Warn, "Email and password are mandatory.", false);
      alertDispatcher.sendTo(this.connection);

      return;
    }

    try {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: this.email },
      });

      if (existingAccount) {
        const alertDispatcher: Alert = new Alert(AlertType.Warn, "Account with this email already exists.", false);
        alertDispatcher.sendTo(this.connection);
        return;
      }

      const hashedPassword = await this.passwordHash.hash(this.password);

      await this.prisma.account.create({
        data: {
          email: this.email,
          password: hashedPassword,
          roles: {
            connect: { id: 1 },
          },
        },
      });

      const alertDispatcher = new Alert(AlertType.Info, "Your account has been successfully registered!", false);

      alertDispatcher.sendTo(this.connection);

      const dispatcher: AccountCreated = new AccountCreated(this.connection);
      dispatcher.sendTo(this.connection);
    } catch (error) {
      const alertDispatcher: Alert = new Alert(AlertType.Error, `Error creating account: ${error}`, false);

      alertDispatcher.sendTo(this.connection);
    }
  }
}
