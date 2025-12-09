from datetime import date, timedelta
from pydantic import BaseModel, Field, validator  
from fastapi import HTTPException, status

class WeatherInput(BaseModel):
    """
    Pydantic V1 model for validating input to the /store-weather-data endpoint.
    """
 
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    start_date: date
    end_date: date

 
    @validator('end_date', pre=True, always=True)
    def validate_dates(cls, end_date, values):
        
         
        try:
            end_date_obj = date.fromisoformat(end_date)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: Invalid date format. Use YYYY-MM-DD."
            )

        start_date_obj = values.get('start_date')

        if not start_date_obj:
            return end_date_obj  

        
        if start_date_obj > end_date_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: start_date must be less than or equal to end_date."
            )

         
        date_range = end_date_obj - start_date_obj
        if date_range > timedelta(days=31):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: Date range must not exceed 31 days."
            )

        return end_date_obj