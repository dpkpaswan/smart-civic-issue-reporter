import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  isMobileOpen,
  onMobileClose 
}) => {
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'sanitation', label: 'Sanitation & Waste' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'parks', label: 'Parks & Recreation' },
    { value: 'safety', label: 'Public Safety' },
    { value: 'other', label: 'Other Issues' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'status', label: 'By Status' },
    { value: 'category', label: 'By Category' }
  ];

  const hasActiveFilters = 
    filters?.category !== 'all' || 
    filters?.status !== 'all' || 
    filters?.search !== '' ||
    filters?.sortBy !== 'newest';

  const panelContent = (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Icon name="Filter" size={20} />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
            iconSize={16}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search Issues
          </label>
          <div className="relative">
            <Icon 
              name="Search" 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            />
            <input
              type="text"
              placeholder="Search by location, description..."
              value={filters?.search}
              onChange={(e) => onFilterChange('search', e?.target?.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
          </div>
        </div>

        <Select
          label="Category"
          options={categoryOptions}
          value={filters?.category}
          onChange={(value) => onFilterChange('category', value)}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />

        <Select
          label="Sort By"
          options={sortOptions}
          value={filters?.sortBy}
          onChange={(value) => onFilterChange('sortBy', value)}
        />
      </div>
    </div>
  );

  if (isMobileOpen) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border shadow-elevation-4 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              <button
                onClick={onMobileClose}
                className="p-2 hover:bg-muted rounded-md transition-smooth"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            {panelContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block bg-card rounded-lg border border-border p-5">
      {panelContent}
    </div>
  );
};

export default FilterPanel;