import React from 'react';
import Icon from '../../../components/AppIcon';

const DescriptionInput = ({ value, onChange, maxLength = 500 }) => {
  const remainingChars = maxLength - (value?.length || 0);
  const isNearLimit = remainingChars < 50;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">
            Additional Details
            <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Provide any additional context about the issue
          </p>
        </div>
        <div className={`
          text-xs font-medium px-2 py-1 rounded-md
          ${isNearLimit 
            ? 'bg-warning/10 text-warning' :'bg-muted text-muted-foreground'
          }
        `}>
          {remainingChars} left
        </div>
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            if (e?.target?.value?.length <= maxLength) {
              onChange(e?.target?.value);
            }
          }}
          placeholder="Describe the issue in detail. Include any relevant information like when you first noticed it, how severe it is, or any safety concerns..."
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-smooth"
          rows={6}
          maxLength={maxLength}
        />
        
        {!value && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-muted-foreground pointer-events-none">
            <Icon name="Info" size={16} />
            <span className="text-xs">This field is optional but helps authorities understand the issue better</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onChange((value || '') + '\n\nSafety Concern: ')}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="AlertTriangle" size={14} />
          Add Safety Note
        </button>
        <button
          onClick={() => onChange((value || '') + '\n\nFirst Noticed: ')}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="Clock" size={14} />
          Add Timeline
        </button>
        <button
          onClick={() => onChange((value || '') + '\n\nAffected Area: ')}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="MapPin" size={14} />
          Add Area Info
        </button>
      </div>
    </div>
  );
};

export default DescriptionInput;