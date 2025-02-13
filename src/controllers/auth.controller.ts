// Create class for auth controllers and routes. It should contain /auth/login, /auth/callback, and /auth/logout
import type { Request, RequestHandler, Response } from "express";
import { createClient } from "../atproto/client";
import logger from "../config/logger";

export const login: RequestHandler = async (req: Request, res: Response) => {
	try {
		const { handle } = req.query;
		if (!handle || typeof handle !== "string") {
			res.status(400).json({
				message: "Handle and deepLink are required.",
			});
			return;
		}
		const client = await createClient();
		const authUrl = await client.authorize(handle, {
			scope: "atproto transition:generic",
		});

		res.redirect(authUrl.toString());
	} catch (error) {
		logger.error(error);
		res.status(500).json({
			message: "Internal server error.",
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
