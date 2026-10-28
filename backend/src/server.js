
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function bootstrap() {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error.message);
    process.exit(1);
  }
}

bootstrap();

