// src/routes/index.js
import { lazy } from 'react';

export const routes = {
  public: [
    { path: '/login', component: lazy(() => import('../pages/Login')) },
    { path: '/register', component: lazy(() => import('../pages/Register')) }
  ],
  private: [
    { path: '/dashboard', component: lazy(() => import('../pages/DashBoard/')) }
  ]
};