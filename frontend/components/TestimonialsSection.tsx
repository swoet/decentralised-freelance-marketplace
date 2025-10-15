import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  content: string;
  rating: number;
  projectType: string;
  earnings?: number;
  isVerified: boolean;
  blockchainTxHash?: string;
  completedProjects: number;
}

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Full-Stack Developer',
      avatar: 'SC',
      content: "CraftNexus revolutionized my freelancing career. Smart contracts ensure I'm always paid on time, and the AI matching system connects me with projects that perfectly fit my skills. I've increased my income by 150% since joining!",
      rating: 5,
      projectType: 'Web Development',
      earnings: 94500,
      isVerified: true,
      blockchainTxHash: '0x742d35cc6574c5f4e4e9f4d',
      completedProjects: 47
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      role: 'UI/UX Designer',
      avatar: 'MR',
      content: "The blockchain-verified portfolio system has been a game-changer. Clients trust my work instantly because everything is transparent and verified on-chain. The escrow system eliminates payment disputes completely.",
      rating: 5,
      projectType: 'Design & Branding',
      earnings: 78300,
      isVerified: true,
      blockchainTxHash: '0x8a9b2c5e4f6d7a8b9c0e1f2',
      completedProjects: 32
    },
    {
      id: '3',
      name: 'Priya Sharma',
      role: 'Content Strategist',
      avatar: 'PS',
      content: "As a client, I love the AI-powered matching. It finds the perfect freelancers for my projects every time. The smart contract system makes payments seamless, and the reputation system ensures quality work.",
      rating: 5,
      projectType: 'Content Marketing',
      earnings: 156700,
      isVerified: true,
      blockchainTxHash: '0x3f4e5a6b7c8d9e0f1a2b3c4',
      completedProjects: 23
    },
    {
      id: '4',
      name: 'Alex Thompson',
      role: 'Blockchain Developer',
      avatar: 'AT',
      content: "The decentralized dispute resolution system is brilliant. No more worrying about unfair treatment - the community voting ensures fairness for everyone. Plus, getting paid in crypto is perfect for my global client base.",
      rating: 5,
      projectType: 'Blockchain Development',
      earnings: 127800,
      isVerified: true,
      blockchainTxHash: '0x5d6e7f8a9b0c1d2e3f4a5b6',
      completedProjects: 19
    },
    {
      id: '5',
      name: 'Elena Volkov',
      role: 'Data Scientist',
      avatar: 'EV',
      content: "The AI matching system is incredibly accurate. It understands not just my technical skills but also my work style and preferences. I've found long-term clients who value my expertise and pay fair rates.",
      rating: 5,
      projectType: 'Data Science & AI',
      earnings: 98200,
      isVerified: true,
      blockchainTxHash: '0x7e8f9a0b1c2d3e4f5a6b7c8',
      completedProjects: 28
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const formatEarnings = (earnings: number) => {
    return `$${(earnings / 1000).toFixed(0)}K+`;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const current = testimonials[currentTestimonial];

  return (
    <section className="w-full py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Trusted by <span className="text-blue-600">Thousands</span> of Professionals
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how blockchain technology is transforming careers and businesses worldwide
          </p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar and Info */}
              <div className="flex-shrink-0 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                  {current.avatar}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{current.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{current.role}</p>
                
                {/* Verification Badge */}
                <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Blockchain Verified
                </div>

                {/* Stats */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <span>⭐ {current.rating}.0</span>
                    <div className="flex">{renderStars(current.rating)}</div>
                  </div>
                  <div>💼 {current.completedProjects} projects completed</div>
                  <div>💰 {formatEarnings(current.earnings!)} earned</div>
                  <div>🔗 {current.projectType}</div>
                </div>
              </div>

              {/* Testimonial Content */}
              <div className="flex-1">
                <div className="mb-6">
                  <svg className="w-10 h-10 text-blue-200 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                  </svg>
                  <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
                    "{current.content}"
                  </blockquote>
                </div>

                {/* Blockchain Verification */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    Blockchain Verification:
                  </div>
                  <div className="font-mono text-xs text-blue-600 break-all">
                    {current.blockchainTxHash}...verified
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button 
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentTestimonial 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join 15,000+ Verified Professionals
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Start your blockchain-powered freelancing journey today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <div className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Join as Freelancer
                </div>
              </Link>
              <Link href="/projects/create">
                <div className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Post a Project
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}