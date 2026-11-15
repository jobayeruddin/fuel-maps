import { createAuthClient } from "better-auth/react";

const isProduction = process.env.NODE_ENV === "production";
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || (isProduction ? vercelUrl : "http://localhost:3002");

export const authClient = createAuthClient({
  baseURL: appUrl,
});