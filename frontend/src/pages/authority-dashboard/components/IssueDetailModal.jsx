import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import IssueStatusIndicator from '../../../components/ui/IssueStatusIndicator';
import LocationDisplay from '../../../components/ui/LocationDisplay';

const IssueDetailModal = ({ issue, onClose, onStatusChange, onPriorityChange }) => {
  if (!issue) return null;

  const priorityConfig = {
    high: { color: 'text-error', bg: 'bg-error/10', label: 'High Priority' },
    medium: { color: 'text-warning', bg: 'bg-warning/10', label: 'Medium Priority' },
    low: { color: 'text-success', bg: 'bg-success/10', label: 'Low Priority' }
  };

  const priority = priorityConfig?.[issue?.priority] || priorityConfig?.medium;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card rounded-lg border border-border shadow-elevation-4 w-full max-w-3xl my-8">
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Issue Details
            </h2>
            <span className="text-sm text-muted-foreground">
              #{issue?.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-full md:w-64 h-64 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={issue?.image}
                alt={issue?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {issue?.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <IssueStatusIndicator status={issue?.status} />
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${priority?.bg} ${priority?.color} text-sm font-medium`}>
                  <Icon name="AlertCircle" size={16} />
                  {priority?.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/10 text-secondary text-sm font-medium">
                  <Icon name={issue?.categoryIcon} size={16} />
                  {issue?.category}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="Calendar" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Submission Details
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Submitted On</p>
                  <p className="text-sm text-foreground font-medium">
                    {formatDate(issue?.submittedDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reporter ID</p>
                  <p className="text-sm text-foreground font-medium font-mono">
                    {issue?.reporterId}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="Users" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Assignment
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm text-foreground font-medium">
                    {issue?.department || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-sm text-foreground font-medium">
                    {issue?.assignedTo || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <LocationDisplay
            address={issue?.location}
            coordinates={issue?.coordinates}
            variant="full"
          />

          {issue?.notes && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon name="FileText" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Resolution Notes
                </span>
              </div>
              <p className="text-sm text-foreground">
                {issue?.notes}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                onStatusChange(issue?.id);
                onClose();
              }}
              iconName="Edit"
              iconPosition="left"
              iconSize={18}
              fullWidth
            >
              Update Status
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onPriorityChange(issue?.id);
                onClose();
              }}
              iconName="Flag"
              iconPosition="left"
              iconSize={18}
              fullWidth
            >
              Change Priority
            </Button>
            <Button
              variant="default"
              onClick={onClose}
              fullWidth
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;