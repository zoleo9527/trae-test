export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'owner' | 'printer' | 'customer_service';
  avatar: string;
  createdAt: string;
  updatedAt: string;
}
