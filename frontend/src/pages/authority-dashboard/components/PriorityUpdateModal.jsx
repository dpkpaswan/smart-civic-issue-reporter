import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { LoadingButton } from '../../../components/ui/Loading';
import Select from '../../../components/ui/Select';

const PriorityUpdateModal = ({ issue, onClose, onUpdate, isUpdating = false }) => {
  const [priority, setPriority] = useState(issue?.priority || 'medium');

  const priorityOptions = [
    { 
      value: 'high', 
      label: 'High Priority',
      description: 'Requires immediate attention'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority',
      description: 'Standard processing time'
    },
    { 
      value: 'low', 
      label: 'Low Priority',
      description: 'Can be addressed later'
    }
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    onUpdate(issue?.id, priority);
    onClose();
  };

  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-elevation-4 w-full max-w-md">
        <div className="border-b border-border p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Update Priority
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Issue #{issue?.id}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {issue?.description}
            </p>
          </div>

          <Select
            label="Priority Level"
            description="Set the priority level for this issue"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            required
          />

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="default"
              iconName="Flag"
              iconPosition="left"
              iconSize={18}
              fullWidth
              isLoading={isUpdating}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Priority'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriorityUpdateModal;