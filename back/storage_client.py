# back/storage_client.py (FINAL CREDENTIAL BYPASS FIX)
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict
from datetime import datetime
from fastapi import HTTPException, status

# IMPORTANT: Replace this with your actual S3 bucket name!
S3_BUCKET_NAME = "weather-explorer-data-aditya"

# SET YOUR AWS REGION HERE (e.g., 'us-east-1', 'us-west-2', 'eu-central-1')
# You must set this to the region where your S3 bucket resides.
AWS_REGION = "us-east-1" 

class S3Client:
    """
    Handles all interactions with AWS S3.
    Uses empty credentials to bypass the credential search chain for public bucket access.
    """
    def __init__(self, bucket_name: str = S3_BUCKET_NAME):
        self.bucket_name: str = bucket_name
        
        # FINAL BYPASS: Pass empty credentials to satisfy the client initialization
        # requirements and explicitly set the region. This is required even for
        # public buckets to stop boto3 from crashing due to missing ENV variables.
        self.s3_client = boto3.client(
            's3',
            region_name=AWS_REGION, 
            aws_access_key_id='',       
            aws_secret_access_key=''    
        )

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
            raise Exception(f"S3 Upload Error: {e}")

    def list_files(self) -> List[Dict]:
        """
        Lists all objects in the S3 bucket.
        """
        files_metadata = []
        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
            
            if 'Contents' in response:
                for item in response['Contents']:
                    created_at = item['LastModified'].isoformat()
                    
                    files_metadata.append({
                        "name": item['Key'], 
                        "size": item['Size'], 
                        "created_at": created_at
                    })
        except ClientError as e:
            raise Exception(f"S3 List Error: {e}")
            
        return files_metadata

    def download_file(self, filename: str) -> bytes:
        """
        Fetches the JSON content of a specific file from the bucket.
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=filename)
            return response['Body'].read()
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in S3.")
            else:
                raise Exception(f"S3 Download Error: {e}")