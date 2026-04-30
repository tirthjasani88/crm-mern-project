import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Login = () => {
  const { login, loading, error } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="max-w-md w-full space-y-8 card">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="text-center text-sm text-gray-600">
            Or <Link to="/register" className="text-primary-600">create account</Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600">{error}</div>}

          <input name="email" type="email" required placeholder="Email"
            value={formData.email} onChange={handleChange}
            className="input-field" />

          <input name="password" type="password" required placeholder="Password"
            value={formData.password} onChange={handleChange}
            className="input-field" />

          <button type="submit" disabled={loading}
            className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;