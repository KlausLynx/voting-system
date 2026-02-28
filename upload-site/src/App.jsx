import {useState, useEffect} from 'react';
import './index.css'
import {useForm} from 'react-hook-form';
import { SERVER_CONFIG } from './config';
import AuthGate from './AuthGate';

function LockedScreen({ centerData, submissionData }) {
   return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-10 border-4 border-red-400 shadow-2xl">
        
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="text-9xl mb-4 animate-bounce">🔒</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Device Locked
          </h1>
          <p className="text-2xl text-green-400 font-semibold flex items-center justify-center gap-3">
            <span className="text-3xl">✅</span>
            Votes submitted successfully!
          </p>
        </div>
        
        {/* Submission Details */}
        <div className="bg-white/5 rounded-2xl p-8 mb-8 border-2 border-purple-400">
          <h3 className="text-2xl font-bold text-purple-300 mb-6 text-center">
            📋 Submission Details
          </h3>
          
          {/* Detail Rows */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center bg-blue-500/20 rounded-xl p-4 border border-blue-400">
              <strong className="text-blue-300 text-lg">Center:</strong>
              <span className="text-white font-semibold text-lg">{centerData.centerName}</span>
            </div>
            
            <div className="flex justify-between items-center bg-green-500/20 rounded-xl p-4 border border-green-400">
              <strong className="text-green-300 text-lg">Code:</strong>
              <span className="text-white font-semibold text-lg">{centerData.centerCode}</span>
            </div>
            
            <div className="flex justify-between items-center bg-purple-500/20 rounded-xl p-4 border border-purple-400">
              <strong className="text-purple-300 text-lg">Officer:</strong>
              <span className="text-white font-semibold text-lg">{centerData.officerName}</span>
            </div>
            
            <div className="flex justify-between items-center bg-pink-500/20 rounded-xl p-4 border border-pink-400">
              <strong className="text-pink-300 text-lg">Time:</strong>
              <span className="text-white font-semibold text-lg">{new Date().toLocaleString()}</span>
            </div>
          </div>
          
          {/* Votes Submitted */}
          <h4 className="text-xl font-bold text-yellow-300 mb-4 text-center">
            🗳️ Votes Submitted:
          </h4>
          <div className="space-y-3">
            {submissionData.results.map((result, index) => {
              const colors = ['blue', 'green', 'purple'];
              const color = colors[index % 3];
              
              return (
                <div 
                  key={index} 
                  className={`flex justify-between items-center bg-${color}-500/30 rounded-xl p-4 border-2 border-${color}-400`}
                >
                  <span className={`text-${color}-300 font-bold text-lg`}>
                    {result.party}
                  </span>
                  <strong className="text-white text-2xl">
                    {result.votes.toLocaleString()} votes
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Warning Box */}
        <div className="bg-red-500/20 rounded-2xl p-6 border-2 border-red-400">
          <div className="text-center space-y-3">
            <p className="text-red-300 text-xl font-bold flex items-center justify-center gap-2">
              <span className="text-3xl">⚠️</span>
              This device is now locked
            </p>
            <p className="text-red-200 text-lg">
              No further submissions are allowed
            </p>
            <p className="text-red-200 text-base">
              Contact system administrator to reset if needed
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function RegistrationPage({ onComplete }) {
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [formData, setFormData] = useState({
    officerName: '',
    phoneNumber: '',
    nin: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCenters = async () => {
    try {
      const serverUrl = await SERVER_CONFIG.getServerUrl();
      console.log('Fetching from:', serverUrl);
      
      const response = await fetch(`${serverUrl}/get-centers`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      setCenters(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching centers:', error);
      alert('Could not load centers from server');
      setLoading(false);
    }
  };
  
  fetchCenters();
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate center selected
  if (!selectedCenter) {
    alert('Please select a center');
    return;
  }
  
  // Validate all fields filled
  if (!formData.officerName || !formData.phoneNumber || !formData.nin || !formData.address) {
    alert('Please fill all fields');
    return;
  }
  
  // Check if we're in a secure context (HTTPS or localhost)
  const isSecureContext = window.isSecureContext;
  let biometricData = null;
  
  if (isSecureContext) {
    // Online mode - require biometric
    biometricData = await setupBiometric();
    
    if (!biometricData) {
      alert('Biometric setup failed. Please try again.');
      return;
    }
  } else {
    // Offline mode - ask if they want to skip biometric
    const skipBiometric = confirm(
      '⚠️ Biometric authentication is not available on this network.\n\n' +
      'This usually happens when accessing via local IP address.\n\n' +
      'Do you want to continue WITHOUT biometric authentication?\n\n' +
      '(Only for offline/local network use)'
    );
    
    if (!skipBiometric) {
      alert('Registration cancelled. Biometric authentication is required.');
      return;
    }
    
    // User confirmed to skip biometric
    console.log('⚠️ Skipping biometric for offline mode');
  }
  
  // Combine all data
  const completeData = {
    centerCode: selectedCenter.code,
    centerName: selectedCenter.name,
    centerLocation: selectedCenter.location,
    ...formData,
    biometricCredential: biometricData?.credential || null,
    biometricId: biometricData?.credentialId || 'offline-skip',
    biometricVerified: !!biometricData
  };
  
  // Pass to parent
  onComplete(completeData);
};


const setupBiometric = async () => {
  try {
    // Check if browser supports WebAuthn
    if (!window.PublicKeyCredential) {
      // Fallback to PIN if WebAuthn not supported
      return await setupPinFallback();
    }
    
    // Check if device has platform authenticator
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (!available) {
      // No biometric available, use PIN fallback
      alert('No biometric device found. Using PIN authentication instead.');
      return await setupPinFallback();
    }
    
    const publicKey = {
      challenge: new Uint8Array(32),
      rp: {
        name: "Voting System",
        id: "localhost"  // Add this line!
      },
      user: {
        id: new Uint8Array(16),
        name: formData.officerName || 'officer',
        displayName: formData.officerName || 'Officer',
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" }  // Add this for better compatibility
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "required"  // Changed from "preferred" to "required"
      },
      timeout: 60000,
    };
    
    window.crypto.getRandomValues(publicKey.challenge);
    window.crypto.getRandomValues(publicKey.user.id);
    
    const credential = await navigator.credentials.create({ publicKey });
    
    if (!credential) {
      return await setupPinFallback();
    }
    
    const credentialIdArray = new Uint8Array(credential.rawId);
    const credentialIdString = Array.from(credentialIdArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem('auth-type', 'biometric');
    localStorage.setItem('biometric-id', credentialIdString);
    localStorage.setItem('officer-name', formData.officerName);
    
    alert('✅ Biometric registered successfully!');
    
    return {
      credential: credential,
      credentialId: credentialIdString,
      type: 'biometric'
    };
    
  } catch (error) {
    console.error('Biometric setup error:', error);
    
    // If biometric fails, offer PIN fallback
    const useFallback = confirm('Biometric setup failed. Would you like to use PIN authentication instead?');
    
    if (useFallback) {
      return await setupPinFallback();
    }
    
    return null;
  }
};

// PIN Fallback Authentication
const setupPinFallback = async () => {
  const pin = prompt('Create a 6-digit PIN for authentication:');
  
  if (!pin) {
    alert('PIN creation cancelled');
    return null;
  }
  
  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    alert('PIN must be exactly 6 digits');
    return null;
  }
  
  const confirmPin = prompt('Confirm your PIN:');
  
  if (pin !== confirmPin) {
    alert('PINs do not match');
    return null;
  }
  
  // Hash the PIN (simple hash for demo - use better hashing in production)
  const pinHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(pin + formData.officerName)
  );
  
  const pinHashString = Array.from(new Uint8Array(pinHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  localStorage.setItem('auth-type', 'pin');
  localStorage.setItem('pin-hash', pinHashString);
  localStorage.setItem('officer-name', formData.officerName);
  
  alert('✅ PIN registered successfully!');
  
  return {
    credential: null,
    credentialId: pinHashString,
    type: 'pin'
  };
};


  if (loading) {
    return <div>Loading centers...</div>;
  }

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-8">
    <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-10 border-4 border-blue-400 shadow-2xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">📋  Voting System <br /> Registration Site</h1>
        
        <p className="text-blue-300 text-lg">
          Register your center to begin vote submission
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Center Selection Dropdown */}
        <div>
          <label className="block text-white text-lg font-semibold mb-3">
            Select Your Center:
          </label>
          <select 
            value={selectedCenter ? selectedCenter.id : ''}
            onChange={(e) => {
              const center = centers.find(c => c.id === e.target.value);
              setSelectedCenter(center);
            }}
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-blue-400 rounded-xl px-6 py-4 text-white text-lg focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/50 transition-all"
          >
            <option value="" className="bg-gray-800">-- Choose Center --</option>
            {centers.map(center => (
              <option key={center.id} value={center.id} className="bg-gray-800">
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show selected center details */}
        {selectedCenter && (
          <div className="bg-green-500/20 border-2 border-green-400 rounded-2xl p-6 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center">
              <strong className="text-green-300 text-lg">Code:</strong>
              <span className="text-white font-semibold text-lg">{selectedCenter.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <strong className="text-green-300 text-lg">Location:</strong>
              <span className="text-white font-semibold text-lg">{selectedCenter.location}</span>
            </div>
          </div>
        )}

        {/* Officer Name */}
        <div>
          <label className="block text-white text-lg font-semibold mb-3">
            Officer Name:
          </label>
          <input
            type="text"
            value={formData.officerName}
            onChange={(e) => setFormData({...formData, officerName: e.target.value})}
            placeholder="Full name"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-purple-400 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-300 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/50 transition-all"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-white text-lg font-semibold mb-3">
            Phone Number:
          </label>
          <input
            type="number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            placeholder="08012345678"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-green-400 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-300 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-400/50 transition-all"
          />
        </div>

        {/* NIN */}
        <div>
          <label className="block text-white text-lg font-semibold mb-3">
            NIN (National ID):
          </label>
          <input
            type="number"
            value={formData.nin}
            onChange={(e) => setFormData({...formData, nin: e.target.value})}
            placeholder="12345678901"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-blue-400 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-300 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/50 transition-all"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-white text-lg font-semibold mb-3">
            Address:
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            placeholder="Full address"
            rows="3"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-purple-400 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-300 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/50 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white text-xl font-bold py-5 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex items-center justify-center gap-3"
        >
          Continue to Upload Form
          <span className="text-2xl">→</span>
        </button>
      </form>
      
    </div>
  </div>
);
}

function UploadForm({centerData, onSubmit}) {
  const {register, handleSubmit, formState: { errors }} = useForm();

  const onFormSubmit = async (data) => {
  // Format the data for server
  const voteData = {
    centerCode: centerData.centerCode,
    results: [
      { party: "Amuneke Party", votes: parseInt(data.amunekeVotes) },
      { party: "WayForward Party", votes: parseInt(data.wayforwardVotes) },
      { party: "I Must Win", votes: parseInt(data.imustwinVotes) }
    ],
    officer: {
      name: centerData.officerName,
      phone: centerData.phoneNumber,
      nin: centerData.nin,
      address: centerData.address
    }
  };

  try {
    // Auto-detect server
    const serverUrl = await SERVER_CONFIG.getServerUrl();
    
    // Send to server
   const response = await fetch(`${serverUrl}/submit-vote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  body: JSON.stringify(voteData)
});

    const result = await response.json();

    if (response.ok) {
      alert('✅ Votes submitted successfully!');
      onSubmit(voteData);
    } else {
      alert('❌ Error: ' + result.error);
    }
  } catch (error) {
    alert('❌ Could not connect to server. Please check connection.');
    console.error('Submission error:', error);
  }
};  

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-8">
    <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-10 border-4 border-green-400 shadow-2xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bold text-white mb-4">
          📊 Submit Vote Counts
        </h2>
        <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4 mb-2">
          <p className="text-blue-300 text-lg">
            <strong>Center:</strong> <span className="text-white font-semibold">{centerData.centerCode}</span>
          </p>
        </div>
        <div className="bg-purple-500/20 border-2 border-purple-400 rounded-xl p-4">
          <p className="text-purple-300 text-lg">
            <strong>Officer:</strong> <span className="text-white font-semibold">{centerData.officerName}</span>
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        
        {/* Amuneke Party */}
        <div className="bg-blue-500/20 backdrop-blur-sm border-3 border-blue-400 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
          <h3 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            Amuneke Party - Gov Amune
          </h3>
          <label className="block text-white text-lg font-semibold mb-3">
            Vote Count:
          </label>
          <input 
            type="number"
            {...register("amunekeVotes", { required: true, min: 0 })}
            placeholder="Enter votes for Amuneke Party"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-blue-400 rounded-xl px-6 py-5 text-white text-2xl font-bold placeholder-gray-300 focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-400/50 transition-all"
          />
          {errors.amunekeVotes && (
            <span className="text-red-400 text-sm mt-2 block">⚠️ This field is required</span>
          )}
        </div>

        {/* WayForward Party */}
        <div className="bg-green-500/20 backdrop-blur-sm border-3 border-green-400 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
          <h3 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            WayForward Party - Peter Akah
          </h3>
          <label className="block text-white text-lg font-semibold mb-3">
            Vote Count:
          </label>
          <input 
            type="number"
            {...register("wayforwardVotes", { required: true, min: 0 })}
            placeholder="Enter votes for WayForward Party"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-green-400 rounded-xl px-6 py-5 text-white text-2xl font-bold placeholder-gray-300 focus:outline-none focus:border-green-300 focus:ring-4 focus:ring-green-400/50 transition-all"
          />
          {errors.wayforwardVotes && (
            <span className="text-red-400 text-sm mt-2 block">⚠️ This field is required</span>
          )}
        </div>

        {/* I Must Win */}
        <div className="bg-purple-500/20 backdrop-blur-sm border-3 border-purple-400 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
          <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
            <span className="text-3xl">🗳️</span>
            I Must Win - Mamamia
          </h3>
          <label className="block text-white text-lg font-semibold mb-3">
            Vote Count:
          </label>
          <input 
            type="number"
            {...register("imustwinVotes", { required: true, min: 0 })}
            placeholder="Enter votes for I Must Win"
            className="w-full bg-white/20 backdrop-blur-sm border-2 border-purple-400 rounded-xl px-6 py-5 text-white text-2xl font-bold placeholder-gray-300 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/50 transition-all"
          />
          {errors.imustwinVotes && (
            <span className="text-red-400 text-sm mt-2 block">⚠️ This field is required</span>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white text-2xl font-bold py-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex items-center justify-center gap-3 mt-8"
        >
          <span className="text-3xl">✅</span>
          Submit All Votes
          <span className="text-3xl">→</span>
        </button>
      </form>
      
    </div>
  </div>
);
}

function App() {
  const [currentPage, setCurrentPage] = useState('registration');   
  const [centerData, setCenterData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  return (
  <AuthGate>
    <div className='app'>
      {currentPage === 'registration' && (
        <RegistrationPage onComplete={(data) => {
          setCenterData(data);
          setCurrentPage('upload');
        }} />
      )}

      {currentPage === 'upload' && (
        <UploadForm 
          centerData={centerData}
          onSubmit={(votes) => {
            setSubmissionData(votes);
            setCurrentPage('locked');
          }}
        />
      )}

      {currentPage === 'locked' && (
        <LockedScreen 
          centerData={centerData}
          submissionData={submissionData}
        />
      )}
    </div>
  </AuthGate>
);
}

export default App;