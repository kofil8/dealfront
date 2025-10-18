import dotenv from "dotenv";
dotenv.config();

export interface Config {
  email: string;
  password: string;
  savedListUrl: string;
  headless: boolean;
  waitTimeout: number;
}

export const config: Config = {
  email: process.env.DEALFRONT_EMAIL || "",
  password: process.env.DEALFRONT_PASSWORD || "",
  savedListUrl: process.env.SAVED_LIST_URL || "",
  headless: false,
  waitTimeout: 60000,
};

export function validateConfig() {
  if (!config.email || !config.password || !config.savedListUrl) {
    throw new Error(
      "❌ Missing environment variables. Set DEALFRONT_EMAIL, DEALFRONT_PASSWORD and SAVED_LIST_URL in .env"
    );
  }
}
