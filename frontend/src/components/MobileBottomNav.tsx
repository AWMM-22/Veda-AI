'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BookOpen, Wand2 } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: FileText, label: 'Assignments', href: '/assignments' },
  { icon: BookOpen, label: 'Library', href: '/library' },
  { icon: Wand2, label: 'AI Tools', href: '/toolkit' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50">
      <div className="rounded-lg border border-slate-200/80 bg-slate-950/95 px-2 py-2 text-white shadow-[0_20px_40px_rgba(15,23,42,0.24)] backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
