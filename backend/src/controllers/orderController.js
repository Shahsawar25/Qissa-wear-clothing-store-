import Address from "../models/Address.js";
import Order from "../models/Order.js";
import { createOrderFromCart } from "../services/orderService.js";

const buildAddressSnapshot = (address) => ({
  fullName: address.fullName,
  phone: address.phone,
  country: address.country,
  provinceState: address.provinceState,
  city: address.city,
  postalCode: address.postalCode,
  streetAddress: address.streetAddress,
  landmark: address.landmark,
  addressType: address.addressType,
});

export const checkoutOrder = async (req, res) => {
  try {
    const { addressId } = req.body;

    const address = await Address.findOne({
      _id: addressId,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const order = await createOrderFromCart({
      userId: req.user.id,
      addressSnapshot: buildAddressSnapshot(address),
      paymentMethod: "COD",
      paymentStatus: "Unpaid",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: order,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const response = {
      success: false,
      message: error.message,
    };
    if (error.errors) {
      response.errors = error.errors;
    }
    res.status(statusCode).json(response);
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: `Payment status updated to "${paymentStatus}".`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    const validNext = allowedTransitions[order.status] || [];

    if (!validNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${order.status}" to "${status}". Allowed transitions: ${validNext.join(", ") || "none"}.`,
      });
    }

    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
