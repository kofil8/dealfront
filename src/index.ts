import "dotenv/config";
import puppeteer from "puppeteer";
import { validateConfig, config } from "./config";
import { scrapeAllContacts } from "./scraper";
import { exportToCSV } from "./exporter";
import { log } from "./utils/logger";

(async () => {
  try {
    validateConfig();
    log("🚀 Starting Dealfront scraper (resumable + auto-pagination)...");

    const browser = await puppeteer.launch({
      headless: config.headless,
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0); // disable nav timeout
    page.setDefaultTimeout(0);

    const loginURL = "https://app.dealfront.com/login";
    try {
      await page.goto(loginURL, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    } catch (err) {
      log("⚠️ First load attempt timed out, retrying...");
      await page.goto(loginURL, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      });
    }

    log("🔐 Logging into Dealfront...");

    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 60000,
    });
    await page.type('input[type="email"], input[name="email"]', config.email, {
      delay: 50,
    });
    await page.type(
      'input[type="password"], input[name="password"]',
      config.password,
      { delay: 50 }
    );

    // ✅ Find and click the login button (Puppeteer-compatible)
    const loginSelectors = [
      'button[type="submit"]',
      'button[data-testid="login-button"]',
      'button[name="login"]',
      "button",
    ];

    let clicked = false;
    for (const sel of loginSelectors) {
      const btn = await page.$(sel);
      if (btn) {
        const text = await page.evaluate(
          (el: any) => (el.innerText || "").toLowerCase(),
          btn
        );
        if (
          text.includes("login") ||
          text.includes("log in") ||
          text.includes("sign in")
        ) {
          await btn.click();
          clicked = true;
          break;
        }
      }
    }

    if (!clicked) {
      throw new Error(
        "❌ Login button not found — please inspect Dealfront's login page for updates."
      );
    }

    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 180000,
    });
    log("✅ Login successful.");

    log("📋 Opening contacts list...");
    await page.goto(config.savedListUrl, {
      waitUntil: "networkidle2",
      timeout: 180000,
    });
    // wait for any dynamic content to load (7000ms)
    await new Promise((resolve) => setTimeout(resolve, 7000));

    const allContacts = await scrapeAllContacts(page);

    if (allContacts.length === 0) {
      log("⚠️ No contacts found. Try inspecting the contacts table structure.");
    } else {
      await exportToCSV(allContacts, "output/contacts.csv");
      log(
        `✅ Done! Exported ${allContacts.length} contacts to output/contacts.csv`
      );
    }

    await browser.close();
  } catch (err) {
    log("❌ Error: " + err);
  }
})();
