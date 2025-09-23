import React from 'react';
import Head from 'next/head';
import { ShowcaseDemo } from '@/components/artisan-craft/examples/ShowcaseDemo';

// Showcase page demonstrating the Artisan Craft design system
// This page can be accessed at /artisan-showcase to preview the design system
export default function ArtisanShowcase() {
  return (
    <>
      <Head>
        <title>Artisan Craft Design System - Showcase</title>
        <meta 
          name="description" 
          content="Experience the warmth and craftsmanship of our Artisan Craft design system. Handcrafted components with organic shapes, rich textures, and thoughtful interactions." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" 
          as="style"
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;500&display=swap" 
          as="style"
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap" 
          as="style"
        />
        
        {/* Load fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ShowcaseDemo />
    </>
  );
}
