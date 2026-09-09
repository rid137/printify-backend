export type OrderStatus =
  | "pending"
  | "received"
  | "processing"
  | "completed"
  | "delivered"
  | "cancelled";

export type TransactionStatus = "pending" | "success";

export type PrintingOptions = {
  color: "black-white" | "color";
  sides: "single" | "double";
  paperType: "matte" | "glossy" | "cardstock" | "recycled";
  paperSize: "A3" | "A4" | "A5" | "letter" | "legal";
  binding: "none" | "stapled" | "spiral" | "hardcover";
  finishing: "none" | "lamination";
};

export type User = {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isVerified?: boolean;
  accessToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginationMeta = {
  currentPage: number;
  perPage: number;
  totalDocuments: number;
  totalPages: number;
};

export type Paginated<T> = {
  documents: T[];
  meta: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  error: {
    message: string;
    statusCode: number;
    code?: string;
    details?: unknown;
  };
};

export type PriceBreakdown = {
  baseCost: number;
  colorPremium: number;
  doubleSidedDiscount: number;
  paperTypePremium: number;
  paperSizePremium: number;
  bindingCost: number;
  finishingCost: number;
};

export type PricingRules = {
  basePricePerPage: number;
  colorPremium: number;
  doubleSidedDiscount: number;
  paperTypePremium: Record<"matte" | "glossy" | "cardstock" | "recycled", number>;
  paperSizePremium: Record<"A3" | "A4" | "A5" | "letter" | "legal", number>;
  bindingCost: Record<"none" | "stapled" | "spiral" | "hardcover", number>;
  finishingCost: Record<"none" | "lamination", number>;
};

export type PublicQuote = {
  total: number;
  totalPrice: number;
  currency: string;
  pricePerUnit: number;
  totalPages: number;
  breakdown: PriceBreakdown;
  rulesVersion: number;
};

export type UploadedFile = {
  url: string;
  public_id: string;
  pages: number | null;
  originalFilename: string;
  mimeType: string;
  size: number;
  format: "pdf" | "docx" | "pptx";
};

export type UploadResult = {
  success: boolean;
  uploadedFiles: UploadedFile[];
  failedFiles: { originalFilename: string; reason: string }[];
  count: number;
  message: string;
};

export type OrderItem = {
  file: {
    url: string;
    publicId: string;
    fileName: string;
    pages: number;
    mimeType?: string;
    size?: number;
    format?: "pdf" | "docx" | "pptx";
  };
  printingOptions: PrintingOptions;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  pricingSnapshot?: {
    rulesVersion: number;
    rules: PricingRules;
    breakdown: PriceBreakdown;
  };
};

export type Order = {
  _id: string;
  user: string | User;
  items: OrderItem[];
  itemsSubtotal: number;
  totalPrice: number;
  currency: string;
  status: OrderStatus;
  statusHistory?: {
    status: OrderStatus;
    at: string;
    by?: string;
    note?: string;
  }[];
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Transaction = {
  _id: string;
  user: string | User;
  order: string | { _id: string };
  reference: string;
  amount: number;
  status: TransactionStatus;
  currency: string;
  email: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PricingConfig = {
  _id?: string;
  key?: string;
  version: number;
  rules: PricingRules;
  updatedBy?: string;
  updatedAt?: string;
};

export type PaymentInit = {
  authorization_url?: string;
  access_code?: string;
  reference: string;
};
