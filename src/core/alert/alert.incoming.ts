import type { Incoming } from "../../communication/incoming";

export class AlertIncoming implements Incoming {
	handle(): void {
		throw new Error("Method not implemented.");
	}
}
