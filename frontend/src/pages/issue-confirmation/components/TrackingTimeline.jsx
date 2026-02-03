import React from 'react';
import Icon from '../../../components/AppIcon';

const TrackingTimeline = ({ estimatedResolutionDays }) => {
  const timelineSteps = [
    {
      icon: 'CheckCircle',
      title: 'Issue Submitted',
      description: 'Your report has been received and logged in our system',
      status: 'completed',
      time: 'Just now'
    },
    {
      icon: 'Eye',
      title: 'Under Review',
      description: 'Local authorities are reviewing your submission',
      status: 'current',
      time: 'Within 24 hours'
    },
    {
      icon: 'Wrench',
      title: 'In Progress',
      description: 'Work will begin once review is complete',
      status: 'upcoming',
      time: `2-3 days`
    },
    {
      icon: 'CheckCircle2',
      title: 'Resolved',
      description: 'Issue will be marked as resolved with documentation',
      status: 'upcoming',
      time: `${estimatedResolutionDays} days`
    }
  ];

  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-success border-success',
          icon: 'text-success-foreground',
          title: 'text-success',
          line: 'bg-success'
        };
      case 'current':
        return {
          circle: 'bg-primary border-primary',
          icon: 'text-primary-foreground',
          title: 'text-primary',
          line: 'bg-border'
        };
      default:
        return {
          circle: 'bg-muted border-border',
          icon: 'text-muted-foreground',
          title: 'text-muted-foreground',
          line: 'bg-border'
        };
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-5 lg:p-6 shadow-elevation-1">
      <div className="flex items-center gap-2 mb-4 md:mb-5 lg:mb-6">
        <Icon name="Clock" size={20} className="text-primary md:w-6 md:h-6" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
          Resolution Timeline
        </h2>
      </div>
      <div className="space-y-4 md:space-y-5 lg:space-y-6">
        {timelineSteps?.map((step, index) => {
          const styles = getStepStyles(step?.status);
          const isLast = index === timelineSteps?.length - 1;

          return (
            <div key={index} className="flex gap-3 md:gap-4">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center
                  transition-smooth ${styles?.circle}
                `}>
                  <Icon name={step?.icon} size={20} className={`${styles?.icon} md:w-6 md:h-6`} />
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 md:h-16 mt-2 ${styles?.line} transition-smooth`} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`text-sm md:text-base lg:text-lg font-semibold ${styles?.title}`}>
                    {step?.title}
                  </h3>
                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    {step?.time}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {step?.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 md:mt-5 lg:mt-6 p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={18} className="text-primary flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
          <p className="text-xs md:text-sm text-foreground">
            Estimated resolution time: <span className="font-semibold">{estimatedResolutionDays} days</span>. 
            You'll receive updates at each stage via the public transparency dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;