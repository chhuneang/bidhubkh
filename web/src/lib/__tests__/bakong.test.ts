import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { generateBakongKHQR } from '@/lib/bakong'

/**
 * Characterization tests for the KHQR builder (web/src/lib/bakong.ts).
 *
 * The module's `crc16` helper is private, so CRC goldens are exercised through
 * the public `generateBakongKHQR` payload: the trailing 4 hex characters of
 * every expected string below ARE the CRC-16/CCITT-FALSE golden values.
 *
 * Golden derivation: an independently written CCITT-FALSE calculator
 * (poly 0x1021, init 0xFFFF, MSB-first, no reflection, xorout 0) was validated
 * against published check vectors -- "" -> FFFF, "123456789" -> 29B1,
 * "A" -> B915 -- and used to sign hand-assembled EMVCo payloads.
 */

const QR_URL_PREFIX = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='

function expectValidEnvelope(result: ReturnType<typeof generateBakongKHQR>) {
  // Tag 63 CRC terminator: everything except the final 4 chars ends with '6304'
  expect(result.qrString.slice(0, 12)).toBe('000201010212') // payload format + dynamic POS method
  expect(result.qrString.slice(-8, -4)).toBe('6304')
  expect(result.md5).toMatch(/^[0-9a-f]{32}$/)
}

describe('generateBakongKHQR — empty-ish input goldens', () => {
  it('signs an all-empty merchant profile correctly', () => {
    const result = generateBakongKHQR({
      merchantName: '',
      merchantCity: '',
      bakongAccountId: '',
      amount: 0,
      currency: 'USD',
      billNumber: '',
    })
    // Hand-assembled: 000201 010212 29040000 52045734 5303840 54040.00 5802KH
    //                5900 6000 62040100 6304 -> CRC16 = 85C7
    expect(result.qrString).toBe(
      '0002010102122904000052045734530384054040.005802KH5900600062040100630485C7'
    )
    expect(result.md5).toBe('c0d904919c48c85697bbc0303d59ac07')
    expectValidEnvelope(result)
  })
})

describe('generateBakongKHQR — typical merchant QR payload goldens', () => {
  it('builds a canonical dynamic USD merchant QR string', () => {
    const result = generateBakongKHQR({
      merchantName: 'ANGKOR MART',
      merchantCity: 'Phnom Penh',
      bakongAccountId: 'angkor_mart@aclb',
      amount: 25.5,
      currency: 'USD',
      billNumber: 'INV-2026-001',
    })
    // Tags: 000201 010212 | 2920 0016angkor_mart@aclb | 52045734 5303840
    //       5405 25.50 5802KH 5911ANGKOR MART 6010Phnom Penh
    //       6216 0112INV-2026-001 | 6304 -> CRC16 = 07CB
    expect(result.qrString).toBe(
      '00020101021229200016angkor_mart@aclb520457345303840540525.505802KH5911ANGKOR MART6010Phnom Penh62160112INV-2026-001630407CB'
    )
    expect(result.md5).toBe('4c3cc698b9876409e9217a1da281099f')
    expect(result.billNumber).toBe('INV-2026-001')
    expect(result.amount).toBe(25.5)
    expect(result.currency).toBe('USD')
    expect(result.qrImageUrl).toBe(
      `${QR_URL_PREFIX}${encodeURIComponent(result.qrString)}&margin=10`
    )
    expectValidEnvelope(result)
  })

  it('formats KHR amounts as rounded integers under currency code 116', () => {
    const result = generateBakongKHQR({
      merchantName: 'Angkor Mart KH',
      merchantCity: 'Phnom Penh',
      bakongAccountId: 'angkor_mart@aclb',
      amount: 12500.7,
      currency: 'KHR',
      billNumber: 'KH-RIEL-01',
    })
    // 5303116 (KHR) + 540512501 (Math.round(12500.7)) -> CRC16 = 7904
    expect(result.qrString).toBe(
      '00020101021229200016angkor_mart@aclb5204573453031165405125015802KH5914Angkor Mart KH6010Phnom Penh62140110KH-RIEL-0163047904'
    )
    expect(result.md5).toBe('0cc8dd796318bd8e4dc10e662dc3248d')
    expectValidEnvelope(result)
  })
})

describe('generateBakongKHQR — Khmer/Latin mixed-field goldens', () => {
  it('signs a payload mixing Latin and Khmer script fields', () => {
    const result = generateBakongKHQR({
      merchantName: 'Phnom Penh ភ្នំពេញ',
      merchantCity: 'ភ្នំពេញ',
      bakongAccountId: 'sophy@wing',
      amount: 12.25,
      currency: 'USD',
      billNumber: 'BILL-KH-88',
    })
    // Lengths are JS UTF-16 code-unit counts: 'Phnom Penh ភ្នំពេញ'.length === 18 -> tag 5918;
    // 'ភ្នំពេញ'.length === 7 -> tag 6007. CRC16 over this payload = 8567.
    // NOTE: EMVCo/NBC KHQR prescribes BYTE lengths (UTF-8); Khmer chars encode
    // to 3 bytes each, so a spec-conformant encoder would emit different TLV
    // lengths here. This test pins the implementation's current behavior.
    expect(result.qrString).toBe(
      '00020101021229140010sophy@wing520457345303840540512.255802KH5918Phnom Penh ភ្នំពេញ6007ភ្នំពេញ62140110BILL-KH-8863048567'
    )
    expect(result.md5).toBe('56b6dc0970d216e999919e8e5327a011')
    expectValidEnvelope(result)
  })
})

describe('generateBakongKHQR — field truncation goldens', () => {
  it('truncates merchant name at 25 chars and city at 15 chars before signing', () => {
    const result = generateBakongKHQR({
      merchantName: 'BidHubKH Cambodia Procurement Platform Ltd', // 42 chars -> first 25
      merchantCity: 'Phnom Penh Capital City', // 23 chars -> first 15
      bakongAccountId: 'bidhubkh@bakong',
      amount: 1000,
      currency: 'USD',
      billNumber: 'TRUNC-CASE',
    })
    // 5925BidHubKH Cambodia Procure | 6015Phnom Penh Capi -> CRC16 = CE29
    expect(result.qrString).toBe(
      '00020101021229190015bidhubkh@bakong52045734530384054071000.005802KH5925BidHubKH Cambodia Procure6015Phnom Penh Capi62140110TRUNC-CASE6304CE29'
    )
    expect(result.md5).toBe('9c33a4cd9e264fcf9fca2ab855a16135')
    expectValidEnvelope(result)
  })
})

describe('generateBakongKHQR — parameter defaults', () => {
  it('falls back to the BidHubKH merchant identity when optional fields are omitted', () => {
    const result = generateBakongKHQR({
      amount: 99.99,
      billNumber: 'TEST-BILL-1',
    } as Parameters<typeof generateBakongKHQR>[0])
    // Defaults: name BIDHUBKH PROCUREMENT (5920), city Phnom Penh (6010),
    // account bidhubkh@bk (29 150011...), currency USD. CRC16 = BF03.
    expect(result.qrString).toBe(
      '00020101021229150011bidhubkh@bk520457345303840540599.995802KH5920BIDHUBKH PROCUREMENT6010Phnom Penh62150111TEST-BILL-16304BF03'
    )
    expect(result.md5).toBe('104113b76c0dc7948c4cc007b58e0d9a')
    expect(result.currency).toBe('USD')
    expectValidEnvelope(result)
  })
})

describe('generateBakongKHQR — result envelope', () => {
  it('sets a 15-minute expiration window', () => {
    const before = Date.now()
    const result = generateBakongKHQR({
      merchantName: 'X',
      merchantCity: 'Y',
      bakongAccountId: 'z@bk',
      amount: 1,
      currency: 'USD',
      billNumber: 'EXP-1',
    })
    const after = Date.now()
    const expiryMs = new Date(result.expiresAt).getTime()
    expect(expiryMs).toBeGreaterThanOrEqual(before + 15 * 60 * 1000)
    expect(expiryMs).toBeLessThanOrEqual(after + 15 * 60 * 1000)
    expect(() => new Date(result.expiresAt).toISOString()).not.toThrow()
  })

  it('URL-encodes the full KHQR string into the qrserver image URL', () => {
    const result = generateBakongKHQR({
      merchantName: 'Encode Check',
      merchantCity: 'Phnom Penh',
      bakongAccountId: 'enc@aclb',
      amount: 7.25,
      currency: 'USD',
      billNumber: 'SP ACE/1',
    })
    expect(result.qrImageUrl.startsWith(QR_URL_PREFIX)).toBe(true)
    expect(result.qrImageUrl.endsWith('&margin=10')).toBe(true)
    expect(result.qrImageUrl).toContain(encodeURIComponent(result.qrString))
    // decode round-trip proves the data param is lossless
    const url = new URL(result.qrImageUrl)
    expect(url.searchParams.get('data')).toBe(result.qrString)
  })

  it('produces an md5 consistent with its own qrString', () => {
    const result = generateBakongKHQR({
      merchantName: 'MD5 Check',
      merchantCity: 'Siem Reap',
      bakongAccountId: 'md5@wing',
      amount: 42,
      currency: 'USD',
      billNumber: 'MD5-1',
    })
    expect(crypto.createHash('md5').update(result.qrString).digest('hex')).toBe(result.md5)
  })
})
