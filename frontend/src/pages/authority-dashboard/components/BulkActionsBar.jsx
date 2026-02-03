import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const BulkActionsBar = ({ 
  selectedCount, 
  totalCount,
  allSelected,
  onSelectAll, 
  onBulkAction,
  onClearSelection 
}) => {
  const bulkActionOptions = [
    { value: '', label: 'Select Action', disabled: true },
    { value: 'in-progress', label: 'Mark as In Progress' },
    { value: 'resolved', label: 'Mark as Resolved' },
    { value: 'high', label: 'Set Priority: High' },
    { value: 'medium', label: 'Set Priority: Medium' },
    { value: 'low', label: 'Set Priority: Low' }
  ];

  const [selectedAction, setSelectedAction] = React.useState('');

  const handleApplyAction = () => {
    if (selectedAction && selectedCount > 0) {
      onBulkAction(selectedAction);
      setSelectedAction('');
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 md:p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Checkbox
            checked={allSelected}
            onChange={onSelectAll}
            label={`${selectedCount} of ${totalCount} selected`}
            className="font-medium"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
            iconPosition="left"
            iconSize={16}
          >
            Clear Selection
          </Button>
        </div>

        <div className="flex items-end gap-3 w-full lg:w-auto">
          <Select
            label="Bulk Action"
            options={bulkActionOptions}
            value={selectedAction}
            onChange={setSelectedAction}
            className="flex-1 lg:w-64"
          />
          <Button
            variant="default"
            onClick={handleApplyAction}
            disabled={!selectedAction}
            iconName="Check"
            iconPosition="left"
            iconSize={18}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;