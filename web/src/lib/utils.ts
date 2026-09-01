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
  if (!deadlineDate) return { days: 0, text: 'No deadline', isUrgent: false, isPast: false }

  const diffDays = Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { days: diffDays, text: 'Closed', isUrgent: false, isPast: true }
  if (diffDays === 0) return { days: 0, text: 'Closing today', isUrgent: true, isPast: false }
  
  return {
    days: diffDays,
    text: diffDays === 1 ? '1 day left' : `${diffDays} days left`,
    isUrgent: diffDays <= 7,
    isPast: false
  }
}
