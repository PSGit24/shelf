import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Box, Button, Container, TextField, Typography, Alert, Stack } from "@mui/material";

export default function LoginPage({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 4, letterSpacing: "-0.05em", textAlign: "center" }}>
          SHELF.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
            
            <TextField
              label="USERNAME"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputLabelProps={{ sx: { fontWeight: 700 } }}
              required
            />
            
            <TextField
              label="PASSWORD"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ sx: { fontWeight: 700 } }}
              required
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                bgcolor: "#000000",
                color: "#ffffff",
                borderRadius: 0,
                fontWeight: 800,
                fontSize: "1rem",
                "&:hover": { bgcolor: "#333333" }
              }}
            >
              LOGIN
            </Button>

            <Typography variant="body2" align="center" sx={{ fontWeight: 600, color: "#666666" }}>
              DON'T HAVE AN ACCOUNT?{" "}
              <span 
                style={{ color: "#000000", textDecoration: "underline", cursor: "pointer" }}
                onClick={onSwitchToSignup}
              >
                SIGN UP
              </span>
            </Typography>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}
