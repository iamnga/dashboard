import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`
  return `${(ms / 3600000).toFixed(2)}h`
}

export function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    IB: '#1E88E5',
    MB: '#43A047',
    API: '#8E24AA',
    VA: '#FB8C00',
    QR: '#F4511E',
    ERP: '#3949AB',
  }
  return colors[channel] || '#666666'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SUCCESS: '#10b981',  // green
    TIMEOUT: '#f59e0b',  // amber
    FAILED: '#ef4444',   // red
  }
  return colors[status] || '#6b7280'
}

export function getBadgeColor(badge: string): string {
  const colors: Record<string, string> = {
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    API_CHAMPION: '#8E24AA',
    BRONZE: '#CD7F32',
  }
  return colors[badge] || '#9ca3af'
}
