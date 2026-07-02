import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";

const TransactionTable = ({
  showRecents,
  tableData,
  filters,
  onDelete,
  loading
}) => {
  const { expenses, categories } = tableData;
  const {
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    tabValue,
    setTabValue
  } = filters;

  const getExpenseDate = (expense) => {
    const raw = expense.createdAt || (expense.date ? `${expense.date}T00:00:00` : "");
    const parsed = raw ? new Date(raw) : null;

    if (!parsed || Number.isNaN(parsed.getTime())) {
      return { date: expense.date || "-", time: "-" };
    }

    return {
      date: parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      time: expense.createdAt
        ? parsed.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })
        : "-"
    };
  };

  return (
    <Collapse in={showRecents}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          background: "linear-gradient(145deg, #ecfeff, #eff6ff)",
          border: "1px solid rgba(14, 116, 144, 0.16)",
          boxShadow: "0 14px 34px rgba(8, 47, 73, 0.12)",
          color: "#0f172a"
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 2
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ color: "#0f172a", fontWeight: 800 }}
              >
                Recent Transactions
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Search, filter and sort your expenses
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Tooltip title="Sort by amount">
                <IconButton
                  onClick={() =>
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                  }
                  sx={{
                    border: "1px solid rgba(37, 99, 235, 0.18)",
                    borderRadius: 2,
                    color: "#2563eb",
                    bgcolor: "#eef6ff"
                  }}
                >
                  <SortIcon />
                </IconButton>
              </Tooltip>

              <TextField
                size="small"
                placeholder="Search expenses"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 240 },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#ffffff",
                    color: "#0f172a",
                    "& fieldset": { borderColor: "rgba(14, 116, 144, 0.28)" }
                  },
                  "& .MuiInputBase-input": { color: "#0f172a" },
                  "& .MuiInputBase-input::placeholder": { color: "#64748b", opacity: 1 }
                }}
              />
            </Box>
          </Box>

          <Tabs
            value={tabValue}
            onChange={(event, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              bgcolor: "rgba(255,255,255,0.56)",
              borderRadius: 2,
              borderBottom: "1px solid rgba(14, 116, 144, 0.16)",
              "& .MuiTabs-indicator": { backgroundColor: "#2563eb" }
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category}
                label={category.toUpperCase()}
                value={category}
                sx={{
                  fontWeight: 800,
                  color: "#64748b",
                  "&.Mui-selected": { color: "#2563eb" }
                }}
              />
            ))}
          </Tabs>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(14, 116, 144, 0.14)", color: "#0f172a" }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: "linear-gradient(90deg, #bae6fd, #ccfbf1)" }}>
                  <TableCell sx={headCellStyle}>Date</TableCell>
                  <TableCell sx={headCellStyle}>Time</TableCell>
                  <TableCell sx={headCellStyle}>Category</TableCell>
                  <TableCell sx={headCellStyle}>Description</TableCell>
                  <TableCell sx={headCellStyle}>Amount</TableCell>
                  <TableCell sx={headCellStyle} align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box
                        sx={{
                          py: 5,
                          display: "grid",
                          placeItems: "center",
                          textAlign: "center",
                          color: "#64748b"
                        }}
                      >
                        <ReceiptLongIcon sx={{ fontSize: 42, mb: 1 }} />
                        <Typography sx={{ fontWeight: 800 }}>
                          No transactions found
                        </Typography>
                        <Typography variant="body2">
                          Add a new expense or adjust your filters.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => {
                    const timestamp = getExpenseDate(expense);

                    return (
                      <TableRow
                        key={expense.id}
                        hover
                        sx={{
                          background:
                            expenses.indexOf(expense) % 2 === 0
                              ? "rgba(240, 253, 250, 0.78)"
                              : "rgba(239, 246, 255, 0.86)"
                        }}
                      >
                        <TableCell>{timestamp.date}</TableCell>
                        <TableCell>{timestamp.time}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={expense.category}
                            sx={{
                              textTransform: "capitalize",
                              bgcolor: "#dbeafe",
                              color: "#1d4ed8",
                              fontWeight: 800
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#0f172a" }}>{expense.description}</TableCell>
                        <TableCell sx={{ color: "#ef4444", fontWeight: 900 }}>
                          - Rs. {Number(expense.amount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete expense">
                            <IconButton
                              color="error"
                              onClick={() => onDelete(expense.id)}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Collapse>
  );
};

const headCellStyle = {
  color: "#075985",
  fontWeight: 900
};

export default TransactionTable;
