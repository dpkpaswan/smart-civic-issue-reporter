import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';

const AIClassificationBadge = ({ issue, variant = 'compact' }) => {
  const { t } = useTranslation();
  // Don't show if no AI data available
  if (!issue?.verified_category && !issue?.ai_explanation && !issue?.confidence_score) {
    return null;
  }

  const confidence = issue?.confidence_score || 0;
  const verifiedCategory = issue?.verified_category || issue?.category;
  const originalCategory = issue?.category;
  const wasReclassified = issue?.was_reclassified || (originalCategory && verifiedCategory !== originalCategory);
  const needsReview = issue?.needs_review || confidence < 0.6;
  const explanation = issue?.ai_explanation;

  // Format confidence percentage
  const confidencePercent = Math.round(confidence * 100);

  // Define confidence level styling
  const getConfidenceStyle = (conf) => {
    if (conf >= 0.8) return { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (conf >= 0.6) return { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const confidenceStyle = getConfidenceStyle(confidence);

  if (variant === 'compact') {
    return (
      <div className="space-y-1">
        {/* AI Verified Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${confidenceStyle.bg} ${confidenceStyle.color} ${confidenceStyle.border} border`}>
          <Icon name="Bot" size={12} />
          <span>{t('ai.verified')}{verifiedCategory}</span>
          <span className="font-semibold">({confidencePercent}%)</span>
        </div>

        {/* Reclassification Badge */}
        {wasReclassified && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Icon name="RefreshCw" size={10} />
            <span>{t('ai.reclassifiedFrom')}{originalCategory}</span>
          </div>
        )}

        {/* Needs Review Badge */}
        {needsReview && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <Icon name="AlertTriangle" size={10} />
            <span>{t('ai.needsReview')}</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant for detailed views
  return (
    <div className={`rounded-lg p-4 border ${confidenceStyle.bg} ${confidenceStyle.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Bot" size={18} className={confidenceStyle.color} />
        <h4 className={`text-sm font-semibold ${confidenceStyle.color}`}>
          AI Classification Analysis
        </h4>
      </div>

      <div className="space-y-3">
        {/* Original vs Verified Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('ai.originalCategory')}</span>
            <span className="text-sm font-medium text-foreground">{originalCategory || t('ai.unknown')}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('ai.verifiedCategory')}</span>
            <span className={`text-sm font-semibold ${confidenceStyle.color}`}>
              {verifiedCategory}
            </span>
          </div>
        </div>

        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{t('ai.confidenceLevel')}</span>
            <span className={`text-xs font-semibold ${confidenceStyle.color}`}>
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 0.8 ? 'bg-green-500' : 
                confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {wasReclassified && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
              <Icon name="RefreshCw" size={12} />
              Reclassified from {originalCategory}
            </div>
          )}
          
          {needsReview && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
              <Icon name="AlertTriangle" size={12} />
              {t('ai.needsReview')}
            </div>
          )}

          {!needsReview && confidence >= 0.8 && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
              <Icon name="CheckCircle" size={12} />
              {t('ai.highConfidence')}
            </div>
          )}
        </div>

        {/* AI Explanation */}
        {explanation && (
          <div>
            <span className="text-xs text-muted-foreground block mb-1">{t('ai.analysis')}</span>
            <p className="text-sm text-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIClassificationBadge;