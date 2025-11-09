/**
 * Secure Checkout API Route
 * Demonstrates implementation of all security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '../../../../lib/security/middleware';
import { withValidation, validationSchemas, getValidatedData } from '../../../../lib/security/validation';
import { withRateLimit, rateLimiters } from '../../../../lib/security/rate-limit';

// Compose security middlewares
const secureHandler = withSecurityHeaders(
  withRateLimit(rateLimiters.checkout)(
    withValidation({
      body: validationSchemas.checkout.body
    })(handleCheckout)
  )
);

async function handleCheckout(request: NextRequest) {
  try {
    const { body: checkoutData } = getValidatedData(request);
    
    // Process checkout
    const order = await processOrder(checkoutData);
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl: order.paymentUrl
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}

async function processOrder(data: any) {
  return {
    id: 'order_' + Date.now(),
    paymentUrl: 'https://checkout.razorpay.com/v1/payment-link/pay_example'
  };
}

export { secureHandler as POST };