export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center space-y-4 z-50 bg-white/80 backdrop-blur-sm">
      <div className="relative">
        <img 
          src="/icons/icon-192x192.png" 
          alt="CFL SMS Logo" 
          className="w-14 h-14 animate-spin"
        />
      </div>
      <p className="text-slate-600 font-medium text-base">{message}</p>
    </div>
  )
}

