import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import UserContext from "./context/userContext";
import { useEffect, useState } from "react";
import { User } from "./types/interfaces";

var theme = createTheme();
theme = responsiveFontSizes(theme);
function App() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [])
  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <Routes>
            {/* Route for the login page */}
            <Route path="login" element={<Login />} />
            {/* Route for the register page */}
            <Route path="register" element={<Register />} />

            {/* Route for the home page */}
            <Route
              path="/"
              element={<Home />}
            />
            {/* Allother routes link to the home page */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
