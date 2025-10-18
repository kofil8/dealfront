# 🚀 Dealfront Contacts Scraper

> A fully automated, resumable, and clean data scraper for [Dealfront.com](https://www.dealfront.com/).
>
> Built with **Node.js** , **TypeScript** , and **Puppeteer** — capable of login automation, pagination, progress saving, and high-quality data extraction.

---

## ⚙️ **Features**

✅ Logs in automatically using your Dealfront credentials

✅ Extracts **real contact data only** (no placeholders or garbage rows)

✅ Detects **dynamic, JavaScript-rendered tables**

✅ Handles **multi-page contact lists** with auto-pagination

✅ Automatically **retries pages** with low data quality (< 50%)

✅ **Resumable** — continues from the last saved page if it stops or crashes

✅ Exports both **CSV** and **JSON** files

✅ Clean TypeScript code with structured architecture

---

## 🧩 **Tech Stack**

- **Node.js** + **TypeScript**
- **Puppeteer** (browser automation)
- **csv-writer** (for CSV exports)
- **dotenv** (for environment variables)

---

## 📁 **Project Structure**

```
dealfront-scraper/
│
├── package.json
├── tsconfig.json
├── .env
│
├── src/
│   ├── index.ts          # Entry point (login + pagination)
│   ├── config.ts         # Environment setup and validation
│   ├── scraper.ts        # Main scraper logic with retries
│   ├── exporter.ts       # CSV and JSON data export
│   ├── utils/
│   │   ├── logger.ts     # Timestamped console logging
│   │   └── delay.ts      # Async delay helper
│
└── output/
    ├── contacts.csv      # Final cleaned CSV export
    ├── contacts.json     # Full JSON export
    └── progress.json     # Resumable checkpoint file
```

---

## 🔧 **Setup**

### 1️⃣ Clone or download the repository

```bash
git clone https://github.com/<your-username>/dealfront-scraper.git
cd dealfront-scraper
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file in the root folder:

```bash
DEALFRONT_EMAIL=your_email@example.com
DEALFRONT_PASSWORD=your_password
SAVED_LIST_URL=https://app.dealfront.com/t/prospector/contacts
```

💡 **Tip:** You can test this with a free Dealfront account.

---

## ▶️ **Usage**

### Run the scraper:

```bash
npm start
```

🧠 The scraper will:

1. Launch Puppeteer (Chrome)
2. Log in using your credentials
3. Visit your Dealfront contacts list
4. Extract Company, Website, Name, Job Title, Phone, and Email
5. Automatically paginate until the end
6. Save progress after each page (resumable)
7. Export data into:
   - `/output/contacts.json`
   - `/output/contacts.csv`

---

## 💾 **Output Example**

**contacts.json**

```json
{
  "Company": "Eickener Apotheke Dr. Markus W. Tackenberg",
  "Company website": "https://www.eickener-apotheke.de/impressum",
  "Name": "Markus Tackenberg",
  "Job Title": "Inhaber",
  "Phone Number": "",
  "Email Address": "markus.tackenberg@eickener-apotheke.de"
}
```

**contacts.csv**

| Company                                    | Company website                                                                          | Name              | Job Title | Phone Number | Email Address                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------- | --------- | ------------ | --------------------------------------------------------------------------------------- |
| Eickener Apotheke Dr. Markus W. Tackenberg | [https://www.eickener-apotheke.de/impressum](https://www.eickener-apotheke.de/impressum) | Markus Tackenberg | Inhaber   |              | [markus.tackenberg@eickener-apotheke.de](mailto:markus.tackenberg@eickener-apotheke.de) |

---

## ⚡ **Resume Feature**

If the scraper stops or crashes, simply rerun:

```bash
npm start
```

It will resume from the last successfully scraped page using:

```
output/progress.json
```

To restart fresh (ignore saved progress):

```bash
rm output/progress.json
npm start
```

---

## 🔁 **Retry Logic**

Each page is scraped up to **3 times** if:

- More than **50%** of rows are placeholders (`N/A`, `-`, `+0`, etc.)
- Or the data hasn’t finished rendering yet

This ensures only **real, valid contact rows** are saved.

---

## 🧠 **Troubleshooting**

| Problem                    | Solution                                                                     |
| -------------------------- | ---------------------------------------------------------------------------- |
| ❌*Login button not found* | Dealfront changed UI — inspect login page and update selectors in `index.ts` |
| ⚠️*N/A or fake data*       | The retry logic handles this, but you can increase retries or delay          |
| 🕒*TimeoutError*           | Slow internet or heavy JS — increase `timeout`values in `index.ts`           |
| 💾*Old data loading*       | Delete `output/progress.json`and restart                                     |

---

## 🧰 **Customization**

### 🔹 Change Headless Mode

In `config.ts`:

```ts
headless: false; // to see browser actions
```

Change to `true` for background scraping.

### 🔹 Adjust Wait Time

You can tweak `await delay(5000)` calls in `scraper.ts` if your network is slower/faster.

---

## ✅ **Example Console Output**

```
[19:03:41] 🚀 Starting Dealfront scraper (resumable + auto-pagination)...
[19:03:52] 🔐 Logging into Dealfront...
[19:04:01] ✅ Login successful.
[19:04:08] 📋 Opening contacts list...
[19:04:19] 📄 Scraping page 1...
📊 Data quality: 93/100 valid rows (93.0%)
📑 Extracted 93 clean contacts on page 1.
➡️ Moving to next page...
✅ Finished scraping. Total contacts: 412
✅ Done! Exported 412 contacts to output/contacts.csv
```

---

## 📜 **License**

MIT License © 2025 [Mohammad Kofil](https://github.com/your-profile)
