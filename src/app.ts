import { exec } from "node:child_process";
import events from "node:events";
import type { OAuthClient } from "@atproto/oauth-client-node";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import { createClient } from "./atproto/client";
import {
	type BidirectionalResolver,
	createBidirectionalResolver,
	createIdResolver,
} from "./atproto/id-resolver";
import logger from "./config/logger";
import { redis } from "./lib/redis";
import errorHandler from "./middleware/errorHandler";
import { createRouter } from "./routes";
dotenv.config();

export type AppContext = {
	oauthClient: OAuthClient;
	resolver: BidirectionalResolver;
};

export class Server {
	constructor(
		public app: express.Application,
		public ctx: AppContext,
	) {}

	static async create() {
		// Connect to Redis
		try {
			await redis.ping();
			logger.info("Connected to Redis");
		} catch (error) {
			logger.error("Failed to connect to Redis", error);
			process.exit(1);
		}
		// Create atproto utilities
		const oauthClient = await createClient();
		const baseIdResolver = createIdResolver();
		const resolver = createBidirectionalResolver(baseIdResolver);
		const ctx = { oauthClient, resolver };

		// Create server
		const app: Express = express();
		app.set("trust proxy", true);

		// Set up routes and middleware
		const router = createRouter(ctx);
		app.use(
			cors({
				origin: ["http://localhost:8081", "http://127.0.0.1:8081"],
				credentials: true,
				methods: ["GET", "POST"],
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		);
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));
		app.use(errorHandler);
		app.use(router);

		// Bind server to the port
		const server = app.listen(process.env.PORT);
		await events.once(server, "listening");
		logger.info(
			`Server (${process.env.NODE_ENV}) running on port http://localhost:${process.env.PORT}`,
		);
		return new Server(app, ctx);
	}
}
const run = async () => {
	const server = await Server.create();

	const onCloseSignal = async () => {
		setTimeout(() => process.exit(1), 10000).unref();
		await redis.quit();
		process.exit();
	};

	process.on("SIGINT", onCloseSignal);
	process.on("SIGTERM", onCloseSignal);
	process.on("SIGUSR2", async () => {
		logger.info("Restarting server...");
		await new Promise<void>((resolve, reject) => {
			exec(
				"redis-cli -h localhost -p 6379 CLIENT KILL TYPE normal",
				(error) => {
					if (error) {
						logger.error("Error killing Redis connections:", error);
						reject(error);
					} else {
						logger.info("Killed all Redis connections");
						resolve();
					}
				},
			);
		});
		await redis.quit();
		redis.on("end", () => {
			process.kill(process.pid, "SIGUSR2");
		});
	});
};
run();
