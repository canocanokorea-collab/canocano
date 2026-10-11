export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  status: '판매중' | '숨김' | '품절';
  isDisplayed: boolean;
  mainImage: string;
  detailImages: string[];
  options: ProductOption[];
  delivery: {
    type: string;
    fee: number;
    freeThreshold: number;
  };
  description?: string;
  detailBodyImages?: string[];
  detailNoticeText?: string;
  detailHtml: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedOptions: Record<string, string>;
  quantity: number;
  unitPrice: number;
}

export interface CustomerInquiry {
  id?: string;
  name: string;
  phone: string;
  email: string;
  type: '배송/제작' | '상품문의' | '교환/반품' | '쇼룸방문' | '기타';
  title: string;
  content: string;
  createdAt?: string;
}

export interface OrderInfo {
  orderId: string;
  orderName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  postalCode: string;
  addressMain: string;
  addressDetail: string;
  deliveryMemo?: string;
  items: {
    productId: string;
    name: string;
    options: Record<string, string>;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryFee: number;
  paymentKey?: string;
  method?: string;
  status: 'READY' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}
