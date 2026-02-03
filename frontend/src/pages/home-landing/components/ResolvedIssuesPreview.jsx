import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import Button from '../../../components/ui/Button';
import { issuesApi } from '../../../utils/api';

const ResolvedIssuesPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load real resolved issues from API
  useEffect(() => {
    loadResolvedIssues();
  }, []);

  const loadResolvedIssues = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all issues and filter for resolved ones
      const response = await issuesApi.getAll();
      
      if (response.success) {
        // Filter for resolved issues and format them
        const resolved = response.data
          .filter(issue => issue.status === 'resolved')
          .slice(0, 6) // Show max 6 recent success stories
          .map(issue => ({
            id: issue.id,
            title: issue.description?.substring(0, 50) + (issue.description?.length > 50 ? '...' : '') || 'Issue Resolved',
            category: issue.category || 'General',
            location: typeof issue.location === 'string' ? issue.location : 
                     (issue.location?.address || `${issue.latitude}, ${issue.longitude}` || 'Location not specified'),
            reportedDate: issue.createdAt,
            resolvedDate: issue.updatedAt,
            resolutionTime: calculateResolutionTime(issue.createdAt, issue.updatedAt),
            beforeImage: issue.images?.[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000", // Default civic issue image
            beforeImageAlt: `Before: ${issue.description?.substring(0, 100) || 'Civic issue reported by citizen'}`,
            afterImage: getAfterImage(issue.category), // Category-based after image
            afterImageAlt: `After: ${issue.category} issue resolved by authorities`,
            description: issue.resolutionNotes || `${issue.category} issue has been successfully resolved by the authorities.`,
            authority: getDepartmentByCategory(issue.category),
            impact: issue.priority || 'Medium'
          }))
          .sort((a, b) => new Date(b.resolvedDate) - new Date(a.resolvedDate)); // Sort by most recent

        if (resolved.length === 0) {
          // If no resolved issues, show a placeholder message
          setResolvedIssues([{
            id: 'placeholder',
            title: 'Building a Better Community',
            category: 'Community Initiative',
            location: 'Your City',
            reportedDate: new Date().toISOString(),
            resolvedDate: new Date().toISOString(),
            resolutionTime: 'Ongoing',
            beforeImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000",
            beforeImageAlt: 'Citizens working together to improve their community',
            afterImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1000",
            afterImageAlt: 'Beautiful, well-maintained community spaces showing civic improvement',
            description: 'Your reports make a difference! Be the first to help improve our community by reporting civic issues.',
            authority: 'Community Services',
            impact: 'High'
          }]);
        } else {
          setResolvedIssues(resolved);
        }
      } else {
        throw new Error('Failed to load resolved issues');
      }
    } catch (error) {
      console.error('Error loading resolved issues:', error);
      setError('Unable to load success stories');
      
      // Fallback to example data to show component structure
      setResolvedIssues([{
        id: 'example',
        title: 'Community Improvement in Progress',
        category: 'Infrastructure',
        location: 'Your Community',
        reportedDate: new Date().toISOString(),
        resolvedDate: new Date().toISOString(),
        resolutionTime: 'Ongoing',
        beforeImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000",
        beforeImageAlt: 'Community infrastructure being improved',
        afterImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1000", 
        afterImageAlt: 'Improved community infrastructure',
        description: 'Help us build success stories by reporting issues in your community. Your voice matters!',
        authority: 'Municipal Services',
        impact: 'High'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate resolution time between two dates
  const calculateResolutionTime = (reportedDate, resolvedDate) => {
    const reported = new Date(reportedDate);
    const resolved = new Date(resolvedDate);
    const diffTime = Math.abs(resolved - reported);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Same day';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  // Get appropriate "after" image based on category
  const getAfterImage = (category) => {
    const categoryImages = {
      'Road & Infrastructure': "https://images.unsplash.com/photo-1515960877911-2d44c64fc7e0?q=80&w=1000",
      'Roads & Infrastructure': "https://images.unsplash.com/photo-1515960877911-2d44c64fc7e0?q=80&w=1000", 
      'Street Lighting': "https://images.unsplash.com/photo-1636685123891-8d154b3abc0e?q=80&w=1000",
      'Electricity': "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000",
      'Waste Management': "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000",
      'Sanitation & Waste': "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000",
      'Water Supply': "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000",
      'Drainage': "https://images.unsplash.com/photo-1587808613097-8c8406c547b1?q=80&w=1000",
      'Parks & Recreation': "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000",
      'Traffic': "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1000",
      'Public Safety': "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1000",
      'Environment': "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000"
    };
    return categoryImages[category] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1000";
  };

  // Get department by category
  const getDepartmentByCategory = (category) => {
    const departmentMap = {
      'Road & Infrastructure': 'Public Works Department',
      'Roads & Infrastructure': 'Public Works Department',
      'Street Lighting': 'Electrical Services',
      'Electricity': 'Power Grid Authority',
      'Waste Management': 'Sanitation Department',
      'Sanitation & Waste': 'Sanitation Department',
      'Water Supply': 'Water Department',
      'Drainage': 'Public Works Department',
      'Parks & Recreation': 'Parks & Recreation Department',
      'Traffic': 'Traffic Management',
      'Public Safety': 'Public Safety Department',
      'Environment': 'Environmental Services'
    };
    return departmentMap[category] || 'Municipal Services';
  };


  const handlePrevious = () => {
    setActiveIndex((prev) => prev === 0 ? resolvedIssues?.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setActiveIndex((prev) => prev === resolvedIssues?.length - 1 ? 0 : prev + 1);
  };

  const activeIssue = resolvedIssues?.[activeIndex];

  return (
    <section className="bg-muted/30 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Recent Success Stories
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            See how reported issues are being resolved to improve our community
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2 bg-red-50 px-4 py-2 rounded-lg inline-block">
              {error} - Showing example content
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-xl border border-border shadow-elevation-2 overflow-hidden animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative aspect-[4/3] lg:aspect-auto bg-gray-200"></div>
                <div className="p-6 md:p-8">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : resolvedIssues.length > 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-elevation-2 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative aspect-[4/3] lg:aspect-auto">
                <div className="absolute inset-0 grid grid-cols-2 gap-0">
                  <div className="relative overflow-hidden">
                    <div className="absolute top-2 left-2 z-10 bg-error/90 text-error-foreground px-2 py-1 rounded text-xs font-medium">
                      Before
                    </div>
                    <Image
                      src={activeIssue?.beforeImage}
                      alt={activeIssue?.beforeImageAlt}
                      className="w-full h-full object-cover" />

                  </div>
                  <div className="relative overflow-hidden">
                    <div className="absolute top-2 left-2 z-10 bg-success/90 text-success-foreground px-2 py-1 rounded text-xs font-medium">
                      After
                    </div>
                    <Image
                      src={activeIssue?.afterImage}
                      alt={activeIssue?.afterImageAlt}
                      className="w-full h-full object-cover" />

                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <IssueStatusIndicator status="resolved" size="default" />
                  <span className="text-xs text-muted-foreground">
                    Resolved in {activeIssue?.resolutionTime}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  {activeIssue?.title}
                </h3>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Tag" size={16} />
                    <span>{activeIssue?.category}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="MapPin" size={16} />
                    <span className="line-clamp-1">{activeIssue?.location}</span>
                  </div>
                </div>

                <p className="text-sm md:text-base text-muted-foreground mb-6 flex-grow">
                  {activeIssue?.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reported</span>
                    <span className="font-medium text-foreground">
                      {new Date(activeIssue.reportedDate)?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium text-foreground">
                      {new Date(activeIssue.resolvedDate)?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Authority</span>
                    <span className="font-medium text-foreground">{activeIssue?.authority}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-1">
                    {resolvedIssues?.map((_, index) =>
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-2 h-2 rounded-full transition-smooth ${
                      index === activeIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`
                      }
                      aria-label={`View issue ${index + 1}`} />

                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      iconName="ChevronLeft"
                      iconPosition="left"
                      iconSize={16}>

                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      iconName="ChevronRight"
                      iconPosition="right"
                      iconSize={16}>

                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto text-center">
            <div className="bg-card rounded-xl border border-border shadow-elevation-2 p-8 md:p-12">
              <Icon name="CheckCircle" size={48} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Building Success Stories Together
              </h3>
              <p className="text-muted-foreground mb-6">
                Success stories will appear here as issues get resolved. Be the first to make a difference!
              </p>
              <Button 
                onClick={() => window.location.href = '/report-issue'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Report Your First Issue
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>);

};

export default ResolvedIssuesPreview;