import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Card,
  Button,
  Typography,
  Input,
  List,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  FormHelperText,
} from "@mui/material";
import { SidebarProps, UserFile } from "../types/interfaces";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRef, useState } from "react";
export const Sidebar: React.FC<SidebarProps> = ({
  currentActiveFile,
  fileUploadError,
  handleFileChange,
  uploadedUserFiles,
  handleFileNavigation,
  handleFileDelete,
  setFileUploadError,
}) => {
  const [open, setOpen] = useState(true);
  const fileInput = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <div
        style={{
          height: "15%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* File input */}
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          onClick={() => setFileUploadError(false)}
        >
          <Typography variant="body1">Upload file</Typography>
          <Input
            type="file"
            style={{ display: "none" }}
            inputRef={fileInput}
            onChange={handleFileChange}
          />
        </Button>
        {fileUploadError && (
          <Typography
            variant="body1"
            style={{ position: "absolute", bottom: -5, left: 20 }}
          >
            <FormHelperText
              style={{
                color: "red",
                visibility: fileUploadError ? "visible" : "hidden",
              }}
            >
              File must be CSV format and not already uploaded
            </FormHelperText>
          </Typography>
        )}
      </div>

      {/* Uploaded files */}
      <Card
        style={{
          height: "85%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <List
          sx={{
            width: "100%",
            maxWidth: 360,
          }}
          component="nav"
          aria-labelledby="nested-list-subheader"
        >
          <Divider color="black"></Divider>

          <ListItemButton
            sx={{ cursor: "default" }}
            onClick={() => setOpen(!open)}
          >
            <ListItemIcon>
              <FolderIcon sx={{ color: "black" }} />
            </ListItemIcon>
            <ListItemText
              primary="Uploaded files"
              primaryTypographyProps={{ fontWeight: "bold" }}
            />
            {open ? (
              <ExpandLess
                className="add-file-icon"
                sx={{ cursor: "pointer" }}
              />
            ) : (
              <ExpandMore
                className="add-file-icon"
                sx={{ cursor: "pointer" }}
              />
            )}
          </ListItemButton>
          <Divider color="black"></Divider>

          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding style={{ cursor: "default" }}>
              {uploadedUserFiles.length > 0 &&
                uploadedUserFiles.map((file: UserFile, id: number) => {
                  return (
                    <div
                      key={id}
                      className="file-link"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "default",
                        alignItems: "center",
                        backgroundColor:
                          currentActiveFile?._id === file._id
                            ? "rgba(160,160,160,0.3)"
                            : "inherit",
                      }}
                    >
                      <ListItemButton
                        sx={{
                          pl: 5,
                          cursor: "default",
                        }}
                      >
                        <ListItemText
                          primary={file.name}
                          className="file-link"
                          onClick={() => handleFileNavigation(file._id)}
                          sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        />
                      </ListItemButton>
                      <ListItemIcon
                        className="file-link"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <DeleteIcon
                          sx={{ color: "black" }}
                          onClick={() => handleFileDelete(file._id)}
                          className="add-file-icon"
                        />
                      </ListItemIcon>
                      <Divider color="black"></Divider>
                    </div>
                  );
                })}
            </List>
          </Collapse>
        </List>
      </Card>
    </>
  );
};
