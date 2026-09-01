import Link from 'next/link'
import { ExternalLink, Shield, Sparkles, Globe, Lock } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function Footer() {
  return (
    <footer className="border-t border-slate-200/90 bg-white text-slate-600 text-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <Logo size="md" showTagline={false} />
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Cambodia&apos;s centralized tender intelligence platform. Aggregating official public procurement notices across government ministries, multilateral development banks, and NGOs to empower local enterprises.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                <Shield className="h-3 w-3 text-blue-600 shrink-0" />
                100% Free & Open Access
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                No Paywalls
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Procurement Sectors
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/tenders?category=it-telecom" className="text-slate-600 hover:text-blue-600 transition-colors">
                  IT & Telecommunications
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=construction-civil" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Construction & Civil Works
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=medical-healthcare" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Medical & Healthcare Supplies
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=consulting-services" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Consulting & Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Official Cambodian Portals
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://projects.worldbank.org/en/projects-operations/procurement?countrycode_exact=KH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  World Bank Cambodia <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.adb.org/countries/cambodia/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  Asian Development Bank <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.mpwt.gov.kh/en/documents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  Royal Government of Cambodia <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ungm.org/Public/Notice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  UN Global Marketplace <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BidHubKH (ប៊ីតហាប់). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/sources" className="hover:text-blue-600 transition-colors">Sources Health Sentinel</Link>
            <Link href="/tenders" className="hover:text-blue-600 transition-colors">Tender Catalog</Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Bid Pipeline</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
