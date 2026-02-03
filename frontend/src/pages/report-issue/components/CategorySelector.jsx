import React from 'react';
import Icon from '../../../components/AppIcon';

const CategorySelector = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    {
      id: 'pothole',
      label: 'Pothole',
      icon: 'Construction',
      description: 'Road damage and potholes',
      color: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'streetlight',
      label: 'Street Light',
      icon: 'Lightbulb',
      description: 'Non-functional street lights',
      color: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
    },
    {
      id: 'graffiti',
      label: 'Graffiti',
      icon: 'Paintbrush',
      description: 'Vandalism and graffiti',
      color: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
    },
    {
      id: 'garbage',
      label: 'Garbage',
      icon: 'Trash2',
      description: 'Waste management issues',
      color: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'water',
      label: 'Water Issue',
      icon: 'Droplet',
      description: 'Water leaks and drainage',
      color: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'traffic',
      label: 'Traffic Signal',
      icon: 'TrafficCone',
      description: 'Traffic light problems',
      color: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
    },
    {
      id: 'sidewalk',
      label: 'Sidewalk',
      icon: 'Footprints',
      description: 'Sidewalk damage',
      color: 'bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20'
    },
    {
      id: 'other',
      label: 'Other',
      icon: 'MoreHorizontal',
      description: 'Other civic issues',
      color: 'bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20'
    }
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base lg:text-lg font-semibold text-foreground">Select Issue Category</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the category that best describes the issue
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {categories?.map((category) => (
          <button
            key={category?.id}
            onClick={() => onCategoryChange(category?.id)}
            className={`
              relative p-4 lg:p-6 rounded-lg border-2 transition-smooth
              ${selectedCategory === category?.id
                ? 'border-primary bg-primary/10 shadow-elevation-2'
                : `${category?.color} border-2`
              }
            `}
            aria-pressed={selectedCategory === category?.id}
          >
            <div className="flex flex-col items-center text-center gap-2 lg:gap-3">
              <div className={`
                w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center
                ${selectedCategory === category?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
                }
                transition-smooth
              `}>
                <Icon name={category?.icon} size={24} />
              </div>
              <div>
                <p className={`
                  text-sm lg:text-base font-semibold
                  ${selectedCategory === category?.id ? 'text-primary' : 'text-foreground'}
                  transition-smooth
                `}>
                  {category?.label}
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
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;