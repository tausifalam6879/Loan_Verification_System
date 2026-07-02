export const exportExpensesToCSV = (expenses, selectedFields = null) => {
  const availableFields = ["date", "time", "category", "description", "amount"];
  const fieldsToExport = selectedFields && selectedFields.length > 0 ? selectedFields : availableFields;
  const formatTimestamp = (expense) => {
    const raw = expense.createdAt || (expense.date ? `${expense.date}T00:00:00` : "");
    const parsed = raw ? new Date(raw) : null;

    if (!parsed || Number.isNaN(parsed.getTime())) {
      return { date: expense.date || "", time: "" };
    }

    return {
      date: parsed.toLocaleDateString("en-IN"),
      time: expense.createdAt ? parsed.toLocaleTimeString("en-IN") : ""
    };
  };
  
  const headers = fieldsToExport
    .map(field => field.charAt(0).toUpperCase() + field.slice(1))
    .join(",") + "\n";

  const rows = expenses
    .map((expense) =>
      fieldsToExport
        .map(field => {
          const timestamp = formatTimestamp(expense);
          const value = field === "date" || field === "time" ? timestamp[field] : expense[field];
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
  { id: "time", label: "Time" },
  { id: "category", label: "Category" },
  { id: "description", label: "Description" },
  { id: "amount", label: "Amount" }
];
