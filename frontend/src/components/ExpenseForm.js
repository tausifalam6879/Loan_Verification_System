import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { predictExpenseCategoryWithMl } from "../services/aiExpenseService";
import { predictExpenseCategory } from "../utils/expenseIntelligence";

const initialForm = {
  amount: "",
  category: "",
  description: ""
};

const ExpenseForm = ({ onAddExpense, loading }) => {
  const [form, setForm] = useState(initialForm);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);

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
          setForm((current) => ({
            ...current,
            category: normalized.category
          }));
        }
      } catch (error) {
        setMlPrediction(null);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [categoryTouched, form.description]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    
    // Prevent negative values in amount field
    if (field === "amount" && value) {
      const numValue = Number(value);
      if (numValue < 0) {
        return; // Ignore negative input
      }
    }
    
    if (field === "category") {
      setCategoryTouched(true);
    }

    setForm((current) => {
      const next = {
        ...current,
        [field]: value
      };

      if (
        field === "description" &&
        !categoryTouched
      ) {
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
    setForm((current) => ({
      ...current,
      category: prediction.category
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate amount is not negative or zero
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    // Validate category
    if (!form.category.trim()) {
      alert("Please select a category");
      return;
    }

    const expense = {
      amount: amount,
      category: form.category.trim(),
      description: form.description.trim()
    };

    const success = await onAddExpense(expense);
    if (success) {
      setForm(initialForm);
      setCategoryTouched(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        background: "linear-gradient(145deg, #ccfbf1, #eff6ff)",
        border: "1px solid rgba(14, 116, 144, 0.16)",
        boxShadow: "0 14px 34px rgba(8, 47, 73, 0.12)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ color: "#0f172a", fontWeight: 800, mb: 2.5 }}
        >
          Add New Expense
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            type="number"
            label="Amount (Rs.)"
            value={form.amount}
            onChange={handleChange("amount")}
            sx={inputStyle}
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            fullWidth
            label="Category"
            placeholder="Food, Rent, EMI"
            value={form.category}
            onChange={handleChange("category")}
            sx={inputStyle}
          />

          {form.description.trim() && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.5, flexWrap: "wrap", rowGap: 1 }}
            >
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`AI predicts: ${prediction.category}`}
                color={prediction.confidence >= 0.55 ? "primary" : "default"}
                variant="outlined"
                sx={{ fontWeight: 800, bgcolor: "rgba(255,255,255,0.76)" }}
              />
              <Button
                size="small"
                onClick={applyPrediction}
                disabled={prediction.confidence === 0}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Use category
              </Button>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700 }}>
                {predictionSource} - Confidence {Math.round(prediction.confidence * 100)}%
              </Typography>
            </Stack>
          )}

          <TextField
            fullWidth
            required
            label="Description"
            placeholder="Short note"
            value={form.description}
            onChange={handleChange("description")}
            sx={{ ...inputStyle, mb: 2.5 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            startIcon={<AddIcon />}
            sx={{
              py: 1.35,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              background: "linear-gradient(90deg, #0d9488, #2563eb)",
              boxShadow: "0 10px 22px rgba(13, 148, 136, 0.22)",
              "&:hover": { background: "linear-gradient(90deg, #0f766e, #1d4ed8)" }
            }}
          >
            Save Expense
          </Button>
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
  "& .MuiInputBase-input::placeholder": {
    color: "#64748b",
    opacity: 1
  },
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255, 255, 255, 0.82)",
    color: "#0f172a",
    "& fieldset": { borderColor: "rgba(14, 116, 144, 0.32)" },
    "&:hover fieldset": { borderColor: "#0d9488" },
    "&.Mui-focused fieldset": { borderColor: "#2563eb" }
  }
};

export default ExpenseForm;
