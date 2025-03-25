import { Router } from "express";
import { callback, login } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);

router.get("/oauth/callback", callback);

export default router;
