import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import { log } from "./utils/logger";

export async function exportToCSV(data: any[], filePath: string) {
  if (!fs.existsSync("output")) fs.mkdirSync("output");

  if (!data || data.length === 0) {
    log("⚠️ No data to export to CSV.");
    return;
  }

  // ✅ Use exact field names (matching your JSON keys)
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "Company", title: "Company" },
      { id: "Company website", title: "Company website" },
      { id: "Name", title: "Name" },
      { id: "Job Title", title: "Job Title" },
      { id: "Phone Number", title: "Phone Number" },
      { id: "Email Address", title: "Email Address" },
    ],
    // ✅ Force to write headers even if empty
    alwaysQuote: true,
  });

  // Write the data
  await csvWriter.writeRecords(data);

  log(`📄 CSV exported successfully to: ${filePath}`);
}
