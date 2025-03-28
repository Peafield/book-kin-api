import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

export const redis = new Redis(
	process.env.REDIS_URL || "redis://localhost:6379",
);
