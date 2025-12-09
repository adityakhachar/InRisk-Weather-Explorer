// frontend/app/components/VisualizationPanel.tsx (REVISED RENDER LOGIC)
"use client";
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RawWeatherData } from '../page';

const API_BASE_URL = 'http://127.0.0.1:8000'; 

// --- Types ---
interface ChartData {
    date: string;
    tempMax: number;
    tempMin: number;
    apparentMax: number;
    apparentMin: number;
    unit: string;
}

interface VisualizationPanelProps {
    selectedFile: string | null;
    weatherData: RawWeatherData | null;
    setWeatherData: Dispatch<SetStateAction<RawWeatherData | null>>;
}

// Helper function to safely parse a value, converting null/undefined/NaN to 0
const safeParse = (value: number | null | undefined): number => {
    return (value === null || value === undefined || isNaN(value)) ? 0 : value;
};


function VisualizationPanel({ selectedFile, weatherData, setWeatherData }: VisualizationPanelProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [processedData, setProcessedData] = useState<ChartData[]>([]);
  
  // --- Data Processing and Fetching (Logic remains the same) ---

  const processRawData = (data: RawWeatherData): ChartData[] => {
    if (!data || !data.daily || !data.daily.time) {
      return [];
    }
    const daily = data.daily;
    const transformed: ChartData[] = daily.time.map((date, index) => ({
      date,
      tempMax: safeParse(daily.temperature_2m_max[index]),
      tempMin: safeParse(daily.temperature_2m_min[index]),
      apparentMax: safeParse(daily.apparent_temperature_max[index]),
      apparentMin: safeParse(daily.apparent_temperature_min[index]),
      unit: data.daily_units.temperature_2m_max,
    }));
    return transformed;
  };

  const fetchData = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/weather-file-content/${selectedFile}`);
      let rawData = await response.json(); 

      // CRITICAL BLOCK FOR DOUBLE PARSING SAFETY
      try {
          // If the first parse results in a string (due to double encoding), parse it again
          if (typeof rawData === 'string') {
              rawData = JSON.parse(rawData); 
          }
      } catch (e) {
          // If JSON.parse fails here, catch it and throw a controlled error
          throw new Error("Data corruption error: Content could not be parsed into valid JSON.");
      }
      // END CRITICAL BLOCK

      if (!response.ok) {
        const errorDetail = (rawData as any).detail?.message || JSON.stringify((rawData as any).detail) || "Failed to retrieve file content.";
        setError(errorDetail);
        setProcessedData([]);
      } else {
        const newProcessedData = processRawData(rawData);
        setWeatherData(rawData); 
        setProcessedData(newProcessedData); 
      }
    } catch (err: any) {
        // This catches network errors AND the new Data corruption error
        setError(`Processing Error: ${err.message}`);
        setProcessedData([]);
    } finally {
        // GUARANTEE THIS LINE EXECUTES
        setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
    setRowsPerPage(10);
  }, [selectedFile]); 

  // --- Table Pagination Logic (Logic remains the same) ---

  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = processedData.slice(startIndex, endIndex);

  // --- Render Functions (Chart fix applied) ---

  const renderChart = () => (
    // Fixed width/height for stable rendering (no ResponsiveContainer)
    <div style={{ width: '780px', height: '300px', margin: '0 auto' }}> 
      <LineChart
        width={780} 
        height={300}
        data={processedData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 12 }} />
        <YAxis label={{ value: `Temperature (°C)`, angle: -90, position: 'insideLeft' }} />
        <Tooltip /> 
        <Legend />
        <Line 
          type="monotone" 
          dataKey="tempMax"
          name="Max Temp (2m)" 
          stroke="#e64a19" 
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="tempMin" 
          name="Min Temp (2m)" 
          stroke="#1976d2" 
          strokeWidth={2}
        />
      </LineChart>
    </div>
  );

  const renderTable = () => (
    // ... (Table code remains the same) ...
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Raw Data Table</h3>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <div>
          Rows per page:
          <select 
            className="ml-2 border rounded p-1"
            value={rowsPerPage} 
            onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
            }}
          >
            {[10, 20, 50].map(val => (
                <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div>
          Page {currentPage} of {totalPages}
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1}
            className="ml-3 p-1 border rounded text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages}
            className="ml-2 p-1 border rounded text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Max Temp (°C)', 'Min Temp (°C)', 'Apparent Max (°C)', 'Apparent Min (°C)'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((row) => (
              <tr key={row.date} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.tempMax}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.tempMin}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.apparentMax}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.apparentMin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  // --- MAIN RENDERING LOGIC ---
  
  // 1. If no file is selected, show the prompt (This part is unchanged)
  if (!selectedFile) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-xl h-full flex items-center justify-center min-h-[500px]">
        <p className="text-gray-500 text-lg">
            Select a file from the left panel to view and visualize the weather data.
        </p>
      </div>
    );
  }

  // 2. If a file IS selected, we render the container and conditionally show content
  return (
    <div className="p-8 bg-white rounded-lg shadow-xl h-full">
      <h2 className="text-2xl font-bold mb-6 truncate">
        Visualization: {selectedFile}
      </h2>

      {/* --- Check for Loading / Error --- */}

      {loading && (
        <div className="p-4 text-center text-blue-600">
          Loading data... (Fetching from S3 via FastAPI)
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded border border-red-300">
          Error loading data: {error}
        </div>
      )}

      {/* --- Check for Data Availability --- */}

      {/* Renders if loading is complete AND data is present */}
      {!loading && processedData.length > 0 && (
        <>
          {/* --- DEBUG PANEL --- */}
          {/* <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-xs rounded">
              <p className="font-bold text-yellow-800">DEBUG: Chart Data Check</p>
              <p>Total Data Points: {processedData.length}</p>
              <p className="truncate">First Data Point: {JSON.stringify(processedData[0])}</p>
          </div> */}
          {/* ------------------- */}
          
          <div className="mb-8 overflow-x-auto"> 
            <h3 className="text-xl font-semibold mb-4">Daily Temperature Chart</h3>
            {renderChart()}
          </div>
          
          {renderTable()}
        </>
      )}

      {/* Renders if loading is complete AND data is NOT present (e.g., empty file) */}
      {!loading && processedData.length === 0 && !error && (
        <div className="p-4 text-center text-gray-500">
          No weather data available for this file.
        </div>
      )}
    </div>
  );
}

export default VisualizationPanel;