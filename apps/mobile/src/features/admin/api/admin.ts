import apiClient from '@/shared/api/client';

export interface AdminStats {
  users: number;
  listings: number;
  activeListings: number;
  unverifiedListings: number;
  offers: number;
  banned: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  accountType: 'PRIVATE' | 'BUSINESS';
  verified: boolean;
  bannedAt: string | null;
  emailVerifiedAt: string | null;
  ratingAvg: number;
  createdAt: string;
  _count: { listings: number };
}

export type AdminListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export interface AdminListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: AdminListingStatus;
  verified: boolean;
  createdAt: string;
  images: { url: string }[];
  seller: { id: string; displayName: string; email: string };
}

export const fetchAdminStats = () => apiClient.get<AdminStats>('/admin/stats').then((r) => r.data);

export const fetchAdminUsers = (q?: string) =>
  apiClient.get<AdminUser[]>('/admin/users', { params: q ? { q } : {} }).then((r) => r.data);

export const banUser = (id: string, banned: boolean) =>
  apiClient.patch<AdminUser>(`/admin/users/${id}/ban`, { banned }).then((r) => r.data);

export const verifyUser = (id: string, verified: boolean) =>
  apiClient.patch<AdminUser>(`/admin/users/${id}/verify`, { verified }).then((r) => r.data);

export const setUserRole = (id: string, role: 'USER' | 'ADMIN') =>
  apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }).then((r) => r.data);

export const fetchAdminListings = (status?: AdminListingStatus, q?: string) =>
  apiClient
    .get<AdminListing[]>('/admin/listings', { params: { ...(status ? { status } : {}), ...(q ? { q } : {}) } })
    .then((r) => r.data);

export const verifyListing = (id: string, verified: boolean) =>
  apiClient.patch(`/admin/listings/${id}/verify`, { verified }).then((r) => r.data);

export const setListingStatus = (id: string, status: AdminListingStatus) =>
  apiClient.patch(`/admin/listings/${id}/status`, { status }).then((r) => r.data);

export const removeAdminListing = (id: string) =>
  apiClient.delete(`/admin/listings/${id}`).then((r) => r.data);
