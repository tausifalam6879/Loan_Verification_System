import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { predictExpenseCategoryWithMl } from "../services/aiExpenseService";
import { predictExpenseCategory } from "../utils/expenseIntelligence";

const toDateInput = (value) => {
  if (!value) {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const emptyForm = () => ({
  amount: "",
  category: "",
  description: "",
  date: toDateInput(),
  merchant: "",
  paymentMethod: "UPI",
  recurring: false
});

const paymentMethods = ["UPI", "Card", "Cash", "Bank Transfer", "Wallet", "Auto Debit", "Other"];

const ExpenseForm = ({
  onAddExpense,
  onUpdateExpense,
  editingExpense,
  onCancelEdit,
  loading
}) => {
  const [form, setForm] = useState(emptyForm);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);
  const isEditing = Boolean(editingExpense);

  useEffect(() => {
    if (!editingExpense) {
      setForm(emptyForm());
      setCategoryTouched(false);
      return;
    }

    setForm({
      amount: editingExpense.amount ?? "",
      category: editingExpense.category || "",
      description: editingExpense.description || "",
      date: toDateInput(editingExpense.date),
      merchant: editingExpense.merchant || "",
      paymentMethod: editingExpense.paymentMethod || "UPI",
      recurring: Boolean(editingExpense.recurring)
    });
    setCategoryTouched(true);
  }, [editingExpense]);

  const fallbackPrediction = useMemo(
    () => predictExpenseCategory(form.description),
    [form.description]
  );
  const prediction = mlPrediction || fallbackPrediction;
  const predictionSource = mlPrediction?.source === "python-ml-service" ? "Python ML model" : "Local fallback";

  useEffect(() => {
    const description = form.description.trim();

    if (description.length < 2) {
      setMlPrediction(null);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await predictExpenseCategoryWithMl(description);
        if (!result?.category) {
          setMlPrediction(null);
          return;
        }

        const normalized = {
          category: result.category,
          confidence: Number(result.confidence || 0),
          source: result.source || "python-ml-service",
          modelVersion: result.modelVersion || result.model_version
        };

        setMlPrediction(normalized);
        if (!categoryTouched && normalized.confidence >= 0.55) {
          setForm((current) => ({ ...current, category: normalized.category }));
        }
      } catch (error) {
        setMlPrediction(null);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [categoryTouched, form.description]);

  const handleChange = (field) => (event) => {
    const value = field === "recurring" ? event.target.checked : event.target.value;
    if (field === "amount" && value && Number(value) < 0) {
      return;
    }
    if (field === "category") {
      setCategoryTouched(true);
    }

    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "description" && !categoryTouched) {
        const suggested = predictExpenseCategory(value);
        if (suggested.confidence >= 0.55) {
          next.category = suggested.category;
        }
      }
      return next;
    });
  };

  const applyPrediction = () => {
    setCategoryTouched(true);
    setForm((current) => ({ ...current, category: prediction.category }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setCategoryTouched(false);
    setMlPrediction(null);
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || !form.category.trim()) {
      return;
    }

    const expense = {
      amount,
      category: form.category.trim(),
      description: form.description.trim(),
      date: form.date,
      merchant: form.merchant.trim(),
      paymentMethod: form.paymentMethod,
      recurring: form.recurring
    };

    const result = isEditing
      ? await onUpdateExpense(editingExpense.id, expense)
      : await onAddExpense(expense);

    if (result) {
      resetForm();
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        background: isEditing
          ? "linear-gradient(145deg, #fef3c7, #eff6ff)"
          : "linear-gradient(145deg, #ccfbf1, #eff6ff)",
        border: `1px solid ${isEditing ? "rgba(217, 119, 6, 0.28)" : "rgba(14, 116, 144, 0.16)"}`,
        boxShadow: "0 14px 34px rgba(8, 47, 73, 0.12)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>
              {isEditing ? "Edit Expense" : "Add New Expense"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
              {isEditing ? "Update the selected transaction" : "Track date, merchant and payment method"}
            </Typography>
          </Box>
          {isEditing && <Chip label={`#${editingExpense.id}`} color="warning" size="small" />}
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              required
              type="number"
              label="Amount (Rs.)"
              value={form.amount}
              onChange={handleChange("amount")}
              sx={inputStyle}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            <TextField
              fullWidth
              required
              type="date"
              label="Expense date"
              value={form.date}
              onChange={handleChange("date")}
              InputLabelProps={{ shrink: true }}
              sx={inputStyle}
            />
          </Stack>

          <TextField
            fullWidth
            required
            label="Description"
            placeholder="Example: Swiggy dinner order"
            value={form.description}
            onChange={handleChange("description")}
            inputProps={{ maxLength: 240 }}
            sx={inputStyle}
          />

          {form.description.trim() && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`AI predicts: ${prediction.category}`}
                color={prediction.confidence >= 0.55 ? "primary" : "default"}
                variant="outlined"
                sx={{ fontWeight: 800, bgcolor: "rgba(255,255,255,0.76)" }}
              />
              <Button size="small" onClick={applyPrediction} disabled={prediction.confidence === 0} sx={{ textTransform: "none", fontWeight: 800 }}>
                Use category
              </Button>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700 }}>
                {predictionSource} · {Math.round(prediction.confidence * 100)}% confidence
              </Typography>
            </Stack>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              required
              label="Category"
              placeholder="Food, Rent, EMI"
              value={form.category}
              onChange={handleChange("category")}
              inputProps={{ maxLength: 60 }}
              sx={inputStyle}
            />
            <TextField
              fullWidth
              label="Merchant"
              placeholder="Swiggy, Amazon, Landlord"
              value={form.merchant}
              onChange={handleChange("merchant")}
              inputProps={{ maxLength: 100 }}
              sx={inputStyle}
            />
          </Stack>

          <TextField
            select
            fullWidth
            label="Payment method"
            value={form.paymentMethod}
            onChange={handleChange("paymentMethod")}
            sx={inputStyle}
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method} value={method}>{method}</MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={<Checkbox checked={form.recurring} onChange={handleChange("recurring")} />}
            label="This is a recurring expense or subscription"
            sx={{ color: "#334155", mb: 1.5 }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={isEditing ? <EditIcon /> : <AddIcon />}
              sx={{
                py: 1.35,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
                background: isEditing
                  ? "linear-gradient(90deg, #d97706, #2563eb)"
                  : "linear-gradient(90deg, #0d9488, #2563eb)"
              }}
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Save Expense"}
            </Button>
            {isEditing && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CloseIcon />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, minWidth: 120 }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

const inputStyle = {
  mb: 1.5,
  "& .MuiInputLabel-root": { color: "#334155" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#0d9488" },
  "& .MuiInputBase-input": { color: "#0f172a" },
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255, 255, 255, 0.82)",
    color: "#0f172a",
    "& fieldset": { borderColor: "rgba(14, 116, 144, 0.32)" },
    "&:hover fieldset": { borderColor: "#0d9488" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" }
  }
};

export default ExpenseForm;
