"use client";

import Header from '@/components/Header';
import Link from 'next/link';
import { Heart, Award, Users, MapPin, Calendar, Sparkles, Target, Eye } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Our Story
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            A legacy of elegance, tradition, and trust since 1996
          </p>
        </div>
      </div>

      {/* Our Heritage Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Calendar className="w-8 h-8 text-primary-600" />
              <h2 className="text-3xl font-serif font-bold text-gray-900">Our Heritage</h2>
            </div>
            
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="text-center text-xl leading-relaxed mb-8">
                <strong className="text-primary-700">Radha G Sarees</strong> began its journey in <strong>1996</strong> in the historic town of <strong>Tamluk, West Bengal</strong>, 
                founded by <strong>Shri Bimal Pradhan</strong> with a vision to bring the finest traditional sarees to every woman.
              </p>
              
              <div className="bg-primary-50 rounded-2xl p-8 mb-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Beginning</h3>
                    <p className="text-gray-600 mb-4">
                      What started as a small shop in the bustling markets of Tamluk has now grown into a beloved destination 
                      for saree enthusiasts across the region. Shri Bimal Pradhan, with his keen eye for quality and deep 
                      understanding of traditional textiles, laid the foundation of a business built on trust, quality, and 
                      exceptional customer service.
                    </p>
                    <p className="text-gray-600">
                      Tamluk, known for its rich cultural heritage and being one of the oldest cities in Bengal, 
                      was the perfect place to start a venture dedicated to preserving and promoting the art of 
                      traditional Indian weaving. Our founder traveled extensively to weaving clusters across India, 
                      personally selecting each piece to ensure our customers receive only the finest quality sarees.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-center">
                Over nearly <strong>three decades</strong>, we have served thousands of happy customers, 
                becoming a trusted name for wedding trousseaus, festive collections, and everyday elegance. 
                Our commitment to quality and authenticity has been passed down through generations, 
                and today we continue to uphold the values that our founder instilled in every thread of our business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mission */}
              <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <Target className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900">Our Mission</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    To bring the timeless beauty of traditional Indian sarees to every woman, 
                    making elegance accessible without compromising on quality or authenticity.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Curate the finest handwoven and designer sarees from across India</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Support traditional artisans and preserve ancient weaving techniques</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Provide exceptional customer service with personalized styling advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Make luxury sarees accessible through fair and transparent pricing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vision */}
              <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <Eye className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900">Our Vision</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    To become the most trusted and beloved destination for traditional Indian sarees, 
                    known for our unwavering commitment to quality, authenticity, and customer satisfaction.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Be the first choice for brides and families across India and beyond</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Bridge tradition with technology through seamless online shopping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Create a global platform for Indian handloom artisans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span>Inspire the next generation to embrace traditional Indian wear</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center text-gray-900 mb-12">
            What Sets Us Apart
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentic Quality</h3>
              <p className="text-gray-600">
                Every saree is handpicked from trusted weavers and artisans across India. 
                We guarantee authenticity with detailed fabric information and care instructions.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer First</h3>
              <p className="text-gray-600">
                Built on nearly 30 years of personal relationships with our customers. 
                We treat every customer like family, offering personalized recommendations and styling advice.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Artisan Support</h3>
              <p className="text-gray-600">
                We work directly with weaver communities, ensuring fair wages and 
                helping preserve traditional techniques for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center text-gray-900 mb-12">
            Our Journey
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200" />
              
              {/* Timeline items */}
              <div className="space-y-8">
                <div className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold z-10">
                    1996
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">The Foundation</h3>
                    <p className="text-gray-600">
                      Shri Bimal Pradhan opens the first Radha G Sarees shop in Tamluk, West Bengal, 
                      with a small but carefully curated collection of traditional sarees.
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold z-10">
                    2005
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Expanding Horizons</h3>
                    <p className="text-gray-600">
                      Established direct partnerships with weaving communities in Varanasi, Kanchipuram, 
                      and other handloom hubs, bringing exclusive collections to our customers.
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold z-10">
                    2015
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Growing Family</h3>
                    <p className="text-gray-600">
                      The next generation joins the business, bringing fresh ideas while 
                      maintaining the core values of quality and customer service.
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold z-10">
                    2024
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Digital Transformation</h3>
                    <p className="text-gray-600">
                      Launched our online store to serve customers across India and worldwide, 
                      bringing the Radha G Sarees experience to your doorstep.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Experience the Radha G Difference
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who have made us a part of their special moments. 
            Explore our collection and find your perfect saree today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/catalog" 
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-900 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Browse Collection
            </Link>
            <Link 
              href="/categories" 
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              View Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Radha G Sarees. All rights reserved.</p>
          <p className="text-sm text-gray-500 mt-2">
            Serving customers with love since 1996 • Tamluk, West Bengal
          </p>
        </div>
      </footer>
    </div>
  );
}
