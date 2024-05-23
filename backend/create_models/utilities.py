from dependencies import np, mean_absolute_percentage_error, mean_absolute_error, mean_squared_error, pd, plt, os, r2_score
from constants import SLIDING_WINDOW_SIZE, LAG_COUNT, FORECASTING_PERIOD, INTERPOLATION_SIZE

# Function that interpolates num_interpolations times between two adjacent points
def interpolate_data(df, num_interpolations, endpoint=False):
    interpolated_values = []

    for i in range(len(df) - 1):
        interpolated = np.linspace(
            df[i], df[i + 1], num=num_interpolations, endpoint=endpoint)
        interpolated_values.extend(interpolated)

    return np.array(interpolated_values)

# Undo interpolation effect
def undo_interpolation(df):
    array = []
    for i in range(0, len(df), INTERPOLATION_SIZE):
        array.append(df[i])
    return array

def preprocess_data(data):
    X = []
    Y = []
    # Create lagged feature array X and target array Y
    for i in range(0, len(data)-LAG_COUNT, SLIDING_WINDOW_SIZE):
        X.append(data[i:i + LAG_COUNT])
        Y.append(data[i + LAG_COUNT:i + LAG_COUNT+FORECASTING_PERIOD])
    # Reshape the arrays into correct form
    X = np.array(X).reshape(-1, LAG_COUNT)
    Y = np.array(Y).reshape(-1, FORECASTING_PERIOD)
    return X, Y

# Calculate error metrics
def evaluate_performance(forecast, real):
    mae = mean_absolute_error(real, forecast)
    rmse = np.sqrt(mean_squared_error(real, forecast))
    mape = mean_absolute_percentage_error(real, forecast)
    r2 = r2_score(real, forecast)
    print(
        f"Mean absolute error: {mae}, Root mean squared error: {rmse}, Mean absolute percentage error: {mape}, R squared: {r2}")
    return mae, rmse, mape, r2

# Read csv data file
def read_data(file_name):
    if os.path.exists(file_name):
        df = pd.read_csv(file_name, sep=',')
        df['Laikotarpis'] = pd.to_datetime(df['Laikotarpis'])
        df.set_index('Laikotarpis', inplace=True)
        df.index.freq = 'MS'
        return df
    else:
        print(f"The file '{file_name}' does not exist.")

# Plotting original data and forecast results
def plot_results(original, forecasts, labels, title, ylabel, dates):
    plt.plot(dates, original,
             label='Originalios reikšmės', color="#800080", marker='o')
    plt.xticks(dates, [date.strftime('%Y-%m-%d')
                       for date in dates])
    plt.xticks(rotation=45, fontsize=14)
    plt.yticks(fontsize=14)
    plt.title(title, fontsize=16)
    plt.ylabel(ylabel, fontsize=16)
    plt.xlabel('Laikotarpis', fontsize=16)
    for i in range(len(forecasts)):
        plt.plot(dates, np.array(forecasts[i]).flatten(), label=labels[i],
                 linestyle='--', color=plt.cm.tab10(i), marker='o')
    plt.legend(fontsize=11)
    plt.tight_layout()
    plt.grid()
    plt.show()
