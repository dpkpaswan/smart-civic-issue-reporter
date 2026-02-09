import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const DescriptionInput = ({ value, onChange, maxLength = 500 }) => {
  const { t } = useTranslation();
  const remainingChars = maxLength - (value?.length || 0);
  const isNearLimit = remainingChars < 50;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">
            {t('description.title')}
            <span className="text-sm font-normal text-muted-foreground ml-2">{t('description.optional')}</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description.provide')}
          </p>
        </div>
        <div className={`
          text-xs font-medium px-2 py-1 rounded-md
          ${isNearLimit 
            ? 'bg-warning/10 text-warning' :'bg-muted text-muted-foreground'
          }
        `}>
          {remainingChars}{t('description.charsLeft')}
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
          placeholder={t('description.placeholder')}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-smooth"
          rows={6}
          maxLength={maxLength}
        />
        
        {!value && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-muted-foreground pointer-events-none">
            <Icon name="Info" size={16} />
            <span className="text-xs">{t('description.helpText')}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onChange((value || '') + t('description.safetyConcern'))}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="AlertTriangle" size={14} />
          {t('description.addSafety')}
        </button>
        <button
          onClick={() => onChange((value || '') + t('description.addTimeline'))}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="Clock" size={14} />
          {t('description.addTimeline')}
        </button>
        <button
          onClick={() => onChange((value || '') + t('description.affectedArea'))}
          className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm text-foreground transition-smooth flex items-center gap-1.5"
        >
          <Icon name="MapPin" size={14} />
          {t('description.addAreaInfo')}
        </button>
      </div>
    </div>
  );
};

export default DescriptionInput;