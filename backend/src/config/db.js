import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

export async function connectDB() {
  if (!env.MONGO_URI) {
    console.warn("MONGO_URI not set. Starting server without database connection.");
    return;
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    if (env.NODE_ENV === "prodAuction") {
      process.exit(1);
    }

    console.warn("Starting server without database connection so development can continue.");
  }
}
