import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/db.js";
import createApp from "./app.js";
import { seedPricingConfig } from "./scripts/seed-pricing-config.js";
import { assertRequiredSecrets } from "./config/secrets.js";

const startServer = async () => {
  assertRequiredSecrets();

  const port = Number(process.env.PORT) || 8080;

  await connectDB();
  await seedPricingConfig();

  const app = createApp();

  app.listen(port, () => console.log(`Server running on port: ${port}`));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
