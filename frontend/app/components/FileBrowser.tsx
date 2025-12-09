"use client";
import React, { useState, useEffect } from 'react';
import { FileMetadata } from '../page';

const API_BASE_URL = 'https://inrisk-weather-explorer.onrender.com'; 

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

            // Note: The backend response body structure is '{"files": [...]}'
            if (!response.ok) {
                // If backend returns an error object, check if it has a 'detail' field
                const errorDetail = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown API Error";
                setError(`Cloud Storage Error: Failed to list files - ${errorDetail}`);
                setFiles([]);
            } else {
                // Ensure data.files exists before setting state
                setFiles(data.files || []);
            }
        } catch (err: any) {
            setError("Network error connecting to backend.");
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    // The useEffect hook should depend on refreshKey from the parent component (Home.tsx)
    // However, since refreshKey is not passed here, we rely on the parent component's `key` prop on FileBrowser.
    useEffect(() => {
        fetchFiles();
    }, []); 

    return (
        // FIX 1: Reduced padding on mobile (p-4) vs. desktop (lg:p-6)
        <div className="p-4 lg:p-6 bg-white rounded-lg shadow-xl border border-gray-200 h-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
                Stored Files (AWS S3)
                {/* FIX 2: Reduced button size and padding on mobile */}
                <button 
                    onClick={fetchFiles}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition duration-150 p-1 rounded hover:bg-blue-50"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </h2>

            {error && <p className="text-red-600 text-sm mb-2 font-medium">Error: {error}</p>}

            {loading && files.length === 0 && <p className="text-gray-500 text-sm">Loading files...</p>}
            
            {files.length === 0 && !loading && !error && <p className="text-gray-500 text-sm">No stored files found.</p>}

            {/* FIX 3: Ensures the list scrolls vertically */}
            <ul className="space-y-2 max-h-[20rem] lg:max-h-96 overflow-y-auto">
                {files.map((file) => (
                    <li
                        key={file.name}
                        onClick={() => onFileSelect(file.name)}
                        // FIX 4: Reduced vertical padding on list item for mobile (p-2)
                        className={`cursor-pointer p-2 lg:p-3 border rounded-lg text-sm transition duration-150 ${
                            selectedFile === file.name 
                                ? 'bg-blue-100 border-blue-500 font-semibold'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                    >
                        {/* FIX 5: Ensure file name remains legible */}
                        <p className="truncate text-gray-800" title={file.name}>
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