import React, { useState } from 'react';

interface Step {
  id: number;
  title: string;
  description: string;
  details: string;
  icon: React.ReactNode;
  blockchainFeature: string;
  userType: 'freelancer' | 'client' | 'both';
}

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');
  const [activeStep, setActiveStep] = useState<number>(1);

  const freelancerSteps: Step[] = [
    {
      id: 1,
      title: "Create Your Profile",
      description: "Build a comprehensive profile showcasing your skills and experience",
      details: "Upload your portfolio, certifications, and work samples. Our AI system analyzes your skills and creates a unique blockchain identity for verification.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      blockchainFeature: "Identity verification stored on blockchain",
      userType: 'freelancer'
    },
    {
      id: 2,
      title: "AI-Powered Matching",
      description: "Our intelligent system finds projects that perfectly match your skills",
      details: "Advanced machine learning algorithms analyze project requirements and match them with your expertise, work style, and preferences for optimal compatibility.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      blockchainFeature: "Smart contract matching algorithms",
      userType: 'freelancer'
    },
    {
      id: 3,
      title: "Submit Proposals",
      description: "Send tailored proposals with transparent pricing and timelines",
      details: "Create compelling proposals with clear deliverables, milestones, and pricing. Our system helps you craft winning proposals based on successful patterns.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      blockchainFeature: "Proposal transparency and immutability",
      userType: 'freelancer'
    },
    {
      id: 4,
      title: "Work & Collaborate",
      description: "Collaborate seamlessly with built-in tools and real-time communication",
      details: "Use integrated chat, file sharing, and project management tools. Track progress with milestone-based payments automatically handled by smart contracts.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      blockchainFeature: "Decentralized collaboration tools",
      userType: 'freelancer'
    },
    {
      id: 5,
      title: "Get Paid Securely",
      description: "Receive guaranteed payments through smart contract escrow",
      details: "Payments are automatically released when milestones are completed. Smart contracts ensure you always get paid on time, every time, with support for crypto and fiat.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      blockchainFeature: "Smart contract automated payments",
      userType: 'freelancer'
    }
  ];

  const clientSteps: Step[] = [
    {
      id: 1,
      title: "Post Your Project",
      description: "Describe your project requirements and set your budget",
      details: "Create detailed project briefs with clear requirements, deadlines, and budget ranges. Our AI system helps optimize your posting for better freelancer matches.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      blockchainFeature: "Project requirements stored on blockchain",
      userType: 'client'
    },
    {
      id: 2,
      title: "AI Matches Talent",
      description: "Get matched with verified freelancers who fit your project perfectly",
      details: "Our advanced AI analyzes freelancer profiles, past work, and success rates to recommend the best candidates for your specific project needs.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      blockchainFeature: "AI-powered smart matching",
      userType: 'client'
    },
    {
      id: 3,
      title: "Review Proposals",
      description: "Compare proposals from qualified freelancers with transparent pricing",
      details: "Review detailed proposals with portfolios, timelines, and pricing. All freelancer credentials and past work are blockchain-verified for authenticity.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      blockchainFeature: "Verified proposals and credentials",
      userType: 'client'
    },
    {
      id: 4,
      title: "Manage Progress",
      description: "Track project milestones with transparent communication",
      details: "Monitor progress through milestone-based tracking, real-time communication, and file sharing. Smart contracts automatically handle milestone payments.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      blockchainFeature: "Milestone tracking on blockchain",
      userType: 'client'
    },
    {
      id: 5,
      title: "Secure Delivery",
      description: "Receive quality work with blockchain-verified completion",
      details: "Get your completed project with quality guarantees. All deliverables are verified and stored securely. Smart contracts ensure fair payment upon completion.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      blockchainFeature: "Verified delivery and completion",
      userType: 'client'
    }
  ];

  const getCurrentSteps = () => {
    return activeTab === 'freelancer' ? freelancerSteps : clientSteps;
  };

  const currentSteps = getCurrentSteps();
  const currentStep = currentSteps.find(step => step.id === activeStep) || currentSteps[0];

  return (
    <section className="w-full py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            How <span className="text-blue-600">Blockchain</span> Powers Your Success
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover how smart contracts, AI matching, and decentralized systems create the most secure and efficient freelancing experience
          </p>
        </div>

        {/* User Type Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-2 shadow-lg">
            <button
              onClick={() => { setActiveTab('freelancer'); setActiveStep(1); }}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'freelancer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              🎯 For Freelancers
            </button>
            <button
              onClick={() => { setActiveTab('client'); setActiveStep(1); }}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'client'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              🚀 For Clients
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Steps Navigation */}
          <div className="space-y-4">
            {currentSteps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                  activeStep === step.id
                    ? `${activeTab === 'freelancer' ? 'bg-blue-600 text-white shadow-xl transform scale-105' : 'bg-purple-600 text-white shadow-xl transform scale-105'}`
                    : 'bg-white hover:shadow-lg hover:transform hover:scale-102'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    activeStep === step.id
                      ? 'bg-white bg-opacity-20'
                      : `${activeTab === 'freelancer' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        activeStep === step.id
                          ? 'bg-white bg-opacity-20'
                          : `${activeTab === 'freelancer' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`
                      }`}>
                        {step.id}
                      </span>
                      <h3 className="text-lg font-bold">{step.title}</h3>
                    </div>
                    <p className={`text-sm ${
                      activeStep === step.id ? 'text-white text-opacity-90' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  {activeStep === step.id && (
                    <div className="text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Active Step Details */}
          <div className="sticky top-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                activeTab === 'freelancer' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                Step {currentStep.id} of {currentSteps.length}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentStep.title}
              </h3>

              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {currentStep.details}
              </p>

              {/* Blockchain Feature Highlight */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">🔗 Blockchain Integration</h4>
                </div>
                <p className="text-gray-700 text-sm">
                  {currentStep.blockchainFeature}
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  disabled={activeStep === 1}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActiveStep(Math.min(currentSteps.length, activeStep + 1))}
                  disabled={activeStep === currentSteps.length}
                  className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === 'freelancer'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600 mb-1">99.8%</div>
                <div className="text-sm text-gray-600">Payment Success</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Blockchain Security</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Experience the Future of Freelancing?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of professionals already using blockchain technology for secure, transparent work
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Get Started Now
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}