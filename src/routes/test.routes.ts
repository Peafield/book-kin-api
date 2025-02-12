import { Router } from "express";
import testController from "../controllers/test.controller";

const router: Router = Router();

router.route("/").get(testController.getTest);

export default router;
