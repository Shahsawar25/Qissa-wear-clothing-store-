import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";

async function createAdmin() {
  await mongoose.connect(env.MONGO_URI);

  const existingAdmin = await User.findOne({
    $or: [{ role: "admin" }, { email: "admin@qissa.com" }],
  });

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

createAdmin();
