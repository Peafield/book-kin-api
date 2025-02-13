import type {
	NodeSavedSession,
	NodeSavedSessionStore,
	NodeSavedState,
	NodeSavedStateStore,
} from "@atproto/oauth-client-node";

export class StateStore implements NodeSavedStateStore {
	private store: Record<string, NodeSavedState> = {};

	async get(key: string): Promise<NodeSavedState | undefined> {
		return this.store[key];
	}
	async set(key: string, val: NodeSavedState): Promise<void> {
		this.store[key] = val;
	}
	async del(key: string): Promise<void> {
		delete this.store[key];
	}
}

export class SessionStore implements NodeSavedSessionStore {
	private store: Record<string, NodeSavedSession> = {};

	async get(key: string): Promise<NodeSavedSession | undefined> {
		return this.store[key];
	}
	async set(key: string, session: NodeSavedSession): Promise<void> {
		this.store[key] = session;
	}
	async del(key: string): Promise<void> {
		delete this.store[key];
	}
}
