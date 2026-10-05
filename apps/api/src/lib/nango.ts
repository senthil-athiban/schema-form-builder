import { Nango } from "@nangohq/node";

const secretKey = process.env.NANGO_SECRET_KEY;
if (!secretKey) {
  throw new Error("NANGO_SECRET_KEY is not set");
}

export const nango = new Nango({ secretKey });

export const NANGO_PROVIDER_CONFIG_KEY = {
    SLACK: "slack"
} as const;