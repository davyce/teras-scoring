//src/components/Hero.tsx

import { ReactNode } from 'react'
import { ScoreCard } from './ScoreCard'

export function Hero({
  title,
  subtitle,
  buttons,
  showScoreCard = true,
  children,
}: {
  title: string
  subtitle?: string
  buttons?: ReactNode
  showScoreCard?: boolean
  children?: ReactNode
}) {
  return (
    <div className="min-h-[70vh]" style={{ backgroundColor: '#0B1220' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="flex flex-col lg:flex-row items-start gap-10">
          <div className="flex-1">
            <h1 className="mb-3" style={{ color: '#EAF2FF', fontWeight: 800, fontSize: '36px', lineHeight: 1.1 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[16px] mb-6 max-w-[700px]" style={{ color: '#9CB5DD' }}>
                {subtitle}
              </p>
            )}
            {buttons && <div className="flex gap-3 flex-wrap">{buttons}</div>}
          </div>
          {showScoreCard && (
            <div className="w-full lg:w-[420px]">
              <ScoreCard />
            </div>
          )}
        </div>

        {children && <div className="mt-10">{children}</div>}
      </div>
    </div>
  )
}
