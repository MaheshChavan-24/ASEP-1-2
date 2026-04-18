import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

// --- CONFIGURATION ---
const API_BASE = "http://127.0.0.1:8000/api/users/";
const JOB_API = "http://127.0.0.1:8000/api/jobs/";
const PROFILE_API = "http://127.0.0.1:8000/api/profiles/";

// --- TRANSLATIONS DICTIONARY ---
const translations = {
  en: {
    serviceConnect: "ServiceConnect",
    needjob: "I Want to Work",
    needservice: "I Need Service",
    login: "Login",
    register: "Register",
    username: "Username",
    password: "Password",
    welcome: "Welcome",
    back: "Back",
    postJob: "Post New Job",
    services: "Services",
    activeBookings: "Active Bookings",
    maid: "Maid",
    cook: "Cook",
    arranger: "Arranger",
    jobMarketplace: "Job Marketplace",
    activeWork: "Active Work",
    workHistory: "Work History",
    reviews: "Reviews",
    myDocuments: "My Documents",
    accept: "Accept",
    scanning: "Scanning for jobs...",
    uploadDoc: "Upload Document",
    logout: "Logout"
  },
  hi: {
    serviceConnect: "सर्विस कनेक्ट",
    needjob: "मुझे काम चाहिए",
    needservice: "मुझे सेवा चाहिए",
    login: "लॉग इन",
    register: "पंजीकरण",
    username: "उपयोगकर्ता नाम",
    password: "पासवर्ड",
    welcome: "स्वागत है",
    back: "वापस",
    postJob: "नई नौकरी",
    services: "सेवाएं",
    activeBookings: "बुकिंग",
    maid: "नौकरानी",
    cook: "रसोइया",
    arranger: "आयोजक",
    jobMarketplace: "नौकरी बाजार",
    activeWork: "जारी कार्य",
    workHistory: "कार्य इतिहास",
    reviews: "रिव्युज",
    myDocuments: "मेरे दस्तावेज",
    accept: "स्वीकार",
    scanning: "खोज जारी है...",
    uploadDoc: "अपलोड करें",
    logout: "लॉग आउट"
  },
  mr: {
    serviceConnect: "सर्व्हिस कनेक्ट",
    needjob: "मला काम हवे आहे",
    needservice: "मला सेवा हवी आहे",
    login: "लॉग इन",
    register: "नोंदणी",
    username: "वापरकर्ता",
    password: "पासवर्ड",
    welcome: "स्वागत आहे",
    back: "मागे",
    postJob: "नवीन काम",
    services: "सेवा",
    activeBookings: "बुकिंग",
    maid: "मोलकरीण",
    cook: "आचारी",
    arranger: "आयोजक",
    jobMarketplace: "काम बाजार",
    activeWork: "चालू काम",
    workHistory: "कामाचा इतिहास",
    reviews: "रिव्युज",
    myDocuments: "कागदपत्रे",
    accept: "स्वीकारा",
    scanning: "शोध सुरू...",
    uploadDoc: "अपलोड करा",
    logout: "बाहेर पडा"
  }
};

// --- COMPONENT: WORKER PROFILE ---
function WorkerProfile({ lang }) {
  const t = translations[lang];
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('ID Proof');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${PROFILE_API}documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) { console.error("Failed to load docs"); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first.");
    setUploading(true);
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${PROFILE_API}documents/`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert("Uploaded!");
      setFile(null);
      fetchDocuments();
    } catch (err) { alert("Upload failed."); }
    finally { setUploading(false); }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">{t.myDocuments}</h3>
      <form onSubmit={handleUpload} className="mb-8 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
        <div className="grid gap-4 mb-4">
          <label className="block text-sm font-bold text-gray-700">Document Type</label>
          <select className="p-3 rounded-xl border outline-none" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option>ID Proof (Aadhaar/Voter ID)</option>
            <option>Address Proof</option>
            <option>Skill Certificate</option>
          </select>
          <input type="file" className="p-2 bg-white rounded-xl border w-full" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <button type="submit" disabled={uploading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
          {uploading ? "Uploading..." : t.uploadDoc}
        </button>
      </form>
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div><p className="font-bold text-gray-800 text-sm">{doc.document_type}</p><p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p></div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>{doc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function App() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 18.52, lng: 73.85 });

  const onLoadAutocomplete = (autoC) => setAutocomplete(autoC);
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
         const lat = place.geometry.location.lat();
         const lng = place.geometry.location.lng();
         setJobData(prev => ({
           ...prev, 
           address: place.formatted_address || place.name || prev.address, 
           latitude: lat, 
           longitude: lng
         }));
         setMapCenter({ lat, lng });
      }
    }
  };

  const [view, setView] = useState('landing');
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [lang, setLang] = useState('en');
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState('services');
  const [workerTab, setWorkerTab] = useState('jobs');
  const [showJobForm, setShowJobForm] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  // Review UI States
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviews, setReviews] = useState([]); // Store worker reviews
  const [availableJobs, setAvailableJobs] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);

  // FORM DATA (Now with 5 fields)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone_number: '',
    password: ''
  });
  const [jobData, setJobData] = useState({ title: '', description: '', service_type: 'Maid', budget: '', address: '', latitude: 18.52, longitude: 73.85 });

  // FETCH LOGIC
  const fetchAvailableJobs = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${JOB_API}available/`, { headers: { Authorization: `Bearer ${token}` } });
      setAvailableJobs(res.data);
    } catch (err) { console.error("Fetch error"); }
  };

  const fetchClientJobs = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${JOB_API}my-jobs/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientJobs(res.data);
    } catch (err) { console.error("Failed to fetch client jobs"); }
  };

  // --- WORKER LOGIC: Fetch Active Job ---
  const fetchActiveJob = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${JOB_API}active/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // If no active job, backend returns { message: "No active job found" }
      // Check if ID exists to confirm it's a real job object
      if (res.data.id) {
        setActiveJob(res.data);
      } else {
        setActiveJob(null);
      }
    } catch (err) {
      console.error("Failed to fetch active job");
      setActiveJob(null);
    }
  };

  const [workHistory, setWorkHistory] = useState([]);

  // --- WORKER LOGIC: Fetch History ---
  const fetchWorkHistory = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${JOB_API}worker-history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch work history");
    }
  };

  // --- WORKER LOGIC: Fetch Reviews ---
  const fetchReviews = async () => {
    const token = localStorage.getItem('access_token');
    // We need the worker's ID. For now, let's assume the endpoint uses the logged-in user.
    // If your backend endpoint requires an ID, we might need to store user.id in state.
    // Let's try fetching from a new 'my-reviews' endpoint we will create.
    try {
      const res = await axios.get(`${JOB_API}reviews/my-reviews/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews");
    }
  };

  useEffect(() => {
    if (view === 'dashboard') {
      if (role === 'worker') {
        if (workerTab === 'jobs') fetchAvailableJobs();
        if (workerTab === 'active') fetchActiveJob(); // NEW: Fetch active job
        if (workerTab === 'history') fetchWorkHistory();
        if (workerTab === 'reviews') fetchReviews();
      }
      if (role === 'client') fetchClientJobs();
    }
  }, [view, role, workerTab]);

  // AUTH LOGIC
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}login/`, {
        username: formData.username,
        password: formData.password
      });
      localStorage.setItem('access_token', res.data.access);
      setUser({ username: formData.username });
      setView('dashboard');
    } catch (err) { setError("Login failed."); }
    finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      setLoading(true);
      const res = await axios.post(`${API_BASE}google-login/`, {
        email: googleUser.email,
        uid: googleUser.uid,
        displayName: googleUser.displayName,
        role: role // Comes from the selected state ('client' or 'worker')
      });

      if (res.data.needs_registration) {
        setFormData({
          ...formData,
          name: res.data.name || '',
          email: res.data.email || ''
        });
        setView('register');
        setError('');
        alert("Please complete the remaining details to finish your registration.");
        return;
      }

      localStorage.setItem('access_token', res.data.access);
      setUser({ username: res.data.user.username });
      setView('dashboard');
    } catch (err) {
      console.error(err);
      setError("Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- RESTORED REGISTRATION LOGIC ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}register/`, {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone_number: formData.phone_number,
        first_name: formData.name, // Maps "Name" input to Django "first_name"
        is_client: role === 'client',
        is_worker: role === 'worker'
      });
      alert("Registration successful! Please log in.");
      setView('login');
    } catch (err) {
      setError("Registration failed. Username might exist.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${JOB_API}create/`, jobData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Job Posted!");
      setShowJobForm(false);
      setActiveTab('bookings');
      fetchClientJobs();
    } catch (err) { alert("Failed."); }
  };

  const handleAcceptJob = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${JOB_API}${id}/accept/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Accepted!");
      setAvailableJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'accepted' } : job));
    } catch (err) { alert("Error."); }
  };

  const handleCompleteJob = async (jobId) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${JOB_API}${jobId}/complete/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Job marked as Completed!");
      fetchClientJobs();
    } catch (err) { alert("Error completing job."); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    console.log("Submitting Review for Job ID:", selectedJobId);

    try {
      await axios.post(`${JOB_API}reviews/create/`, {
        job: selectedJobId,
        rating: reviewData.rating,
        comment: reviewData.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Review Submitted Successfully!");
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      console.error("Review Error:", err.response);
      // Extract the specific error message from Django
      const errorMsg = err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || "Failed to submit review.";
      alert(`Error: ${errorMsg}`);
    }
  };


  // --- RENDER ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <nav className="bg-white border-b p-4 px-8 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">{t.serviceConnect}</h1>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['en', 'hi', 'mr'].map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs font-bold rounded-md uppercase ${lang === l ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase">{role}</span>
            <button onClick={() => { setView('landing'); localStorage.removeItem('access_token'); }} className="text-red-500 font-bold text-sm">{t.logout}</button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{t.welcome}, {user?.username}</h2>
              {role === 'client' && <button onClick={() => setShowJobForm(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg animate-pulse">{t.postJob}</button>}
            </div>

            {role === 'client' && (
              <>
                <div className="flex border-b border-gray-200 mb-6">
                  <button onClick={() => setActiveTab('services')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'services' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.services}</button>
                  <button onClick={() => setActiveTab('bookings')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'bookings' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.activeBookings}</button>
                </div>
                {activeTab === 'services' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center cursor-pointer"><div className="text-4xl mb-3">🧹</div><h4 className="font-bold text-gray-700">{t.maid}</h4></div>
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center cursor-pointer"><div className="text-4xl mb-3">🍳</div><h4 className="font-bold text-gray-700">{t.cook}</h4></div>
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-center cursor-pointer"><div className="text-4xl mb-3">🎉</div><h4 className="font-bold text-gray-700">{t.arranger}</h4></div>
                  </div>
                )}
                {activeTab === 'bookings' && (
                  <div className="space-y-4">
                    {clientJobs.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">You haven't posted any jobs yet.</p>
                      </div>
                    ) : (
                      clientJobs.map(job => (
                        <div key={job.id} className={`p-6 bg-white border-l-4 shadow-sm rounded-xl flex justify-between items-center ${job.status === 'completed' ? 'border-green-500' :
                            job.status === 'accepted' ? 'border-blue-500' :
                              'border-yellow-500'
                          }`}>
                          <div>
                            <h4 className="font-bold text-gray-800">{job.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  job.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {job.status}
                              </span>
                              <span className="text-xs text-gray-500 font-bold">
                                {Number(job.budget) === 0 ? "Negotiable" : `Budget: ₹${job.budget}`}
                              </span>
                            </div>

                            {/* NEW: Worker Details Display */}
                            {job.worker ? (
                              <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                <p className="font-bold text-gray-700">Worker Assigned:</p>
                                <p className="text-gray-600">Name: {job.worker_username || job.worker}</p>
                                {/* Display Worker Phone if available */}
                                <p className="text-indigo-600 font-bold">📞 {job.worker_phone || "Number hidden"}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1 italic">No worker assigned yet.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {job.status === 'accepted' && (
                              <button onClick={() => handleCompleteJob(job.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition">✓ {t.markCompleted}</button>
                            )}
                            {(job.status === 'accepted' || job.status === 'completed') ? (
                              <button onClick={() => { setSelectedJobId(job.id); setShowReviewForm(true); }} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-yellow-500 transition">★ {t.rateWorker}</button>
                            ) : (
                              <span className="text-xs font-bold text-gray-400 italic">{t.waiting}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {role === 'worker' && (
              <>
                <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                  <button onClick={() => setWorkerTab('jobs')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'jobs' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.jobMarketplace}</button>
                  <button onClick={() => setWorkerTab('active')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'active' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.activeWork}</button>
                  {/* NEW HISTORY TAB */}
                  <button onClick={() => setWorkerTab('history')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'history' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.workHistory}</button>
                  <button onClick={() => setWorkerTab('profile')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'profile' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.myDocuments}</button>
                  <button onClick={() => setWorkerTab('reviews')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'reviews' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.reviews}</button>
                </div>

                {/* (Keep 'jobs' and 'active' tabs as they were) */}

                {workerTab === 'jobs' && (
                  <div className="space-y-4">
                    {availableJobs.map(job => (
                      <div key={job.id} className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
                        <div><h4 className="text-xl font-bold text-gray-800">{job.title}</h4><p className="text-gray-500 text-sm">{job.description}</p></div>
                        <div className="text-right"><div className="text-right">
                          <p className="text-2xl font-black text-indigo-600">
                            {Number(job.budget) === 0 ? "Negotiable" : `₹${job.budget}`}
                          </p>
                          {/* ... buttons ... */}
                        </div>
                          <button onClick={() => handleAcceptJob(job.id)} className="mt-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700">{t.accept}</button>
                        </div>
                      </div>
                    ))}
                    {availableJobs.length === 0 && <p className="text-center text-gray-400 py-10">{t.scanning}</p>}
                  </div>
                )}

                {/* NEW: ACTIVE WORK TAB */}
                {workerTab === 'active' && (
                  <div className="space-y-4">
                    {!activeJob ? (
                      <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-gray-400 italic">You have no active jobs right now.</p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border-2 border-green-200 p-8 rounded-[2rem] shadow-lg">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="bg-green-200 text-green-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Active Now</span>
                            <h3 className="text-3xl font-bold text-gray-800 mt-3">{activeJob.title}</h3>
                            <p className="text-gray-600 mt-1">{activeJob.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-black text-green-600">
                              {Number(activeJob.budget) === 0 ? "Negotiable" : `₹${activeJob.budget}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-6 bg-white rounded-2xl shadow-sm">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location Map</h4>

                            {/* Embedded Google Map iframe */}
                            <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                              <iframe
                                title="Job Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${activeJob.latitude},${activeJob.longitude}&z=15&output=embed`}
                                allowFullScreen
                              ></iframe>
                            </div>

                            <p className="text-sm font-medium text-gray-800 mt-2">📍 {activeJob.address}</p>

                            {/* Keep the link as a backup option */}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${activeJob.latitude},${activeJob.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-bold text-xs mt-1 inline-block hover:underline"
                            >
                              Open in Google Maps App ↗
                            </a>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Client Details</h4>
                            <p className="text-lg font-medium text-gray-800">👤 {activeJob.client_username}</p>
                            <p className="text-lg font-bold text-indigo-600 mt-1">📞 {activeJob.client_phone || "No number provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NEW: WORK HISTORY TAB CONTENT */}
                {workerTab === 'history' && (
                  <div className="space-y-4">
                    {workHistory.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">You haven't completed any jobs yet.</p>
                      </div>
                    ) : (
                      workHistory.map(job => (
                        <div key={job.id} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-800">{job.title}</h4>
                            <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {job.status}
                            </span>
                          </div>

                          {/* RATE CLIENT BUTTON */}
                          {(job.status === 'completed') && (
                            <button
                              onClick={() => { setSelectedJobId(job.id); setShowReviewForm(true); }}
                              className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-yellow-500 transition"
                            >
                              ★ {t.rateClient}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {workerTab === 'profile' && <WorkerProfile lang={lang} />}


                {workerTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">No reviews yet.</p>
                      </div>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-400 text-xl">{'★'.repeat(review.rating)}</span>
                            <span className="ml-2 font-bold text-gray-700">{review.rating}.0</span>
                          </div>
                          <p className="text-gray-600 italic">"{review.comment}"</p>
                          <p className="text-xs text-gray-400 mt-2">- {review.reviewer_username}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {showJobForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-8">
              <h3 className="text-xl font-bold mb-4">{t.postJob}</h3>
              <form onSubmit={handlePostJob} className="space-y-4">
                <input placeholder="Title" className="w-full p-3 border rounded-xl" onChange={(e) => setJobData({ ...jobData, title: e.target.value })} />
                <textarea placeholder="Description" className="w-full p-3 border rounded-xl h-24" onChange={(e) => setJobData({ ...jobData, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2"><div className="relative">
                  <input
                    type="number"
                    placeholder="Budget (₹)"
                    className={`w-full p-4 bg-gray-50 rounded-2xl outline-none border transition ${jobData.budget === 0 ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'border-transparent focus:border-indigo-500'
                      }`}
                    disabled={jobData.budget === 0} // Disable if negotiable
                    onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
                    required={jobData.budget !== 0} // Not required if negotiable
                  />

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <input
                      type="checkbox"
                      id="negotiable"
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setJobData({ ...jobData, budget: 0 }); // 0 means Negotiable
                        } else {
                          setJobData({ ...jobData, budget: '' }); // Reset to allow typing
                        }
                      }}
                    />
                    <label htmlFor="negotiable" className="text-xs font-bold text-gray-500 cursor-pointer select-none">
                      Open for Bidding (Negotiable)
                    </label>
                  </div>
                </div>

                  <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-indigo-500 transition h-[58px]" onChange={(e) => setJobData({ ...jobData, service_type: e.target.value })}>
                    <option value="Maid">Maid</option>
                    <option value="Cook">Cook</option>
                    <option value="Arranger">Arranger</option>
                    <option value="Arranger">Other</option>
                  </select>
                </div>
                <div className="w-full">
                  {isLoaded ? (
                    <div className="space-y-3">
                      <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                        <input 
                          type="text" 
                          placeholder="Search Job Location..." 
                          value={jobData.address} 
                          onChange={e => setJobData({...jobData, address: e.target.value})} 
                          className="w-full p-3 border rounded-xl outline-none focus:border-indigo-500 transition"
                          onKeyDown={(e) => { e.key === 'Enter' && e.preventDefault(); }} 
                        />
                      </Autocomplete>
                      <div className="h-56 w-full rounded-xl overflow-hidden border border-gray-200">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={mapCenter}
                          zoom={14}
                          onClick={(e) => {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            setJobData(prev => ({...prev, latitude: lat, longitude: lng}));
                            setMapCenter({ lat, lng });
                          }}
                        >
                          <Marker position={{ lat: jobData.latitude, lng: jobData.longitude }} />
                        </GoogleMap>
                      </div>
                    </div>
                  ) : (
                    <input placeholder="Address" className="w-full p-3 border rounded-xl" onChange={(e) => setJobData({ ...jobData, address: e.target.value })} value={jobData.address} />
                  )}
                </div>
                <div className="flex gap-2"><button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold">Post</button><button type="button" onClick={() => setShowJobForm(false)} className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-xl font-bold">Cancel</button></div>
              </form>
            </div>
          </div>
        )}

        {showReviewForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{t.submitReview}</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div><label className="block text-sm font-bold text-gray-600 mb-2">{t.rating} (1-5)</label><input type="number" min="1" max="5" className="w-full p-3 border rounded-xl text-center text-xl font-bold" value={reviewData.rating} onChange={(e) => setReviewData({ ...reviewData, rating: e.target.value })} /></div>
                <div><label className="block text-sm font-bold text-gray-600 mb-2">{t.comment}</label><textarea className="w-full p-3 border rounded-xl h-24" placeholder="Share your experience..." onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })} /></div>
                <div className="flex gap-2"><button type="submit" className="flex-1 bg-yellow-400 text-yellow-900 p-3 rounded-xl font-bold shadow hover:bg-yellow-500">Submit</button><button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-xl font-bold">Cancel</button></div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
        {view === 'landing' ? (
          <>
            <h1 className="text-4xl font-black text-yellow-500 mb-8">{t.serviceConnect}</h1>
            <div className="flex justify-center gap-2 mb-8">{['en', 'hi', 'mr'].map((l) => (<button key={l} onClick={() => setLang(l)} className={`px-4 py-2 font-bold rounded-lg uppercase ${lang === l ? 'bg-yellow-100 text-black-700' : 'text-gray-400'}`}>{l}</button>))}</div>
            <button onClick={() => { setRole('client'); setView('login'); }} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-bold mb-4 shadow-xl hover:bg-yellow-300 transition transform hover:scale-105">{t.needservice}</button>
            <button onClick={() => { setRole('worker'); setView('login'); }} className="w-full py-4 bg-gray-800 text-white border-2 border-gray-700 rounded-2xl font-bold shadow-xl hover:bg-gray-700 transition transform hover:scale-105">{t.needjob}</button>
          </>
        ) : (
          <div>
            <button onClick={() => setView('landing')} className="text-yellow-600 font-bold text-sm mb-6 flex items-center gap-2 hover:text-yellow-700">← {t.back}</button>
            <h2 className="text-3xl font-bold text-gray-800 mb-1">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-xs font-black uppercase tracking-widest text-yellow-700 mb-8">{role} access</p>

            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input name="username" value={formData.username} placeholder={t.username} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                <input type="password" name="password" value={formData.password} placeholder={t.password} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-bold mt-4 shadow-lg hover:bg-yellow-300 transition">{loading ? "Wait..." : t.login}</button>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-300 animate-pulse"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-gray-300 animate-pulse"></div>
                </div>

                <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold shadow-md hover:bg-gray-50 transition transform hover:-translate-y-0.5">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
                <p className="text-center text-gray-500 mt-4 text-sm">Don't have an account? <button type="button" onClick={() => setView('register')} className="text-yellow-600 font-bold underline">Register</button></p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <input name="name" value={formData.name} placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <input name="username" value={formData.username} placeholder="Username" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                <input name="email" type="email" value={formData.email} placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <input name="phone_number" value={formData.phone_number} placeholder="Mobile Number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} required />
                <input type="password" name="password" value={formData.password} placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 transition" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-4 bg-yellow-500 text-black rounded-2xl font-bold shadow-lg mt-4">{loading ? "Wait..." : "Create Account"}</button>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-300 animate-pulse"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-gray-300 animate-pulse"></div>
                </div>

                <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold shadow-md hover:bg-gray-50 transition transform hover:-translate-y-0.5">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign up with Google
                </button>
                <p className="text-center text-gray-500 mt-4 text-sm">Already registered? <button type="button" onClick={() => setView('login')} className="text-yellow-600 font-bold underline">Login</button></p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}