import { Router } from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.js";

const router = Router();

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);
    const skip = (currentPage - 1) * pageLimit;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .select("-password");

    const totalUsers = await User.countDocuments(query);

    const usersWithOrderCount = await Promise.all(
      users.map(async (u) => {
        const orderCount = await Order.countDocuments({ user: u._id });
        return {
          ...u.toObject(),
          orderCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      totalUsers,
      currentPage,
      totalPages: Math.ceil(totalUsers / pageLimit),
      data: usersWithOrderCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orderCount = await Order.countDocuments({ user: user._id });
    res.status(200).json({ success: true, data: { ...user.toObject(), orderCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
