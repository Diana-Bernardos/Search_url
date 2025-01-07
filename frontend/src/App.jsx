// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScraperProvider } from './context/ScraperContext';
import PrivateRoute from './components/common/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/common/Navbar';
import './styles/global.css';

const Login = React.lazy(() => import('./pages/Login/index'));
const Register = React.lazy(() => import('./pages/Register/index'));
const Dashboard = React.lazy(() => import('./pages/DashBoard/index'));

const App = () => {
 return (
   <BrowserRouter>
     <ErrorBoundary>
       <AuthProvider>
         <ScraperProvider>
           <div className="app">
             <Navbar />
             <main className="main-content">
               <Suspense fallback={<LoadingSpinner />}>
                 <Routes>
                   <Route path="/login" element={<Login />} />
                   <Route path="/register" element={<Register />} />
                   <Route path="/dashboard" element={
                     <PrivateRoute>
                       <Dashboard />
                     </PrivateRoute>
                   } />
                   <Route path="/" element={<Navigate to="/dashboard" replace />} />
                   <Route path="*" element={
                     <div className="not-found">
                       <h1>404</h1>
                       <p>Página no encontrada</p>
                     </div>
                   } />
                 </Routes>
               </Suspense>
             </main>
           </div>
         </ScraperProvider>
       </AuthProvider>
     </ErrorBoundary>
   </BrowserRouter>
 );
};

export default App;
