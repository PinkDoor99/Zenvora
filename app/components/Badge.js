// Azure-inspired Badge Component
export default function Badge({
  children,
  variant = 'default',
  size = 'medium'
}) {
  const variantStyles = {
    default: {
      background: '#F7F7F7',
      color: '#323232',
      border: '1px solid #E1DFDD'
    },
    primary: {
      background: '#E7F3FF',
      color: '#0078D4',
      border: '1px solid #0078D4'
    },
    success: {
      background: '#DFF6DD',
      color: '#107C10',
      border: '1px solid #107C10'
    },
    warning: {
      background: '#FFF4CE',
      color: '#FFB900',
      border: '1px solid #FFB900'
    },
    danger: {
      background: '#FDE7E9',
      color: '#E81123',
      border: '1px solid #E81123'
    },
    info: {
      background: '#E7F3FF',
      color: '#0078D4',
      border: '1px solid #0078D4'
    }
  };

  const sizeStyles = {
    small: {
      padding: '2px 6px',
      fontSize: '11px'
    },
    medium: {
      padding: '4px 8px',
      fontSize: '12px'
    },
    large: {
      padding: '6px 12px',
      fontSize: '13px'
    }
  };

  return (
    <span style={{
      ...variantStyles[variant],
      ...sizeStyles[size],
      borderRadius: '2px',
      fontWeight: '500',
      display: 'inline-block',
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
}
