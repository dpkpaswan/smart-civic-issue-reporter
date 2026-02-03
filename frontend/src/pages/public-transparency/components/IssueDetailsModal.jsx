import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';

const IssueDetailsModal = ({ issue, onClose }) => {
  if (!issue) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseTime = () => {
    if (!issue?.resolvedDate) return null;
    const submitted = new Date(issue.submittedDate);
    const resolved = new Date(issue.resolvedDate);
    const diffTime = Math.abs(resolved - submitted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const responseTime = getResponseTime();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-lg border border-border shadow-elevation-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground">Issue Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="space-y-6">
            <div className="aspect-[16/9] relative overflow-hidden rounded-lg bg-muted">
              <Image
                src={issue?.image}
                alt={issue?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                  {issue?.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-md">
                    <Icon name={issue?.categoryIcon} size={16} />
                    {issue?.category}
                  </span>
                  <IssueStatusIndicator status={issue?.status} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Icon name="FileText" size={16} />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue?.description}
                </p>
              </div>

              <LocationDisplay
                address={issue?.location}
                coordinates={issue?.coordinates}
                variant="full"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={16} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Submitted</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(issue?.submittedDate)}
                  </p>
                </div>

                {issue?.resolvedDate && (
                  <div className="bg-success/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="CheckCircle" size={16} className="text-success" />
                      <span className="text-xs font-medium text-success">Resolved</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(issue?.resolvedDate)}
                    </p>
                  </div>
                )}
              </div>

              {responseTime && (
                <div className="bg-accent/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Clock" size={16} className="text-accent" />
                    <span className="text-xs font-medium text-accent">Response Time</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {responseTime} {responseTime === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}

              {issue?.authorityResponse && (
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Icon name="MessageSquare" size={16} />
                    Authority Response
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {issue?.authorityResponse}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            fullWidth
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;