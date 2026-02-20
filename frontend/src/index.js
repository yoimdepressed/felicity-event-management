import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Clean, simple MUI theme — better spacing and colours, stays professional
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',       // Indigo — clean & professional
      light: '#7986cb',
      dark: '#303f9f',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f4f6f9',    // Soft grey page background
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 10,          // Slightly rounded corners everywhere
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '0 2px 6px rgba(63,81,181,0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
