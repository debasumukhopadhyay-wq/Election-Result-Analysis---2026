import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="mt-12 border-t bg-white py-4 text-center text-sm text-gray-500">
        WB Assembly Election 2026 Prediction System &mdash; Powered by AI
      </footer>
    </div>
  );
}
