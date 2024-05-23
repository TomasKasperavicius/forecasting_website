import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  Color,
  ForecastData,
  LineChartProps,
  ParsedData,
  Row,
} from "../types/interfaces";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

import SendIcon from "@mui/icons-material/Send";
import { ForecastDownloadButton } from "./ForecastDownloadButton";

const methods = ["LSTM", "SARIMA", "SVR", "SARIMA_SVR"];

const colors: Color = {
  sarima: "blue",
  svr: "orange",
  lstm: "green",
  sarima_svr: "red",
};
export const LineChart: React.FC<LineChartProps> = ({
  data,
  dateColumn,
  targetColumn,
  numberOfStepsError,
  setVisibleValidationForecasts,
  setVisibleForecasts,
  handleExtrapolationForecast,
  visibleValidationForecasts,
  forecasts,
  validationForecasts,
  visibleForecasts,
  validationForecastChart,
  handleStepChange,
  numberOfSteps,
  checkboxes,
  loadingForecasts,
  setCheckboxes,
}) => {
  const isWideScreen = useMediaQuery("(min-width: 1400px)");

  const chartRef = useRef<HTMLDivElement | null>(null);
  const [extrapolatedForecastsDates, setExtrapolatedForecastsDates] =
    useState<Date[]>();
  function parseData(data: Row[]): ParsedData[] {
    const parsedData: ParsedData[] = data.map((row: Row): ParsedData => {
      const date = new Date(row[dateColumn]);
      const value = Number(row[targetColumn]);
      return {
        date: date,
        value: value,
      };
    });
    return parsedData;
  }
  useEffect(() => {
    const handleResize = () => {
      if (
        data.rows &&
        data.rows.length > 0 &&
        targetColumn !== "" &&
        dateColumn !== ""
      ) {
        if (validationForecastChart && visibleValidationForecasts) {
          drawLineChart(visibleValidationForecasts);
        } else if (visibleForecasts) {
          drawLineChart(visibleForecasts);
        }
      }
    };

    // Add event listener
    window.addEventListener("resize", handleResize);
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    try {
      if (
        data.rows &&
        data.rows.length > 0 &&
        targetColumn !== "" &&
        dateColumn !== ""
      ) {
        if (validationForecastChart && visibleValidationForecasts) {
          drawLineChart(visibleValidationForecasts);
        } else if (visibleForecasts) {
          drawLineChart(visibleForecasts);
        }
      } else if (document.getElementById(`chart-${validationForecastChart}`)) {
        document.getElementById(`chart-${validationForecastChart}`)?.remove();
      }
    } catch (error) {
      console.log("An error occurred in rendering LineChart component:", error);
    }
  }, [
    data,
    validationForecastChart ? visibleValidationForecasts : visibleForecasts,
  ]);
  useEffect(() => {
    if (loadingForecasts) {
      if (chartRef.current) chartRef.current.innerHTML = "";
      document.getElementById(`chart-${validationForecastChart}`)?.remove();
    }
  }, [loadingForecasts]);

  const handleCheckboxChange = (name: string, checked: boolean) => {
    name = name.toLowerCase();
    if (setCheckboxes && checkboxes)
      setCheckboxes({
        ...checkboxes,
        [name]: checked,
      });
    if (
      setVisibleValidationForecasts &&
      validationForecasts &&
      visibleValidationForecasts
    ) {
      setVisibleValidationForecasts({
        ...visibleValidationForecasts,
        [name]: checked ? validationForecasts[name] : [],
      });
    }
    if (setVisibleForecasts && forecasts && visibleForecasts)
      setVisibleForecasts({
        ...visibleForecasts,
        [name]: checked ? forecasts[name] : [],
      });
  };

  function drawLineChart(visibleForecasts: ForecastData) {
    // Clear previous chart
    if (chartRef.current) chartRef.current.innerHTML = "";

    // Parse the data
    var parsedData = parseData(data.rows).slice(-12);
    var extendedDates: Date[] = [];
    var alreadyExtended = false;
    if (!validationForecastChart) {
      var lastDate = new Date(parsedData[parsedData.length - 1].date);
      Object.keys(visibleForecasts).forEach((key: string) => {
        if (visibleForecasts[key].length && !alreadyExtended) {
          visibleForecasts[key].forEach((_: number, index: number) => {
            const newDate = new Date(lastDate);
            extendedDates.push(
              new Date(newDate.setMonth(newDate.getMonth() + index + 1))
            );
          });
          alreadyExtended = true;
        }
      });
    }
    setExtrapolatedForecastsDates(extendedDates);
    const allDates: Date[] = parsedData
      .map((d) => new Date(d.date))
      .concat(extendedDates);
    const allValues: number[] = validationForecastChart
      ? []
      : (parsedData.map((d) => d.value) as number[]);
    Object.keys(visibleForecasts).forEach((key) => {
      allValues.push(...(visibleForecasts as any)[key]);
    });

    // Calculate the maximum value from the combined array
    const maxValue = d3.max(allValues) || 0;
    const minValue = d3.min(allValues) || 0;

    // Set up margins and dimensions
    const margin = { top: 30, right: 40, bottom: 30, left: 60 };
    // Default height and width
    var width = 1000;
    var height = 600;
    if (chartRef.current?.offsetWidth) {
      width = chartRef.current.offsetWidth - margin.left - margin.right;
    }
    if (chartRef.current?.offsetHeight)
      height = chartRef.current.offsetHeight - margin.top - margin.bottom;
    // Configure scales
    const { xScale, yScale } = configureScales(
      allDates,
      parsedData,
      height,
      width,
      margin,
      minValue,
      maxValue
    );
    // Create svg element
    const svg = createSVGElement(height, width, margin);
    // Create line generator for data
    const line = createLine(xScale, yScale);
    // Draw the data line
    drawDataLine(svg, line, validationForecastChart ? [] : parsedData,'purple');
    // Draw x,y grids
    drawGrids(svg, xScale, yScale, allDates, height, width);
    // Create and append tooltip for data points
    const tooltipData = createToolTip("tooltip-data");
    // Add circles for data points
    addCircles(
      svg,
      "circle-data",
      xScale,
      yScale,
      validationForecastChart ? [] : parsedData,
      tooltipData,
      "purple"
    );
    // Calculate the available space for the legend
    const legendWidth = 200;
    // Calculate how many forecast arrays are not empty
    const nonEmptyForecastArrayKeys = Object.entries(visibleForecasts)
      .filter(([key, value]) => Array.isArray(value) && value.length > 0)
      .map(([key]) => key);
    // Calculate height based on non empty forecast arrays
    const legendHeight =
      (nonEmptyForecastArrayKeys.length + (!validationForecastChart ? 1 : 0)) *
      25; 
    // Create legend
    const legendOverlay = createLegend(svg, legendWidth, legendHeight, margin);
    // Add original value legend item if its not validation forecast chart
    if (!validationForecastChart) {
      addLegendItem(legendOverlay, "Original values", "purple");
    }
    var emptyArrayCount = 0;
    Object.entries(visibleForecasts).forEach(
      ([key, forecastArray]: [string, number[]], index: number) => {
        if (forecastArray.length === 0) {
          emptyArrayCount++;
          return;
        }
        if (!validationForecastChart) {
          // Get the last point of the data line
          const lastPointData = parsedData[parsedData.length - 1];
          // Get the first point of the first dashed forecast line
          const firstPointForecast = {
            date: new Date(extendedDates[0]),
            value: forecastArray[0],
          };
          // Define the line generator for the connecting line
          
          const lineConnecting = createLine(xScale,yScale)

          // Create the path data for the connecting line
          const connectingLineData = [lastPointData, firstPointForecast];
          drawDataLine(svg,lineConnecting,connectingLineData,colors[key])
          // // Draw the connecting line
          // svg
          //   .append("path")
          //   .datum(connectingLineData)
          //   .attr("fill", "none")
          //   .attr("stroke", colors[key]) // Set the color of the connecting line
          //   .attr("stroke-width", 2) // Set the width of the connecting line
          //   .attr("d", lineConnecting as any);
        }
        const lineForecast = d3
          .line()
          .x((d: any, i: number) =>
            xScale(
              validationForecastChart ? parsedData[i].date : extendedDates[i]
            )
          )
          .y((d: any, i: number) => yScale(d));
        // Add dashed lines for forecast
        svg
          .append("path")
          .datum(forecastArray)
          .attr("fill", "none")
          .attr("stroke", colors[key])
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "8,8")
          .attr("d", lineForecast as any)
          .attr("stroke-dasharray", function (this: any) {
            const length: number = this.getTotalLength();
            return length + " " + length;
          })
          .attr("stroke-dashoffset", function (this: any) {
            return this.getTotalLength();
          });

        // Create and append tooltip for forecast points
        const tooltipForecast = createToolTip(`tooltip-forecast-${index}`);
        // Add circles for forecast data points
        var test = forecastArray.map((obj1, index) => ({
          value: obj1,
          date: validationForecastChart
            ? parsedData.map((obj) => obj["date"])[index]
            : extendedDates[index],
        }));
        addCircles(
          svg,
          `circle-forecast-${index}`,
          xScale,
          yScale,
          test,
          tooltipForecast,
          colors[key]
        );
        const y1 =
          (index + (!validationForecastChart ? 1 : 0) - emptyArrayCount) * 25;
        const y2 =
          (index + (!validationForecastChart ? 1 : 0) - emptyArrayCount) * 25;
        const y =
          (index + (!validationForecastChart ? 1 : 0) - emptyArrayCount) * 25;
        addLegendItem(
          legendOverlay,
          key.toUpperCase().replace("_", "+"),
          colors[key],
          y1,
          y2,
          y
        );
      }
    );

    animateLines(svg);
    // Add x-axis
    addXaxis(svg, xScale, height, parsedData, allDates);

    // Add y-axis
    addYaxis(svg, yScale);
  }
  const animateLines = (svg: any) => {
    // Calculate the total number of lines to animate
    const totalLines = svg.selectAll("path").size();

    // Initialize a counter to keep track of completed animations
    let completedLines = 0;

    // Transition each line
    svg
      .selectAll("path")
      .transition()
      .duration(2000) // Duration of the animation
      .ease(d3.easeLinear) // Easing function
      .attr("stroke-dashoffset", 0); // Offset animation from the beginning to end
  };
  const addYaxis = (svg: any, yScale: any) => {
    svg
      .append("g")
      .call(d3.axisLeft(yScale))
      .style("font-size", isWideScreen ? "16px" : "20px");
  };
  const addXaxis = (
    svg: any,
    xScale: any,
    height: number,
    parsedData: ParsedData[],
    allDates: Date[]
  ) => {
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(
            validationForecastChart ? parsedData.map((d) => d.date) : allDates
          )
          .tickFormat((date: any) => d3.timeFormat("%Y-%m")(date))
      )
      .style("font-size", isWideScreen ? "16px" : "20px")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  };
  const configureScales = (
    allDates: Date[],
    parsedData: ParsedData[],
    height: number,
    width: number,
    margin: { right: number; bottom: number; top: any },
    minValue: number,
    maxValue: number
  ) => {
    // Configure scales
    const xScale = d3
      .scaleTime()
      .domain(
        validationForecastChart
          ? (d3.extent(
              parsedData,
              (d: { date: string | number | Date }) => new Date(d.date)
            ) as [Date, Date])
          : (d3.extent(allDates) as [Date, Date])
      )
      .range([40, width - margin.right]);
    const yScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .nice()
      .range([height - margin.bottom, margin.top]);
    return { xScale, yScale };
  };
  const createSVGElement = (
    height: any,
    width: any,
    margin: { left: any; right: any; top: any; bottom: any }
  ) => {
    // Create SVG element
    const chart = d3.select(chartRef.current);
    const svg = chart
      .append("svg")
      .attr("id", `chart-${validationForecastChart}`)
      .attr("color", "black")
      // .attr(
      //   "viewBox",
      //   `0 0 ${width + margin.left + margin.right} ${
      //     height + margin.top + margin.bottom
      //   }`
      // )
      .style("width", width + margin.left + margin.right) // Apply the initial width
      .style("height", height + margin.top + margin.bottom + 50) // Apply the initial height
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    return svg;
  };
  const createLine = (
    xScale: (arg0: any) => number,
    yScale: (arg0: any) => number
  ) => {
    // Create line generator for data
    const line = d3
      .line()
      .x((d: any) => xScale(d.date))
      .y((d: any) => yScale(d.value));
    return line;
  };
  const drawDataLine = (svg: any, line: any, data: ParsedData[],color:string) => {
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", line as any)
      .attr("stroke-dasharray", function (this: any) {
        const length: number = this.getTotalLength();
        return length + " " + length;
      })
      .attr("stroke-dashoffset", function (this: any) {
        return this.getTotalLength();
      });
  };
  const drawGrids = (
    svg: any,
    xScale: (arg0: any) => any,
    yScale: { (arg0: any): any; (arg0: any): any; ticks: any },
    allDates: Date[],
    height: number,
    width: number
  ) => {
    svg
      .selectAll("yGrid")
      .data(yScale.ticks())
      .join("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d: any) => yScale(d))
      .attr("y2", (d: any) => yScale(d))
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "4");
    svg
      .selectAll("xGrid")
      .data(allDates)
      .join("line")
      .attr("x1", (d: any) => xScale(d))
      .attr("x2", (d: any) => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "4");
  };
  const createToolTip = (className: string) => {
    // Create and append tooltip for forecast points
    const tooltipForecast = d3
      .select(chartRef.current)
      .append("div")
      .attr("class", className)
      .style("position", "absolute")
      .style("color", "black")
      .style("background-color", "rgba(255, 255, 255, 0.9)")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "12px")
      .style("visibility", "hidden");
    return tooltipForecast;
  };
  // Add circles for data points
  const addCircles = (
    svg: any,
    className: string,
    xScale: any,
    yScale: any,
    data: ParsedData[],
    tooltipForecast: any,
    color: string
  ) => {
    svg
      .selectAll(`.${className}`)
      .data(data)
      .enter()
      .append("circle")
      .attr("class", className)
      .attr("cx", (d: any) => xScale(d.date))
      .attr("cy", (d: any) => yScale(d.value))
      .attr("r", 8)
      .attr("fill", color)
      .style("cursor", "pointer")
      .on(
        "mouseover",
        (
          event: { target: any; pageX: number; pageY: number },
          d: {
            [x: string]: any;
            toLocaleString: (
              arg0: string,
              arg1: { maximumFractionDigits: number }
            ) => any;
          }
        ) => {
          // Highlight the circle
          d3.select(event.target).attr("fill", color);

          // Show tooltip with value
          tooltipForecast
            .style("visibility", "visible")
            .html(
              `<strong>Value:</strong> ${d.value.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 30 + "px");
          // Focus the circle
          d3.select(event.target).attr("r", 11);
        }
      )
      .on("mousemove", (event: { pageX: number; pageY: number }) => {
        // Move tooltip with mouse
        tooltipForecast
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", (event: { target: any }) => {
        // Unhighlight the circle
        d3.select(event.target).attr("fill", color);

        // Hide tooltip
        tooltipForecast.style("visibility", "hidden");
        // Unfocus the circle
        d3.select(event.target).attr("r", 8);
      });
  };
  const createLegend = (
    svg: any,
    width: number,
    height: number,
    margin: any
  ) => {
    // Position the legend overlay
    const legendOverlay = svg
      .append("g")
      .attr("class", "legend-overlay")
      .attr("transform", "translate(10, 0)");

    // Add legend overlay background with rounded corners
    legendOverlay
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgba(255, 255, 255, 0.8)")
      .attr("stroke", "black")
      .attr("rx", 10) // Horizontal radius for rounded corners
      .attr("ry", 10); // Vertical radius for rounded corners

    // Position the legend
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    return legendOverlay;
  };
  const addLegendItem = (
    legendOverlay: any,
    text: string,
    color: string,
    y1: number = 0,
    y2: number = 0,
    y: number = 0
  ) => {
    // Add colored line in legend
    legendOverlay
      .append("line")
      .attr("x1", 20)
      .attr("y1", y1 + 15)
      .attr("x2", 40)
      .attr("y2", y2 + 15)
      .attr("stroke", color)
      .attr("stroke-width", 4);
    // Add legend item text
    legendOverlay
      .append("text")
      .attr("x", 45)
      .attr("y", y + 15)
      .text(text)
      .style("alignment-baseline", "middle");
  };

  const checkIfForecastsNotEmpty = () => {
    if (validationForecastChart) {
      return (
        data.rows &&
        data.rows.length > 0 &&
        validationForecasts &&
        validationForecasts.lstm.length > 0
      );
    }
    return (
      data.rows &&
      data.rows.length > 0 &&
      forecasts &&
      forecasts.lstm.length > 0
    );
  };
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {checkIfForecastsNotEmpty() ? (
        <>
          {validationForecastChart ? (
            <div
              style={{
                width: "100%",
                height: "30%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: 20,
              }}
            >
              <div
                style={{
                  marginLeft: 15,
                  width: "40%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1" fontWeight={"bold"}>
                  Differences between validation dataset forecasts and original
                  values
                </Typography>
              </div>
              <div
                style={{
                  width: "60%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {methods.map((methodName: string, id: number) => {
                  return (
                    <FormControlLabel
                      key={id}
                      control={
                        <Checkbox
                          name={methodName}
                          checked={
                            checkboxes && checkboxes[methodName.toLowerCase()]
                          }
                          onChange={(event) =>
                            handleCheckboxChange(
                              methodName,
                              event.target.checked
                            )
                          }
                        />
                      }
                      label={
                        <span style={{ fontWeight: "bold" }}>
                          {methodName.replace("_", "+")}
                        </span>
                      }
                      labelPlacement="start"
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                height: "30%",
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: 20,
              }}
            >
              <div
                style={{
                  width: "20%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body1"
                  fontWeight={"bold"}
                  textAlign={"center"}
                >
                  Out-of-sample forecasts
                </Typography>
              </div>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                width="40%"
              >
                <FormControl
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  error={numberOfStepsError}
                >
                  <div>
                    <Typography variant="body1" fontWeight={"bold"}>
                      Select number of forecasts: &nbsp;
                    </Typography>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      position:"relative"
                    }}
                  >
                    <TextField
                      onChange={handleStepChange}
                      value={numberOfSteps}
                      size="small"
                      id="outlined-basic"
                      label="Number of forecasts"
                      variant="outlined"
                      type="number"
                    ></TextField>
                    {numberOfStepsError && (
                      <FormHelperText
                        style={{
                          visibility: numberOfStepsError ? "visible" : "hidden",
                          position:"absolute",
                          bottom:-40,
                          left:0
                        }}
                      >
                        Numbers can't be negative or zero
                      </FormHelperText>
                    )}
                  </div>
                </FormControl>
              </Box>
              <div
                style={{
                  width: "40%",
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                <LoadingButton
                  loading={loadingForecasts}
                  loadingPosition="end"
                  endIcon={<SendIcon />}
                  variant="contained"
                  onClick={() =>
                    handleExtrapolationForecast &&
                    handleExtrapolationForecast(dateColumn, targetColumn)
                  }
                >
                  <span>
                    {false ? (
                      <Typography>Loading...</Typography>
                    ) : (
                      <Typography>FORECAST</Typography>
                    )}
                  </span>
                </LoadingButton>
                <ForecastDownloadButton
                  loadingForecasts={loadingForecasts}
                  dateColumn={dateColumn}
                  dates={extrapolatedForecastsDates}
                  forecasts={visibleForecasts}
                />
              </div>
            </div>
          )}
          {loadingForecasts ? (
            <div
              style={{
                width: "80%",
                height: "50vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </div>
          ) : (
            <div
              style={{
                width: "80%",
                height: "70%",
              }}
              ref={chartRef}
            ></div>
          )}
        </>
      ) : (
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
          <ShowChartIcon />
          <Typography>No forecast.</Typography>
        </div>
      )}
    </div>
  );
};
