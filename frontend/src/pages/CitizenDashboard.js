import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { issuesAPI, apiUtils } from '../services/api';
import { utils } from '../utils/helpers';
import IssueCard from '../components/IssueCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CitizenDashboard = () => {
  const location = useLocation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        citizenEmail: citizenEmail,
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
  }, [citizenEmail, filters]);

  // Get citizen email from various sources
  useEffect(() => {
    // 1. From navigation state (when coming from report page)
    if (location.state?.citizenEmail) {
      setCitizenEmail(location.state.citizenEmail);
      return;
    }

    // 2. From localStorage (if previously entered)
    const savedEmail = localStorage.getItem('citizenEmail');
    if (savedEmail) {
      setCitizenEmail(savedEmail);
      return;
    }

    // 3. Prompt user to enter email
    const email = prompt('Please enter your email address to view your reported issues:');
    if (email && utils.isValidEmail(email)) {
      setCitizenEmail(email);
      localStorage.setItem('citizenEmail', email);
    }
  }, [location.state]);

  // Fetch issues when email is available
  useEffect(() => {
    if (citizenEmail) {
      fetchIssues();
    }
  }, [citizenEmail, fetchIssues]);

  // Highlight new issue if coming from report page
  useEffect(() => {
    if (location.state?.newIssueId) {
      setTimeout(() => {
        const element = document.getElementById(`issue-${location.state.newIssueId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          element.classList.add('animate-pulse');
        }
      }, 500);
    }
  }, [location.state, issues]);

  // Fetch issues when email is available
  useEffect(() => {
    if (citizenEmail) {
      fetchIssues();
    }
  }, [citizenEmail, fetchIssues]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleEmailChange = () => {
    const email = prompt('Enter your email address:', citizenEmail);
    if (email && utils.isValidEmail(email)) {
      setCitizenEmail(email);
      localStorage.setItem('citizenEmail', email);
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: issues.length,
      submitted: issues.filter(i => i.status === 'submitted').length,
      'in-progress': issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length
    };
    return stats;
  };

  const stats = getStatusStats();

  if (!citizenEmail) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Citizen Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Please enter your email address to view your reported issues
          </p>
          <button onClick={handleEmailChange} className="btn-primary">
            Enter Email Address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            My Reported Issues
          </h1>
          <p className="text-gray-600 mt-2">
            Tracking issues for: {citizenEmail}
            <button 
              onClick={handleEmailChange}
              className="ml-2 text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Change Email
            </button>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Issues</div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.submitted}</div>
          <div className="text-sm text-blue-800">Submitted</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">{stats['in-progress']}</div>
          <div className="text-sm text-yellow-800">In Progress</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.resolved}</div>
          <div className="text-sm text-green-800">Resolved</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-gray-600 mb-2">
            {stats.resolved > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-800">Resolution Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Filter Issues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Street Light</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {loading && <LoadingSpinner text="Loading your issues..." />}

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
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No Issues Found
            </h3>
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.category !== 'all' 
                ? 'No issues match your current filters. Try adjusting the filters above.'
                : `You haven't reported any issues yet. Start by reporting your first issue!`
              }
            </p>
          </div>
          {filters.status === 'all' && filters.category === 'all' && (
            <a href="/report" className="btn-primary">
              Report Your First Issue
            </a>
          )}
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="grid gap-6">
          {issues.map((issue) => (
            <div 
              key={issue.id}
              id={`issue-${issue.id}`}
              className={`${location.state?.newIssueId === issue.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <IssueCard issue={issue} />
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200 mt-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          📋 How to Track Your Issues
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-1">Issue Statuses:</h4>
            <ul className="space-y-1">
              <li>• <strong>Submitted:</strong> Your issue has been received</li>
              <li>• <strong>In Progress:</strong> Authorities are working on it</li>
              <li>• <strong>Resolved:</strong> Issue has been fixed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">What You Can Do:</h4>
            <ul className="space-y-1">
              <li>• Track real-time status updates</li>
              <li>• View resolution proof when available</li>
              <li>• Use filters to find specific issues</li>
              <li>• Report new issues anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;