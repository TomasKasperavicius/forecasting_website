from fastapi import Body, FastAPI, UploadFile, File,HTTPException
from contextlib import asynccontextmanager
from keras.models import load_model
import joblib
import pandas as pd
import tensorflow as tf
from functions import preprocess_data
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from constants import TEST_SIZE_SAMPLES_ARIMA,LAG_COUNT
from pymongo import MongoClient
import os
import csv
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
import argon2
from argon2.exceptions import VerifyMismatchError

# Connect to mongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["forecastDB"]
collection = db["Users"]
models = {}
dataset_names = ['snow_cleaners', 'notebooks', 'cheese']

# Load models before server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the models
    for i in range(len(dataset_names)):
        models[f"{dataset_names[i]}_sarima"] = joblib.load(f'models/{dataset_names[i]}_sarima.pkl')
        models[f"{dataset_names[i]}_svr"] = joblib.load(f'models/{dataset_names[i]}_svr.pkl') 
        models[f"{dataset_names[i]}_lstm"] = load_model(f'models/{dataset_names[i]}_lstm.h5')
        models[f"{dataset_names[i]}_sarima_svr"] = joblib.load(f'models/{dataset_names[i]}_sarima_svr.pkl') 
    yield
    models.clear()  

app = FastAPI(lifespan=lifespan)
# Allow all cross origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
async def register_user(user_name: str = Body(..., embed=True), email: str = Body(..., embed=True),password: str = Body(..., embed=True)):
    # Hash the password using Argon2
    hashed_password = argon2.hash_password(password.encode('utf-8'))
    document = {
        "username": user_name,
        "email": email,
        "password": hashed_password.decode('utf-8'),
        "files": []
    }
    inserted_document = {}
    
    # Save user into database if it doesn't exist
    if collection.find_one({"$or": [{"user_name": user_name}, {"email": email}]}) is None:
        result = collection.insert_one(document)
        inserted_id = result.inserted_id
        inserted_document = collection.find_one({"_id": inserted_id})
    else:
        raise HTTPException(status_code=400, detail="User with this user name already exists")
    parseObjectIDs(inserted_document)
    return inserted_document
# Parse object id to string
def parseObjectIDs(document):
    document["_id"] = str(document["_id"])
    for i in document["files"]:
        i["_id"] = str(i["_id"])
# Login user
@app.post("/login")
async def login_user(email: str = Body(..., embed=True), password: str = Body(..., embed=True)):
    # Get user based on email
    user_document = collection.find_one({"email": email})
    if user_document is None:
        raise HTTPException(status_code=404, detail="User with provided email not found")
    # Get the password
    hashed_password:str = user_document["password"]
    parseObjectIDs(user_document)
    try:
        # Verify password
        if argon2.verify_password(hashed_password.encode('utf-8'),password.encode('utf-8')):
            return user_document
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Invalid email or password")

def remove_empty_lines(content):
    # Split the content into lines, remove empty lines, and join them back
    lines = content.splitlines()
    cleaned_lines = [line for line in lines if line.strip()]
    return cleaned_lines
# File upload
@app.post("/file/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Body(..., embed=True)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid Object ID format")

    user_dir = f"uploads/{user_id}"
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)

    file_name = os.path.basename(file.filename)
    file_path = f"uploads/{user_id}/{file_name}"

    # Read the entire file content
    content = await file.read()
    content_str = content.decode("utf-8")

    # Remove empty lines
    cleaned_content = remove_empty_lines(content_str)
    if len(cleaned_content) < 36:
        raise HTTPException(status_code=400, detail="Dataset has to be more than 36 rows")
    # Save the file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(cleaned_content))

    new_file_id = ObjectId()  

    # Create new file to be added
    new_file = {"_id": new_file_id, "name": file_name, "path": file_path}
    # Add the file to user file array
    result =  collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"files": new_file}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Parse object id to string
    new_file["_id"] = str(new_file["_id"])
    return new_file
# Delete file based on id
@app.delete("/file/")
async def delete_file(user_id:str = Body(..., embed=True),file_id:str = Body(..., embed=True)):
    try:
        if not ObjectId.is_valid(file_id) or not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid Object ID format")
        # Get user document
        user_document =  collection.find_one(
        {"_id": ObjectId(user_id), "files._id": ObjectId(file_id)},
        {"_id": 0, "files.$": 1}
        )
        if not user_document or "files" not in user_document or not user_document["files"]:
            raise HTTPException(status_code=404, detail="File not found")
        # Get file name of the file to be deleted
        file_name = user_document["files"][0]["name"]
        # Delete file from server file system
        os.remove(f"uploads/{user_id}/{file_name}")
        # Remove file from user file array
        result = collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"files": {"_id": ObjectId(file_id)}}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="File not found in user's files")
    except FileNotFoundError:
        return {"error": "File not found"}
    
# Get file data based on id
@app.post("/file/data")
async def get_file_data(file_id:str = Body(..., embed=True),user_id:str = Body(..., embed=True)):
    if not ObjectId.is_valid(file_id) or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid Object ID format")
    # Get user document
    user_document = collection.find_one(
    {"_id": ObjectId(user_id), "files._id": ObjectId(file_id)},
    {"_id": 0, "files.$": 1}
    )
    if not user_document or "files" not in user_document or not user_document["files"]:
        raise HTTPException(status_code=404, detail="File not found")
    # Get file name from user document
    file_name = user_document["files"][0]["name"]
    if file_name is None:
        return {"error": "File not found in database","columns": [],"rows":[]}
    # Read the file and format content as CSV
    file_data = parse_csv(f"uploads/{user_id}/{file_name}")
    if file_data is None:
        return {"error": "File not found in server filesystem","columns": [],"rows":[]}
    # Get headers
    headers = file_data[0]
    # Format rows
    data = [dict(zip(headers, row)) for row in file_data[1:]]
    return {"columns": headers,"rows":data}

# Parse csv data
def parse_csv(file_path: str):
    try:
        with open(file_path, "r") as f:
            csv_data = []
            reader = csv.reader(f)
            for row in reader:
                csv_data.append(row)
            return csv_data
    except FileNotFoundError:
        return None
    
# Get all files
@app.post("/file/")
async def get_file_names(user_id: str = Body(..., embed=True)):
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid Object ID format")
        # Get user document
        user_document = collection.find_one({"_id": ObjectId(user_id)}, {"files": 1})
        if user_document is None:
            raise HTTPException(status_code=404, detail="User not found")
        parseObjectIDs(user_document)
        # Get user files
        result = user_document.get('files')
        return result
    except FileNotFoundError:
        return {"error": "File not found"}
# Validation forecast size
TEST_FORECAST_STEP_SIZE = 12
# Forecast based on model type passed
@app.post("/forecast")
async def forecast(method_name: str = Body(..., embed=True),user_id: str = Body(..., embed=True),file_id: str = Body(..., embed=True), steps: int = Body(TEST_FORECAST_STEP_SIZE, embed=True)):
    # Set steps if it was not passed as a request parameter
    if steps == None:
        steps = TEST_FORECAST_STEP_SIZE
    if not ObjectId.is_valid(file_id) or not ObjectId.is_valid(user_id):
        return {"error": "Invalid Object ID format"}
    # Get user document
    user_document =  collection.find_one(
    {"_id": ObjectId(user_id), "files._id": ObjectId(file_id)},
    {"_id": 0, "files.$": 1}
    )
    # Get file name
    file_name = user_document["files"][0]["name"]
    if file_name is None:
        return {"error": "File not found in database","columns": [],"rows":[]}
    forecast = []
    # Get the model
    model = models.get(os.path.basename(file_name).split('.')[0]+"_"+method_name)
    # Read the file
    df = pd.read_csv(f"uploads/{user_id}/{file_name}")
    # Get only number column and flatten the array
    df = np.array(df[df.select_dtypes(include=[np.number]).columns]).flatten()

    if model is None:
        return []
    # Svr model
    if method_name.endswith("svr"):
        # Scale the data into [0,1] interval
        scaler = MinMaxScaler()
        df = scaler.fit_transform(df.reshape(-1, 1))
        # Get feature and target arrays from data
        X, _ = preprocess_data(df)
        # Extrapolation forecast
        if steps != TEST_FORECAST_STEP_SIZE:
            forecasts = []
            # Forecast using last feature array 
            forecast = model.predict(X[-1:])
            # Remove first 12 values and append 12 forecasted values
            X = np.append(X[-1:][:, 12:], forecast.reshape(-1,12), axis=1)
            # Save forecasts, rescaled back
            forecasts.append(scaler.inverse_transform(forecast.reshape(-1, 1)).flatten())
            # Perform rolling forecasting until required forecast steps are reached
            for _ in range(steps//12 + 1):
                next_forecast = model.predict(X)
                # Save forecasts, rescaled back
                forecasts.append(scaler.inverse_transform(next_forecast.reshape(-1, 1)).flatten())
                # Remove first 12 values and append 12 forecasted values
                X = np.append(X[-1:][:, 12:], next_forecast.reshape(-1,12), axis=1)
            forecast = np.array(forecasts).flatten()[:steps]
        # Validation forecast
        else:
            # Test set forecast
            forecast = model.predict(X)
            # Rescale back
            forecast = scaler.inverse_transform(forecast.reshape(-1, 1)).flatten()[-steps:]
            # Return the difference between real values and forecasts
            forecast = np.subtract(forecast.flatten(), df[-steps:].flatten())
    # Sarima svr
    elif method_name.endswith("sarima_svr"):
        scaler = MinMaxScaler()
        train = df[:-
                       TEST_SIZE_SAMPLES_ARIMA]
        test_forecast = model.forecast(steps=TEST_SIZE_SAMPLES_ARIMA)
        train_index = np.arange(len(train))
        train_forecast = model.predict(start=train_index[0],
                                           end=train_index[-1],
                                           typ='levels')
        # Extrapolation forecast
        if steps != TEST_FORECAST_STEP_SIZE:
            arima_forecasts = np.concatenate((train_forecast[-LAG_COUNT:],test_forecast))
            # Scale the data into [0,1] interval
            arima_forecasts = scaler.fit_transform(arima_forecasts.reshape(-1, 1))
            # Get feature and target arrays from data
            X, _ = preprocess_data(arima_forecasts)
            forecast = model.predict(X)
            forecast = scaler.inverse_transform(forecast.reshape(-1, 1)).flatten()
        # Validation forecast
        else:
            arima_forecasts = np.concatenate((train_forecast,test_forecast))
            # Scale the data into [0,1] interval
            arima_forecasts = scaler.fit_transform(arima_forecasts.reshape(-1, 1))
            # Get feature and target arrays from data
            X, _ = preprocess_data(arima_forecasts)
            # Test set forecast
            forecast = model.predict(X)
            # Rescale back
            forecast = scaler.inverse_transform(forecast.reshape(-1, 1)).flatten()[-steps:]
            # Return the difference between real values and forecasts
            forecast = np.subtract(forecast.flatten(), df[-steps:].flatten())
    # Sarima
    elif method_name.endswith("sarima"):
        # Create train set
        train= df[:-
                       TEST_SIZE_SAMPLES_ARIMA]
        # Extrapolation forecast
        if steps != TEST_FORECAST_STEP_SIZE:
            forecast = model.forecast(steps=steps)
        # Validation forecast
        else:
            test_forecast = model.forecast(steps=TEST_SIZE_SAMPLES_ARIMA)
            train_index = np.arange(len(train))
            train_forecast = model.predict(start=train_index[0],
                                            end=train_index[-1],
                                            typ='levels')
            # Rescale back
            forecast = np.concatenate((train_forecast,test_forecast)).flatten()[-steps:]
            # Return the difference between real values and forecasts
            forecast = np.subtract(forecast.flatten(), df[-steps:].flatten())
    # Lstm
    elif method_name.endswith("lstm"):
        # Scale the data into [-1,1] interval
        scaler = MinMaxScaler(feature_range=(-1, 1))
        df = scaler.fit_transform(df.reshape(-1, 1))
        # Get feature and target arrays from data
        X, _ = preprocess_data(df)
        # Reshape feature array into correct form
        X = X.reshape(
            X.shape[0], X.shape[1], 1)
        # Extrapolation forecast
        if steps != TEST_FORECAST_STEP_SIZE:
            forecasts = []
            # Forecast using last feature array 
            forecast = model.predict(X[-1:], verbose=0) 
            # Remove first 12 values and append 12 forecasted values
            X = np.append(X[-1:][:, 12:, :], forecast.reshape(1,12,1), axis=1)
            # Save forecasts, rescaled back
            forecasts.append(scaler.inverse_transform(forecast.reshape(-1, 1)).flatten())
            for _ in range(steps//12 + 1):
                next_forecast = model.predict(X, verbose=0)  
                # Save forecasts, rescaled back
                forecasts.append(scaler.inverse_transform(next_forecast.reshape(-1, 1)).flatten())
                # Remove first 12 values and append 12 forecasted values
                X = np.append(X[-1:][:, 12:, :], forecast.reshape(1,12,1), axis=1)
            forecast = np.array(forecasts).flatten()[:steps]
        # Validation forecast
        else:
            # Test set forecast
            forecast = model.predict(X, verbose=0)
            # Rescale back
            forecast = scaler.inverse_transform(forecast).flatten()[-steps:]
            # Return the difference between real values and forecasts
            forecast = np.subtract(forecast.flatten(), df[-steps:].flatten())
    else:
        return {"error": "Invalid model name"}
    return forecast.tolist()
