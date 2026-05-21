import React, { useState } from 'react';
import api from '../api';
import { Copy, Plus, Activity, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newLink, setNewLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/shorten', { originalUrl, customAlias });
      setSuccess('URL successfully shortened!');
      setNewLink(res.data);
      setOriginalUrl('');
      setCustomAlias('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      {/* Create New Link Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plus className="mr-2" /> Create New Short Link
        </h2>
        {error && <div className="mb-4 text-red-500 bg-red-50 p-3 rounded">{error}</div>}
        {success && <div className="mb-4 text-green-500 bg-green-50 p-3 rounded">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original URL</label>
            <input
              type="url"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/very-long-url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Alias (Optional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="my-custom-name"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">
            Shorten URL
          </button>
        </form>

        {newLink && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Your short link is ready:</p>
              <a href={newLink.shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium text-lg">
                {newLink.shortUrl}
              </a>
            </div>
            <button
              onClick={() => copyToClipboard(newLink.shortUrl)}
              className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100"
            >
              <Copy className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
