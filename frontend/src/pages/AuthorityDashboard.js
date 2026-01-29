import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI, apiUtils } from '../services/api';
import { storage } from '../utils/helpers';
import IssueCard from '../components/IssueCard';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

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
    // Check authentication
    const userData = storage.get('user');
    if (!userData || userData.role !== 'authority') {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchIssues();
    }
  }, [user, fetchIssues]);

  const handleStatusUpdate = async (issueId, newStatus, resolutionData = null) => {
    try {
      // First update the status
      const statusResponse = await issuesAPI.updateStatus(issueId, newStatus);
      
      // If resolving and we have resolution data, add it
      if (newStatus === 'resolved' && resolutionData) {
        await issuesAPI.addResolution(issueId, resolutionData);
      }
      
      if (statusResponse.data.success) {
        // Refresh the issues list
        fetchIssues();
        
        // Show success message
        alert(`Issue ${issueId} status updated to ${newStatus}`);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Failed to update issue: ${errorInfo.message}`);
      console.error('Error updating issue:', error);
    }
  };

  const handleResolveWithNotes = (issue) => {
    setSelectedIssue(issue);
    setResolutionNotes('');
    setShowResolutionModal(true);
  };

  const submitResolution = () => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes');
      return;
    }

    const resolutionData = {
      resolutionNotes: resolutionNotes,
      resolutionImages: [] // In full version, allow image uploads
    };

    handleStatusUpdate(selectedIssue.id, 'resolved', resolutionData);
    setShowResolutionModal(false);
    setSelectedIssue(null);
    setResolutionNotes('');
  };

  const handleLogout = () => {
    storage.remove('user');
    storage.remove('authToken');
    navigate('/');
  };

  const getStatsData = () => {
    const stats = {
      total: issues.length,
      submitted: issues.filter(i => i.status === 'submitted').length,
      'in-progress': issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      high: issues.filter(i => i.priority === 'high').length,
      medium: issues.filter(i => i.priority === 'medium').length,
      low: issues.filter(i => i.priority === 'low').length
    };
    
    stats.resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
    
    return stats;
  };

  const stats = getStatsData();

  if (!user) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Authority Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome, {user.username} ({user.department})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 transition-colors duration-200"
        >
          Logout
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-blue-800">Total Issues</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
          <div className="text-xs text-yellow-800">New</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats['in-progress']}</div>
          <div className="text-xs text-orange-800">In Progress</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-xs text-green-800">Resolved</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.resolutionRate}%</div>
          <div className="text-xs text-purple-800">Resolution Rate</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          <div className="text-xs text-red-800">High Priority</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Filter & Sort Issues
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
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {loading && <LoadingSpinner text="Loading municipal issues..." />}

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
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.category !== 'all'
                ? 'No issues match your current filters.'
                : 'No civic issues have been reported yet.'
              }
            </p>
          </div>
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Managing {issues.length} Issue{issues.length !== 1 ? 's' : ''}
            </h2>
            <div className="text-sm text-gray-500">
              Click on issues to update status or add resolution
            </div>
          </div>

          <div className="grid gap-6">
            {issues.map((issue) => (
              <div key={issue.id} className="relative">
                <IssueCard 
                  issue={issue} 
                  onStatusUpdate={(id, status) => {
                    if (status === 'resolved') {
                      handleResolveWithNotes(issue);
                    } else {
                      handleStatusUpdate(id, status);
                    }
                  }}
                  showActions={true}
                  currentUser={user}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Mark Issue as Resolved
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Issue: {selectedIssue?.id} - {selectedIssue?.category}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes *
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows="4"
                className="input-field"
                placeholder="Describe how the issue was resolved..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitResolution}
                className="btn-success flex-1"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setSelectedIssue(null);
                  setResolutionNotes('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authority Instructions */}
      <div className="card bg-blue-50 border-blue-200 mt-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🏛️ Authority Workflow
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-1">1. Review New Issues</h4>
            <ul className="space-y-1">
              <li>• Check submitted issues</li>
              <li>• Verify issue details</li>
              <li>• Assess priority level</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">2. Process Issues</h4>
            <ul className="space-y-1">
              <li>• Mark as "In Progress"</li>
              <li>• Assign to departments</li>
              <li>• Coordinate resolution</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">3. Complete Resolution</h4>
            <ul className="space-y-1">
              <li>• Add resolution notes</li>
              <li>• Mark as "Resolved"</li>
              <li>• Upload proof if available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;