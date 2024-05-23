import React, {
  useEffect,
  useState,
} from "react";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { Button, Typography} from "@mui/material";
import { ForecastData, ForecastDownloadButtonProps } from "../types/interfaces";
import * as d3 from "d3";

export const ForecastDownloadButton: React.FC<ForecastDownloadButtonProps> = ({
  forecasts,
  dates,
  dateColumn,
  loadingForecasts
}) => {
  // State for the data
  const [data, setData] = useState<string | undefined>("");
  
  useEffect(() => {
    if (forecasts && dates) {
      try {
        const forecastsConverted = convertToCSV(forecasts);
        setData(forecastsConverted);
      } catch (error) {
        console.log("Error, converting forecasts: ", error);
      }
    }
  }, [dates, forecasts]);

  // Convert data to CSV for downloading
  const convertToCSV = (objArray: ForecastData | undefined) => {
    if (!objArray) return "";

    // Get all keys from the first object
    const keys = Object.keys(objArray);

    const rows: string[][] = [];

    // Push header row
    rows.push(keys);

    // Find the length of the longest array (number of columns)
    const maxColumns = Math.max(...keys.map((key) => objArray[key].length));

    // Iterate over each object in the array
    for (let i = 0; i < maxColumns; i++) {
      const row: string[] = [];
      keys.forEach((key) => {
        // Push the value to the row if it exists
        row.push(
          objArray[key][i] !== undefined ? objArray[key][i].toFixed(2) : ""
        );
      });
      rows.push(row);
    }
    var i = -1;
    // Join rows into CSV format
    const csvContent = rows
      .map((row, index) => {
        // Adding date column to forecast data in CSV
        if (index === 0) return [dateColumn, ...row].join(",");
        i++;
        // Appending date column value to other row values
        return [dates ? d3.timeFormat("%Y-%m-%d")(dates[i]) : "", ...row].join(
          ","
        );
      })
      .join("\n");
    return csvContent;
  };

  return (
    <div>
      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(
          data as string
        )}`}
        download="forecasts.csv"
        target="_blank"
        rel="noreferrer"
      >
        <Button
          disabled={loadingForecasts}
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudDownloadIcon />}
        >
           <Typography variant="body1">DOWNLOAD</Typography>
        </Button>
      </a>
    </div>
  );
};
