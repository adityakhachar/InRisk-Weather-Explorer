import httpx
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from validation_models import WeatherInput
from storage_client import S3Client, S3_BUCKET_NAME  
from botocore.exceptions import ClientError  

 
OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

 
app = FastAPI(
    title="InRisk Weather Explorer Backend",
    version="1.0.0"
)

 
s3_client = S3Client(bucket_name=S3_BUCKET_NAME)  

 
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

 
@app.post("/store-weather-data")
async def store_weather_data(input_data: WeatherInput):
    
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

     
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    
    filename = (
        f"weather_{input_data.latitude}_{input_data.longitude}_"
        f"{input_data.start_date.isoformat()}_"
        f"{input_data.end_date.isoformat()}_{timestamp}.json"
    )
    
    raw_data_bytes = response.content
    try:
         
        stored_filename = s3_client.upload_file(raw_data_bytes, filename) 
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to upload file - {e}"
        )

     
    return {"status": "ok", "file": stored_filename}

 
@app.get("/list-weather-files")
def list_weather_files():
    try:
        
        files = s3_client.list_files() 
        return {"files": files}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to list files - {e}"
        )

 
@app.get("/weather-file-content/{file}")
def get_weather_file_content(file: str):
    try:
         
        file_content = s3_client.download_file(file)
        return file_content 
        
    except HTTPException as e:
         
        if e.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"status": "error", "message": "not found"}
            )
        raise  
        
    except Exception as e:
         
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud Storage Error: Failed to retrieve file - {e}"
        )