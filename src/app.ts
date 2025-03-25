import cors from "cors";
import type { Express } from "express";
import express from "express";
import logger from "./config/logger";
import errorHandler from "./middleware/errorHandler";
import Routes from "./routes";

export class Server {
	private app: Express;
	private port: string | number;

	constructor() {
		this.app = express();
		this.port = process.env.PORT || 8080;
		this.app.use(
			cors({
				origin: ["http://localhost:8081"],
				credentials: true,
			}),
		);
		this.configureMiddleware();
		this.configureRoutes();
		this.configureErrorHandling();
	}

	private configureMiddleware(): void {
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	private configureRoutes(): void {
		new Routes(this.app);
	}

	private configureErrorHandling(): void {
		this.app.use(errorHandler);
	}

	public async start(): Promise<void> {
		try {
			this.app.listen(this.port, () => {
				logger.info(`Server is running on port ${this.port}`);
			});
		} catch (error) {
			logger.error("Error starting server:", error);
			process.exit(1);
		}
	}

	public getApp(): Express {
		return this.app;
	}
}
