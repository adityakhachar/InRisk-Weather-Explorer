from datetime import date, timedelta
from pydantic import BaseModel, Field, validator # NOTE THE CHANGE HERE
from fastapi import HTTPException, status

class WeatherInput(BaseModel):
    """
    Pydantic V1 model for validating input to the /store-weather-data endpoint.
    """
    # Enforce type and bounds
    # V1 syntax for bounds uses the Field() definition
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    start_date: date
    end_date: date

    # NOTE: Using @validator for V1 compatibility
    @validator('end_date', pre=True, always=True)
    def validate_dates(cls, end_date, values):
        
        # Ensure we can convert to date objects for comparison
        try:
            end_date_obj = date.fromisoformat(end_date)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: Invalid date format. Use YYYY-MM-DD."
            )

        start_date_obj = values.get('start_date')

        if not start_date_obj:
            return end_date_obj # Return for now if start_date hasn't been parsed yet

        # Constraint check 1: start_date <= end_date
        if start_date_obj > end_date_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: start_date must be less than or equal to end_date."
            )

        # Constraint check 2: range <= 31 days
        date_range = end_date_obj - start_date_obj
        if date_range > timedelta(days=31):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation Error: Date range must not exceed 31 days."
            )

        return end_date_obj