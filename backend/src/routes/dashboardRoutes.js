import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.js";

const router = Router();

router.get("/stats", protect, adminOnly, getDashboardStats);

export default router;
