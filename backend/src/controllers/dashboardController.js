import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

function getDateFilter(period) {
  const now = new Date();
  let start;
  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3m":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "1y":
      start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      return {};
  }
  return { createdAt: { $gte: start } };
}

export const getDashboardStats = async (req, res) => {
  try {
    const period = req.query.period || "all";
    const dateFilter = getDateFilter(period);

    const baseFilter = { ...dateFilter };

    const totalOrders = await Order.countDocuments(baseFilter);
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const revenueFilter = { ...baseFilter, paymentStatus: "Paid", status: { $ne: "Cancelled" } };
    const revenueResult = await Order.aggregate([
      { $match: revenueFilter },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const avgResult = await Order.aggregate([
      { $match: revenueFilter },
      { $group: { _id: null, avg: { $avg: "$total" } } },
    ]);
    const averageOrderValue = avgResult.length > 0 ? Math.round(avgResult[0].avg) : 0;

    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const pendingOrders = ordersByStatus.find((s) => s._id === "Pending")?.count || 0;
    const cancelledOrders = ordersByStatus.find((s) => s._id === "Cancelled")?.count || 0;
    const totalPaidOrders = await Order.countDocuments({ ...baseFilter, paymentStatus: "Paid" });

    const monthlySales = await Order.aggregate([
      { $match: revenueFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    const categorySales = await Order.aggregate([
      { $match: revenueFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$productInfo.category",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const topProducts = await Order.aggregate([
      { $match: revenueFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const lowStockProducts = await Product.find({
      variants: { $elemMatch: { stock: { $lte: 5 } } },
    })
      .select("name variants images category")
      .limit(10);

    const recentOrders = await Order.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    const latestCustomers = await User.find({ role: "customer" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    const bestCategory = categorySales.length > 0 ? categorySales[0] : null;
    const bestProduct = topProducts.length > 0 ? topProducts[0] : null;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers,
          totalPaidOrders,
          averageOrderValue,
          pendingOrders,
          cancelledOrders,
          ordersByStatus,
        },
        monthlySales,
        categorySales,
        topProducts,
        lowStockProducts,
        recentOrders,
        latestCustomers,
        insights: {
          bestCategory: bestCategory
            ? { name: bestCategory._id, sold: bestCategory.totalSold }
            : null,
          bestProduct: bestProduct
            ? { name: bestProduct.name, sold: bestProduct.totalSold, revenue: bestProduct.revenue }
            : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
