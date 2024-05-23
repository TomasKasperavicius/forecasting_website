from dependencies import os, np,joblib, SVR, MultiOutputRegressor, mean_absolute_error, MinMaxScaler, TimeSeriesSplit, ParameterGrid, Pool
from constants import SLIDING_WINDOW_SIZE, LAG_COUNT, TEST_SIZE_SAMPLES, CROSS_VALIDATION_SPLITS
from utilities import evaluate_performance, preprocess_data
import warnings


def find_best_SVR_parameters(parameter_combinations, X, Y, scaler):

    warnings.filterwarnings("ignore")
    best_mae = float("inf")
    best_params = None

    # Splitting time series into n_splits, with test data set size 1, meaning if there are 3 splits 2 will be used for training and 1 for testing
    tscv = TimeSeriesSplit(n_splits=CROSS_VALIDATION_SPLITS, test_size=1)

    # Looping through each parameter combination
    for params in parameter_combinations:
        # Creating SVR model
        svr = SVR(**params)
        svr = MultiOutputRegressor(svr, n_jobs=-1)

        fold_mae = []
        # Looping through each dataset split
        for train_index, test_index in tscv.split(X):
            train_X, test_X = X[train_index], X[test_index]
            train_Y, test_Y = Y[train_index], Y[test_index]
            # Fitting the model
            svr.fit(train_X, train_Y)
            # Making predictions
            test_forecast = svr.predict(test_X)
            test_forecast = scaler.inverse_transform(
                test_forecast.reshape(-1, 1)).reshape(-1, 1)
            # Evaluating mean absolute error metric
            mae = mean_absolute_error(scaler.inverse_transform(
                test_Y.reshape(-1, 1)).reshape(-1, 1), test_forecast)
            fold_mae.append(mae)
        # Averaging mean absolute error among all tested splits
        avg_mae = sum(fold_mae) / len(fold_mae)
        # Updating best parameters if error is smaller
        if avg_mae < best_mae:
            best_mae = avg_mae
            best_params = params
    return [best_params, best_mae]


def perform_SVR(data,dataset_name, arima_forecasts=None, best_params=None, exogenous_features=None):
    # Data scaler
    scaler = MinMaxScaler()
    # External feature scaler
    exogenous_scaler = MinMaxScaler()

    # SARIMA-SVR model
    if arima_forecasts is not None:
        # Scaling data into [0,1] interval
        scaler.fit(np.concatenate(
            (np.array(data).flatten(), arima_forecasts)).reshape(-1, 1))
        data = scaler.transform(data.reshape(-1, 1))
        arima_forecasts = scaler.transform(
            arima_forecasts.reshape(-1, 1)).flatten()
        arima_forecasts_new = []
        # Creating lag features from arima forecasts
        for j in range(0, len(arima_forecasts)-LAG_COUNT, SLIDING_WINDOW_SIZE):
            arima_forecasts_new.append(arima_forecasts[j:j + LAG_COUNT])
        arima_forecasts_new = np.array(arima_forecasts_new)
        X, Y = preprocess_data(data)
        X = arima_forecasts_new
        # Adding external features
        if exogenous_features is not None:
            for i in range(len(exogenous_features)):
                scaled_feature = exogenous_scaler.fit_transform(
                    exogenous_features[i].reshape(-1, 1))
                feature, _ = preprocess_data(scaled_feature)
                X = np.hstack((X, feature))

        train_X, train_Y = X[:-TEST_SIZE_SAMPLES], Y[:-TEST_SIZE_SAMPLES]
        test_X, test_Y = X[-TEST_SIZE_SAMPLES:], Y[-TEST_SIZE_SAMPLES:]
    # SVR model
    else:
        # Scaling data into [0,1] interval
        data = scaler.fit_transform(data.reshape(-1, 1))
        X, Y = preprocess_data(data)
        # Adding external features
        if exogenous_features is not None:
            for i in range(len(exogenous_features)):
                scaled_feature = exogenous_scaler.fit_transform(
                    exogenous_features[i].reshape(-1, 1))
                feature, _ = preprocess_data(scaled_feature)
                X = np.hstack((X, feature))
        train_X, train_Y = X[:-TEST_SIZE_SAMPLES], Y[:-TEST_SIZE_SAMPLES]
        test_X, test_Y = X[-TEST_SIZE_SAMPLES:], Y[-TEST_SIZE_SAMPLES:]

    svr = None
    # If no parameters were passed to the model, perform grid search walk forward validation
    if best_params is None:
        parameter_grid = {"C": np.arange(0.8, 1.2, 0.1),
                          "gamma": [*np.arange(0.05, 5, 0.5), 'auto', 'scale'],
                          "kernel": ['poly', 'rbf', 'linear', 'sigmoid'],
                          "epsilon": np.arange(0.05, 0.5, 0.05),
                          "degree": [2, 3, 4, 5, 6]}
        param_combinations = list(ParameterGrid(parameter_grid))
        # Divide parameter combinations to each of the available cores
        batch_size = len(param_combinations)//os.cpu_count()
        # Assign data to each core to process  
        with Pool() as pool:
            batches = [param_combinations[i:i+batch_size]
                       for i in range(0, len(param_combinations), batch_size)]
            results = pool.starmap(find_best_SVR_parameters, [(
                batch, train_X, train_Y, scaler) for batch in batches])
        # Get best parameters based on lowest mean absolute error
        best_params = min(results, key=lambda x: x[1])[0]
        # Creating SVR model
        svr = SVR(C=best_params['C'], gamma=best_params['gamma'], kernel=best_params['kernel'],
                  epsilon=best_params['epsilon'], degree=best_params['degree'])
        svr = MultiOutputRegressor(svr, n_jobs=-1)
        svr.fit(train_X, train_Y)
        print(f"Best parameters for SVR: {best_params}")
    else:
        # Creating SVR model
        svr = SVR(C=best_params['C'], gamma=best_params['gamma'], kernel=best_params['kernel'],
                  epsilon=best_params['epsilon'], degree=best_params['degree'])
        svr = MultiOutputRegressor(svr, n_jobs=-1)
        svr.fit(train_X, train_Y)
        # Saving the model
        if arima_forecasts is None:
            joblib.dump(svr, f'../models/{dataset_name}_svr.pkl')
        else:
            joblib.dump(svr, f'../models/{dataset_name}_sarimax_svr.pkl')
    # Forecasting train set
    train_forecast = svr.predict(train_X)
    train_forecast = scaler.inverse_transform(
        train_forecast.reshape(-1, 1)).reshape(-1, 1)
    # Forecasting test set
    test_forecast = svr.predict(test_X)
    test_forecast = scaler.inverse_transform(
        test_forecast.reshape(-1, 1)).reshape(-1, 1)

    error_values = {}

    # Evaluating error metrics for train and test sets
    print("Training data evaluation:")
    error_values["MAE_train"], error_values["RMSE_train"], error_values["MAPE_train"], _ = evaluate_performance(
        train_forecast, scaler.inverse_transform(train_Y.reshape(-1, 1)).reshape(-1, 1))
    print("Testing data evaluation:")
    error_values["MAE_test"], error_values["RMSE_test"], error_values["MAPE_test"], _ = evaluate_performance(
        test_forecast, scaler.inverse_transform(test_Y.reshape(-1, 1)).reshape(-1, 1))

    return train_forecast.flatten(), test_forecast.flatten(), error_values
