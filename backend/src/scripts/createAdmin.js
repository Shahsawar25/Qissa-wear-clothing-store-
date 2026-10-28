import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import User from "../models/User.js";

async function createAdmin() {
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");

  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    console.log("Admin already exists.");
    await mongoose.connection.close();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await User.create({
    name: "Administrator",
    email: "admin@qissa.com",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created successfully.");
  await mongoose.connection.close();
  process.exit(0);
}

createAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
