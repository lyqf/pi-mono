import type { EventStore } from "./event-store.js";

export type OrganizationMessageType =
	| "instruction"
	| "status"
	| "question"
	| "answer"
	| "review"
	| "handoff"
	| "proposal"
	| "decision";

export interface OrganizationMessage {
	readonly id: string;
	readonly fromAgentId: string;
	readonly toAgentId?: string;
	readonly channel?: string;
	readonly taskId?: string;
	readonly decisionId?: string;
	readonly type: OrganizationMessageType;
	readonly content: string;
	readonly createdAt: string;
}

export interface MessageBusOptions {
	readonly eventStore: EventStore;
}

export interface MessageBus {
	send(message: OrganizationMessage): void;
	snapshot(): readonly OrganizationMessage[];
}

export function createMessageBus(options: MessageBusOptions): MessageBus {
	return new InMemoryMessageBus(options.eventStore);
}

class InMemoryMessageBus implements MessageBus {
	private readonly messages: OrganizationMessage[] = [];

	constructor(private readonly eventStore: EventStore) {}

	send(message: OrganizationMessage): void {
		if (!message.taskId && !message.decisionId) throw new Error("Message requires taskId or decisionId");
		const stored = { ...message };
		this.messages.push(stored);
		this.eventStore.append({ type: "message.sent", message: stored });
	}

	snapshot(): readonly OrganizationMessage[] {
		return this.messages.map((message) => ({ ...message }));
	}
}
