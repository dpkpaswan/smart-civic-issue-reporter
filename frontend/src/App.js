import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import PublicView from './pages/PublicView';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/authority" element={<AuthorityDashboard />} />
            <Route path="/public" element={<PublicView />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-300">
              Smart Civic Issue Reporter - Hackathon Prototype 2026
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Building better communities through technology
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;