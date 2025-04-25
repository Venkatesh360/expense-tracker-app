import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';
import { useAuth } from '../context/AuthContext'; // ⬅️ import the hook

const Signup = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // ⬅️ use login from context to set user

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
  
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
  
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
  
      const { token, user } = res.data;
  
      if (token && user) {
        login({
          token,
          username: user.username,
          email: user.email
        });
        navigate('/dashboard');
      } else {
        throw new Error('Signup response missing token or user');
      }
  
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };
  
  return (
    <div className="signup-container">
      <h2 className="signup-title">Sign Up</h2>
      <form className="signup-form" onSubmit={handleSignup}>
        <div className="form-group">
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="signup-button">
          Sign Up
        </button>
      </form>
      <p className="login-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Signup;
