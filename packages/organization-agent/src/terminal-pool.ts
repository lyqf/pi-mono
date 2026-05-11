export interface TerminalSlot {
	readonly id: string;
	readonly boundAgentId?: string;
	readonly cmuxPaneRef?: string;
}

export interface TerminalPool {
	bind(slotId: string, agentId: string, cmuxPaneRef?: string): TerminalSlot;
	snapshot(): readonly TerminalSlot[];
}

export function createTerminalPool(slotIds: readonly string[]): TerminalPool {
	return new DefaultTerminalPool(slotIds);
}

class DefaultTerminalPool implements TerminalPool {
	private readonly slots: TerminalSlot[];

	constructor(slotIds: readonly string[]) {
		this.slots = slotIds.map((id) => ({ id }));
	}

	bind(slotId: string, agentId: string, cmuxPaneRef?: string): TerminalSlot {
		const index = this.slots.findIndex((slot) => slot.id === slotId);
		if (index < 0) throw new Error(`Unknown terminal slot: ${slotId}`);
		const next = { id: slotId, boundAgentId: agentId, cmuxPaneRef };
		this.slots[index] = next;
		return { ...next };
	}

	snapshot(): readonly TerminalSlot[] {
		return this.slots.map((slot) => ({ ...slot }));
	}
}
