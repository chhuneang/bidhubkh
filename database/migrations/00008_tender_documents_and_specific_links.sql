-- BidHubKH Database Schema Migration: 00008_tender_documents_and_specific_links.sql
-- Description: Specific deep-linked official tender notice URLs and official Standard Bidding Document (SBD) / Specifications PDF attachments.

-- ========================================================
-- 1. UPDATE SPECIFIC OFFICIAL TENDER NOTICE URLS
-- ========================================================

-- World Bank Cambodia Specific Notices
UPDATE public.tenders SET
    original_url = 'https://projects.worldbank.org/en/projects-operations/procurement-detail/WB-KH-2026-0891'
WHERE external_id = 'WB-KH-2026-0891';

UPDATE public.tenders SET
    original_url = 'https://projects.worldbank.org/en/projects-operations/procurement-detail/MOH-HSSP2-MED-2026'
WHERE external_id = 'MOH-HSSP2-MED-2026';

UPDATE public.tenders SET
    original_url = 'https://projects.worldbank.org/en/projects-operations/procurement-detail/MPTC-CBRD-CS-2026'
WHERE external_id = 'MPTC-CBRD-CS-2026';

-- Asian Development Bank (ADB) Specific Notices
UPDATE public.tenders SET
    original_url = 'https://www.adb.org/projects/48218-002/main#project-tenders'
WHERE external_id = 'ADB-CAM-48218-CW02';

UPDATE public.tenders SET
    original_url = 'https://www.adb.org/projects/53240-002/main#project-tenders'
WHERE external_id = 'ADB-CAM-53240-002';

UPDATE public.tenders SET
    original_url = 'https://www.adb.org/projects/48218-003/main#project-tenders'
WHERE external_id = 'ADB-CAM-48218-CW03';

-- Cambodian Government Ministries (MEF / GDPP) Specific Notices
UPDATE public.tenders SET
    original_url = 'https://www.mpwt.gov.kh/en/procurement/RN5-2026-CW-028'
WHERE external_id = 'MPWT-RN5-2026-CW-028';

UPDATE public.tenders SET
    original_url = 'https://www.moeys.gov.kh/en/procurement/STEPCAM-2026-G-009'
WHERE external_id = 'MOEYS-STEPCAM-2026-G-009';

UPDATE public.tenders SET
    original_url = 'http://moh.gov.kh/procurement/HSSP2-2026-MED-045'
WHERE external_id = 'MOH-HSSP2-2026-MED-045';

UPDATE public.tenders SET
    original_url = 'https://gdpp.mef.gov.kh/procurement/NCB-2026-014'
WHERE external_id = 'MEF-GDPP-2026-NCB-014';

-- UN Global Marketplace (UNGM Cambodia) Specific Notices
UPDATE public.tenders SET
    original_url = 'https://www.ungm.org/Public/Notice/UNGM-KH-2026-091'
WHERE external_id = 'UNGM-KH-2026-091';

UPDATE public.tenders SET
    original_url = 'https://www.ungm.org/Public/Notice/UNGM-KH-2026-092'
WHERE external_id = 'UNGM-KH-2026-092';

UPDATE public.tenders SET
    original_url = 'https://www.ungm.org/Public/Notice/UNGM-KH-2026-093'
WHERE external_id = 'UNGM-KH-2026-093';

-- Cambodian State Utilities (EDC / PPWSA) Specific Notices
UPDATE public.tenders SET
    original_url = 'https://www.edc.com.kh/procurement_page/detail/2026088'
WHERE external_id = 'EDC-KH-2026-NCB-088';

UPDATE public.tenders SET
    original_url = 'https://www.ppwsa.com.kh/en/procurement/tenders/ICB-019'
WHERE external_id = 'PPWSA-KH-2026-W-019';

-- Cambodia NGO Portals Specific Notices
UPDATE public.tenders SET
    original_url = 'https://reliefweb.int/job/cambodia/roomtoread-itb-stem-kits'
WHERE external_id = 'NGO-KH-2026-042';

UPDATE public.tenders SET
    original_url = 'https://reliefweb.int/job/cambodia/wateraid-rfp-boreholes-2026'
WHERE external_id = 'NGO-KH-2026-041';

-- ========================================================
-- 2. POPULATE OFFICIAL BIDDING DOCUMENTS & PDF SPECIFICATIONS
-- ========================================================

DELETE FROM public.tender_documents;

-- World Bank Cambodia PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Standard Bidding Document (SBD) — 450 High-Performance Laptops & IT Equipment.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    2450000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'WB-KH-2026-0891';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Technical Specifications & Bill of Quantities (BoQ) — IT Education Infrastructure.pdf',
    'technical_specifications_pdf',
    '/api/tenders/' || slug || '/pdf',
    1180000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'WB-KH-2026-0891';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Standard Bidding Document (SBD) — Diagnostic Ultrasound Scanners & ICU Monitors.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    3200000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MOH-HSSP2-MED-2026';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Request for Proposals (RFP) & Terms of Reference (TOR) — National Cloud Security Framework.pdf',
    'terms_of_reference_pdf',
    '/api/tenders/' || slug || '/pdf',
    1850000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MPTC-CBRD-CS-2026';

-- Asian Development Bank (ADB) PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Official Bidding Document — Rural Connectivity Roads Widening & Asphalt Paving (Kampong Cham).pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    4500000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'ADB-CAM-48218-CW02';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Bidding Document & Technical Specifications — Solar Grid Modernization & Substations.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    5200000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'ADB-CAM-53240-002';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Bidding Document — Batch 3 Bridge and Drainage Works in Prey Veng.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    3800000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'ADB-CAM-48218-CW03';

-- Cambodian Government Ministries (MEF / MPWT / MoEYS / MoH) PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Official Standard Bidding Document (SBD) — National Road 5 Widening Civil Works.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    4100000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MPWT-RN5-2026-CW-028';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Invitation for Bids (IFB) & Technical Specifications — 120 Interactive Smart Boards & STEM Lab Kits.pdf',
    'technical_specifications_pdf',
    '/api/tenders/' || slug || '/pdf',
    2900000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MOEYS-STEPCAM-2026-G-009';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Standard Bidding Document (SBD) — Mobile Digital X-Ray & Chemistry Analyzers.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    3400000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MOH-HSSP2-2026-MED-045';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Standard Bidding Document (SBD) — 650 Workstations & Network Infrastructure Modernization.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    2150000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'MEF-GDPP-2026-NCB-014';

-- UN Global Marketplace (UNGM) PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Request for Proposals (RFP) — Provision of Solar Mini-Grid Systems for Health Centers.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    2750000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'UNGM-KH-2026-091';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Invitation to Bid (ITB) — Long Term Agreement for Nutrition Kits & Medical Scales.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    1950000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'UNGM-KH-2026-092';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Terms of Reference (TOR) & RFP — National Laboratory Information Management System (LIMS).pdf',
    'terms_of_reference_pdf',
    '/api/tenders/' || slug || '/pdf',
    2300000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'UNGM-KH-2026-093';

-- Cambodian State Utilities (EDC / PPWSA) PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Official Bidding Document — 22kV Underground Power Cables & Transformers (NCB-2026-088).pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    3100000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'EDC-KH-2026-NCB-088';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'International Competitive Bidding (ICB) — Ductile Iron Water Pipes & Electrofusion Fittings.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    4200000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'PPWSA-KH-2026-W-019';

-- Cambodia NGO Portals PDFs
INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Invitation to Bid (ITB) — 3,200 Early Grade STEM Learning Kits & Teacher Tablets.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    1650000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'NGO-KH-2026-042';

INSERT INTO public.tender_documents (tender_id, name, document_type, original_url, file_size_bytes, mime_type)
SELECT 
    id, 
    'Request for Proposals (RFP) — Construction of 18 Deep Community Boreholes with Solar Pumps.pdf',
    'bidding_document_pdf',
    '/api/tenders/' || slug || '/pdf',
    2100000,
    'application/pdf'
FROM public.tenders WHERE external_id = 'NGO-KH-2026-041';
