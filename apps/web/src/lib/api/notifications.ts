import apiClient from './client';

export interface AppNotification {
  id: string;
  type: string;
  payload: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export const fetchNotifications = () =>
  apiClient.get<AppNotification[]>('/notifications').then((r) => r.data);

export const fetchNotifUnreadCount = () =>
  apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count);

export const markAllNotifRead = () =>
  apiClient.patch('/notifications/read').then(() => undefined);

export const markNotifRead = (id: string) =>
  apiClient.patch(`/notifications/${id}/read`).then(() => undefined);
