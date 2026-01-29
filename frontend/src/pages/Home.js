import React from 'react';
import { Link } from 'react-router-dom';
import HackathonBadge from '../components/HackathonBadge';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section - Premium gradient with clear hierarchy */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Headline - Mobile-optimized typography */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
              Smart Civic Issue
              <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400"> Reporter</span>
            </h1>
            
            {/* Mobile-optimized subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Transforming civic engagement through intelligent automation and radical transparency. 
              Report issues, track progress, and build stronger communities.
            </p>
            
            {/* Mobile-first responsive CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
              <Link 
                to="/report" 
                className="group bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-6 sm:px-8 py-4 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                <span className="mr-2">📱</span>
                Report Issue Now
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
              </Link>
              <Link 
                to="/public" 
                className="group border-2 border-blue-300 text-blue-100 hover:bg-white hover:text-blue-900 active:bg-blue-50 px-6 sm:px-8 py-4 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 touch-manipulation"
              >
                <span className="mr-2">📊</span>
                View Public Dashboard
              </Link>
            </div>
            
            {/* Hackathon Badge - Subtle and non-dominant */}
            <HackathonBadge />
          </div>
        </div>
      </section>

      {/* Solving Real Community Problems - Mobile-optimized */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Mobile-first section header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-3 sm:mb-4 px-2">
                Solving Real Community Problems
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4 sm:px-0 leading-relaxed">
                Current civic reporting systems fail citizens and authorities alike. Here's what we're fixing.
              </p>
            </div>
            
            {/* Mobile-responsive problem cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Frustrated Citizens */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">😤</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Frustrated Citizens</h3>
                <p className="text-slate-600 leading-relaxed">
                  Complex forms, lost reports, and zero feedback create citizen frustration and civic disengagement.
                </p>
              </div>
              
              {/* Delayed Responses */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">⏳</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Delayed Responses</h3>
                <p className="text-slate-600 leading-relaxed">
                  Manual processing bottlenecks and poor coordination result in weeks-long resolution times.
                </p>
              </div>
              
              {/* Lack of Transparency */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🌫️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Zero Transparency</h3>
                <p className="text-slate-600 leading-relaxed">
                  Citizens report into black holes with no progress updates or accountability mechanisms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Smart Solution - Feature showcase with consistent height cards */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                Our Smart Solution
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                AI-powered civic engagement platform designed for the digital government era.
              </p>
            </div>
            
            {/* Feature Cards Grid - Consistent heights with hover effects */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Easy Reporting */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Instant Reporting</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  One-click submission with photo upload, GPS detection, and intelligent auto-categorization.
                </p>
              </div>
              
              {/* AI Classification - Highlight ML-ready architecture */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  AI-Ready
                </div>
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Classification</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  ML-ready architecture with intelligent priority assignment and automated department routing.
                </p>
              </div>
              
              {/* Real-time Tracking */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Live Progress Tracking</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  Real-time status updates from submission through resolution with citizen notifications.
                </p>
              </div>
              
              {/* Authority Dashboard */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Authority Control Center</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  Streamlined management interface with priority queues and performance analytics.
                </p>
              </div>
              
              {/* Public Transparency - Highlight key differentiator */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Transparency
                </div>
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Public Dashboard</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  Complete transparency with public issue tracking and municipal performance metrics.
                </p>
              </div>
              
              {/* Location Intelligence */}
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Precision Mapping</h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  High-accuracy GPS with OpenStreetMap integration for exact issue localization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline style with numbered circles */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Three simple steps to transform civic engagement in your community.
              </p>
            </div>
            
            {/* Process Steps - Enhanced timeline design */}
            <div className="space-y-12">
              <div className="flex items-start space-x-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  1
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Citizen Reports Issue</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Citizens capture photos, add descriptions, and submit reports instantly. Our smart system automatically detects location and classifies the issue type using ML-ready algorithms.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  2
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Authority Reviews & Processes</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Municipal authorities receive prioritized issues in their dashboard, update progress status, and coordinate resolution efforts with real-time citizen communication.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  3
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Complete Transparency</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Public dashboard provides full visibility into all issues and resolution progress, creating accountability and enabling data-driven municipal improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prototype Status - Honest 60% implementation with visual progress */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header with Progress Indicator */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                Prototype Status
              </h2>
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white rounded-full p-4 shadow-lg border border-slate-200">
                  <div className="text-3xl font-bold text-blue-600">60%</div>
                </div>
              </div>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Fully functional hackathon prototype demonstrating core features with clear roadmap for production scaling.
              </p>
            </div>
            
            {/* Implementation Status Grid */}
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Implemented Features */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Implemented Features</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Smart issue reporting with image upload",
                    "Simulated AI classification system", 
                    "Real-time status tracking & notifications",
                    "Authority management dashboard",
                    "Public transparency portal",
                    "High-precision geolocation integration",
                    "Responsive design & accessibility",
                    "Secure authentication system"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Future Enhancements */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 text-xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Production Roadmap</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Production ML models for auto-classification",
                    "Government API integrations & SSO",
                    "Predictive analytics & trend analysis", 
                    "IoT sensor network integration",
                    "Blockchain-based transparency ledger",
                    "Native mobile applications",
                    "Advanced reporting & business intelligence",
                    "Multi-language & accessibility compliance"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-3 mt-1">•</span>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Strong demo invitation */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Try the Prototype?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Experience the future of civic engagement with our fully functional demo. 
              Test real features and see how smart technology can transform community problem-solving.
            </p>
            
            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/report" 
                className="group bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <span className="mr-2">🚀</span>
                Report Your First Issue
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
              </Link>
              
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="group border-2 border-blue-300 hover:bg-white hover:text-slate-900 text-blue-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 block mb-2"
                >
                  <span className="mr-2">🏛️</span>
                  Authority Demo Login
                </Link>
                <p className="text-sm text-blue-200">
                  Demo credentials: <span className="font-mono bg-blue-800 px-2 py-1 rounded">admin/admin123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;