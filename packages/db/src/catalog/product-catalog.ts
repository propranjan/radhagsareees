/**
 * Radha G Sarees - Complete Product Catalog
 * 
 * 10 Categories × 3-5 Products × 3 Variants = ~50-80 products with variants
 * 
 * Categories:
 * 1. Banarasi
 * 2. Organza
 * 3. Georgette
 * 4. Satin
 * 5. Tussar
 * 6. Linen
 * 7. Chiffon
 * 8. Bandhani
 * 9. Kanjivaram
 * 10. Ikkat
 */

import type { CategoryData, CatalogData } from './types';
import { 
  getVariantImageUrls, 
  getVariantOverlayUrl, 
  getCategoryImageUrl,
  generateProductSku,
  generateVariantSku 
} from './cloudinary';

// Color palettes with hex codes for each category
const colorPalettes = {
  traditional: [
    { name: 'Royal Red', code: 'RED', hex: '#8B0000' },
    { name: 'Deep Blue', code: 'BLU', hex: '#1B365D' },
    { name: 'Emerald Green', code: 'GRN', hex: '#046307' },
  ],
  festive: [
    { name: 'Golden Yellow', code: 'GLD', hex: '#D4AF37' },
    { name: 'Magenta Pink', code: 'MGT', hex: '#8B008B' },
    { name: 'Peacock Blue', code: 'PCK', hex: '#005F6B' },
  ],
  pastel: [
    { name: 'Blush Pink', code: 'BLP', hex: '#FFB6C1' },
    { name: 'Powder Blue', code: 'PWB', hex: '#B0E0E6' },
    { name: 'Mint Green', code: 'MNT', hex: '#98FF98' },
  ],
  earthy: [
    { name: 'Rust Orange', code: 'RST', hex: '#B7410E' },
    { name: 'Olive Green', code: 'OLV', hex: '#556B2F' },
    { name: 'Earthy Brown', code: 'BRN', hex: '#8B4513' },
  ],
  vibrant: [
    { name: 'Orange Red', code: 'ORG', hex: '#FF4500' },
    { name: 'Hot Pink', code: 'HPK', hex: '#FF1493' },
    { name: 'Teal', code: 'TEL', hex: '#008080' },
  ],
  elegant: [
    { name: 'Wine Red', code: 'WIN', hex: '#722F37' },
    { name: 'Navy Blue', code: 'NVY', hex: '#000080' },
    { name: 'Forest Green', code: 'FRT', hex: '#228B22' },
  ],
  regal: [
    { name: 'Purple', code: 'PRP', hex: '#800080' },
    { name: 'Maroon', code: 'MRN', hex: '#800000' },
    { name: 'Copper', code: 'CPR', hex: '#B87333' },
  ],
  soft: [
    { name: 'Cream', code: 'CRM', hex: '#FFFDD0' },
    { name: 'Peach', code: 'PCH', hex: '#FFDAB9' },
    { name: 'Lavender', code: 'LVN', hex: '#E6E6FA' },
  ],
  classic: [
    { name: 'Black', code: 'BLK', hex: '#000000' },
    { name: 'Off White', code: 'OFW', hex: '#FAF9F6' },
    { name: 'Grey', code: 'GRY', hex: '#808080' },
  ],
  bright: [
    { name: 'Coral', code: 'CRL', hex: '#FF7F50' },
    { name: 'Turquoise', code: 'TRQ', hex: '#40E0D0' },
    { name: 'Lime Green', code: 'LME', hex: '#32CD32' },
  ],
};

// Helper to create variants for a product
function createVariants(
  categorySlug: string,
  productSku: string,
  colors: typeof colorPalettes.traditional,
  basePrice: number,
  baseMrp: number,
  stockRange: [number, number]
) {
  return colors.map((color) => {
    const variantSku = generateVariantSku(productSku, color.code);
    const stock = Math.floor(Math.random() * (stockRange[1] - stockRange[0] + 1)) + stockRange[0];
    
    return {
      sku: variantSku,
      color: color.name,
      colorHex: color.hex,
      mrp: baseMrp,
      price: basePrice,
      stock,
      images: getVariantImageUrls(categorySlug, productSku, variantSku),
      overlayPng: getVariantOverlayUrl(categorySlug, productSku, variantSku),
    };
  });
}

// ============================================================================
// CATEGORY 1: BANARASI SAREES
// ============================================================================
const banarasi: CategoryData = {
  name: 'Banarasi',
  slug: 'banarasi',
  description: 'Exquisite handwoven Banarasi sarees from Varanasi, featuring intricate gold and silver zari work, perfect for weddings and grand celebrations.',
  image: getCategoryImageUrl('banarasi'),
  sortOrder: 1,
  products: [
    {
      sku: 'BAN-001',
      title: 'Pure Katan Silk Banarasi with Gold Zari',
      slug: 'pure-katan-silk-banarasi-gold-zari',
      description: 'A masterpiece of Banarasi craftsmanship, this pure Katan silk saree features elaborate gold zari work with traditional mogra and kalga motifs. The rich pallu showcases intricate floral patterns passed down through generations of master weavers.',
      care: 'Dry clean only. Store in muslin cloth away from direct sunlight. Steam iron on reverse side.',
      fabric: 'Pure Katan Silk',
      occasion: ['Wedding', 'Reception', 'Festive'],
      features: ['Handwoven', 'Pure Gold Zari', 'Traditional Motifs', 'Heavy Pallu'],
      isNew: true,
      isFeatured: true,
      variants: createVariants('banarasi', 'BAN-001', colorPalettes.traditional, 45000, 55000, [5, 15]),
    },
    {
      sku: 'BAN-002',
      title: 'Banarasi Organza with Meenakari Work',
      slug: 'banarasi-organza-meenakari-work',
      description: 'Lightweight Banarasi organza saree with stunning meenakari work in vibrant colors. The delicate fabric is enhanced with traditional Banarasi patterns creating a perfect blend of elegance and comfort.',
      care: 'Dry clean recommended. Handle with care. Store flat in a cool, dry place.',
      fabric: 'Banarasi Organza',
      occasion: ['Party', 'Reception', 'Engagement'],
      features: ['Meenakari Work', 'Lightweight', 'Colorful Borders', 'Designer Pallu'],
      isFeatured: true,
      variants: createVariants('banarasi', 'BAN-002', colorPalettes.festive, 28000, 35000, [8, 20]),
    },
    {
      sku: 'BAN-003',
      title: 'Tissue Banarasi with Silver Zari',
      slug: 'tissue-banarasi-silver-zari',
      description: 'Shimmering tissue Banarasi saree with beautiful silver zari weaving. The tissue fabric creates a gorgeous golden sheen while the silver zari adds contemporary elegance to traditional design.',
      care: 'Dry clean only. Avoid folding for long periods. Iron on low heat.',
      fabric: 'Tissue Silk',
      occasion: ['Wedding', 'Sangeet', 'Anniversary'],
      features: ['Silver Zari', 'Tissue Fabric', 'Shimmer Effect', 'Bridal Collection'],
      variants: createVariants('banarasi', 'BAN-003', colorPalettes.regal, 38000, 48000, [3, 10]),
    },
    {
      sku: 'BAN-004',
      title: 'Classic Banarasi Silk with Jaal Work',
      slug: 'classic-banarasi-silk-jaal-work',
      description: 'Timeless Banarasi silk featuring the iconic jaal (net) pattern that covers the entire saree. Each thread is meticulously woven to create this architectural masterpiece of textile art.',
      care: 'Professional dry clean. Store wrapped in butter paper. Avoid perfumes and deodorants directly.',
      fabric: 'Pure Banarasi Silk',
      occasion: ['Wedding', 'Pooja', 'Traditional Functions'],
      features: ['All-over Jaal', 'Heavy Work', 'Contrast Pallu', 'Heritage Design'],
      isNew: true,
      variants: createVariants('banarasi', 'BAN-004', colorPalettes.elegant, 52000, 65000, [2, 8]),
    },
  ],
};

// ============================================================================
// CATEGORY 2: ORGANZA SAREES
// ============================================================================
const organza: CategoryData = {
  name: 'Organza',
  slug: 'organza',
  description: 'Ethereal organza sarees with delicate embroidery and modern designs, perfect for contemporary occasions and evening events.',
  image: getCategoryImageUrl('organza'),
  sortOrder: 2,
  products: [
    {
      sku: 'ORG-001',
      title: 'Silk Organza with Crystal Embellishments',
      slug: 'silk-organza-crystal-embellishments',
      description: 'Luxurious silk organza saree adorned with sparkling Swarovski-inspired crystals and delicate beadwork. The sheer fabric creates a dreamy silhouette perfect for evening celebrations.',
      care: 'Dry clean only. Handle crystals with care. Store flat to prevent crushing.',
      fabric: 'Pure Silk Organza',
      occasion: ['Cocktail Party', 'Reception', 'Evening Event'],
      features: ['Crystal Work', 'Beaded Border', 'Sheer Fabric', 'Designer Blouse'],
      isFeatured: true,
      isNew: true,
      variants: createVariants('organza', 'ORG-001', colorPalettes.pastel, 18000, 22000, [10, 25]),
    },
    {
      sku: 'ORG-002',
      title: 'Organza Saree with French Knot Embroidery',
      slug: 'organza-french-knot-embroidery',
      description: 'Delicate organza saree featuring intricate French knot embroidery scattered across the drape like stars. The subtle texture adds depth while maintaining the fabric ethereal quality.',
      care: 'Gentle dry clean. Iron on lowest setting with cloth barrier.',
      fabric: 'Organza',
      occasion: ['Engagement', 'Bridal Shower', 'Garden Party'],
      features: ['French Knot Work', 'Scattered Embroidery', 'Scalloped Border', 'Matching Blouse'],
      variants: createVariants('organza', 'ORG-002', colorPalettes.soft, 15000, 18500, [12, 30]),
    },
    {
      sku: 'ORG-003',
      title: 'Printed Organza with Floral Motifs',
      slug: 'printed-organza-floral-motifs',
      description: 'Contemporary organza saree with digital floral prints in vibrant colors. The lightweight fabric drapes beautifully making it comfortable for all-day wear at summer occasions.',
      care: 'Dry clean recommended. Do not wring. Air dry in shade.',
      fabric: 'Digital Print Organza',
      occasion: ['Day Wedding', 'Mehendi', 'Birthday Party'],
      features: ['Digital Print', 'Floral Design', 'Easy Drape', 'Pre-stitched Option'],
      variants: createVariants('organza', 'ORG-003', colorPalettes.bright, 8500, 10500, [15, 35]),
    },
    {
      sku: 'ORG-004',
      title: 'Organza Tissue with Gota Patti',
      slug: 'organza-tissue-gota-patti',
      description: 'Rajasthani-inspired organza tissue saree with traditional gota patti work. The golden appliqué creates stunning geometric patterns against the sheer fabric.',
      care: 'Dry clean only. Store carefully to protect gota work.',
      fabric: 'Organza Tissue',
      occasion: ['Festive', 'Traditional Events', 'Pooja'],
      features: ['Gota Patti', 'Rajasthani Style', 'Golden Appliqué', 'Rich Pallu'],
      isNew: true,
      variants: createVariants('organza', 'ORG-004', colorPalettes.festive, 14000, 17500, [8, 20]),
    },
    {
      sku: 'ORG-005',
      title: 'Mirror Work Organza Saree',
      slug: 'mirror-work-organza-saree',
      description: 'Eye-catching organza saree embellished with traditional mirror work. Small mirrors are carefully stitched creating a mesmerizing play of light with every movement.',
      care: 'Professional dry clean. Handle mirrors gently. Store flat.',
      fabric: 'Organza',
      occasion: ['Navratri', 'Garba', 'Festive'],
      features: ['Mirror Work', 'Traditional Craft', 'Lightweight', 'Vibrant Colors'],
      variants: createVariants('organza', 'ORG-005', colorPalettes.vibrant, 12000, 15000, [10, 25]),
    },
  ],
};

// ============================================================================
// CATEGORY 3: GEORGETTE SAREES
// ============================================================================
const georgette: CategoryData = {
  name: 'Georgette',
  slug: 'georgette',
  description: 'Flowing georgette sarees with elegant drape and versatile styling options, ideal for both casual and formal occasions.',
  image: getCategoryImageUrl('georgette'),
  sortOrder: 3,
  products: [
    {
      sku: 'GEO-001',
      title: 'Heavy Georgette with Sequin Work',
      slug: 'heavy-georgette-sequin-work',
      description: 'Stunning heavy georgette saree covered in shimmering sequins and beads. The fabric has excellent fall and the all-over sparkle makes it perfect for night events and parties.',
      care: 'Dry clean only. Avoid snagging sequins. Store in garment bag.',
      fabric: 'Heavy Georgette',
      occasion: ['Party', 'New Year', 'Cocktail'],
      features: ['All-over Sequins', 'Heavy Embellishment', 'Party Wear', 'Ready Pleats Available'],
      isFeatured: true,
      variants: createVariants('georgette', 'GEO-001', colorPalettes.classic, 16000, 20000, [8, 18]),
    },
    {
      sku: 'GEO-002',
      title: 'Chikankari Georgette Saree',
      slug: 'chikankari-georgette-saree',
      description: 'Lucknowi chikankari embroidery on soft georgette fabric. The delicate white threadwork creates intricate patterns including murri, phanda, and jaali stitches.',
      care: 'Gentle dry clean. Iron on reverse side. Keep away from sharp objects.',
      fabric: 'Pure Georgette',
      occasion: ['Office', 'Casual', 'Day Events'],
      features: ['Lucknowi Chikankari', 'Hand Embroidered', 'Breathable', 'Elegant'],
      isNew: true,
      variants: createVariants('georgette', 'GEO-002', colorPalettes.soft, 9500, 12000, [12, 28]),
    },
    {
      sku: 'GEO-003',
      title: 'Georgette with Thread Embroidery',
      slug: 'georgette-thread-embroidery',
      description: 'Classic georgette saree featuring beautiful thread embroidery along borders and pallu. The resham work in contrasting colors adds a touch of tradition to modern fabric.',
      care: 'Dry clean recommended. Steam iron carefully.',
      fabric: 'Georgette',
      occasion: ['Family Functions', 'Poojas', 'Casual Gatherings'],
      features: ['Resham Work', 'Contrast Border', 'Medium Weight', 'Versatile'],
      variants: createVariants('georgette', 'GEO-003', colorPalettes.traditional, 7500, 9500, [15, 35]),
    },
    {
      sku: 'GEO-004',
      title: 'Ruffle Georgette Designer Saree',
      slug: 'ruffle-georgette-designer-saree',
      description: 'Contemporary designer georgette saree with trendy ruffle borders. The modern silhouette is perfect for fashion-forward women who want to make a statement.',
      care: 'Dry clean only. Do not iron ruffles directly.',
      fabric: 'Designer Georgette',
      occasion: ['Fashion Events', 'Parties', 'Photo Shoots'],
      features: ['Ruffle Border', 'Contemporary Design', 'Pre-stitched', 'Instagram Ready'],
      isNew: true,
      isFeatured: true,
      variants: createVariants('georgette', 'GEO-004', colorPalettes.vibrant, 11000, 14000, [10, 22]),
    },
  ],
};

// ============================================================================
// CATEGORY 4: SATIN SAREES
// ============================================================================
const satin: CategoryData = {
  name: 'Satin',
  slug: 'satin',
  description: 'Luxurious satin sarees with a beautiful sheen and smooth drape, perfect for formal events and glamorous occasions.',
  image: getCategoryImageUrl('satin'),
  sortOrder: 4,
  products: [
    {
      sku: 'SAT-001',
      title: 'Satin Silk with Designer Border',
      slug: 'satin-silk-designer-border',
      description: 'Premium satin silk saree with an exquisite designer border featuring stone and zardozi work. The lustrous fabric catches light beautifully for a glamorous look.',
      care: 'Dry clean only. Iron on low heat with press cloth. Store on padded hangers.',
      fabric: 'Pure Satin Silk',
      occasion: ['Award Ceremonies', 'Gala Dinners', 'Receptions'],
      features: ['Zardozi Border', 'Stone Work', 'High Sheen', 'Premium Quality'],
      isFeatured: true,
      variants: createVariants('satin', 'SAT-001', colorPalettes.elegant, 22000, 28000, [5, 12]),
    },
    {
      sku: 'SAT-002',
      title: 'Crepe Satin Solid Saree',
      slug: 'crepe-satin-solid-saree',
      description: 'Elegant solid color crepe satin saree with minimal embellishment. The understated luxury of the fabric speaks for itself, ideal for sophisticated styling.',
      care: 'Dry clean or gentle hand wash. Iron while slightly damp.',
      fabric: 'Crepe Satin',
      occasion: ['Office Party', 'Formal Events', 'Business Dinners'],
      features: ['Solid Color', 'Minimal Design', 'Professional Look', 'Easy Drape'],
      variants: createVariants('satin', 'SAT-002', colorPalettes.classic, 6500, 8000, [20, 40]),
    },
    {
      sku: 'SAT-003',
      title: 'Printed Satin with Floral Design',
      slug: 'printed-satin-floral-design',
      description: 'Vibrant printed satin saree featuring beautiful floral patterns. The smooth fabric with colorful prints creates a fresh and youthful look for casual occasions.',
      care: 'Gentle dry clean. Avoid bleach. Iron on reverse side.',
      fabric: 'Printed Satin',
      occasion: ['Brunch', 'Day Events', 'Casual Parties'],
      features: ['Floral Print', 'Colorful', 'Lightweight', 'Young & Trendy'],
      isNew: true,
      variants: createVariants('satin', 'SAT-003', colorPalettes.bright, 5500, 7000, [15, 30]),
    },
    {
      sku: 'SAT-004',
      title: 'Satin Belted Concept Saree',
      slug: 'satin-belted-concept-saree',
      description: 'Modern fusion satin saree that comes with a matching belt for a contemporary Indo-Western look. Perfect for fashion enthusiasts who love experimental styling.',
      care: 'Dry clean recommended. Store belt separately.',
      fabric: 'Satin',
      occasion: ['Fashion Shows', 'Theme Parties', 'Corporate Events'],
      features: ['Belt Included', 'Fusion Style', 'Modern Drape', 'Statement Piece'],
      isFeatured: true,
      variants: createVariants('satin', 'SAT-004', colorPalettes.vibrant, 9000, 11500, [8, 18]),
    },
    {
      sku: 'SAT-005',
      title: 'Satin with Lace Border',
      slug: 'satin-lace-border',
      description: 'Romantic satin saree with delicate lace border adding a touch of vintage charm. The combination of smooth satin and intricate lace creates a unique aesthetic.',
      care: 'Dry clean only. Handle lace gently. Store carefully.',
      fabric: 'Satin with French Lace',
      occasion: ['Engagement', 'Anniversary', 'Romantic Dinners'],
      features: ['French Lace', 'Romantic Style', 'Vintage Charm', 'Elegant'],
      variants: createVariants('satin', 'SAT-005', colorPalettes.pastel, 12500, 15500, [10, 22]),
    },
  ],
};

// ============================================================================
// CATEGORY 5: TUSSAR SAREES
// ============================================================================
const tussar: CategoryData = {
  name: 'Tussar',
  slug: 'tussar',
  description: 'Authentic Tussar silk sarees with natural texture and earthy appeal, handcrafted by tribal artisans supporting sustainable fashion.',
  image: getCategoryImageUrl('tussar'),
  sortOrder: 5,
  products: [
    {
      sku: 'TUS-001',
      title: 'Tussar Silk with Madhubani Painting',
      slug: 'tussar-silk-madhubani-painting',
      description: 'Authentic Tussar silk canvas featuring hand-painted Madhubani art. Each saree is a unique piece of wearable art created by skilled artists from Bihar depicting nature and mythology.',
      care: 'Dry clean only. Do not soak. Store in cotton wrap.',
      fabric: 'Pure Tussar Silk',
      occasion: ['Art Exhibitions', 'Cultural Events', 'Festive'],
      features: ['Hand Painted', 'Madhubani Art', 'Unique Piece', 'Artisan Made'],
      isFeatured: true,
      isNew: true,
      variants: createVariants('tussar', 'TUS-001', colorPalettes.earthy, 15000, 18500, [3, 8]),
    },
    {
      sku: 'TUS-002',
      title: 'Kantha Stitch Tussar Saree',
      slug: 'kantha-stitch-tussar-saree',
      description: 'Beautiful Tussar silk with traditional Bengali Kantha embroidery. Running stitches create mesmerizing patterns telling stories through thread and fabric.',
      care: 'Professional dry clean. Handle embroidery carefully.',
      fabric: 'Tussar Silk',
      occasion: ['Traditional Functions', 'Durga Puja', 'Bengali Occasions'],
      features: ['Kantha Work', 'Bengali Craft', 'Hand Stitched', 'Traditional'],
      variants: createVariants('tussar', 'TUS-002', colorPalettes.traditional, 12000, 15000, [6, 15]),
    },
    {
      sku: 'TUS-003',
      title: 'Natural Tussar with Zari Border',
      slug: 'natural-tussar-zari-border',
      description: 'Pure natural Tussar silk in its organic golden hue with elegant zari borders. The unbleached fabric showcases the true beauty of wild silk with added festive touch.',
      care: 'Dry clean recommended. Natural fabric may have slight variations.',
      fabric: 'Natural Tussar Silk',
      occasion: ['Poojas', 'Temple Visits', 'Family Gatherings'],
      features: ['Natural Color', 'Zari Border', 'Eco-Friendly', 'Authentic Silk'],
      variants: createVariants('tussar', 'TUS-003', colorPalettes.soft, 8500, 10500, [10, 25]),
    },
    {
      sku: 'TUS-004',
      title: 'Block Printed Tussar Saree',
      slug: 'block-printed-tussar-saree',
      description: 'Tussar silk saree with hand block printed patterns using natural dyes. Each print is stamped by hand creating slight variations that add to its artisanal charm.',
      care: 'Dry clean only. Natural dyes may fade slightly with washing.',
      fabric: 'Tussar Silk',
      occasion: ['Casual', 'Office', 'Day Events'],
      features: ['Hand Block Print', 'Natural Dyes', 'Artisanal', 'Sustainable'],
      isNew: true,
      variants: createVariants('tussar', 'TUS-004', colorPalettes.earthy, 7500, 9500, [12, 28]),
    },
  ],
};

// ============================================================================
// CATEGORY 6: LINEN SAREES
// ============================================================================
const linen: CategoryData = {
  name: 'Linen',
  slug: 'linen',
  description: 'Breathable pure linen sarees, perfect for summer and daily wear with elegant simplicity and comfort.',
  image: getCategoryImageUrl('linen'),
  sortOrder: 6,
  products: [
    {
      sku: 'LIN-001',
      title: 'Pure Linen with Temple Border',
      slug: 'pure-linen-temple-border',
      description: 'Authentic pure linen saree featuring traditional temple border design. The breathable fabric is perfect for Indian summers while the temple motifs add spiritual elegance.',
      care: 'Machine wash cold. Iron while damp. Air dry in shade.',
      fabric: 'Pure Linen',
      occasion: ['Daily Wear', 'Temple', 'Office'],
      features: ['Temple Border', 'Pure Linen', 'Breathable', 'Easy Care'],
      isFeatured: true,
      variants: createVariants('linen', 'LIN-001', colorPalettes.soft, 4500, 5500, [20, 45]),
    },
    {
      sku: 'LIN-002',
      title: 'Handloom Linen with Jamdani Work',
      slug: 'handloom-linen-jamdani-work',
      description: 'Exquisite handloom linen saree with Bengali Jamdani weaving. The supplementary weft technique creates beautiful floating motifs on the linen base.',
      care: 'Gentle hand wash or dry clean. Iron with steam.',
      fabric: 'Handloom Linen',
      occasion: ['Special Occasions', 'Cultural Events', 'Conferences'],
      features: ['Jamdani Weave', 'Handloom', 'Artistic', 'Premium Quality'],
      isNew: true,
      variants: createVariants('linen', 'LIN-002', colorPalettes.elegant, 8500, 10500, [8, 18]),
    },
    {
      sku: 'LIN-003',
      title: 'Solid Linen Saree with Tassels',
      slug: 'solid-linen-saree-tassels',
      description: 'Minimalist solid color linen saree with decorative tassels on pallu. The simple design lets the natural texture of linen shine through for understated elegance.',
      care: 'Machine washable. Tumble dry low. Easy care.',
      fabric: 'Pure Linen',
      occasion: ['Everyday', 'Work', 'Casual Outings'],
      features: ['Solid Color', 'Tassel Pallu', 'Minimalist', 'Low Maintenance'],
      variants: createVariants('linen', 'LIN-003', colorPalettes.classic, 3800, 4800, [25, 50]),
    },
    {
      sku: 'LIN-004',
      title: 'Linen Cotton Blend with Checks',
      slug: 'linen-cotton-blend-checks',
      description: 'Comfortable linen-cotton blend saree with classic checkered pattern. The mixed fabric combines the best of both - linen breathability and cotton softness.',
      care: 'Machine wash. Iron on medium heat. Very easy care.',
      fabric: 'Linen-Cotton Blend',
      occasion: ['Daily Wear', 'Office', 'Casual'],
      features: ['Checkered Pattern', 'Blend Fabric', 'Comfortable', 'Budget Friendly'],
      variants: createVariants('linen', 'LIN-004', colorPalettes.earthy, 2800, 3500, [30, 60]),
    },
    {
      sku: 'LIN-005',
      title: 'Designer Linen with Embroidery',
      slug: 'designer-linen-embroidery',
      description: 'Elevated linen saree with designer embroidery featuring contemporary motifs. The marriage of casual linen with decorative work creates versatile occasion wear.',
      care: 'Dry clean recommended for embroidery. Regular areas can be hand washed.',
      fabric: 'Premium Linen',
      occasion: ['Brunches', 'Day Weddings', 'Garden Parties'],
      features: ['Designer Embroidery', 'Contemporary', 'Elevated Casual', 'Versatile'],
      isFeatured: true,
      variants: createVariants('linen', 'LIN-005', colorPalettes.pastel, 6500, 8000, [12, 25]),
    },
  ],
};

// ============================================================================
// CATEGORY 7: CHIFFON SAREES
// ============================================================================
const chiffon: CategoryData = {
  name: 'Chiffon',
  slug: 'chiffon',
  description: 'Lightweight and graceful chiffon sarees with beautiful drape, ideal for evening parties and romantic occasions.',
  image: getCategoryImageUrl('chiffon'),
  sortOrder: 7,
  products: [
    {
      sku: 'CHF-001',
      title: 'Pure Chiffon with Kashmiri Aari Work',
      slug: 'pure-chiffon-kashmiri-aari-work',
      description: 'Luxurious pure chiffon saree embellished with authentic Kashmiri Aari embroidery. The intricate needlework creates stunning paisley and floral patterns.',
      care: 'Dry clean only. Store flat. Handle delicately.',
      fabric: 'Pure Chiffon',
      occasion: ['Wedding Reception', 'Engagement', 'Anniversary'],
      features: ['Kashmiri Aari', 'Hand Embroidered', 'Delicate', 'Bridal Collection'],
      isFeatured: true,
      variants: createVariants('chiffon', 'CHF-001', colorPalettes.regal, 18000, 22500, [5, 12]),
    },
    {
      sku: 'CHF-002',
      title: 'Printed Chiffon with Satin Border',
      slug: 'printed-chiffon-satin-border',
      description: 'Flowy chiffon saree with digital prints and luxurious satin border. The contrast of matte chiffon and shiny satin creates visual interest.',
      care: 'Dry clean or gentle hand wash. Do not wring.',
      fabric: 'Chiffon with Satin',
      occasion: ['Parties', 'Date Night', 'Social Events'],
      features: ['Digital Print', 'Satin Border', 'Contrast Effect', 'Trendy'],
      variants: createVariants('chiffon', 'CHF-002', colorPalettes.bright, 5500, 7000, [18, 35]),
    },
    {
      sku: 'CHF-003',
      title: 'Chiffon Saree with Pearl Work',
      slug: 'chiffon-saree-pearl-work',
      description: 'Elegant chiffon saree decorated with delicate pearl embellishments. The scattered pearls add a touch of sophistication perfect for evening events.',
      care: 'Professional dry clean. Do not soak. Handle pearls carefully.',
      fabric: 'Pure Chiffon',
      occasion: ['Evening Parties', 'Receptions', 'Formal Dinners'],
      features: ['Pearl Work', 'Elegant', 'Sophisticated', 'Evening Wear'],
      isNew: true,
      variants: createVariants('chiffon', 'CHF-003', colorPalettes.pastel, 9500, 12000, [10, 22]),
    },
    {
      sku: 'CHF-004',
      title: 'Ombre Chiffon Saree',
      slug: 'ombre-chiffon-saree',
      description: 'Trendy ombre effect chiffon saree with gradient color transitions. The seamless color flow creates a modern artistic look that is Instagram worthy.',
      care: 'Dry clean recommended. Store away from sunlight.',
      fabric: 'Chiffon',
      occasion: ['Photo Shoots', 'Parties', 'Casual Events'],
      features: ['Ombre Effect', 'Gradient Color', 'Modern', 'Social Media Ready'],
      isNew: true,
      isFeatured: true,
      variants: createVariants('chiffon', 'CHF-004', colorPalettes.vibrant, 7000, 8500, [15, 30]),
    },
  ],
};

// ============================================================================
// CATEGORY 8: BANDHANI SAREES
// ============================================================================
const bandhani: CategoryData = {
  name: 'Bandhani',
  slug: 'bandhani',
  description: 'Traditional tie-dye Bandhani sarees from Gujarat and Rajasthan, featuring vibrant patterns created through ancient dyeing techniques.',
  image: getCategoryImageUrl('bandhani'),
  sortOrder: 8,
  products: [
    {
      sku: 'BND-001',
      title: 'Pure Silk Bandhani with Gaji',
      slug: 'pure-silk-bandhani-gaji',
      description: 'Authentic Kutchi Bandhani on pure silk with traditional Gaji (diagonal) pattern. Each knot is tied by hand creating thousands of tiny dots in mesmerizing designs.',
      care: 'Dry clean only. First wash may have slight color release. Store in muslin.',
      fabric: 'Pure Gaji Silk',
      occasion: ['Navratri', 'Weddings', 'Festive'],
      features: ['Hand Tied', 'Kutchi Craft', 'Traditional Pattern', 'Vibrant Colors'],
      isFeatured: true,
      isNew: true,
      variants: createVariants('bandhani', 'BND-001', colorPalettes.traditional, 14000, 17500, [6, 15]),
    },
    {
      sku: 'BND-002',
      title: 'Georgette Bandhani Saree',
      slug: 'georgette-bandhani-saree',
      description: 'Lightweight georgette saree with beautiful Bandhani work. The flowing fabric enhanced with tie-dye patterns is perfect for comfortable festive wear.',
      care: 'Dry clean recommended. Cold water wash possible.',
      fabric: 'Georgette',
      occasion: ['Garba', 'Festive', 'Casual Celebrations'],
      features: ['Lightweight', 'Festive', 'Easy Drape', 'Comfortable'],
      variants: createVariants('bandhani', 'BND-002', colorPalettes.festive, 6500, 8000, [15, 35]),
    },
    {
      sku: 'BND-003',
      title: 'Cotton Bandhani with Zari Border',
      slug: 'cotton-bandhani-zari-border',
      description: 'Comfortable cotton Bandhani saree with festive zari border. The traditional craft meets everyday comfort making it perfect for daily festive wear.',
      care: 'Machine wash cold separately. Iron on medium heat.',
      fabric: 'Pure Cotton',
      occasion: ['Daily Wear', 'Poojas', 'Casual'],
      features: ['Cotton Comfort', 'Zari Border', 'Daily Festive', 'Affordable'],
      variants: createVariants('bandhani', 'BND-003', colorPalettes.vibrant, 3500, 4500, [25, 50]),
    },
    {
      sku: 'BND-004',
      title: 'Chanderi Bandhani Saree',
      slug: 'chanderi-bandhani-saree',
      description: 'Unique fusion of Chanderi weave with Bandhani printing. The sheer Chanderi fabric with tie-dye effect creates an ethereal look for special occasions.',
      care: 'Dry clean only. Handle delicately.',
      fabric: 'Chanderi Silk',
      occasion: ['Receptions', 'Engagements', 'Day Weddings'],
      features: ['Fusion Craft', 'Chanderi Base', 'Unique', 'Elegant'],
      variants: createVariants('bandhani', 'BND-004', colorPalettes.soft, 9500, 12000, [8, 18]),
    },
    {
      sku: 'BND-005',
      title: 'Leheriya Bandhani Combination',
      slug: 'leheriya-bandhani-combination',
      description: 'Stunning combination of Leheriya waves and Bandhani dots creating a visual symphony. This Rajasthani masterpiece features both tie-dye techniques in one saree.',
      care: 'Dry clean only. Specialty craft requires careful handling.',
      fabric: 'Silk Blend',
      occasion: ['Rajasthani Functions', 'Festive', 'Special Occasions'],
      features: ['Leheriya + Bandhani', 'Double Craft', 'Rare Design', 'Collector Piece'],
      isNew: true,
      variants: createVariants('bandhani', 'BND-005', colorPalettes.regal, 16000, 20000, [4, 10]),
    },
  ],
};

// ============================================================================
// CATEGORY 9: KANJIVARAM SAREES
// ============================================================================
const kanjivaram: CategoryData = {
  name: 'Kanjivaram',
  slug: 'kanjivaram',
  description: 'Legendary Kanjivaram silk sarees from Tamil Nadu, renowned for their rich silk, pure gold zari, and temple-inspired designs.',
  image: getCategoryImageUrl('kanjivaram'),
  sortOrder: 9,
  products: [
    {
      sku: 'KNJ-001',
      title: 'Traditional Kanjivaram with Temple Border',
      slug: 'traditional-kanjivaram-temple-border',
      description: 'Authentic Kanjivaram silk with iconic temple tower border design. Woven with pure mulberry silk and real gold zari, this is the quintessential South Indian bridal saree.',
      care: 'Dry clean only. Store wrapped in red cloth. Annual airing recommended.',
      fabric: 'Pure Mulberry Silk',
      occasion: ['South Indian Wedding', 'Muhurtham', 'Temple Functions'],
      features: ['Pure Silk', 'Real Gold Zari', 'Temple Border', 'Bridal'],
      isFeatured: true,
      variants: createVariants('kanjivaram', 'KNJ-001', colorPalettes.traditional, 75000, 95000, [2, 6]),
    },
    {
      sku: 'KNJ-002',
      title: 'Kanjivaram with Peacock Motifs',
      slug: 'kanjivaram-peacock-motifs',
      description: 'Majestic Kanjivaram featuring elaborate peacock motifs across the body and pallu. The national bird design symbolizes beauty and grace in South Indian tradition.',
      care: 'Professional dry clean. Store in cool, dry place.',
      fabric: 'Kanjivaram Silk',
      occasion: ['Weddings', 'Receptions', 'Grand Celebrations'],
      features: ['Peacock Design', 'Elaborate Pallu', 'Wedding Collection', 'Traditional'],
      variants: createVariants('kanjivaram', 'KNJ-002', colorPalettes.festive, 65000, 82000, [2, 5]),
    },
    {
      sku: 'KNJ-003',
      title: 'Lightweight Kanjivaram Saree',
      slug: 'lightweight-kanjivaram-saree',
      description: 'Modern lightweight version of classic Kanjivaram, easier to drape while maintaining authentic silk and zari. Perfect for those who love Kanjivaram but prefer lighter sarees.',
      care: 'Dry clean recommended. Can be stored folded.',
      fabric: 'Soft Kanjivaram Silk',
      occasion: ['Office', 'Functions', 'Family Events'],
      features: ['Lightweight', 'Easy Drape', 'Authentic Weave', 'All Day Comfort'],
      isNew: true,
      variants: createVariants('kanjivaram', 'KNJ-003', colorPalettes.elegant, 35000, 45000, [5, 12]),
    },
    {
      sku: 'KNJ-004',
      title: 'Contrast Pallu Kanjivaram',
      slug: 'contrast-pallu-kanjivaram',
      description: 'Stunning Kanjivaram with dramatically different pallu color creating a two-in-one look. The contrast border and pallu add modern flair to traditional weaving.',
      care: 'Dry clean only. Separate storage for protection.',
      fabric: 'Pure Kanjivaram Silk',
      occasion: ['Engagement', 'Reception', 'Festive'],
      features: ['Contrast Pallu', 'Dual Color', 'Modern Traditional', 'Statement Piece'],
      isFeatured: true,
      variants: createVariants('kanjivaram', 'KNJ-004', colorPalettes.regal, 55000, 70000, [3, 8]),
    },
  ],
};

// ============================================================================
// CATEGORY 10: IKKAT SAREES
// ============================================================================
const ikkat: CategoryData = {
  name: 'Ikkat',
  slug: 'ikkat',
  description: 'Handwoven Ikkat sarees featuring distinctive resist-dyeing technique, showcasing geometric patterns unique to Indian weaving heritage.',
  image: getCategoryImageUrl('ikkat'),
  sortOrder: 10,
  products: [
    {
      sku: 'IKK-001',
      title: 'Pochampally Double Ikkat Silk',
      slug: 'pochampally-double-ikkat-silk',
      description: 'Masterpiece of Telangana weaving - authentic Pochampally double ikkat where both warp and weft threads are tie-dyed before weaving. GI certified craftsmanship.',
      care: 'Dry clean only. Do not soak. Store carefully.',
      fabric: 'Pure Silk',
      occasion: ['Weddings', 'Cultural Events', 'Festive'],
      features: ['Double Ikkat', 'GI Certified', 'Pochampally', 'Collectible'],
      isFeatured: true,
      isNew: true,
      variants: createVariants('ikkat', 'IKK-001', colorPalettes.traditional, 28000, 35000, [4, 10]),
    },
    {
      sku: 'IKK-002',
      title: 'Cotton Ikkat with Geometric Pattern',
      slug: 'cotton-ikkat-geometric-pattern',
      description: 'Comfortable cotton ikkat saree featuring bold geometric patterns. The resist-dye technique creates unique blurred edges characteristic of authentic ikkat.',
      care: 'Hand wash cold. Dry in shade. Iron on medium.',
      fabric: 'Pure Cotton',
      occasion: ['Daily Wear', 'Office', 'Casual'],
      features: ['Geometric', 'Cotton Comfort', 'Traditional Craft', 'Everyday Luxury'],
      variants: createVariants('ikkat', 'IKK-002', colorPalettes.earthy, 5500, 7000, [15, 35]),
    },
    {
      sku: 'IKK-003',
      title: 'Patola Single Ikkat Saree',
      slug: 'patola-single-ikkat-saree',
      description: 'Inspired by Gujarat Patola tradition, this single ikkat saree features the iconic geometric patterns. More affordable than double ikkat while retaining the artistic appeal.',
      care: 'Dry clean recommended. Handle with care.',
      fabric: 'Silk Blend',
      occasion: ['Festive', 'Special Occasions', 'Functions'],
      features: ['Patola Pattern', 'Single Ikkat', 'Geometric', 'Vibrant'],
      variants: createVariants('ikkat', 'IKK-003', colorPalettes.vibrant, 12000, 15000, [8, 18]),
    },
    {
      sku: 'IKK-004',
      title: 'Odisha Bandha Ikkat',
      slug: 'odisha-bandha-ikkat',
      description: 'Traditional Bandha (ikkat) from Odisha featuring tribal and nature-inspired motifs. The unique Eastern Indian style adds diversity to the ikkat collection.',
      care: 'Dry clean only. Traditional fabric requires gentle care.',
      fabric: 'Handloom Silk',
      occasion: ['Cultural Events', 'Festive', 'Art Exhibitions'],
      features: ['Odisha Craft', 'Tribal Motifs', 'Eastern Style', 'Artisan Made'],
      isNew: true,
      variants: createVariants('ikkat', 'IKK-004', colorPalettes.regal, 18000, 22500, [5, 12]),
    },
    {
      sku: 'IKK-005',
      title: 'Contemporary Ikkat Fusion',
      slug: 'contemporary-ikkat-fusion',
      description: 'Modern interpretation of classic ikkat with contemporary color combinations and scaled-down patterns. Perfect for the new generation who appreciates traditional craft.',
      care: 'Dry clean or gentle hand wash. Modern fabric for easy care.',
      fabric: 'Soft Silk Blend',
      occasion: ['Office', 'Parties', 'Modern Occasions'],
      features: ['Modern Design', 'Contemporary Colors', 'New Age Ikkat', 'Versatile'],
      isFeatured: true,
      variants: createVariants('ikkat', 'IKK-005', colorPalettes.pastel, 8500, 10500, [12, 28]),
    },
  ],
};

// ============================================================================
// COMPLETE CATALOG EXPORT
// ============================================================================
export const productCatalog: CatalogData = {
  cloudName: 'your-cloud-name', // Replace with actual cloud name from env
  baseUrl: 'https://res.cloudinary.com',
  categories: [
    banarasi,
    organza,
    georgette,
    satin,
    tussar,
    linen,
    chiffon,
    bandhani,
    kanjivaram,
    ikkat,
  ],
};

// Catalog statistics
export const catalogStats = {
  totalCategories: productCatalog.categories.length,
  totalProducts: productCatalog.categories.reduce((sum, cat) => sum + cat.products.length, 0),
  totalVariants: productCatalog.categories.reduce(
    (sum, cat) => sum + cat.products.reduce((pSum, prod) => pSum + prod.variants.length, 0),
    0
  ),
  priceRange: {
    min: Math.min(
      ...productCatalog.categories.flatMap(cat =>
        cat.products.flatMap(prod => prod.variants.map(v => v.price))
      )
    ),
    max: Math.max(
      ...productCatalog.categories.flatMap(cat =>
        cat.products.flatMap(prod => prod.variants.map(v => v.price))
      )
    ),
  },
};

export default productCatalog;
