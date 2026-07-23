import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { QuickViewProvider } from './QuickView';
import CartToast from './CartToast';

export default function StoreLayout() {
  return (
    <QuickViewProvider>
      <div className="min-h-screen flex flex-col bg-parchment">
        <div className="grain-overlay" />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartToast />
      </div>
    </QuickViewProvider>
  );
}
