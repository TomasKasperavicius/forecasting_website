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
import { useState } from "react";

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

export default function SignUp() {
  const { fetchData } = useFetch();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<boolean>(false);

  const {setUser } = React.useContext<UserContextType | null>(
    UserContext
  ) as UserContextType;
  // Handle registration
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const username = form.get("username");
      const email = form.get("email");
      const password = form.get("password");
      if (username !== "" && password !== "") {
        // Make registration request
        var { data, statusCode } = await fetchData(
          process.env.REACT_APP_REMOTE_SERVER_URL + `/register`,
          "POST",
          { user_name: username, email: email, password: password }
        );
        // Parse json to javascript object
        const responseObject = data as User//JSON.parse(data as string);
        if (statusCode === 200) {
          // Update the user data and navigate to home page
          setUser(responseObject);
          navigate("/");
        } else setRegisterError(true);
      }
    } catch (error) {
      setRegisterError(true);
      console.log("Error registering: ", error);
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
          Sign up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
              />
            </Grid>
           
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          {registerError && (
            <FormHelperText
              style={{
                color: "red",
                visibility: registerError ? "visible" : "hidden",
              }}
            >
              User with this email or username already exists
            </FormHelperText>
          )}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
