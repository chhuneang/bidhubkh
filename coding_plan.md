# BidHubKH — Coding Plan

## 1. Objective

Build BidHubKH as a production-ready web platform that aggregates Cambodian tender opportunities and eventually provides AI-powered tender intelligence.

The coding strategy should prioritize:

1. Reliable data ingestion
2. Clean tender database
3. Search and discovery
4. Admin control
5. AI processing
6. User personalization
7. Monetization

Do not build advanced features before the core tender pipeline works.

---

# 2. Technology Stack

## Frontend

* Next.js
* TypeScript
* App Router
* Tailwind CSS
* shadcn/ui

## Backend

* Next.js server-side functionality
* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage

## Data Collection

* Python
* Requests / HTTP clients
* BeautifulSoup
* Playwright when browser rendering is required

## AI

Use an LLM for:

* Tender classification
* Information extraction
* Summarization
* Company matching
* Bid/no-bid analysis

## Deployment

* Vercel
* Supabase

---

# 3. Repository Structure

```text
bidhubkh/
│
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── tenders/
│   │   │   ├── organizations/
│   │   │   ├── categories/
│   │   │   ├── dashboard/
│   │   │   └── admin/
│   │   │
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── package.json
│
├── scraper/
│   ├── sources/
│   ├── extractors/
│   ├── processors/
│   ├── validators/
│   ├── scheduler/
│   └── requirements.txt
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── docs/
│   ├── architecture.md
│   ├── data-sources.md
│   ├── database.md
│   └── api.md
│
└── README.md
```

---

# 4. Development Principles

## Principle 1 — Data first

The website is useless without good tender data.

Build the ingestion pipeline before spending significant time on UI polish.

## Principle 2 — Source-specific adapters

Every tender source should have its own adapter.

Do not create one massive scraper.

## Principle 3 — AI is not the source of truth

AI should assist with extraction and interpretation.

Critical fields such as:

* Deadline
* Tender ID
* Original URL
* Organization

should be validated against the original source.

## Principle 4 — Human override

Administrators must be able to correct extracted information.

## Principle 5 — Everything should be traceable

Every tender should retain:

* Source
* Original URL
* Retrieval date
* Original document reference
* Extraction status

---

# 5. Phase 1 — Project Initialization

## Tasks

* Create Git repository
* Initialize Next.js application
* Configure TypeScript
* Configure Tailwind
* Install shadcn/ui
* Configure ESLint
* Configure environment variables
* Configure Supabase
* Create development README

## Deliverable

A running empty BidHubKH application connected to Supabase.

---

# 6. Phase 2 — Database Architecture

Create the initial PostgreSQL schema.

## `sources`

```text
id
name
website_url
source_type
access_method
active
last_checked_at
last_success_at
last_error
created_at
updated_at
```

## `organizations`

```text
id
name
type
website_url
description
created_at
updated_at
```

## `categories`

```text
id
name
slug
parent_id
description
```

## `tenders`

```text
id
source_id
organization_id
external_id
title
slug
description
category_id
location
published_at
deadline
estimated_value
currency
procurement_method
eligibility
status
original_url
first_seen_at
last_seen_at
created_at
updated_at
```

## `tender_documents`

```text
id
tender_id
name
document_type
original_url
storage_path
file_hash
extracted_text
created_at
```

## `companies`

```text
id
user_id
name
description
location
website
created_at
updated_at
```

## `company_products`

```text
id
company_id
name
category_id
description
```

## `saved_tenders`

```text
id
user_id
tender_id
notes
created_at
```

## `alerts`

```text
id
user_id
name
keywords
category_id
organization_id
minimum_value
maximum_value
active
created_at
updated_at
```

---

# 7. Phase 3 — Database Security

Implement Row Level Security.

Users should only be able to access their own:

* Company profile
* Saved tenders
* Alerts

Public users can access published tender information.

Admins can manage:

* Sources
* Organizations
* Categories
* Tenders
* Documents

Never expose service-role credentials to the browser.

---

# 8. Phase 4 — Source Management

Create an internal source registry.

Example:

```text
Source
--------------------------------
FMIS
URL: ...
Type: Government
Method: HTML
Status: Active

World Bank
URL: ...
Type: Development
Method: API
Status: Active
```

Each source should record:

* Access method
* Last successful run
* Last failure
* Number of tenders collected
* Parser version

---

# 9. Phase 5 — Scraper Architecture

Create a common interface.

```text
TenderSource
    ↓
fetch()
    ↓
parse()
    ↓
normalize()
    ↓
validate()
    ↓
save()
```

Each source gets its own implementation.

```text
scraper/
└── sources/
    ├── mef.py
    ├── fmis.py
    ├── world_bank.py
    ├── adb.py
    └── example_source.py
```

The system should allow new sources to be added without modifying the core pipeline.

---

# 10. Phase 6 — Raw Data Layer

Never immediately overwrite raw source information.

Store:

```text
Raw Source
    ↓
Normalized Tender
```

Example:

```text
raw_tenders
```

Fields:

```text
id
source_id
source_url
raw_title
raw_description
raw_content
retrieved_at
content_hash
```

This allows us to debug extraction problems later.

---

# 11. Phase 7 — Tender Normalization

Convert different source formats into the common BidHubKH format.

Example:

```text
Source A:
"Closing Date"

Source B:
"Submission Deadline"

Source C:
"Bid Deadline"
```

Normalize all three into:

```text
deadline
```

The same principle applies to:

* Organization
* Category
* Value
* Currency
* Procurement method
* Location

---

# 12. Phase 8 — Deduplication

The same tender may appear on multiple websites.

Create a deduplication system using:

### Exact matching

```text
source
external_id
```

### Fingerprint

```text
organization
normalized title
deadline
```

### Similarity matching

Use text similarity for slightly different titles.

Example:

```text
Supply of ICT Equipment
```

and:

```text
Procurement of ICT Equipment for Ministry X
```

should potentially be identified as the same opportunity.

The system should flag uncertain duplicates for administrator review.

---

# 13. Phase 9 — Data Validation

Implement validation rules.

Examples:

```text
deadline > publication_date
estimated_value >= 0
currency ∈ supported currencies
original_url must be valid
title cannot be empty
organization cannot be empty
```

Important fields should have confidence scores.

Example:

```text
Deadline:
2026-09-18

Confidence:
98%
```

---

# 14. Phase 10 — Admin Dashboard

Build this before the public marketplace.

Routes:

```text
/admin
/admin/tenders
/admin/tenders/[id]
/admin/sources
/admin/organizations
/admin/categories
/admin/errors
```

## Admin Dashboard

Display:

* New tenders
* Pending review
* Failed extraction
* Duplicate candidates
* Source failures
* Recent activity

## Tender Review

Admin can:

* Approve
* Reject
* Edit
* Merge duplicates
* Change category
* Correct deadline
* Correct organization
* Add notes

---

# 15. Phase 11 — Public Website

## Homepage

Sections:

```text
Hero
Search
Popular Categories
Latest Tenders
Featured Opportunities
How BidHubKH Works
Call to Action
```

## Tender Listing

Features:

* Search
* Pagination
* Filters
* Sorting
* Category
* Organization
* Deadline
* Value
* Location

## Tender Detail

Display:

* Title
* Organization
* Category
* Deadline
* Value
* Description
* Requirements
* Eligibility
* Documents
* Original source
* Last updated

---

# 16. Phase 12 — Search

Start with PostgreSQL full-text search.

Search fields:

```text
title
description
organization
category
```

Filters:

```text
category
organization
deadline
value
location
status
```

Do not introduce a separate search engine until the database actually requires it.

---

# 17. Phase 13 — Authentication

Implement:

* Registration
* Login
* Logout
* Password reset
* Google authentication if appropriate

User dashboard:

```text
/dashboard
/dashboard/profile
/dashboard/saved
/dashboard/alerts
/dashboard/company
```

---

# 18. Phase 14 — Company Profile

Users can define:

```text
Company name
Industry
Products
Services
Experience
Location
Preferred contract size
Preferred categories
```

Example:

```text
ABC Technology

Products:
- Laptops
- Servers
- Networking
- CCTV

Preferred contract:
$10,000–$500,000
```

This becomes the foundation for personalized matching.

---

# 19. Phase 15 — Saved Tenders

Users can save tenders.

Each saved tender can have:

* Notes
* Internal status
* Deadline
* Last viewed date

Possible statuses:

```text
Interested
Reviewing
Preparing Bid
Submitted
Won
Lost
Rejected
```

This creates the foundation for future bid management.

---

# 20. Phase 16 — Tender Alerts

Users create alert rules.

Example:

```text
Category:
IT Equipment

Keywords:
laptop, server, networking

Minimum:
$10,000

Maximum:
$500,000
```

When a matching tender appears:

```text
New Tender
     ↓
Alert Rules
     ↓
Match
     ↓
Email
```

Later:

* Telegram
* WhatsApp
* Push notifications

---

# 21. Phase 17 — AI Document Processing

When a tender document is available:

```text
PDF
 ↓
Text Extraction
 ↓
Clean Text
 ↓
LLM
 ↓
Structured Tender Data
```

Extract:

```text
Products
Services
Deadline
Estimated Value
Eligibility
Requirements
Bid Security
Experience Requirements
Required Documents
Delivery Requirements
```

The LLM output must use structured JSON and be validated before saving.

---

# 22. Phase 18 — AI Summary

Generate a concise summary.

Example:

```text
What is being purchased?
500 laptops and related networking equipment.

Who can bid?
Eligible registered suppliers meeting the stated experience requirements.

Deadline:
18 September 2026.

Important:
Bid security is required.
```

Store the generated summary so it does not need to be regenerated every time a user opens the page.

---

# 23. Phase 19 — Company Matching

Build a matching engine.

Input:

```text
Company Profile
+
Tender
```

Output:

```text
Match Score: 91%

Product Match: 95%
Eligibility: 80%
Contract Size: 90%
Location: 100%
```

The system should also explain:

```text
Why this is a good match
Why it may not be a good match
Missing requirements
Potential risks
```

Avoid presenting AI scores as guaranteed predictions.

---

# 24. Phase 20 — Bid / No-Bid Intelligence

Add:

```text
Bid Score: 78/100
```

Factors:

* Product match
* Eligibility
* Contract size
* Required experience
* Deadline
* Bid security
* Technical complexity
* Geographic requirements

Example:

```text
GOOD
+ Strong product match
+ Contract size fits company

RISKS
- Requires 3 years experience
- Bid security required
- Only 12 days remaining
```

---

# 25. Phase 21 — Notifications

Notification system:

```text
New Tender
     ↓
Matching Engine
     ↓
User Alert
     ↓
Notification Queue
     ↓
Email / Telegram / Push
```

Create notification logs so failed notifications can be retried.

---

# 26. Phase 22 — Subscription

Only implement this after user validation.

Potential plans:

```text
FREE
PRO
BUSINESS
```

The subscription system should control:

* Search limits
* AI analysis limits
* Alerts
* Number of saved tenders
* Company profiles
* Team members

Do not hard-code pricing into business logic.

Use configurable plan limits.

---

# 27. Phase 23 — Analytics

Track:

### User events

* Search
* Tender view
* Save tender
* AI analysis
* Alert creation
* External-source click

### Business metrics

* Active users
* Most searched categories
* Most viewed tenders
* Most saved tenders
* Conversion rate
* Subscription activity

This will help determine what businesses actually want.

---

# 28. Phase 24 — Monitoring

Monitor both application and data pipelines.

## Source health

```text
FMIS          🟢
World Bank    🟢
ADB           🟢
Source X      🔴
```

Track:

* Last successful run
* Number of tenders collected
* Error count
* Extraction failures
* Duplicate rate

## Application

Monitor:

* Server errors
* Database errors
* API latency
* AI failures
* Notification failures

---

# 29. Testing Strategy

## Unit Tests

Test:

* Parsers
* Normalizers
* Validators
* Deduplication
* Matching calculations

## Integration Tests

Test:

```text
Source
 ↓
Scraper
 ↓
Database
 ↓
API
 ↓
Frontend
```

## Browser Tests

Test:

* Search
* Filters
* Login
* Save tender
* Create alert
* Tender detail

## Data Tests

Every scraper should have test fixtures from real source formats.

---

# 30. Security

Implement:

* Supabase RLS
* Server-side authorization
* Input validation
* Rate limiting
* Secure API keys
* No service keys in client-side code
* File-type validation
* Upload size limits
* Admin role protection

Never trust data extracted from external websites.

---

# 31. Performance

Initial target:

* Fast homepage
* Server-side rendering for tender pages
* Pagination
* Database indexes
* Cached public tender queries
* Optimized images
* Background processing for AI

AI processing should never block normal page loading.

---

# 32. MVP Definition

The first launch should contain only:

```text
✓ Tender sources
✓ Automated ingestion
✓ PostgreSQL database
✓ Deduplication
✓ Admin review
✓ Public tender search
✓ Filters
✓ Tender detail pages
✓ Authentication
✓ Saved tenders
✓ Basic alerts
✓ Basic AI summaries
```

Do NOT initially build:

```text
✗ Mobile app
✗ Complex billing
✗ Advanced bid management
✗ Supplier marketplace
✗ Automated proposal generation
✗ Complex recommendation engine
```

Those come after validation.

---

# 33. Development Milestones

## Milestone 01 — Foundation

* Repository
* Next.js
* Supabase
* Authentication foundation
* Environment configuration

## Milestone 02 — Database

* Schema
* RLS
* Seed data
* Database utilities

## Milestone 03 — Source Engine

* Source registry
* First scraper
* Raw data storage
* Normalization

## Milestone 04 — Tender Pipeline

* Validation
* Deduplication
* Processing
* Database ingestion

## Milestone 05 — Admin

* Tender moderation
* Source management
* Error monitoring

## Milestone 06 — Public Product

* Homepage
* Search
* Filters
* Tender pages

## Milestone 07 — User Product

* Accounts
* Company profiles
* Saved tenders
* Alerts

## Milestone 08 — AI

* Document extraction
* Summaries
* Classification

## Milestone 09 — Matching

* Company/tender matching
* Match explanation

## Milestone 10 — Monetization

* Plans
* Subscription
* Usage limits

## Milestone 11 — Intelligence

* Bid/no-bid
* Risk analysis
* Advanced recommendations

---

# 34. Critical First Technical Goal

Before building the entire platform, prove this pipeline:

```text
ONE REAL SOURCE
       ↓
Automatic Collection
       ↓
Tender Extraction
       ↓
Database
       ↓
Admin Review
       ↓
Public Tender Page
```

If this works reliably, add the second source.

Then the third.

Then the tenth.

The architecture should make adding a new source mostly an **adapter task**, not a complete rewrite.

---

# 35. Definition of MVP Success

The MVP is technically successful when:

* Multiple real sources are being collected
* Tenders are automatically normalized
* Duplicate tenders are detected
* Administrators can correct data
* Users can search tenders
* Users can save tenders
* Users can receive alerts
* AI can summarize tender documents
* Original sources remain traceable
* The system can operate without manual data entry for every tender

The business is successful only when real Cambodian businesses repeatedly use the platform and demonstrate willingness to pay.

---

# 36. Recommended Build Order

The actual implementation order should be:

```text
01. Project setup
        ↓
02. Supabase
        ↓
03. Database
        ↓
04. Source registry
        ↓
05. First source adapter
        ↓
06. Raw ingestion
        ↓
07. Normalization
        ↓
08. Deduplication
        ↓
09. Admin dashboard
        ↓
10. Public tender pages
        ↓
11. Search + filters
        ↓
12. Authentication
        ↓
13. Saved tenders
        ↓
14. Alerts
        ↓
15. AI extraction
        ↓
16. AI summaries
        ↓
17. Company profiles
        ↓
18. Matching
        ↓
19. Monetization
        ↓
20. Advanced bid intelligence
```

## Final Development Rule

**Do not let the AI coding agent build everything at once.**

Give it one milestone at a time.

Every milestone should:

1. Implement the feature.
2. Run tests.
3. Verify the database.
4. Verify the UI.
5. Fix errors.
6. Commit the working version.
7. Only then move to the next milestone.

This keeps BidHubKH manageable and prevents the project from turning into a giant unfinished codebase.
