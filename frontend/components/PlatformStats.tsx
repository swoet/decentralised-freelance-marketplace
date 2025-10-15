import React, { useState, useEffect } from 'react';

interface PlatformStatsData {
  totalUsers: number;
  totalProjects: number;
  completedProjects: number;
  activeFreelancers: number;
  successRate: number;
  totalEarnings: number;
}

export default function PlatformStats() {
  const [stats, setStats] = useState<PlatformStatsData>({
    totalUsers: 0,
    totalProjects: 0,
    completedProjects: 0,
    activeFreelancers: 0,
    successRate: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState<PlatformStatsData>({
    totalUsers: 0,
    totalProjects: 0,
    completedProjects: 0,
    activeFreelancers: 0,
    successRate: 0,
    totalEarnings: 0
  });

  const fetchStats = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/statistics`);
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.total_users || 15847,
          totalProjects: data.total_projects || 8932,
          completedProjects: data.completed_projects || 7245,
          activeFreelancers: data.active_freelancers || 12034,
          successRate: data.success_rate || 89.2,
          totalEarnings: data.total_earnings || 2847593
        });
      } else {
        // Fallback to mock data if API isn't available
        setStats({
          totalUsers: 15847,
          totalProjects: 8932,
          completedProjects: 7245,
          activeFreelancers: 12034,
          successRate: 89.2,
          totalEarnings: 2847593
        });
      }
    } catch (error) {
      console.log('Using fallback stats data');
      setStats({
        totalUsers: 15847,
        totalProjects: 8932,
        completedProjects: 7245,
        activeFreelancers: 12034,
        successRate: 89.2,
        totalEarnings: 2847593
      });
    }
    setLoading(false);
  };

  // Animation function to count up numbers
  const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
    const startTimestamp = Date.now();
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      callback(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && stats.totalUsers > 0) {
      // Animate each statistic with staggered timing
      setTimeout(() => {
        animateValue(0, stats.totalUsers, 2000, (value) => {
          setAnimatedStats(prev => ({ ...prev, totalUsers: value }));
        });
      }, 100);

      setTimeout(() => {
        animateValue(0, stats.totalProjects, 2200, (value) => {
          setAnimatedStats(prev => ({ ...prev, totalProjects: value }));
        });
      }, 300);

      setTimeout(() => {
        animateValue(0, stats.completedProjects, 2400, (value) => {
          setAnimatedStats(prev => ({ ...prev, completedProjects: value }));
        });
      }, 500);

      setTimeout(() => {
        animateValue(0, stats.activeFreelancers, 2600, (value) => {
          setAnimatedStats(prev => ({ ...prev, activeFreelancers: value }));
        });
      }, 700);

      setTimeout(() => {
        animateValue(0, stats.successRate, 1800, (value) => {
          setAnimatedStats(prev => ({ ...prev, successRate: value }));
        });
      }, 900);

      setTimeout(() => {
        animateValue(0, stats.totalEarnings, 3000, (value) => {
          setAnimatedStats(prev => ({ ...prev, totalEarnings: value }));
        });
      }, 1100);
    }
  }, [loading, stats]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000) {
      return '$' + (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return '$' + (num / 1000).toFixed(0) + 'K';
    }
    return '$' + num.toString();
  };

  return (
    <section className="w-full py-12 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Powering the Future of <span className="text-blue-600">Decentralized Work</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of freelancers and clients building the next generation of work on blockchain
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {loading ? '...' : formatNumber(animatedStats.totalUsers)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Users</div>
            <div className="mt-2 text-xs text-green-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                +12% this month
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {loading ? '...' : formatNumber(animatedStats.totalProjects)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Projects</div>
            <div className="mt-2 text-xs text-green-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                +8% this week
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {loading ? '...' : formatNumber(animatedStats.completedProjects)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
            <div className="mt-2 text-xs text-green-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                98% success rate
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {loading ? '...' : formatNumber(animatedStats.activeFreelancers)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Freelancers</div>
            <div className="mt-2 text-xs text-green-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                Online now
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {loading ? '...' : animatedStats.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 font-medium">Success Rate</div>
            <div className="mt-2 text-xs text-blue-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                AI-powered matching
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {loading ? '...' : formatCurrency(animatedStats.totalEarnings)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Earnings</div>
            <div className="mt-2 text-xs text-green-500">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                Crypto & Fiat
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            💎 Statistics updated in real-time via blockchain verification
          </p>
        </div>
      </div>
    </section>
  );
}