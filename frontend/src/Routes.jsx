import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import HomeLanding from './pages/home-landing';
import PublicTransparency from './pages/public-transparency';
import IssueConfirmation from './pages/issue-confirmation';
import AuthorityDashboard from './pages/authority-dashboard';
import AuthorityLogin from './pages/authority-login';
import ReportIssue from './pages/report-issue';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            {/* Define your route here */}
            <Route path="/" element={<HomeLanding />} />
            <Route path="/home-landing" element={<HomeLanding />} />
            <Route path="/public-transparency" element={<PublicTransparency />} />
            <Route path="/issue-confirmation" element={<IssueConfirmation />} />
            <Route path="/authority-login" element={<AuthorityLogin />} />
            <Route 
              path="/authority-dashboard" 
              element={
                <ProtectedRoute>
                  <AuthorityDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
