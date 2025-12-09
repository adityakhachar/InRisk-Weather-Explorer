// frontend/app/components/FileBrowser.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { FileMetadata } from '../page';

const API_BASE_URL = 'http://127.0.0.1:8000'; 

interface FileBrowserProps {
    onFileSelect: (fileName: string) => void;
    selectedFile: string | null;
}

function FileBrowser({ onFileSelect, selectedFile }: FileBrowserProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/list-weather-files`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to list files from backend.");
        setFiles([]);
      } else {
        setFiles(data.files || []);
      }
    } catch (err: any) {
      setError("Network error connecting to backend.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full">
      <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
        Stored Files (AWS S3)
        <button 
          onClick={fetchFiles}
          className="text-blue-500 hover:text-blue-700 text-sm"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </h2>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {loading && files.length === 0 && <p className="text-gray-500">Loading files...</p>}
      
      {files.length === 0 && !loading && !error && <p className="text-gray-500">No stored files found.</p>}

      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {files.map((file) => (
          <li
            key={file.name}
            onClick={() => onFileSelect(file.name)}
            className={`cursor-pointer p-3 border rounded-lg text-sm transition duration-150 ${
              selectedFile === file.name 
                ? 'bg-blue-100 border-blue-500 font-medium'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <p className="truncate" title={file.name}>
                {file.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
                {new Date(file.created_at).toLocaleDateString()} | {(file.size / 1024).toFixed(1)} KB
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileBrowser;