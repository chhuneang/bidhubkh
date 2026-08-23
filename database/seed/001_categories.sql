-- BidHubKH Seed Data: 001_categories.sql
-- Description: Standard Cambodian procurement taxonomy with Khmer & English labels

INSERT INTO categories (id, slug, name_en, name_km, description, icon, sort_order) VALUES
-- Parent Categories
('c0000000-0000-0000-0000-000000000001', 'it-telecom', 'IT, Computers & Telecom', 'បច្ចេកវិទ្យាព័ត៌មាន និងទូរគមនាគមន៍', 'Hardware, software, cloud infrastructure, networking, and security equipment', 'Laptop', 1),
('c0000000-0000-0000-0000-000000000002', 'construction-civil', 'Construction & Civil Works', 'សំណង់ និងការងារវិស្វកម្មស៊ីវិល', 'Infrastructure, roads, bridges, public buildings, and civil engineering', 'Building2', 2),
('c0000000-0000-0000-0000-000000000003', 'medical-healthcare', 'Medical & Healthcare', 'វេជ្ជសាស្ត្រ និងសុខាភិបាល', 'Medical devices, pharmaceuticals, hospital consumables, and lab equipment', 'Stethoscope', 3),
('c0000000-0000-0000-0000-000000000004', 'consulting-services', 'Consulting & Professional Services', 'សេវាកម្មប្រឹក្សាយោបល់ និងជំនាញ', 'Auditing, technical feasibility studies, management consulting, and advisory', 'Briefcase', 4),
('c0000000-0000-0000-0000-000000000005', 'office-furniture', 'Office Equipment & Furniture', 'សម្ភារៈការិយាល័យ និងគ្រឿងសង្ហារឹម', 'Office supplies, desks, chairs, printing equipment, and stationery', 'Armchair', 5),
('c0000000-0000-0000-0000-000000000006', 'vehicles-transport', 'Vehicles & Transport Equipment', 'យានយន្ត និងឧបករណ៍ដឹកជញ្ជូន', 'Automobiles, heavy machinery, motorbikes, spare parts, and logistics', 'Truck', 6),
('c0000000-0000-0000-0000-000000000007', 'electrical-energy', 'Electrical, Energy & Solar', 'អគ្គិសនី ថាមពល និងពន្លឺព្រះអាទិត្យ', 'Generators, solar systems, power grids, transformers, and cables', 'Zap', 7),
('c0000000-0000-0000-0000-000000000008', 'agriculture-water', 'Agriculture, Irrigation & Water', 'កសិកម្ម ប្រព័ន្ធធារាសាស្ត្រ និងទឹកស្អាត', 'Pumping stations, seeds, fertilizers, water treatment, and irrigation canal works', 'Droplets', 8),
('c0000000-0000-0000-0000-000000000009', 'security-cctv', 'Security, Safety & Surveillance', 'សន្តិសុខ សុវត្ថិភាព និងប្រព័ន្ធកាមេរ៉ា', 'CCTV, fire fighting gear, access control, and physical safety systems', 'ShieldCheck', 9),
('c0000000-0000-0000-0000-000000000010', 'education-training', 'Education & Training Services', 'អប់រំ និងសេវាកម្មបណ្តុះបណ្តាល', 'Curriculum development, vocational training, school materials, and e-learning', 'GraduationCap', 10)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_km = EXCLUDED.name_km,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Subcategories
INSERT INTO categories (id, slug, name_en, name_km, parent_id, description, icon, sort_order) VALUES
('c0000000-0000-0000-0000-000000000011', 'it-hardware', 'Computers, Servers & Laptops', 'កុំព្យូទ័រ ម៉ាស៊ីនបម្រើ និងកុំព្យូទ័រយួរដៃ', 'c0000000-0000-0000-0000-000000000001', 'Desktop PCs, laptops, server racks, printers', 'Monitor', 1),
('c0000000-0000-0000-0000-000000000012', 'it-networking', 'Networking & Telecommunications', 'ប្រព័ន្ធបណ្តាញ និងទូរគមនាគមន៍', 'c0000000-0000-0000-0000-000000000001', 'Routers, switches, optical cables, wireless APs', 'Wifi', 2),
('c0000000-0000-0000-0000-000000000013', 'it-software', 'Software Development & Licensing', 'ការអភិវឌ្ឍន៍កម្មវិធី និងអាជ្ញាប័ណ្ណ', 'c0000000-0000-0000-0000-000000000001', 'Custom ERP, mobile apps, database licenses, web portals', 'Code', 3),
('c0000000-0000-0000-0000-000000000014', 'road-works', 'Roads, Bridges & Pavement', 'ផ្លូវ ស្ពាន និងកម្រាលបេតុង', 'c0000000-0000-0000-0000-000000000002', 'Rural roads, national highways, drainage paving', 'HardHat', 1),
('c0000000-0000-0000-0000-000000000015', 'building-renovation', 'Building Construction & Renovation', 'ការសាងសង់ និងជួសជុលអគារ', 'c0000000-0000-0000-0000-000000000002', 'School buildings, health centers, ministry offices', 'Hammer', 2)
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_km = EXCLUDED.name_km,
    parent_id = EXCLUDED.parent_id,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;
