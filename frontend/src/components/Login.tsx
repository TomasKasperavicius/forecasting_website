import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { useFetch } from "../customHooks/useFetch";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/userContext";
import { User, UserContextType } from "../types/interfaces";
import { FormHelperText } from "@mui/material";
import { useEffect, useState } from "react";
function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="#">
        Forecasting Website
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

export default function SignIn() {
  const [loginError, setLoginError] = useState<boolean>(false);
  const { fetchData } = useFetch();
  const navigate = useNavigate();
  const { setUser,user } = React.useContext<UserContextType | null>(
    UserContext
  ) as UserContextType;
  useEffect(() => {
    if(user) navigate("/")
  }, [])
  
  // Handle login
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = form.get("email");
      const password = form.get("password");
      if (email !== "" && password !== "") {
        // Make login request
        var { data, statusCode } = await fetchData(
          process.env.REACT_APP_REMOTE_SERVER_URL + `/login`,
          "POST",
          { email: email, password: password }
        );
        if (statusCode === 200) {
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data as User);
          navigate("/");
        } else setLoginError(true);
      }
    } catch (error) {
      setLoginError(true);
      console.log("Error logging in: ", error);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            onFocus={() => setLoginError(false)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onFocus={() => setLoginError(false)}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          {loginError && (
            <FormHelperText
              style={{
                color: "red",
                visibility: loginError ? "visible" : "hidden",
              }}
            >
              Wrong email or password
            </FormHelperText>
          )}
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Copyright sx={{ mt: 8, mb: 4 }} />
    </Container>
  );
}
