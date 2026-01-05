
export type ImageStyle = 'realistic' | 'artistic' | 'anime' | 'cartoon' | 'professional';
export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16';

export interface GenerationConfig {
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
}

export interface EnhancementConfig {
  upscale: boolean;
  sharpen: boolean;
  denoise: boolean;
  colorAdjust: boolean;
  faceEnhance: boolean;
}

export interface AnimationConfig {
  image: string; // base64
  mimeType: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  intensity: 'soft' | 'medium' | 'dynamic';
  duration: number; // segundos (2-10)
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

// Admin Types
export type UserStatus = 'active' | 'trial' | 'expired' | 'blocked';
export type PlanType = 'free' | 'trial' | 'pro_monthly';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  plan: PlanType;
  created_at: string;
  expires_at: string | null;
  last_login: string | null;
  usage: {
    images: number;
    enhancements: number;
    animations: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  payingUsers: number;
  totalImages: number;
  totalAnimations: number;
}
