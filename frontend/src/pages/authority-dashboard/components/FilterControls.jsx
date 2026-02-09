import React from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({ filters, onFilterChange, onReset, resultCount }) => {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'all', label: t('filterControls.allStatuses') },
    { value: 'submitted', label: t('filterControls.submitted') },
    { value: 'in-progress', label: t('filterControls.inProgress') },
    { value: 'resolved', label: t('filterControls.resolved') }
  ];

  const categoryOptions = [
    { value: 'all', label: t('filterControls.allCategories') },
    { value: 'road', label: t('filterControls.road') },
    { value: 'water', label: t('filterControls.waterSupply') },
    { value: 'electricity', label: t('filterControls.electricity') },
    { value: 'waste', label: t('filterControls.waste') },
    { value: 'street-light', label: t('filterControls.streetLighting') },
    { value: 'drainage', label: t('filterControls.drainage') },
    { value: 'other', label: t('filterControls.other') }
  ];

  const priorityOptions = [
    { value: 'all', label: t('filterControls.allPriorities') },
    { value: 'high', label: t('filterControls.highPriority') },
    { value: 'medium', label: t('filterControls.mediumPriority') },
    { value: 'low', label: t('filterControls.lowPriority') }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          {t('filterControls.filterIssues')}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? t('filterControls.result') : t('filterControls.results')}
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
          label={t('issuesTable.status')}
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          className="w-full"
        />

        <Select
          label={t('issuesTable.category')}
          options={categoryOptions}
          value={filters?.category}
          onChange={(value) => onFilterChange('category', value)}
          className="w-full"
        />

        <Select
          label={t('issuesTable.priority')}
          options={priorityOptions}
          value={filters?.priority}
          onChange={(value) => onFilterChange('priority', value)}
          className="w-full"
        />

        <Input
          label={t('filterControls.searchLocation')}
          type="search"
          placeholder={t('filterControls.enterLocation')}
          value={filters?.location}
          onChange={(e) => onFilterChange('location', e?.target?.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('filterControls.fromDate')}
          type="date"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
        />

        <Input
          label={t('filterControls.toDate')}
          type="date"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
        />
      </div>
    </div>
  );
};

export default FilterControls;