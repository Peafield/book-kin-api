import type { Application, Router } from "express";
import authRoutes from "./auth.routes";
import testRoutes from "./test.routes";

export interface RouteDefinition {
	path: string;
	router: Router;
}

export interface RouteConfig {
	api: RouteDefinition[];
	auth?: RouteDefinition[];
	public?: RouteDefinition[];
}

export default class Routes {
	private routeConfig: RouteConfig = {
		api: [
			{
				path: "/test",
				router: testRoutes,
			},
		],
		auth: [
			{
				path: "",
				router: authRoutes,
			},
		],
		public: [],
	};

	constructor(private app: Application) {
		this.configureRoutes();
	}

	private configureRoutes(): void {
		// API routes
		for (const route of this.routeConfig.api) {
			this.app.use(`/api${route.path}`, route.router);
		}

		// Auth routes
		if (this.routeConfig.auth) {
			for (const route of this.routeConfig.auth) {
				this.app.use(`/auth${route.path}`, route.router);
			}
		}

		// Public routes
		if (this.routeConfig.public) {
			for (const route of this.routeConfig.public) {
				this.app.use(route.path, route.router);
			}
		}
	}
}
