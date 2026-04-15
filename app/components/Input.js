// Azure-inspired Input Component
export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  label,
  error,
  helperText,
  multiline = false,
  rows = 5
}) {
  const inputStyles = {
    width: '100%',
    padding: multiline ? '12px' : '10px 12px',
    fontSize: '14px',
    fontFamily: type === 'textarea' ? '"Fira Code", monospace' : 'inherit',
    border: error ? '1px solid #E81123' : '1px solid #D0CCCB',
    borderRadius: '4px',
    background: disabled ? '#F7F7F7' : '#FFFFFF',
    color: '#323232',
    transition: 'all 150ms ease',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#323232'
        }}>
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={{
            ...inputStyles,
            resize: 'vertical'
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = '#0078D4';
              e.target.style.boxShadow = '0 0 0 1px #0078D4';
            }
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
            e.target.style.borderColor = error ? '#E81123' : '#D0CCCB';
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyles}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = '#0078D4';
              e.target.style.boxShadow = '0 0 0 1px #0078D4';
            }
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
            e.target.style.borderColor = error ? '#E81123' : '#D0CCCB';
          }}
        />
      )}

      {error && (
        <p style={{
          marginTop: '6px',
          fontSize: '12px',
          color: '#E81123',
          margin: '6px 0 0 0'
        }}>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p style={{
          marginTop: '6px',
          fontSize: '12px',
          color: '#606E7C',
          margin: '6px 0 0 0'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
