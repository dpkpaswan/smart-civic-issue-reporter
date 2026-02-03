import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({ filters, onFilterChange, onReset, resultCount }) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'road', label: 'Road & Infrastructure' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'waste', label: 'Waste Management' },
    { value: 'street-light', label: 'Street Lighting' },
    { value: 'drainage', label: 'Drainage' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          Filter Issues
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            iconName="RotateCcw"
            iconPosition="left"
            iconSize={16}
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          className="w-full"
        />

        <Select
          label="Category"
          options={categoryOptions}
          value={filters?.category}
          onChange={(value) => onFilterChange('category', value)}
          className="w-full"
        />

        <Select
          label="Priority"
          options={priorityOptions}
          value={filters?.priority}
          onChange={(value) => onFilterChange('priority', value)}
          className="w-full"
        />

        <Input
          label="Search Location"
          type="search"
          placeholder="Enter location..."
          value={filters?.location}
          onChange={(e) => onFilterChange('location', e?.target?.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="From Date"
          type="date"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
        />

        <Input
          label="To Date"
          type="date"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
        />
      </div>
    </div>
  );
};

export default FilterControls;