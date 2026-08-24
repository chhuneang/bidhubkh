-- BidHubKH Seed Data: 002_sources.sql
-- Description: Registry of official tender sources and major procurement organizations in Cambodia

-- 1. Initial Sources (Deterministic UUID prefix 10000000-...)
INSERT INTO sources (id, code, name, website_url, source_type, access_method, active, auto_approve, check_frequency_hours, metadata) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'world_bank_kh',
    'World Bank Cambodia Procurement',
    'https://projects.worldbank.org/en/projects-operations/procurement-notices?countrycode_exact=KH',
    'development_bank',
    'api',
    true,
    true,
    12,
    '{"api_endpoint": "https://search.worldbank.org/api/v2/procnotices", "country_code": "KH"}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000002',
    'adb_kh',
    'Asian Development Bank (ADB) Cambodia',
    'https://www.adb.org/projects/tenders/country/cam',
    'development_bank',
    'api',
    true,
    true,
    12,
    '{"country_code": "CAM"}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000003',
    'mef_gdipp',
    'General Department of Public Procurement (MEF)',
    'https://gdpp.mef.gov.kh',
    'government',
    'html_scraper',
    true,
    true,
    24,
    '{"language": "km"}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000004',
    'ungm',
    'UN Global Marketplace (UNGM) Cambodia',
    'https://www.ungm.org/Public/Notice',
    'ngo',
    'api',
    true,
    true,
    24,
    '{"country": "Cambodia"}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000005',
    'ngo_cambodia',
    'Cambodia NGO & Civil Society Development Portals',
    'https://reliefweb.int/country/khm',
    'ngo',
    'html_scraper',
    true,
    true,
    24,
    '{"country": "Cambodia"}'::jsonb
),
(
    '10000000-0000-0000-0000-000000000006',
    'state_utilities',
    'Cambodian State-Owned Enterprises & Utilities (EDC / PPWSA)',
    'https://www.edc.com.kh',
    'government',
    'html_scraper',
    true,
    true,
    24,
    '{"country": "Cambodia"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    source_type = EXCLUDED.source_type,
    access_method = EXCLUDED.access_method,
    active = EXCLUDED.active,
    auto_approve = EXCLUDED.auto_approve,
    metadata = EXCLUDED.metadata;

-- 2. Official Cambodian Key Organizations (Deterministic UUID prefix 20000000-...)
INSERT INTO organizations (id, slug, name_en, name_km, org_type, website_url, address) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'world-bank-cambodia',
    'The World Bank Cambodia Country Office',
    'ធនាគារពិភពលោកប្រចាំកម្ពុជា',
    'multilateral_bank',
    'https://www.worldbank.org/en/country/cambodia',
    'Exchange Square Building, 10th Floor, No. 19-20, Street 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000002',
    'adb-cambodia',
    'Asian Development Bank Cambodia Resident Mission',
    'ធនាគារអភិវឌ្ឍន៍អាស៊ី ប្រចាំកម្ពុជា',
    'multilateral_bank',
    'https://www.adb.org/countries/cambodia/main',
    'No. 29, Suramarit Blvd. (St. 268), Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000003',
    'mef',
    'Ministry of Economy and Finance (MEF)',
    'ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ',
    'ministry',
    'https://mef.gov.kh',
    'Street 92, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000004',
    'mptc',
    'Ministry of Post and Telecommunications (MPTC)',
    'ក្រសួងប្រៃសណីយ៍ និងទូរគមនាគមន៍',
    'ministry',
    'https://mptc.gov.kh',
    'Building 13, Monivong Blvd, Srah Chork, Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000005',
    'moeys',
    'Ministry of Education, Youth and Sport (MoEYS)',
    'ក្រសួងអប់រំ យុវជន និងកីឡា',
    'ministry',
    'http://www.moeys.gov.kh',
    '# 80, Norodom Blvd., Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000006',
    'moh',
    'Ministry of Health (MoH)',
    'ក្រសួងសុខាភិបាល',
    'ministry',
    'http://moh.gov.kh',
    '# 80, Samdech Penn Nouth Blvd (289), Sangkat Boeung Kak 2, Khan Tuol Kork, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000007',
    'mpwt',
    'Ministry of Public Works and Transport (MPWT)',
    'ក្រសួងសាធារណការ និងដឹកជញ្ជូន',
    'ministry',
    'https://www.mpwt.gov.kh',
    'Corner Norodom Blvd & St. 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000008',
    'edc',
    'Electricité du Cambodge (EDC)',
    'អគ្គិសនីកម្ពុជា',
    'state_enterprise',
    'https://www.edc.com.kh',
    'No. 19, Wat Phnom, Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000009',
    'ppwsa',
    'Phnom Penh Water Supply Authority (PPWSA)',
    'រដ្ឋាករទឹកស្វយ័តក្រុងភ្នំពេញ',
    'state_enterprise',
    'https://www.ppwsa.com.kh',
    'No. 45, St. 106, Sangkat Srah Chork, Khan Daun Penh, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000010',
    'unicef-cambodia',
    'UNICEF Cambodia',
    'យូនីសេហ្វ ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.unicef.org/cambodia',
    'Exchange Square, 5th Floor, St. 106, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000011',
    'undp-cambodia',
    'UNDP Cambodia',
    'កម្មវិធីអភិវឌ្ឍន៍សហប្រជាជាតិ ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.undp.org/cambodia',
    'No. 53, Pasteur Street, Boeung Keng Kang 1, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000012',
    'who-cambodia',
    'World Health Organization (WHO) Cambodia',
    'អង្គការសុខភាពពិភពលោក ប្រចាំកម្ពុជា',
    'un_agency',
    'https://www.who.int/cambodia',
    'No. 61-64, Preah Norodom Blvd, Phnom Penh'
),
(
    '20000000-0000-0000-0000-000000000013',
    'room-to-read',
    'Room to Read Cambodia',
    'អង្គការ រូម ធូ រីដ កម្ពុជា',
    'ngo',
    'https://www.roomtoread.org',
    'Phnom Penh, Cambodia'
),
(
    '20000000-0000-0000-0000-000000000014',
    'wateraid-cambodia',
    'WaterAid Cambodia',
    'អង្គការ វ៉ាត់ធឺអេត កម្ពុជា',
    'ngo',
    'https://www.wateraid.org/kh',
    'Phnom Penh, Cambodia'
)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_km = EXCLUDED.name_km,
    org_type = EXCLUDED.org_type,
    website_url = EXCLUDED.website_url,
    address = EXCLUDED.address;
