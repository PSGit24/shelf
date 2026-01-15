import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
    divider: "#eeeeee",
  },
  shape: {
    borderRadius: 0, // Sharp corners for minimalist look
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),
    h6: {
      fontWeight: 900,
      letterSpacing: "-0.05em",
      textTransform: "uppercase",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "2px solid #000000",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#000000",
            color: "#ffffff",
            boxShadow: "4px 4px 0px #000000",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "2px solid #000000",
          boxShadow: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translate(-2px, -2px)",
            boxShadow: "6px 6px 0px #000000",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 0,
            "& fieldset": {
              borderWidth: "2px",
              borderColor: "#000000",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#000000",
            },
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
