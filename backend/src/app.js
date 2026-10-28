import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.js";

const app = express();
app.set('trust proxy', 1);
// Security & Middleware
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev")
);

// Rate Limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Qissa backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Product Routes
app.use("/api/products", productRoutes);

// Cart Routes
app.use("/api/cart", cartRoutes);

// Wishlist Routes
app.use("/api/wishlist", wishlistRoutes);

// Address Routes
app.use("/api/addresses", addressRoutes);

// Order Routes
app.use("/api/orders", orderRoutes);

// Payment Routes
app.use("/api/payments", paymentRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Category Routes
app.use("/api/categories", categoryRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Existing API Routes
app.use("/api/v1", apiRouter);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;