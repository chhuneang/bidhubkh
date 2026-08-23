import Link from 'next/link'
import { Compass, ExternalLink, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                BidHub<span className="text-blue-400">KH</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Cambodia&apos;s centralized tender intelligence platform. Aggregating official public procurement notices across government ministries, development banks, and NGOs to empower local enterprises.
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span>Independent procurement metadata aggregator. Links directly to official sources.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Procurement Sectors
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tenders?category=it-telecom" className="hover:text-blue-400 transition-colors">
                  IT & Telecommunications
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=construction-civil" className="hover:text-blue-400 transition-colors">
                  Construction & Civil Works
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=medical-healthcare" className="hover:text-blue-400 transition-colors">
                  Medical & Healthcare Supplies
                </Link>
              </li>
              <li>
                <Link href="/tenders?category=consulting-services" className="hover:text-blue-400 transition-colors">
                  Consulting & Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Official Sources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://projects.worldbank.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  World Bank Cambodia <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.adb.org/projects/tenders/country/cam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  Asian Development Bank <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://mef.gov.kh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  MEF Cambodia (GDIPP) <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BidHubKH (ប៊ីតហាប់). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-400">Contact & Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
