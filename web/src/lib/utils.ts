import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD') {
  if (amount === null || amount === undefined) return 'Contact for Value'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function getDaysRemaining(deadlineDate: string | null | undefined): {
  days: number
  text: string
  isUrgent: boolean
  isPast: boolean
} {
  if (!deadlineDate) {
    return { days: 0, text: 'No deadline', isUrgent: false, isPast: false }
  }

  const now = new Date()
  const deadline = new Date(deadlineDate)
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { days: diffDays, text: 'Closed', isUrgent: false, isPast: true }
  } else if (diffDays === 0) {
    return { days: 0, text: 'Closing today', isUrgent: true, isPast: false }
  } else if (diffDays === 1) {
    return { days: 1, text: '1 day left', isUrgent: true, isPast: false }
  } else if (diffDays <= 7) {
    return { days: diffDays, text: `${diffDays} days left`, isUrgent: true, isPast: false }
  } else {
    return { days: diffDays, text: `${diffDays} days left`, isUrgent: false, isPast: false }
  }
}
