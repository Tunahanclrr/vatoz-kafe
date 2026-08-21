export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  vibe_points: number;
  created_at: string;
}

export interface Admin {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  vibe_points: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  required_points: number;
  reward_product_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_id: string;
  status: OrderStatus;
  total_price: number;
  total_vibe_points: number;
  total_points_redeemed: number;
  created_at: string;
  completed_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  unit_vibe_points: number;
  is_reward: boolean;
  reward_id: string | null;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { products: Pick<Product, 'name' | 'image_url'> | null })[];
  customers?: Pick<Customer, 'full_name' | 'phone'> | null;
}

export type CreateOrderItem =
  | { product_id: string; quantity: number }
  | { reward_id: string; quantity: number };
