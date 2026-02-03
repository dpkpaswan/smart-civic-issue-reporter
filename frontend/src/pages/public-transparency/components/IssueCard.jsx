import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';

const IssueCard = ({ issue, onViewDetails }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-elevation-2 transition-smooth hover-lift animate-fade-in-up animate-gpu">
      <div className="aspect-[16/9] relative overflow-hidden bg-muted">
        <Image
          src={issue?.image}
          alt={issue?.imageAlt}
          className="w-full h-full object-cover hover-scale transition-all duration-500"
        />
        <div className="absolute top-3 right-3 animate-slide-in-right">
          <IssueStatusIndicator status={issue?.status} size="sm" />
        </div>
      </div>
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-1 line-clamp-2">
              {issue?.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                <Icon name={issue?.categoryIcon} size={14} />
                {issue?.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {getDaysAgo(issue?.submittedDate)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {issue?.description}
        </p>

        <LocationDisplay
          address={issue?.location}
          coordinates={issue?.coordinates}
          variant="compact"
          className="mb-4"
        />

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Submitted</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(issue?.submittedDate)}
            </span>
          </div>
          
          {issue?.resolvedDate && (
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs text-muted-foreground">Resolved</span>
              <span className="text-sm font-medium text-success">
                {formatDate(issue?.resolvedDate)}
              </span>
            </div>
          )}
          
          <button
            onClick={() => onViewDetails(issue)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-smooth"
          >
            View Details
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;