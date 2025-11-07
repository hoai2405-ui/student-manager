import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Box, Button, TextField, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#000000',
    },
  },
  typography: {
    fontSize: 14,
  },
});

const App = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email) {
      navigate('/success');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Card
        title={<span style={{ fontSize: '24px', fontWeight: 600 }}>Thêm học viên mới</span>}
        variant="outlined" // Changed from bordered={true}
        style={{
          maxWidth: 800,
          margin: '20px auto',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent>
          <Box>
            <TextField
              fullWidth
              label="Họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              onClick={handleSubmit}
            >
              Thêm học viên
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ThemeProvider>
  );
};

export default App;