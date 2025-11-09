import { env as loadEnv } from "custom-env";
import { z } from "zod";

process.env.APP_STAGE = process.env.APP_STAGE || "dev";

const isDevelopment = process.env.APP_STAGE === "dev";
const isTesting = process.env.APP_STAGE === "test";

if (isDevelopment) {
  loadEnv();
} else if (isTesting) {
  loadEnv("test");
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_STAGE: z.enum(["dev", "test", "production"]).default("dev"),
  NEXT_PUBLIC_STACK_PROJECT_ID: z.string(),
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: z.string().startsWith("pck_"),
  STACK_SECRET_SERVER_KEY: z.string().startsWith("ssk"),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  BLOB_BASE_URL: z.string(),
  BLOB_READ_WRITE_TOKEN: z.string().startsWith("vercel_blob"),
  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  CRON_SECRET: z.string().length(16),
  RESEND_API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;
let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (e) {
  if (e instanceof z.ZodError) {
    console.log("Invalid env var");
    console.error(JSON.stringify(e.flatten().fieldErrors, null, 2));

    e.issues.forEach((err) => {
      const path = err.path.join(".");
      console.log(`${path}: ${err.message}`);
    });

    process.exit(1);
  }

  throw e;
}

export const isProd = () => env.APP_STAGE === "production";
export const isDev = () => env.APP_STAGE === "dev";
export const isTest = () => env.APP_STAGE === "test";

export { env };
export default env;
