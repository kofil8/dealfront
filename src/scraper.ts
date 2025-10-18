import fs from "fs/promises";
import { existsSync } from "fs";
import { log } from "./utils/logger";
import { delay } from "./utils/delay";

export interface Contact {
  Company: string;
  "Company website": string;
  Name: string;
  "Job Title": string;
  "Phone Number": string;
  "Email Address": string;
}

interface ProgressData {
  lastPage: number;
  contacts: Contact[];
}

const PROGRESS_FILE = "output/progress.json";

export async function scrapeAllContacts(page: any): Promise<Contact[]> {
  let progress: ProgressData = { lastPage: 0, contacts: [] };

  if (existsSync(PROGRESS_FILE)) {
    const file = await fs.readFile(PROGRESS_FILE, "utf-8");
    progress = JSON.parse(file);
    log(
      `🔁 Resuming from page ${progress.lastPage + 1}, already scraped ${
        progress.contacts.length
      } contacts.`
    );
  }

  let pageIndex = progress.lastPage + 1;
  let allContacts = progress.contacts;

  while (true) {
    log(`📄 Scraping page ${pageIndex}...`);

    const pageContacts = await scrapeContacts(page, pageIndex);
    if (pageContacts.length === 0) {
      log("⚠️ No data found on this page — might be the last page.");
      break;
    }

    allContacts = allContacts.concat(pageContacts);
    log(`📦 Total collected so far: ${allContacts.length}`);
    await saveProgress({ lastPage: pageIndex, contacts: allContacts });

    const nextButton = await page.$(
      "button[aria-label='Next page'], button[aria-label='Next'], li.next button, li.next a"
    );
    if (!nextButton) {
      log("🚫 No Next button found. Finished all pages.");
      break;
    }

    const isDisabled = await page.evaluate(
      (btn: HTMLElement) =>
        btn.hasAttribute("disabled") || btn.classList.contains("disabled"),
      nextButton
    );
    if (isDisabled) {
      log("🛑 Last page reached. Stopping.");
      break;
    }

    log("➡️ Moving to next page...");
    await nextButton.click();
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 120000,
    });
    await delay(5000);
    pageIndex++;
  }

  log(`✅ Finished scraping. Total contacts: ${allContacts.length}`);
  return allContacts;
}

// 🧠 Scrape a single page with retry logic
async function scrapeContacts(
  page: any,
  pageIndex: number
): Promise<Contact[]> {
  let attempt = 1;
  let contacts: Contact[] = [];

  while (attempt <= 3) {
    log(
      `🔍 Attempt ${attempt}: Waiting for table to load (Page ${pageIndex})...`
    );
    try {
      await page.waitForSelector("#t-result-table tbody tr", {
        timeout: 120000,
      });

      // Wait until table has non-empty name cells
      await page.waitForFunction(
        () =>
          Array.from(
            document.querySelectorAll("#t-result-table tbody tr")
          ).some(
            (r) =>
              (
                r.querySelector("td:nth-child(2) div[title]")?.textContent || ""
              ).trim().length > 1
          ),
        { timeout: 120000 }
      );

      await autoScroll(page);
      await delay(2000);

      contacts = await page.$$eval(
        "#t-result-table tbody tr",
        (rows: Element[]) => {
          const garbage = ["-", "–", "N/A", "", "+0", "- +0"];
          const looksFake = (v: string): boolean =>
            garbage.includes(v) || /^[-\s+0]+$/.test(v);

          return rows
            .map((row: Element) => {
              const getText = (sel: string): string =>
                ((row.querySelector(sel) as HTMLElement)?.textContent || "")
                  .trim()
                  .replace(/\s+/g, " ");
              const getHref = (sel: string): string =>
                (
                  (row.querySelector(sel) as HTMLAnchorElement)?.getAttribute(
                    "href"
                  ) || ""
                ).trim();

              const name = getText("td:nth-child(2) div[title]");
              const company = getText("td:nth-child(3) a[title]");
              const jobTitle = getText("td:nth-child(4) div[title]");
              const phone = getText("td:nth-child(5) div");
              const email = getText(
                "td:nth-child(6) div.text-platform-primary-500"
              );
              const website = getHref("td:nth-child(7) a[href]");

              // Only keep if real and not placeholder
              if (
                looksFake(name) ||
                looksFake(company) ||
                (looksFake(email) && looksFake(phone))
              )
                return null;

              return {
                Company: company,
                "Company website": website,
                Name: name,
                "Job Title": jobTitle,
                "Phone Number": phone,
                "Email Address": email,
              };
            })
            .filter((c): c is Contact => c !== null);
        }
      );

      // 🧩 Check data quality (retry if too many empties)
      const totalRows = await page.$$eval(
        "#t-result-table tbody tr",
        (rows: string | any[]) => rows.length
      );
      const validRows = contacts.length;
      const fillRate = totalRows ? (validRows / totalRows) * 100 : 0;

      log(
        `📊 Data quality: ${validRows}/${totalRows} valid rows (${fillRate.toFixed(
          1
        )}%)`
      );

      if (fillRate < 50 && attempt < 3) {
        log("⚠️ Less than 50% valid data, retrying this page...");
        attempt++;
        await delay(4000);
        continue;
      }

      log(
        `📑 Extracted ${contacts.length} clean contacts on page ${pageIndex}.`
      );
      break; // stop retrying if data is acceptable
    } catch (err) {
      log(`❌ Attempt ${attempt} failed to scrape page ${pageIndex}: ${err}`);
      attempt++;
      await delay(4000);
    }
  }

  if (contacts.length === 0)
    log(`⚠️ No valid data after ${attempt - 1} attempts.`);

  return contacts;
}

// 💾 Save progress after each page
async function saveProgress(progress: ProgressData) {
  if (!existsSync("output")) await fs.mkdir("output", { recursive: true });
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  log(`💾 Progress saved (page ${progress.lastPage})`);
}

// 🧭 Scroll helper to load lazy data
async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
