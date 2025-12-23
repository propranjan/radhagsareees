"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageCircle,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Simulate form submission - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            We&apos;d love to hear from you. Whether you have a question about our sarees, 
            need styling advice, or want to place a custom order.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Store Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">
                Visit Our Store
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Store Address</h3>
                    <p className="text-gray-600 mt-1">
                      Radha G Sarees<br />
                      Main Road, Tamluk<br />
                      Purba Medinipur, West Bengal<br />
                      PIN: 721636, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600 mt-1">
                      <a href="tel:+919876543210" className="hover:text-primary-600">
                        +91 98765 43210
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <a href="tel:+919876543211" className="hover:text-primary-600">
                        +91 98765 43211
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">
                      <a href="mailto:info@radhagsarees.com" className="hover:text-primary-600">
                        info@radhagsarees.com
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <a href="mailto:orders@radhagsarees.com" className="hover:text-primary-600">
                        orders@radhagsarees.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Store Hours</h3>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>Monday - Saturday: 10:00 AM - 8:00 PM</p>
                      <p>Sunday: 11:00 AM - 6:00 PM</p>
                      <p className="text-sm text-primary-600">Open all days including holidays!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">
                Follow Us
              </h2>
              <p className="text-gray-600 mb-4">
                Stay updated with our latest collections and offers
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://facebook.com/radhagsarees" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                </a>
                <a 
                  href="https://instagram.com/radhagsarees" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-pink-100 rounded-full hover:bg-pink-200 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-pink-600" />
                </a>
                <a 
                  href="https://youtube.com/@radhagsarees" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                >
                  <Youtube className="w-5 h-5 text-red-600" />
                </a>
                <a 
                  href="https://wa.me/919876543210" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-primary-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Support
              </h2>
              <div className="space-y-3">
                <a 
                  href="https://wa.me/919876543210?text=Hi, I have a question about your sarees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Chat on WhatsApp</span>
                </a>
                <a 
                  href="tel:+919876543210"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Call Now</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Send className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Send Us a Message
                </h2>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="order">Order Related</option>
                        <option value="custom">Custom Order Request</option>
                        <option value="wholesale">Wholesale Inquiry</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      * Required fields
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Map Placeholder */}
            <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-200 h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Visit us at Tamluk, West Bengal
                  </p>
                  <a 
                    href="https://maps.google.com/?q=Tamluk,West+Bengal,India"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Do you ship internationally?</h3>
              <p className="text-gray-600">
                Yes, we ship worldwide! International shipping typically takes 7-14 business days. 
                Shipping charges vary based on destination.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I place a custom order?</h3>
              <p className="text-gray-600">
                Absolutely! We specialize in custom orders for weddings and special occasions. 
                Contact us with your requirements and we&apos;ll work with our artisans to create your dream saree.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What is your return policy?</h3>
              <p className="text-gray-600">
                We offer a 7-day return policy for unused items with original tags. 
                Custom orders are non-returnable. Please check our Returns page for complete details.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer wholesale pricing?</h3>
              <p className="text-gray-600">
                Yes, we offer special pricing for bulk orders and resellers. 
                Please contact us through the form above or WhatsApp for wholesale inquiries.
              </p>
            </div>
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
