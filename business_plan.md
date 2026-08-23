# BidHubKH — Business Plan

## 1. Executive Summary

**BidHubKH** is a Cambodian tender intelligence platform designed to help businesses discover, understand, and act on procurement opportunities.

Instead of simply listing tenders, BidHubKH aims to provide:

> **Find → Understand → Match → Decide → Bid**

The platform will aggregate publicly available tender information from government agencies, development organizations, NGOs, and other reliable sources.

Over time, BidHubKH will use AI to summarize tender documents, identify requirements, match opportunities to businesses, and help companies decide whether an opportunity is worth pursuing.

---

# 2. Problem

Cambodian procurement information is fragmented across many sources:

* Government ministries and agencies
* MEF / General Department of Public Procurement
* FMIS
* Government project websites
* World Bank
* Asian Development Bank
* JICA
* UN agencies
* NGOs
* Universities
* Public institutions
* State-owned enterprises
* Newspapers
* Existing tender platforms

Businesses therefore need to spend significant time searching multiple websites and reviewing documents.

The main problems are:

### Fragmented information

Tender opportunities are spread across many websites.

### Time-consuming research

Businesses may need to manually check multiple sources every day.

### Difficult documents

Important requirements are often hidden inside lengthy PDF documents.

### Poor relevance

A company selling IT equipment doesn't want to manually review hundreds of unrelated construction tenders.

### Missed deadlines

Businesses can easily miss important submission dates.

### Difficult bid decisions

Finding an opportunity does not automatically tell a company whether it is qualified or whether the opportunity is worth pursuing.

---

# 3. Solution

BidHubKH will consolidate tender opportunities into a centralized platform.

```text
Public Sources
      ↓
Data Collection
      ↓
Document Extraction
      ↓
Normalization
      ↓
Classification
      ↓
Deduplication
      ↓
Tender Database
      ↓
Search / Alerts / AI Matching
      ↓
Business
```

The goal is to reduce the time required for businesses to find relevant procurement opportunities.

---

# 4. Product Vision

BidHubKH will evolve through several stages.

## Stage 1 — Tender Discovery

Users can:

* Search tenders
* Filter by category
* Filter by organization
* Filter by deadline
* Filter by value
* View tender details
* Access the original source

## Stage 2 — Tender Intelligence

AI will help extract:

* Tender summary
* Requirements
* Eligibility
* Deadline
* Estimated value
* Required documents
* Products/services requested

## Stage 3 — Company Matching

Businesses create a company profile:

```text
Company:
ABC Technology

Products:
- Laptops
- Servers
- Networking
- CCTV

Experience:
5 years

Location:
Phnom Penh
```

BidHubKH then identifies relevant tenders.

Example:

> **91% Match — Worth Investigating**

## Stage 4 — Bid Intelligence

The platform can eventually provide:

* Bid/no-bid scoring
* Risk analysis
* Requirement analysis
* Deadline assessment
* Competition indicators
* Opportunity scoring

## Stage 5 — Bid Assistance

Potential future services:

* Proposal preparation
* Compliance checks
* Bid document organization
* Supplier sourcing
* Pricing assistance

---

# 5. Target Customers

## Primary Customers

Cambodian companies that participate in procurement.

Priority industries:

1. IT equipment
2. Office equipment
3. Furniture
4. Electrical equipment
5. Construction materials
6. Vehicles
7. Medical equipment
8. Industrial equipment
9. CCTV/security
10. Consulting
11. Engineering
12. Contractors

## Secondary Customers

* NGOs
* Procurement consultants
* Importers
* Distributors
* Government suppliers
* SMEs

---

# 6. Initial Market

The initial market will be **Cambodia only**.

The goal is not to immediately become the largest tender database.

The first objective is to prove:

> Cambodian businesses need this information and are willing to use and eventually pay for it.

Once the Cambodian market is validated, regional expansion can be considered.

---

# 7. Competitive Landscape

Potential competitors include:

* DailyBids
* CambodiaTenders
* dgMarket
* Other regional tender platforms

Traditional tender aggregation mainly provides:

> **Collect → List → Search**

BidHubKH will aim for:

> **Collect → Understand → Match → Recommend → Assist**

The main competitive advantage should therefore be **relevance and intelligence**, rather than simply having the largest number of tenders.

---

# 8. Competitive Advantages

## 8.1 Cambodia-focused

Build specifically around Cambodia's procurement environment.

## 8.2 Multi-source aggregation

Bring relevant opportunities into one platform.

## 8.3 AI analysis

Automatically identify:

* Requirements
* Deadlines
* Categories
* Estimated values
* Eligibility
* Required documents

## 8.4 Company-to-tender matching

Instead of forcing businesses to search manually, BidHubKH can proactively recommend opportunities.

## 8.5 Bid/no-bid intelligence

Help businesses decide where they should spend their time and resources.

## 8.6 Historical procurement data

Over time, BidHubKH can build valuable historical information about:

* Organizations
* Tender categories
* Contract values
* Procurement patterns
* Historical opportunities

This can become an important long-term competitive asset, subject to applicable data rights and legal restrictions.

---

# 9. Data Acquisition

Data acquisition is one of the most important parts of the business.

Potential sources include:

## Government

* MEF
* General Department of Public Procurement
* FMIS
* Ministries
* Government agencies
* Public institutions
* Provincial authorities

## Development Organizations

* World Bank
* ADB
* JICA
* UN agencies
* Development projects

## Other Organizations

* NGOs
* Universities
* Hospitals
* State-owned enterprises
* Ports
* Utilities

## Other Public Sources

* Newspapers
* Public procurement announcements
* Existing tender databases

### Data Strategy

Where legally and technically appropriate:

1. Monitor public sources.
2. Collect tender metadata.
3. Extract relevant information.
4. Normalize the information.
5. Remove duplicates.
6. Link users to the original source.
7. Respect applicable laws, source terms, copyright, and access restrictions.

The initial platform should preferably use:

> **Tender metadata + original source link**

rather than unnecessarily republishing complete third-party documents.

---

# 10. Legal & Compliance

Before commercial launch, BidHubKH must investigate:

* Whether tender metadata can be commercially aggregated
* Copyright restrictions
* Website terms of use
* Automated-access restrictions
* API licensing
* Government open-data policies
* Commercial use of datasets
* Document redistribution rights
* Privacy requirements
* Attribution requirements

Professional legal advice should be obtained before large-scale commercial data collection.

---

# 11. MVP

The first version should remain simple.

## Public Website

### Homepage

* Search
* Recent tenders
* Featured opportunities
* Popular categories

### Tender Listing

* Search
* Category filter
* Organization filter
* Deadline filter
* Value filter
* Location filter

### Tender Detail

* Title
* Organization
* Description
* Category
* Deadline
* Estimated value
* Requirements
* Documents
* Original source

## User Features

* Registration
* Login
* Company profile
* Saved tenders
* Basic alerts

## Admin Features

* Tender management
* Source management
* Organization management
* Category management
* Data-quality review
* Scraper monitoring

---

# 12. AI Features

AI should initially assist with information extraction rather than replace deterministic data processing.

## AI Extraction

Input:

> Tender PDF

Output:

```json
{
  "category": "IT Equipment",
  "deadline": "2026-09-18",
  "estimated_value": 120000,
  "currency": "USD",
  "requirements": [],
  "products": [],
  "eligibility": []
}
```

## AI Summary

The system summarizes:

* What the buyer wants
* Who can bid
* Important requirements
* Important dates
* Potential risks

## AI Matching

Compare:

> Company profile ↔ Tender requirements

Then produce:

> **Match Score + Explanation**

---

# 13. Technology

## Frontend

* Next.js
* TypeScript
* Tailwind CSS

## Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage where appropriate

## Data Collection

* Python / Node.js
* APIs where available
* Source-specific crawlers
* Scheduled jobs

## AI

Use an LLM for:

* Document extraction
* Classification
* Summarization
* Matching
* Bid/no-bid analysis

## Hosting

* Vercel
* Supabase

---

# 14. Database

Core entities:

```text
sources
organizations
tenders
tender_documents
categories
tender_categories
users
companies
company_products
saved_tenders
alerts
```

The database should be designed so new tender sources can be added without redesigning the entire platform.

---

# 15. Revenue Model

## Free

Purpose:

* User acquisition
* Awareness
* Product discovery

Features could include:

* Limited searches
* Basic tender information
* Limited alerts

## Pro

Potential price:

> **$10–30/month**

Potential features:

* Unlimited searches
* Personalized alerts
* AI summaries
* Company matching
* Saved tenders
* Advanced filters

## Business

Potential price:

> **$50–150/month**

Potential features:

* Multiple users
* Advanced tender intelligence
* Bid/no-bid analysis
* Advanced alerts
* Export
* Team collaboration

Pricing should be validated with real customers before being finalized.

## Premium Services

Additional revenue could come from:

* Bid preparation
* Proposal assistance
* Tender compliance review
* Supplier sourcing
* Procurement consulting

---

# 16. Customer Acquisition

## Direct Outreach

Target companies that already participate in procurement.

Contact:

* Owners
* Sales managers
* Business development managers
* Procurement managers

## Facebook

Potential content:

> **15 new IT tenders this week**

> **7 tenders under $100k that SMEs can bid on**

> **New government laptop tender**

## Telegram

Create a free tender-alert channel.

Example:

```text
🔔 New IT Tender

Buyer: Ministry X
Deadline: 18 September
Value: $120k

View on BidHubKH
```

## LinkedIn

Target:

* Suppliers
* Contractors
* Procurement professionals
* Business owners

## SEO

Create searchable pages around:

* Cambodia tenders
* Cambodia government tenders
* IT tenders Cambodia
* Construction tenders Cambodia
* NGO tenders Cambodia
* Ministry tenders

---

# 17. Customer Validation

Before significant development investment, interview:

> **20–30 Cambodian businesses**

Questions:

1. How do you currently find tenders?
2. Which websites do you monitor?
3. How often do you check?
4. How much time does this take?
5. Do you currently pay for tender information?
6. What makes a tender relevant?
7. What information is difficult to understand?
8. How often do you miss deadlines?
9. Would automated alerts help?
10. Would AI tender analysis be useful?
11. Would you pay for it?
12. What price would be reasonable?

The primary objective is to validate the pain and willingness to pay.

---

# 18. Key Metrics

## Data

* Number of active sources
* Number of new tenders
* Data freshness
* Duplicate rate
* Extraction accuracy
* Deadline accuracy

## Product

* Registered users
* Active users
* Tender views
* Searches
* Saved tenders
* Alert subscriptions
* AI analysis usage

## Business

* Free-to-paid conversion
* Monthly recurring revenue
* Customer acquisition cost
* Retention
* Churn
* Average revenue per customer

### Most Important Early Metric

> **How many businesses repeatedly use BidHubKH to find real opportunities?**

Registrations alone do not prove product-market fit.

---

# 19. Development Roadmap

## Phase 1 — Research

* Map tender sources
* Analyze competitors
* Review data rights
* Identify priority categories

## Phase 2 — Data Prototype

* Connect 3–5 sources
* Collect real tenders
* Extract data
* Store in PostgreSQL
* Test deduplication

## Phase 3 — MVP

* Public website
* Search
* Filters
* Tender pages
* Authentication
* Saved tenders
* Basic alerts
* Admin dashboard

## Phase 4 — AI

* AI summaries
* Requirement extraction
* Classification
* Company matching

## Phase 5 — Monetization

* Subscription system
* Paid alerts
* Advanced matching
* Business accounts

## Phase 6 — Bid Intelligence

* Bid/no-bid scoring
* Risk analysis
* Document checklists
* Proposal assistance

---

# 20. First 90 Days

## Days 1–14 — Research

Deliverables:

* Competitor analysis
* Cambodia tender source database
* Data acquisition feasibility
* Legal/data-rights assessment
* Customer interview results

## Days 15–30 — Prototype

Deliverables:

* Database
* First 3–5 sources
* Automated ingestion
* Basic tender pages
* Internal admin dashboard

## Days 31–60 — MVP

Deliverables:

* Search
* Filters
* Accounts
* Saved tenders
* Alerts
* 10+ sources where feasible
* AI summaries

## Days 61–90 — Market Validation

Deliverables:

* Launch to initial businesses
* Direct outreach
* Measure usage
* Collect feedback
* Test pricing
* Acquire first paying customers

---

# 21. Major Risks

## Data Availability

Sources may change their websites or restrict automated access.

**Mitigation:** Use multiple sources and APIs where available.

## Legal Restrictions

Some data may not be commercially reusable.

**Mitigation:** Review source terms and applicable law before using each source.

## Data Quality

Automated extraction can produce incorrect information.

**Mitigation:** Validation rules and human review for important fields.

## Competition

Existing platforms already have data and customers.

**Mitigation:** Compete on relevance, intelligence, UX, and Cambodian-specific workflows.

## Low Willingness to Pay

Businesses may not pay for another information service.

**Mitigation:** Validate willingness to pay before building expensive features.

## AI Costs

Large documents can increase AI costs.

**Mitigation:** Use deterministic extraction where possible and AI only where it creates measurable value.

---

# 22. Long-Term Vision

BidHubKH should eventually become more than a tender website.

The long-term platform could become:

> **Cambodia's procurement intelligence and bid management platform.**

Potential ecosystem:

```text
Tender Discovery
       ↓
AI Analysis
       ↓
Company Matching
       ↓
Bid / No-Bid
       ↓
Supplier Discovery
       ↓
Pricing
       ↓
Proposal Preparation
       ↓
Bid Management
       ↓
Contract Intelligence
```

If the Cambodian market proves successful, BidHubKH could expand into Southeast Asian procurement markets.

---

# 23. Immediate Action Plan

Do not start by building the entire platform.

First:

### 1. Map the Sources

Identify the major Cambodian tender sources.

### 2. Verify Data Access

Determine exactly how each source can be accessed and what can legally be reused.

### 3. Analyze Competitors

Determine what DailyBids and other platforms already provide.

### 4. Interview Businesses

Determine whether the problem is painful enough to pay for.

### 5. Build a Data Prototype

Automatically collect a small number of real tenders.

### 6. Build the MVP

Only after confirming that the data and market are viable.

---

# 24. Strategic Principle

The core idea behind BidHubKH is:

> **Do not compete by having the most tenders. Compete by helping businesses find the tenders they actually have a chance of winning.**

## BidHubKH

> **Find. Analyze. Bid.**
