import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { SkeletonCard, LoadingSpinner } from '../../components/ui/Loading';
import { toast } from '../../utils/toast';
import { issuesApi } from '../../utils/api';
import IssueCard from './components/IssueCard';
import FilterPanel from './components/FilterPanel';
import StatsHeader from './components/StatsHeader';
import IssueDetailsModal from './components/IssueDetailsModal';

const PublicTransparency = () => {
  // API and loading state
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'newest'
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Load issues from API on component mount
  useEffect(() => {
    document.title = "Public Transparency - Smart Civic Issue Reporter";
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      
      // Get all issues for public transparency view
      const response = await issuesApi.getAll();
      
      if (response.success) {
        // Transform API data to match component expectations
        const transformedIssues = response.data.map((issue, index) => ({
          id: issue.id,
          title: issue.description || 'Civic Issue Report',
          description: issue.description || 'No description provided',
          category: issue.category,
          categoryIcon: getCategoryIcon(issue.category),
          status: issue.status,
          location: typeof issue.location === 'string' ? issue.location : 
                   (issue.location?.address || issue.location?.street || 'Location not provided'),
          coordinates: issue.latitude && issue.longitude ? 
            { lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude) } : 
            (issue.location?.lat && issue.location?.lng ? 
             { lat: parseFloat(issue.location.lat), lng: parseFloat(issue.location.lng) } : null),
          image: issue.images?.[0] || getPlaceholderImage(issue.category),
          imageAlt: `${issue.category} issue reported`,
          submittedDate: issue.createdAt,
          resolvedDate: issue.status === 'resolved' ? issue.updatedAt : null,
          authorityResponse: issue.resolutionNotes || (
            issue.status === 'in-progress' ? 'Issue is currently being addressed by the relevant department.' :
            issue.status === 'resolved' ? 'Issue has been resolved by the appropriate authorities.' :
            issue.status === 'submitted' ? 'Issue has been submitted and is awaiting review.' :
            null
          )
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

  // Helper function to get placeholder image for category
  const getPlaceholderImage = (category) => {
    const placeholders = {
      'Road & Infrastructure': 'https://images.unsplash.com/photo-1728340964368-59c3192e44e6',
      'Roads & Infrastructure': 'https://images.unsplash.com/photo-1728340964368-59c3192e44e6',
      'Street Lighting': 'https://images.unsplash.com/photo-1723378574780-727b23bc3950',
      'Electricity': 'https://images.unsplash.com/photo-1723378574780-727b23bc3950', 
      'Waste Management': 'https://images.unsplash.com/photo-1612626957978-6ba7195f329c',
      'Sanitation & Waste': 'https://images.unsplash.com/photo-1612626957978-6ba7195f329c',
      'Water Supply': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
      'Drainage': 'https://images.unsplash.com/photo-1693497540664-3384fcf6fb74',
      'Parks & Recreation': 'https://images.unsplash.com/photo-1591729982144-318ad4370809'
    };
    return placeholders[category] || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd';
  };

  // Calculate statistics from actual data
  const stats = useMemo(() => {
    if (isLoading || issues.length === 0) {
      return {
        totalIssues: 0,
        resolvedIssues: 0,
        inProgressIssues: 0,
        avgResponseTime: 0
      };
    }

    const total = issues.length;
    const resolved = issues.filter((issue) => issue.status === 'resolved').length;
    const inProgress = issues.filter((issue) => issue.status === 'in-progress').length;

    const resolvedIssues = issues.filter((issue) => issue.resolvedDate);
    const avgResponse = resolvedIssues.length > 0 ?
      Math.round(
        resolvedIssues.reduce((acc, issue) => {
          const submitted = new Date(issue.submittedDate);
          const resolved = new Date(issue.resolvedDate);
          const days = Math.ceil((resolved - submitted) / (1000 * 60 * 60 * 24));
          return acc + days;
        }, 0) / resolvedIssues.length
      ) :
      0;

    return {
      totalIssues: total,
      resolvedIssues: resolved,
      inProgressIssues: inProgress,
      avgResponseTime: avgResponse
    };
  }, [issues, isLoading]);

  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    if (filters?.category !== 'all') {
      const categoryMap = {
        'roads': ['Roads & Infrastructure', 'Road & Infrastructure'],
        'sanitation': ['Sanitation & Waste', 'Waste Management'],
        'water': ['Water Supply'],
        'electricity': ['Electricity', 'Street Lighting'],
        'parks': ['Parks & Recreation'],
        'safety': ['Public Safety'],
        'environment': ['Environment']
      };
      
      const targetCategories = categoryMap[filters.category] || [];
      filtered = filtered?.filter((issue) => 
        targetCategories.some(cat => issue.category.includes(cat))
      );
    }

    if (filters?.status !== 'all') {
      filtered = filtered?.filter((issue) => issue?.status === filters?.status);
    }

    if (filters?.search) {
      const searchLower = filters?.search?.toLowerCase();
      filtered = filtered?.filter((issue) =>
        issue?.title?.toLowerCase()?.includes(searchLower) ||
        issue?.description?.toLowerCase()?.includes(searchLower) ||
        issue?.location?.toLowerCase()?.includes(searchLower)
      );
    }

    filtered?.sort((a, b) => {
      switch (filters?.sortBy) {
        case 'newest':
          return new Date(b.submittedDate) - new Date(a.submittedDate);
        case 'oldest':
          return new Date(a.submittedDate) - new Date(b.submittedDate);
        case 'status':
          return a?.status?.localeCompare(b?.status);
        case 'category':
          return a?.category?.localeCompare(b?.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [issues, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      search: '',
      sortBy: 'newest'
    });
  };

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
  };

  return (
    <>
      <Helmet>
        <title>Public Transparency - Smart Civic Reporter</title>
        <meta name="description" content="Track community issues and monitor government responsiveness through our transparent accountability platform" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={false} />

        <main className="pt-16">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
            <div className="mb-6 lg:mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    Public Transparency Dashboard
                  </h1>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Track community issues and monitor government responsiveness in real-time
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={() => setIsMobileFilterOpen(true)}
                  iconName="Filter"
                  iconPosition="left"
                  iconSize={18}
                  className="lg:hidden flex-shrink-0">

                  Filters
                </Button>
              </div>

              <StatsHeader stats={stats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobileOpen={isMobileFilterOpen}
                onMobileClose={() => setIsMobileFilterOpen(false)} />


              <div>
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredIssues?.length}</span> {filteredIssues?.length === 1 ? 'issue' : 'issues'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    iconName="RotateCcw"
                    iconPosition="left"
                    iconSize={16}
                    className="hidden lg:flex">

                    Reset Filters
                  </Button>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                ) : filteredIssues?.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-8 lg:p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Search" size={32} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-2">
                        No issues found
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Try adjusting your filters or search terms to find what you're looking for
                      </p>
                      <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      iconName="RotateCcw"
                      iconPosition="left">

                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {filteredIssues?.map((issue) =>
                  <IssueCard
                    key={issue?.id}
                    issue={issue}
                    onViewDetails={handleViewDetails} />

                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {selectedIssue &&
        <IssueDetailsModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)} />

        }
      </div>
    </>);

};

export default PublicTransparency;