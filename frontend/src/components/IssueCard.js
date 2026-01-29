import React from 'react';
import { utils } from '../utils/helpers';
import { apiUtils } from '../services/api';

const IssueCard = ({ issue, onStatusUpdate, showActions = false, currentUser }) => {
  const handleStatusUpdate = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(issue.id, newStatus);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'submitted': 'in-progress',
      'in-progress': 'resolved'
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (currentStatus) => {
    return currentStatus !== 'resolved' && showActions;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      {/* Issue Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Issue #{issue.id}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{utils.getCategoryIcon(issue.category)}</span>
            <span className="text-sm text-gray-600 capitalize">
              {issue.category.replace('-', ' ')}
            </span>
          </div>
        </div>
        <span className={`status-badge status-${issue.status}`}>
          {issue.status.replace('-', ' ')}
        </span>
      </div>

      {/* Issue Details */}
      <div className="mb-4">
        <p className="text-gray-700 mb-2">
          {utils.truncateText(issue.description, 150)}
        </p>
        
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{issue.location.address}</span>
        </div>
        
        {/* Reporter */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span>{issue.citizenName}</span>
        </div>
        
        {/* Timestamps */}
        <div className="text-xs text-gray-500">
          <div>Reported: {utils.formatRelativeTime(issue.createdAt)}</div>
          {issue.updatedAt !== issue.createdAt && (
            <div>Updated: {utils.formatRelativeTime(issue.updatedAt)}</div>
          )}
        </div>
      </div>

      {/* Images */}
      {issue.images && issue.images.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {issue.images.map((image, index) => (
              <img
                key={index}
                src={apiUtils.getImageUrl(image)}
                alt={`Issue evidence ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => window.open(apiUtils.getImageUrl(image), '_blank')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolution Section */}
      {issue.status === 'resolved' && (issue.resolutionImages?.length > 0 || issue.resolutionNotes) && (
        <div className="border-t pt-4 mb-4">
          <h4 className="text-sm font-semibold text-green-700 mb-2">Resolution</h4>
          {issue.resolutionNotes && (
            <p className="text-sm text-gray-600 mb-2">{issue.resolutionNotes}</p>
          )}
          {issue.resolutionImages && issue.resolutionImages.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto">
              {issue.resolutionImages.map((image, index) => (
                <img
                  key={index}
                  src={apiUtils.getImageUrl(image)}
                  alt={`Resolution proof ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => window.open(apiUtils.getImageUrl(image), '_blank')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && currentUser?.role === 'authority' && (
        <div className="border-t pt-4">
          {canUpdateStatus(issue.status) && (
            <button
              onClick={() => handleStatusUpdate(getNextStatus(issue.status))}
              className={`btn-${getNextStatus(issue.status) === 'resolved' ? 'success' : 'warning'} mr-2`}
            >
              Mark as {getNextStatus(issue.status).replace('-', ' ')}
            </button>
          )}
          
          {issue.status === 'in-progress' && (
            <button
              onClick={() => {
                const notes = prompt('Enter resolution notes:');
                if (notes) {
                  handleStatusUpdate('resolved', notes);
                }
              }}
              className="btn-success"
            >
              Add Resolution
            </button>
          )}
        </div>
      )}

      {/* Priority Indicator */}
      {issue.priority && (
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${
            issue.priority === 'high' ? 'bg-red-500' :
            issue.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          }`} title={`${issue.priority} priority`}></div>
        </div>
      )}
    </div>
  );
};

export default IssueCard;