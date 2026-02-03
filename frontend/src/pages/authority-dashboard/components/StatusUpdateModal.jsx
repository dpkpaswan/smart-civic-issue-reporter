import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { LoadingButton } from '../../../components/ui/Loading';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const StatusUpdateModal = ({ issue, onClose, onUpdate, isUpdating = false }) => {
  const [status, setStatus] = useState(issue?.status || 'submitted');
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    onUpdate(issue?.id, status, notes);
    onClose();
  };

  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-elevation-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Update Issue Status
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
            label="New Status"
            description="Select the updated status for this issue"
            options={statusOptions}
            value={status}
            onChange={setStatus}
            required
          />

          <Input
            label="Resolution Notes"
            description="Add notes about the status update (optional)"
            type="text"
            placeholder="Enter notes about this update..."
            value={notes}
            onChange={(e) => setNotes(e?.target?.value)}
            className="h-24"
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
              iconName="Check"
              iconPosition="left"
              iconSize={18}
              fullWidth
              isLoading={isUpdating}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;