// src/pages/Register/index.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h1>Registro</h1>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          placeholder="Nombre de usuario"
          required
          autoComplete="username"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Email"
          required
          autoComplete="username"

        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="Contraseña"
          required
          autoComplete="current-password"
        />
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          placeholder="Confirmar contraseña"
          required
          autoComplete="new-password"
        />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default Register;