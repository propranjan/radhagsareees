/**
 * Shiprocket Integration Library
 * 
 * This module provides authentication and API utilities for Shiprocket
 * delivery aggregation service.
 * 
 * Environment Variables Required:
 * - SHIPROCKET_EMAIL: Shiprocket account email
 * - SHIPROCKET_PASSWORD: Shiprocket account password
 * - SHIPROCKET_TOKEN: (Optional) Pre-generated token for faster startup
 * 
 * @see https://apidocs.shiprocket.in/
 */

import { prisma } from '@radhagsareees/db';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Token expiry buffer (refresh 1 hour before actual expiry)
const TOKEN_EXPIRY_BUFFER_MS = 60 * 60 * 1000;

// Cached token and expiry time
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

// ============================================================================
// TYPES
// ============================================================================

export interface ShiprocketAuthResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
  token: string;
  created_at: string;
}

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email?: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'Prepaid' | 'COD';
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

export interface ShiprocketPickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  lat: string;
  long: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string;
      delivered_date: string;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string;
      edd: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      sr_status: string;
      sr_status_label: string;
    }>;
  };
}

export interface ServiceabilityResponse {
  status: number;
  data: {
    available_courier_companies: Array<{
      id: number;
      name: string;
      freight_charge: number;
      city: string;
      state: string;
      min_weight: number;
      estimated_delivery_days: string;
      etd: string;
      cod: number;
      rating: number;
      is_custom_rate: number;
    }>;
  };
}

export interface ShiprocketError {
  status_code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get Shiprocket authentication token.
 * 
 * Uses cached token if valid, otherwise authenticates with Shiprocket API.
 * Token is cached in memory and refreshed before expiry.
 * 
 * @returns Promise<string> - Valid authentication token
 * @throws Error if authentication fails
 */
export async function getShiprocketToken(): Promise<string> {
  // Check for pre-configured token in environment
  const envToken = process.env.SHIPROCKET_TOKEN;
  
  // If we have a valid cached token, return it
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken;
  }

  // If env token is provided and no cached token, use env token
  if (envToken && !cachedToken) {
    cachedToken = envToken;
    // Assume env token is valid for 24 hours
    tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);
    return cachedToken;
  }

  // Authenticate with Shiprocket
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables are required');
  }

  try {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Shiprocket authentication failed: ${error.message || response.statusText}`);
    }

    const data: ShiprocketAuthResponse = await response.json();
    
    // Cache the token (Shiprocket tokens are valid for 10 days)
    cachedToken = data.token;
    tokenExpiresAt = Date.now() + (10 * 24 * 60 * 60 * 1000); // 10 days

    console.log('[Shiprocket] Authentication successful');
    return cachedToken;
  } catch (error) {
    console.error('[Shiprocket] Authentication error:', error);
    throw error;
  }
}

/**
 * Clear cached token (useful for testing or forced re-authentication)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = null;
}

// ============================================================================
// API REQUEST HELPER
// ============================================================================

/**
 * Make an authenticated request to Shiprocket API
 * 
 * @param endpoint - API endpoint (without base URL)
 * @param options - Fetch options
 * @returns Promise<T> - API response data
 */
async function shiprocketRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getShiprocketToken();

  const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ShiprocketError = {
      status_code: response.status,
      message: data.message || 'Shiprocket API error',
      errors: data.errors,
    };
    console.error('[Shiprocket] API Error:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// PICKUP LOCATIONS / WAREHOUSE
// ============================================================================

/**
 * Get all pickup locations (warehouses) from Shiprocket
 */
export async function getPickupLocations(): Promise<ShiprocketPickupLocation[]> {
  const response = await shiprocketRequest<{ 
    data: { shipping_address: ShiprocketPickupLocation[] } 
  }>('/settings/company/pickup');
  
  return response.data.shipping_address;
}

/**
 * Add a new pickup location (warehouse) in Shiprocket
 */
export async function addPickupLocation(warehouse: {
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}): Promise<{ pickup_id: number; address: ShiprocketPickupLocation }> {
  return shiprocketRequest('/settings/company/addpickup', {
    method: 'POST',
    body: JSON.stringify(warehouse),
  });
}

/**
 * Sync a warehouse with Shiprocket pickup location
 * Creates pickup location if not exists, updates database with Shiprocket IDs
 */
export async function syncWarehouseWithShiprocket(warehouseId: string): Promise<void> {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw new Error(`Warehouse not found: ${warehouseId}`);
  }

  // If already synced, skip
  if (warehouse.shiprocketPickupId) {
    console.log(`[Shiprocket] Warehouse ${warehouse.name} already synced`);
    return;
  }

  // Create pickup location in Shiprocket
  const result = await addPickupLocation({
    pickup_location: warehouse.code,
    name: warehouse.contactPerson || warehouse.name,
    email: warehouse.email || '',
    phone: warehouse.phone,
    address: warehouse.address,
    address_2: warehouse.address2 || '',
    city: warehouse.city,
    state: warehouse.state,
    country: warehouse.country,
    pin_code: warehouse.pincode,
  });

  // Update warehouse with Shiprocket pickup ID
  await prisma.warehouse.update({
    where: { id: warehouseId },
    data: {
      shiprocketPickupId: result.pickup_id,
      pickupLocationCode: warehouse.code,
    },
  });

  console.log(`[Shiprocket] Warehouse ${warehouse.name} synced with pickup ID: ${result.pickup_id}`);
}

// ============================================================================
// SERVICEABILITY CHECK
// ============================================================================

/**
 * Check if a pincode is serviceable and get available courier options
 */
export async function checkServiceability(params: {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number; // in kg
  cod: boolean;
  length?: number; // in cm
  breadth?: number; // in cm
  height?: number; // in cm
}): Promise<ServiceabilityResponse['data']['available_courier_companies']> {
  const queryParams = new URLSearchParams({
    pickup_postcode: params.pickup_postcode,
    delivery_postcode: params.delivery_postcode,
    weight: params.weight.toString(),
    cod: params.cod ? '1' : '0',
    ...(params.length && { length: params.length.toString() }),
    ...(params.breadth && { breadth: params.breadth.toString() }),
    ...(params.height && { height: params.height.toString() }),
  });

  const response = await shiprocketRequest<ServiceabilityResponse>(
    `/courier/serviceability?${queryParams.toString()}`
  );

  return response.data.available_courier_companies;
}

// ============================================================================
// ORDER CREATION
// ============================================================================

/**
 * Create an order in Shiprocket
 * 
 * @param orderPayload - Shiprocket order payload
 * @returns ShiprocketOrderResponse - Created order details
 */
export async function createShiprocketOrder(
  orderPayload: ShiprocketOrderPayload
): Promise<ShiprocketOrderResponse> {
  return shiprocketRequest('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
}

/**
 * Generate AWB (Airway Bill) for a shipment
 * Uses auto-select courier by default
 */
export async function generateAWB(shipmentId: number, courierId?: number): Promise<{
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  applied_weight: number;
  routing_code: string;
}> {
  const payload: Record<string, any> = {
    shipment_id: shipmentId,
  };

  // If no courier specified, let Shiprocket auto-select
  if (courierId) {
    payload.courier_id = courierId;
  }

  return shiprocketRequest('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Request pickup for a shipment
 */
export async function requestPickup(shipmentId: number): Promise<{
  pickup_scheduled_date: string;
  pickup_token_number: string;
  status: number;
}> {
  return shiprocketRequest('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/**
 * Generate shipping label for a shipment
 */
export async function generateLabel(shipmentId: number): Promise<{
  label_url: string;
  response: string;
}> {
  return shiprocketRequest('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/**
 * Generate invoice for a shipment
 */
export async function generateInvoice(orderIds: number[]): Promise<{
  invoice_url: string;
  not_created: number[];
}> {
  return shiprocketRequest('/orders/print/invoice', {
    method: 'POST',
    body: JSON.stringify({ ids: orderIds }),
  });
}

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Track a shipment by AWB code
 */
export async function trackShipment(awbCode: string): Promise<ShiprocketTrackingResponse> {
  return shiprocketRequest(`/courier/track/awb/${awbCode}`);
}

/**
 * Track a shipment by shipment ID
 */
export async function trackByShipmentId(shipmentId: number): Promise<ShiprocketTrackingResponse> {
  return shiprocketRequest(`/courier/track/shipment/${shipmentId}`);
}

// ============================================================================
// ORDER CANCELLATION
// ============================================================================

/**
 * Cancel a Shiprocket order
 */
export async function cancelOrder(orderIds: number[]): Promise<{ status: number }> {
  return shiprocketRequest('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: orderIds }),
  });
}

/**
 * Cancel a shipment (after AWB generated)
 */
export async function cancelShipment(awbCodes: string[]): Promise<{ status: number }> {
  return shiprocketRequest('/orders/cancel/shipment/awbs', {
    method: 'POST',
    body: JSON.stringify({ awbs: awbCodes }),
  });
}

// ============================================================================
// STATUS MAPPING
// ============================================================================

/**
 * Map Shiprocket status code to internal FulfillmentStatus
 */
export function mapShiprocketStatus(shiprocketStatus: string): string {
  const statusMap: Record<string, string> = {
    // Order/Shipment created
    'NEW': 'CREATED',
    'AWB ASSIGNED': 'CREATED',
    'LABEL GENERATED': 'CREATED',
    
    // Pickup
    'PICKUP SCHEDULED': 'PICKUP_SCHEDULED',
    'PICKUP QUEUED': 'PICKUP_SCHEDULED',
    'PICKUP GENERATED': 'PICKUP_SCHEDULED',
    'PICKED UP': 'PICKED',
    
    // In Transit
    'IN TRANSIT': 'IN_TRANSIT',
    'SHIPPED': 'IN_TRANSIT',
    'REACHED AT DESTINATION HUB': 'IN_TRANSIT',
    
    // Out for Delivery
    'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
    
    // Delivered
    'DELIVERED': 'DELIVERED',
    
    // RTO
    'RTO INITIATED': 'RTO_INITIATED',
    'RTO IN TRANSIT': 'RTO_IN_TRANSIT',
    'RTO DELIVERED': 'RTO_DELIVERED',
    'RTO ACKNOWLEDGED': 'RTO_DELIVERED',
    
    // Cancelled
    'CANCELED': 'CANCELLED',
    'CANCELLED': 'CANCELLED',
    'CANCELLATION REQUESTED': 'CANCELLED',
  };

  const normalizedStatus = shiprocketStatus.toUpperCase().trim();
  return statusMap[normalizedStatus] || 'IN_TRANSIT';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format date for Shiprocket API (YYYY-MM-DD HH:mm)
 */
export function formatShiprocketDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Calculate package dimensions and weight
 * Default values for saree packaging
 */
export function getDefaultPackageDimensions(itemCount: number = 1): {
  length: number;
  breadth: number;
  height: number;
  weight: number;
} {
  // Default dimensions for saree package (in cm and kg)
  const baseLength = 30;
  const baseBreadth = 20;
  const baseHeight = 5;
  const baseWeight = 0.5; // 500 grams per saree

  return {
    length: baseLength,
    breadth: baseBreadth,
    height: baseHeight * Math.ceil(itemCount / 2), // Stack 2 sarees per layer
    weight: baseWeight * itemCount,
  };
}
