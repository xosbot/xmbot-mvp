"use client"

import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "@/components/landing/scroll-reveal"
import { blogPosts } from "@/lib/blog"

export default function BlogPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // Blog
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            Insights & Updates
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            Product updates, strategy deep-dives, and trading education.
          </p>
        </div>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
          {blogPosts.map((post) => (
            <StaggerItem key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block group">
                <article className="h-full p-6 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors duration-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <span className="px-2 py-0.5 rounded-sm bg-gold-500/10 text-gold-400 text-[10px] font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gold-400 font-medium">
                    Read more
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </div>
  )
}
