'use client'
import { usePathname } from "next/navigation"
import Link from "next/link"
export default function Nav({ menuItems, orientation }) {
  const pathname = usePathname()
  return <div className={`flex gap-3 justify-start cursor-pointer items-center ${orientation === 'vertical' ? "flex-col" : "flex-row"}`}>
    {menuItems.map((item) => {
      return (
        <div
          key={item.href}
          className={`hover:bg-slate-200 h-8 text-center leading-8 px-3 rounded-md ${pathname === item.href ? "bg-slate-200" : ""} ${orientation === 'vertical' ? "w-[100%]" : ""}`}
        >
          <Link href={item.href}>{item.title}</Link>
        </div>
      );
    })}
  </div>
}