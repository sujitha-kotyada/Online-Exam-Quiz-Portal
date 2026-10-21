import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ wide = false }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className={wide ? 'main-content-wide' : 'main-content'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
