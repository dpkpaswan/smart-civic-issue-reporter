import React from 'react';

/**
 * Reusable Hackathon Badge Component
 * Shows "Hackathon Prototype 2026" as a subtle pill badge
 * Designed for judge-friendly hackathon presentation
 */
const HackathonBadge = ({ className = "" }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-200 shadow-sm">
        <span className="mr-1.5">🏆</span>
        Hackathon Prototype 2026
      </span>
    </div>
  );
};

export default HackathonBadge;