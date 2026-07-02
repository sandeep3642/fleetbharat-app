import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const escapeCsvValue = (value) => {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
};

const shareFile = async (fileUri, mimeType, dialogTitle) => {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle,
    UTI: mimeType,
  });
};

export const downloadReportAsCsv = async (rows, fileName) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ].join("\r\n");

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, `\ufeff${csvContent}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await shareFile(fileUri, "text/csv", "Export CSV Report");

  return fileUri;
};

export const downloadReportAsXlsx = async (rows, fileName) => {
  if (!rows.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Generate as base64 string instead of writing directly to disk
  const base64 = XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx",
    compression: true,
  });

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await shareFile(
    fileUri,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Export Excel Report",
  );

  return fileUri;
};