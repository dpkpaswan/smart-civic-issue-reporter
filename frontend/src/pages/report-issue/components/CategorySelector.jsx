import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';

const CategorySelector = ({ selectedCategory, onCategoryChange, aiPrediction = null, isLoading = false }) => {
  const { t } = useTranslation();

  const categories = [
    { id: 'pothole', label: t('category.pothole'), icon: 'Construction', description: t('category.potholeDesc'), color: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
    { id: 'streetlight', label: t('category.streetlight'), icon: 'Lightbulb', description: t('category.streetlightDesc'), color: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20' },
    { id: 'graffiti', label: t('category.graffiti'), icon: 'Paintbrush', description: t('category.graffitiDesc'), color: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
    { id: 'garbage', label: t('category.garbage'), icon: 'Trash2', description: t('category.garbageDesc'), color: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' },
    { id: 'water', label: t('category.water'), icon: 'Droplet', description: t('category.waterDesc'), color: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
    { id: 'traffic', label: t('category.traffic'), icon: 'TrafficCone', description: t('category.trafficDesc'), color: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
    { id: 'sidewalk', label: t('category.sidewalk'), icon: 'Footprints', description: t('category.sidewalkDesc'), color: 'bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20' },
    { id: 'other', label: t('category.other'), icon: 'MoreHorizontal', description: t('category.otherDesc'), color: 'bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20' }
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base lg:text-lg font-semibold text-foreground">{t('category.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('category.subtitle')}
        </p>
        
        {/* AI Prediction Display */}
        {aiPrediction && (
          <div className="mt-3 p-3 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Bot" size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{t('category.aiPrediction')}</span>
              {isLoading && <Icon name="Loader2" size={14} className="text-blue-600 animate-spin" />}
            </div>
            <p className="text-sm text-blue-600">
              {t('category.detected')}<strong>{aiPrediction.category}</strong> ({Math.round(aiPrediction.confidence * 100)}% confidence)
            </p>
            {aiPrediction.explanation && (
              <p className="text-xs text-blue-500 mt-1">{aiPrediction.explanation}</p>
            )}
            {aiPrediction.needsReview && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                {t('category.lowConfidence')}
              </p>
            )}
          </div>
        )}
        
        {isLoading && !aiPrediction && (
          <div className="mt-3 p-3 rounded-lg border bg-gray-50 border-gray-200">
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={16} className="text-gray-600 animate-spin" />
              <span className="text-sm text-gray-600">{t('category.aiAnalyzing')}</span>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {categories?.map((category) => {
          const isAIPredicted = aiPrediction?.category === category?.id;
          const aiConfidence = isAIPredicted ? aiPrediction.confidence : 0;
          
          return (
            <button
              key={category?.id}
              onClick={() => onCategoryChange(category?.id)}
              className={`
                relative p-4 lg:p-6 rounded-lg border-2 transition-smooth
                ${selectedCategory === category?.id
                  ? 'border-primary bg-primary/10 shadow-elevation-2'
                  : `${category?.color} border-2`
                }
                ${isAIPredicted ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              `}
              aria-pressed={selectedCategory === category?.id}
            >
              {/* AI Prediction Badge */}
              {isAIPredicted && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                  <Icon name="Bot" size={10} />
                  {Math.round(aiConfidence * 100)}%
                </div>
              )}
              
              <div className="flex flex-col items-center text-center gap-2 lg:gap-3">
                <div className={`
                  w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center
                  ${selectedCategory === category?.id
                    ? 'bg-primary text-primary-foreground'
                    : isAIPredicted 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                      : 'bg-muted text-foreground'
                  }
                  transition-smooth
                `}>
                  <Icon name={category?.icon} size={24} />
                </div>
                <div>
                  <p className={`
                    text-sm lg:text-base font-semibold
                    ${selectedCategory === category?.id ? 'text-primary' : 
                      isAIPredicted ? 'text-blue-700' : 'text-foreground'}
                    transition-smooth
                  `}>
                    {category?.label}
                    {isAIPredicted && (
                      <Icon name="Sparkles" size={14} className="inline ml-1 text-blue-600" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden lg:block">
                    {category?.description}
                  </p>
                </div>
              </div>
              {selectedCategory === category?.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="Check" size={14} className="text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;