/**
 * Server-side NSFW and content safety heuristics
 * Performs analysis without external API calls using pattern matching and content analysis
 */

export interface NSFWHeuristicResult {
  riskScore: number; // 0-1, higher means riskier
  textRiskScore: number;
  imageRiskScore: number;
  userRiskScore: number;
  flags: string[];
  recommendation: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  confidence: number;
}

export interface ContentAnalysisInput {
  text: {
    title: string;
    body: string;
  };
  images?: {
    urls: string[];
    metadata?: Array<{
      filename: string;
      size: number;
      contentType: string;
    }>;
  };
  user: {
    id: string;
    trustScore?: number;
    reviewHistory?: {
      totalReviews: number;
      rejectedReviews: number;
      reportedReviews: number;
    };
  };
  context: {
    productCategory?: string;
    isVerifiedPurchase: boolean;
  };
}

/**
 * Comprehensive NSFW and safety heuristic analyzer
 */
export class NSFWHeuristicAnalyzer {
  // Inappropriate keywords and phrases (extend as needed)
  private readonly inappropriateKeywords = [
    // Explicit sexual content
    'xxx', 'porn', 'nude', 'naked', 'sex', 'sexy', 'erotic', 'adult',
    'nsfw', 'explicit', 'intimate', 'provocative', 'seductive', 'sensual',
    
    // Violence and harmful content
    'violence', 'blood', 'gore', 'kill', 'murder', 'death', 'harm',
    'weapon', 'gun', 'knife', 'bomb', 'terror',
    
    // Hate speech and discrimination
    'hate', 'racist', 'discrimination', 'offensive', 'slur',
    
    // Spam indicators
    'click here', 'buy now', 'limited time', 'act fast', 'urgent',
    'guarantee', 'free money', 'earn fast', 'work from home',
    
    // Suspicious patterns
    'fake', 'scam', 'fraud', 'cheat', 'hack', 'illegal',
  ];

  // Context-specific risk indicators
  private readonly riskPatterns = {
    // Suspicious review patterns
    fakeReview: [
      /amazing\s+product\s+buy\s+now/i,
      /best\s+quality\s+ever\s+seen/i,
      /highly\s+recommend\s+to\s+everyone/i,
      /perfect\s+in\s+every\s+way/i,
    ],
    
    // Promotional content
    promotional: [
      /check\s+out\s+my\s+website/i,
      /visit\s+my\s+store/i,
      /dm\s+me\s+for\s+details/i,
      /contact\s+me\s+at/i,
    ],
    
    // Inappropriate personal information sharing
    personalInfo: [
      /\b\d{10,}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /\bwww\.[^\s]+/i, // URLs
      /\bhttps?:\/\/[^\s]+/i, // URLs
    ],
  };

  /**
   * Analyze content for NSFW and safety risks
   */
  analyzeContent(input: ContentAnalysisInput): NSFWHeuristicResult {
    // 1. Analyze text content
    const textAnalysis = this.analyzeText(input.text);
    
    // 2. Analyze image indicators (metadata-based since we don't have image content)
    const imageAnalysis = this.analyzeImageMetadata(input.images);
    
    // 3. Analyze user risk factors
    const userAnalysis = this.analyzeUser(input.user);
    
    // 4. Apply contextual adjustments
    const contextualRisk = this.applyContextualAnalysis(input.context, textAnalysis);
    
    // 5. Calculate final risk score
    const finalRisk = this.calculateFinalRisk({
      textRisk: textAnalysis.riskScore,
      imageRisk: imageAnalysis.riskScore,
      userRisk: userAnalysis.riskScore,
      contextualRisk,
    });

    // 6. Combine all flags
    const allFlags = [
      ...textAnalysis.flags,
      ...imageAnalysis.flags,
      ...userAnalysis.flags,
    ];

    // 7. Make recommendation
    const { recommendation, confidence } = this.makeRecommendation(finalRisk, input);

    return {
      riskScore: finalRisk,
      textRiskScore: textAnalysis.riskScore,
      imageRiskScore: imageAnalysis.riskScore,
      userRiskScore: userAnalysis.riskScore,
      flags: allFlags,
      recommendation,
      confidence,
    };
  }

  /**
   * Analyze text content for inappropriate material
   */
  private analyzeText(text: { title: string; body: string }): {
    riskScore: number;
    flags: string[];
  } {
    const fullText = `${text.title} ${text.body}`.toLowerCase();
    let riskScore = 0;
    const flags: string[] = [];

    // 1. Check for inappropriate keywords
    let inappropriateCount = 0;
    for (const keyword of this.inappropriateKeywords) {
      if (fullText.includes(keyword.toLowerCase())) {
        inappropriateCount++;
        flags.push(`Contains inappropriate keyword: ${keyword}`);
      }
    }

    if (inappropriateCount > 0) {
      riskScore += Math.min(inappropriateCount * 0.2, 0.6);
    }

    // 2. Check for suspicious patterns
    const patternCategories = Object.keys(this.riskPatterns) as (keyof typeof this.riskPatterns)[];
    for (const category of patternCategories) {
      const patterns = this.riskPatterns[category];
      for (const pattern of patterns) {
        if (pattern.test(fullText)) {
          riskScore += 0.15;
          flags.push(`Suspicious ${category} pattern detected`);
          break; // Only count once per category
        }
      }
    }

    // 3. Check text quality indicators
    const textQuality = this.analyzeTextQuality(fullText);
    riskScore += textQuality.riskScore;
    flags.push(...textQuality.flags);

    // 4. Check for spam indicators
    const spamAnalysis = this.analyzeSpamIndicators(fullText);
    riskScore += spamAnalysis.riskScore;
    flags.push(...spamAnalysis.flags);

    return {
      riskScore: Math.min(riskScore, 1),
      flags,
    };
  }

  /**
   * Analyze text quality for spam or low-effort content
   */
  private analyzeTextQuality(text: string): { riskScore: number; flags: string[] } {
    let riskScore = 0;
    const flags: string[] = [];

    // Check for excessive repetition
    const words = text.split(/\s+/);
    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = 1 - (uniqueWords.size / wordCount);

    if (repetitionRatio > 0.7) {
      riskScore += 0.3;
      flags.push('High word repetition detected');
    }

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) {
      riskScore += 0.2;
      flags.push('Excessive capitalization');
    }

    // Check for minimal content
    if (text.length < 20) {
      riskScore += 0.15;
      flags.push('Very short content');
    }

    // Check for excessive punctuation or special characters
    const specialCharRatio = (text.match(/[!@#$%^&*()_+=\-\[\]{}|;:,.<>?]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      riskScore += 0.2;
      flags.push('Excessive special characters');
    }

    // Check for gibberish (consecutive consonants or vowels)
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(text) || /[aeiou]{4,}/i.test(text)) {
      riskScore += 0.25;
      flags.push('Potential gibberish content');
    }

    return { riskScore, flags };
  }

  /**
   * Analyze for spam indicators
   */
  private analyzeSpamIndicators(text: string): { riskScore: number; flags: string[] } {
    let riskScore = 0;
    const flags: string[] = [];

    // Check for promotional language
    const promoWords = ['buy', 'sale', 'discount', 'cheap', 'deal', 'offer', 'price', 'cost'];
    const promoCount = promoWords.filter(word => text.includes(word)).length;
    
    if (promoCount >= 3) {
      riskScore += 0.3;
      flags.push('High promotional language detected');
    }

    // Check for urgency indicators
    const urgencyWords = ['now', 'today', 'hurry', 'limited', 'urgent', 'immediately', 'fast'];
    const urgencyCount = urgencyWords.filter(word => text.includes(word)).length;
    
    if (urgencyCount >= 2) {
      riskScore += 0.25;
      flags.push('Urgency spam indicators detected');
    }

    // Check for excessive emoji or symbols
    const emojiRegex = new RegExp('[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]', 'gu');
    const emojiCount = (text.match(emojiRegex) || []).length;
    if (emojiCount > 5) {
      riskScore += 0.15;
      flags.push('Excessive emoji usage');
    }

    return { riskScore, flags };
  }

  /**
   * Analyze image metadata for risk indicators
   */
  private analyzeImageMetadata(images?: ContentAnalysisInput['images']): {
    riskScore: number;
    flags: string[];
  } {
    if (!images || !images.urls.length) {
      return { riskScore: 0, flags: [] };
    }

    let riskScore = 0;
    const flags: string[] = [];

    // Check for suspicious filenames
    for (const url of images.urls) {
      const filename = url.split('/').pop() || '';
      
      // Check for inappropriate keywords in filenames
      for (const keyword of this.inappropriateKeywords) {
        if (filename.toLowerCase().includes(keyword)) {
          riskScore += 0.3;
          flags.push(`Suspicious filename: ${filename}`);
          break;
        }
      }

      // Check for random/generated filenames (potential stock photos or inappropriate content)
      if (/^[a-f0-9]{8,}$/i.test(filename.replace(/\.[^.]+$/, ''))) {
        riskScore += 0.1;
        flags.push('Random filename pattern detected');
      }
    }

    // Check for excessive number of images
    if (images.urls.length > 5) {
      riskScore += 0.15;
      flags.push('Excessive number of images');
    }

    // Check image metadata if available
    if (images.metadata) {
      for (const meta of images.metadata) {
        // Check for suspicious file types
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.indexOf(meta.contentType) === -1) {
          riskScore += 0.2;
          flags.push(`Suspicious file type: ${meta.contentType}`);
        }

        // Check for suspicious file sizes (too small might be placeholder, too large might be inappropriate)
        if (meta.size < 1000) {
          riskScore += 0.1;
          flags.push('Suspiciously small image file');
        } else if (meta.size > 10 * 1024 * 1024) { // 10MB
          riskScore += 0.15;
          flags.push('Unusually large image file');
        }
      }
    }

    return {
      riskScore: Math.min(riskScore, 1),
      flags,
    };
  }

  /**
   * Analyze user risk factors
   */
  private analyzeUser(user: ContentAnalysisInput['user']): {
    riskScore: number;
    flags: string[];
  } {
    let riskScore = 0;
    const flags: string[] = [];

    // Use provided trust score if available
    if (user.trustScore !== undefined) {
      riskScore += (1 - user.trustScore) * 0.3; // Invert trust score to risk score
    }

    // Analyze review history if available
    if (user.reviewHistory) {
      const { totalReviews, rejectedReviews, reportedReviews } = user.reviewHistory;

      if (totalReviews > 0) {
        const rejectionRate = rejectedReviews / totalReviews;
        const reportRate = reportedReviews / totalReviews;

        if (rejectionRate > 0.3) {
          riskScore += 0.4;
          flags.push('High review rejection rate');
        }

        if (reportRate > 0.2) {
          riskScore += 0.3;
          flags.push('High review report rate');
        }
      }

      // New users or users with very few reviews are slightly riskier
      if (totalReviews < 3) {
        riskScore += 0.1;
        flags.push('New or low-activity user');
      }
    }

    return {
      riskScore: Math.min(riskScore, 1),
      flags,
    };
  }

  /**
   * Apply contextual analysis based on product category and purchase verification
   */
  private applyContextualAnalysis(
    context: ContentAnalysisInput['context'],
    textAnalysis: { riskScore: number }
  ): number {
    let contextualRisk = 0;

    // Reduce risk for verified purchases
    if (context.isVerifiedPurchase) {
      contextualRisk -= 0.2;
    }

    // Apply category-specific adjustments
    if (context.productCategory) {
      const category = context.productCategory.toLowerCase();
      
      // Categories that might naturally have higher risk keywords
      if (['fashion', 'clothing', 'beauty', 'health'].some(cat => category.includes(cat))) {
        contextualRisk -= 0.1; // Reduce risk for categories where appearance-related terms are normal
      }
      
      // Categories that should have very low risk tolerance
      if (['children', 'kids', 'baby', 'family'].some(cat => category.includes(cat))) {
        contextualRisk += textAnalysis.riskScore * 0.5; // Increase sensitivity for child-related products
      }
    }

    return contextualRisk;
  }

  /**
   * Calculate final risk score from all factors
   */
  private calculateFinalRisk({
    textRisk,
    imageRisk,
    userRisk,
    contextualRisk,
  }: {
    textRisk: number;
    imageRisk: number;
    userRisk: number;
    contextualRisk: number;
  }): number {
    // Weighted combination of risk factors
    let finalRisk = 
      textRisk * 0.5 +        // 50% weight for text content
      imageRisk * 0.3 +       // 30% weight for image indicators
      userRisk * 0.2;         // 20% weight for user factors

    // Apply contextual adjustments
    finalRisk += contextualRisk;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, finalRisk));
  }

  /**
   * Make final recommendation based on risk score and context
   */
  private makeRecommendation(
    riskScore: number,
    input: ContentAnalysisInput
  ): { recommendation: NSFWHeuristicResult['recommendation']; confidence: number } {
    
    // High-risk content should be rejected
    if (riskScore >= 0.8) {
      return {
        recommendation: 'REJECT',
        confidence: 0.9,
      };
    }

    // Very low risk from verified users can be auto-approved
    if (riskScore <= 0.2 && input.context.isVerifiedPurchase && (input.user.trustScore || 0) > 0.7) {
      return {
        recommendation: 'APPROVE',
        confidence: 0.85,
      };
    }

    // Medium risk requires manual review
    if (riskScore >= 0.4) {
      return {
        recommendation: 'MANUAL_REVIEW',
        confidence: 0.7,
      };
    }

    // Low risk can be approved with medium confidence
    return {
      recommendation: 'APPROVE',
      confidence: 0.6,
    };
  }

  /**
   * Quick safety check for immediate filtering
   */
  quickSafetyCheck(text: string): { safe: boolean; reason?: string } {
    const lowerText = text.toLowerCase();

    // Check for obvious inappropriate content
    const highRiskKeywords = ['xxx', 'porn', 'nude', 'sex', 'nsfw', 'explicit'];
    for (const keyword of highRiskKeywords) {
      if (lowerText.includes(keyword)) {
        return {
          safe: false,
          reason: `Contains inappropriate keyword: ${keyword}`,
        };
      }
    }

    // Check for obvious spam patterns
    if (this.riskPatterns.promotional.some(pattern => pattern.test(text))) {
      return {
        safe: false,
        reason: 'Contains promotional spam patterns',
      };
    }

    return { safe: true };
  }
}

/**
 * Singleton instance for server-side use
 */
let analyzerInstance: NSFWHeuristicAnalyzer | null = null;

export function getNSFWAnalyzer(): NSFWHeuristicAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new NSFWHeuristicAnalyzer();
  }
  return analyzerInstance;
}

/**
 * Convenience function for quick content analysis
 */
export function analyzeContentSafety(input: ContentAnalysisInput): NSFWHeuristicResult {
  const analyzer = getNSFWAnalyzer();
  return analyzer.analyzeContent(input);
}