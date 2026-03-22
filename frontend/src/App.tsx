import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/shared/ErrorBoundary';
import HomePage from './pages/HomePage';
import ConstituencyPage from './pages/ConstituencyPage';
import DashboardPage from './pages/DashboardPage';
import AssemblyResultsPage from './pages/AssemblyResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/constituency/:id" element={<ConstituencyPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assembly/:id" element={<AssemblyResultsPage />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
