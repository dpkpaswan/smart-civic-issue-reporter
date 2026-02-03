import React from 'react';
import Icon from '../AppIcon';

const ProgressWorkflowIndicator = ({ 
  currentStep = 1,
  steps = [],
  orientation = 'horizontal',
  className = ''
}) => {
  const defaultSteps = [
    { label: 'Report Details', icon: 'FileText' },
    { label: 'Location & Photos', icon: 'MapPin' },
    { label: 'Review & Submit', icon: 'CheckCircle' }
  ];

  const workflowSteps = steps?.length > 0 ? steps : defaultSteps;

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-success border-success',
          icon: 'text-success-foreground',
          label: 'text-success font-medium',
          line: 'bg-success'
        };
      case 'current':
        return {
          circle: 'bg-primary border-primary',
          icon: 'text-primary-foreground',
          label: 'text-primary font-semibold',
          line: 'bg-border'
        };
      default:
        return {
          circle: 'bg-muted border-border',
          icon: 'text-muted-foreground',
          label: 'text-muted-foreground',
          line: 'bg-border'
        };
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col gap-4 ${className}`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={workflowSteps?.length}>
        {workflowSteps?.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const styles = getStepStyles(status);
          const isLast = index === workflowSteps?.length - 1;

          return (
            <div key={stepNumber} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                  transition-smooth ${styles?.circle}
                `}>
                  {status === 'completed' ? (
                    <Icon name="Check" size={20} className={styles?.icon} />
                  ) : (
                    <Icon name={step?.icon} size={20} className={styles?.icon} />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 mt-2 ${styles?.line} transition-smooth`} />
                )}
              </div>
              <div className="flex-1 pt-2">
                <p className={`text-sm ${styles?.label} transition-smooth`}>
                  {step?.label}
                </p>
                {step?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step?.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={workflowSteps?.length}>
      <div className="flex items-center justify-between">
        {workflowSteps?.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const styles = getStepStyles(status);
          const isLast = index === workflowSteps?.length - 1;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`
                  w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 flex items-center justify-center
                  transition-smooth ${styles?.circle}
                `}>
                  {status === 'completed' ? (
                    <Icon name="Check" size={20} className={styles?.icon} />
                  ) : (
                    <Icon name={step?.icon} size={20} className={styles?.icon} />
                  )}
                </div>
                <p className={`text-xs lg:text-sm text-center ${styles?.label} transition-smooth hidden sm:block`}>
                  {step?.label}
                </p>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-2 ${styles?.line} transition-smooth`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="sm:hidden mt-3 text-center">
        <p className={`text-sm ${getStepStyles(getStepStatus(currentStep))?.label}`}>
          {workflowSteps?.[currentStep - 1]?.label}
        </p>
      </div>
    </div>
  );
};

export default ProgressWorkflowIndicator;