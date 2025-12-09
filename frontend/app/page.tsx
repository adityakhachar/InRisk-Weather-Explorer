// frontend/app/page.tsx (REVISED)

"use client";
import { useState, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import FileBrowser from './components/FileBrowser';
import VisualizationPanel from './components/VisualizationPanel';

// --- Shared Types ---
export interface FileMetadata {
  name: string;
  size: number;
  created_at: string;
}

export interface RawWeatherData {
    latitude: number;
    longitude: number;
    timezone: string;
    daily_units: {
        time: string;
        temperature_2m_max: string;
        temperature_2m_min: string;
        apparent_temperature_max: string;
        apparent_temperature_min: string;
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        apparent_temperature_max: number[];
        apparent_temperature_min: number[];
    };
}


export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<RawWeatherData | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setWeatherData(null);
  };

  const handleFileStored = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    // FIX: Enhanced background with a gradient and padding
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
          <header className="text-center py-6 mb-12 border-b border-blue-200">
            <h1 className="text-5xl font-extrabold text-blue-700 tracking-tight">
              InRisk Weather Explorer Dashboard
            </h1>
            <p className="text-lg text-gray-500 mt-2">Full-Stack Assessment Solution</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column: Input and Browser */}
            <div className="lg:col-span-1 space-y-8">
              
              <InputPanel onFileStored={handleFileStored} />
              
              <FileBrowser 
                key={refreshKey}
                onFileSelect={handleFileSelect} 
                selectedFile={selectedFile} 
              />

            </div>

            {/* Right Column: Visualization */}
            <div className="lg:col-span-3">
              <VisualizationPanel 
                selectedFile={selectedFile} 
                weatherData={weatherData}
                setWeatherData={setWeatherData}
              />
            </div>

          </div>
      </div>
    </div>
  );
}