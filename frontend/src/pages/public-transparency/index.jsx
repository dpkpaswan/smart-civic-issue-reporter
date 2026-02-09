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
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  // Load issues from API on component mount
  useEffect(() => {
    document.title = t('transparency.title') + " - " + t('navbar.appName');
    loadIssues();
  }, [t]);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      
      // Get all issues for public transparency view (no auth token → all issues)
      const response = await issuesApi.getPublic();
      
      if (response.success) {
        // Transform API data — preserve backend fields for public display
        const transformedIssues = response.data.map((issue, index) => ({
          id: issue.id,
          title: issue.description || t('transparency.issueReport'),
          description: issue.description || t('transparency.noDescription'),
          category: issue.category,
          categoryIcon: getCategoryIcon(issue.category),
          status: issue.status,
          priority: issue.priority || 'medium',
          severityLevel: issue.severityLevel || 'medium',
          location: typeof issue.location === 'string' ? issue.location : 
                   (issue.location?.address || issue.location?.street || t('transparency.locationNotProvided')),
          coordinates: issue.location?.lat && issue.location?.lng ? 
             { lat: parseFloat(issue.location.lat), lng: parseFloat(issue.location.lng) } : null,
          image: issue.images?.[0] || null,
          images: issue.images || [],
          resolutionImages: issue.resolutionImages || [],
          imageAlt: `${issue.category} issue reported`,
          submittedDate: issue.submittedAt || issue.createdAt,
          resolvedDate: issue.resolvedAt || null,
          // Department info (public-safe)
          department: issue.assignedDepartment?.name || null,
          // SLA status (public accountability)
          slaDeadline: issue.slaDeadline || null,
          // Resolution
          authorityResponse: issue.resolutionNotes || (
            issue.status === 'in_progress' || issue.status === 'in-progress' ? t('transparency.inProgressDesc') :
            issue.status === 'resolved' ? t('transparency.resolvedDesc') :
            issue.status === 'assigned' ? t('transparency.assignedDesc') :
            issue.status === 'submitted' ? t('transparency.submittedDesc') :
            null
          ),
          // Status history for transparency
          statusHistory: issue.statusHistory || []
        }));
        
        setIssues(transformedIssues);
      } else {
        toast.error(t('transparency.failedToLoad'));
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error(error.message || t('transparency.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'pothole': 'Construction',
      'garbage': 'Trash2',
      'streetlight': 'Lightbulb',
      'graffiti': 'PaintBucket',
      'water': 'Droplet',
      'traffic': 'Car',
      'sidewalk': 'Footprints',
      'other': 'AlertTriangle',
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
    const inProgress = issues.filter((issue) => ['in_progress', 'in-progress'].includes(issue.status)).length;

    const resolvedWithDates = issues.filter((issue) => issue.resolvedDate);
    const avgResponse = resolvedWithDates.length > 0 ?
      Math.round(
        resolvedWithDates.reduce((acc, issue) => {
          const submitted = new Date(issue.submittedDate);
          const resolvedDate = new Date(issue.resolvedDate);
          const days = Math.ceil((resolvedDate - submitted) / (1000 * 60 * 60 * 24));
          return acc + days;
        }, 0) / resolvedWithDates.length
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
        'roads': ['Roads & Infrastructure', 'Road & Infrastructure', 'pothole', 'sidewalk'],
        'sanitation': ['Sanitation & Waste', 'Waste Management', 'garbage'],
        'water': ['Water Supply', 'water'],
        'electricity': ['Electricity', 'Street Lighting', 'streetlight'],
        'parks': ['Parks & Recreation'],
        'safety': ['Public Safety'],
        'environment': ['Environment'],
        'traffic': ['Traffic', 'traffic'],
        'graffiti': ['graffiti'],
        'other': ['other']
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
                    {t('transparency.title')}
                  </h1>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    {t('transparency.subtitle')}
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={() => setIsMobileFilterOpen(true)}
                  iconName="Filter"
                  iconPosition="left"
                  iconSize={18}
                  className="lg:hidden flex-shrink-0">

                  {t('transparency.filters')}
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
                    {t('transparency.showingIssues', { count: filteredIssues?.length })} {filteredIssues?.length === 1 ? t('transparency.issue') : t('transparency.issues')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    iconName="RotateCcw"
                    iconPosition="left"
                    iconSize={16}
                    className="hidden lg:flex">

                    {t('transparency.resetFilters')}
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
                        {t('transparency.noIssuesFound')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('transparency.noIssuesHint')}
                      </p>
                      <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      iconName="RotateCcw"
                      iconPosition="left">

                        {t('transparency.clearAllFilters')}
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