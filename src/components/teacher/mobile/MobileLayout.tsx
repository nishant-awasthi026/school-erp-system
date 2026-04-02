'use client';
import React, { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  group?: string;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  nav: NavItem[];
  brandLetter: string;
  brandColor: string;
  brandTitle: string;
  brandSub: string;
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
  userEmail: string;
  theme?: string;
  brandLogo?: string;
}

export default function MobileLayout({
  children,
  nav,
  brandLetter,
  brandColor,
  brandTitle,
  brandSub,
  brandLogo,
  topbarLeft,
  topbarRight,
  userEmail,
  theme,
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change / ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  let prevGroup: string | undefined;

  return (
    <div className={`portal-layout ${theme || ''}`}>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ background: brandColor }}>
            {brandLogo ? (
              <img src={brandLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }} />
            ) : brandLetter}
          </div>
          <div>
            <div className="sidebar-brand-text">{brandTitle}</div>
            <div className="sidebar-brand-sub">{brandSub}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => {
            const showGroup = item.group && item.group !== prevGroup;
            if (item.group) prevGroup = item.group;
            return (
              <div key={item.href}>
                {showGroup && <div className="sidebar-section-label">{item.group}</div>}
                <a
                  href={item.href}
                  className="nav-link"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </a>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {userEmail}
          </div>
          <a href="/api/auth/logout" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          {/* Hamburger - only visible on mobile via CSS */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          {topbarLeft && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {topbarLeft}
            </div>
          )}

          {topbarRight && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', flexShrink: 0 }}>
              {topbarRight}
            </div>
          )}
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
