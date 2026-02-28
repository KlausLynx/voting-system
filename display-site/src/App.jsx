import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { SERVER_CONFIG } from './config';

function App() {
  const [candidates, setCandidates] = useState(null);
  const [centerSubmissions, setCenterSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-detect server and connect
    const serverUrl = SERVER_CONFIG.getServerUrl();
    const socket = io(serverUrl);

    socket.on('initial-data', (data) => {
      console.log('Data from server:', data.candidates);
      setCandidates(data.candidates);
      setCenterSubmissions(data.centerSubmissions);
      setLoading(false);
    });

    socket.on('vote-update', (data) => {
      setCandidates(data.candidates);
      setCenterSubmissions(data.centerSubmissions);
    });

    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">
          Loading results...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4">
          🗳️ LIVE ELECTION RESULTS
        </h1>
        <div className="text-2xl text-green-300 font-semibold animate-pulse">
          Real-time Updates
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {candidates && Object.keys(candidates).map((partyName, index) => {
          const candidate = candidates[partyName];
          const colors = ['blue', 'green', 'purple'];
          const color = colors[index % 3];
          
          return (
            <div 
              key={partyName} 
              className={`bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-4 border-${color}-400 shadow-2xl transform hover:scale-105 transition-all duration-300`}
            >
              {/* Candidate Image */}
              {candidate.image && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={`http://localhost:3000${candidate.image}`}
                    alt={candidate.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                </div>
              )}

              {/* Party Name */}
              <h2 className={`text-3xl font-bold text-${color}-300 text-center mb-2`}>
                {partyName}
              </h2>

              {/* Candidate Name */}
              <h3 className="text-xl text-white text-center mb-6">
                {candidate.name}
              </h3>

              {/* Vote Count */}
              <div className={`bg-${color}-500/30 rounded-2xl p-6 mb-6`}>
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">
                    {candidate.votes.toLocaleString()}
                  </div>
                  <div className="text-lg text-gray-200">
                    Total Votes
                  </div>
                </div>
              </div>

              {/* Center Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm text-gray-300 font-semibold mb-3">
                  Breakdown by Center:
                </h4>
                {Object.keys(candidate.centerBreakdown)
                  .filter(centerNum => candidate.centerBreakdown[centerNum] > 0)
                  .map(centerNum => (
                    <div 
                      key={centerNum}
                      className="bg-white/10 rounded-lg p-3 flex justify-between items-center"
                    >
                      <span className="text-white font-medium">
                        Center {centerNum}
                      </span>
                      <span className={`text-${color}-300 font-bold text-lg`}>
                        {candidate.centerBreakdown[centerNum].toLocaleString()} votes
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Submission Status */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-4 border-purple-400 shadow-2xl">
        <h3 className="text-3xl font-bold text-purple-300 mb-6 text-center">
          📊 Center Submission Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {centerSubmissions && Object.keys(centerSubmissions).map(centerNum => {
            const center = centerSubmissions[centerNum];
            if (!center) return null;
            
            return (
              <div 
                key={centerNum}
                className={`${
                  center.submitted ? 'bg-green-500/30 border-green-400' : 'bg-yellow-500/30 border-yellow-400'
                } rounded-xl p-6 border-2`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-bold text-xl">
                    Center {centerNum}
                  </div>
                  <div className="text-4xl">
                    {center.submitted ? '✅' : '⏳'}
                  </div>
                </div>
                
                {center.submitted && (
                  <div className="space-y-2">
                    {center.officer && (
                      <div className="text-green-300 text-sm">
                        👤 Officer: <span className="font-semibold">{center.officer.name}</span>
                      </div>
                    )}
                    {center.timestamp && (
                      <div className="text-gray-300 text-sm">
                        🕐 Time: {new Date(center.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live indicator */}
      <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg">
        <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
        LIVE
      </div>
    </div>
  );
}

export default App;