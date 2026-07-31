import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, ArrowLeft } from "lucide-react"
import { getBlogPost, getBlogPosts } from "@/lib/blog"
import type { Metadata } from "next"

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Post Not Found" }
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <article>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Calendar className="h-3 w-3" />
            {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-6">
            {post.title}
          </h1>

          <p className="text-lg text-slate-400 mb-12">
            {post.excerpt}
          </p>

          <div className="prose prose-invert prose-slate max-w-none">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                return <h2 key={i} className="text-2xl font-bold text-white tracking-tight mt-12 mb-4">{paragraph.replace("## ", "")}</h2>
              }
              if (paragraph.startsWith("| ")) {
                const rows = paragraph.split("\n").filter(r => r.startsWith("|"))
                const header = rows[0]?.split("|").filter(Boolean).map(c => c.trim())
                const body = rows.slice(2)
                return (
                  <div key={i} className="overflow-x-auto my-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          {header?.map((h, j) => (
                            <th key={j} className="text-left py-3 px-4 text-slate-300 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {body.map((row, j) => {
                          const cells = row.split("|").filter(Boolean).map(c => c.trim())
                          return (
                            <tr key={j} className="border-b border-white/5">
                              {cells.map((cell, k) => (
                                <td key={k} className="py-3 px-4 text-slate-400">{cell}</td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              }
              if (paragraph.startsWith("1. ") || paragraph.startsWith("- ")) {
                const items = paragraph.split("\n").filter(l => l.match(/^(\d+\.|-)/))
                return (
                  <ul key={i} className="list-disc list-inside space-y-2 my-4 text-slate-400">
                    {items.map((item, j) => (
                      <li key={j}>{item.replace(/^\d+\.\s*|^-\s*/, "")}</li>
                    ))}
                  </ul>
                )
              }
              return <p key={i} className="text-slate-400 leading-relaxed my-4">{paragraph}</p>
            })}
          </div>
        </article>
      </div>
    </div>
  )
}
