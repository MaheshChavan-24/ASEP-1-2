import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://127.0.0.1:8000/api/profiles/";

export default function WorkerProfile() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('ID Proof');
  const [uploading, setUploading] = useState(false);

  // Fetch existing documents when component loads
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first.");

    setUploading(true);
    
    // Create FormData object to send binary file data
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    
    try {
      await axios.post(`${API_BASE}documents/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // Critical for file uploads
        }
      });
      alert("Document uploaded successfully!");
      setFile(null);
      fetchDocuments(); // Refresh list to show new doc
    } catch (err) {
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Verification Documents</h3>
      
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="mb-8 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
        <div className="grid gap-4 mb-4">
          <label className="block text-sm font-bold text-gray-700">Select Document Type</label>
          <select 
            className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option>ID Proof (Aadhaar/Voter ID)</option>
            <option>Address Proof</option>
            <option>Skill Certificate</option>
          </select>
          
          <label className="block text-sm font-bold text-gray-700">Upload File</label>
          <input 
            type="file" 
            className="p-2 bg-white rounded-xl border w-full"
            onChange={(e) => setFile(e.target.files[0])} 
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {/* Document List */}
      <div className="space-y-3">
        <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-4">Your Uploaded Documents</h4>
        {documents.length === 0 ? (
          <p className="text-gray-400 text-sm italic text-center py-4">No documents uploaded yet.</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">📄</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{doc.document_type}</p>
                  <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${
                doc.status === 'verified' ? 'bg-green-100 text-green-700' : 
                doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {doc.status === 'pending' ? 'Pending Review' : doc.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}