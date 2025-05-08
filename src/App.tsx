import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, Paper } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginButton from './components/GoogleLoginButton';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId="709197061925-tg6pcu9t74dblq12hbpg6hp8mbbncntd.apps.googleusercontent.com">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h3" component="h1" gutterBottom>
                Gmail Reader
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
                Welcome to your Gmail Reader Application
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This application will help you manage and read your Gmail messages efficiently.
              </Typography>
              <GoogleLoginButton />
            </Paper>
          </Box>
        </Container>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
