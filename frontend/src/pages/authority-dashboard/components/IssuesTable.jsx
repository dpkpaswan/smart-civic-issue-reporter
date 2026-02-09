import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import IssueTableRow from './IssueTableRow';
import { Checkbox } from '../../../components/ui/Checkbox';

const IssuesTable = ({ 
  issues, 
  selectedIssues,
  allSelected,
  onSelectAll,
  onSelectIssue,
  onStatusChange,
  onPriorityChange,
  onViewDetails,
  sortConfig,
  onSort
}) => {
  const { t } = useTranslation();

  const columns = [
    { key: 'select', label: '', sortable: false },
    { key: 'image', label: t('issuesTable.image'), sortable: false },
    { key: 'description', label: t('issuesTable.description'), sortable: true },
    { key: 'category', label: t('issuesTable.category'), sortable: true },
    { key: 'priority', label: t('issuesTable.priority'), sortable: true },
    { key: 'severityLevel', label: t('issuesTable.severity'), sortable: true },
    { key: 'department', label: t('issuesTable.deptAssigned'), sortable: true },
    { key: 'slaDeadline', label: t('issuesTable.sla'), sortable: true },
    { key: 'submittedDate', label: t('issuesTable.submitted'), sortable: true },
    { key: 'status', label: t('issuesTable.status'), sortable: true },
    { key: 'actions', label: t('issuesTable.actions'), sortable: false }
  ];

  const handleSort = (key) => {
    if (!columns?.find(col => col?.key === key)?.sortable) return;
    onSort(key);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return 'ChevronsUpDown';
    return sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown';
  };

  if (issues?.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 md:p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Inbox" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
            {t('issuesTable.noIssuesFound')}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('issuesTable.noIssuesHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns?.map((column) => (
                <th
                  key={column?.key}
                  className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {column?.key === 'select' ? (
                    <Checkbox
                      checked={allSelected}
                      onChange={onSelectAll}
                    />
                  ) : (
                    <button
                      onClick={() => handleSort(column?.key)}
                      disabled={!column?.sortable}
                      className={`
                        flex items-center gap-2 transition-smooth
                        ${column?.sortable ? 'hover:text-foreground cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      {column?.label}
                      {column?.sortable && (
                        <Icon 
                          name={getSortIcon(column?.key)} 
                          size={14}
                          className={sortConfig?.key === column?.key ? 'text-primary' : ''}
                        />
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues?.map((issue) => (
              <IssueTableRow
                key={issue?.id}
                issue={issue}
                isSelected={selectedIssues?.includes(issue?.id)}
                onSelect={onSelectIssue}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onViewDetails={onViewDetails}
                variant="desktop"
              />
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card List */}
      <div className="lg:hidden p-4">
        {issues?.map((issue) => (
          <IssueTableRow
            key={issue?.id}
            issue={issue}
            isSelected={selectedIssues?.includes(issue?.id)}
            onSelect={onSelectIssue}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onViewDetails={onViewDetails}
            variant="mobile"
          />
        ))}
      </div>
    </div>
  );
};

export default IssuesTable;