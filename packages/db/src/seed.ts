/**
 * Radha G Sarees Database Seed Script
 * 
 * Seeds the database with:
 * - 10 beautiful saree products (each with 3 variants)
 * - Sample users and addresses
 * - Reviews and ratings
 * - Sample orders and payments
 * - Inventory data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample saree data with realistic descriptions and pricing
const sareeData = [
  {
    title: "Kanjivaram Silk Saree with Gold Zari",
    slug: "kanjivaram-silk-gold-zari",
    description: "Exquisite handwoven Kanjivaram silk saree featuring intricate gold zari work. Perfect for weddings and special occasions. Made with pure mulberry silk and genuine gold threads.",
    care: "Dry clean only. Store in cotton cloth. Avoid direct sunlight and moisture.",
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800"
    ],
    variants: [
      { color: "Royal Blue", mrp: 15000, price: 12000 },
      { color: "Deep Red", mrp: 15000, price: 12000 },
      { color: "Emerald Green", mrp: 15000, price: 12000 }
    ]
  },
  {
    title: "Banarasi Silk Saree with Silver Work",
    slug: "banarasi-silk-silver-work",
    description: "Traditional Banarasi silk saree with beautiful silver motifs. Handcrafted by skilled artisans from Varanasi. Features classic paisley patterns and floral designs.",
    care: "Dry clean recommended. Iron on reverse side with medium heat.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800"
    ],
    variants: [
      { color: "Magenta Pink", mrp: 18000, price: 14400 },
      { color: "Navy Blue", mrp: 18000, price: 14400 },
      { color: "Maroon", mrp: 18000, price: 14400 }
    ]
  },
  {
    title: "Cotton Handloom Saree with Block Print",
    slug: "cotton-handloom-block-print",
    description: "Comfortable pure cotton saree with traditional block print designs. Perfect for daily wear and office. Breathable fabric with natural dyes.",
    care: "Machine wash in cold water. Use mild detergent. Iron while damp.",
    images: [
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
    ],
    variants: [
      { color: "Sky Blue", mrp: 2500, price: 1800 },
      { color: "Mint Green", mrp: 2500, price: 1800 },
      { color: "Coral Pink", mrp: 2500, price: 1800 }
    ]
  },
  {
    title: "Georgette Saree with Sequin Work",
    slug: "georgette-sequin-work",
    description: "Elegant georgette saree adorned with sparkling sequins and beadwork. Lightweight and graceful drape. Ideal for evening parties and celebrations.",
    care: "Dry clean only. Handle gently to avoid sequin damage.",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800",
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800"
    ],
    variants: [
      { color: "Black", mrp: 8000, price: 6400 },
      { color: "Wine Red", mrp: 8000, price: 6400 },
      { color: "Golden", mrp: 8000, price: 6400 }
    ]
  },
  {
    title: "Chanderi Silk Cotton Saree",
    slug: "chanderi-silk-cotton",
    description: "Classic Chanderi saree made from silk-cotton blend. Features subtle gold borders and traditional motifs. Lightweight yet elegant for formal occasions.",
    care: "Gentle hand wash or dry clean. Iron on medium heat.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800"
    ],
    variants: [
      { color: "Cream", mrp: 6500, price: 5200 },
      { color: "Peach", mrp: 6500, price: 5200 },
      { color: "Lavender", mrp: 6500, price: 5200 }
    ]
  },
  {
    title: "Linen Saree with Temple Border",
    slug: "linen-temple-border",
    description: "Pure linen saree with traditional temple border design. Eco-friendly and comfortable for summer wear. Features authentic handloom weaving techniques.",
    care: "Machine wash in cold water. Air dry in shade. Iron while slightly damp.",
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
    ],
    variants: [
      { color: "Off White", mrp: 3500, price: 2800 },
      { color: "Mustard Yellow", mrp: 3500, price: 2800 },
      { color: "Rust Orange", mrp: 3500, price: 2800 }
    ]
  },
  {
    title: "Tussar Silk Saree with Tribal Print",
    slug: "tussar-silk-tribal-print",
    description: "Natural tussar silk saree featuring beautiful tribal art prints. Supports local artisan communities. Rich texture with earthy appeal.",
    care: "Dry clean recommended. Store with care to maintain texture.",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
    ],
    variants: [
      { color: "Beige", mrp: 7500, price: 6000 },
      { color: "Brown", mrp: 7500, price: 6000 },
      { color: "Olive Green", mrp: 7500, price: 6000 }
    ]
  },
  {
    title: "Chiffon Saree with Floral Embroidery",
    slug: "chiffon-floral-embroidery",
    description: "Delicate chiffon saree with intricate floral embroidery. Perfect for cocktail parties and evening events. Features French knot and thread work.",
    care: "Dry clean only. Handle with care due to delicate fabric.",
    images: [
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800"
    ],
    variants: [
      { color: "Powder Blue", mrp: 5500, price: 4400 },
      { color: "Rose Pink", mrp: 5500, price: 4400 },
      { color: "Lilac", mrp: 5500, price: 4400 }
    ]
  },
  {
    title: "Organza Saree with Crystal Work",
    slug: "organza-crystal-work",
    description: "Shimmering organza saree decorated with crystal and stone work. Modern designer piece perfect for contemporary functions. Stunning visual appeal.",
    care: "Professional dry clean only. Store flat to prevent wrinkles.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800"
    ],
    variants: [
      { color: "Silver", mrp: 12000, price: 9600 },
      { color: "Champagne", mrp: 12000, price: 9600 },
      { color: "Blush Pink", mrp: 12000, price: 9600 }
    ]
  },
  {
    title: "Khadi Cotton Saree with Hand Painted Design",
    slug: "khadi-cotton-hand-painted",
    description: "Authentic khadi cotton saree featuring hand-painted motifs by rural artists. Supports traditional crafts and sustainable fashion. Unique artistic piece.",
    care: "Gentle hand wash with natural detergent. Dry in shade.",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=800",
      "https://images.unsplash.com/photo-1583391733985-2b469f64c1c9?w=800",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800"
    ],
    variants: [
      { color: "White", mrp: 4000, price: 3200 },
      { color: "Natural Beige", mrp: 4000, price: 3200 },
      { color: "Earthy Brown", mrp: 4000, price: 3200 }
    ]
  }
];

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data (optional - remove in production)
    console.log('🧹 Cleaning existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();

    // 1. Create Categories
    console.log('📁 Creating categories...');
    const categories = [];
    
    const silkCategory = await prisma.category.create({
      data: {
        name: 'Silk Sarees',
        slug: 'silk-sarees',
        description: 'Premium silk sarees for special occasions and festivities',
        sortOrder: 1,
      },
    });
    categories.push(silkCategory);
    
    const cottonCategory = await prisma.category.create({
      data: {
        name: 'Cotton Sarees',
        slug: 'cotton-sarees', 
        description: 'Comfortable cotton sarees for daily wear and office',
        sortOrder: 2,
      },
    });
    categories.push(cottonCategory);
    
    const designerCategory = await prisma.category.create({
      data: {
        name: 'Designer Sarees',
        slug: 'designer-sarees',
        description: 'Contemporary designer sarees with modern appeal',
        sortOrder: 3,
      },
    });
    categories.push(designerCategory);

    // 2. Create Users
    console.log('👥 Creating users...');
    const priyaUser = await prisma.user.create({
      data: {
        email: 'priya.sharma@example.com',
        name: 'Priya Sharma',
        phone: '+91 9876543210',
        role: 'CUSTOMER',
        addresses: {
          create: {
            name: 'Home',
            street: '123 MG Road, Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            zipCode: '560034',
            isDefault: true,
          },
        },
      },
    });
    
    const anitaUser = await prisma.user.create({
      data: {
        email: 'anita.reddy@example.com',
        name: 'Anita Reddy',
        phone: '+91 9876543211',
        role: 'CUSTOMER',
        addresses: {
          create: {
            name: 'Office',
            street: '456 Brigade Road, Commercial Street',
            city: 'Bangalore',
            state: 'Karnataka',
            zipCode: '560001',
            isDefault: true,
          },
        },
      },
    });
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@radhagsarees.com',
        name: 'Admin User',
        phone: '+91 9876543212',
        role: 'ADMIN',
      },
    });
    
    const users = [priyaUser, anitaUser, adminUser];

    // 3. Create Products with Variants and Inventory
    console.log('🛍️ Creating products with variants...');
    const products: any[] = [];
    
    for (let i = 0; i < sareeData.length; i++) {
      const saree = sareeData[i];
      const categoryIndex = i < 4 ? 0 : i < 7 ? 1 : 2; // Distribute across categories
      
      const product = await prisma.product.create({
        data: {
          title: saree.title,
          slug: saree.slug,
          description: saree.description,
          images: saree.images,
          care: saree.care,
          categoryId: categories[categoryIndex].id,
          isActive: true,
          isNew: i < 3, // First 3 are new
          isFeatured: i % 3 === 0, // Every 3rd is featured
          variants: {
            create: saree.variants.map((variant, idx) => ({
              sku: `${saree.slug.toUpperCase().replace(/-/g, '')}-${variant.color.toUpperCase().replace(/ /g, '')}-${idx + 1}`,
              color: variant.color,
              size: 'Free Size',
              mrp: variant.mrp,
              price: variant.price,
              inventory: {
                create: {
                  qtyAvailable: Math.floor(Math.random() * 50) + 10, // 10-60 items
                  lowStockThreshold: 5,
                },
              },
            })),
          },
        },
        include: {
          variants: {
            include: {
              inventory: true,
            },
          },
        },
      });
      
      products.push(product);
    }

    // 4. Create Reviews
    console.log('⭐ Creating reviews...');
    const reviews = [];
    const reviewTitles = [
      'Beautiful saree!', 'Excellent quality', 'Love the fabric', 
      'Perfect for occasions', 'Highly recommended', 'Amazing work',
      'Great purchase', 'Wonderful design'
    ];
    
    const reviewBodies = [
      'The quality is excellent and the fabric feels premium. Highly recommended for special occasions.',
      'Beautiful design and comfortable to wear. The colors are vibrant and true to the photos.',
      'Amazing craftsmanship! The saree drapes beautifully and the material is top-notch.',
      'Perfect fit and the embroidery work is stunning. Will definitely order more.',
      'Great value for money. The saree exceeded my expectations in terms of quality.',
      'Lovely saree with beautiful detailing. The fabric is soft and comfortable to wear.'
    ];
    
    for (let i = 0; i < 15; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const user = users[Math.floor(Math.random() * 2)]; // Only customers
      
      try {
        const review = await prisma.review.create({
          data: {
            productId: product.id,
            userId: user.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
            title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
            comment: reviewBodies[Math.floor(Math.random() * reviewBodies.length)],
            imageUrls: Math.random() > 0.7 ? [
              'https://images.unsplash.com/photo-1594736797933-d0d50940077e?w=400',
              'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=400'
            ] : [],
            status: 'APPROVED',
            isVerified: Math.random() > 0.3,
          },
        });
        reviews.push(review);
      } catch (error) {
        // Skip if user already reviewed this product
        console.log(`Skipping duplicate review for user ${user.id} and product ${product.id}`);
      }
    }

    // 5. Update product ratings based on reviews
    console.log('📊 Updating product ratings...');
    for (const product of products) {
      const productReviews = await prisma.review.findMany({
        where: { productId: product.id },
      });
      
      if (productReviews.length > 0) {
        const avgRating = productReviews.reduce((sum: number, r) => sum + r.rating, 0) / productReviews.length;
        await prisma.product.update({
          where: { id: product.id },
          data: {
            ratingAvg: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            ratingCount: productReviews.length,
          },
        });
      }
    }

    // 6. Create Sample Orders
    console.log('🛒 Creating sample orders...');
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
    const paymentMethods = ['card', 'upi', 'netbanking'];
    
    for (let i = 0; i < 5; i++) {
      const user = users[Math.floor(Math.random() * 2)]; // Only customers
      const orderItems = [];
      const numberOfItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      
      let orderTotal = 0;
      
      for (let j = 0; j < numberOfItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        const itemTotal = parseFloat(variant.price.toString()) * quantity;
        
        orderItems.push({
          variantId: variant.id,
          qty: quantity,
          price: parseFloat(variant.price.toString()),
        });
        
        orderTotal += itemTotal;
      }

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          orderNumber: `RGS${Date.now()}${i}`,
          items: orderItems,
          amount: orderTotal,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          paymentRef: `PAY_${Date.now()}${i}`,
          shippingAddressId: null, // Will be set if addresses exist
          orderItems: {
            create: orderItems.map((item) => {
              // Find the product for this variant
              let productForVariant = null;
              for (const p of products) {
                for (const v of p.variants) {
                  if (v.id === item.variantId) {
                    productForVariant = p;
                    break;
                  }
                }
                if (productForVariant) break;
              }
              
              return {
                variantId: item.variantId,
                productId: productForVariant ? productForVariant.id : products[0].id,
                quantity: item.qty,
                price: item.price,
                total: item.price * item.qty,
              };
            }),
          },
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: orderTotal,
          status: 'COMPLETED',
          method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          gatewayId: `gw_${Date.now()}${i}`,
        },
      });
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${products.reduce((sum, p) => sum + p.variants.length, 0)} variants`);
    console.log(`   - ${reviews.length} reviews`);
    console.log(`   - 5 sample orders`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    // Use process.exit if available (Node.js environment)
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });