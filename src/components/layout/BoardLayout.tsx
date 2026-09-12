import { ReactNode } from 'react'

export function BoardLayout({ children, topbar }: { children: ReactNode, topbar?: ReactNode }) {
  return (
    <div className="min-h-screen bg-recess flex flex-col items-center">
      <header className="w-full bg-enamel border-b border-seam min-h-[56px] sticky top-0 z-header flex flex-wrap items-center justify-between px-gutter gap-2 py-1">
        <div className="flex-1 min-w-0 flex items-center w-full">
          {topbar}
        </div>
      </header>
      <main className="w-full max-w-board px-gutter py-stack flex flex-col gap-stack">
        {children}
      </main>
    </div>
  )
}
