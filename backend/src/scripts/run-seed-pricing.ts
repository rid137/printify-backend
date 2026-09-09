import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import { seedPricingConfig } from "./seed-pricing-config.js";

await connectDB();
await seedPricingConfig();
process.exit(0);
