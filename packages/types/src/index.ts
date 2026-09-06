export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type UserRole = 'ADMIN' | 'MEMBER';
export type DealStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'HIDDEN';
export type AlertType = 'PRICE_DROP' | 'BACK_IN_STOCK' | 'DEAL_EXPIRY';
export type AffiliateNetwork =
  | 'AMAZON'
  | 'IMPACT'
  | 'CJ'
  | 'AWIN'
  | 'PARTNERIZE'
  | 'SHAREASALE'
  | 'CUSTOM';
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface Category extends BaseEntity {
  name: string;
  slug: string;
}

export interface Merchant extends BaseEntity {
  name: string;
  slug: string;
  websiteUrl: string;
  affiliateNetwork: AffiliateNetwork;
  isActive: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  isActive: boolean;
}

export interface Deal extends BaseEntity {
  slug: string;
  title: string;
  description: string | null;
  productId: string;
  merchantId: string;
  currentPrice: number;
  previousPrice: number | null;
  currency: CurrencyCode;
  startsAt: Date | null;
  endsAt: Date | null;
  source: string | null;
  status: DealStatus;
  isFeatured: boolean;
  isHot: boolean;
  isHidden: boolean;
  score: number;
}

export interface Coupon extends BaseEntity {
  code: string;
  description: string | null;
  dealId: string | null;
  merchantId: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  isHidden: boolean;
}

export interface PriceHistory extends BaseEntity {
  productId: string;
  merchantId: string;
  price: number;
  currency: CurrencyCode;
  recordedAt: Date;
}

export interface AffiliateLink extends BaseEntity {
  merchantId: string;
  dealId: string | null;
  network: AffiliateNetwork;
  externalId: string | null;
  destinationUrl: string;
  trackingTemplate: string;
  isActive: boolean;
}

export interface Click extends BaseEntity {
  dealId: string | null;
  affiliateLinkId: string | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
}

export interface Review extends BaseEntity {
  productId: string;
  userId: string | null;
  title: string;
  body: string;
  rating: number;
}

export interface Favorite extends BaseEntity {
  userId: string;
  productId: string;
}

export interface Alert extends BaseEntity {
  userId: string;
  productId: string;
  type: AlertType;
  targetPrice: number | null;
  isActive: boolean;
}

export interface Session extends BaseEntity {
  userId: string | null;
  tokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
}

export interface CommissionEvent extends BaseEntity {
  affiliateLinkId: string;
  clickId: string | null;
  orderId: string | null;
  amount: number;
  currency: CurrencyCode;
  status: CommissionStatus;
  recordedAt: Date;
}

export interface DealFilters {
  query?: string;
  categorySlug?: string;
  merchantSlug?: string;
  hasCoupon?: boolean;
  minPrice?: number;
  maxPrice?: number;
  status?: DealStatus;
}

export type DealSortField = 'createdAt' | 'price' | 'savings' | 'score';
export type SortDirection = 'asc' | 'desc';

export interface DealSort {
  field: DealSortField;
  direction: SortDirection;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'deal' | 'product' | 'merchant' | 'coupon';
  title: string;
  slug?: string;
}

export interface AutocompleteResult {
  value: string;
  label: string;
  type: 'deal' | 'product' | 'merchant' | 'coupon' | 'category';
}

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AiProvider = 'openai' | 'openrouter' | 'anthropic' | 'gemini';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  provider: AiProvider;
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiChatResponse {
  provider: AiProvider;
  model: string;
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
