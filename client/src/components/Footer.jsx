import React from 'react';

const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: '1.5rem', marginTop: 'auto', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <strong style={{ color: '#0f172a' }}>Study Check Online Assessment Portal</strong> &copy; {new Date().getFullYear()} — B.Tech Full Stack Web Application
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>React 19 &bull; Express &bull; Node.js &bull; MongoDB</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>&bull; Authoritative Server Timing</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
