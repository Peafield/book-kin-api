import { isValidHandle } from "@atproto/syntax";
import express from "express";
import type { AppContext } from "./app";
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

				const sessionParam = encodeURIComponent(JSON.stringify(session));
				res.redirect(`${deepLink}?session=${sessionParam}`);
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
	return router;
};
