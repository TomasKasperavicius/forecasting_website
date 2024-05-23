import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import StorageIcon from "@mui/icons-material/Storage";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Typography,
  FormControl,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  FormHelperText,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useState, ChangeEvent } from "react";
import SendIcon from "@mui/icons-material/Send";
import { DataTableProps } from "../types/interfaces";

export const DataTable: React.FC<DataTableProps> = ({
  data,
  dateColumn,
  targetColumn,
  dateColumnError,
  loadingForecasts,
  targetColumnError,
  loadingData,
  setDateColumn,
  setTargetColumn,
  setDateColumnError,
  setTargetColumnError,
  handleForecast,
}) => {
  // Data table page navigation initial settings
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const isWideScreen = useMediaQuery("(min-width: 1400px)");
  // Validate selected date column
  const validateDate = (dateColumn: string) => {
    var error = false;
    for (let i = 0; i < data.rows.length; i++) {
      const date = new Date(data.rows[i][dateColumn]);
      if (isNaN(date.getTime())) {
        error = true;
        break;
      }
    }

    if (setDateColumnError) setDateColumnError(error);
  };
  // Validate selected target column
  const validateTarget = (targetColumn: string) => {
    var error = false;
    for (let i = 0; i < data.rows.length; i++) {
      const value = Number(data.rows[i][targetColumn]);
      if (isNaN(value)) {
        error = true;
        break;
      }
    }
    if (setTargetColumnError) setTargetColumnError(error);
  };
  // Handle data table page navigation
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  // Handle rows per page change in data table page navigation
  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  // Update selected date column
  const handleDateColumnChange = (event: SelectChangeEvent<string>) => {
    if (setDateColumn) setDateColumn(event.target.value as string);
    validateDate(event.target.value as string);
  };
  // Update selected target column
  const handleTargetColumnChange = (event: SelectChangeEvent<string>) => {
    if (setTargetColumn) setTargetColumn(event.target.value as string);
    validateTarget(event.target.value as string);
  };

  return (
    <>
      {data.rows.length < 1 ? (
        <div
          style={{
            width: "100%",
            height: "50vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {loadingData ? (
            <CircularProgress />
          ) : (
            <>
              <StorageIcon />
              <Typography variant="body1">No data.</Typography>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Column selection and forecast button */}
          <div
            style={{
              height: "20%",
              position: "relative",
              padding: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                display="flex"
                justifyContent="left"
                alignItems="center"
                width="40%"
              >
                <Typography variant="body1" fontWeight={"bold"}>
                  Select Date a Column:
                </Typography>
                <FormControl
                  style={{ width: "60%", paddingLeft: 10,position:"relative" }}
                  error={dateColumnError}
                >
                  <Select
                    value={dateColumn}
                    onChange={handleDateColumnChange}
                    displayEmpty
                    inputProps={{ "aria-label": "Date Column" }}
                    style={{ height: "40px", width: "50%" }}
                  >
                    {data.columns.map((column, id) => (
                      <MenuItem key={id} value={column.id}>
                        {column.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {dateColumnError && (
                    <Typography variant="body1" style={{position:"absolute",bottom:-25, left:0}} fontSize={isWideScreen ? "8px" : "6px"}>
                      <FormHelperText
                        style={{
                          visibility: dateColumnError ? "visible" : "hidden",
                        }}
                      >
                        Selected column is not of type date
                      </FormHelperText>
                    </Typography>
                  )}
                </FormControl>
              </Box>
              <Box
                display="flex"
                justifyContent="left"
                alignItems="center"
                width="40%"
              >
                <Typography
                  variant="body1"
                  fontWeight={"bold"}
                  fontSize={isWideScreen ? "14px" : "16px"}
                >
                  Select Target Column:
                </Typography>
                <FormControl
                  style={{ width: "60%", paddingLeft: 10 ,position:"relative"}}
                  error={targetColumnError}
                >
                  <Select
                    value={targetColumn}
                    onChange={handleTargetColumnChange}
                    displayEmpty
                    inputProps={{ "aria-label": "Target Column" }}
                    style={{ height: "40px", width: "50%" }}
                  >
                    {data.columns.map((column, id) => (
                      <MenuItem key={id} value={column.id}>
                        {column.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {targetColumnError && (
                    <Typography variant="body1" style={{position:"absolute",bottom:-25, left:0}} fontSize={isWideScreen ? "8px" : "6px"}>
                      <FormHelperText
                        style={{
                          visibility: targetColumnError ? "visible" : "hidden",
                        }}
                      >
                        Selected column is not of type Number
                      </FormHelperText>
                    </Typography>
                  )}
                </FormControl>
              </Box>

              <div
                style={{
                  width: "20%",
                  display: "flex",
                  justifyContent: "right",
                }}
              >
                <LoadingButton
                  loading={loadingForecasts}
                  loadingPosition="end"
                  endIcon={<SendIcon />}
                  variant="contained"
                  onClick={() => {
                    if (handleForecast) {
                      handleForecast(dateColumn, targetColumn);
                    }
                  }}
                >
                  <span>
                    {false ? (
                      <Typography variant="body1">Loading...</Typography>
                    ) : (
                      <Typography variant="body1">FORECAST</Typography>
                    )}
                  </span>
                </LoadingButton>
              </div>
            </div>
          </div>
          {/* Data table */}
          <TableContainer
            sx={{
              width: "100%",
              height: "75%",
              overflow: "auto",
            }}
          >
            {loadingData ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress />
              </div>
            ) : (
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {data.columns.map((column, id) => (
                      <TableCell
                        key={id}
                        align={column.align}
                        style={{
                          minWidth: column.minWidth,
                          maxWidth: column.minWidth,
                          fontWeight: "bold",
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, id) => {
                      return (
                        <TableRow hover role="checkbox" tabIndex={-1} key={id}>
                          {data.columns.map((column, id) => {
                            const value = row[column.id];
                            return (
                              <TableCell key={id} align={column.align}>
                                {column.format && typeof value === "number"
                                  ? column.format(value as number)
                                  : value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={data.rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            style={{ height: "20%" }}
          />
        </>
      )}
    </>
  );
};
