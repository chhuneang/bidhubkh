/**
 * BidHubKH — Bakong KHQR Payment & Dynamic QR Code Engine
 * Implements National Bank of Cambodia (NBC) standard KHQR EMVCo specifications.
 */

import crypto from 'crypto'

export interface KHQRGenerationParams {
  merchantName: string
  merchantCity: string
  bakongAccountId: string
  amount: number
  currency: 'USD' | 'KHR'
  billNumber: string
  terminalLabel?: string
}

export interface KHQRResult {
  qrString: string
  md5: string
  qrImageUrl: string
  billNumber: string
  amount: number
  currency: 'USD' | 'KHR'
  expiresAt: string
}

/**
 * Calculates standard CRC16 CCITT for KHQR EMVCo payload.
 */
function crc16(data: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${tag}${len}${value}`
}

/**
 * Generates an authentic dynamic Bakong KHQR String compliant with NBC KHQR standard.
 */
export function generateBakongKHQR(params: KHQRGenerationParams): KHQRResult {
  const {
    merchantName = 'BIDHUBKH PROCUREMENT',
    merchantCity = 'Phnom Penh',
    bakongAccountId = 'bidhubkh@bk',
    amount,
    currency = 'USD',
    billNumber
  } = params

  const currencyCode = currency === 'USD' ? '840' : '116'
  const formattedAmount = currency === 'USD' ? amount.toFixed(2) : Math.round(amount).toString()

  // Tag 00: Payload Format Indicator
  let payload = formatTag('00', '01')
  // Tag 01: Point of Initiation Method (12 = Dynamic QR)
  payload += formatTag('01', '12')

  // Tag 29: Merchant Account Information (Bakong Individual / Merchant)
  const tag29_00 = formatTag('00', bakongAccountId)
  const tag29 = formatTag('29', tag29_00)
  payload += tag29

  // Tag 52: Merchant Category Code
  payload += formatTag('52', '5734')
  // Tag 53: Transaction Currency (840=USD, 116=KHR)
  payload += formatTag('53', currencyCode)
  // Tag 54: Transaction Amount
  payload += formatTag('54', formattedAmount)
  // Tag 58: Country Code
  payload += formatTag('58', 'KH')
  // Tag 59: Merchant Name
  payload += formatTag('59', merchantName.substring(0, 25))
  // Tag 60: Merchant City
  payload += formatTag('60', merchantCity.substring(0, 15))

  // Tag 62: Additional Data Field (Bill Number, Reference)
  const tag62_01 = formatTag('01', billNumber)
  const tag62 = formatTag('62', tag62_01)
  payload += tag62

  // Tag 63: CRC (Tag + Length + Placeholder)
  const payloadToSign = payload + '6304'
  const calculatedCRC = crc16(payloadToSign)
  const fullKHQRString = payloadToSign + calculatedCRC

  // MD5 verification checksum
  const md5Hash = crypto.createHash('md5').update(fullKHQRString).digest('hex')

  // Generate standard renderable QR Image URL via high-performance SVG/PNG QR service
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullKHQRString)}&margin=10`

  // 15-minute expiration
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  return {
    qrString: fullKHQRString,
    md5: md5Hash,
    qrImageUrl,
    billNumber,
    amount,
    currency,
    expiresAt
  }
}
