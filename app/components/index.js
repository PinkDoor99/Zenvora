// Component Library Exports
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Navigation } from './Navigation';
export { default as Input } from './Input';
export { default as Badge } from './Badge';

// Azure Design Tokens
export const AzureTheme = {
  colors: {
    primary: '#0078D4',
    primaryHover: '#106EBE',
    primaryActive: '#0063B1',
    secondary: '#50E6FF',
    success: '#107C10',
    warning: '#FFB900',
    danger: '#E81123',
    
    // Neutrals
    foreground: '#323232',
    foregroundSecondary: '#606E7C',
    foregroundTertiary: '#959CA5',
    
    background: '#FFFFFF',
    backgroundSecondary: '#F7F7F7',
    backgroundTertiary: '#EDEBE9',
    
    border: '#E1DFDD',
    borderLight: '#D0CCCB'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.08)',
    medium: '0 3.2px 7.2px rgba(0, 0, 0, 0.132), 0 0.6px 1.8px rgba(0, 0, 0, 0.108)',
    large: '0 6.4px 14.4px rgba(0, 0, 0, 0.132)',
    xlarge: '0 12.8px 28.8px rgba(0, 0, 0, 0.132)'
  },
  radii: {
    sm: '2px',
    md: '4px',
    lg: '8px'
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
