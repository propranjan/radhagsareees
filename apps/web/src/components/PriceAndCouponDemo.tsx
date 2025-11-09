/**
 * Sample usage component demonstrating price formatting and coupon system
 */

'use client';

import React, { useState } from 'react';
import { usePrice, useDiscount, useTax, useShipping, useOrderSummary } from '../hooks/usePrice';
import { useCoupons, useCouponInput, useCouponDisplay, useCartWithCoupon } from '../hooks/useCoupons';
import { type CartSummary, type CartItem } from '../lib/coupons';

// Sample cart data
const sampleCartItems: CartItem[] = [
  {
    id: '1',
    productId: 'saree-1',
    categoryId: 'sarees',
    price: 1299,
    quantity: 2,
    title: 'Elegant Silk Saree',
  },
  {
    id: '2', 
    productId: 'blouse-1',
    categoryId: 'blouses',
    price: 599,
    quantity: 1,
    title: 'Designer Blouse',
  },
];

const sampleCart: CartSummary = {
  items: sampleCartItems,
  subtotal: sampleCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  userId: 'user-123',
  isNewUser: false,
};

export default function PriceAndCouponDemo() {
  // Price formatting hooks
  const { price, listing, cart, total, currency, percentage } = usePrice();
  const discount = useDiscount();
  const tax = useTax();
  const shipping = useShipping();
  const orderSummary = useOrderSummary();

  // Coupon management hooks
  const coupons = useCoupons();
  const couponInput = useCouponInput(sampleCart);
  const couponDisplay = useCouponDisplay();
  const cartWithCoupon = useCartWithCoupon(sampleCart, coupons.appliedCoupon);

  const [orderValue] = useState(3197); // ₹2598 + ₹599 = ₹3197
  const [isExpress, setIsExpress] = useState(false);
  const [isCOD, setIsCOD] = useState(false);

  // Sample product prices for demonstration
  const originalPrice = 1299;
  const salePrice = 999;

  // Load available coupons on component mount
  React.useEffect(() => {
    coupons.loadAvailableCoupons(sampleCart.userId, sampleCart.isNewUser);
  }, [coupons, sampleCart.userId, sampleCart.isNewUser]);

  const handleApplyCoupon = async () => {
    if (couponInput.code) {
      const success = await coupons.applyCoupon(couponInput.code, sampleCart);
      if (success) {
        couponInput.setCode('');
        couponInput.clearValidation();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Price Formatting & Coupon System Demo</h1>

      {/* Price Formatting Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Price Formatting Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Basic Formatting</h3>
            <div className="space-y-2 text-sm">
              <div>Standard: {price(1299)}</div>
              <div>Listing: {listing(1299)}</div>
              <div>Cart: {cart(1299)}</div>
              <div>Total: {total(1299)}</div>
              <div>Currency (next-intl): {currency(1299)}</div>
              <div>Percentage: {percentage(0.25)}</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Discount Formatting</h3>
            <div className="space-y-2 text-sm">
              {(() => {
                const discountInfo = discount.format(originalPrice, salePrice);
                return (
                  <>
                    <div>Original: <span className="line-through text-gray-500">{discountInfo.original}</span></div>
                    <div>Sale Price: <span className="text-red-600 font-semibold">{discountInfo.discounted}</span></div>
                    <div>Discount: <span className="text-green-600">{discountInfo.discount}</span></div>
                    <div>You Save: <span className="text-green-600">{discountInfo.savings}</span></div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Tax and Shipping Calculations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Tax & Shipping Calculations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Tax Breakdown</h3>
            <div className="space-y-2 text-sm">
              {(() => {
                const taxInfo = tax.format(orderValue);
                return (
                  <>
                    <div>{taxInfo.formatted.gst}</div>
                    {taxInfo.formatted.luxuryTax && <div>{taxInfo.formatted.luxuryTax}</div>}
                    <div className="font-semibold">{taxInfo.formatted.total}</div>
                  </>
                );
              })()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Shipping Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="express"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                />
                <label htmlFor="express">Express Delivery (+₹99)</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cod"
                  checked={isCOD}
                  onChange={(e) => setIsCOD(e.target.checked)}
                />
                <label htmlFor="cod">Cash on Delivery (+₹49)</label>
              </div>
              <div className="space-y-2 text-sm">
                {(() => {
                  const shippingInfo = shipping.format(orderValue, isExpress, isCOD);
                  return (
                    <>
                      <div>{shippingInfo.formatted.shipping}</div>
                      {shippingInfo.formatted.cod && <div>{shippingInfo.formatted.cod}</div>}
                      <div className="font-semibold">{shippingInfo.formatted.total}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon System */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Coupon System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Apply Coupon</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput.code}
                  onChange={(e) => couponInput.setCode(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={coupons.loading || !couponInput.isValid}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {coupons.loading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              
              {couponInput.validationResult && (
                <div className={`text-sm ${couponInput.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {couponInput.error || 'Valid coupon code'}
                </div>
              )}
              
              {coupons.error && (
                <div className="text-sm text-red-600">{coupons.error}</div>
              )}
              
              {coupons.appliedCoupon && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-green-800">
                        {coupons.appliedCoupon.coupon.title}
                      </div>
                      <div className="text-sm text-green-600">
                        {couponDisplay.formatCouponSavings(coupons.appliedCoupon)}
                      </div>
                    </div>
                    <button
                      onClick={coupons.removeCoupon}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Available Coupons</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {coupons.availableCoupons.map((coupon) => (
                <div key={coupon.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{coupon.code}</div>
                      <div className="text-sm text-gray-600">{coupon.description}</div>
                      <div className="text-xs text-gray-500">
                        {couponDisplay.formatValidUntil(coupon.validUntil)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        {couponDisplay.formatCouponDiscount(coupon)}
                      </div>
                      {coupon.minOrderValue && (
                        <div className="text-xs text-gray-500">
                          {couponDisplay.formatMinOrderValue(coupon.minOrderValue)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
        
        <div className="space-y-3">
          {sampleCart.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.title} (x{item.quantity})</span>
              <span>{cart(item.price * item.quantity)}</span>
            </div>
          ))}
          
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{cartWithCoupon.formattedTotals.subtotal}</span>
            </div>
            
            {cartWithCoupon.formattedTotals.discount && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount:</span>
                <span>{cartWithCoupon.formattedTotals.discount}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Tax (18% GST):</span>
              <span>{cartWithCoupon.formattedTotals.tax.gst}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{cartWithCoupon.formattedTotals.shipping.shipping}</span>
            </div>
            
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{cartWithCoupon.formattedTotals.total}</span>
            </div>
            
            {cartWithCoupon.formattedTotals.savings && (
              <div className="text-center text-green-600 font-medium">
                🎉 {cartWithCoupon.formattedTotals.savings}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}