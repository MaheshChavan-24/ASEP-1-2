import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import NearbyWorkers from './components/NearbyWorkers';

const libraries = ['places'];

// --- CONFIGURATION ---
const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API_BASE = `${BASE_URL}/api/users/`;
const JOB_API = `${BASE_URL}/api/jobs/`;
const PROFILE_API = `${BASE_URL}/api/profiles/`;

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
    logout: "Logout",
    browseByTrade: "Browse by Trade / Niche",
    tradeProfiles: "Trade Profiles",
    viewProfile: "View Profile",
    requestService: "Request Service",
    scheduleJob: "Schedule",
    sendRequest: "Send Request",
    myRequests: "My Requests",
    myTradeProfile: "My Trade Profile",
    createProfile: "Create Trade Profile",
    yearsExp: "Years Experience",
    skills: "Skills",
    availability: "Availability",
    toolsEquipment: "Tools & Equipment",
    languages: "Languages",
    experienceDesc: "Work Experience",
    noProfiles: "No worker profiles found in this category yet.",
    backToCategories: "← Back to Categories",
    serviceRequests: "Service Requests",
    incomingRequests: "Incoming Requests",
    rateWorker: "Rate Worker",
    rateClient: "Rate Client",
    submitReview: "Submit Review",
    rating: "Rating",
    comment: "Comment",
    waiting: "Waiting for a worker..."
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
    logout: "लॉग आउट",
    browseByTrade: "व्यापार के अनुसार ब्राउज़ करें",
    tradeProfiles: "व्यापार प्रोफ़ाइल",
    viewProfile: "प्रोफ़ाइल देखें",
    requestService: "सेवा अनुरोध",
    scheduleJob: "शेड्यूल",
    sendRequest: "अनुरोध भेजें",
    myRequests: "मेरे अनुरोध",
    myTradeProfile: "मेरी व्यापार प्रोफ़ाइल",
    createProfile: "व्यापार प्रोफ़ाइल बनाएं",
    yearsExp: "अनुभव वर्ष",
    skills: "कौशल",
    availability: "उपलब्धता",
    toolsEquipment: "उपकरण",
    languages: "भाषाएं",
    experienceDesc: "कार्य अनुभव",
    noProfiles: "इस श्रेणी में अभी कोई प्रोफ़ाइल नहीं है।",
    backToCategories: "← श्रेणियों पर वापस",
    serviceRequests: "सेवा अनुरोध",
    incomingRequests: "आने वाले अनुरोध",
    rateWorker: "कर्मचारी को रेट करें",
    rateClient: "ग्राहक को रेट करें",
    submitReview: "समीक्षा सबमिट करें",
    rating: "रेटिंग",
    comment: "टिप्पणी",
    waiting: "कर्मचारी की प्रतीक्षा..."
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
    logout: "बाहेर पडा",
    browseByTrade: "व्यवसायानुसार ब्राउझ करा",
    tradeProfiles: "व्यवसाय प्रोफाइल",
    viewProfile: "प्रोफाइल पहा",
    requestService: "सेवा विनंती",
    scheduleJob: "वेळापत्रक",
    sendRequest: "विनंती पाठवा",
    myRequests: "माझ्या विनंत्या",
    myTradeProfile: "माझी व्यवसाय प्रोफाइल",
    createProfile: "व्यवसाय प्रोफाइल तयार करा",
    yearsExp: "अनुभव वर्षे",
    skills: "कौशल्ये",
    availability: "उपलब्धता",
    toolsEquipment: "साधने",
    languages: "भाषा",
    experienceDesc: "कार्य अनुभव",
    noProfiles: "या श्रेणीत अद्याप कोणतीही प्रोफाइल नाही.",
    backToCategories: "← श्रेणींकडे परत",
    serviceRequests: "सेवा विनंत्या",
    incomingRequests: "येणाऱ्या विनंत्या",
    rateWorker: "कामगाराला रेट करा",
    rateClient: "ग्राहकाला रेट करा",
    submitReview: "समीक्षा सबमिट करा",
    rating: "रेटिंग",
    comment: "टिप्पणी",
    waiting: "कामगाराची वाट पाहत आहे..."
  }
};

// --- COMPONENT: WORKER PROFILE ---
function WorkerProfile({ lang, user, setUser, fetchCurrentUser }) {
  const t = translations[lang];
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('ID Proof');
  const [uploading, setUploading] = useState(false);

  // Bank Link fields
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [linking, setLinking] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  useEffect(() => { 
    fetchDocuments(); 
    if (fetchCurrentUser) fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleLinkBank = async (e) => {
    e.preventDefault();
    if (!bankName || !bankAcc || !bankIfsc) return alert("All fields are required.");
    setLinking(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(`${JOB_API}payout/`, {
        action: 'link',
        bank_name: bankName,
        bank_account_number: bankAcc,
        bank_ifsc: bankIfsc
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Bank account details saved successfully!");
      if (setUser) setUser(res.data.user);
      setShowLinkForm(false);
    } catch (err) {
      alert("Failed to link bank details.");
    } finally {
      setLinking(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.bank_account_number) {
      alert("Please link a bank account first.");
      setShowLinkForm(true);
      return;
    }
    if (Number(user?.wallet_balance) <= 0) return alert("Nothing to withdraw!");
    if (!window.confirm(`Request payout of ₹${user?.wallet_balance} to your bank account?`)) return;
    
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(`${JOB_API}payout/`, {
        action: 'withdraw'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || "Withdrawal successful!");
      if (setUser) setUser(res.data.user);
    } catch (err) {
      alert("Payout request failed.");
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Wallet Widget for Workers */}
      {user?.is_worker && (
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Digital Payout Wallet</p>
            <h3 className="text-4xl font-black mt-2">₹{Number(user?.wallet_balance || 0).toFixed(2)}</h3>
            <p className="text-indigo-100 text-xs mt-1 italic">Funds from completed jobs are instantly released here.</p>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {Number(user?.wallet_balance) > 0 ? (
              <button 
                onClick={handleWithdraw} 
                className="bg-yellow-400 text-yellow-950 font-bold px-6 py-3 rounded-2xl hover:bg-yellow-300 transition shadow-md whitespace-nowrap text-sm"
              >
                🏦 Withdraw to Linked Bank
              </button>
            ) : (
              <button 
                disabled 
                className="bg-indigo-800 text-indigo-400 cursor-not-allowed font-bold px-6 py-3 rounded-2xl whitespace-nowrap text-sm animate-pulse"
              >
                🔒 Wallet Empty
              </button>
            )}
            
            {user?.bank_account_number ? (
              <p className="text-[10px] text-center text-indigo-200 font-bold">
                Linked: {user.bank_name} (****{user.bank_account_number.slice(-4)})
              </p>
            ) : (
              <p className="text-[10px] text-center text-red-300 font-bold">
                ⚠️ Bank account not linked
              </p>
            )}
          </div>
        </div>
      )}

      {/* Linked Bank Account Settings */}
      {user?.is_worker && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-bold text-gray-800">Linked Bank Account</h3>
            {user?.bank_account_number && (
              <button 
                onClick={() => setShowLinkForm(!showLinkForm)} 
                className="text-xs text-indigo-600 font-bold underline"
              >
                {showLinkForm ? "Cancel" : "Change Bank Account"}
              </button>
            )}
          </div>

          {(!user?.bank_account_number || showLinkForm) ? (
            <form onSubmit={handleLinkBank} className="space-y-4 bg-indigo-50 p-6 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Bank Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. State Bank of India" 
                  value={bankName} 
                  onChange={e => setBankName(e.target.value)} 
                  required 
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter Account Number" 
                    value={bankAcc} 
                    onChange={e => setBankAcc(e.target.value)} 
                    required 
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SBIN0001234" 
                    value={bankIfsc} 
                    onChange={e => setBankIfsc(e.target.value)} 
                    required 
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={linking} 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {linking ? "Saving..." : "Link Bank Details"}
              </button>
            </form>
          ) : (
            <div className="bg-green-50/50 p-5 rounded-2xl flex items-center justify-between border border-green-100">
              <div>
                <p className="font-bold text-gray-800 text-sm">{user.bank_name}</p>
                <p className="text-gray-500 text-xs mt-0.5">Account Number: ****{user.bank_account_number.slice(-4)}</p>
                <p className="text-gray-500 text-xs">IFSC Code: {user.bank_ifsc}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">Linked</span>
            </div>
          )}
        </div>
      )}

      {/* Existing Documents Widget */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50">
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">{t.myDocuments}</h3>
        <form onSubmit={handleUpload} className="mb-8 p-6 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
          <div className="grid gap-4 mb-4">
            <label className="block text-sm font-bold text-gray-700">Document Type</label>
            <select className="p-3 rounded-xl border outline-none bg-white" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option>ID Proof (Aadhaar/Voter ID)</option>
              <option>Address Proof</option>
              <option>Skill Certificate</option>
            </select>
            <input type="file" className="p-2 bg-white rounded-xl border w-full" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <button type="submit" disabled={uploading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
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
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function App() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
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
  
  // Payment UI States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingJob, setPayingJob] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Review UI States
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviews, setReviews] = useState([]); // Store worker reviews
  const [availableJobs, setAvailableJobs] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);

  // --- TRADE BROWSING STATES ---
  const [tradeProfiles, setTradeProfiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTradeProfile, setSelectedTradeProfile] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState({ description: '', preferred_date: '', preferred_time_slot: '09:00 AM - 10:00 AM' });
  const [serviceRequests, setServiceRequests] = useState([]);
  const [workerTradeProfiles, setWorkerTradeProfiles] = useState([]);
  const [showTradeProfileForm, setShowTradeProfileForm] = useState(false);
  const [tradeProfileFormData, setTradeProfileFormData] = useState({
    display_name: '', trade_category: 'Plumbing', skills: '', experience_description: '',
    years_of_experience: 0, availability: '', tools_equipment: '', languages: ''
  });
  const [editingTradeProfileId, setEditingTradeProfileId] = useState(null);
  const [loadingTrade, setLoadingTrade] = useState(false);

  // FORM DATA (Now with 5 fields)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone_number: '',
    password: ''
  });
  const [jobData, setJobData] = useState({ title: '', description: '', service_type: 'Custom Bounty', budget: '', is_negotiable: false, urgency_level: 'Standard', address: '', latitude: 18.52, longitude: 73.85 });

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

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  // --- TRADE PROFILE & SERVICE REQUEST FETCH FUNCTIONS ---
  const fetchTradeProfilesByCategory = async (category) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoadingTrade(true);
    try {
      const res = await axios.get(`${PROFILE_API}trade-profiles/category/${encodeURIComponent(category)}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTradeProfiles(res.data);
    } catch (err) { console.error("Failed to fetch trade profiles"); }
    finally { setLoadingTrade(false); }
  };

  const fetchWorkerTradeProfiles = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${PROFILE_API}trade-profiles/mine/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkerTradeProfiles(res.data);
    } catch (err) { console.error("Failed to fetch worker trade profiles"); }
  };

  const fetchServiceRequests = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`${PROFILE_API}service-requests/mine/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceRequests(res.data);
    } catch (err) { console.error("Failed to fetch service requests"); }
  };

  const handleCreateTradeProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      if (editingTradeProfileId) {
        await axios.put(`${PROFILE_API}trade-profiles/${editingTradeProfileId}/`, tradeProfileFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Trade profile updated!");
      } else {
        await axios.post(`${PROFILE_API}trade-profiles/`, tradeProfileFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Trade profile created successfully!");
      }
      setShowTradeProfileForm(false);
      setEditingTradeProfileId(null);
      setTradeProfileFormData({
        display_name: '', trade_category: 'Plumbing', skills: '', experience_description: '',
        years_of_experience: 0, availability: '', tools_equipment: '', languages: ''
      });
      fetchWorkerTradeProfiles();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save trade profile.");
    }
  };

  const handleDeleteTradeProfile = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trade profile?")) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${PROFILE_API}trade-profiles/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Trade profile deleted.");
      fetchWorkerTradeProfiles();
    } catch (err) { alert("Failed to delete."); }
  };

  const handleSendServiceRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${PROFILE_API}service-requests/`, {
        trade_profile: selectedTradeProfile.id,
        description: requestFormData.description,
        preferred_date: requestFormData.preferred_date,
        preferred_time_slot: requestFormData.preferred_time_slot
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Service request sent successfully!");
      setShowRequestModal(false);
      setRequestFormData({ description: '', preferred_date: '', preferred_time_slot: '09:00 AM - 10:00 AM' });
      fetchServiceRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send request.");
    }
  };

  const handleUpdateServiceRequest = async (id, newStatus, notes = '') => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${PROFILE_API}service-requests/${id}/`, {
        status: newStatus,
        worker_notes: notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Request ${newStatus}!`);
      fetchServiceRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update request.");
    }
  };

  // Trade category icon mapping
  const tradeCategoryIcons = {
    'Plumbing': '🔧',
    'Carpentry': '🪚',
    'Electrical Work': '⚡',
    'Painting': '🎨',
    'Cleaning / Deep Clean': '🧹',
    'Appliance Repair': '🔩',
    'Gardening / Landscaping': '🌿',
    'Pest Control': '🐜',
    'Masonry / Tiling': '🧱',
    'AC & HVAC Servicing': '❄️',
    'Moving & Heavy Lifting': '📦',
    'Welding / Fabrication': '🔥',
    'Interior Design Consultation': '🏠',
    'Security & CCTV Installation': '📷',
    'Computer / IT Repair': '💻',
  };



  const timeSlots = [
    '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM'
  ];

  const handlePayJob = async (jobId, method) => {
    setPaymentProcessing(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(`${JOB_API}${jobId}/pay/`, { method }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (method === 'razorpay') {
        if (res.data.order_id) {
          // Dynamically load Razorpay SDK
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            const options = {
              key: res.data.key_id,
              amount: res.data.amount,
              currency: res.data.currency,
              name: "ServiceConnect Escrow",
              description: `Escrow payment for job: ${payingJob?.title || 'Service'}`,
              order_id: res.data.order_id,
              handler: async function (response) {
                // Verify payment on backend
                try {
                  await axios.post(`${JOB_API}${jobId}/verify-payment/`, {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  alert(`🎉 Payment successful! Escrow is secured.`);
                  setShowPaymentModal(false);
                  fetchClientJobs();
                  fetchCurrentUser();
                } catch (verifyErr) {
                  alert("Payment verification failed: " + (verifyErr.response?.data?.error || "Unknown Error"));
                }
              },
              prefill: {
                name: user?.username || "",
                email: user?.email || "",
                contact: user?.phone_number || ""
              },
              theme: {
                color: "#4f46e5"
              }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
              alert(`❌ Payment failed: ${response.error.description}`);
            });
            rzp.open();
            setPaymentProcessing(false);
          };
          script.onerror = () => {
            alert("Failed to load Razorpay SDK.");
            setPaymentProcessing(false);
          };
          document.body.appendChild(script);
        } else {
          alert("Failed to obtain Razorpay order.");
          setPaymentProcessing(false);
        }
      } else {
        alert("Payment simulated successfully! Escrow funded.");
        setShowPaymentModal(false);
        fetchClientJobs();
        fetchCurrentUser();
        setPaymentProcessing(false);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Payment failed.";
      alert(`Payment Failed: ${errorMsg}`);
      setPaymentProcessing(false);
    }
  };

  const handleRefundJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to cancel this job assignment and release/refund escrow?")) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.post(`${JOB_API}${jobId}/refund/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || "Job cancelled successfully.");
      if (role === 'client') fetchClientJobs();
      if (role === 'worker') {
        fetchActiveJob();
        fetchAvailableJobs();
      }
      fetchCurrentUser();
    } catch (err) {
      console.error(err);
      alert("Failed to process cancellation: " + (err.response?.data?.error || "Error"));
    }
  };



  useEffect(() => {
    if (view === 'dashboard') {
      fetchCurrentUser();
      if (role === 'worker') {
        if (workerTab === 'jobs') fetchAvailableJobs();
        if (workerTab === 'active') fetchActiveJob(); // NEW: Fetch active job
        if (workerTab === 'history') fetchWorkHistory();
        if (workerTab === 'reviews') fetchReviews();
        if (workerTab === 'trade') fetchWorkerTradeProfiles();
        if (workerTab === 'requests') fetchServiceRequests();
      }
      if (role === 'client') {
        fetchClientJobs();
        if (activeTab === 'reviews') fetchReviews();
        if (activeTab === 'services') fetchServiceRequests();
        if (activeTab === 'bookings') fetchServiceRequests();
      }
    }
  }, [view, role, workerTab, activeTab]);

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
      setUser(res.data.user); // Contains username, verification_status, rejection_reason
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
      setUser(res.data.user);
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
    if (!jobData.title || !jobData.description) return alert("Title and Description are required.");
    if (!jobData.is_negotiable && (!jobData.budget || isNaN(jobData.budget))) return alert("Please enter a valid budget or check Negotiable.");
    
    // --- Ethical Scanning Mechanism ---
    const UNETHICAL_KEYWORDS = {
      "illegal hacking": [
        "\\bdDoS\\b", "\\bhack into\\b", "\\bsteal data\\b", "\\bexploit vulnerability\\b", 
        "\\bsql injection\\b", "\\bmalware\\b", "\\bransomware\\b", "\\bphishing\\b"
      ],
      "academic dishonesty": [
        "\\bdo my homework\\b", "\\bwrite my essay\\b", "\\btake my exam\\b", 
        "\\bdo my assignment\\b", "\\bcheat on\\b", "\\bthesis writing service\\b"
      ],
      "fraud/scams": [
        "\\bponzi\\b", "\\bpyramid scheme\\b", "\\bmoney laundering\\b", 
        "\\bfake id\\b", "\\bstolen credit card\\b", "\\bcarding\\b"
      ],
      "harassment": [
        "\\bdox\\b", "\\bdoxxing\\b", "\\bcyberbully\\b", "\\btroll targeted\\b", 
        "\\bharass\\b", "\\bstalk\\b"
      ],
      "fake engagement/reviews": [
        "\\bfake review\\b", "\\bbot followers\\b", "\\bbuy likes\\b", 
        "\\bspam comments\\b", "\\bfake engagement\\b", "\\bmanipulate ratings\\b",
        "\\bfake reviews\\b"
      ],
      "counterfeit goods": [
        "\\bfake designer\\b", "\\bcounterfeit\\b", "\\bknockoff\\b", 
        "\\breplica watches\\b"
      ]
    };
    
    const combinedText = `${jobData.title} ${jobData.description}`;
    for (const [category, keywords] of Object.entries(UNETHICAL_KEYWORDS)) {
      for (const pattern of keywords) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(combinedText)) {
          const displayKeyword = pattern.replace(/\\b/g, '');
          alert(`[REJECTED] This bounty cannot be posted as it violates our ethical guidelines.\nReason: Triggered by keyword/phrase '${displayKeyword}' (Category: ${category}).`);
          return;
        }
      }
    }
    // ----------------------------------

    const finalJobData = { ...jobData };
    if (finalJobData.is_negotiable) finalJobData.budget = 0;

    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${JOB_API}create/`, finalJobData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Job Posted!");
      setShowJobForm(false);
      setActiveTab('bookings');
      fetchClientJobs();
    } catch (err) { 
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Failed.";
      alert(`Job Post Failed: ${errorMsg}`);
    }
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

  const handleWorkerCompleteJob = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${JOB_API}${id}/worker-complete/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Job marked as completed. Awaiting client approval!");
      fetchActiveJob();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error marking job complete.";
      alert(errorMsg);
    }
  };

  const handleDisputeJob = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${JOB_API}${id}/dispute/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Job has been disputed. Support will contact you.");
      fetchClientJobs();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error opening dispute.";
      alert(errorMsg);
    }
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
            <button 
              onClick={async () => {
                const token = localStorage.getItem('access_token');
                try {
                  const res = await axios.get(`${API_BASE}notifications/`, { headers: { Authorization: `Bearer ${token}` } });
                  const unread = res.data.filter(n => !n.is_read);
                  if (unread.length > 0) {
                    alert(`You have ${unread.length} new notifications:\n${unread.map(n => '- ' + n.message).join('\n')}`);
                    // Mark them as read
                    unread.forEach(n => axios.patch(`${API_BASE}notifications/${n.id}/read/`, {}, { headers: { Authorization: `Bearer ${token}` } }));
                  } else {
                    alert("No new notifications.");
                  }
                } catch (err) { console.error("Failed to fetch notifications"); }
              }}
              className="text-gray-600 font-bold hover:text-indigo-600"
            >
              🔔 Notifications
            </button>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase">{role}</span>
            <button onClick={() => { setView('landing'); localStorage.removeItem('access_token'); }} className="text-red-500 font-bold text-sm">{t.logout}</button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto p-6">
          {user?.verification_status === 'unsubmitted' && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-sm">
              <p className="font-bold">Verification Required</p>
              <p>Your account is unsubmitted. <button onClick={() => { setRole(user?.is_client ? 'client' : 'worker'); setWorkerTab('profile'); setActiveTab('profile'); }} className="underline font-bold">Please upload your documents</button> to post or accept jobs.</p>
            </div>
          )}
          {user?.verification_status === 'pending' && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-sm">
              <p className="font-bold">Verification Pending</p>
              <p>Your account is under verification. You'll be notified once approved.</p>
            </div>
          )}
          {user?.verification_status === 'rejected' && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
              <p className="font-bold">Verification Rejected</p>
              <p>Reason: {user?.rejection_reason}</p>
              <p><button onClick={() => { setRole(user?.is_client ? 'client' : 'worker'); setWorkerTab('profile'); setActiveTab('profile'); }} className="underline font-bold">Please re-upload your documents.</button></p>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{t.welcome}, {user?.username}</h2>
              {role === 'client' && (
                <button 
                  onClick={() => {
                    if (user?.verification_status !== 'verified') {
                      alert("Complete profile verification to post jobs.");
                      setActiveTab('profile');
                    } else {
                      setShowJobForm(true);
                    }
                  }} 
                  className={`px-6 py-3 rounded-2xl font-bold shadow-lg transition ${user?.verification_status === 'verified' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
                  {t.postJob}
                </button>
              )}
            </div>

            {role === 'client' && (
              <>
                <div className="flex border-b border-gray-200 mb-6">
                  <button onClick={() => setActiveTab('services')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'services' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.services}</button>
                  <button onClick={() => setActiveTab('bookings')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'bookings' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.activeBookings}</button>
                  <button onClick={() => setActiveTab('nearby')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'nearby' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>Nearby Workers</button>
                  <button onClick={() => setActiveTab('profile')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'profile' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.myDocuments}</button>
                  <button onClick={() => setActiveTab('reviews')} className={`py-2 px-4 font-bold border-b-2 transition ${activeTab === 'reviews' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-indigo-600'}`}>{t.reviews}</button>
                </div>
                {activeTab === 'services' && (
                  <div>
                    {/* Worker Profile Detail Modal */}
                    {selectedTradeProfile && !showRequestModal && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-2xl font-black text-gray-800">{selectedTradeProfile.display_name}</h3>
                              <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase mt-1 inline-block">{selectedTradeProfile.trade_category}</span>
                            </div>
                            <button onClick={() => setSelectedTradeProfile(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                          </div>

                          {selectedTradeProfile.average_rating > 0 && (
                            <div className="flex items-center gap-2 mb-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                              <span className="text-yellow-400 text-xl">★</span>
                              <span className="font-bold text-yellow-700 text-lg">{selectedTradeProfile.average_rating}</span>
                              <span className="text-xs text-gray-500">({selectedTradeProfile.review_count} reviews)</span>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.yearsExp}</p>
                              <p className="font-bold text-gray-800">{selectedTradeProfile.years_of_experience} years</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.skills}</p>
                              <p className="text-gray-700 whitespace-pre-line">{selectedTradeProfile.skills}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.experienceDesc}</p>
                              <p className="text-gray-700 whitespace-pre-line">{selectedTradeProfile.experience_description}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.availability}</p>
                              <p className="text-gray-700 whitespace-pre-line">{selectedTradeProfile.availability}</p>
                            </div>
                            {selectedTradeProfile.tools_equipment && (
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.toolsEquipment}</p>
                                <p className="text-gray-700 whitespace-pre-line">{selectedTradeProfile.tools_equipment}</p>
                              </div>
                            )}
                            {selectedTradeProfile.languages && (
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.languages}</p>
                                <p className="text-gray-700">{selectedTradeProfile.languages}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3 mt-8 pt-4 border-t">
                            <button
                              onClick={() => setShowRequestModal(true)}
                              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-0.5"
                            >
                              📩 {t.requestService}
                            </button>
                            <button
                              onClick={() => setSelectedTradeProfile(null)}
                              className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Request Modal */}
                    {showRequestModal && selectedTradeProfile && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-gray-100">
                          <h3 className="text-xl font-black text-gray-800 mb-2">{t.requestService}</h3>
                          <p className="text-sm text-gray-500 mb-6">
                            Sending request to <span className="font-bold text-indigo-600">{selectedTradeProfile.display_name}</span> for {selectedTradeProfile.trade_category}
                          </p>
                          <form onSubmit={handleSendServiceRequest} className="space-y-5">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Work Description</label>
                              <textarea
                                placeholder="Describe the work you need done..."
                                className="w-full p-4 bg-gray-50 rounded-2xl h-28 outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none border border-gray-200"
                                value={requestFormData.description}
                                onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Preferred Date</label>
                              <input
                                type="date"
                                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-200"
                                value={requestFormData.preferred_date}
                                onChange={(e) => setRequestFormData({ ...requestFormData, preferred_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Time Slot</label>
                              <div className="grid grid-cols-3 gap-2">
                                {timeSlots.map(slot => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setRequestFormData({ ...requestFormData, preferred_time_slot: slot })}
                                    className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition ${
                                      requestFormData.preferred_time_slot === slot
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                    }`}
                                  >
                                    {slot.split(' - ')[0]}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Selected: {requestFormData.preferred_time_slot}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition">
                                {t.sendRequest}
                              </button>
                              <button type="button" onClick={() => { setShowRequestModal(false); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Browse by Trade / Niche Section */}
                    <div>
                      {selectedCategory ? (
                        /* Category Detail — show worker profiles */
                        <div>
                          <button
                            onClick={() => { setSelectedCategory(null); setTradeProfiles([]); }}
                            className="text-indigo-600 font-bold text-sm mb-4 flex items-center gap-1 hover:text-indigo-700 transition"
                          >
                            {t.backToCategories}
                          </button>
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl">{tradeCategoryIcons[selectedCategory]}</span>
                            <h3 className="text-2xl font-black text-gray-800">{selectedCategory}</h3>
                          </div>

                          {loadingTrade ? (
                            <div className="p-10 text-center"><p className="text-gray-400 animate-pulse">Loading profiles...</p></div>
                          ) : tradeProfiles.length === 0 ? (
                            <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                              <p className="text-gray-400">{t.noProfiles}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {tradeProfiles.map(profile => (
                                <div key={profile.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl">
                                      {profile.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-800 text-lg">{profile.display_name}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-gray-500">{profile.years_of_experience} yrs exp</span>
                                        {profile.average_rating > 0 && (
                                          <span className="flex items-center gap-0.5 text-xs bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                            <span className="text-yellow-400">★</span>
                                            <span className="font-bold text-yellow-700">{profile.average_rating}</span>
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{profile.skills}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setSelectedTradeProfile(profile)}
                                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-indigo-700 transition"
                                  >
                                    {t.viewProfile}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Category Grid */
                        <div>
                          <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏷️</span> {t.browseByTrade}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.keys(tradeCategoryIcons).map(category => (
                              <button
                                key={category}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  fetchTradeProfilesByCategory(category);
                                }}
                                className="group p-5 bg-white rounded-2xl border border-gray-100 text-center hover:shadow-lg hover:border-indigo-200 transition-all duration-200 transform hover:-translate-y-1"
                              >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tradeCategoryIcons[category]}</div>
                                <h4 className="font-bold text-gray-700 text-xs leading-tight group-hover:text-indigo-600 transition-colors">{category}</h4>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'bookings' && (
                  <div>
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

                              {/* Escrow Status Badge */}
                              {job.escrow_status === 'pending' && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold animate-pulse">⏳ Escrow Pending</span>
                              )}
                              {job.escrow_status === 'held' && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">💸 Escrow Held</span>
                              )}
                              {job.escrow_status === 'released' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">✅ Paid</span>
                              )}
                              {job.escrow_status === 'refunded' && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">↩️ Refunded</span>
                              )}
                            </div>

                            {/* NEW: Worker Details Display */}
                            {job.worker ? (
                              <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                <p className="font-bold text-gray-700">Worker Assigned:</p>
                                <p className="text-gray-600">Name: {job.worker_username || job.worker}</p>
                                {/* Display Worker Phone only if escrow is held/paid */}
                                <p className="text-indigo-600 font-bold">
                                  📞 {job.escrow_status === 'held' || job.escrow_status === 'released' ? (job.worker_phone || "No phone listed") : "Contact locked until escrow funded"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1 italic">No worker assigned yet.</p>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            {job.status === 'accepted' && job.escrow_status === 'pending' && (
                              <div className="flex flex-col gap-2">
                                <button onClick={() => { setPayingJob(job); setShowPaymentModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition">💳 Fund Escrow</button>
                                <button onClick={() => handleRefundJob(job.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">Cancel Job</button>
                              </div>
                            )}

                            {(job.status === 'accepted' || job.status === 'worker_completed' || job.status === 'disputed') && job.escrow_status === 'held' && (
                              <div className="flex flex-col gap-2">
                                {job.status === 'disputed' ? (
                                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold mb-1 shadow-sm">
                                    🚨 Job is in dispute. Funds frozen pending admin review.
                                  </div>
                                ) : job.status === 'worker_completed' ? (
                                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold mb-1 shadow-sm">
                                    Worker marked this job as completed. Please approve or dispute.
                                  </div>
                                ) : null}
                                
                                {job.status !== 'disputed' && (
                                  <button onClick={() => handleCompleteJob(job.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition">✓ Approve & Release Payment</button>
                                )}

                                {job.status === 'worker_completed' && (
                                  <button onClick={() => handleDisputeJob(job.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">🚨 Report Issue / Dispute</button>
                                )}

                                {job.status === 'accepted' && (
                                  <button onClick={() => handleRefundJob(job.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">Cancel & Refund</button>
                                )}
                              </div>
                            )}

                            {(job.status === 'completed' || (job.status === 'accepted' && job.escrow_status === 'released')) && (
                              <button onClick={() => { setSelectedJobId(job.id); setShowReviewForm(true); }} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-yellow-500 transition">★ {t.rateWorker}</button>
                            )}

                            {job.status === 'pending' && (
                              <span className="text-xs font-bold text-gray-400 italic">{t.waiting}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Service Requests Section within Bookings */}
                  {serviceRequests.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📋</span> {t.myRequests}
                      </h3>
                      <div className="space-y-3">
                        {serviceRequests.map(req => (
                          <div key={req.id} className={`p-5 bg-white border-l-4 shadow-sm rounded-xl ${
                            req.status === 'completed' ? 'border-green-500' :
                            req.status === 'accepted' || req.status === 'scheduled' ? 'border-blue-500' :
                            req.status === 'rejected' ? 'border-red-500' :
                            'border-yellow-500'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800">{req.worker_display_name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{req.trade_category}</p>
                                <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">📅 {req.preferred_date}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">🕐 {req.preferred_time_slot}</span>
                                </div>
                                {req.worker_notes && (
                                  <p className="text-xs text-indigo-600 mt-2 italic">Worker notes: {req.worker_notes}</p>
                                )}
                              </div>
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                req.status === 'completed' ? 'bg-green-100 text-green-700' :
                                req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                req.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{req.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}
                {activeTab === 'profile' && <WorkerProfile lang={lang} user={user} setUser={setUser} fetchCurrentUser={fetchCurrentUser} />}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">No reviews yet.</p>
                      </div>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="p-6 bg-white border border-indigo-50 shadow-md rounded-2xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-xl">
                                {review.reviewer_username ? review.reviewer_username.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{review.reviewer_username}</p>
                                <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                              <span className="text-yellow-400 text-lg mr-1">★</span>
                              <span className="font-bold text-yellow-700">{review.rating}.0</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative mt-2">
                            <p className="text-gray-700 italic relative z-10">{review.comment || "No comment provided."}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === 'nearby' && (
                  <NearbyWorkers />
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
                  <button onClick={() => setWorkerTab('trade')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'trade' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.myTradeProfile}</button>
                  <button onClick={() => setWorkerTab('requests')} className={`py-2 px-4 font-bold border-b-2 whitespace-nowrap transition ${workerTab === 'requests' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'}`}>{t.serviceRequests}</button>
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
                          <button 
                            onClick={() => {
                              if (user?.verification_status !== 'verified') {
                                alert("Complete profile verification to accept jobs.");
                                setWorkerTab('profile');
                              } else {
                                handleAcceptJob(job.id);
                              }
                            }} 
                            className={`mt-2 px-5 py-2 rounded-xl text-sm font-bold shadow-md ${user?.verification_status === 'verified' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                          >
                            {t.accept}
                          </button>
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
                      <div className={`border-2 p-8 rounded-[2rem] shadow-lg ${
                        activeJob.escrow_status === 'pending' ? 'bg-amber-50/50 border-amber-200' : 'bg-green-50 border-2 border-green-200'
                      }`}>
                        
                        {/* Escrow Status Banners */}
                        {activeJob.escrow_status === 'pending' ? (
                          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">⚠️</span>
                              <div>
                                <p className="font-bold text-amber-800 text-sm">WAITING FOR CLIENT PAYMENT</p>
                                <p className="text-amber-700 text-xs mt-0.5">The client has not funded the escrow yet. Do NOT begin work until funds are secured!</p>
                              </div>
                            </div>
                            <button onClick={() => handleRefundJob(activeJob.id)} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200 transition">Cancel Assignment</button>
                          </div>
                        ) : activeJob.status === 'disputed' ? (
                          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">🚨</span>
                              <div>
                                <p className="font-bold text-red-800 text-sm">COMPLETION DISPUTED BY CLIENT</p>
                                <p className="text-red-700 text-xs mt-0.5">The client rejected your completion claim. Escrow funds are frozen pending administrative review.</p>
                              </div>
                            </div>
                          </div>
                        ) : activeJob.status === 'worker_completed' ? (
                          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">✅</span>
                              <div>
                                <p className="font-bold text-blue-800 text-sm">WAITING FOR CLIENT APPROVAL</p>
                                <p className="text-blue-700 text-xs mt-0.5">You marked this work as complete. Once the client approves, the escrow funds will be released to you.</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">🛡️</span>
                              <div>
                                <p className="font-bold text-green-800 text-sm">ESCROW FUNDS SECURED</p>
                                <p className="text-green-700 text-xs mt-0.5">₹{activeJob.budget} is held securely in escrow. You are fully protected. Begin working!</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleWorkerCompleteJob(activeJob.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 shadow transition">✅ Mark Work Complete</button>
                              <button onClick={() => handleRefundJob(activeJob.id)} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition">Withdraw & Refund</button>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              activeJob.escrow_status === 'pending' ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'
                            }`}>{activeJob.escrow_status === 'pending' ? 'Awaiting Payment' : 'Active Now'}</span>
                            <h3 className="text-3xl font-bold text-gray-800 mt-3">{activeJob.title}</h3>
                            <p className="text-gray-600 mt-1">{activeJob.description}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-4xl font-black ${
                              activeJob.escrow_status === 'pending' ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {Number(activeJob.budget) === 0 ? "Negotiable" : `₹${activeJob.budget}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-6 bg-white rounded-2xl shadow-sm">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location Map</h4>

                            {/* Embedded Google Map iframe with blur lock */}
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                              <iframe
                                title="Job Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${activeJob.latitude},${activeJob.longitude}&z=15&output=embed`}
                                allowFullScreen
                                className={activeJob.escrow_status === 'pending' ? 'blur-md pointer-events-none' : ''}
                              ></iframe>
                              
                              {activeJob.escrow_status === 'pending' && (
                                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col justify-center items-center text-center p-4">
                                  <span className="text-2xl">🔒</span>
                                  <p className="text-white font-bold text-xs mt-2">Map navigation is locked until client funds the escrow</p>
                                </div>
                              )}
                            </div>

                            <p className="text-sm font-medium text-gray-800 mt-2">
                              📍 {activeJob.escrow_status === 'pending' ? "[Address locked until escrow payment]" : activeJob.address}
                            </p>

                            {/* Back up option link */}
                            {activeJob.escrow_status !== 'pending' && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${activeJob.latitude},${activeJob.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 font-bold text-xs mt-1 inline-block hover:underline"
                              >
                                Open in Google Maps App ↗
                              </a>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Client Details</h4>
                            <p className="text-lg font-medium text-gray-800">👤 {activeJob.client_username}</p>
                            
                            {activeJob.escrow_status === 'pending' ? (
                              <p className="text-xs font-bold text-red-500 mt-2">📞 Contact hidden until client makes payment</p>
                            ) : (
                              <p className="text-lg font-bold text-indigo-600 mt-1">📞 {activeJob.client_phone || "No phone listed"}</p>
                            )}
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

                {workerTab === 'profile' && <WorkerProfile lang={lang} user={user} setUser={setUser} fetchCurrentUser={fetchCurrentUser} />}

                {/* TRADE PROFILE TAB */}
                {workerTab === 'trade' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">{t.myTradeProfile}</h3>
                      <button
                        onClick={() => {
                          if (user?.verification_status !== 'verified') {
                            alert("Complete profile verification first.");
                            setWorkerTab('profile');
                            return;
                          }
                          setShowTradeProfileForm(true);
                          setEditingTradeProfileId(null);
                          setTradeProfileFormData({
                            display_name: '', trade_category: 'Plumbing', skills: '', experience_description: '',
                            years_of_experience: 0, availability: '', tools_equipment: '', languages: ''
                          });
                        }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-indigo-700 transition"
                      >
                        + {t.createProfile}
                      </button>
                    </div>

                    {/* Trade Profile Form Modal */}
                    {showTradeProfileForm && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                          <h3 className="text-xl font-black text-gray-800 mb-6">{editingTradeProfileId ? 'Edit' : 'Create'} Trade Profile</h3>
                          <form onSubmit={handleCreateTradeProfile} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Display Name</label>
                              <input
                                type="text" placeholder="Your public display name (no phone/private info)"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={tradeProfileFormData.display_name}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, display_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Trade Category</label>
                              <select
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"
                                value={tradeProfileFormData.trade_category}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, trade_category: e.target.value })}
                                disabled={!!editingTradeProfileId}
                              >
                                {Object.keys(tradeCategoryIcons).map(cat => (
                                  <option key={cat} value={cat}>{tradeCategoryIcons[cat]} {cat}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Skills & Specializations</label>
                              <textarea
                                placeholder="e.g., Pipe fitting, Leak detection, Drain unclogging..."
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none h-20 resize-none text-sm"
                                value={tradeProfileFormData.skills}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, skills: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Past Work Experience</label>
                              <textarea
                                placeholder="Describe your past work experience..."
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none h-24 resize-none text-sm"
                                value={tradeProfileFormData.experience_description}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, experience_description: e.target.value })}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Years of Experience</label>
                                <input
                                  type="number" min="0" max="50"
                                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"
                                  value={tradeProfileFormData.years_of_experience}
                                  onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, years_of_experience: parseInt(e.target.value) || 0 })}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Languages Spoken</label>
                                <input
                                  type="text" placeholder="e.g., Hindi, English, Marathi"
                                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"
                                  value={tradeProfileFormData.languages}
                                  onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, languages: e.target.value })}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Availability</label>
                              <textarea
                                placeholder="e.g., Mon-Fri 9AM-5PM, Weekends by appointment..."
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none h-16 resize-none text-sm"
                                value={tradeProfileFormData.availability}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, availability: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tools & Equipment Owned</label>
                              <textarea
                                placeholder="e.g., Wrench set, Plumbing snake, Solder kit..."
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none h-16 resize-none text-sm"
                                value={tradeProfileFormData.tools_equipment}
                                onChange={e => setTradeProfileFormData({ ...tradeProfileFormData, tools_equipment: e.target.value })}
                              />
                            </div>
                            <div className="flex gap-3 pt-4 border-t mt-4">
                              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow hover:bg-indigo-700 transition">
                                {editingTradeProfileId ? 'Update Profile' : 'Create Profile'}
                              </button>
                              <button type="button" onClick={() => setShowTradeProfileForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Existing Trade Profiles */}
                    {workerTradeProfiles.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">You haven't created any trade profiles yet.</p>
                        <p className="text-xs text-gray-300 mt-1">Create a profile to be visible to clients in specific trade categories.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workerTradeProfiles.map(profile => (
                          <div key={profile.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{tradeCategoryIcons[profile.trade_category] || '🔧'}</span>
                                <div>
                                  <h4 className="font-bold text-gray-800 text-lg">{profile.display_name}</h4>
                                  <p className="text-xs text-gray-500">{profile.trade_category} · {profile.years_of_experience} yrs</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>
                                  {profile.is_active ? 'Live' : 'Draft'}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingTradeProfileId(profile.id);
                                    setTradeProfileFormData({
                                      display_name: profile.display_name,
                                      trade_category: profile.trade_category,
                                      skills: profile.skills,
                                      experience_description: profile.experience_description,
                                      years_of_experience: profile.years_of_experience,
                                      availability: profile.availability,
                                      tools_equipment: profile.tools_equipment,
                                      languages: profile.languages
                                    });
                                    setShowTradeProfileForm(true);
                                  }}
                                  className="text-xs text-indigo-600 font-bold underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTradeProfile(profile.id)}
                                  className="text-xs text-red-500 font-bold underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-600">
                              <p><strong>Skills:</strong> {profile.skills}</p>
                              <p className="mt-1"><strong>Availability:</strong> {profile.availability}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SERVICE REQUESTS TAB (WORKER) */}
                {workerTab === 'requests' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">{t.incomingRequests}</h3>
                    {serviceRequests.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">No service requests yet.</p>
                      </div>
                    ) : (
                      serviceRequests.map(req => (
                        <div key={req.id} className={`p-6 bg-white border-l-4 shadow-sm rounded-xl ${
                          req.status === 'completed' ? 'border-green-500' :
                          req.status === 'accepted' || req.status === 'scheduled' ? 'border-blue-500' :
                          req.status === 'rejected' ? 'border-red-500' :
                          'border-yellow-500'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800">From: {req.client_username}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{req.trade_category}</p>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              req.status === 'completed' ? 'bg-green-100 text-green-700' :
                              req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                              req.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-sm text-gray-600">{req.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">📅 {req.preferred_date}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">🕐 {req.preferred_time_slot}</span>
                          </div>

                          {/* Action Buttons */}
                          {req.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleUpdateServiceRequest(req.id, 'accepted')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition"
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => {
                                  const notes = prompt("Optional: Add notes or counter-proposal for the client:");
                                  handleUpdateServiceRequest(req.id, 'rejected', notes || '');
                                }}
                                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition"
                              >
                                ✕ Decline
                              </button>
                            </div>
                          )}
                          {req.status === 'accepted' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleUpdateServiceRequest(req.id, 'scheduled')}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-purple-700 transition"
                              >
                                📆 Confirm Schedule
                              </button>
                              <button
                                onClick={() => handleUpdateServiceRequest(req.id, 'completed')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition"
                              >
                                ✅ Mark Complete
                              </button>
                            </div>
                          )}
                          {req.status === 'scheduled' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleUpdateServiceRequest(req.id, 'completed')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition"
                              >
                                ✅ Mark Complete
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}


                {workerTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-400">No reviews yet.</p>
                      </div>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="p-6 bg-white border border-indigo-50 shadow-md rounded-2xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-xl">
                                {review.reviewer_username ? review.reviewer_username.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{review.reviewer_username}</p>
                                <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                              <span className="text-yellow-400 text-lg mr-1">★</span>
                              <span className="font-bold text-yellow-700">{review.rating}.0</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative mt-2">
                            <p className="text-gray-700 italic relative z-10">{review.comment || "No comment provided."}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {showPaymentModal && payingJob && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-gray-800">Secure Escrow Payment</h3>
              <p className="text-gray-500 text-sm mb-6">Fund the budget of <span className="font-extrabold text-indigo-600">₹{payingJob.budget}</span> for your job "<span className="font-semibold text-gray-700">{payingJob.title}</span>". Money is held securely by the platform.</p>
              
              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={() => handlePayJob(payingJob.id, 'simulated')}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span className="text-lg">⚡</span>
                  {paymentProcessing ? "Processing..." : "Simulate Instant Payment"}
                </button>
                
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={() => handlePayJob(payingJob.id, 'razorpay')}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💳</span>
                  {paymentProcessing ? "Opening Razorpay..." : "Pay securely with Razorpay"}
                </button>
              </div>
              
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showJobForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-8">
              <h3 className="text-xl font-bold mb-4">{t.postJob}</h3>
              <form onSubmit={handlePostJob} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Bounty Title</label>
                  <input placeholder="e.g., Fix plumbing issue, Move furniture, etc." className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" onChange={(e) => setJobData({ ...jobData, title: e.target.value })} required />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Task Description</label>
                  <textarea placeholder="Describe what exactly needs to be done..." className="w-full p-4 bg-gray-50 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none" onChange={(e) => setJobData({ ...jobData, description: e.target.value })} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Input & Toggle */}
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Budget</label>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={jobData.is_negotiable} onChange={(e) => setJobData({ ...jobData, is_negotiable: e.target.checked })} />
                          <div className={`block w-10 h-6 rounded-full transition ${jobData.is_negotiable ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${jobData.is_negotiable ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-2 text-xs font-bold text-indigo-700">Negotiable</span>
                      </label>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className={`w-full p-4 pl-10 bg-white rounded-xl outline-none border transition ${jobData.is_negotiable ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-transparent focus:border-indigo-500 shadow-sm'}`}
                        disabled={jobData.is_negotiable}
                        value={jobData.budget}
                        onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
                        required={!jobData.is_negotiable}
                      />
                    </div>
                  </div>

                  {/* Urgency Selector */}
                  <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                    <label className="block text-sm font-bold text-orange-900 uppercase tracking-widest mb-4">Urgency Level</label>
                    <div className="flex gap-2 bg-white p-1 rounded-xl shadow-inner">
                      <button 
                        type="button" 
                        onClick={() => setJobData({ ...jobData, urgency_level: 'Standard' })}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${jobData.urgency_level === 'Standard' ? 'bg-orange-100 text-orange-800 shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        Standard
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJobData({ ...jobData, urgency_level: 'Emergency' })} 
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${jobData.urgency_level === 'Emergency' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        🚨 Emergency
                      </button>
                    </div>
                  </div>
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
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 text-lg">🚀 Post Bounty</button>
                  <button type="button" onClick={() => setShowJobForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-300 transition text-lg">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showReviewForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-gray-100">
              <h3 className="text-2xl font-black mb-6 text-gray-800 text-center">{t.submitReview}</h3>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">{t.rating}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className={`text-4xl transition-transform transform hover:scale-110 focus:outline-none ${reviewData.rating >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-yellow-600 mt-2 bg-yellow-50 px-3 py-1 rounded-full">
                    {reviewData.rating} out of 5 stars
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t.comment}</label>
                  <textarea 
                    className="w-full p-4 border border-gray-200 bg-gray-50 rounded-2xl h-32 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none resize-none" 
                    placeholder="Share your experience working with them..." 
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })} 
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 hover:shadow-xl transition transform hover:-translate-y-0.5">Submit</button>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
                </div>
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