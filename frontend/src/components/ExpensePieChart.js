import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography
} from "@mui/material";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { motion } from "framer-motion";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#7c3aed",
  "#334155"
];

const ExpensePieChart = ({ expenses, loading }) => {
  const data = useMemo(() => {
    const categoryTotals = {};

    expenses.forEach((expense) => {
      const category = (expense.category || "uncategorized").toLowerCase();
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    }));
  }, [expenses]);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        background: "linear-gradient(145deg, #dbeafe, #f0fdfa)",
        border: "1px solid rgba(37, 99, 235, 0.14)",
        boxShadow: "0 14px 34px rgba(8, 47, 73, 0.12)"
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="h6"
          sx={{ color: "#0f172a", fontWeight: 800, mb: 2 }}
        >
          Category Analytics
        </Typography>

        <Box
          sx={{
            height: 280,
            borderRadius: 2,
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.82), rgba(224, 242, 254, 0.68))",
            border: "1px solid rgba(37, 99, 235, 0.12)",
            p: 1
          }}
        >
          {loading ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: "#64748b"
              }}
            >
              <Box>
                <DonutLargeIcon sx={{ fontSize: 42, color: "#94a3b8" }} />
                <Typography sx={{ mt: 1, fontWeight: 700 }}>
                  No expense data yet
                </Typography>
              </Box>
            </Box>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`Rs. ${value}`, "Amount"]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span
                        style={{
                          color: "#334155",
                          fontWeight: 700,
                          textTransform: "capitalize"
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensePieChart;
