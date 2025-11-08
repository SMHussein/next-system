import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import "dotenv/config";
import env from "../../env";

export const sql = neon(env.DATABASE_URL);
const db = drizzle(sql, { schema });

export default db;
