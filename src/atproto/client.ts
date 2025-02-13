import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { SessionStore, StateStore } from "./storage";

export const createClient = async () => {
	const publicUrl = process.env.PUBLIC_URL;
	const url = publicUrl || `http://127.0.0.1:${process.env.PORT}`;
	return new NodeOAuthClient({
		// TODO: Host clientMetadata.json on a public URL
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
		stateStore: new StateStore(),
		sessionStore: new SessionStore(),
	});
};
