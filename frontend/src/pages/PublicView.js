import React, { useState, useEffect, useCallback } from 'react';
import { issuesAPI, apiUtils } from '../services/api';
import IssueCard from '../components/IssueCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PublicView = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'stats'

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category })
      };

      const response = await issuesAPI.getAll(params);
      
      if (response.data.success) {
        setIssues(response.data.data);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const getCommunityStats = () => {
    const stats = {
      total: issues.length,
      submitted: issues.filter(i => i.status === 'submitted').length,
      'in-progress': issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
    };

    // Category breakdown
    stats.categories = {
      pothole: issues.filter(i => i.category === 'pothole').length,
      garbage: issues.filter(i => i.category === 'garbage').length,
      streetlight: issues.filter(i => i.category === 'streetlight').length,
      other: issues.filter(i => i.category === 'other').length
    };

    // Resolution rate
    stats.resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    stats.recentIssues = issues.filter(i => new Date(i.createdAt) >= oneWeekAgo).length;

    return stats;
  };

  const stats = getCommunityStats();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🌍 Community Transparency Dashboard
        </h1>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Track all civic issues in your community. See what problems are being reported, 
          what's being worked on, and what's been resolved.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          📊 Real-time data • 🔓 Open access • 🏛️ Government accountability
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === 'stats'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Statistics View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Issues List
          </button>
        </div>
      </div>

      {/* Statistics View */}
      {viewMode === 'stats' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center bg-blue-50 border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
              <div className="text-sm text-blue-800 font-medium">Total Issues</div>
              <div className="text-xs text-blue-600 mt-1">All time</div>
            </div>
            <div className="card text-center bg-green-50 border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.resolutionRate}%</div>
              <div className="text-sm text-green-800 font-medium">Resolved</div>
              <div className="text-xs text-green-600 mt-1">{stats.resolved} issues fixed</div>
            </div>
            <div className="card text-center bg-orange-50 border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">{stats['in-progress']}</div>
              <div className="text-sm text-orange-800 font-medium">In Progress</div>
              <div className="text-xs text-orange-600 mt-1">Being worked on</div>
            </div>
            <div className="card text-center bg-purple-50 border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.recentIssues}</div>
              <div className="text-sm text-purple-800 font-medium">This Week</div>
              <div className="text-xs text-purple-600 mt-1">New reports</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 Issue Status Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                    <span className="text-sm">Submitted</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{stats.submitted}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{stats['in-progress']}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.total > 0 ? Math.round((stats['in-progress'] / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="text-sm">Resolved</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{stats.resolved}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🏷️ Issue Categories
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">🕳️</span>
                    <span className="text-sm">Potholes</span>
                  </div>
                  <span className="font-medium">{stats.categories.pothole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">🗑️</span>
                    <span className="text-sm">Garbage/Waste</span>
                  </div>
                  <span className="font-medium">{stats.categories.garbage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">💡</span>
                    <span className="text-sm">Street Lights</span>
                  </div>
                  <span className="font-medium">{stats.categories.streetlight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⚠️</span>
                    <span className="text-sm">Other Issues</span>
                  </div>
                  <span className="font-medium">{stats.categories.other}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters (show in both modes) */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          🔍 Filter Community Issues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Street Light</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchIssues}
              className="btn-primary w-full"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Issues List View */}
      {viewMode === 'list' && (
        <>
          {loading && <LoadingSpinner text="Loading community issues..." />}

          {error && (
            <div className="card bg-red-50 border-red-200">
              <div className="text-red-600 text-center">
                <p className="font-medium mb-2">⚠️ Error Loading Issues</p>
                <p className="text-sm mb-4">{error}</p>
                <button onClick={fetchIssues} className="btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && issues.length === 0 && (
            <div className="card text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No Issues Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {filters.status !== 'all' || filters.category !== 'all'
                    ? 'No issues match your current filters.'
                    : 'No civic issues have been reported yet in your community.'
                  }
                </p>
                <a href="/report" className="btn-primary">
                  Report the First Issue
                </a>
              </div>
            </div>
          )}

          {!loading && !error && issues.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  📋 Community Issues ({issues.length})
                </h2>
                <div className="text-sm text-gray-500">
                  🔓 Public view - Read-only access
                </div>
              </div>

              <div className="grid gap-6">
                {issues.map((issue) => (
                  <IssueCard 
                    key={issue.id}
                    issue={issue} 
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Community Information */}
      <div className="card bg-green-50 border-green-200 mt-8">
        <h3 className="text-lg font-semibold text-green-800 mb-3">
          🌱 How This Builds Better Communities
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-green-700">
          <div>
            <h4 className="font-medium mb-2">🔍 Transparency</h4>
            <ul className="space-y-1">
              <li>• See all reported issues</li>
              <li>• Track resolution progress</li>
              <li>• Hold authorities accountable</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🤝 Community Awareness</h4>
            <ul className="space-y-1">
              <li>• Know what issues affect neighbors</li>
              <li>• Understand municipal priorities</li>
              <li>• See improvement trends</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📈 Data-Driven Decisions</h4>
            <ul className="space-y-1">
              <li>• Identify problem patterns</li>
              <li>• Inform policy decisions</li>
              <li>• Allocate resources effectively</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card bg-blue-50 border-blue-200 mt-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            💪 Make a Difference in Your Community
          </h3>
          <p className="text-blue-700 mb-4">
            Spotted a civic issue? Report it and help make your community better for everyone.
          </p>
          <a href="/report" className="btn-primary">
            Report an Issue
          </a>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center mt-8 text-xs text-gray-500">
        <p>
          🏆 Smart Civic Issue Reporter - Hackathon Prototype 2026 | 
          Building transparent, accountable communities through technology
        </p>
        <p className="mt-1">
          Data refreshed in real-time • Open government initiative
        </p>
      </div>
    </div>
  );
};

export default PublicView;