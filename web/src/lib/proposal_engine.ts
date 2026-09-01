/**
 * BidHubKH — AI Bid Proposal Co-Pilot & Drafting Engine
 * Generates official, structured, and compliant procurement proposals for Cambodian tenders
 * supporting English (EN), Khmer (KM), and Bilingual (Dual) formats.
 */

export type ProposalLanguage = 'en' | 'km' | 'bilingual'

export type ProposalSectionKey =
  | 'cover_letter'
  | 'methodology'
  | 'compliance'
  | 'team_schedule'
  | 'commercial_pricing'

export interface ProposalSection {
  key: ProposalSectionKey
  title: string
  content: string
}

export interface TenderInput {
  id?: string
  title: string
  tender_number?: string | null
  organization_name?: string | null
  source_code?: string | null
  category_name?: string | null
  estimated_amount?: number | null
  currency?: string | null
  submission_deadline?: string | null
  submission_location?: string | null
  ai_summary?: string | null
  bill_of_quantities?: Array<{ item: string; quantity?: string; specifications?: string }> | null
  eligibility_checklist?: Array<{ requirement: string; mandatory?: boolean }> | null
}

export interface CompanyInput {
  business_name?: string | null
  tax_id?: string | null
  registration_number?: string | null
  description?: string | null
  operating_provinces?: string[] | null
  contact_email?: string | null
  contact_phone?: string | null
  products?: Array<{ name: string; category?: string; description?: string }> | null
}

export interface GenerateProposalParams {
  tender: TenderInput
  company?: CompanyInput | null
  language?: ProposalLanguage
  selectedSections?: ProposalSectionKey[]
  customInstructions?: string
}

export interface GeneratedProposal {
  title: string
  language: ProposalLanguage
  recommendedLanguage: ProposalLanguage
  sections: Partial<Record<ProposalSectionKey, ProposalSection>>
  fullMarkdown: string
}

export const ALL_PROPOSAL_SECTIONS: ProposalSectionKey[] = [
  'cover_letter',
  'methodology',
  'compliance',
  'team_schedule',
  'commercial_pricing'
]

/**
 * Recommends language based on source portal and procuring entity type.
 */
export function getRecommendedLanguage(sourceCode?: string): ProposalLanguage {
  if (!sourceCode) return 'en'
  const khmerSources = ['mef_gdipp', 'state_utilities', 'ngo_cambodia']
  if (khmerSources.includes(sourceCode.toLowerCase())) {
    return 'km'
  }
  return 'en'
}

/**
 * Helper to format monetary values cleanly.
 */
function formatCurrencyAmount(amount?: number | null, curr: string = 'USD'): string {
  if (!amount || isNaN(amount)) return 'As per submitted Bill of Quantities (BoQ)'
  if (curr === 'KHR') {
    return `${new Intl.NumberFormat('en-US').format(amount)} KHR (៛)`
  }
  return `$${new Intl.NumberFormat('en-US').format(amount)} USD`
}

/**
 * Helper to format date cleanly.
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'To be confirmed by Procuring Entity'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Main Proposal Generator Function.
 */
export function generateProposal(params: GenerateProposalParams): GeneratedProposal {
  const { tender, company, customInstructions } = params
  const recommendedLang = getRecommendedLanguage(tender.source_code || undefined)
  const lang: ProposalLanguage = params.language || recommendedLang
  const activeSections = params.selectedSections && params.selectedSections.length > 0
    ? params.selectedSections
    : ALL_PROPOSAL_SECTIONS

  const companyName = company?.business_name || '[Company Name / ឈ្មោះក្រុមហ៊ុន]'
  const companyTIN = company?.tax_id || '[GDT Tax TIN / លេខអត្តសញ្ញាណកម្មសារពើពន្ធ]'
  const companyMOC = company?.registration_number || '[MoC Registration No. / លេខចុះបញ្ជីពាណិជ្ជកម្ម]'
  const companyEmail = company?.contact_email || '[Contact Email / អ៊ីមែល]'
  const companyPhone = company?.contact_phone || '[Contact Phone / លេខទូរស័ព្ទ]'
  const companyProvinces = company?.operating_provinces?.join(', ') || 'Kingdom of Cambodia'
  const companyDesc = company?.description || 'Experienced and licensed commercial enterprise operating in Cambodia.'

  const tenderNum = tender.tender_number || tender.id || 'N/A'
  const orgName = tender.organization_name || 'The Procurement Committee'
  const tenderTitle = tender.title
  const deadline = formatDate(tender.submission_deadline)
  const tenderBudget = formatCurrencyAmount(tender.estimated_amount, tender.currency || 'USD')

  const sections: Partial<Record<ProposalSectionKey, ProposalSection>> = {}

  // 1. Cover Letter
  if (activeSections.includes('cover_letter')) {
    sections.cover_letter = {
      key: 'cover_letter',
      title: lang === 'km' ? 'លិខិតដាក់សំណើដេញថ្លៃ (Cover Letter)' : lang === 'bilingual' ? '1. Executive Cover Letter / លិខិតដាក់សំណើដេញថ្លៃ' : '1. Executive Bid Submission Cover Letter',
      content: generateCoverLetter(lang, {
        companyName,
        companyTIN,
        companyMOC,
        companyEmail,
        companyPhone,
        orgName,
        tenderNum,
        tenderTitle,
        deadline,
        customInstructions
      })
    }
  }

  // 2. Technical Methodology
  if (activeSections.includes('methodology')) {
    sections.methodology = {
      key: 'methodology',
      title: lang === 'km' ? 'វិធីសាស្ត្រអនុវត្តបច្ចេកទេស (Technical Methodology)' : lang === 'bilingual' ? '2. Technical Methodology / វិធីសាស្ត្រអនុវត្តបច្ចេកទេស' : '2. Scope of Work & Technical Methodology',
      content: generateMethodology(lang, {
        companyName,
        companyDesc,
        tenderTitle,
        tenderSummary: tender.ai_summary,
        boq: tender.bill_of_quantities,
        companyProducts: company?.products,
        customInstructions
      })
    }
  }

  // 3. Mandatory Compliance Matrix
  if (activeSections.includes('compliance')) {
    sections.compliance = {
      key: 'compliance',
      title: lang === 'km' ? 'តារាងអនុលោមភាពផ្លូវការ (Compliance Matrix)' : lang === 'bilingual' ? '3. Compliance & Eligibility / តារាងអនុលោមភាព' : '3. Mandatory Compliance & Eligibility Matrix',
      content: generateCompliance(lang, {
        companyName,
        companyTIN,
        companyMOC,
        companyProvinces,
        checklist: tender.eligibility_checklist,
        customInstructions
      })
    }
  }

  // 4. Team & Schedule
  if (activeSections.includes('team_schedule')) {
    sections.team_schedule = {
      key: 'team_schedule',
      title: lang === 'km' ? 'កាលវិភាគអនុវត្ត និងធនធានមនុស្ស (Team & Schedule)' : lang === 'bilingual' ? '4. Team & Project Schedule / កាលវិភាគអនុវត្ត' : '4. Project Team & Delivery Schedule',
      content: generateTeamSchedule(lang, {
        companyName,
        deadline,
        tenderTitle,
        customInstructions
      })
    }
  }

  // 5. Commercial Pricing Schedule
  if (activeSections.includes('commercial_pricing')) {
    sections.commercial_pricing = {
      key: 'commercial_pricing',
      title: lang === 'km' ? 'សំណើតម្លៃ និងលក្ខខណ្ឌទូទាត់ (Commercial Pricing)' : lang === 'bilingual' ? '5. Commercial Price Schedule / សំណើតម្លៃ' : '5. Commercial Pricing & Payment Framework',
      content: generateCommercialPricing(lang, {
        companyName,
        tenderBudget,
        currency: tender.currency || 'USD',
        boq: tender.bill_of_quantities,
        customInstructions
      })
    }
  }

  const proposalTitle = lang === 'km'
    ? `សំណើដេញថ្លៃផ្លូវការ — ${tenderTitle}`
    : `Official Bid Proposal — ${tenderTitle}`

  const fullMarkdown = assembleProposalMarkdown(sections, lang)

  return {
    title: proposalTitle,
    language: lang,
    recommendedLanguage: recommendedLang,
    sections,
    fullMarkdown
  }
}

/**
 * 1. Cover Letter Generator
 */
function generateCoverLetter(lang: ProposalLanguage, d: any): string {
  const customBlock = d.customInstructions ? `\n> **Special Note / ចំណាំបន្ថែម**: ${d.customInstructions}\n` : ''

  if (lang === 'km') {
    return `**កាលបរិច្ឆេទ**: ${new Date().toLocaleDateString('km-KH', { day: 'numeric', month: 'long', year: 'numeric' })}

**សូមគោរពជូន**:  
**គណៈកម្មការលទ្ធកម្មលទ្ធកម្មសាធារណៈ / Procurement Committee**  
**${d.orgName}**  
ព្រះរាជាណាចក្រកម្ពុជា

**កម្មវត្ថុ**: សំណើដេញថ្លៃជាផ្លូវការសម្រាប់កញ្ចប់លទ្ធកម្មលេខ **${d.tenderNum}**
**គម្រោង**: **"${d.tenderTitle}"**

តបតាមកម្មវត្ថុខាងលើ ក្រុមហ៊ុន **${d.companyName}** (លេខអត្តសញ្ញាណកម្មសារពើពន្ធ GDT TIN: \`${d.companyTIN}\`, លេខចុះបញ្ជីពាណិជ្ជកម្ម MoC: \`${d.companyMOC}\`) សូមគោរពជម្រាបជូន គណៈកម្មការលទ្ធកម្មជ្រាបថា ក្រុមហ៊ុនយើងខ្ញុំមានកិត្តិយស និងសមត្ថភាពពេញលេញក្នុងការចូលរួមដាក់សំណើដេញថ្លៃសម្រាប់គម្រោងលទ្ធកម្មខាងលើ។

ក្រុមហ៊ុនយើងខ្ញុំបានសិក្សាស្វែងយល់យ៉ាងល្អិតល្អន់អំពីលក្ខខណ្ឌតម្រូវ លក្ខណៈបច្ចេកទេស និងកាលបរិច្ឆេទកំណត់ (${d.deadline}) ហើយសូមបញ្ជាក់អះអាងថា៖
1. **សុពលភាពនៃសំណើ**: សំណើដេញថ្លៃនេះមានសុពលភាពរយៈពេល **៩០ ថ្ងៃ (90 Days)** ចាប់ពីកាលបរិច្ឆេទផុតកំណត់នៃការទទួលសំណើ។
2. **ការធានាគុណភាព**: ទំនិញ សម្ភារៈ និងសេវាកម្មទាំងអស់ដែលផ្គត់ផ្គង់គឺស្របតាមស្តង់ដារគុណភាពខ្ពស់ និងការធានាជាផ្លូវការពីរោងចក្រផលិត។
3. **ការអនុវត្តតាមកាលកំណត់**: ក្រុមហ៊ុនត្រៀមលក្ខណៈរួចរាល់ក្នុងការចល័តធនធាន និងបញ្ចប់ការផ្គត់ផ្គង់ឱ្យបានទាន់ពេលវេលាដែលបានកំណត់។
${customBlock}
អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូម គណៈកម្មការលទ្ធកម្ម មេត្តាទទួល និងពិនិត្យសំណើដេញថ្លៃរបស់ក្រុមហ៊ុនយើងខ្ញុំដោយក្តីអនុគ្រោះ។

សូមមេត្តាទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់អំពីយើងខ្ញុំ។

**តំណាងស្របច្បាប់នៃក្រុមហ៊ុន / Authorized Signature**  
**${d.companyName}**  
អ៊ីមែល: ${d.companyEmail} | ទូរស័ព្ទ: ${d.companyPhone}`
  }

  if (lang === 'bilingual') {
    return `**Date / កាលបរិច្ឆេទ**: ${new Date().toLocaleDateString('en-GB')}  
**To / គោរពជូន**: The Procurement Committee, **${d.orgName}**  
**Tender Notice / លេខសម្គាល់ដេញថ្លៃ**: **${d.tenderNum}**  
**Subject / កម្មវត្ថុ**: Official Bid Submission for **"${d.tenderTitle}"**

---

### English Submission
Dear Members of the Procurement Committee,

We, **${d.companyName}** (GDT TIN: \`${d.companyTIN}\`, MoC Reg: \`${d.companyMOC}\`), hereby submit our official bid proposal for the aforementioned procurement opportunity. Having thoroughly reviewed the bidding documents, specifications, and scope of work, we confirm our full compliance and capability to execute all obligations seamlessly.

- **Bid Validity**: This offer remains firm and binding for a minimum period of **90 calendar days** from the submission deadline (${d.deadline}).
- **Quality & Warranty**: All delivered goods and technical services strictly meet the required technical parameters and manufacturer warranties.
${customBlock}
Sincerely,  
**Authorized Representative**, **${d.companyName}**  
Email: ${d.companyEmail} | Tel: ${d.companyPhone}

---

### សេចក្តីថ្លែងការណ៍ជាភាសាខ្មែរ (Khmer Official Text)
សូមគោរពជូន គណៈកម្មការលទ្ធកម្មនៃ **${d.orgName}**

ក្រុមហ៊ុន **${d.companyName}** សូមគោរពដាក់ជូននូវសំណើដេញថ្លៃសម្រាប់គម្រោង **"${d.tenderTitle}"** (កញ្ចប់លេខ **${d.tenderNum}**). ក្រុមហ៊ុនយើងខ្ញុំសូមធានាអះអាងនូវការផ្គត់ផ្គង់ប្រកបដោយគុណភាពខ្ពស់ និងការអនុវត្តទាន់ពេលវេលាកំណត់។`
  }

  // Default: English
  return `**Date**: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

**To**:  
**The Procurement Committee**  
**${d.orgName}**  
Kingdom of Cambodia

**Subject**: Formal Bid Submission for Tender Package **${d.tenderNum}**  
**Project Title**: **"${d.tenderTitle}"**

Dear Members of the Procurement Committee,

Having examined the official bidding documents and terms of reference for Tender Package **${d.tenderNum}** ("${d.tenderTitle}"), we, the undersigned, representing **${d.companyName}** (GDT TIN: \`${d.companyTIN}\`, MoC Registration: \`${d.companyMOC}\`), offer to execute and complete the required scope in full conformity with the stipulated specifications.

We hereby confirm the following strategic commitments:
1. **Bid Validity**: Our proposal shall remain firm, valid, and legally binding for a period of **90 calendar days** following the bid submission deadline of **${d.deadline}**.
2. **Quality Standards**: All equipment, materials, and services supplied conform strictly to international/national standards and carry direct manufacturer warranties.
3. **Execution Readiness**: We possess the necessary financial capacity, supply chain logistics, and technical staff to mobilize immediately upon contract award.
${customBlock}
Thank you for considering our proposal. We remain available for any clarifications or technical presentations as required.

Respectfully submitted,

_____________________________  
**Authorized Signatory**  
**${d.companyName}**  
Email: ${d.companyEmail} | Phone: ${d.companyPhone}`
}

/**
 * 2. Technical Methodology Generator
 */
function generateMethodology(lang: ProposalLanguage, d: any): string {
  const customBlock = d.customInstructions ? `\n> **Specific Technical Commitment**: ${d.customInstructions}\n` : ''
  
  let boqTable = ''
  if (d.boq && d.boq.length > 0) {
    boqTable = `\n| Item / Description | Target Quantity | Proposed Specification / Brand Compliance |\n| :--- | :--- | :--- |\n`
    d.boq.forEach((b: any, idx: number) => {
      boqTable += `| ${idx + 1}. ${b.item} | ${b.quantity || 'As required'} | ${b.specifications || '100% Compliant with technical specs'} |\n`
    })
  }

  if (lang === 'km') {
    return `### វិធីសាស្ត្រ និងផែនការអនុវត្តបច្ចេកទេស (Technical Approach)

ក្រុមហ៊ុន **${d.companyName}** បានរៀបចំវិធីសាស្ត្រអនុវត្តគម្រោងយ៉ាងហ្មត់ចត់ ដើម្បីធានាបាននូវគុណភាព ការគ្រប់គ្រងហានិភ័យ និងការផ្គត់ផ្គង់ទាន់ពេលវេលាសម្រាប់គម្រោង **"${d.tenderTitle}"**៖

1. **ការផ្គត់ផ្គង់ និងការធានាគុណភាព (Procurement & QA/QC)**:
   - ទំនិញ និងឧបករណ៍ទាំងអស់ត្រូវបាននាំចូលដោយស្របច្បាប់ពីប្រភពរោងចក្រដើមដែលមានវិញ្ញាបនបត្រត្រឹមត្រូវ (Certificate of Origin & Quality CoO/CoQ)។
   - ត្រួតពិនិត្យបច្ចេកទេសយ៉ាងហ្មត់ចត់មុនពេលប្រគល់ជូនអ្នកបញ្ជាទិញ។

2. **តារាងលក្ខណៈបច្ចេកទេសនៃសម្ភារៈ (Technical Compliance Schedule)**:
${boqTable || '- អនុវត្តតាមតារាងបរិមាណ និងលក្ខណៈបច្ចេកទេសនៃឯកសារដេញថ្លៃ។'}

3. **ការដឹកជញ្ជូន និងការដំឡើង (Logistics & Commissioning)**:
   - រៀបចំការដឹកជញ្ជូនប្រកបដោយសុវត្ថិភាពដល់ទីតាំងគម្រោងដែលបានកំណត់។
   - ផ្តល់ការបណ្តុះបណ្តាល និងផ្ទេរចំណេះដឹងបច្ចេកទេសដល់មន្ត្រីជំនាញនៃអង្គភាពលទ្ធកម្ម។
${customBlock}`
  }

  if (lang === 'bilingual') {
    return `### Technical Approach & Execution Plan / វិធីសាស្ត្រអនុវត្តបច្ចេកទេស

**${d.companyName}** proposes a structured, quality-controlled delivery methodology for **"${d.tenderTitle}"**:

#### 1. Technical Scope & Sourcing
- 100% verified authentic genuine hardware and components with direct manufacturer warranties.
- Comprehensive pre-shipment inspection (PSI) and on-site testing protocol.

#### 2. Compliance with Bill of Quantities (BoQ)
${boqTable || '- Full conformance with tender technical specification parameters.'}

#### 3. Support & After-Sales Service
- Dedicated local technical support team based in Cambodia.
- Preventive maintenance and responsive warranty replacement SLA.
${customBlock}`
  }

  // Default: English
  return `### 2.1 Understanding of Project Objectives
The objective of this procurement for **"${d.tenderTitle}"** is to obtain high-reliability, certified supplies and services that achieve maximum performance, durability, and value for public expenditure. **${d.companyName}** has engineered a streamlined implementation methodology tailored to meet all technical requirements.

### 2.2 Technical Scope & Bill of Quantities (BoQ) Alignment
${boqTable || 'All requested deliverables will be supplied in strict conformity with the tender technical specifications.'}

### 2.3 Quality Assurance & Inspection Protocols (QA/QC)
- **Origin Verification**: All goods will be accompanied by authentic Manufacturer Authorization Letters (MAL) and Certificates of Origin (CoO).
- **Factory Testing & Acceptance**: Strict pre-delivery testing to ensure zero defect rates upon delivery.
- **On-Site Commissioning**: Structured setup, configuration, and handover testing conducted in the presence of the designated inspection committee.

### 2.4 Warranty & Local Maintenance Service
- **Standard Warranty**: Comprehensive manufacturer warranty covering parts and labor.
- **Local Service Level Agreement (SLA)**: Immediate response within 4 hours during working days with certified local technicians.
${customBlock}`
}

/**
 * 3. Compliance Matrix Generator
 */
function generateCompliance(lang: ProposalLanguage, d: any): string {
  let checklistTable = `\n| Mandatory Eligibility Criteria | Verification Document Attached | Compliance Status |\n| :--- | :--- | :--- |\n`
  
  if (d.checklist && d.checklist.length > 0) {
    d.checklist.forEach((c: any) => {
      checklistTable += `| ${c.requirement} | Official certified copy attached | 🟢 **COMPLIANT** |\n`
    })
  } else {
    checklistTable += `| GDT Tax Clearance Certificate (2025/2026) | Certified Tax Compliance Document | 🟢 **COMPLIANT** |\n`
    checklistTable += `| Ministry of Commerce Business Registration | MoC Certificate & Patent No. ${d.companyMOC} | 🟢 **COMPLIANT** |\n`
    checklistTable += `| Value Added Tax (VAT) Registration | GDT VAT TIN No. ${d.companyTIN} | 🟢 **COMPLIANT** |\n`
    checklistTable += `| Proven Track Record & Similar Experience | Reference Contracts & Completion Certificates | 🟢 **COMPLIANT** |\n`
  }

  if (lang === 'km') {
    return `### តារាងបញ្ជាក់អនុលោមភាព និងលក្ខខណ្ឌតម្រូវ (Compliance Matrix)

ក្រុមហ៊ុន **${d.companyName}** សូមបញ្ជាក់អះអាងនូវការបំពេញគ្រប់លក្ខខណ្ឌតម្រូវផ្លូវច្បាប់ និងបច្ចេកទេសទាំងអស់ដូចខាងក្រោម៖

${checklistTable}

**សេចក្តីប្រកាសអះអាងផ្លូវការ**:
- ក្រុមហ៊ុនមិនជាប់ក្នុងបញ្ជីខ្មៅ (Debarment List) នៃរាជរដ្ឋាភិបាលកម្ពុជា ធនាគារពិភពលោក (World Bank) ធនាគារអភិវឌ្ឍន៍អាស៊ី (ADB) ឬអង្គការសហប្រជាជាតិ (UN) ឡើយ។
- ក្រុមហ៊ុនបានបំពេញកាតព្វកិច្ចពន្ធដារ និងច្បាប់ការងារត្រឹមត្រូវតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។`
  }

  return `### 3.1 Eligibility & Regulatory Compliance Statement
**${d.companyName}** certifies that it is a duly registered and legally solvent corporate entity in the Kingdom of Cambodia, holding all requisite licenses, tax registrations, and technical authorizations.

${checklistTable}

### 3.2 Non-Debarment & Anti-Corruption Declaration
We hereby solemnly declare that:
1. **No Conflict of Interest**: Neither the company nor any of its key personnel have any conflict of interest with the procuring entity or its advisors.
2. **Debarment Free**: The company is not suspended or blacklisted by the Government of Cambodia, World Bank, ADB, JICA, AFD, or UN procurement authorities.
3. **Ethical Procurement**: Our bid has been independently priced without any collusion or anti-competitive practices.`
}

/**
 * 4. Team & Schedule Generator
 */
function generateTeamSchedule(lang: ProposalLanguage, d: any): string {
  if (lang === 'km') {
    return `### កាលវិភាគអនុវត្ត និងសមាសភាពក្រុមការងារ (Team & Schedule)

#### 1. សមាសភាពក្រុមការងារស្នូល (Key Personnel)
- **ប្រធានគ្រប់គ្រងគម្រោង (Project Director / Lead)**: បទពិសោធន៍ជាង ៨ ឆ្នាំ ក្នុងការគ្រប់គ្រងការផ្គត់ផ្គង់ និងការអនុវត្តគម្រោងលទ្ធកម្ម។
- **វិស្វករបច្ចេកទេសជាន់ខ្ពស់ (Senior Technical Specialist)**: ទទួលខុសត្រូវលើការដំឡើង ត្រួតពិនិត្យបច្ចេកទេស និងតេស្តប្រព័ន្ធ។
- **មន្ត្រីធានាគុណភាព (QA/QC Officer)**: ត្រួតពិនិត្យស្តង់ដារ និងរៀបចំឯកសារប្រគល់-ទទួល។

#### 2. កាលវិភាគអនុវត្តការងារ (Work Plan Milestones)
- **សប្តាហ៍ទី ១**: ចុះហត្ថលេខាលើកិច្ចសន្យា និងបញ្ជាក់ការបញ្ជាទិញរោងចក្រ (Kick-off & Order Confirmation)
- **សប្តាហ៍ទី ២-៤**: ដំណើរការដឹកជញ្ជូន និងការត្រួតពិនិត្យគុណភាពមុនការនាំចូល (Logistics & Customs Clearance)
- **សប្តាហ៍ទី ៥**: ការដឹកជញ្ជូនដល់ទីតាំង ការដំឡើង និងការតេស្តសាកល្បង (Delivery & Setup)
- **សប្តាហ៍ទី ៦**: ការផ្ទៀងផ្ទាត់ផ្លូវការ និងការប្រគល់-ទទួលបញ្ចប់ (Final Handover & Sign-off)`
  }

  return `### 4.1 Project Organization & Key Personnel
To ensure seamless execution, **${d.companyName}** will mobilize an experienced project management and technical delivery team:

| Role / Position | Qualifications | Key Responsibilities |
| :--- | :--- | :--- |
| **Project Lead** | PMP / 8+ Years Experience | Overall contract governance, reporting, and ministry liaison |
| **Lead Technical Specialist** | Certified Systems Engineer | Hardware configuration, testing, and technical commissioning |
| **Logistics & QA Lead** | Supply Chain Manager | Import clearance, transport safety, and inventory management |

### 4.2 Work Breakdown Schedule & Delivery Milestones
- **Milestone 1 (Week 1)**: Contract finalization, detailed work plan approval, and supplier mobilization.
- **Milestone 2 (Weeks 2–4)**: Factory shipment, freight forwarding, and local customs clearance.
- **Milestone 3 (Week 5)**: Physical delivery to designated sites, unpacking, assembly, and inspection.
- **Milestone 4 (Week 6)**: Final user acceptance testing (UAT), training handover, and formal completion certificate.`
}

/**
 * 5. Commercial Pricing Schedule Generator
 */
function generateCommercialPricing(lang: ProposalLanguage, d: any): string {
  const customBlock = d.customInstructions ? `\n> **Commercial Terms Note**: ${d.customInstructions}\n` : ''

  if (lang === 'km') {
    return `### សំណើតម្លៃ និងលក្ខខណ្ឌទូទាត់ (Commercial Pricing Framework)

#### 1. រចនាសម្ព័ន្ធតម្លៃ (Pricing Structure)
- តម្លៃដែលបានស្នើខាងលើគឺជា **តម្លៃសរុបរួមបញ្ចូលទាំងពន្ធអាករ (All-Inclusive Price including VAT/Taxes, Shipping & Insurance)**។
- រូបិយប័ណ្ណគិតជា: **${d.currency}**។

#### 2. លក្ខខណ្ឌនៃការទូទាត់ដែលស្នើ (Proposed Payment Terms)
- **ដំណាក់កាលទី ១ (30%)**: ការទូទាត់មុន (Advance Payment) បន្ទាប់ពីការចុះកិច្ចសន្យា និងការដាក់លិខិតធានា។
- **ដំណាក់កាលទី ២ (60%)**: ការទូទាត់បន្ទាប់ពីការដឹកជញ្ជូន និងការដំឡើងទំនិញដល់ទីតាំងពេញលេញ។
- **ដំណាក់កាលទី ៣ (10%)**: ការទូទាត់ចុងក្រោយបន្ទាប់ពីការចេញលិខិតទទួលស្គាល់ការបញ្ចប់ជាផ្លូវការ (Final Acceptance Certificate)។
${customBlock}`
  }

  return `### 5.1 Commercial Terms & Total Bid Price
All pricing provided is fixed, firm, and all-inclusive of delivery, insurance, customs clearance, import tariffs, and applicable **Value Added Tax (VAT)** in Cambodia.

- **Contract Currency**: **${d.currency}**
- **Price Escalation**: Zero escalation; prices remain fixed throughout the contract duration.

### 5.2 Proposed Milestone Payment Schedule
1. **Advance Mobilization (20–30%)**: Against submission of acceptable Advance Payment Bank Guarantee.
2. **Delivery & Inspection (60%)**: Upon verified delivery and inspection report at designated sites.
3. **Final Acceptance & Retention (10%)**: Upon issuance of formal Final Handover Certificate.
${customBlock}`
}

/**
 * Assembles all sections into a single cohesive Markdown document.
 */
export function assembleProposalMarkdown(
  sections: Partial<Record<ProposalSectionKey, ProposalSection>>,
  language: ProposalLanguage
): string {
  const parts: string[] = []

  parts.push(`# Bid Proposal Dossier`)
  parts.push(`*Generated by BidHubKH AI Proposal Co-Pilot | Language: ${language.toUpperCase()}*\n`)
  parts.push(`---\n`)

  const order: ProposalSectionKey[] = ['cover_letter', 'methodology', 'compliance', 'team_schedule', 'commercial_pricing']

  for (const key of order) {
    const sec = sections[key]
    if (sec) {
      parts.push(`## ${sec.title}\n`)
      parts.push(sec.content)
      parts.push(`\n---\n`)
    }
  }

  return parts.join('\n')
}
