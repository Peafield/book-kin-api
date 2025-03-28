import { Agent } from "@atproto/api";
import type { OAuthSession } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import express from "express";
import jwt from "jsonwebtoken";
import type { AppContext } from "./app";
import { decrypt, encrypt } from "./auth/crypto";
import logger from "./config/logger";

const handler =
	(
		fn: (
			req: express.Request,
			res: express.Response,
			next: express.NextFunction,
		) => Promise<void> | void,
	) =>
	async (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		try {
			await fn(req, res, next);
		} catch (err) {
			next(err);
		}
	};

const getSessionAgent = async (sessionData: OAuthSession, ctx: AppContext) => {
	if (!sessionData.did) return null;
	try {
		const oauthsession = await ctx.oauthClient.restore(sessionData.did);
		return oauthsession ? new Agent(oauthsession) : null;
	} catch (error) {
		logger.warn("oauth restore failed", { error });
		return null;
	}
};

export const createRouter = (ctx: AppContext) => {
	const router = express.Router();

	// OAuth metadata
	router.get(
		"/client-metadata.json",
		handler((_req, res) => {
			res.json(ctx.oauthClient.clientMetadata);
		}),
	);

	router.get(
		"/oauth/callback",
		handler(async (req, res) => {
			const params = new URLSearchParams(req.originalUrl.split("?")[1]);
			try {
				const { session } = await ctx.oauthClient.callback(params);
				if (!session) {
					res.status(400).json({ message: "Authentication failed." });
					return;
				}

				const deepLink = process.env.DEEPLINK;
				if (!deepLink) {
					res.status(400).json({ message: "Deep link is required." });
					return;
				}

				const sessionToken = jwt.sign(
					{ did: session.did },
					process.env.JWT_SECRET || "secret",
					{ expiresIn: "2h" },
				);

				await sessionStorage.set(sessionToken, session);
				res.status(200).redirect(`${deepLink}?token=${sessionToken}`);
			} catch (error) {
				logger.error(error);
				res.status(500).json({ message: "Internal server error." });
			}
		}),
	);

	// Login handler
	router.post(
		"/login",
		handler(async (req, res) => {
			// Validate
			const handle = req.body?.handle;
			if (typeof handle !== "string" || !isValidHandle(handle)) {
				res.status(400).json({
					message: "Invalid handle.",
				});
				return;
			}

			// Initiate the OAuth flow
			try {
				const authUrl = await ctx.oauthClient.authorize(handle, {
					scope: "atproto transition:generic",
				});
				res.status(200).json({ authUrl: authUrl.toString() });
			} catch (error) {
				logger.error("Login error:", error);
				res.status(500).json({
					message: "Internal server error during authentication",
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}),
	);

	router.get(
		"/profile",
		handler(async (req, res) => {
			// TODO: create helper function for getting session Data
			try {
				const authHeader = req.headers.authorization;
				if (!authHeader || !authHeader.startsWith("Bearer ")) {
					logger.error("profile: Missing bearer token");
					res.status(401).json({ message: "No session data" });
					return;
				}
				const encryptedSession = authHeader.split(" ")[1];
				if (!encryptedSession) {
					logger.error("profile: Invalid session format");
					res.status(401).json({ message: "Invalid session format" });
					return;
				}

				const decryptedSession = decrypt(decodeURIComponent(encryptedSession));
				const session = JSON.parse(decryptedSession) as OAuthSession;
				const agent = await getSessionAgent(session, ctx);
				if (!agent) {
					res
						.status(500)
						.json({ message: "profile: Failed to decrypt session data" });
					return;
				}
				if (!agent.did) {
					res.status(400).json({ message: "profile: DID not found" });
					return;
				}
				const profile = await agent.getProfile({ actor: agent.did });
				res.status(200).json(profile);
			} catch (error) {}
		}),
	);
	return router;
};
