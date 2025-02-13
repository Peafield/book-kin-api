import { Router } from "express";
import { callback, login } from "../controllers/auth.controller";

const router = Router();

router.get("/login", login);

router.get("/callback", callback);

export default router;
