// frontend/app/components/VisualizationPanel.tsx (FINAL RESPONSIVE CODE)
"use client";
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
// Import ResponsiveContainer for charts to resize automatically
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; 
import { RawWeatherData } from '../page';

const API_BASE_URL = 'https://inrisk-weather-explorer.onrender.com'; 

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

// Helper function to safely parse a value
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
            const response = await fetch(`${API_BASE_URL}/get-weather-data/${selectedFile}`); // Corrected endpoint based on README
            let rawData = await response.json(); 

            // CRITICAL BLOCK FOR DOUBLE PARSING SAFETY (Kept as is)
            try {
                if (typeof rawData === 'string') {
                    rawData = JSON.parse(rawData); 
                }
            } catch (e) {
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
            setError(`Processing Error: ${err.message}`);
            setProcessedData([]);
        } finally {
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
        // FIX 1: Use ResponsiveContainer to make the chart auto-size to its parent div.
        <div style={{ width: '100%', height: '300px' }}> 
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 10 }} /> {/* Smaller font for mobile */}
              <YAxis label={{ value: `Temperature (°C)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip /> 
              <Legend wrapperStyle={{fontSize: '12px'}} /> {/* Smaller legend font for mobile */}
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
          </ResponsiveContainer>
        </div>
    );

    const renderTable = () => (
        <div className="mt-8">
            <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4">Raw Data Table</h3> {/* Reduced font size on mobile */}
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mb-4 text-xs sm:text-sm"> {/* Smaller font on mobile */}
                <div>
                    Rows per page:
                    <select 
                        className="ml-2 border rounded p-1 text-gray-700"
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
                <div className="flex items-center">
                    <span className="mr-2">Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                        className="p-1 border rounded text-xs sm:text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-100"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="ml-2 p-1 border rounded text-xs sm:text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Data Table */}
            {/* FIX 2: Added overflow-x-auto to the wrapper for horizontal scrolling on mobile */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Date', 'Max Temp (°C)', 'Min Temp (°C)', 'Apparent Max (°C)', 'Apparent Min (°C)'].map(header => (
                                // FIX 3: Reduced padding and font size on table headers
                                <th key={header} className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentRows.map((row) => (
                            <tr key={row.date} className="hover:bg-gray-50">
                                {/* FIX 4: Reduced padding and font size on table cells */}
                                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.date}</td>
                                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{row.tempMax}</td>
                                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{row.tempMin}</td>
                                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{row.apparentMax}</td>
                                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{row.apparentMin}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );


    // --- MAIN RENDERING LOGIC ---
    
    // 1. If no file is selected, show the prompt
    if (!selectedFile) {
        // FIX 5: Reduced padding and min-height on mobile
        return (
            <div className="p-6 lg:p-8 bg-white rounded-lg shadow-xl h-full flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
                <p className="text-gray-500 text-base lg:text-lg text-center">
                    Select a file from the left panel to view and visualize the weather data.
                </p>
            </div>
        );
    }

    // 2. If a file IS selected, we render the container and conditionally show content
    return (
        // FIX 6: Reduced padding on mobile
        <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-xl h-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-6 truncate">
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
                    <div className="mb-8"> 
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