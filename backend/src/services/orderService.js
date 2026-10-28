import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const POPULATE_FIELDS =
  "name slug price discountPrice images fabric brand isActive variants";
const SHIPPING_COST = 200;

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

export const createOrderFromCart = async ({
  userId,
  addressSnapshot,
  paymentMethod,
  paymentStatus,
  stripeSessionId = null,
  stripePaymentIntent = null,
}) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    const error = new Error("Your cart is empty.");
    error.statusCode = 400;
    throw error;
  }

  await cart.populate("items.product", POPULATE_FIELDS);

  const orderItems = [];
  const skippedItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    if (!product || !product.isActive) {
      skippedItems.push(
        `"${product?.name || "Unknown"}" is no longer available.`
      );
      continue;
    }

    const variant = product.variants.find(
      (v) => v.color === cartItem.color && v.size === cartItem.size
    );

    if (!variant) {
      skippedItems.push(
        `Variant (${cartItem.color}, ${cartItem.size}) is no longer available for ${product.name}.`
      );
      continue;
    }

    if (variant.stock < cartItem.quantity) {
      skippedItems.push(
        `Insufficient stock for ${product.name} (${cartItem.color}, ${cartItem.size}). Available: ${variant.stock}, requested: ${cartItem.quantity}.`
      );
      continue;
    }

    const effectivePrice = product.discountPrice || product.price;
    const image =
      product.images?.length > 0 ? product.images[0].url : "";

    orderItems.push({
      product: product._id,
      name: product.name,
      image,
      price: effectivePrice,
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    });
  }

  if (skippedItems.length > 0) {
    const error = new Error("Some items could not be processed.");
    error.statusCode = 400;
    error.errors = skippedItems;
    throw error;
  }

  if (orderItems.length === 0) {
    const error = new Error("No valid items to checkout.");
    error.statusCode = 400;
    throw error;
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping = SHIPPING_COST;
  const total = subtotal + shipping;

  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    user: userId,
    orderNumber,
    items: orderItems,
    address: addressSnapshot,
    subtotal,
    shipping,
    total,
    paymentMethod,
    paymentStatus,
    stripeSessionId,
    stripePaymentIntent,
  });

  for (const item of orderItems) {
    const result = await Product.findOneAndUpdate(
      {
        _id: item.product,
        variants: {
          $elemMatch: {
            color: item.color,
            size: item.size,
            stock: { $gte: item.quantity },
          },
        },
      },
      { $inc: { "variants.$.stock": -item.quantity } }
    );

    if (!result) {
      await Order.findByIdAndDelete(order._id);
      const error = new Error(
        `Stock changed for ${item.name} (${item.color}, ${item.size}). Please review your cart and try again.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  cart.items = [];
  cart.subtotal = 0;
  cart.totalItems = 0;
  await cart.save();

  return order;
};
