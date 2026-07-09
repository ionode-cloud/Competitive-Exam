import React from 'react';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';

export default function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(145deg, #ffffff 0%, #dbeafe 45%, #bfdbfe 100%)', backgroundAttachment: 'fixed' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '60px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
