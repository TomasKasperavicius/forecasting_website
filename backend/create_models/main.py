from dependencies import np,pd
from utilities import read_data, plot_results
from svr import perform_SVR
from arima import perform_ARIMA
from lstm import perform_LSTM
import os
import warnings
warnings.filterwarnings("ignore")


if __name__ == "__main__":
    # Create directory to store models for the API
    os.makedirs('../models', exist_ok=True)

    # Read the datasets
    df_snow = read_data('snow_cleaners.csv')
    df_cheese = read_data('cheese.csv')
    df_notebooks = read_data('notebooks.csv')

    # Method parameters
    best_LSTM_snow_cleaners = {'units': 12, 'dropout': 0.1,
                               'activation': 'tanh', 'epochs': 100, 'batch_size': 1}
    best_LSTM_notebooks = {'units': 12, 'dropout': 0.1,
                           'activation': 'tanh', 'epochs': 100, 'batch_size': 1}
    best_LSTM_cheese = {'units': 12, 'dropout': 0.1,
                        'activation': 'tanh', 'epochs': 100, 'batch_size': 1}

    best_SVR_snow_cleaners = {'C': 1.1, 'gamma': 'scale',
                              'kernel': 'poly', 'epsilon': 0.01, 'degree': 2}
    best_SVR_notebooks = {'C': 1.1, 'gamma': 'scale',
                          'kernel': 'poly', 'epsilon': 0.01, 'degree': 3}
    best_SVR_cheese = {'C': 0.9, 'gamma': 'scale',
                       'kernel': 'poly', 'epsilon': 0.01, 'degree': 5}

    best_SARIMA_SVR_snow_cleaners = {
        'C': 1.5, 'gamma': 'scale', 'kernel': 'poly', 'epsilon': 0.01, 'degree': 3}
    best_SARIMA_SVR_notebooks = {
        'C': 0.9, 'gamma': 'scale', 'kernel': 'poly', 'epsilon': 0.01, 'degree': 3}
    best_SARIMA_SVR_cheese = {'C': 0.9, 'gamma': 'scale',
                              'kernel': 'poly', 'epsilon': 0.01, 'degree': 5}
    best_SARIMA_snow_cleaners = [(1, 1, 1), (1, 0, 1, 12)]
    best_SARIMA_notebooks = [(3, 0, 1), (0, 0, 1, 12)]
    best_SARIMA_cheese = [(2, 0, 1), (1, 0, 0, 12)]

    datasets = [[df_snow, 'Kiekis, vnt', 'Sniego valytuvų eksportas iš Lietuvos į Latviją',

                 'snow_cleaners', best_SARIMA_snow_cleaners, best_SVR_snow_cleaners,
                 best_LSTM_snow_cleaners,
                 best_SARIMA_SVR_snow_cleaners],
                [df_notebooks, 'Kiekis, kg', 'Sąsiuvinių eksportas iš Lietuvos į Latviją',

                 'notebooks', best_SARIMA_notebooks, best_SVR_notebooks,
                 best_LSTM_notebooks,
                 best_SARIMA_SVR_notebooks],
                [df_cheese, 'Kiekis, kg', 'Sūrių eksportas iš Lietuvos į Latviją',

                 'cheese', best_SARIMA_cheese, best_SVR_cheese,
                 best_LSTM_cheese,
                 best_SARIMA_SVR_cheese]]

    # Loop through each dataset
    for i in datasets:
        # Get data and flatten it
        df = i[0]
        df = np.array(df).flatten()

        test_forecasts = []
        train_forecasts = []
        # Perform sarima
        print("---SARIMA---")
        arima_forecast_train, arima_forecast_test, error_values_sarima = perform_ARIMA(
            df, i[3], i[4])
        # Save sarima forecasts
        test_forecasts.append([
            arima_forecast_test])
        train_forecasts.append([arima_forecast_train])
        # Perform svr
        print("---SVR-----")
        train_forecast, test_forecast, error_values_svr = perform_SVR(
            df, i[3], best_params=i[5])
        # Save svr forecasts
        test_forecasts.append([test_forecast])
        train_forecasts.append([train_forecast])
        # Perform lstm
        print("---LSTM----")
        train_forecast, test_forecast, error_values_lstm = perform_LSTM(
            df, i[3],
            use_model=True, parameters=i[6])
        # Save lstm forecasts
        test_forecasts.append([test_forecast])
        train_forecasts.append([train_forecast])
        # Perform sarima+svr
        print("---SARIMA+SVR-----")
        arima_forecasts = np.concatenate(
            (arima_forecast_train, arima_forecast_test))
        train_forecast, test_forecast, error_values_sarima_svr = perform_SVR(
            df, i[3], arima_forecasts=arima_forecasts, best_params=i[7])
        # Save sarima+svr forecasts
        test_forecasts.append([test_forecast])
        train_forecasts.append([train_forecast])
        # Plot test forecasts
        date_labels = pd.date_range(
            start='2022-01-01', end='2022-12-01', freq='MS')
        plot_results(df,train_forecast,['SARIMA','SVR','LSTM','SARIMA+SVR'],i[2],i[1],date_labels)
