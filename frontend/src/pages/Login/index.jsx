import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const { login } = useAuth(); // Corrección: extrae login del contexto
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            await login(credentials); // Corrección: llama a login con las credenciales
            navigate('/dashboard');
        } catch (err) {
            console.error('Error en el login:', err);
            setError(err.message || 'Error al iniciar sesión.');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h1>Iniciar Sesión</h1>
                {error && <div className="error-message">{error}</div>}
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required autoComplete="username" />
                <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} autoComplete="current-password" required  /> 
                
                <button type="submit">Iniciar Sesión</button>
            </form>
        </div>
    );
};

export default Login;