import httpx
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from validation_models import WeatherInput
from storage_client import S3Client, S3_BUCKET_NAME # UPDATED IMPORT
from botocore.exceptions import ClientError # Import for S3 error handling

# --- Configuration ---
OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

# Initialize the FastAPI application
app = FastAPI(
    title="InRisk Weather Explorer Backend",
    version="1.0.0"
)

# Initialize the S3 client 
s3_client = S3Client(bucket_name=S3_BUCKET_NAME) # UPDATED CLIENT

# --- CORS Middleware (No Change) ---
origins = ["http://localhost:3000", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Weather Explorer API is running!"}

# --- 1. POST /store-weather-data ---
@app.post("/store-weather-data")
async def store_weather_data(input_data: WeatherInput):
    # 1. Pydantic model handles validation (latitude, longitude, date range)

    # 2. Call Open-Meteo API
    params = {
        "latitude": input_data.latitude,
        "longitude": input_data.longitude,
        "start_date": input_data.start_date.isoformat(),
        "end_date": input_data.end_date.isoformat(),
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min",
        "timezone": "auto"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"External API Error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Network Error contacting Open-Meteo: {e}"
            )

    # 3. Store full API JSON to chosen bucket
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    
    filename = (
        f"weather_{input_data.latitude}_{input_data.longitude}_"
        f"{input_data.start_date.isoformat()}_"
        f"{input_data.end_date.isoformat()}_{timestamp}.json"
    )
    
    raw_data_bytes = response.content
    try:
        # UPDATED CLIENT CALL
        stored_filename = s3_client.upload_file(raw_data_bytes, filename) 
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to upload file - {e}"
        )

    # 4. Return success response
    return {"status": "ok", "file": stored_filename}

# --- 2. GET /list-weather-files ---
@app.get("/list-weather-files")
def list_weather_files():
    try:
        # UPDATED CLIENT CALL
        files = s3_client.list_files() 
        return {"files": files}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to list files - {e}"
        )

# --- 3. GET /weather-file-content/{file} ---
@app.get("/weather-file-content/{file}")
def get_weather_file_content(file: str):
    try:
        # UPDATED CLIENT CALL
        file_content = s3_client.download_file(file)
        return file_content 
        
    except HTTPException as e:
        # Catches the 404 status raised by S3Client if the file is not found
        if e.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"status": "error", "message": "not found"}
            )
        raise # Re-raise if it's another HTTPException
        
    except Exception as e:
        # Catches other unexpected S3 errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to retrieve file - {e}"
        )