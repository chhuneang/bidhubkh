import Link from 'next/link'
import { ExternalLink, Shield, Heart } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col with Hand-drawn Logo */}
          <div className="space-y-4 md:col-span-2">
            <Logo size="md" showTagline={false} />
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Cambodia&apos;s centralized tender intelligence platform. Aggregating official public procurement notices across government ministries, development banks, and NGOs to empower local enterprises.
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Independent procurement metadata aggregator. Links directly to official sources.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Procurement Sectors
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tenders?category=it-telecom" className="hover:text-blue-600 transition-colors">
                  IT & Telecommunications
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=construction-civil" className="hover:text-blue-600 transition-colors">
                  Construction & Civil Works
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=medical-healthcare" className="hover:text-blue-600 transition-colors">
                  Medical & Healthcare Supplies
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=consulting-services" className="hover:text-blue-600 transition-colors">
                  Consulting & Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Official Sources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://projects.worldbank.org/en/projects-operations/procurement?countrycode_exact=KH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  World Bank Cambodia <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.adb.org/countries/cambodia/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  Asian Development Bank <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.mpwt.gov.kh/en/documents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  Royal Government Portal <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BidHubKH (ប៊ីតហាប់). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="/admin" className="hover:text-blue-600 transition-colors">Source Health</Link>
            <Link href="/tenders" className="hover:text-blue-600 transition-colors">Catalog</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
