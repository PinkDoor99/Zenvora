// Azure-inspired Card Component
export default function Card({
  children,
  title,
  subtitle,
  footer,
  header,
  padding = true,
  variant = 'default',
  onClick
}) {
  const variantStyles = {
    default: {
      background: '#FFFFFF',
      border: '1px solid #E1DFDD',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
    },
    elevated: {
      background: '#FFFFFF',
      border: '1px solid #E1DFDD',
      boxShadow: '0 3.2px 7.2px rgba(0, 0, 0, 0.132), 0 0.6px 1.8px rgba(0, 0, 0, 0.108)'
    },
    subtle: {
      background: '#F7F7F7',
      border: '1px solid #E1DFDD',
      boxShadow: 'none'
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...variantStyles[variant],
        borderRadius: '4px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        overflow: 'hidden'
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 6.4px 14.4px rgba(0, 0, 0, 0.132)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow;
        }
      }}
    >
      {header && (
        <div style={{ background: '#F7F7F7', borderBottom: '1px solid #E1DFDD' }}>
          {header}
        </div>
      )}

      {(title || subtitle) && (
        <div style={{ padding: '16px' }}>
          {title && (
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#323232' }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ margin: 0, fontSize: '12px', color: '#606E7C' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ padding: padding ? '16px' : '0' }}>
        {children}
      </div>

      {footer && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E1DFDD', background: '#F7F7F7' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
