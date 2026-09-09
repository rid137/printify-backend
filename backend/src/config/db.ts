import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`Successfully connnected to mongoDB 👍`);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    console.error(
      `ERROR: ${message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb$1://***@")}`
    );
    process.exit(1);
  }
};

export default connectDB;
