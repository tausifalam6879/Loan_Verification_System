const BASE_URL = "http://localhost:8081/api/expenses";

// Get All Expenses
export const getExpenses = async () => {
  try {
    const response = await fetch(`${BASE_URL}/all`);

    if (!response.ok) {
      throw new Error("Failed to fetch expenses");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
};

// Add Expense
export const addExpense = async (expense) => {
  try {
    const response = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(expense)
    });

    if (!response.ok) {
      throw new Error("Failed to add expense");
    }

    return await response.text();
  } catch (error) {
    console.error("Error adding expense:", error);
  }
};

// Delete Expense
export const deleteExpense = async (id) => {
  try {
    const response = await fetch(
      `${BASE_URL}/delete/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete expense");
    }

    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    return false;
  }
};
