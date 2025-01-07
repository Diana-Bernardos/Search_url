
// src/components/common/Navbar/index.jsx 
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
 const { user, logout } = useAuth();
 const navigate = useNavigate();

 const handleLogout = () => {
   logout();
   navigate('/login');
 };
 

 return (
   <nav className="navbar">
     <Link to="/" className="navbar-brand">Web Scraper</Link>
     <div className="navbar-links">
       {user ? (
         <>
           <span className="navbar-user">Hello, {user.username}</span>
           <button onClick={handleLogout} className="logout-button">
             Logout
           </button>
         </>
       ) : (
         <>
           <Link to="/login" className="nav-link">Login</Link>
           <Link to="/register" className="nav-link">Register</Link>
         </>
       )}
     </div>
   </nav>
 );
};

export default Navbar;