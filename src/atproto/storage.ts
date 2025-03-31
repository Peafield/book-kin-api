import type {
	NodeSavedSession,
	NodeSavedSessionStore,
	NodeSavedState,
	NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { redis } from "#/lib/redis";

const PREFIX = "session:";

export class StateStore implements NodeSavedStateStore {
	async get(key: string): Promise<NodeSavedState | undefined> {
		const result = await redis.get(`${PREFIX}${key}`);
		if (!result) return undefined;
		return JSON.parse(result) as NodeSavedState;
	}
	async set(key: string, val: NodeSavedState) {
		const state = JSON.stringify(val);
		await redis.set(`${PREFIX}${key}`, JSON.stringify(state));
	}
	async del(key: string) {
		await redis.del(`${PREFIX}${key}`);
	}
}

export class SessionStore implements NodeSavedSessionStore {
	async get(key: string): Promise<NodeSavedSession | undefined> {
		const result = await redis.get(`${PREFIX}${key}`);
		if (!result) return;
		return JSON.parse(result) as NodeSavedSession;
	}
	async set(key: string, val: NodeSavedSession) {
		const session = JSON.stringify(val);
		await redis.set(`${PREFIX}${key}`, JSON.stringify(session));
	}
	async del(key: string) {
		await redis.del(`${PREFIX}${key}`);
	}
}

export const tokenStore = {
	async set(sessionToken: string, did: string) {
		await redis.set(`${PREFIX}${sessionToken}`, did, "EX", 3600);
	},
	async get(sessionToken: string) {
		return await redis.get(`${PREFIX}${sessionToken}`);
	},
	async del(sessionToken: string) {
		await redis.del(`${PREFIX}${sessionToken}`);
	},
};
