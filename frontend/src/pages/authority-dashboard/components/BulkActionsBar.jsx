import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const bulkActionOptions = [
    { value: '', label: t('bulkActions.selectAction'), disabled: true },
    { value: 'in-progress', label: t('bulkActions.markInProgress') },
    { value: 'resolved', label: t('bulkActions.markResolved') },
    { value: 'high', label: t('bulkActions.setHighPriority') },
    { value: 'medium', label: t('bulkActions.setMediumPriority') },
    { value: 'low', label: t('bulkActions.setLowPriority') }
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
            label={t('bulkActions.ofSelected', { selected: selectedCount, total: totalCount })}
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
            {t('bulkActions.clearSelection')}
          </Button>
        </div>

        <div className="flex items-end gap-3 w-full lg:w-auto">
          <Select
            label={t('bulkActions.bulkAction')}
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
            {t('bulkActions.apply')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;