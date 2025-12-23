'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  Search,
  Info,
  Globe,
  Shield
} from 'lucide-react';
import Header from '@/components/Header';

export default function ShippingInfoPage() {
  const [trackingId, setTrackingId] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setIsTracking(true);
      // Open Shiprocket tracking page in new tab
      window.open(
        `https://www.shiprocket.in/shipment-tracking/?tracking_id=${encodeURIComponent(trackingId.trim())}`,
        '_blank',
        'noopener,noreferrer'
      );
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
              Shipping Information
            </h1>
            <p className="text-xl text-gray-600">
              Fast and reliable delivery powered by Shiprocket. Track your orders in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Track Order Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Track Your Order</h2>
              </div>
              <p className="text-primary-100 mb-6">
                Enter your AWB number or Order ID to track your shipment status in real-time.
              </p>
              <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter AWB Number or Order ID"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTracking ? (
                    'Opening...'
                  ) : (
                    <>
                      Track Now
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              <p className="text-primary-200 text-sm mt-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Tracking opens on Shiprocket's official tracking portal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* International Shipping */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-8 h-8 text-primary-600" />
                  <h2 className="text-3xl font-serif font-bold text-gray-900">
                    International Shipping
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  We ship our beautiful sarees worldwide! Share the elegance of Indian craftsmanship 
                  with friends and family across the globe.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Delivery Time</h4>
                      <p className="text-gray-600 text-sm">7-14 business days depending on destination</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Countries Covered</h4>
                      <p className="text-gray-600 text-sm">USA, UK, Canada, Australia, UAE, Singapore & more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Customs & Duties</h4>
                      <p className="text-gray-600 text-sm">Import duties may apply based on destination country</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">International Rates</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">USA, UK, Canada</span>
                    <span className="font-semibold text-gray-900">₹1,499</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Australia, New Zealand</span>
                    <span className="font-semibold text-gray-900">₹1,699</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">UAE, Singapore, Malaysia</span>
                    <span className="font-semibold text-gray-900">₹999</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Europe (All Countries)</span>
                    <span className="font-semibold text-gray-900">₹1,599</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Other Countries</span>
                    <span className="font-semibold text-gray-900">Contact Us</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Free international shipping on orders above ₹10,000
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              How Delivery Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, transparent, and reliable delivery process
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: 1,
                  title: 'Order Placed',
                  description: 'Your order is confirmed and payment received',
                  icon: Package,
                },
                {
                  step: 2,
                  title: 'Processing',
                  description: 'Quality check and secure packaging within 24 hours',
                  icon: CheckCircle,
                },
                {
                  step: 3,
                  title: 'Shipped',
                  description: 'Handed to courier, tracking link sent via SMS/Email',
                  icon: Truck,
                },
                {
                  step: 4,
                  title: 'Delivered',
                  description: 'Safe delivery to your doorstep',
                  icon: MapPin,
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Partners */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Our Shipping Partners
            </h2>
            <p className="text-xl text-gray-600">
              Powered by Shiprocket - India's #1 eCommerce shipping solution
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Shield className="w-8 h-8 text-primary-600" />
                <h3 className="text-2xl font-bold text-gray-900">Shiprocket Verified Partner</h3>
              </div>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We partner with India's leading courier aggregator to ensure your precious sarees 
                reach you safely. Our network includes BlueDart, Delhivery, FedEx, Ecom Express, 
                and many more trusted carriers.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {['BlueDart', 'Delhivery', 'FedEx', 'Ecom Express', 'DTDC', 'XpressBees'].map((partner) => (
                  <span 
                    key={partner}
                    className="bg-white px-4 py-2 rounded-lg text-gray-700 font-medium shadow-sm"
                  >
                    {partner}
                  </span>
                ))}
              </div>
              <div className="mt-8">
                <a
                  href="https://www.shiprocket.in/shipment-tracking/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Track on Shiprocket
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'How can I track my order?',
                a: 'Once your order is shipped, you will receive an SMS and email with the AWB (tracking) number. You can track your shipment using the tracking form above or directly on Shiprocket\'s tracking portal.',
              },
              {
                q: 'What if my order is delayed?',
                a: 'While we strive for timely deliveries, occasional delays may occur due to weather, festivals, or remote locations. If your order is delayed beyond the estimated time, please contact our support team.',
              },
              {
                q: 'Do you deliver to PO Box addresses?',
                a: 'We currently do not deliver to PO Box addresses. Please provide a complete physical address for delivery.',
              },
              {
                q: 'Can I change my delivery address after placing an order?',
                a: 'Address changes are possible only before the order is shipped. Please contact us immediately at info@radhagsarees.com if you need to update your address.',
              },
              {
                q: 'What happens if I\'m not available during delivery?',
                a: 'The courier will attempt delivery up to 3 times. You can also coordinate with the delivery partner using the tracking details to schedule a convenient time.',
              },
              {
                q: 'Is Cash on Delivery (COD) available?',
                a: 'Yes, COD is available for orders up to ₹25,000 within India. An additional COD handling fee of ₹40 applies.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Need Help with Your Order?
          </h2>
          <p className="text-primary-100 text-xl mb-8 max-w-2xl mx-auto">
            Our customer support team is here to assist you with any shipping queries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Contact Support
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 Radha G Sarees. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/catalog" className="hover:text-white transition-colors">Catalog</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/returns" className="hover:text-white transition-colors">Returns</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
