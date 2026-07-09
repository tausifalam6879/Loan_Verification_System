import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addExpense,
  deleteExpense,
  getExpenses
} from "../services/expenseService";

const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Session expired. Please login again to fetch expenses.");
      } else {
        setError("Unable to fetch expenses. Please check backend connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const createExpense = async (newExpense) => {
    setLoading(true);
    setError("");

    try {
      await addExpense(newExpense);
      await loadExpenses();
      return true;
    } catch (error) {
      console.error("Error adding expense:", error);
      setError("Unable to add expense.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeExpense = async (id) => {
    setLoading(true);
    setError("");

    try {
      await deleteExpense(id);
      await loadExpenses();
      return true;
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError("Unable to delete expense.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = useMemo(
    () =>
      expenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  return {
    expenses,
    totalExpense,
    loading,
    error,
    loadExpenses,
    createExpense,
    removeExpense
  };
};

export default useExpenses;
