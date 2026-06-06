export const exportExpensesToCSV = (expenses, selectedFields = null) => {
  const availableFields = ["date", "category", "description", "amount"];
  const fieldsToExport = selectedFields && selectedFields.length > 0 ? selectedFields : availableFields;
  
  const headers = fieldsToExport
    .map(field => field.charAt(0).toUpperCase() + field.slice(1))
    .join(",") + "\n";

  const rows = expenses
    .map((expense) =>
      fieldsToExport
        .map(field => {
          const value = expense[field];
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value || "";
        })
        .join(",")
    )
    .join("\n");

  const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "fintech_expenses.csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getAvailableExpenseFields = () => [
  { id: "date", label: "Date" },
  { id: "category", label: "Category" },
  { id: "description", label: "Description" },
  { id: "amount", label: "Amount" }
];