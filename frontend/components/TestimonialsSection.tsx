import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  avatarUrl?: string;
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
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);
  
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Full-Stack Developer',
      avatar: 'SC',
      avatarUrl: 'https://i.pravatar.cc/160?img=47',
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
      avatarUrl: 'https://i.pravatar.cc/160?img=15',
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
      avatarUrl: 'https://i.pravatar.cc/160?img=66',
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
      avatarUrl: 'https://i.pravatar.cc/160?img=12',
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
      avatarUrl: 'https://i.pravatar.cc/160?img=32',
      content: "The AI matching system is incredibly accurate. It understands not just my technical skills but also my work style and preferences. I've found long-term clients who value my expertise and pay fair rates.",
      rating: 5,
      projectType: 'Data Science & AI',
      earnings: 98200,
      isVerified: true,
      blockchainTxHash: '0x7e8f9a0b1c2d3e4f5a6b7c8',
      completedProjects: 28
    }
  ];

  // Autoplay with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const id = setTimeout(() => {
      setDirection(1);
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearTimeout(id);
  }, [currentTestimonial, isPaused, testimonials.length]);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const formatEarnings = (earnings: number) => {
    return `$${(earnings / 1000).toFixed(0)}K+`;
  };

  const shortenHash = (hash?: string) => {
    if (!hash) return '';
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (dx > threshold) prevTestimonial();
    else if (dx < -threshold) nextTestimonial();
    touchStartX.current = null;
    setIsPaused(false);
  };

  const variants = {
    enter: (dir: 1 | -1) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir > 0 ? -40 : 40, opacity: 0 })
  } as const;

  return (
    <section className="w-full py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Trusted by <span className="text-blue-600">Thousands</span> of Professionals
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how blockchain technology is transforming careers and businesses worldwide
          </p>
        </div>

        <div
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-6xl mx-auto overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', duration: 0.35 }}
              >
            <div className="space-y-6">
              {/* Top Section: Avatar + Name/Role/Stats */}
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={current.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(current.name)}`}
                    alt={current.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Name, Role, Rating, Stats */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{current.name}</h3>
                      <p className="text-blue-600 font-medium">{current.role}</p>
                    </div>
                    
                    {/* Top-right corner info box */}
                    <div className="flex flex-col gap-3 sm:min-w-[200px]">
                      {/* Rating + Verification */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex">{renderStars(current.rating)}</div>
                          <span className="text-sm font-bold text-gray-900">{current.rating}.0</span>
                        </div>
                        <div className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Verified
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-base">💼</span>
                          <span className="font-medium">{current.completedProjects} projects</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-base">💰</span>
                          <span className="font-medium">{formatEarnings(current.earnings!)} earned</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-base">🔗</span>
                          <span className="font-medium">{current.projectType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="border-t border-gray-200 pt-6">
                <blockquote className="text-base md:text-lg text-gray-700 leading-relaxed italic mb-6">
                  "{current.content}"
                </blockquote>

                {/* Blockchain Verification */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    <span className="font-medium">Blockchain Verification:</span>
                  </div>
                  <div className="font-mono text-xs text-blue-600">
                    {shortenHash(current.blockchainTxHash)} • verified
                  </div>
                </div>
              </div>
            </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
            className="absolute left-4 md:-left-12 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button 
            onClick={nextTestimonial}
            aria-label="Next testimonial"
            className="absolute right-4 md:-right-12 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
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