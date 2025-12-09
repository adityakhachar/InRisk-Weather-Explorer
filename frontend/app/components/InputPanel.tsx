// frontend/app/components/InputPanel.tsx

"use client";
import React, { useState, FormEvent } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000'; 

interface InputPanelProps {
    onFileStored: () => void;
}

interface FormData {
    latitude: number;
    longitude: number;
    start_date: string;
    end_date: string;
}

function InputPanel({ onFileStored }: InputPanelProps) {
  const [formData, setFormData] = useState<FormData>({
    latitude: 35.68,
    longitude: 139.75,
    start_date: '2024-01-01',
    end_date: '2024-01-05',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successFile, setSuccessFile] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessFile(null);

    try {
      const response = await fetch(`${API_BASE_URL}/store-weather-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown Error";
        setError(`Error (${response.status}): ${errorDetail}`);
      } else {
        setSuccessFile(data.file);
        onFileStored();
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Fetch & Store Data</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {Object.keys(formData).map(key => (
          <input
            key={key}
            type={key.includes('date') ? 'date' : 'number'}
            name={key}
            value={formData[key as keyof FormData] as any}
            onChange={handleChange}
            placeholder={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            className="p-2 border border-gray-300 rounded"
            required
            step={key.includes('date') ? undefined : 'any'}
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          className={`col-span-2 p-2 rounded text-white font-bold transition duration-150 ${
            loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Fetching & Storing...' : 'Fetch & Store Data'}
        </button>
      </form>

      {error && (
        <p className="mt-4 p-2 bg-red-100 text-red-700 rounded border border-red-300">
          Error: {error}
        </p>
      )}
      {successFile && (
        <p className="mt-4 p-2 bg-green-100 text-green-700 rounded border border-red-300">
          Success! File stored: **{successFile}**
        </p>
      )}
    </div>
  );
}

export default InputPanel;