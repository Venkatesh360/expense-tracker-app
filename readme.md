# Expense Tracker App

A full-stack Expense Tracker application that allows users to track their expenses efficiently. The application is divided into separate frontend and backend components.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Architecture and Flow](#architecture-and-flow)
- [API Endpoints](#api-endpoints)
  - [Expense Routes](#expense-routes)
  - [Authentication Routes](#authentication-routes)
- [License](#license)

---

## Project Structure

```
expense-tracker-app/
├── backend/        # Express.js backend
└── frontend/       # React frontend
```

---

## Setup Instructions

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory with the following content:

```ini
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

> Replace `your_mongodb_connection_string` and `your_jwt_secret` with your actual values.

Start the backend server:

```bash
npm start
```

The backend server will run on `http://localhost:5000`.

---

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

---

## Architecture and Flow

The application follows a client-server architecture:

- **Frontend**: Built with React, providing a user-friendly interface to interact with the application. It communicates with the backend via HTTP requests.
- **Backend**: Developed using Express.js, handling API requests, processing data, and interacting with the MongoDB database to store and retrieve expense data.

### Flow

1. The user interacts with the React frontend to add, view, or delete expenses.
2. The frontend sends HTTP requests to the Express.js backend.
3. The backend processes these requests, performs necessary operations on MongoDB, and sends responses.
4. The frontend updates the UI based on the responses.

---

## API Endpoints

### Expense Routes

#### `POST /expenses/createExpense` - Add a New Expense

```js
router.post('/createExpense/', authenticate, async (req, res) => {
  const { title, amount, category, date } = req.body;

  const expense = new Expense({
    title,
    amount,
    category,
    date,
    user: req.user.id
  });

  await expense.save();
  res.status(201).json(expense);
});
```

- Requires authentication.
- Request Body:
```json
{
  "title": "Groceries",
  "amount": 50,
  "category": "Food",
  "date": "2025-04-25"
}
```

#### `GET /expenses/getAllExpense` - Get All Expenses

```js
router.get('/getAllExpense/', authenticate, async (req, res) => {
  const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
  res.json(expenses);
});
```

- Requires authentication.
- Returns list of user's expenses.

#### `PUT /expenses/updateExpense/:id` - Update an Expense

```js
router.put('/updateExpense/:id', authenticate, async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });

  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  const { amount, date } = req.body;
  if (amount) expense.amount = amount;
  if (date) expense.date = date;

  await expense.save();
  res.json(expense);
});
```

- Requires authentication.
- Updates amount or date.

#### `DELETE /expenses/deleteExpense/:id` - Delete an Expense

```js
router.delete('/deleteExpense/:id', authenticate, async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  res.json({ message: 'Expense deleted' });
});
```

- Requires authentication.
- Deletes the specified expense.

---

### Authentication Routes

#### `POST /auth/signup` - User Signup

```js
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: { username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});
```

- Request Body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### `POST /auth/login` - User Login

```js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});
```

- Request Body:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

---

### Authentication Middleware

```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token, authorization denied' });
  }
};

module.exports = authenticate;
```

---
