export function exportToCSV(data: any, filename: string) {
  // Convert data to CSV format
  let csv = "";

  // Handle multiple sections
  Object.entries(data).forEach(([section, rows]: [string, any]) => {
    if (rows.length > 0) {
      // Add section header
      csv += `\n${section.toUpperCase()}\n`;

      // Get headers
      const headers = Object.keys(rows[0]);
      csv += headers.join(",") + "\n";

      // Add rows
      rows.forEach((row: any) => {
        csv +=
          headers
            .map((header) => {
              const value = row[header]?.toString() || "";
              // Escape commas and quotes
              return value.includes(",") ? `"${value}"` : value;
            })
            .join(",") + "\n";
      });
    }
  });

  // Create download link
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
