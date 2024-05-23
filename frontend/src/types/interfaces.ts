import { HttpMethod } from "./types";

export interface Row {
    [key: string]: string;
}
export interface Column {
    id: string;
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

export interface Data {
    columns: Column[],
    rows: Row[]
}
export interface ParsedData {
    date: Date,
    value: Number
}

// Forecast data interface
export interface ForecastData {
    [key: string]: number[],
    sarima: number[],
    svr: number[],
    lstm: number[],
    sarima_svr: number[]
}

// Forecasting method selection interface
export interface MethodCheckboxes {
    [key: string]: boolean,
    sarima: boolean,
    lstm: boolean,
    svr: boolean,
    sarima_svr: boolean,
}

// Color interface for each method
export interface Color {
    [key: string]: string,
    sarima: string,
    svr: string,
    lstm: string,
    sarima_svr: string
}

// Http request interfaces
export interface FetchResponse<T> {
    data: T | null;
    statusCode: number;
}
export interface FetchResult<T> {
    fetchData: (url: string, method: HttpMethod, payload?: any, file?: File | null) => Promise<FetchResponse<T>>;
}

// User interfaces
export interface User {
    _id: string
    username: string;
    password: string;
    email: string;
}
export interface UserFile {
    _id: string
    name: string;
}
export interface UserContextType {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
}

// Components prop interfaces
export interface SidebarProps {
    fileUploadError:boolean,
    currentActiveFile: UserFile | null,
    uploadedUserFiles: UserFile[],
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleFileNavigation: (id: string) => Promise<void>,
    handleFileDelete: (id: string) => Promise<void>,
    setFileUploadError: React.Dispatch<React.SetStateAction<boolean>>
}

export interface ForecastDownloadButtonProps {
    forecasts: ForecastData | undefined
    dates: Date[] | undefined
    dateColumn: string,
    loadingForecasts: boolean
}

export interface DataTableProps {
    data: Data,
    loadingData?: boolean
    dateColumnError?: boolean,
    targetColumnError?: boolean,
    loadingForecasts: boolean
    targetColumn: string,
    dateColumn: string,
    setTargetColumnError?: React.Dispatch<React.SetStateAction<boolean>>,
    setDateColumnError?: React.Dispatch<React.SetStateAction<boolean>>,
    setTargetColumn?: React.Dispatch<React.SetStateAction<string>>,
    setDateColumn?: React.Dispatch<React.SetStateAction<string>>,
    handleForecast?: (dateColumn: string, targetColumn: string) => void
}
export interface LineChartProps extends DataTableProps {

    checkboxes?: MethodCheckboxes
    setCheckboxes?: React.Dispatch<React.SetStateAction<MethodCheckboxes>>
    handleStepChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    handleExtrapolationForecast?: (dateColumn: string, targetColumn: string) => void
    numberOfSteps?: number
    numberOfStepsError?: boolean
    visibleValidationForecasts: ForecastData | undefined,
    forecasts: ForecastData | undefined,
    validationForecasts: ForecastData | undefined,
    visibleForecasts: ForecastData | undefined,
    setVisibleValidationForecasts?: React.Dispatch<React.SetStateAction<ForecastData>>,
    setVisibleForecasts?: React.Dispatch<React.SetStateAction<ForecastData>>,
    validationForecastChart?: boolean
}