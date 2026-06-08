import { useSerialPort } from './lib/react-web-serial'
import ScaleDisplay from './comps/ScaleDisplay/ScaleDisplay'

export function SerialMonitor() {
  const {
    isAvailableSerialApi,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    value,
    scaleResponse,
  } = useSerialPort({
    options: { baudRate: 9600 },
  })

  if (!isAvailableSerialApi) {
    return (
      <div className='mx-auto mt-16 max-w-2xl px-4'>
        <p className='rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700'>
          Web Serial API není v tomto prohlížeči podporováno. Použijte Chrome nebo Edge.
        </p>
      </div>
    )
  }

  return (
    <div className='mx-auto mt-12 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 md:mt-16 md:p-8'>
      <h1 className='mb-6 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl'>
        Dini Data - Serial Monitor
      </h1>

      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <button
          onClick={() => connect()}
          disabled={isConnected || isConnecting}
          className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
        >
          {isConnecting ? 'Pripojovani...' : 'Pripojit'}
        </button>
        <button
          onClick={() => disconnect()}
          disabled={!isConnected}
          className='rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40'
        >
          Odpojit
        </button>
      </div>

      <div className='mb-4'>
        <input
          type='text'
          readOnly
          value={value ?? '-'}
          placeholder='(zadna data)'
          className='w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900'
        />
      </div>

      {error && <p className='mb-3 text-sm text-red-600'>Chyba: {error.message}</p>}

      <ScaleDisplay isConnected={isConnected} scaleResponse={scaleResponse} />
    </div>
  )
}
