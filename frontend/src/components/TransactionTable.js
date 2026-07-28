import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
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
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";

const TransactionTable = ({
  showRecents,
  tableData,
  filters,
  onDelete,
  onEdit,
  onExport,
  loading
}) => {
  const [pendingDelete, setPendingDelete] = useState(null);
  const { expenses, categories } = tableData;
  const {
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    sortKey,
    setSortKey,
    tabValue,
    setTabValue,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo
  } = filters;

  const getExpenseDate = (expense) => {
    const raw = expense.createdAt || (expense.date ? `${expense.date}T00:00:00` : "");
    const parsed = raw ? new Date(raw) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return { date: expense.date || "-", time: "-" };
    return {
      date: parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: expense.createdAt
        ? parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "-"
    };
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const success = await onDelete(pendingDelete.id);
    if (success) setPendingDelete(null);
  };

  return (
    <>
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
            <Stack direction={{ xs: "column", lg: "row" }} sx={{ justifyContent: "space-between", gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 900 }}>Transactions</Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>{expenses.length} matching records · search, filter, edit and export</Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  placeholder="Search merchant or expense"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
                  sx={fieldStyle}
                />
                <TextField select size="small" label="Sort by" value={sortKey} onChange={(event) => setSortKey(event.target.value)} sx={{ ...fieldStyle, minWidth: 120 }}>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </TextField>
                <Tooltip title={`Sort ${sortOrder === "desc" ? "ascending" : "descending"}`}>
                  <IconButton onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")} sx={iconButtonStyle}>
                    <SortIcon sx={{ transform: sortOrder === "asc" ? "rotate(180deg)" : "none" }} />
                  </IconButton>
                </Tooltip>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onExport} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Export filtered
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
              <TextField size="small" type="date" label="From date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} sx={fieldStyle} />
              <TextField size="small" type="date" label="To date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} sx={fieldStyle} />
              {(dateFrom || dateTo) && (
                <Button onClick={() => { setDateFrom(""); setDateTo(""); }} sx={{ textTransform: "none", fontWeight: 800 }}>Clear dates</Button>
              )}
            </Stack>

            <Tabs
              value={tabValue}
              onChange={(event, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.56)", borderRadius: 2, borderBottom: "1px solid rgba(14, 116, 144, 0.16)", "& .MuiTabs-indicator": { backgroundColor: "#2563eb" } }}
            >
              {categories.map((category) => (
                <Tab key={category} label={category.toUpperCase()} value={category} sx={{ fontWeight: 800, color: "#64748b", "&.Mui-selected": { color: "#2563eb" } }} />
              ))}
            </Tabs>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflowX: "auto", border: "1px solid rgba(14, 116, 144, 0.14)", color: "#0f172a" }}>
              <Table sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(90deg, #bae6fd, #ccfbf1)" }}>
                    <TableCell sx={headCellStyle}>Date</TableCell>
                    <TableCell sx={headCellStyle}>Category</TableCell>
                    <TableCell sx={headCellStyle}>Details</TableCell>
                    <TableCell sx={headCellStyle}>Payment</TableCell>
                    <TableCell sx={headCellStyle}>Amount</TableCell>
                    <TableCell sx={headCellStyle} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={28} /></TableCell></TableRow>
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ py: 5, display: "grid", placeItems: "center", textAlign: "center", color: "#64748b" }}>
                          <ReceiptLongIcon sx={{ fontSize: 42, mb: 1 }} />
                          <Typography sx={{ fontWeight: 800 }}>No transactions found</Typography>
                          <Typography variant="body2">Add a new expense or adjust your filters.</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : expenses.map((expense, index) => {
                    const timestamp = getExpenseDate(expense);
                    return (
                      <TableRow key={expense.id} hover sx={{ background: index % 2 === 0 ? "rgba(240, 253, 250, 0.78)" : "rgba(239, 246, 255, 0.86)" }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{timestamp.date}</Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>{timestamp.time}</Typography>
                        </TableCell>
                        <TableCell><Chip size="small" label={expense.category} sx={{ textTransform: "capitalize", bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 800 }} /></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700 }}>{expense.description || "No description"}</Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>{expense.merchant || "Merchant not set"}</Typography>
                          {expense.recurring && <Chip size="small" label="Recurring" color="secondary" variant="outlined" sx={{ ml: 1, height: 20 }} />}
                        </TableCell>
                        <TableCell sx={{ color: "#475569", fontWeight: 700 }}>{expense.paymentMethod || "-"}</TableCell>
                        <TableCell sx={{ color: "#ef4444", fontWeight: 900 }}>- {Number(expense.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit expense"><IconButton color="primary" onClick={() => onEdit(expense)} size="small"><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete expense"><IconButton color="error" onClick={() => setPendingDelete(expense)} size="small"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Collapse>

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete this expense?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingDelete ? `${pendingDelete.description || pendingDelete.category} · ${Number(pendingDelete.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}` : ""}
            {" "}will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const fieldStyle = {
  minWidth: { xs: "100%", sm: 190 },
  "& .MuiOutlinedInput-root": { bgcolor: "#ffffff", color: "#0f172a", "& fieldset": { borderColor: "rgba(14, 116, 144, 0.28)" } }
};

const iconButtonStyle = { border: "1px solid rgba(37, 99, 235, 0.18)", borderRadius: 2, color: "#2563eb", bgcolor: "#eef6ff" };
const headCellStyle = { color: "#075985", fontWeight: 900 };

export default TransactionTable;
