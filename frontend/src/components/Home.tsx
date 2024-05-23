import { ChangeEvent, useContext, useEffect, useState } from "react";
import "../App.css";
import { useFetch } from "../customHooks/useFetch";
import { Grid, Paper, useMediaQuery, Drawer, IconButton } from "@mui/material";
import { DataTable } from "./DataTable";
import { LineChart } from "./LineChart";
import {
  Column,
  Data,
  ForecastData,
  MethodCheckboxes,
  User,
  UserContextType,
  UserFile,
} from "../types/interfaces";
import { NavigationBar } from "./NavigationBar";
import UserContext from "../context/userContext";
import { Sidebar } from "./Sidebar";
import { useNavigate } from "react-router-dom";


function App() {
  // State for uploaded files
  const [uploadedUserFiles, setUploadedFileNames] = useState<UserFile[]>([]);
  // Media query for checking viewport width
  const isWideScreen = useMediaQuery("(min-width: 1400px)");
  // State for file upload error
  const [fileUploadError, setFileUploadError] = useState(false);
  // State for current active file in the UI
  const [currentActiveFile, setCurrentActiveFile] = useState<UserFile | null>(
    null
  );
  // State for current active file in the UI data
  const [currentFileData, setCurrentFileData] = useState<Data>({
    columns: [],
    rows: [],
  });
  // State for visible validation forecasts
  const [visibleValidationForecasts, setVisibleValidationForecasts] =
    useState<ForecastData>({
      lstm: [],
      sarima: [],
      sarima_svr: [],
      svr: [],
    });
  // State for validation forecasts
  const [validationForecasts, setValidationForecasts] = useState<ForecastData>({
    lstm: [],
    sarima: [],
    sarima_svr: [],
    svr: [],
  });
  // State for visible extrapolation forecasts
  const [visibleForecasts, setVisibleForecasts] = useState<ForecastData>({
    lstm: [],
    sarima: [],
    sarima_svr: [],
    svr: [],
  });
  // State for extrapolation forecasts
  const [forecasts, setForecasts] = useState<ForecastData>({
    lstm: [],
    sarima: [],
    sarima_svr: [],
    svr: [],
  });
  // States for column selection and errors
  const [dateColumn, setDateColumn] = useState<string>("");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [dateColumnError, setDateColumnError] = useState<boolean>(false);
  const [targetColumnError, setTargetColumnError] = useState<boolean>(false);
  // States for loading management
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingValidationForecasts, setLoadingValidationForecasts] =
    useState<boolean>(false);
  const [loadingForecasts, setLoadingForecasts] = useState<boolean>(false);
  // State for number of steps to forecast
  const [numberOfStepsError, setNumberOfStepsError] = useState<boolean>(false);
  const [numberOfSteps, setNumberOfSteps] = useState<string>("2");

  // State for method selection checkboxes
  const [checkboxes, setCheckboxes] = useState<MethodCheckboxes>({
    sarima: true,
    lstm: true,
    svr: true,
    sarima_svr: true,
  });
  // State for user data
  const { user} = useContext<UserContextType | null>(
    UserContext
  ) as UserContextType;
  // Http request function
  const { fetchData } = useFetch();
  const navigate = useNavigate();
  // Clear forecasts array
  const clearForecasts = () => {
    setVisibleValidationForecasts({
      lstm: [],
      sarima: [],
      sarima_svr: [],
      svr: [],
    });
    setValidationForecasts({
      lstm: [],
      sarima: [],
      sarima_svr: [],
      svr: [],
    });
    setVisibleForecasts({
      lstm: [],
      sarima: [],
      sarima_svr: [],
      svr: [],
    });
    setForecasts({
      lstm: [],
      sarima: [],
      sarima_svr: [],
      svr: [],
    });
  };

  // Get file names and data from remote server
  useEffect(() => {
    
    const getData = async () => {
      try {
        if(!user){
          navigate("/login")
          return
        }
        var { data, statusCode } = await fetchData(
          process.env.REACT_APP_REMOTE_SERVER_URL + "/file/",
          "POST",
          { user_id: user?._id }
        );
        var userFiles: UserFile[] = data as UserFile[];
        if (statusCode === 200) {
          setUploadedFileNames(userFiles);
          setCurrentActiveFile(userFiles[0] || null);
          await getOriginalData(userFiles[0] || null);
        }
      } catch (error) {
        console.log(
          "Error occurred in fetching initial data from remote server: ",
          error
        );
      }
    };
    getData();
  }, [user]);

  
  // Handle number of steps to forecast input
  const handleStepChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Validate input
    if (event.target.value !== "") {
      const step: number = parseInt(event.target.value, 10);
      if (step > 0) setNumberOfStepsError(false);
      if (step <= 0) setNumberOfStepsError(true);
    }
    setNumberOfSteps(event.target.value || "");
  };
  // Handle extrapolation forecasting
  const handleExtrapolationForecast = async (
    dateColumn: string,
    targetColumn: string
  ) => {
    try {
      setLoadingForecasts(true);
      if (currentActiveFile) {
        if (dateColumn === "") {
          setDateColumnError(true);
        }
        if (targetColumn === "") {
          setTargetColumnError(true);
        }
        if (numberOfSteps === "") {
          setNumberOfStepsError(true);
        }
        if (
          !dateColumnError &&
          !targetColumnError &&
          dateColumn !== "" &&
          targetColumn !== "" &&
          numberOfSteps !== "" &&
          !numberOfStepsError
        ) {
          // Get forecasts from remote server
          await getForecasts(parseInt(numberOfSteps, 10));
          setLoadingForecasts(false);
          // Scroll into forecasts element
          const element = document.getElementById("Forecasts");
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setLoadingForecasts(false);
      }
    } catch (error) {
      console.log("Error in forecast button press: ", error);
    }
  };
  // Handle validation forecasts
  const handleForecast = async (dateColumn: string, targetColumn: string) => {
    try {
      if (currentActiveFile) {
        setLoadingValidationForecasts(true);
        setLoadingForecasts(true);
        
        if (dateColumn === "") {
          setDateColumnError(true);
        }
        if (targetColumn === "") {
          setTargetColumnError(true);
        }
        if (
          !dateColumnError &&
          !targetColumnError &&
          dateColumn !== "" &&
          targetColumn !== "" &&
          numberOfSteps !== "" &&
          !numberOfStepsError
        ) {
          // Get validation forecasts
          await getForecasts();
          setLoadingValidationForecasts(false);
          setLoadingForecasts(false);
          const element = document.getElementById("validationForecasts");
          // Scroll into forecasts element
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Get initial extrapolated forecasts
          await getForecasts(parseInt(numberOfSteps, 10));
        }
        setLoadingValidationForecasts(false);
        setLoadingForecasts(false);
      }
    } catch (error) {
      console.log("Error in forecast button press: ", error);
    }
  };
  // Get all forecasts
  const getForecasts = async (steps: number | null = null) => {
    try {
      var svr = await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/forecast`,
        "POST",
        {
          user_id: user?._id,
          file_id: currentActiveFile?._id,
          method_name: "svr",
          steps: steps,
        }
      );
      var lstm = await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/forecast`,
        "POST",
        {
          user_id: user?._id,
          file_id: currentActiveFile?._id,
          method_name: "lstm",
          steps: steps,
        }
      );
      var sarima = await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/forecast`,
        "POST",
        {
          user_id: user?._id,
          file_id: currentActiveFile?._id,
          method_name: "sarima",
          steps: steps,
        }
      );
      var sarima_svr = await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/forecast`,
        "POST",
        {
          user_id: user?._id,
          file_id: currentActiveFile?._id,
          method_name: "sarima_svr",
          steps: steps,
        }
      );
      if (
        lstm.statusCode === 200 &&
        svr.statusCode === 200 &&
        sarima.statusCode === 200 &&
        sarima_svr.statusCode === 200
      ) {
        if (steps === null) {
          setValidationForecasts({
            ...validationForecasts,
            lstm: lstm.data as number[],
            svr: svr.data as number[],
            sarima: sarima.data as number[],
            sarima_svr: sarima_svr.data as number[],
          });
          setVisibleValidationForecasts({
            ...visibleValidationForecasts,
            lstm: lstm.data as number[],
            svr: svr.data as number[],
            sarima: sarima.data as number[],
            sarima_svr: sarima_svr.data as number[],
          });
        } else {
          setForecasts({
            ...forecasts,
            lstm: lstm.data as number[],
            svr: svr.data as number[],
            sarima: sarima.data as number[],
            sarima_svr: sarima_svr.data as number[],
          });
          setVisibleForecasts({
            ...visibleForecasts,
            lstm: checkboxes.lstm ? (lstm.data as number[]) : [],
            svr: checkboxes.svr ? (svr.data as number[]) : [],
            sarima: checkboxes.sarima ? (sarima.data as number[]) : [],
            sarima_svr: checkboxes.sarima_svr
              ? (sarima_svr.data as number[])
              : [],
          });
        }
      } else throw "";
    } catch (error) {
      console.error("Error occured while fetching forecasts: ", error);
    }
  };
  // Get file data
  const getOriginalData = async (userFile: UserFile) => {
    if (!userFile) return;
    try {
      setLoadingData(true);
      var { data } = await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/file/data`,
        "POST",
        { user_id: user?._id, file_id: userFile._id }
      );
      const originalData = data as Data;

      if (originalData && originalData.columns) {
        // Get header column names for displaying in the data table
        const columns: Column[] = originalData.columns.map((col: any) => {
          return { id: col, label: col };
        });
        setCurrentFileData({
          ...currentFileData,
          columns: columns,
          rows: originalData.rows,
        });
      }
      setLoadingData(false);
    } catch (error) {
      console.error("Error occured while fetching original data: ", error);
    }
  };
  // Handle file upload change
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      clearForecasts();
      const uploadedFile = e.target.files;
      const fileName = uploadedFile ? uploadedFile[0].name : "";
      // If file has csv extention and file isn't already uploaded based on name
      if (
        uploadedFile &&
        fileName.endsWith(".csv") &&
        uploadedUserFiles.filter((file) => file.name === fileName).length === 0
      ) {
        setLoadingData(true);
        // Get data from remote server
        const { data, statusCode } = await fetchData(
          process.env.REACT_APP_REMOTE_SERVER_URL + "/file/upload",
          "POST",
          { user_id: user?._id },
          uploadedFile[0]
        );
        if (statusCode === 200) {
          setTargetColumn("");
          setDateColumn("");
          const uploadedUserFile = data as UserFile;
          await getOriginalData(uploadedUserFile);
          setUploadedFileNames([...uploadedUserFiles, uploadedUserFile]);
          setCurrentActiveFile(uploadedUserFile);
        } else {
          setFileUploadError(true);
        }
        setLoadingData(false);
      } else {
        setFileUploadError(true);
        setLoadingData(false);
      }
      e.target.value = "";
    } catch (error) {
      setFileUploadError(true);
      setLoadingData(false);
      console.log("Error occured in file upload: ", error);
    }
  };
  // Handle file deletion
  const handleFileDelete = async (id: string) => {
    try {
      // Clear previous file states
      setTargetColumn("");
      setDateColumn("");
      setDateColumnError(false);
      setTargetColumnError(false);
      clearForecasts();
      // Remove file to be deleted from the displayed uploaded file list based on id
      const newUploadedFileNames = uploadedUserFiles.filter(
        (file) => file._id !== id
      );
      // Update the file list
      setUploadedFileNames(newUploadedFileNames);
      // Set current file to the first uploaded file, or null if array is empty
      setCurrentActiveFile(newUploadedFileNames[0] || null);
      // Request file deletion on the remote server
      await fetchData(
        process.env.REACT_APP_REMOTE_SERVER_URL + `/file`,
        "DELETE",
        { user_id: user?._id, file_id: id || "" }
      );
      // Update current active file as the first file in the uploaded files list
      if (newUploadedFileNames.length) {
        await getOriginalData(newUploadedFileNames[0] || null);
      } else {
        setVisibleValidationForecasts({
          ...visibleValidationForecasts,
          lstm: [],
          svr: [],
          sarima: [],
          sarima_svr: [],
        });
        setValidationForecasts({
          ...validationForecasts,
          lstm: [],
          svr: [],
          sarima: [],
          sarima_svr: [],
        });
        setCurrentFileData({ ...currentFileData, columns: [], rows: [] });
      }
    } catch (error) {
      console.log("Error occured in file deletion: ", error);
    }
  };
  // Handle file navigation
  const handleFileNavigation = async (id: string) => {
    // Get the selected file
    const file = uploadedUserFiles.filter((file) => file._id === id)[0];
    if (currentActiveFile?._id === file._id) return;
    try {
      // Clear previous file states
      setTargetColumn("");
      setDateColumn("");
      setDateColumnError(false);
      setTargetColumnError(false);
      clearForecasts();
      // Set current active file as the selected one
      setCurrentActiveFile(file);
      // Get the data of the selected file
      await getOriginalData(file);
    } catch (error) {
      console.log("Error occured in file navigation: ", error);
    }
  };
  
  return (
    <>
      <NavigationBar
        setFileUploadError={setFileUploadError}
        fileUploadError={fileUploadError}
        currentActiveFile={currentActiveFile}
        handleFileChange={handleFileChange}
        handleFileDelete={handleFileDelete}
        handleFileNavigation={handleFileNavigation}
        uploadedUserFiles={uploadedUserFiles}
      />
      <Grid container spacing={2} style={{ position: "relative" }}>
        {/* Sidebar menu */}
        {isWideScreen && (
          <Grid
            item
            xs={2}
            style={{ position: "sticky", top: 0, height: "100vh" }}
          >
            <Paper elevation={11} style={{ height: "100%" }}>
              <Sidebar
                setFileUploadError={setFileUploadError}
                fileUploadError={fileUploadError}
                currentActiveFile={currentActiveFile}
                uploadedUserFiles={uploadedUserFiles}
                handleFileChange={handleFileChange}
                handleFileDelete={handleFileDelete}
                handleFileNavigation={handleFileNavigation}
              />
            </Paper>
          </Grid>
        )}

        <Grid item xs={isWideScreen ? 10 : 12}>
          {/* Data table */}
          <Grid container marginBottom={2}>
            <Grid item xs={12}>
              <Paper elevation={11} sx={{ height: "50vh", padding: 5 }}>
                <DataTable
                  dateColumnError={dateColumnError}
                  targetColumnError={targetColumnError}
                  loadingData={loadingData}
                  loadingForecasts={loadingValidationForecasts}
                  dateColumn={dateColumn}
                  setDateColumn={setDateColumn}
                  setTargetColumn={setTargetColumn}
                  targetColumn={targetColumn}
                  handleForecast={handleForecast}
                  setTargetColumnError={setTargetColumnError}
                  setDateColumnError={setDateColumnError}
                  data={currentFileData}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Validation forecasts line chart */}
          <Grid container marginTop={2}>
            <Grid item xs={12}>
              <Paper elevation={11} id="validationForecasts">
                <LineChart
                  dateColumn={dateColumn}
                  targetColumn={targetColumn}
                  forecasts={forecasts}
                  visibleForecasts={visibleForecasts}
                  setVisibleForecasts={setVisibleForecasts}
                  setVisibleValidationForecasts={setVisibleValidationForecasts}
                  visibleValidationForecasts={visibleValidationForecasts}
                  validationForecasts={validationForecasts}
                  loadingForecasts={loadingValidationForecasts}
                  data={currentFileData}
                  validationForecastChart={true}
                  checkboxes={checkboxes}
                  setCheckboxes={setCheckboxes}
                />
              </Paper>
            </Grid>
          </Grid>
          {/* Forecasts line chart */}
          <Grid container marginTop={2}>
            <Grid item xs={12}>
              <Paper elevation={11} id="forecasts">
                <LineChart
                  dateColumn={dateColumn}
                  targetColumn={targetColumn}
                  setVisibleForecasts={setVisibleForecasts}
                  forecasts={forecasts}
                  visibleForecasts={visibleForecasts}
                  data={currentFileData}
                  validationForecastChart={false}
                  visibleValidationForecasts={undefined}
                  validationForecasts={undefined}
                  handleStepChange={handleStepChange}
                  numberOfSteps={parseInt(numberOfSteps, 10)}
                  handleExtrapolationForecast={handleExtrapolationForecast}
                  numberOfStepsError={numberOfStepsError}
                  loadingForecasts={loadingForecasts}
                />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

export default App;
