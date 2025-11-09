import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { RazorpayOrderData, LowStockEvent } from './checkout-validations';

// Initialize Razorpay instance conditionally
let razorpay: Razorpay | null = null;

function getRazorpayInstance() {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// Environment variables
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(orderData: RazorpayOrderData) {
  try {
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      throw new Error('Razorpay configuration is missing');
    }
    
    const order = await razorpayInstance.orders.create({
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency,
      receipt: orderData.receipt,
      notes: orderData.notes || {},
    });

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpayWebhook(
  payload: string,
  signature: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

/**
 * Calculate order totals including tax and shipping
 */
export function calculateOrderTotals(items: Array<{
  quantity: number;
  price: number;
}>) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Calculate shipping (free over ₹1000, otherwise ₹50)
  const shipping = subtotal >= 100000 ? 0 : 5000; // Amounts in paise
  
  // Calculate tax (18% GST)
  const tax = Math.round(subtotal * 0.18);
  
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
}

/**
 * Generate order receipt ID
 */
export function generateReceiptId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `RGS_${timestamp}_${random}`;
}

/**
 * Validate payment amount against order
 */
export function validatePaymentAmount(
  paymentAmount: number,
  orderAmount: number,
  tolerance = 0
): boolean {
  return Math.abs(paymentAmount - orderAmount) <= tolerance;
}

/**
 * Format amount from paise to rupees for display
 */
export function formatAmountToRupees(amountInPaise: number): number {
  return amountInPaise / 100;
}

/**
 * Convert amount from rupees to paise for Razorpay
 */
export function formatAmountToPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

/**
 * Emit low stock event (in production, this would send to a queue/webhook)
 */
export async function emitLowStockEvent(event: LowStockEvent): Promise<void> {
  try {
    // In a real application, you might send this to:
    // - A message queue (Redis, RabbitMQ)
    // - An external webhook
    // - A monitoring service
    // - An email notification service
    
    console.warn('LOW STOCK ALERT:', {
      variantId: event.variantId,
      productTitle: event.productTitle,
      variantSku: event.variantSku,
      currentStock: event.currentStock,
      threshold: event.threshold,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // TODO: Implement actual notification system
    // Examples:
    // await sendEmailNotification(event);
    // await publishToQueue('low-stock', event);
    // await webhook.send('/admin/alerts/low-stock', event);
    
  } catch (error) {
    console.error('Failed to emit low stock event:', error);
    // Don't throw here to avoid breaking the main flow
  }
}

/**
 * Razorpay order status mapping
 */
export const RAZORPAY_ORDER_STATUS = {
  created: 'PENDING',
  attempted: 'PENDING', 
  paid: 'CONFIRMED',
} as const;

/**
 * Razorpay payment method mapping
 */
export const RAZORPAY_PAYMENT_METHODS = {
  card: 'Credit/Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Digital Wallet',
  upi: 'UPI',
  emi: 'EMI',
  paylater: 'Pay Later',
} as const;

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string): string {
  return RAZORPAY_PAYMENT_METHODS[method as keyof typeof RAZORPAY_PAYMENT_METHODS] || method;
}

/**
 * Validate Razorpay order ID format
 */
export function isValidRazorpayOrderId(orderId: string): boolean {
  // Razorpay order IDs typically start with "order_" followed by 14 characters
  return /^order_[A-Za-z0-9]{14}$/.test(orderId);
}

/**
 * Validate Razorpay payment ID format
 */
export function isValidRazorpayPaymentId(paymentId: string): boolean {
  // Razorpay payment IDs typically start with "pay_" followed by 14 characters
  return /^pay_[A-Za-z0-9]{14}$/.test(paymentId);
}

/**
 * Create order metadata for tracking
 */
export function createOrderMetadata(params: {
  userId: string;
  shippingAddressId: string;
  itemCount: number;
  couponCode?: string;
}) {
  return {
    user_id: params.userId,
    shipping_address_id: params.shippingAddressId,
    item_count: params.itemCount.toString(),
    coupon_code: params.couponCode || '',
    created_at: new Date().toISOString(),
    source: 'web_checkout',
  };
}