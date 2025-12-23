// Test Shiprocket webhook locally
// Run with: node test-webhook.mjs [event_type]
// Examples:
//   node test-webhook.mjs delivered
//   node test-webhook.mjs picked
//   node test-webhook.mjs razorpay_captured

const SHIPROCKET_WEBHOOK_URL = 'http://localhost:3000/api/shiprocket/webhook';
const RAZORPAY_WEBHOOK_URL = 'http://localhost:3000/api/razorpay/webhook';
const SHIPROCKET_TOKEN = process.env.TEST_TOKEN || 'bTJ6POFto0+5dj3FxAKuCaqbG852tVba7qWrvHZVCW4=';

// Sample Shiprocket webhook payloads for different events
const testPayloads = {
  // Shipment picked up
  picked: {
    order_id: 12345,
    shipment_id: 67890,
    awb: 'AWB123456789',
    current_status: 'PICKED UP',
    current_status_id: 6,
    courier_name: 'Bluedart',
    channel_order_id: 'TEST-ORDER-001',
    edd: '2025-12-25',
    scans: [
      {
        date: '2025-12-22',
        time: '10:30:00',
        location: 'Mumbai Hub',
        activity: 'Shipment picked up',
        status: 'PICKED UP',
      },
    ],
  },
  
  // In transit
  in_transit: {
    order_id: 12345,
    shipment_id: 67890,
    awb: 'AWB123456789',
    current_status: 'IN TRANSIT',
    current_status_id: 18,
    courier_name: 'Bluedart',
    channel_order_id: 'TEST-ORDER-001',
    edd: '2025-12-25',
    scans: [
      {
        date: '2025-12-22',
        time: '14:00:00',
        location: 'Delhi Hub',
        activity: 'Shipment in transit',
        status: 'IN TRANSIT',
      },
    ],
  },
  
  // Out for delivery
  out_for_delivery: {
    order_id: 12345,
    shipment_id: 67890,
    awb: 'AWB123456789',
    current_status: 'OUT FOR DELIVERY',
    current_status_id: 17,
    courier_name: 'Bluedart',
    channel_order_id: 'TEST-ORDER-001',
    edd: '2025-12-22',
    scans: [
      {
        date: '2025-12-22',
        time: '09:00:00',
        location: 'Kolkata Local',
        activity: 'Out for delivery',
        status: 'OUT FOR DELIVERY',
      },
    ],
  },
  
  // Delivered
  delivered: {
    order_id: 12345,
    shipment_id: 67890,
    awb: 'AWB123456789',
    current_status: 'DELIVERED',
    current_status_id: 7,
    courier_name: 'Bluedart',
    channel_order_id: 'TEST-ORDER-001',
    pod: 'https://example.com/pod/12345.jpg',
    scans: [
      {
        date: '2025-12-22',
        time: '11:30:00',
        location: 'Kolkata',
        activity: 'Delivered to customer',
        status: 'DELIVERED',
      },
    ],
  },
  
  // RTO Initiated
  rto_initiated: {
    order_id: 12345,
    shipment_id: 67890,
    awb: 'AWB123456789',
    current_status: 'RTO INITIATED',
    current_status_id: 14,
    courier_name: 'Bluedart',
    channel_order_id: 'TEST-ORDER-001',
    rto_initiated: true,
    scans: [
      {
        date: '2025-12-22',
        time: '16:00:00',
        location: 'Kolkata',
        activity: 'Return to origin initiated',
        status: 'RTO INITIATED',
      },
    ],
  },
  
  // Razorpay Payment Captured
  razorpay_captured: {
    _isRazorpay: true,
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test12345',
          order_id: 'order_test67890',
          amount: 150000, // Amount in paise (₹1500)
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          email: 'test@example.com',
          contact: '+919876543210',
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  },
  
  // Razorpay Payment Failed
  razorpay_failed: {
    _isRazorpay: true,
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_failed',
          order_id: 'order_test67890',
          amount: 150000,
          currency: 'INR',
          status: 'failed',
          method: 'card',
          email: 'test@example.com',
          contact: '+919876543210',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed due to insufficient funds',
          error_reason: 'payment_failed',
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  },
};

async function testWebhook(eventType) {
  const payload = testPayloads[eventType];
  
  if (!payload) {
    console.error(`Unknown event type: ${eventType}`);
    console.log('Available types:', Object.keys(testPayloads).join(', '));
    return;
  }
  
  const isRazorpay = payload._isRazorpay;
  const webhookUrl = isRazorpay ? RAZORPAY_WEBHOOK_URL : SHIPROCKET_WEBHOOK_URL;
  
  // Remove the internal flag before sending
  const sendPayload = { ...payload };
  delete sendPayload._isRazorpay;

  console.log(`\n📤 Testing webhook: ${eventType.toUpperCase()}`);
  console.log(`Endpoint: ${webhookUrl}`);
  console.log('Payload:', JSON.stringify(sendPayload, null, 2));
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Shiprocket uses Bearer token, Razorpay uses signature (skip for local testing)
    if (!isRazorpay) {
      headers['Authorization'] = `Bearer ${SHIPROCKET_TOKEN}`;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(sendPayload),
    });
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error calling webhook:', error.message);
  }
}

// Get the event type from command line or default to 'delivered'
const eventType = process.argv[2] || 'delivered';

console.log('🔧 Webhook Local Test');
console.log('=====================');
console.log(`Available events:`);
console.log('  Shiprocket: picked, in_transit, out_for_delivery, delivered, rto_initiated');
console.log('  Razorpay: razorpay_captured, razorpay_failed');
console.log('');

testWebhook(eventType);
