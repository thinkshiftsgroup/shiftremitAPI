import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5002;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "mongodb+srv://technology_db_user:Zf1glS7hAUDQXUDd@cluster0.r6vjrna.mongodb.net/dootlingshiftremitapi";
