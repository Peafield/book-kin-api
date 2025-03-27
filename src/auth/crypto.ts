import crypto from "node:crypto";

const secret = process.env.SESSION_SECRET ?? "default-secret";
const key = crypto.scryptSync(secret, "salt", 32);
const algorithm = "aes-256-gcm";

export function encrypt(session: string) {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(session, "utf-8", "hex");
	encrypted += cipher.final("hex");
	const authTag = cipher.getAuthTag().toString("hex");
	return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(sessionData: string) {
	const parts = sessionData.split(":");
	const iv = Buffer.from(parts[0], "hex");
	const authTag = Buffer.from(parts[1], "hex");
	const encryptedSessionData = parts[2];

	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedSessionData, "hex", "utf-8");
	decrypted += decipher.final("utf-8");
	return decrypted;
}
