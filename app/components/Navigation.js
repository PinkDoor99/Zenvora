// Azure-inspired Navigation Component
'use client';

import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Editor', icon: '✎', active: true },
    { label: 'Files', icon: '📁' },
    { label: 'History', icon: '⏱' },
    { label: 'Settings', icon: '⚙' }
  ];

  return (
    <nav style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E1DFDD',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#0078D4',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            Z
          </div>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#323232'
          }}>
            Zenvora IDE
          </span>
        </div>

        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          gap: '0',
          alignItems: 'center'
        }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              style={{
                background: item.active ? '#F7F7F7' : 'transparent',
                color: item.active ? '#0078D4' : '#606E7C',
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: item.active ? '600' : '500',
                cursor: 'pointer',
                borderBottom: item.active ? '2px solid #0078D4' : 'none',
                transition: 'all 150ms ease'
              }}
              onMouseOver={(e) => {
                if (!item.active) {
                  e.target.style.background = '#F7F7F7';
                  e.target.style.color = '#323232';
                }
              }}
              onMouseOut={(e) => {
                if (!item.active) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#606E7C';
                }
              }}
            >
              <span style={{ marginRight: '6px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* User Menu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#0078D4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            👤
          </div>
        </div>
      </div>
    </nav>
  );
}
