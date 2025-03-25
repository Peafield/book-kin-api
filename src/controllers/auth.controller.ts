import type { Request, RequestHandler, Response } from "express";
import { createClient } from "../atproto/client";
import logger from "../config/logger";

export const login: RequestHandler = async (req: Request, res: Response) => {
	try {
		const handle = req.body?.handle;
		if (!handle || typeof handle !== "string") {
			res.status(400).json({
				message: "Handle is required.",
			});
			return;
		}

		const client = await createClient();

		if (!client) {
			logger.error("Failed to create ATP client");
			res.status(500).json({
				message: "Failed to initialize authentication client",
			});
			return;
		}

		const authUrl = await client.authorize(handle, {
			scope: "atproto transition:generic",
		});

		if (!authUrl) {
			logger.error("Failed to generate auth URL");
			res.status(500).json({
				message: "Failed to generate authentication URL",
			});
			return;
		}

		res.status(200).json({ authUrl: authUrl.toString() });
	} catch (error) {
		logger.error("Login error:", error);
		res.status(500).json({
			message: "Internal server error during authentication",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const callback: RequestHandler = async (req: Request, res: Response) => {
	try {
		const client = await createClient();
		const params = new URLSearchParams(req.url);

		const result = await client.callback(params);
		if (!result || !result.session) {
			res.status(400).json({ message: "Authentication failed." });
			return;
		}

		const deepLink = process.env.DEEPLINK;
		if (!deepLink) {
			res.status(400).json({ message: "Deep link is required." });
			return;
		}

		const sessionParam = encodeURIComponent(JSON.stringify(result.session));
		res.redirect(`${deepLink}?session=${sessionParam}`);
	} catch (error) {
		logger.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};
