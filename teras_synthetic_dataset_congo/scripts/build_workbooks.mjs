import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

function columnLabel(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    const rem = (value - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function matrixRange(rows) {
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  return `A1:${columnLabel(colCount - 1)}${rowCount}`;
}

async function buildWorkbook(spec) {
  const workbook = Workbook.create();

  for (const sheetSpec of spec.sheets) {
    const sheet = workbook.worksheets.add(sheetSpec.name);
    const rows = sheetSpec.rows.length > 0 ? sheetSpec.rows : [[""]];
    const range = sheet.getRange(matrixRange(rows));
    range.values = rows;
  }

  await fs.mkdir(path.dirname(spec.outputPath), { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(spec.outputPath);
}

async function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error("Usage: build_workbooks.mjs <spec.json>");
    process.exit(1);
  }

  const payload = JSON.parse(await fs.readFile(specPath, "utf8"));
  for (const spec of payload.workbooks) {
    await buildWorkbook(spec);
  }
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
