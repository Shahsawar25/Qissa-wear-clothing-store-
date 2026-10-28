import { Router } from "express";
import Product from "../models/Product.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.js";

const router = Router();

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const result = categories
      .filter(Boolean)
      .map((name) => ({ name, _id: name }));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
