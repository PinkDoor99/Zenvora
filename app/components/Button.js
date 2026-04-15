// Azure-inspired Button Component
export default function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false
}) {
  const baseStyles = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: disabled || loading ? 0.6 : 1,
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 28px' : '8px 20px',
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const variantStyles = {
    primary: {
      background: '#0078D4',
      color: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
    },
    secondary: {
      background: '#F3F2F1',
      color: '#323232',
      border: '1px solid #D0CCCB'
    },
    tertiary: {
      background: 'transparent',
      color: '#0078D4',
      border: '1px solid #0078D4'
    },
    danger: {
      background: '#E81123',
      color: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
    }
  };

  const hoverStyles = {
    primary: '#106EBE',
    secondary: '#EDEBE9',
    tertiary: '#0078D4',
    danger: '#C50F1F'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyles,
        ...variantStyles[variant]
      }}
      onMouseOver={(e) => !disabled && !loading && (e.target.style.background = hoverStyles[variant])}
      onMouseOut={(e) => !disabled && !loading && (e.target.style.background = variantStyles[variant].background)}
    >
      {loading && '⏳ '}
      {children}
    </button>
  );
}
