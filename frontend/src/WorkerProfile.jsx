import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API_BASE = `${BASE_URL}/api/users/`;

export default function WorkerProfile({ lang, user, setUser }) {
  const [idType, setIdType] = useState('Aadhaar');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!frontImage || !backImage) return alert("Please select Front and Back images.");

    setUploading(true);
    
    const formData = new FormData();
    formData.append('id_type', idType);
    formData.append('id_front_image', frontImage);
    formData.append('id_back_image', backImage);
    if (selfieImage) formData.append('id_selfie_image', selfieImage);

    const token = localStorage.getItem('access_token');
    
    try {
      const res = await axios.post(`${API_BASE}upload-documents/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(res.data.message);
      
      // Update global user state
      if (setUser) {
        setUser(prev => ({ ...prev, verification_status: res.data.status }));
      }
      
      setFrontImage(null);
      setBackImage(null);
      setSelfieImage(null);
    } catch (err) {
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Verification Documents</h3>
      
      <form onSubmit={handleUpload} className="mb-8 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
        <div className="grid gap-4 mb-4">
          <label className="block text-sm font-bold text-gray-700">Select Document Type</label>
          <select 
            className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500"
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
          >
            <option value="Aadhaar">Aadhaar</option>
            <option value="PAN">PAN</option>
            <option value="Passport">Passport</option>
            <option value="Driving License">Driving License</option>
          </select>
          
          <label className="block text-sm font-bold text-gray-700">Front Image</label>
          <input 
            type="file" 
            className="p-2 bg-white rounded-xl border w-full"
            onChange={(e) => setFrontImage(e.target.files[0])} 
            required
          />

          <label className="block text-sm font-bold text-gray-700">Back Image</label>
          <input 
            type="file" 
            className="p-2 bg-white rounded-xl border w-full"
            onChange={(e) => setBackImage(e.target.files[0])} 
            required
          />

          <label className="block text-sm font-bold text-gray-700">Selfie (Optional but Recommended)</label>
          <input 
            type="file" 
            className="p-2 bg-white rounded-xl border w-full"
            onChange={(e) => setSelfieImage(e.target.files[0])} 
          />
        </div>
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
        >
          {uploading ? "Uploading..." : "Submit Documents"}
        </button>
      </form>
    </div>
  );
}