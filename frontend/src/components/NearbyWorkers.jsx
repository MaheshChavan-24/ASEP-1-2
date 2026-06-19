import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NearbyWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  const fetchNearbyWorkers = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
      const response = await axios.get(`${baseUrl}/api/profiles/nearby-workers/?client_lat=${lat}&client_lon=${lon}`);
      setWorkers(response.data.workers);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch nearby workers.");
    } finally {
      setLoading(false);
    }
  };

  const locateAndFetch = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        fetchNearbyWorkers(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location. Please ensure location services are enabled.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Optionally fetch on mount
  useEffect(() => {
    // locateAndFetch();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Nearby Workers</h2>
          <p className="text-sm text-gray-500">Find workers within a 5 km radius of your location.</p>
        </div>
        <button 
          onClick={locateAndFetch}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? 'Locating...' : '📍 Scan Area'}
        </button>
      </div>

      {location && !error && (
        <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <p className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Your Coordinates</p>
            <p className="text-sm text-indigo-600 font-mono">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 font-bold">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && workers.length === 0 && location && (
        <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
          <span className="text-4xl block mb-2">🏜️</span>
          <p className="text-gray-500 font-bold">No workers found within 5 km.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-xl">
                  {worker.name ? worker.name.charAt(0).toUpperCase() : worker.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{worker.name || worker.username}</h3>
                  <p className="text-xs text-gray-400">@{worker.username}</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                {worker.distance_km} km
              </span>
            </div>
            
            <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Live Coordinates</p>
               <p className="text-xs text-gray-600 font-mono">{worker.latitude.toFixed(4)}, {worker.longitude.toFixed(4)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyWorkers;
