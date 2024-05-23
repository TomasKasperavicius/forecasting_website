from constants import SLIDING_WINDOW_SIZE, LAG_COUNT, FORECASTING_PERIOD
import numpy as np
import os
import pandas as pd

def preprocess_data(data):
    X = []
    Y = []
    start_index = len(data) % LAG_COUNT
    for i in range(start_index, len(data)-LAG_COUNT, SLIDING_WINDOW_SIZE):
        X.append(data[i:i + LAG_COUNT])
        Y.append(data[i + LAG_COUNT:i + LAG_COUNT+FORECASTING_PERIOD])

    X = np.array(X).reshape(-1, LAG_COUNT)
    Y = np.array(Y).reshape(-1, FORECASTING_PERIOD)
    return X, Y

def read_data(file_name):
    if os.path.exists(file_name):
        df = pd.read_csv(file_name, sep=',')
        df['Laikotarpis'] = pd.to_datetime(df['Laikotarpis'])
        df.set_index('Laikotarpis', inplace=True)
        df.index.freq = 'MS'
        return df
    else:
        print(f"The file '{file_name}' does not exist.")