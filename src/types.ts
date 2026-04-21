export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  category: string;
  stock: number;
  createdAt: any;
}

export interface Order {
  id: string;
  userId?: string;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    location?: string;
  };
  items: CartItem[];
  subtotal?: number;
  shipping?: number;
  total: number;
  paymentMethod: string;
  transactionId?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize: string;
  selectedColor: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  address: string;
  email: string;
}
