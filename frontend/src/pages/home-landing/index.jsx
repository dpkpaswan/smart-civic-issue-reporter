import React, { useEffect, useState } from 'react';
import Header from '../../components/ui/Header';
import HeroSection from './components/HeroSection';
import ImpactStatistics from './components/ImpactStatistics';
import ResolvedIssuesPreview from './components/ResolvedIssuesPreview';
import TrustSignals from './components/TrustSignals';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import { issuesApi } from '../../utils/api';

const HomeLanding = () => {
  const [statistics, setStatistics] = useState(null);
  
  useEffect(() => {
    document.title = "Smart Civic Issue Reporter - Report Issues, Drive Change";
    window.scrollTo(0, 0);
    // Load real statistics for impact section
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await issuesApi.getAll();
      
      if (response.success) {
        const issues = response.data;
        const totalIssues = issues.length;
        const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
        const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
        
        // Calculate average resolution time
        const resolvedWithDates = issues.filter(i => 
          i.status === 'resolved' && i.updatedAt
        );
        
        let avgResolutionTime = '0 days';
        if (resolvedWithDates.length > 0) {
          const totalDays = resolvedWithDates.reduce((sum, issue) => {
            const submitted = new Date(issue.createdAt);
            const resolved = new Date(issue.updatedAt);
            const diffTime = Math.abs(resolved - submitted);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0);
          avgResolutionTime = `${Math.round(totalDays / resolvedWithDates.length)} days`;
        }
        
        // Count unique citizen emails as active citizens
        const uniqueCitizens = new Set(issues.map(i => i.citizenEmail).filter(Boolean));
        
        setStatistics({
          totalIssues,
          resolvedIssues,
          resolutionRate,
          avgResolutionTime,
          activeCitizens: uniqueCitizens.size
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Set default/fallback statistics
      setStatistics({
        totalIssues: 0,
        resolvedIssues: 0, 
        resolutionRate: 0,
        avgResolutionTime: '0 days',
        activeCitizens: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} />
      
      <main className="pt-16">
        <div className="animate-fade-in-up">
          <HeroSection />
        </div>
        <div className="animate-fade-in-up animate-stagger-1">
          <ImpactStatistics statistics={statistics} />
        </div>
        <div className="animate-fade-in-up animate-stagger-2">
          <ResolvedIssuesPreview />
        </div>
        <div className="animate-fade-in-up animate-stagger-3">
          <TrustSignals />
        </div>
        <div className="animate-fade-in-up animate-stagger-4">
          <CallToAction />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomeLanding;