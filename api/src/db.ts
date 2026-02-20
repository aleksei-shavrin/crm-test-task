import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/app";

export async function connectDb(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected:", MONGODB_URI);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}
