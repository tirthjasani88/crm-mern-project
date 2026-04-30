import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Register = () => {
  const { register, loading, error } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const { confirmPassword, ...userData } = formData;
    await register(userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="max-w-md w-full space-y-8 card">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="text-center text-sm text-gray-600">
            Or <Link to="/login" className="text-primary-600">sign in</Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600">{error}</div>}

          <input name="name" placeholder="Full Name"
            value={formData.name} onChange={handleChange}
            className="input-field" />

          <input name="email" type="email" placeholder="Email"
            value={formData.email} onChange={handleChange}
            className="input-field" />

          <select name="role" value={formData.role}
            onChange={handleChange} className="input-field">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>

          <input name="password" type="password" placeholder="Password"
            value={formData.password} onChange={handleChange}
            className="input-field" />

          <input name="confirmPassword" type="password" placeholder="Confirm Password"
            value={formData.confirmPassword} onChange={handleChange}
            className="input-field" />

          <button type="submit" disabled={loading}
            className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;