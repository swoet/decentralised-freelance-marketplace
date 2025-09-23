import React, { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  Input,
  Textarea,
  Badge,
  StatusBadge,
  SkillBadge,
  BadgeGroup,
  Motion,
  Stagger,
  Handwriting
} from '../index';

// Showcase demo component demonstrating the Artisan Craft design system
export const ShowcaseDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const skills = ['React', 'TypeScript', 'Node.js', 'Design Systems', 'UI/UX'];
  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform',
      description: 'A handcrafted marketplace for artisan goods with custom payment integration.',
      budget: '$5,000 - $10,000',
      status: 'active' as const,
      skills: ['React', 'Node.js', 'Stripe'],
      image: '/api/placeholder/400/300'
    },
    {
      id: 2,
      title: 'Portfolio Website',
      description: 'Beautiful, responsive portfolio showcasing creative work with smooth animations.',
      budget: '$2,000 - $5,000',
      status: 'completed' as const,
      skills: ['Design', 'Animation', 'CSS'],
      image: '/api/placeholder/400/300'
    },
    {
      id: 3,
      title: 'Mobile App Design',
      description: 'User-centered design for a productivity app with intuitive navigation.',
      budget: '$3,000 - $7,000',
      status: 'pending' as const,
      skills: ['UI/UX', 'Figma', 'Prototyping'],
      image: '/api/placeholder/400/300'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-background bg-craft-texture p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <Motion preset="slideInDown" className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="heading-craft text-5xl text-text-primary">
              Artisan Craft Design System
            </h1>
            <Handwriting 
              text="Handcrafted Excellence in Every Detail"
              className="text-2xl text-text-accent"
              speed={80}
            />
            <p className="body-craft text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              A warm, human-centered design system that celebrates the craft of freelancing 
              with organic shapes, rich textures, and thoughtful interactions.
            </p>
          </div>
        </Motion>

        {/* Button Showcase */}
        <Motion preset="fadeIn" className="space-y-6">
          <h2 className="heading-craft text-3xl text-text-primary text-center">
            Handcrafted Buttons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Primary Buttons */}
            <Card variant="parchment" className="p-6">
              <CardHeader>
                <CardTitle>Primary Actions</CardTitle>
                <CardDescription>Main call-to-action buttons with warm gradients</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonGroup orientation="vertical" spacing="md">
                  <Button variant="primary" size="lg">
                    Start Project
                  </Button>
                  <Button variant="primary" size="md">
                    View Portfolio
                  </Button>
                  <Button variant="primary" size="sm">
                    Contact Me
                  </Button>
                </ButtonGroup>
              </CardContent>
            </Card>

            {/* Secondary Buttons */}
            <Card variant="leather" className="p-6">
              <CardHeader>
                <CardTitle>Secondary Actions</CardTitle>
                <CardDescription>Supporting actions with subtle styling</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonGroup orientation="vertical" spacing="md">
                  <Button variant="secondary" shape="organic">
                    Learn More
                  </Button>
                  <Button variant="accent" shape="leaf">
                    Get Quote
                  </Button>
                  <Button variant="ghost" shape="pill">
                    Browse Work
                  </Button>
                </ButtonGroup>
              </CardContent>
            </Card>

            {/* Special Buttons */}
            <Card variant="filled" className="p-6">
              <CardHeader>
                <CardTitle>Craft Specialties</CardTitle>
                <CardDescription>Unique button styles with artisan flair</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonGroup orientation="vertical" spacing="md">
                  <Button 
                    variant="success" 
                    shape="wax"
                    leftIcon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    }
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="warning" 
                    loading 
                    loadingText="Crafting..."
                  >
                    Processing
                  </Button>
                  <Button variant="link">
                    View Details →
                  </Button>
                </ButtonGroup>
              </CardContent>
            </Card>
          </div>
        </Motion>

        {/* Form Showcase */}
        <Motion preset="slideInUp" className="space-y-6">
          <h2 className="heading-craft text-3xl text-text-primary text-center">
            Artisan Forms
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <Card variant="elevated" className="p-8">
              <CardHeader divided>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Let's discuss your next project and bring your vision to life.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    variant="craft"
                    shape="organic"
                    leftIcon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    variant="filled"
                    shape="leaf"
                    leftIcon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    }
                  />
                  
                  <Textarea
                    label="Project Description"
                    placeholder="Tell us about your project vision..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    variant="default"
                    shape="organic"
                    rows={5}
                  />
                </div>
              </CardContent>
              
              <CardFooter justify="between">
                <Button variant="ghost">
                  Save Draft
                </Button>
                <Button variant="primary" size="lg">
                  Send Message
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Motion>

        {/* Badge Showcase */}
        <Motion preset="scaleIn" className="space-y-6">
          <h2 className="heading-craft text-3xl text-text-primary text-center">
            Craft Badges & Skills
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="default" className="p-6">
              <CardHeader>
                <CardTitle>Status Indicators</CardTitle>
                <CardDescription>Project and user status badges</CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGroup spacing="md" wrap>
                  <StatusBadge status="active" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="completed" />
                  <StatusBadge status="cancelled" />
                  <StatusBadge status="draft" />
                </BadgeGroup>
              </CardContent>
            </Card>

            <Card variant="default" className="p-6">
              <CardHeader>
                <CardTitle>Skill Badges</CardTitle>
                <CardDescription>Showcase expertise and capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGroup spacing="sm" wrap>
                  {skills.map((skill, index) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      level={index % 2 === 0 ? 'expert' : 'advanced'}
                      verified={index < 3}
                    />
                  ))}
                </BadgeGroup>
              </CardContent>
            </Card>
          </div>
        </Motion>

        {/* Project Cards Showcase */}
        <Motion preset="fadeIn" className="space-y-6">
          <h2 className="heading-craft text-3xl text-text-primary text-center">
            Project Portfolio
          </h2>
          
          <Stagger staggerDelay={150} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                variant="elevated" 
                interactive="float"
                className="overflow-hidden"
              >
                <CardBadge variant="accent" position="top-right">
                  <StatusBadge status={project.status} size="xs" />
                </CardBadge>
                
                <div className="aspect-card bg-gradient-to-br from-mahogany-100 to-copper-100 flex items-center justify-center">
                  <div className="text-6xl opacity-20">🎨</div>
                </div>
                
                <div className="p-6">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-secondary">Budget:</span>
                        <span className="font-semibold text-gold-600">{project.budget}</span>
                      </div>
                      
                      <BadgeGroup spacing="sm" wrap>
                        {project.skills.map((skill) => (
                          <Badge key={skill} variant="subtle" size="xs" shape="organic">
                            {skill}
                          </Badge>
                        ))}
                      </BadgeGroup>
                    </div>
                  </CardContent>
                  
                  <CardFooter justify="between">
                    <Button variant="ghost" size="sm">
                      Learn More
                    </Button>
                    <Button variant="primary" size="sm">
                      Apply Now
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </Stagger>
        </Motion>

        {/* Footer */}
        <Motion preset="fadeIn" className="text-center py-12">
          <div className="space-y-4">
            <h3 className="heading-craft text-2xl text-text-primary">
              Ready to craft something amazing?
            </h3>
            <p className="body-craft text-text-secondary max-w-2xl mx-auto">
              The Artisan Craft design system brings warmth, personality, and human touch 
              to your digital experiences. Every component is thoughtfully designed to 
              celebrate the craft of great work.
            </p>
            <ButtonGroup spacing="lg">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
              <Button variant="accent" size="lg">
                View Documentation
              </Button>
            </ButtonGroup>
          </div>
        </Motion>
      </div>
    </div>
  );
};

export default ShowcaseDemo;
