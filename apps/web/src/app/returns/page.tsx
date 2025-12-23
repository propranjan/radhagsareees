import Link from 'next/link';
import { 
  RotateCcw, 
  Shield, 
  Clock, 
  CheckCircle, 
  Package, 
  CreditCard,
  Phone,
  Mail,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Header from '@/components/Header';

export const metadata = {
  title: 'Return & Refund Policy | Radha G Sarees',
  description: 'Learn about our hassle-free return and refund policy. 7-day returns, easy exchanges, and secure refunds via Razorpay.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
              Return & Refund Policy
            </h1>
            <p className="text-xl text-gray-600">
              Shop with confidence. We ensure a hassle-free return experience.
            </p>
          </div>
        </div>
      </section>

      {/* Policy Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">7-Day Returns</h3>
              <p className="text-gray-600 text-sm">Return within 7 days of delivery for a full refund</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Exchange</h3>
              <p className="text-gray-600 text-sm">Free exchange for size or color within 7 days</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Refunds</h3>
              <p className="text-gray-600 text-sm">Refunds processed within 5-7 business days via Razorpay</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
              <p className="text-gray-600 text-sm">100% authentic products with quality assurance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Return Guidelines */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-12">
              Return Policy Guidelines
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Eligible for Returns */}
              <div className="bg-green-50 rounded-2xl p-8">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Eligible for Returns
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Unused items with original tags</p>
                      <p className="text-sm text-gray-600">Tags must be intact and attached</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Items in original packaging</p>
                      <p className="text-sm text-gray-600">Complete packaging with all accessories</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Damaged or defective products</p>
                      <p className="text-sm text-gray-600">Manufacturing defects or damage during transit</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Wrong item delivered</p>
                      <p className="text-sm text-gray-600">Different from what you ordered</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Size or color mismatch</p>
                      <p className="text-sm text-gray-600">Significantly different from website images</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Not Eligible for Returns */}
              <div className="bg-red-50 rounded-2xl p-8">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  Not Eligible for Returns
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 text-sm font-bold">
                      ✕
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Items used, washed, or altered</p>
                      <p className="text-sm text-gray-600">Any signs of use or washing</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 text-sm font-bold">
                      ✕
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Items without original tags/packaging</p>
                      <p className="text-sm text-gray-600">Missing tags, labels, or packaging</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 text-sm font-bold">
                      ✕
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Customized or personalized orders</p>
                      <p className="text-sm text-gray-600">Made-to-order or custom designs</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 text-sm font-bold">
                      ✕
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Returns requested after 7 days</p>
                      <p className="text-sm text-gray-600">Beyond the return window</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-red-600 text-sm font-bold">
                      ✕
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">Sale or discounted items</p>
                      <p className="text-sm text-gray-600">Items purchased at clearance prices</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-4">
              How to Return & Get Refund
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Simple 3-step process to return your order
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm h-full">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Initiate Return</h3>
                  <p className="text-gray-600">
                    Contact us within 7 days of delivery via email or phone with your order ID and reason for return.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary-400" />
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm h-full">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Ship the Item</h3>
                  <p className="text-gray-600">
                    Schedule a pickup or drop the item at the nearest courier. We'll provide the shipping label.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary-400" />
                </div>
              </div>

              <div>
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm h-full">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Get Refund</h3>
                  <p className="text-gray-600">
                    Once we receive and inspect the item, refund will be credited within 5-7 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Methods */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-12">
              Refund Methods
            </h2>

            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <CreditCard className="w-10 h-10 text-primary-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Secure Refunds via Razorpay</h3>
                  <p className="text-gray-600">All refunds are processed through our secure payment partner</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Online Payments</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Credit/Debit Card: 5-7 business days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      UPI: 2-3 business days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Net Banking: 5-7 business days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Wallets: 2-3 business days
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Cash on Delivery (COD)</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Bank Transfer: 5-7 business days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Store Credit: Instant
                    </li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-4">
                    * For COD orders, please provide your bank account details for refund processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exchange Policy */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-8 h-8 text-primary-600" />
                  <h2 className="text-3xl font-serif font-bold text-gray-900">
                    Easy Exchange
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Not happy with the size or color? We offer free exchanges within 7 days of delivery.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Exchange for different size
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Exchange for different color
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Free pickup and delivery
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Subject to stock availability
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">How to Exchange</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <p className="text-gray-600">Contact us with your order ID and exchange request</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <p className="text-gray-600">We'll confirm availability and schedule pickup</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <p className="text-gray-600">New item shipped once we receive the original</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Returns */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              Need Help with Returns?
            </h2>
            <p className="text-primary-100 text-xl mb-8">
              Our customer support team is here to help you with the return process.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="mailto:returns@radhagsarees.com"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                returns@radhagsarees.com
              </a>
              <a
                href="tel:+919876543210"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-colors flex items-center justify-center gap-3"
              >
                <Phone className="w-5 h-5" />
                +91 98765 43210
              </a>
            </div>
            <p className="text-primary-200 mt-6 text-sm">
              Customer Support: Monday - Saturday, 10:00 AM - 6:00 PM IST
            </p>
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
            <Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
