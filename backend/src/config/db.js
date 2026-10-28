
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  if (!env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment variables.");
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}




// import mongoose from "mongoose";
// import dns from "dns";
// import { env } from "./env.js";

// dns.setServers(["1.1.1.1", "8.8.8.8"]);

// export async function connectDB() {
//   if (!env.MONGO_URI) {
//     console.warn("MONGO_URI not set. Starting server without database connection.");
//     return;
//   }

//   try {
//     await mongoose.connect(env.MONGO_URI);
//     console.log("MongoDB connected");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);

//     if (env.NODE_ENV === "prodAuction") {
//       process.exit(1);
//     }

//     console.warn("Starting server without database connection so development can continue.");
//   }
// }
