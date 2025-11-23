'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Page() {
  const [pages, setPages] = useState([
    {
      id: 1,
      title: 'Page 1',
      heading: '',
      content: ''
    }
  ])
  const [activeId, setActiveId] = useState(1)
  const [exportMode, setExportMode] = useState('current') // current | all-one | all-separate

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('pdf-editor-pages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize old data that might not have heading
          const normalized = parsed.map((p, idx) => ({
            id: p.id ?? idx + 1,
            title: p.title ?? `Page ${idx + 1}`,
            heading: p.heading || '',
            content: p.content || ''
          }))
          setPages(normalized)
          setActiveId(normalized[0].id)
        }
      } catch {
        // ignore corrupted storage
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('pdf-editor-pages', JSON.stringify(pages))
  }, [pages])

  const activePage = pages.find((p) => p.id === activeId) || pages[0]

  const addPage = () => {
    const nextId = pages.length ? Math.max(...pages.map((p) => p.id)) + 1 : 1
    const newPage = {
      id: nextId,
      title: `Page ${nextId}`,
      heading: '',
      content: ''
    }
    setPages((prev) => [...prev, newPage])
    setActiveId(nextId)
  }

  const deletePage = (id) => {
    if (pages.length === 1) return
    const filtered = pages.filter((p) => p.id !== id)
    setPages(filtered)
    if (activeId === id && filtered.length > 0) {
      setActiveId(filtered[filtered.length - 1].id)
    }
  }

  const updateContent = (value) => {
    if (!activePage) return
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id ? { ...p, content: value } : p
      )
    )
  }

  const updateHeading = (value) => {
    if (!activePage) return
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id ? { ...p, heading: value } : p
      )
    )
  }

  const renamePage = (id, title) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title } : p))
    )
  }

  const duplicatePage = (id) => {
    const page = pages.find((p) => p.id === id)
    if (!page) return
    const nextId = Math.max(...pages.map((p) => p.id)) + 1
    const copy = {
      ...page,
      id: nextId,
      title: `${page.title} (copy)`
    }
    setPages((prev) => [...prev, copy])
    setActiveId(nextId)
  }

  // ========== PDF EXPORT ==========

  /**
   * Writes one logical "editor page" into a jsPDF document,
   * automatically adding new PDF pages when the text reaches
   * the bottom. Includes a heading.
   */
  const exportSinglePageToDoc = (doc, page) => {
    const titleLabel = page.title || `Page ${page.id}`
    const headingText = page.heading || ''
    const bodyText = page.content || ''

    const marginLeft = 15
    const marginTop = 20
    const marginBottom = 20
    const maxWidth = 180
    const lineHeight = 6
    const pageHeight = doc.internal.pageSize.getHeight()

    let cursorY = marginTop

    // Helper to write lines with pagination
    const writeLines = (lines, fontSize, isBold) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)

      lines.forEach((line) => {
        if (cursorY > pageHeight - marginBottom) {
          doc.addPage()
          cursorY = marginTop
        }
        doc.text(line, marginLeft, cursorY)
        cursorY += lineHeight
      })
    }

    // Title label (small)
    writeLines([titleLabel], 14, true)
    cursorY += 2

    // Heading (big & optional)
    if (headingText.trim().length > 0) {
      const headingLines = doc.splitTextToSize(headingText, maxWidth)
      writeLines(headingLines, 18, true)
      cursorY += 4
    }

    // Body
    if (bodyText.trim().length > 0) {
      const lines = doc.splitTextToSize(bodyText, maxWidth)
      writeLines(lines, 12, false)
    }
  }

  const handleExport = async () => {
    if (!pages.length || !activePage) return

    const { default: jsPDF } = await import('jspdf')

    if (exportMode === 'current') {
      const doc = new jsPDF()
      exportSinglePageToDoc(doc, activePage)
      const safeTitle =
        (activePage.title || `Page-${activePage.id}`).replace(/[\/\\]/g, '_')
      doc.save(`${safeTitle}.pdf`)
    }

    if (exportMode === 'all-one') {
      const doc = new jsPDF()
      pages.forEach((page, index) => {
        if (index !== 0) {
          doc.addPage()
        }
        exportSinglePageToDoc(doc, page)
      })
      doc.save('All-Pages.pdf')
    }

    if (exportMode === 'all-separate') {
      pages.forEach((page) => {
        const doc = new jsPDF()
        exportSinglePageToDoc(doc, page)
        const safeTitle =
          (page.title || `Page-${page.id}`).replace(/[\/\\]/g, '_')
        doc.save(`${safeTitle}.pdf`)
      })
    }
  }

  return (
    <main className="relative min-h-screen bg-[#020617] text-slate-100 overflow-hidden">
      {/* Blueprint aura background */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[#0a132e]
          before:absolute before:inset-0 before:opacity-[0.22]
          before:[background-image:repeating-linear-gradient(0deg,rgba(56,189,248,0.08)_0px,rgba(56,189,248,0.08)_1px,transparent_1px,transparent_22px),repeating-linear-gradient(90deg,rgba(56,189,248,0.08)_0px,rgba(56,189,248,0.08)_1px,transparent_1px,transparent_22px)]
          after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(1200px_500px_at_65%_-10%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(900px_480px_at_10%_90%,rgba(245,196,22,0.11),transparent_60%)]
        "
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-16">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400/40" />
            <span className="text-xs tracking-widest text-cyan-300/70 uppercase">
              Document Workspace
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-100">
                PDF Style Page Editor
              </h1>
              <p className="mt-2 text-sm md:text-base text-slate-300/80 max-w-xl">
                Write your notes like a PDF, organize them into pages, and keep
                everything saved locally in your browser.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400/70 rounded-full animate-pulse" />
                <span className="uppercase tracking-wider">Autosave On</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400/70 rounded-full animate-pulse" />
                <span className="uppercase tracking-wider">
                  {pages.length} Pages
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Layout */}
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] items-stretch">
          {/* Sidebar: Pages List */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-300">
                Pages
              </h2>
              <button
                onClick={addPage}
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-100 hover:bg-cyan-400/20 transition"
              >
                <span className="text-base leading-none">＋</span>
                New
              </button>
            </div>

            <div className="space-y-2 overflow-auto pr-1 flex-1">
              {pages.map((page) => {
                const isActive = page.id === activeId
                return (
                  <div
                    key={page.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveId(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveId(page.id)
                      }
                    }}
                    className={`group w-full text-left rounded-xl border px-3 py-2.5 text-xs transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black tracking-tight ${
                        isActive
                          ? 'bg-gradient-to-br from-cyan-400/90 to-amber-300/90 text-slate-900'
                          : 'bg-slate-900/40 text-cyan-200 border border-white/10'
                      }`}
                    >
                      {page.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        value={page.title}
                        onChange={(e) =>
                          renamePage(page.id, e.target.value)
                        }
                        className={`w-full bg-transparent border-none outline-none text-xs font-semibold truncate ${
                          isActive
                            ? 'text-slate-50'
                            : 'text-slate-200 group-hover:text-white'
                        }`}
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                        {page.heading
                          ? page.heading
                          : page.content
                          ? page.content.slice(0, 40).replace(/\n/g, ' ') +
                            (page.content.length > 40 ? '…' : '')
                          : 'No content yet'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicatePage(page.id)
                        }}
                        className="text-[9px] text-cyan-300 hover:text-cyan-100"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePage(page.id)
                        }}
                        disabled={pages.length === 1}
                        className="text-[9px] text-amber-300/80 hover:text-amber-200 disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Click a page to edit</span>
              <span className="text-cyan-300/80">Saved locally</span>
            </div>
          </motion.aside>

          {/* Main Editor */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="relative flex flex-col gap-4"
          >
            {/* Top bar / info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg border border-cyan-400/50 bg-cyan-400/10 flex items-center justify-center text-[13px] font-semibold text-cyan-100">
                  A4
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Editing
                  </div>
                  <div className="text-sm font-semibold text-slate-100">
                    {activePage?.title || 'Untitled Page'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
                  <span>Changes are stored in your browser (localStorage).</span>
                </div>

                {/* Export controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={exportMode}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-slate-200 outline-none"
                  >
                    <option value="current">Export current page</option>
                    <option value="all-one">Export all pages (one PDF)</option>
                    <option value="all-separate">
                      Export all pages (separate PDFs)
                    </option>
                  </select>
                  <button
                    onClick={handleExport}
                    className="rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-100 hover:bg-cyan-400/25 transition"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Page container */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Corner brackets */}
                <div className="pointer-events-none absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-cyan-300/40" />
                <div className="pointer-events-none absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-amber-300/40" />
                <div className="pointer-events-none absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-amber-300/40" />
                <div className="pointer-events-none absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-cyan-300/40" />

                {/* Bigger “PDF” page */}
                <div className="relative w-full max-w-[1100px] h-[85vh] bg-slate-50 rounded-[18px] shadow-2xl shadow-cyan-500/15 border border-slate-300/60 overflow-hidden">
                  {/* Page header band */}
                  <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50">
                    <div className="text-xs font-semibold tracking-wide text-slate-700">
                      PDF NOTE PAGE
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                      <span>{activePage?.title}</span>
                    </div>
                  </div>

                  {/* Editor area: heading + body */}
                  <div className="h-[calc(100%-46px)] px-6 py-4">
                    <div className="flex flex-col h-full gap-3">
                      <input
                        value={activePage?.heading || ''}
                        onChange={(e) => updateHeading(e.target.value)}
                        className="w-full border-b border-slate-300/70 bg-transparent text-[18px] md:text-[20px] font-semibold text-slate-900 outline-none pb-1 placeholder:text-slate-400"
                        placeholder="Heading (optional)"
                      />
                      <textarea
                        value={activePage?.content || ''}
                        onChange={(e) => updateContent(e.target.value)}
                        className="
                          flex-1 w-full resize-none bg-transparent outline-none border-none
                          text-[13px] md:text-[15px] leading-relaxed text-slate-800
                          font-normal
                          [tab-size:4]
                        "
                        spellCheck={false}
                        placeholder="Start writing your notes here. Use multiple pages to separate topics, chapters, or sections like a real PDF document."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom hint bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                <span className="text-cyan-300">Tip</span>
                <span>
                  Use the heading for the main title of the page. Content will
                  automatically continue onto new PDF pages when it gets long.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400/70 rounded-full animate-pulse" />
                <span>Export modes are controlled from the dropdown above.</span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
