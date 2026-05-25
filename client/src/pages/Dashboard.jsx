import React, { useState, useEffect } from 'react';
import api from '../api';
import { Copy, Plus, BarChart2, Trash2, QrCode } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');    const [expiresAt, setExpiresAt] = useState('');  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [urls, setUrls] = useState([]);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const res = await api.get('/urls');
      setUrls(res.data);
    } catch (err) {
      console.error('Error fetching URLs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/shorten', { originalUrl, customAlias, expiresAt: expiresAt || null });
      setSuccess('URL successfully shortened!');
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresAt('');
      fetchUrls(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const deleteUrl = async (shortCode) => {
    if(!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await api.delete(`/delete/${shortCode}`);
      fetchUrls();
      if(selectedAnalytics && selectedAnalytics.shortCode === shortCode) {
        setSelectedAnalytics(null);
      }
    } catch (err) {
      console.error('Error deleting URL:', err);
    }
  };

  const viewAnalytics = async (shortCode) => {
    try {
      const res = await api.get(`/analytics/${shortCode}`);
      // Process data for charts
      const deviceData = res.data.history.reduce((acc, curr) => {
        const device = curr.device || 'Unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.keys(deviceData).map(key => ({
        name: key,
        clicks: deviceData[key]
      }));

      setSelectedAnalytics({ shortCode, totalClicks: res.data.totalClicks, chartData });
      
      // Fetch QR Note: Could happen individually but let's fetch it when analyzing
      const qrRes = await api.get(`/qr/${shortCode}`);
      setQrCode(qrRes.data.qrCode);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Link */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Plus className="mr-2" /> Create Link
            </h2>
            {error && <div className="mb-4 text-red-500 bg-red-50 p-2 text-sm rounded">{error}</div>}
            {success && <div className="mb-4 text-green-500 bg-green-50 p-2 text-sm rounded">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/very-long-url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Alias (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="my-custom-name"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">
                Shorten URL
              </button>
            </form>
          </div>

          {/* QR Code display */}
          {qrCode && selectedAnalytics && (
             <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                <h3 className="font-semibold mb-2 flex items-center"><QrCode className="mr-2" /> QR Code</h3>
                <img src={qrCode} alt="QR Code" className="w-40 h-40" />
                <p className="text-xs text-gray-500 mt-2">/{selectedAnalytics.shortCode}</p>
             </div>
          )}
        </div>

        {/* Right Column: List & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics View */}
          {selectedAnalytics && (
             <div className="bg-white rounded-xl shadow-md p-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold flex items-center">
                    <BarChart2 className="mr-2" /> Analytics: /{selectedAnalytics.shortCode}
                 </h2>
                 <button onClick={() => {setSelectedAnalytics(null); setQrCode(null)}} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
               </div>
               
               <div className="mb-6">
                 <p className="text-3xl font-bold text-blue-600">{selectedAnalytics.totalClicks}</p>
                 <p className="text-sm text-gray-500">Total Clicks</p>
               </div>

               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedAnalytics.chartData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
          )}

          {/* Links List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Links</h2>
            {urls.length === 0 ? (
              <p className="text-gray-500 text-sm">You haven't created any links yet.</p>
            ) : (
              <div className="space-y-4">
                {urls.map(url => (
                  <div key={url._id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="mb-4 sm:mb-0 overflow-hidden">
                      <a href={`http://localhost:5000/${url.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-lg block truncate">
                        {window.location.origin}/{url.shortCode}
                      </a>
                      <p className="text-gray-500 text-sm truncate max-w-xs" title={url.originalUrl}>{url.originalUrl}</p>
                      <p className="text-xs text-gray-400 mt-1">Clicks: {url.clicks}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(`http://localhost:5000/${url.shortCode}`)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700" title="Copy">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => viewAnalytics(url.shortCode)} className="p-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-600" title="Analytics">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUrl(url.shortCode)} className="p-2 bg-red-50 hover:bg-red-100 rounded text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
