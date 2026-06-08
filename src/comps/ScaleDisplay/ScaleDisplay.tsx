import { AlertTriangle, PlugZap, WifiOff } from 'lucide-react'
import type { ScaleRextResponse } from '../../lib/react-web-serial/types'

type Props = {
  isConnected: boolean
  scaleResponse: ScaleRextResponse | null
}

const formatWeight = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '----'
  }

  return value.toFixed(3)
}

const ScaleDisplay = ({ isConnected, scaleResponse }: Props) => {
  const status = scaleResponse?.status ?? '---'
  const tare = scaleResponse?.tare ?? 0
  const unit = (scaleResponse?.unit ?? 'kg').toLowerCase()
  const weight = formatWeight(scaleResponse?.weight)

  const isStableStatus = status.toLowerCase().includes('stable')
  const StatusIcon = !isConnected ? WifiOff : isStableStatus ? PlugZap : AlertTriangle
  const statusColorClass = !isConnected
    ? 'text-red-300'
    : isStableStatus
      ? 'text-emerald-300'
      : 'text-amber-300'

  return (
    <section className='rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0_14px_28px_rgba(2,6,23,0.45)] md:p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Dini Scale</p>
        <div className='flex items-center gap-2'>
          <span
            className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_14px_2px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_12px_2px_rgba(248,113,113,0.65)]'}`}
          />
          <span className='text-[11px] uppercase tracking-[0.2em] text-slate-400'>
            {isConnected ? 'live' : 'offline'}
          </span>
        </div>
      </div>

      <div className='rounded-xl border border-emerald-400/35 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-4 shadow-inner shadow-emerald-500/15'>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <div className='inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1'>
            <StatusIcon size={14} className={statusColorClass} />
            <p className={`font-mono text-xs uppercase tracking-[0.2em] ${statusColorClass}`}>
              {status}
            </p>
          </div>
          <p className='font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400'>gross</p>
        </div>

        <div className='flex items-end justify-end gap-3'>
          <p className='w-full text-right font-mono text-4xl leading-none font-semibold tabular-nums tracking-widest text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.85)] md:text-5xl'>
            {weight}
          </p>
          <p className='pb-1 font-mono text-xl font-semibold uppercase tracking-[0.25em] text-emerald-200'>
            {unit}
          </p>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-300 md:text-xs'>
        <div className='rounded-md border border-slate-700 bg-slate-800 px-3 py-2'>
          <span className='text-slate-500'>Tare</span>
          <p className='mt-1 font-mono text-sm text-slate-100 tabular-nums'>{tare}</p>
        </div>
      </div>
    </section>
  )
}

export default ScaleDisplay
