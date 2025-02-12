import type { SimpleStore, Value } from "@atproto-labs/simple-store";
import {
	NodeOAuthClient,
	type NodeSavedSession,
	type NodeSavedState,
} from "@atproto/oauth-client-node";

// Helper function to statisfy store creation
export function createMemoryStore<V extends Value>(): SimpleStore<string, V> {
	const store: Record<string, V> = {};

	return {
		async get(key: string) {
			return store[key];
		},
		async set(key: string, value: V) {
			store[key] = value;
		},
		async del(key: string) {
			delete store[key];
		},
		async clear() {
			for (const key of Object.keys(store)) {
				delete store[key];
			}
		},
	};
}

const stateStore = createMemoryStore<NodeSavedState>();
const sessionStore = createMemoryStore<NodeSavedSession>();

export const createClient = async () => {
	const publicUrl = process.env.PUBLIC_URL;
	const url = publicUrl || `http://127.0.0.1:${process.env.PORT}`;
	return new NodeOAuthClient({
		clientMetadata: {
			client_name: "Book Kin API",
			client_id: publicUrl
				? `${url}/client-metadata.json`
				: `http://localhost?redirect_uri=${encodeURIComponent(
						`${url}/oauth/callback`,
					)}&scope=${encodeURIComponent("atproto transition:generic")}`,
			client_uri: url,
			redirect_uris: [`${url}/oauth/callback`],
			scope: "atproto transition:generic",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			application_type: "web",
			token_endpoint_auth_method: "none",
			dpop_bound_access_tokens: true,
		},
		stateStore,
		sessionStore,
	});
};
