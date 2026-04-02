'use client';
import React from 'react';

interface AdminCardProps {
  title: string;
  icon?: string | React.ReactNode;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdminCard({
  title,
  icon,
  children,
  rightAction,
  className = '',
  style
}: AdminCardProps) {
  return (
    <div className={`srm-card ${className}`} style={style}>
      <div className="srm-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
          {icon && <span style={{ fontSize: '1.125rem' }}>{icon}</span>}
          <span>{title}</span>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
      <div className="srm-card-body">
        {children}
      </div>
    </div>
  );
}
