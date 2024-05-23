import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Logout } from "@mui/icons-material";
import {
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Paper,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import UserContext from "../context/userContext";
import { SidebarProps, UserContextType } from "../types/interfaces";
import MenuIcon from "@mui/icons-material/Menu";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
export const NavigationBar: React.FC<SidebarProps> = ({
  fileUploadError,
  currentActiveFile,
  handleFileChange,
  handleFileDelete,
  handleFileNavigation,
  uploadedUserFiles,
  setFileUploadError
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { user, setUser } = React.useContext<UserContextType | null>(
    UserContext
  ) as UserContextType;
  const isWideScreen = useMediaQuery("(min-width: 1400px)");
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };
  // State for sidebar menu
  const [openDrawer, setOpenDrawer] = useState(false);
  return (
    <Paper
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "sticky",
        height: "20%",
        top: 0,
        padding: 10,
        marginBottom: 10,
        zIndex: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "left",
          width: "50%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "left",
            alignItems: "center",
          }}
        >
          {!isWideScreen && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingRight: 10,
                }}
              >
                <IconButton
                  onClick={() => setOpenDrawer((prevOpen) => !prevOpen)}
                >
                  <MenuIcon
                    style={{ color: "black", transform: "scale(1.4)" }}
                  />
                </IconButton>
              </div>
              <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)}>
                <Sidebar
                  setFileUploadError={setFileUploadError}
                  fileUploadError={fileUploadError}
                  currentActiveFile={currentActiveFile}
                  uploadedUserFiles={uploadedUserFiles}
                  handleFileChange={handleFileChange}
                  handleFileDelete={handleFileDelete}
                  handleFileNavigation={handleFileNavigation}
                />
              </Drawer>
            </>
          )}
          {currentActiveFile && (
            <>
              <Typography variant="body1" fontWeight={"bold"}>
                Current data file:
              </Typography>
              <Typography variant="body1" fontStyle={"italic"}>
                &nbsp;{currentActiveFile?.name}
              </Typography>
            </>
          )}
        </div>
      </div>
      <div style={{ width: "50%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            textAlign: "center",
            paddingRight: 5,
          }}
        >
          <Typography variant="body1" fontWeight={"bold"}>
            Welcome, {user?.username}
          </Typography>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}></Avatar>
            </IconButton>
          </Tooltip>
        </Box>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </div>
    </Paper>
  );
};
