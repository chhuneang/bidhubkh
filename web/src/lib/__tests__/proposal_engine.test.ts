import { describe, it, expect } from 'vitest'
import {
  generateProposal,
  getRecommendedLanguage,
  assembleProposalMarkdown,
  type GenerateProposalParams,
  type ProposalLanguage,
  type ProposalSectionKey
} from '../proposal_engine'

describe('AI Bid Proposal Co-Pilot Engine', () => {
  const mockTender = {
    id: 't-101',
    title: 'Procurement of 450 High-Performance Laptops and IT Infrastructure',
    tender_number: 'WB-KH-2026-0891',
    organization_name: 'Ministry of Education, Youth and Sport (MoEYS)',
    source_code: 'world_bank_kh',
    category_name: 'IT, Software & Hardware',
    estimated_amount: 320000,
    currency: 'USD',
    submission_deadline: '2026-09-30T17:00:00Z',
    submission_location: 'MoEYS Procurement Office, #80 Norodom Blvd, Phnom Penh',
    ai_summary: 'Procurement of modern laptops and network infrastructure for higher education institutions.',
    bill_of_quantities: [
      { item: 'High-Performance Laptops', quantity: '450 units', specifications: 'Intel Core i7 / 16GB RAM / 512GB SSD' },
      { item: 'Managed Gigabit Switches', quantity: '20 units', specifications: '24-Port PoE+ Managed Switch' }
    ],
    eligibility_checklist: [
      { requirement: 'Valid GDT Tax Clearance Certificate for 2025/2026', mandatory: true },
      { requirement: 'Ministry of Commerce Business Registration Certificate', mandatory: true },
      { requirement: 'Minimum 3 years proven experience in enterprise IT supply', mandatory: true }
    ]
  }

  const mockCompany = {
    business_name: 'Angkor Tech Solutions Co., Ltd.',
    tax_id: 'K009-887654321',
    registration_number: 'MOC-REG-2021-9988',
    description: 'Leading Cambodian IT infrastructure and enterprise hardware distributor.',
    operating_provinces: ['Phnom Penh', 'Siem Reap', 'Battambang'],
    contact_email: 'bids@angkortech.kh',
    contact_phone: '+855 23 888 999',
    products: [
      { name: 'Enterprise Laptop Core i7', category: 'IT Hardware', description: 'Certified commercial laptops with 3-year warranty' },
      { name: 'Cisco PoE Switches', category: 'Networking', description: 'Enterprise-grade 24-port PoE+ network switches' }
    ]
  }

  describe('getRecommendedLanguage()', () => {
    it('recommends Khmer for MEF and State Utilities', () => {
      expect(getRecommendedLanguage('mef_gdipp')).toBe('km')
      expect(getRecommendedLanguage('state_utilities')).toBe('km')
    })

    it('recommends English for Multilateral Development Partners', () => {
      expect(getRecommendedLanguage('world_bank_kh')).toBe('en')
      expect(getRecommendedLanguage('adb_kh')).toBe('en')
      expect(getRecommendedLanguage('ungm')).toBe('en')
      expect(getRecommendedLanguage('jica_kh')).toBe('en')
      expect(getRecommendedLanguage('afd_eu_kh')).toBe('en')
    })

    it('defaults to English when source code is unknown or empty', () => {
      expect(getRecommendedLanguage(undefined)).toBe('en')
      expect(getRecommendedLanguage('unknown_src')).toBe('en')
    })
  })

  describe('generateProposal() — English Generation', () => {
    it('generates all 5 standard sections in English', () => {
      const result = generateProposal({
        tender: mockTender,
        company: mockCompany,
        language: 'en'
      })

      expect(result.title).toContain('Bid Proposal')
      expect(result.language).toBe('en')
      expect(result.recommendedLanguage).toBe('en')

      // Check all 5 sections exist
      expect(result.sections.cover_letter).toBeDefined()
      expect(result.sections.methodology).toBeDefined()
      expect(result.sections.compliance).toBeDefined()
      expect(result.sections.team_schedule).toBeDefined()
      expect(result.sections.commercial_pricing).toBeDefined()

      // Content assertions
      expect(result.sections.cover_letter?.content).toContain('Angkor Tech Solutions Co., Ltd.')
      expect(result.sections.cover_letter?.content).toContain('Ministry of Education, Youth and Sport')
      expect(result.sections.cover_letter?.content).toContain('WB-KH-2026-0891')
      expect(result.sections.cover_letter?.content).toContain('K009-887654321')

      expect(result.sections.methodology?.content).toContain('450 High-Performance Laptops')
      expect(result.sections.compliance?.content).toContain('GDT Tax Clearance Certificate')
      expect(result.sections.team_schedule?.content).toContain('Milestone')
      expect(result.sections.commercial_pricing?.content).toContain('USD')
    })

    it('generates only requested subset of sections when specified', () => {
      const selected: ProposalSectionKey[] = ['cover_letter', 'compliance']
      const result = generateProposal({
        tender: mockTender,
        company: mockCompany,
        language: 'en',
        selectedSections: selected
      })

      expect(result.sections.cover_letter).toBeDefined()
      expect(result.sections.compliance).toBeDefined()
      expect(result.sections.methodology).toBeUndefined()
      expect(result.sections.team_schedule).toBeUndefined()
      expect(result.sections.commercial_pricing).toBeUndefined()
    })
  })

  describe('generateProposal() — Khmer Generation', () => {
    it('generates authentic formal Khmer proposal with official procurement salutations', () => {
      const result = generateProposal({
        tender: { ...mockTender, source_code: 'mef_gdipp' },
        company: mockCompany,
        language: 'km'
      })

      expect(result.language).toBe('km')
      expect(result.sections.cover_letter?.content).toContain('សូមគោរពជូន')
      expect(result.sections.cover_letter?.content).toContain('ក្រុមហ៊ុន')
      expect(result.sections.cover_letter?.content).toContain('Angkor Tech Solutions Co., Ltd.')
      expect(result.sections.methodology?.content).toContain('វិធីសាស្ត្រអនុវត្តគម្រោង')
      expect(result.sections.compliance?.content).toContain('អនុលោមភាព')
    })
  })

  describe('generateProposal() — Bilingual Dual Output', () => {
    it('generates bilingual sections with both English and Khmer text blocks', () => {
      const result = generateProposal({
        tender: mockTender,
        company: mockCompany,
        language: 'bilingual'
      })

      expect(result.language).toBe('bilingual')
      expect(result.sections.cover_letter?.title).toContain('លិខិតដាក់សំណើដេញថ្លៃ')
      expect(result.sections.cover_letter?.content).toContain('Official Bid Submission')
      expect(result.sections.cover_letter?.content).toContain('សេចក្តីថ្លែងការណ៍ជាភាសាខ្មែរ')
      expect(result.sections.methodology?.content).toContain('Technical Approach')
      expect(result.sections.methodology?.content).toContain('វិធីសាស្ត្រអនុវត្តបច្ចេកទេស')
    })
  })

  describe('generateProposal() — Edge Cases & Fallbacks', () => {
    it('handles null company gracefully with standard placeholders', () => {
      const result = generateProposal({
        tender: mockTender,
        company: null,
        language: 'en'
      })

      expect(result.sections.cover_letter?.content).toContain('[Company Name / ឈ្មោះក្រុមហ៊ុន]')
      expect(result.sections.cover_letter?.content).toContain('WB-KH-2026-0891')
    })

    it('injects custom instructions into the methodology and cover letter', () => {
      const result = generateProposal({
        tender: mockTender,
        company: mockCompany,
        language: 'en',
        customInstructions: 'Include 3 years on-site 24/7 SLA and expedited 14-day air freight delivery.'
      })

      expect(result.sections.methodology?.content).toContain('3 years on-site 24/7 SLA')
      expect(result.sections.methodology?.content).toContain('14-day air freight delivery')
    })
  })

  describe('assembleProposalMarkdown()', () => {
    it('combines generated sections into a cohesive markdown dossier', () => {
      const result = generateProposal({
        tender: mockTender,
        company: mockCompany,
        language: 'en'
      })

      const markdown = assembleProposalMarkdown(result.sections, 'en')
      expect(markdown).toContain('# Bid Proposal Dossier')
      expect(markdown).toContain('## 1. Executive Bid Submission Cover Letter')
      expect(markdown).toContain('## 2. Scope of Work & Technical Methodology')
      expect(markdown).toContain('## 3. Mandatory Compliance & Eligibility Matrix')
    })
  })
})
