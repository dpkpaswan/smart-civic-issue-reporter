import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { LoadingOverlay, SkeletonTable } from '../../components/ui/Loading';
import { toast } from '../../utils/toast';
import { issuesApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';

import IssueMetricsPanel from './components/IssueMetricsPanel';
import FilterControls from './components/FilterControls';
import BulkActionsBar from './components/BulkActionsBar';
import IssuesTable from './components/IssuesTable';
import StatusUpdateModal from './components/StatusUpdateModal';
import PriorityUpdateModal from './components/PriorityUpdateModal';
import IssueDetailModal from './components/IssueDetailModal';

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State for API data and loading
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // UI State
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    location: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'submittedDate', direction: 'desc' });
  const [activeModal, setActiveModal] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Load issues from API
  useEffect(() => {
    loadIssues();
  }, []);

  // Show welcome message when dashboard loads
  useEffect(() => {
    if (user && !isLoading) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        toast.success(`Welcome back, ${user.username || 'Authority'}! Ready to manage civic issues.`);
      }, 500);
    }
  }, [user, isLoading]);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      
      // Call API to get all issues for authority dashboard
      const response = await issuesApi.getAll({
        // No filters for initial load - get all issues
      });
      
      if (response.success) {
        // Transform API data to match component expectations
        const transformedIssues = response.data.map(issue => ({
          id: issue.id,
          image: issue.images?.[0] || '', // First image or empty
          imageAlt: `Issue image for ${issue.category}`,
          description: issue.description,
          category: issue.category,
          categoryIcon: getCategoryIcon(issue.category),
          location: typeof issue.location === 'string' ? issue.location : 
                   (issue.location?.address || issue.location?.street || 'Location not provided'),
          coordinates: issue.latitude && issue.longitude ? 
            { lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude) } : 
            (issue.location?.lat && issue.location?.lng ? 
             { lat: parseFloat(issue.location.lat), lng: parseFloat(issue.location.lng) } : null),
          priority: issue.priority || 'medium',
          submittedDate: issue.createdAt,
          status: issue.status,
          reporterId: issue.citizenEmail || 'Unknown',
          department: getDepartmentByCategory(issue.category),
          assignedTo: issue.assignedTo || '',
          notes: issue.resolutionNotes || ''
        }));
        
        setIssues(transformedIssues);
      } else {
        toast.error('Failed to load issues');
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error(error.message || 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Road & Infrastructure': 'Construction',
      'Roads & Infrastructure': 'Construction',
      'Street Lighting': 'Lightbulb',
      'Electricity': 'Zap',
      'Waste Management': 'Trash2',
      'Sanitation & Waste': 'Trash2',
      'Water Supply': 'Droplet',
      'Drainage': 'Waves',
      'Parks & Recreation': 'Trees',
      'Traffic': 'Car',
      'Public Safety': 'Shield',
      'Environment': 'Leaf'
    };
    return iconMap[category] || 'AlertTriangle';
  };

  // Helper function to get department by category
  const getDepartmentByCategory = (category) => {
    const departmentMap = {
      'Road & Infrastructure': 'Public Works',
      'Roads & Infrastructure': 'Public Works',
      'Street Lighting': 'Electrical Services',
      'Electricity': 'Power Grid',
      'Waste Management': 'Sanitation',
      'Sanitation & Waste': 'Sanitation',
      'Water Supply': 'Water Department',
      'Drainage': 'Public Works',
      'Parks & Recreation': 'Parks Department',
      'Traffic': 'Traffic Management',
      'Public Safety': 'Safety Department',
      'Environment': 'Environmental Services'
    };
    return departmentMap[category] || 'General Services';
  };

  const metrics = useMemo(() => {
    const today = new Date()?.toDateString();
    return {
      pending: issues?.filter((i) => i?.status === 'submitted')?.length,
      inProgress: issues?.filter((i) => i?.status === 'in-progress')?.length,
      resolvedToday: issues?.filter((i) =>
      i?.status === 'resolved' &&
      new Date(i.submittedDate)?.toDateString() === today
      )?.length,
      avgResolutionTime: "2.5 days"
    };
  }, [issues]);

  const filteredAndSortedIssues = useMemo(() => {
    let filtered = [...issues];

    if (filters?.status !== 'all') {
      filtered = filtered?.filter((i) => i?.status === filters?.status);
    }
    if (filters?.category !== 'all') {
      filtered = filtered?.filter((i) => i?.category === filters?.category);
    }
    if (filters?.priority !== 'all') {
      filtered = filtered?.filter((i) => i?.priority === filters?.priority);
    }
    if (filters?.location) {
      filtered = filtered?.filter((i) =>
      i?.location?.toLowerCase()?.includes(filters?.location?.toLowerCase())
      );
    }
    if (filters?.dateFrom) {
      filtered = filtered?.filter((i) =>
      new Date(i.submittedDate) >= new Date(filters.dateFrom)
      );
    }
    if (filters?.dateTo) {
      filtered = filtered?.filter((i) =>
      new Date(i.submittedDate) <= new Date(filters.dateTo)
      );
    }

    filtered?.sort((a, b) => {
      const aVal = a?.[sortConfig?.key];
      const bVal = b?.[sortConfig?.key];

      if (sortConfig?.key === 'submittedDate') {
        return sortConfig?.direction === 'asc' ?
        new Date(aVal) - new Date(bVal) :
        new Date(bVal) - new Date(aVal);
      }

      if (typeof aVal === 'string') {
        return sortConfig?.direction === 'asc' ?
        aVal?.localeCompare(bVal) :
        bVal?.localeCompare(aVal);
      }

      return sortConfig?.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [issues, filters, sortConfig]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      priority: 'all',
      location: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectIssue = (issueId) => {
    setSelectedIssues((prev) =>
    prev?.includes(issueId) ?
    prev?.filter((id) => id !== issueId) :
    [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssues?.length === filteredAndSortedIssues?.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredAndSortedIssues?.map((i) => i?.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIssues.length === 0) {
      toast.warning('Please select issues to perform bulk action');
      return;
    }

    setIsUpdating(true);
    
    try {
      // Process bulk actions
      const updatePromises = selectedIssues.map(async (issueId) => {
        if (['submitted', 'in-progress', 'resolved'].includes(action)) {
          // Status update
          return await issuesApi.updateStatus(issueId, action);
        } else if (['high', 'medium', 'low'].includes(action)) {
          // Priority update
          return await issuesApi.updatePriority(issueId, action);
        }
        return null;
      });

      await Promise.all(updatePromises);
      
      // Refresh issues after bulk update
      await loadIssues();
      setSelectedIssues([]);
      
      toast.success(`Successfully updated ${selectedIssues.length} issues`);
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error(error.message || 'Failed to update issues');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (issueId) => {
    const issue = issues?.find((i) => i?.id === issueId);
    setSelectedIssue(issue);
    setActiveModal('status');
  };

  const handlePriorityChange = (issueId) => {
    const issue = issues?.find((i) => i?.id === issueId);
    setSelectedIssue(issue);
    setActiveModal('priority');
  };

  const handleViewDetails = (issueId) => {
    const issue = issues?.find((i) => i?.id === issueId);
    setSelectedIssue(issue);
    setActiveModal('details');
  };

  const handleUpdateStatus = async (issueId, newStatus, notes) => {
    try {
      setIsUpdating(true);
      
      // Call API to update status
      await issuesApi.updateStatus(issueId, newStatus, notes);
      
      // Update local state
      setIssues((prev) => prev.map((issue) =>
        issue.id === issueId
          ? { ...issue, status: newStatus, notes }
          : issue
      ));
      
      toast.success('Issue status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update issue status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePriority = async (issueId, newPriority) => {
    try {
      setIsUpdating(true);
      
      // Call API to update priority
      await issuesApi.updatePriority(issueId, newPriority);
      
      // Update local state
      setIssues((prev) => prev.map((issue) =>
        issue.id === issueId
          ? { ...issue, priority: newPriority }
          : issue
      ));
      
      toast.success('Issue priority updated successfully');
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error(error.message || 'Failed to update issue priority');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/authority-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedIssue(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <main className="pt-16">
        <LoadingOverlay isLoading={isUpdating}>
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 md:py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Authority Dashboard
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Manage and resolve civic issues efficiently
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="User" size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {user?.name || user?.email || 'Authority User'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user?.role || 'Government Official'}
                  </span>
                </div>
                
                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  iconName="LogOut"
                  iconPosition="left"
                  iconSize={16}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  Logout
                </Button>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <IssueMetricsPanel metrics={metrics} />

              <FilterControls
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                resultCount={filteredAndSortedIssues?.length} />

              <BulkActionsBar
                selectedCount={selectedIssues?.length}
                totalCount={filteredAndSortedIssues?.length}
                allSelected={selectedIssues?.length === filteredAndSortedIssues?.length && filteredAndSortedIssues?.length > 0}
                onSelectAll={handleSelectAll}
                onBulkAction={handleBulkAction}
                onClearSelection={() => setSelectedIssues([])} />

              {/* Show loading skeleton while fetching data */}
              {isLoading ? (
                <SkeletonTable rows={8} />
              ) : (
                <IssuesTable
                  issues={filteredAndSortedIssues}
                  selectedIssues={selectedIssues}
                  allSelected={selectedIssues?.length === filteredAndSortedIssues?.length && filteredAndSortedIssues?.length > 0}
                  onSelectAll={handleSelectAll}
                  onSelectIssue={handleSelectIssue}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onViewDetails={handleViewDetails}
                  sortConfig={sortConfig}
                  onSort={handleSort} />
              )}
            </div>
          </div>
        </LoadingOverlay>
      </main>
      
      {/* Modals */}
      {activeModal === 'status' && selectedIssue && (
        <StatusUpdateModal
          issue={selectedIssue}
          onClose={handleCloseModal}
          onUpdate={handleUpdateStatus}
          isUpdating={isUpdating} />
      )}
      
      {activeModal === 'priority' && selectedIssue && (
        <PriorityUpdateModal
          issue={selectedIssue}
          onClose={handleCloseModal}
          onUpdate={handleUpdatePriority}
          isUpdating={isUpdating} />
      )}
      
      {activeModal === 'details' && selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange} />
      )}
    </div>
  );

};

export default AuthorityDashboard;