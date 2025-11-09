/**
 * TryOnStorageManager - Handles localStorage persistence for try-on functionality
 * Manages user preferences, captured images, and session data
 */

export interface TryOnSettings {
  // Canvas controls
  lighting: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  garment: {
    scale: number;
    rotation: number;
    opacity: number;
    positionX: number;
    positionY: number;
  };
  pose: {
    selectedPose: string;
    customAdjustments: {
      shoulderWidth: number;
      torsoLength: number;
      armPosition: number;
    };
  };
  camera: {
    zoom: number;
    flip: boolean;
    filter: string;
  };
}

export interface CapturedImage {
  id: string;
  imageDataUrl: string;
  productName: string;
  variantInfo: string;
  garmentImageUrl: string;
  qualityScore: number;
  timestamp: string;
  settings?: Partial<TryOnSettings>;
}

export interface TryOnSessionData {
  startTime: number;
  lastActivity: number;
  captureCount: number;
  settingsChanges: number;
}

export class TryOnStorageManager {
  private readonly SETTINGS_KEY = 'tryon_settings';
  private readonly CAPTURED_IMAGES_KEY = 'tryon_captured_images';
  private readonly SESSION_KEY = 'tryon_session';
  private readonly USER_PREFERENCES_KEY = 'tryon_user_preferences';
  private readonly MAX_STORED_IMAGES = 10; // Limit storage usage

  /**
   * Get default settings for new users
   */
  private getDefaultSettings(): TryOnSettings {
    return {
      lighting: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
      },
      garment: {
        scale: 1.0,
        rotation: 0,
        opacity: 0.85,
        positionX: 0,
        positionY: 0,
      },
      pose: {
        selectedPose: 'standing_front',
        customAdjustments: {
          shoulderWidth: 1.0,
          torsoLength: 1.0,
          armPosition: 0,
        },
      },
      camera: {
        zoom: 1.0,
        flip: false,
        filter: 'none',
      },
    };
  }

  /**
   * Load user's saved try-on settings
   */
  loadSettings(): TryOnSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to handle any missing properties
        return this.mergeWithDefaults(parsedSettings);
      }
    } catch (error) {
      console.warn('Failed to load try-on settings from localStorage:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Save user's try-on settings
   */
  saveSettings(settings: Partial<TryOnSettings>): void {
    try {
      const currentSettings = this.loadSettings();
      const updatedSettings = this.deepMerge(currentSettings, settings);
      
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      
      // Update session activity
      this.updateSessionActivity();
      
      // Track settings change count
      this.incrementSettingsChanges();
    } catch (error) {
      console.warn('Failed to save try-on settings to localStorage:', error);
    }
  }

  /**
   * Save a captured image with metadata
   */
  saveCapturedImage(imageData: Omit<CapturedImage, 'id'>): string {
    try {
      const id = this.generateId();
      const capturedImage: CapturedImage = {
        ...imageData,
        id,
        settings: this.loadSettings(),
      };

      const stored = this.getCapturedImages();
      stored.unshift(capturedImage);

      // Limit storage to prevent excessive memory usage
      if (stored.length > this.MAX_STORED_IMAGES) {
        stored.splice(this.MAX_STORED_IMAGES);
      }

      localStorage.setItem(this.CAPTURED_IMAGES_KEY, JSON.stringify(stored));
      
      // Update session data
      this.incrementCaptureCount();
      
      return id;
    } catch (error) {
      console.warn('Failed to save captured image to localStorage:', error);
      return '';
    }
  }

  /**
   * Get all captured images
   */
  getCapturedImages(): CapturedImage[] {
    try {
      const stored = localStorage.getItem(this.CAPTURED_IMAGES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load captured images from localStorage:', error);
    }
    
    return [];
  }

  /**
   * Delete a specific captured image
   */
  deleteCapturedImage(id: string): boolean {
    try {
      const stored = this.getCapturedImages();
      const filtered = stored.filter(img => img.id !== id);
      
      if (filtered.length !== stored.length) {
        localStorage.setItem(this.CAPTURED_IMAGES_KEY, JSON.stringify(filtered));
        return true;
      }
    } catch (error) {
      console.warn('Failed to delete captured image from localStorage:', error);
    }
    
    return false;
  }

  /**
   * Clear all captured images
   */
  clearCapturedImages(): void {
    try {
      localStorage.removeItem(this.CAPTURED_IMAGES_KEY);
    } catch (error) {
      console.warn('Failed to clear captured images from localStorage:', error);
    }
  }

  /**
   * Get current session data
   */
  getSessionData(): TryOnSessionData {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load session data from localStorage:', error);
    }

    // Initialize new session
    const newSession: TryOnSessionData = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      captureCount: 0,
      settingsChanges: 0,
    };
    
    this.saveSessionData(newSession);
    return newSession;
  }

  /**
   * Get session start time for analytics
   */
  getSessionStartTime(): number {
    return this.getSessionData().startTime;
  }

  /**
   * Save user preferences (non-session specific settings)
   */
  saveUserPreferences(preferences: {
    autoSave?: boolean;
    defaultCamera?: 'front' | 'back';
    qualityThreshold?: number;
    showTips?: boolean;
  }): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.USER_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error);
    }
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): {
    autoSave: boolean;
    defaultCamera: 'front' | 'back';
    qualityThreshold: number;
    showTips: boolean;
  } {
    try {
      const stored = localStorage.getItem(this.USER_PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        return {
          autoSave: preferences.autoSave ?? true,
          defaultCamera: preferences.defaultCamera ?? 'front',
          qualityThreshold: preferences.qualityThreshold ?? 0.6,
          showTips: preferences.showTips ?? true,
        };
      }
    } catch (error) {
      console.warn('Failed to load user preferences from localStorage:', error);
    }

    return {
      autoSave: true,
      defaultCamera: 'front',
      qualityThreshold: 0.6,
      showTips: true,
    };
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    settingsSize: number;
    imagesCount: number;
    imagesSize: number;
    totalSize: number;
  } {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY) || '';
      const images = localStorage.getItem(this.CAPTURED_IMAGES_KEY) || '';
      const session = localStorage.getItem(this.SESSION_KEY) || '';
      const preferences = localStorage.getItem(this.USER_PREFERENCES_KEY) || '';

      return {
        settingsSize: new Blob([settings]).size,
        imagesCount: this.getCapturedImages().length,
        imagesSize: new Blob([images]).size,
        totalSize: new Blob([settings + images + session + preferences]).size,
      };
    } catch (error) {
      console.warn('Failed to calculate storage stats:', error);
      return {
        settingsSize: 0,
        imagesCount: 0,
        imagesSize: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Clear all try-on related data
   */
  clearAllData(): void {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.CAPTURED_IMAGES_KEY);
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_PREFERENCES_KEY);
    } catch (error) {
      console.warn('Failed to clear try-on data from localStorage:', error);
    }
  }

  /**
   * Export user data for backup/transfer
   */
  exportData(): string {
    try {
      const data = {
        settings: this.loadSettings(),
        capturedImages: this.getCapturedImages().map(img => ({
          ...img,
          // Don't export the actual image data for size reasons
          imageDataUrl: '',
        })),
        preferences: this.getUserPreferences(),
        exportedAt: new Date().toISOString(),
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.warn('Failed to export try-on data:', error);
      return '';
    }
  }

  /**
   * Import user data from backup
   */
  importData(exportedData: string): boolean {
    try {
      const data = JSON.parse(exportedData);
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.preferences) {
        this.saveUserPreferences(data.preferences);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to import try-on data:', error);
      return false;
    }
  }

  // Private helper methods

  private saveSessionData(sessionData: TryOnSessionData): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session data to localStorage:', error);
    }
  }

  private updateSessionActivity(): void {
    const session = this.getSessionData();
    session.lastActivity = Date.now();
    this.saveSessionData(session);
  }

  private incrementCaptureCount(): void {
    const session = this.getSessionData();
    session.captureCount += 1;
    session.lastActivity = Date.now();
    this.saveSessionData(session);
  }

  private incrementSettingsChanges(): void {
    const session = this.getSessionData();
    session.settingsChanges += 1;
    session.lastActivity = Date.now();
    this.saveSessionData(session);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private mergeWithDefaults(settings: Partial<TryOnSettings>): TryOnSettings {
    const defaults = this.getDefaultSettings();
    return this.deepMerge(defaults, settings) as TryOnSettings;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}