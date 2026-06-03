// PDF Reader using OpenAI API
// This script reads the grant PDF and maps it to the Create Grant form fields

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import OpenAI from "openai";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

async function readGrantPDF() {
  try {
    const pdfPath = path.join(
      __dirname,
      "files",
      "Grant_MOU_Education_Project_Filled.pdf",
    );

    console.log("📄 Reading PDF from:", pdfPath);
    console.log("");

    // Read and parse the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log("📖 Parsing PDF content...");
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    console.log("✅ PDF parsed successfully!");
    console.log(`   Pages: ${pdfData.numpages}`);
    console.log(`   Text length: ${pdfText.length} characters`);
    console.log("");
    console.log("📝 RAW PDF CONTENT:");
    console.log("═".repeat(80));
    console.log(pdfText);
    console.log("═".repeat(80));
    console.log("");

    console.log("🤖 Sending to OpenAI for analysis...");
    console.log("");

    // Use OpenAI to extract structured information from the text
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Please analyze this grant/MOU document and extract the following information in JSON format:
{
  "nameOfGrantor": "Name of the organization providing the grant",
  "code": "Grant or project code if mentioned",
  "periodStart": "Start date (YYYY-MM-DD format)",
  "periodEnd": "End date (YYYY-MM-DD format)",
  "approvedGrantAmount": "Total approved grant amount as a number",
  "grantReceivedTillDate": "Amount received so far as a number (if mentioned)",
  "fucFrequency": "Frequency of Fund Utilization Certificate (Monthly/Quarterly/Half-Yearly/Annual)",
  "projectReportFrequency": "Frequency of project reports (Monthly/Quarterly/Half-Yearly/Annual)",
  "auditedFUC": "Whether audited FUC is required (Y or N)",
  "status": "Current status (Active/Inactive/Pending)",
  "additionalDetails": "Any other relevant information from the document"
}

Please be thorough and extract as much information as possible. If a field is not found, use null.

Here is the document text:

${pdfText}`,
        },
      ],
      max_tokens: 2000,
    });

    const extractedText = response.choices[0].message.content;
    console.log("✅ Data extracted successfully!");
    console.log("");
    console.log("═".repeat(80));
    console.log("EXTRACTED DATA FROM PDF");
    console.log("═".repeat(80));
    console.log("");
    console.log(extractedText);
    console.log("");
    console.log("═".repeat(80));
    console.log("");

    // Try to parse as JSON
    let jsonData = null;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("⚠️  Could not parse as JSON, showing raw response");
    }

    if (jsonData) {
      console.log("📋 MAPPING TO CREATE GRANT PAGE FIELDS:");
      console.log("═".repeat(80));
      console.log("");

      const fieldMappings = [
        {
          form: "Name of Grantor",
          value: jsonData.nameOfGrantor,
          field: "nameOfGrantor",
        },
        { form: "Grant Code", value: jsonData.code, field: "code" },
        {
          form: "Period Start",
          value: jsonData.periodStart,
          field: "periodStart",
        },
        { form: "Period End", value: jsonData.periodEnd, field: "periodEnd" },
        {
          form: "Approved Grant Amount",
          value: jsonData.approvedGrantAmount,
          field: "approvedGrantAmount",
        },
        {
          form: "Grant Received Till Date",
          value: jsonData.grantReceivedTillDate,
          field: "grantReceivedTillDate",
        },
        {
          form: "FUC Frequency",
          value: jsonData.fucFrequency,
          field: "fucFrequency",
        },
        {
          form: "Project Report Frequency",
          value: jsonData.projectReportFrequency,
          field: "projectReportFrequency",
        },
        {
          form: "Audited FUC Required",
          value: jsonData.auditedFUC,
          field: "auditedFUC",
        },
        { form: "Status", value: jsonData.status, field: "status" },
      ];

      fieldMappings.forEach(({ form, value, field }) => {
        const displayValue =
          value !== null && value !== undefined ? value : "❌ Not found in PDF";
        const status = value !== null && value !== undefined ? "✅" : "⚠️ ";
        console.log(`${status} ${form.padEnd(30)} → ${displayValue}`);
      });

      console.log("");
      if (jsonData.additionalDetails) {
        console.log("📝 ADDITIONAL DETAILS:");
        console.log("═".repeat(80));
        console.log(jsonData.additionalDetails);
        console.log("");
      }

      // Calculate balance
      if (jsonData.approvedGrantAmount && jsonData.grantReceivedTillDate) {
        const balance =
          jsonData.approvedGrantAmount - jsonData.grantReceivedTillDate;
        console.log("");
        console.log("💰 CALCULATED FIELD:");
        console.log("═".repeat(80));
        console.log(
          `✅ Balance Grant Receivable     → ${balance.toLocaleString("en-IN")}`,
        );
      }
    }

    console.log("");
    console.log("═".repeat(80));
    console.log("");
    console.log(
      "💡 This data can be automatically populated into the Create Grant form",
    );
    console.log("   in the AddGrantPage component.");
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
  }
}

// Run the script
readGrantPDF();
