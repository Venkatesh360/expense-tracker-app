import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./Dashboard.css"; // Import the CSS file
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [updatedExpense, setUpdatedExpense] = useState({}); // Store updates by expense ID
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          "http://localhost:5000/api/expense/getAllExpense",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setExpenses(response.data);
        // Initialize updatedExpense state with current amounts
        const initialUpdatedExpense = response.data.reduce((acc, expense) => {
          acc[expense._id] = { amount: String(expense.amount) };
          return acc;
        }, {});
        setUpdatedExpense(initialUpdatedExpense);
      } catch (err) {
        setError(err.message || "Failed to fetch expenses");
        console.error("Error fetching expenses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user?.token]);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const { category, amount } = expense;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  const categoryData = Object.entries(expensesByCategory).map(
    ([category, total]) => ({
      name: category,
      value: total,
    })
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense((prevExpense) => ({
      ...prevExpense,
      [name]: value,
    }));
  };

  const handleUpdateFieldChange = (id, value) => {
    setUpdatedExpense((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        amount: value,
      },
    }));
  };


  const handleUpdateExpense = async (id) => {
    const updatedData = updatedExpense[id];
    if (!updatedData || !updatedData.amount || isNaN(updatedData.amount)) {
      setSubmissionError("Invalid amount provided.");
      return;
    }
  
    try {
      // Perform the update operation
      await axios.put(
        `http://localhost:5000/api/expense/updateExpense/${id}`,
        { amount: parseFloat(updatedData.amount) },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
  
      // After update, refetch expenses
      const response = await axios.get(
        "http://localhost:5000/api/expense/getAllExpense",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setExpenses(response.data);
  
      // Update the `updatedExpense` state with the new amount for the updated expense
      const newUpdatedExpense = response.data.reduce((acc, expense) => {
        acc[expense._id] = { amount: String(expense.amount) };
        return acc;
      }, {});
      setUpdatedExpense(newUpdatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      setSubmissionError(error.response?.data?.message || "Failed to update expense");
    }
  };
  
  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expense/deleteExpense/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      // Refresh expenses
      const response = await axios.get(
        "http://localhost:5000/api/expense/getAllExpense",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setExpenses(response.data);
      // Update the updatedExpense state after deletion
      const newUpdatedExpense = response.data.reduce((acc, expense) => {
        acc[expense._id] = { amount: String(expense.amount) };
        return acc;
      }, {});
      setUpdatedExpense(newUpdatedExpense);
    } catch (error) {
      console.error("Error deleting expense:", error);
      // Optionally set an error message for deletion
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setSubmissionError(null);
    try {
      await axios.post(
        "http://localhost:5000/api/expense/createExpense",
        {
          ...newExpense,
          amount: parseFloat(newExpense.amount),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      // After successful creation, refetch expenses
      const response = await axios.get(
        "http://localhost:5000/api/expense/getAllExpense",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setExpenses(response.data);
      // Reset the form
      setNewExpense({ title: "", amount: "", category: "", date: new Date().toISOString().slice(0, 10) });
    } catch (error) {
      setSubmissionError(error.response?.data?.message || "Failed to create expense");
      console.error("Error creating expense:", error);
    }
  };

  if (loading) {
    return <p className="loading">Loading dashboard data...</p>;
  }

  if (error) {
    return <p className="error">Error loading dashboard data: {error}</p>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="expense-summary">
        <h2 className="section-title">Expense Summary by Category</h2>
        {Object.keys(expensesByCategory).length > 0 ? (
          <table className="summary-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Expense</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(expensesByCategory).map(([category, total]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>${total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No expenses recorded yet to summarize.</p>
        )}
      </div>

      <div className="expense-pie-chart">
        <h2 className="section-title">Expense Distribution</h2>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-data">No expense data available for the pie chart.</p>
        )}
      </div>

<div className="detailed-expenses">
  <h2 className="section-title">Detailed Expenses</h2>
  {loading ? (
    <p className="loading">Loading detailed expenses...</p>
  ) : expenses.length > 0 ? (
    <table className="detailed-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Amount</th>
          <th>Category</th>
          <th>Date</th>
          <th>New Amount</th>
          <th>Update</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => (
          <tr key={expense._id}>
            <td>{expense.title}</td>
            <td>${expense.amount.toFixed(2)}</td>
            <td>{expense.category}</td>
            <td>
              {new Date(expense.date).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
            <td>
              <input
                type="number"
                placeholder={expense.amount.toFixed(2)}
                value={updatedExpense[expense._id]?.amount || ""}
                onChange={(e) => handleUpdateFieldChange(expense._id, e.target.value)}
                className="update-input"
                min="0"
              />
            </td>
            <td>
              <button
                className="update-button"
                onClick={() => handleUpdateExpense(expense._id)}
                disabled={!updatedExpense[expense._id]?.amount || isNaN(updatedExpense[expense._id]?.amount) || updatedExpense[expense._id]?.amount <= 0}
              >
                Update
              </button>
            </td>
            <td>
              <button className="delete-button" onClick={() => handleDeleteExpense(expense._id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="no-data">No expenses recorded yet.</p>
  )}
</div>


      <div className="new-expense-form">
        <h2 className="section-title">Create New Expense</h2>
        {submissionError && <p className="error-message">{submissionError}</p>}
        <form onSubmit={handleCreateExpense}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newExpense.title}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={newExpense.amount}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <input
              type="text"
              id="category"
              name="category"
              value={newExpense.category}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={newExpense.date}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <button type="submit" className="submit-button">
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;