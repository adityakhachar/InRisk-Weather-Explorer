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
    // Outer Container: Subtle gradient background, reduced padding on mobile (p-4)
    <div className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
          {/* Header: Centered, reduced padding/margins for mobile readability */}
          <header className="text-center py-4 mb-6 lg:py-6 lg:mb-12 border-b border-blue-200">
            <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight sm:text-4xl lg:text-5xl">
              InRisk Weather Explorer Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1 lg:text-lg">Full-Stack Assessment Solution</p>
          </header>

          {/* Main Layout Grid: Defaults to 1 column on mobile (grid-cols-1), switches to 4 columns on large screens (lg:grid-cols-4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
            
            {/* Left Column (Input and Browser) */}
            {/* Stacks vertically on mobile (space-y-4) */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-8">
              
              <InputPanel onFileStored={handleFileStored} />
              
              <FileBrowser 
                key={refreshKey}
                onFileSelect={handleFileSelect} 
                selectedFile={selectedFile} 
              />

            </div>

            {/* Right Column (Visualization) */}
            {/* Takes full width on mobile, then 3 columns on large screens */}
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