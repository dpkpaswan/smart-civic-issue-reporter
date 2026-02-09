import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import Button from '../../../components/ui/Button';
import { issuesApi } from '../../../utils/api';

const AUTO_REFRESH_MS = 30000;
const AUTO_SLIDE_MS = 4000;

const ResolvedIssuesPreview = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideRef = useRef(null);
  const autoRefreshRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────
  const calculateResolutionTime = (reportedDate, resolvedDate) => {
    if (!reportedDate || !resolvedDate) return 'N/A';
    const diffMs = Math.abs(new Date(resolvedDate) - new Date(reportedDate));
    const days = Math.ceil(diffMs / 86400000);
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getDepartmentByCategory = (category) => {
    const map = {
      pothole: 'Public Works Dept', garbage: 'Sanitation Dept',
      streetlight: 'Electrical Services', graffiti: 'Municipal Services',
      water: 'Water Department', traffic: 'Traffic Management',
      sidewalk: 'Public Works Dept', other: 'Municipal Services'
    };
    return map[category?.toLowerCase()] || 'Municipal Services';
  };

  const getCategoryIcon = (category) => {
    const map = {
      pothole: 'Construction', garbage: 'Trash2', streetlight: 'Lightbulb',
      graffiti: 'PaintBucket', water: 'Droplet', traffic: 'Car',
      sidewalk: 'Footprints', other: 'AlertTriangle'
    };
    return map[category?.toLowerCase()] || 'AlertTriangle';
  };

  // ── data fetching ────────────────────────────────────────
  const loadResolvedIssues = useCallback(async (silent = false) => {
    try {
      if (!silent) { setIsLoading(true); setError(null); }

      // Try the dedicated success stories API first
      let stories = [];
      try {
        const storiesResponse = await issuesApi.getSuccessStories(10);
        if (storiesResponse.success && storiesResponse.data?.length > 0) {
          stories = storiesResponse.data.map(story => ({
            id: story.id,
            title: story.description?.substring(0, 60) + (story.description?.length > 60 ? '...' : '') || 'Issue Resolved',
            category: story.category || 'other',
            categoryIcon: getCategoryIcon(story.category),
            location: typeof story.location === 'string'
              ? story.location
              : (story.location?.address || 'Location not specified'),
            reportedDate: story.reportedDate,
            resolvedDate: story.resolvedDate,
            resolutionTime: calculateResolutionTime(story.reportedDate, story.resolvedDate),
            beforeImage: story.beforeImage,
            afterImage: story.afterImage,
            hasRealImages: true,
            description: story.resolutionNotes || `${story.category} issue resolved successfully.`,
            authority: story.authority || getDepartmentByCategory(story.category),
            department: story.department,
            impact: story.priority || 'medium'
          }));
        }
      } catch (apiError) {
        console.warn('Success stories API not available, falling back to issues API:', apiError.message);
      }

      // Fallback: use general issues API if success stories endpoint returned nothing
      if (stories.length === 0) {
        const response = await issuesApi.getAll();
        if (response.success) {
          stories = response.data
            .filter(issue => issue.status === 'resolved')
            .slice(0, 10)
            .map(issue => {
              const hasAfterImage = issue.resolutionImages?.length > 0;
              return {
                id: issue.id,
                title: issue.description?.substring(0, 60) + (issue.description?.length > 60 ? '...' : '') || 'Issue Resolved',
                category: issue.category || 'other',
                categoryIcon: getCategoryIcon(issue.category),
                location: typeof issue.location === 'string'
                  ? issue.location
                  : (issue.location?.address || 'Location not specified'),
                reportedDate: issue.createdAt,
                resolvedDate: issue.updatedAt,
                resolutionTime: calculateResolutionTime(issue.createdAt, issue.updatedAt),
                beforeImage: issue.images?.[0] || null,
                afterImage: hasAfterImage ? issue.resolutionImages[0] : null,
                hasRealImages: !!(issue.images?.[0] && hasAfterImage),
                description: issue.resolutionNotes || `${issue.category} issue resolved successfully.`,
                authority: getDepartmentByCategory(issue.category),
                department: null,
                impact: issue.priority || 'medium'
              };
            })
            .sort((a, b) => new Date(b.resolvedDate) - new Date(a.resolvedDate));
        }
      }

      if (stories.length === 0) {
        setResolvedIssues(getPlaceholderData());
      } else {
        setResolvedIssues(stories);
      }
    } catch (err) {
      console.error('Error loading resolved issues:', err);
      if (!silent) setError(t('resolved.unableToLoad'));
      setResolvedIssues(prev => prev.length > 0 ? prev : getPlaceholderData());
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const getPlaceholderData = () => ([
    {
      id: 'p1', title: 'Building a Better Community',
      category: 'Community', categoryIcon: 'Heart', location: 'Your City',
      reportedDate: new Date().toISOString(), resolvedDate: new Date().toISOString(),
      resolutionTime: 'Ongoing', hasRealImages: false,
      beforeImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600',
      afterImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=600',
      description: 'Your reports make a difference! Be the first to help improve our community.',
      authority: 'Community Services', department: null, impact: 'high'
    },
    {
      id: 'p2', title: 'Cleaner Streets Initiative',
      category: 'garbage', categoryIcon: 'Trash2', location: 'Downtown Area',
      reportedDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      resolvedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      resolutionTime: '3 days', hasRealImages: false,
      beforeImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600',
      afterImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=600',
      description: 'Street waste removal completed as part of community clean-up.',
      authority: 'Sanitation Dept', department: null, impact: 'medium'
    },
    {
      id: 'p3', title: 'Road Repair Completed',
      category: 'pothole', categoryIcon: 'Construction', location: 'Main Street',
      reportedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      resolvedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      resolutionTime: '6 days', hasRealImages: false,
      beforeImage: 'https://images.unsplash.com/photo-1515960877911-2d44c64fc7e0?q=80&w=600',
      afterImage: 'https://images.unsplash.com/photo-1515960877911-2d44c64fc7e0?q=80&w=600',
      description: 'Pothole on Main Street repaired, improving road safety for all.',
      authority: 'Public Works Dept', department: null, impact: 'high'
    }
  ]);

  // Initial load
  useEffect(() => { loadResolvedIssues(); }, [loadResolvedIssues]);

  // Auto-refresh every 30s
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => loadResolvedIssues(true), AUTO_REFRESH_MS);
    return () => clearInterval(autoRefreshRef.current);
  }, [loadResolvedIssues]);

  // ── auto-slide ───────────────────────────────────────────
  const slideCount = resolvedIssues.length;

  const goTo = useCallback((idx) => setActiveIndex(idx), []);
  const goNext = useCallback(() => setActiveIndex(prev => (prev + 1) % slideCount), [slideCount]);
  const goPrev = useCallback(() => setActiveIndex(prev => (prev - 1 + slideCount) % slideCount), [slideCount]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    autoSlideRef.current = setInterval(goNext, AUTO_SLIDE_MS);
    return () => clearInterval(autoSlideRef.current);
  }, [isPaused, goNext, slideCount]);

  // ── render helpers ───────────────────────────────────────
  const priorityStyle = (p) => {
    const s = {
      high: 'bg-red-100 text-red-700', critical: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700'
    };
    return s[p?.toLowerCase()] || s.medium;
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const visibleCards = typeof window !== 'undefined'
    ? (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1)
    : 3;
  const maxIndex = Math.max(0, slideCount - visibleCards);
  const clampedIndex = Math.min(activeIndex, maxIndex);

  // ── render ───────────────────────────────────────────────
  return (
    <section className="bg-muted/30 py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {t('resolved.title')}
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('resolved.subtitle')}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2 bg-red-50 px-4 py-2 rounded-lg inline-block">
              {error} {t('resolved.exampleContent')}
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="grid grid-cols-2 h-48">
                  <div className="bg-gray-200" />
                  <div className="bg-gray-200" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>

        ) : resolvedIssues.length > 0 ? (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Carousel */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${clampedIndex * (100 / visibleCards)}%)` }}
              >
                {resolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / visibleCards}%` }}
                  >
                    <div className="bg-card rounded-xl border border-border shadow-elevation-2 overflow-hidden h-full flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
                      {/* ── Before / After Image Panel ── */}
                      <div className="grid grid-cols-2 h-48 md:h-52 relative">
                        {/* BEFORE image */}
                        <div className="relative overflow-hidden">
                          <span className="absolute top-2 left-2 z-10 bg-red-500/90 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                            {t('resolved.before')}
                          </span>
                          <Image
                            src={issue.beforeImage}
                            alt={`Before: ${issue.title}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Dark gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Divider line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/60 z-10 shadow-sm" />

                        {/* AFTER image */}
                        <div className="relative overflow-hidden">
                          <span className="absolute top-2 left-2 z-10 bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                            {t('resolved.after')}
                          </span>
                          <Image
                            src={issue.afterImage}
                            alt={`After: ${issue.title}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Verified badge overlay */}
                        {issue.hasRealImages && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                            <Icon name="CheckCircle" size={12} />
                            {t('resolved.verified')}
                          </div>
                        )}
                      </div>

                      {/* ── Card body ── */}
                      <div className="p-4 md:p-5 flex flex-col flex-grow">
                        {/* Status + priority + category */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <IssueStatusIndicator status="resolved" size="sm" />
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-md">
                              <Icon name={issue.categoryIcon || 'Tag'} size={11} />
                              {issue.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyle(issue.impact)}`}>
                              {issue.impact}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2 leading-snug">
                          {issue.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Icon name="MapPin" size={12} />
                          <span className="line-clamp-1">{issue.location}</span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                          {issue.description}
                        </p>

                        {/* Timeline + Authority footer */}
                        <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('resolved.reported')}</span>
                            <span className="font-medium text-foreground">{formatDate(issue.reportedDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('resolved.resolvedLabel')}</span>
                            <span className="font-medium text-foreground">{formatDate(issue.resolvedDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('resolved.resolutionTime')}</span>
                            <span className="font-medium text-emerald-600">{issue.resolutionTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('resolved.authority')}</span>
                            <span className="font-medium text-foreground truncate max-w-[160px]">{issue.authority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button variant="outline" size="sm" onClick={goPrev}
                iconName="ChevronLeft" iconPosition="left" iconSize={16}
              >
                {t('resolved.prev')}
              </Button>

              <div className="flex items-center gap-1.5">
                {resolvedIssues.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === clampedIndex
                        ? 'w-7 h-2.5 bg-primary'
                        : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={goNext}
                iconName="ChevronRight" iconPosition="right" iconSize={16}
              >
                {t('resolved.next')}
              </Button>
            </div>

            {isPaused && (
              <p className="text-center text-[11px] text-muted-foreground mt-2 select-none animate-fade-in">
                <Icon name="Pause" size={12} className="inline mr-1 -mt-0.5" />
                {t('resolved.autoSlidePaused')}
              </p>
            )}
          </div>

        ) : (
          /* Empty state */
          <div className="max-w-md mx-auto text-center">
            <div className="bg-card rounded-xl border border-border shadow-elevation-2 p-8 md:p-12">
              <Icon name="CheckCircle" size={48} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('resolved.buildingStories')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('resolved.storiesWillAppear')}
              </p>
              <Button onClick={() => (window.location.href = '/report-issue')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {t('resolved.reportFirst')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResolvedIssuesPreview;