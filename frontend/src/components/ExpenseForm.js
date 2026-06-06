import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const initialForm = {
  amount: "",
  category: "",
  description: ""
};

const ExpenseForm = ({ onAddExpense, loading }) => {
  const [form, setForm] = useState(initialForm);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    
    // Prevent negative values in amount field
    if (field === "amount" && value) {
      const numValue = Number(value);
      if (numValue < 0) {
        return; // Ignore negative input
      }
    }
    
    setForm((current) => ({
      ...current,
      [field]: value
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
            required
            label="Category"
            placeholder="Food, Rent, EMI"
            value={form.category}
            onChange={handleChange("category")}
            sx={inputStyle}
          />

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
