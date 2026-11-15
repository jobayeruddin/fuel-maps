import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";

const isProduction = process.env.NODE_ENV === "production";
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || (isProduction ? vercelUrl : "http://localhost:3002");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },

  trustedOrigins: [
    "http://localhost:3002",
    ...(vercelUrl ? [vercelUrl] : []),
    ...(appUrl && appUrl !== "http://localhost:3002" ? [appUrl] : []),
  ],
});