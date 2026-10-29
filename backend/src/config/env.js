import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters").default("dev-only-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // CLIENT_URL: z.string().url().default("http://localhost:5173"),
    CLIENT_URL: z.string().url().default("https://qissa-wear-clothing-store.vercel.app/"),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
