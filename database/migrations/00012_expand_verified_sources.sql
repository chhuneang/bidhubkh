-- Migration: 00012_expand_verified_sources.sql
-- Description: Expand verified procurement sources and organizations to include
-- JICA Cambodia (Japan International Cooperation Agency) and AFD / European Union (EU) Cambodia.

-- 1. Insert New Verified Sources
INSERT INTO public.sources (
  code,
  name,
  website_url,
  source_type,
  access_method,
  active,
  check_frequency_hours,
  auto_approve,
  parser_version
) VALUES
  (
    'jica_kh',
    'Japan International Cooperation Agency (JICA) Cambodia',
    'https://www.jica.go.jp/english/our_work/types_of_assistance/oda_loans/oda_op_info/cambodia/index.html',
    'development_bank',
    'api',
    true,
    6,
    true,
    '1.0.0'
  ),
  (
    'afd_eu_kh',
    'Agence Française de Développement (AFD) & European Union (EU) Cambodia',
    'https://www.afd.fr/en/page-thematique-axe/procurement-notices',
    'development_bank',
    'api',
    true,
    6,
    true,
    '1.0.0'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  website_url = EXCLUDED.website_url,
  source_type = EXCLUDED.source_type,
  active = EXCLUDED.active,
  auto_approve = EXCLUDED.auto_approve;

-- 2. Insert New Procuring Organizations
INSERT INTO public.organizations (
  name_en,
  name_km,
  slug,
  website_url,
  org_type
) VALUES
  (
    'Japan International Cooperation Agency (JICA) Cambodia Office',
    'ទីភ្នាក់ងារសហប្រតិបត្តិការអន្តរជាតិនៃប្រទេសជប៉ុន (JICA)',
    'jica-cambodia',
    'https://www.jica.go.jp/cambodia/english/index.html',
    'development_bank'
  ),
  (
    'Agence Française de Développement (AFD) Cambodia',
    'ទីភ្នាក់ងារបារាំងសម្រាប់ការអភិវឌ្ឍន៍ (AFD)',
    'afd-cambodia',
    'https://www.afd.fr/en/page-region-pays/cambodia',
    'development_bank'
  ),
  (
    'Delegation of the European Union to the Kingdom of Cambodia',
    'គណៈប្រតិភូសហភាពអឺរ៉ុបប្រចាំព្រះរាជាណាចក្រកម្ពុជា',
    'eu-delegation-cambodia',
    'https://www.eeas.europa.eu/cambodia_en',
    'development_bank'
  )
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_km = EXCLUDED.name_km,
  website_url = EXCLUDED.website_url,
  org_type = EXCLUDED.org_type;
