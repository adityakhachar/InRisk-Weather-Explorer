import boto3
from botocore.exceptions import ClientError
from typing import List, Dict
from datetime import datetime
from fastapi import HTTPException, status

# IMPORTANT: Replace this with your actual S3 bucket name!
S3_BUCKET_NAME = "weather-explorer-data-aditya"

class S3Client:
    """
    Handles all interactions with AWS S3.
    Requires AWS credentials configured (e.g., via AWS CLI or env variables).
    """
    def __init__(self, bucket_name: str = S3_BUCKET_NAME):
        self.bucket_name: str = bucket_name
        # Initialize the S3 client
        self.s3_client = boto3.client('s3')

    def upload_file(self, data: bytes, filename: str) -> str:
        """
        Stores the raw JSON data as an object in the S3 bucket.
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=data,
                ContentType="application/json"
            )
            return filename
        except ClientError as e:
            # Re-raise as a generic error for main.py to handle
            raise Exception(f"S3 Upload Error: {e}")

    def list_files(self) -> List[Dict]:
        """
        Lists all objects in the S3 bucket, retrieving name, size, and creation time.
        """
        files_metadata = []
        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
            
            # Check for 'Contents' which holds the list of objects
            if 'Contents' in response:
                for item in response['Contents']:
                    # AWS returns LastModified as datetime object, convert to ISO8601 string
                    created_at = item['LastModified'].isoformat()
                    
                    files_metadata.append({
                        "name": item['Key'], 
                        "size": item['Size'], # Size in bytes
                        "created_at": created_at # ISO8601 format required
                    })
        except ClientError as e:
            # Handle potential bucket access/not found errors
            raise Exception(f"S3 List Error: {e}")
            
        return files_metadata

    def download_file(self, filename: str) -> bytes:
        """
        Fetches the JSON content of a specific file from the bucket.
        Raises ClientError if the file does not exist (handled as 404 in main.py).
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=filename)
            # Read and return the body content as bytes
            return response['Body'].read()
        except ClientError as e:
            # Check for the specific 404 error code
            if e.response['Error']['Code'] == 'NoSuchKey':
                # Raise an exception that main.py can catch for the 404 response
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in S3.")
            else:
                raise Exception(f"S3 Download Error: {e}")

# IMPORTANT: You must change the import name in main.py to use S3Client!