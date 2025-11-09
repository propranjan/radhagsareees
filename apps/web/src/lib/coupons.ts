/**
 * Coupon System for E-commerce Platform
 * Handles coupon validation, discount calculation, and application
 */

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  title: string;
  description: string;
  status: CouponStatus;
  
  // Discount configuration
  discountValue: number; // Percentage (0-100) or flat amount
  maxDiscountAmount?: number; // Maximum discount for percentage coupons
  minOrderValue?: number; // Minimum order value required
  
  // Usage limits
  usageLimit?: number; // Total usage limit
  usageCount: number; // Current usage count
  userUsageLimit?: number; // Per user usage limit
  
  // Date constraints
  validFrom: Date;
  validUntil: Date;
  
  // Product/category constraints
  applicableCategories?: string[];
  excludedCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  
  // User constraints
  newUsersOnly?: boolean;
  eligibleUsers?: string[];
  
  // Buy X Get Y specific
  buyQuantity?: number;
  getQuantity?: number;
  applicableProductIds?: string[];
}

export interface CouponApplication {
  coupon: Coupon;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: Coupon;
}

export interface CartItem {
  id: string;
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
  title: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  userId?: string;
  isNewUser?: boolean;
}

/**
 * Coupon validation service
 */
export class CouponService {
  private coupons: Map<string, Coupon> = new Map();
  private userUsage: Map<string, Map<string, number>> = new Map();

  /**
   * Add a coupon to the system
   */
  addCoupon(coupon: Coupon): void {
    this.coupons.set(coupon.code.toUpperCase(), coupon);
  }

  /**
   * Get coupon by code
   */
  getCoupon(code: string): Coupon | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  /**
   * Validate coupon code
   */
  validateCoupon(
    code: string,
    cart: CartSummary
  ): CouponValidationResult {
    const coupon = this.getCoupon(code);
    
    if (!coupon) {
      return { isValid: false, error: 'Invalid coupon code' };
    }

    // Check if coupon is active
    if (coupon.status !== CouponStatus.ACTIVE) {
      return { isValid: false, error: 'Coupon is not active' };
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.validFrom) {
      return { isValid: false, error: 'Coupon is not yet valid' };
    }
    
    if (now > coupon.validUntil) {
      return { isValid: false, error: 'Coupon has expired' };
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, error: 'Coupon usage limit exceeded' };
    }

    // Check user-specific constraints
    if (cart.userId) {
      const userUsage = this.getUserUsage(cart.userId, coupon.code);
      
      if (coupon.userUsageLimit && userUsage >= coupon.userUsageLimit) {
        return { isValid: false, error: 'You have already used this coupon' };
      }

      if (coupon.newUsersOnly && !cart.isNewUser) {
        return { isValid: false, error: 'This coupon is only for new users' };
      }

      if (coupon.eligibleUsers && !coupon.eligibleUsers.includes(cart.userId)) {
        return { isValid: false, error: 'You are not eligible for this coupon' };
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && cart.subtotal < coupon.minOrderValue) {
      return { 
        isValid: false, 
        error: `Minimum order value of ₹${coupon.minOrderValue} required` 
      };
    }

    // Check product/category constraints
    const eligibleItems = this.getEligibleItems(cart.items, coupon);
    if (eligibleItems.length === 0 && coupon.type !== CouponType.FREE_SHIPPING) {
      return { 
        isValid: false, 
        error: 'No eligible products in cart for this coupon' 
      };
    }

    return { isValid: true, coupon };
  }

  /**
   * Apply coupon to cart
   */
  applyCoupon(
    code: string,
    cart: CartSummary
  ): CouponApplication | null {
    const validation = this.validateCoupon(code, cart);
    
    if (!validation.isValid || !validation.coupon) {
      return null;
    }

    const coupon = validation.coupon;
    const eligibleItems = this.getEligibleItems(cart.items, coupon);
    
    let discountAmount = 0;
    let freeShipping = false;
    let message = '';

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        const eligibleSubtotal = eligibleItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
        
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
        
        message = `${coupon.discountValue}% discount applied`;
        break;

      case CouponType.FLAT:
        discountAmount = Math.min(coupon.discountValue, cart.subtotal);
        message = `₹${coupon.discountValue} discount applied`;
        break;

      case CouponType.FREE_SHIPPING:
        freeShipping = true;
        message = 'Free shipping applied';
        break;

      case CouponType.BUY_X_GET_Y:
        if (coupon.buyQuantity && coupon.getQuantity && coupon.applicableProductIds) {
          discountAmount = this.calculateBuyXGetYDiscount(
            eligibleItems,
            coupon.buyQuantity,
            coupon.getQuantity,
            coupon.applicableProductIds
          );
          message = `Buy ${coupon.buyQuantity} get ${coupon.getQuantity} free`;
        }
        break;
    }

    return {
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
      freeShipping,
      message,
    };
  }

  /**
   * Mark coupon as used
   */
  markCouponUsed(code: string, userId?: string): void {
    const coupon = this.getCoupon(code);
    if (coupon) {
      coupon.usageCount++;
      
      if (userId) {
        this.incrementUserUsage(userId, code);
      }
    }
  }

  /**
   * Get eligible items for coupon
   */
  private getEligibleItems(items: CartItem[], coupon: Coupon): CartItem[] {
    return items.filter(item => {
      // Check excluded categories
      if (coupon.excludedCategories?.includes(item.categoryId)) {
        return false;
      }
      
      // Check excluded products
      if (coupon.excludedProducts?.includes(item.productId)) {
        return false;
      }
      
      // Check applicable categories
      if (coupon.applicableCategories?.length && 
          !coupon.applicableCategories.includes(item.categoryId)) {
        return false;
      }
      
      // Check applicable products
      if (coupon.applicableProducts?.length && 
          !coupon.applicableProducts.includes(item.productId)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate Buy X Get Y discount
   */
  private calculateBuyXGetYDiscount(
    items: CartItem[],
    buyX: number,
    getY: number,
    applicableProductIds: string[]
  ): number {
    // Filter items that are applicable for the offer
    const applicableItems = items.filter(item => 
      applicableProductIds.includes(item.productId)
    );
    
    if (applicableItems.length === 0) return 0;
    
    // Calculate total quantity of applicable items
    const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate free items based on buy X get Y
    const freeItems = Math.floor(totalQuantity / (buyX + getY)) * getY;
    
    if (freeItems === 0) return 0;
    
    // Calculate discount based on cheapest applicable items
    const sortedItems = applicableItems.sort((a, b) => a.price - b.price);
    let discount = 0;
    let remainingFreeItems = freeItems;
    
    for (const item of sortedItems) {
      if (remainingFreeItems <= 0) break;
      
      const freeFromThisItem = Math.min(remainingFreeItems, item.quantity);
      discount += freeFromThisItem * item.price;
      remainingFreeItems -= freeFromThisItem;
    }
    
    return discount;
  }

  /**
   * Get user usage count for a coupon
   */
  private getUserUsage(userId: string, couponCode: string): number {
    const userCoupons = this.userUsage.get(userId);
    return userCoupons?.get(couponCode.toUpperCase()) || 0;
  }

  /**
   * Increment user usage for a coupon
   */
  private incrementUserUsage(userId: string, couponCode: string): void {
    if (!this.userUsage.has(userId)) {
      this.userUsage.set(userId, new Map());
    }
    
    const userCoupons = this.userUsage.get(userId)!;
    const currentUsage = userCoupons.get(couponCode.toUpperCase()) || 0;
    userCoupons.set(couponCode.toUpperCase(), currentUsage + 1);
  }

  /**
   * Get available coupons for user
   */
  getAvailableCoupons(userId?: string, isNewUser: boolean = false): Coupon[] {
    const now = new Date();
    
    return Array.from(this.coupons.values()).filter(coupon => {
      // Check basic validity
      if (coupon.status !== CouponStatus.ACTIVE) return false;
      if (now < coupon.validFrom || now > coupon.validUntil) return false;
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
      
      // Check user constraints
      if (coupon.newUsersOnly && !isNewUser) return false;
      if (userId && coupon.eligibleUsers && !coupon.eligibleUsers.includes(userId)) return false;
      if (userId && coupon.userUsageLimit) {
        const userUsage = this.getUserUsage(userId, coupon.code);
        if (userUsage >= coupon.userUsageLimit) return false;
      }
      
      return true;
    });
  }
}

/**
 * Predefined coupons for Indian market
 */
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME10',
    type: CouponType.PERCENTAGE,
    title: 'Welcome Discount',
    description: 'Get 10% off on your first order',
    status: CouponStatus.ACTIVE,
    discountValue: 10,
    maxDiscountAmount: 500,
    minOrderValue: 999,
    usageCount: 0,
    userUsageLimit: 1,
    newUsersOnly: true,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
  },
  {
    id: '2',
    code: 'FLAT200',
    type: CouponType.FLAT,
    title: 'Flat ₹200 Off',
    description: 'Get flat ₹200 off on orders above ₹1999',
    status: CouponStatus.ACTIVE,
    discountValue: 200,
    minOrderValue: 1999,
    usageCount: 0,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
  },
  {
    id: '3',
    code: 'FREESHIP',
    type: CouponType.FREE_SHIPPING,
    title: 'Free Shipping',
    description: 'Free shipping on all orders',
    status: CouponStatus.ACTIVE,
    discountValue: 0,
    minOrderValue: 500,
    usageCount: 0,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
  },
  {
    id: '4',
    code: 'FESTIVAL25',
    type: CouponType.PERCENTAGE,
    title: 'Festival Sale',
    description: 'Get 25% off during festival season',
    status: CouponStatus.ACTIVE,
    discountValue: 25,
    maxDiscountAmount: 1000,
    minOrderValue: 1499,
    usageLimit: 1000,
    usageCount: 0,
    validFrom: new Date('2024-10-01'),
    validUntil: new Date('2024-11-15'),
  },
];

/**
 * Create and initialize coupon service with default coupons
 */
export function createCouponService(): CouponService {
  const service = new CouponService();
  
  DEFAULT_COUPONS.forEach(coupon => {
    service.addCoupon(coupon);
  });
  
  return service;
}