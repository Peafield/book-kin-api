import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

class RedisClient {
	private static instance: Redis;
	private constructor() {}

	public static getInstance(): Redis {
		if (!RedisClient.instance) {
			RedisClient.instance = new Redis(
				process.env.REDIS_URL || "redis://localhost:6379",
			);
		}
		return RedisClient.instance;
	}
}

export const redis = RedisClient.getInstance();
