import * as dotenv from "dotenv";
dotenv.config();

import { Server } from "./app.ts";

const startServer = async () => {
  const server = new Server();
  await server.start();
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
