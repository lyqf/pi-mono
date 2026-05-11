import type { OrganizationEvent } from "./events.js";

export type OrganizationEventListener = (event: OrganizationEvent) => void;

export interface EventStore {
	append(event: OrganizationEvent): void;
	snapshot(): readonly OrganizationEvent[];
	subscribe(listener: OrganizationEventListener): () => void;
}

export function createEventStore(): EventStore {
	return new InMemoryEventStore();
}

class InMemoryEventStore implements EventStore {
	private readonly events: OrganizationEvent[] = [];
	private readonly listeners = new Set<OrganizationEventListener>();

	append(event: OrganizationEvent): void {
		this.events.push(event);
		for (const listener of this.listeners) listener(event);
	}

	snapshot(): readonly OrganizationEvent[] {
		return [...this.events];
	}

	subscribe(listener: OrganizationEventListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
}
