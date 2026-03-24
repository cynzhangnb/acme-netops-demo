import { Sparkles, ArrowRight } from 'lucide-react'

export default function AIEntryButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-xl shadow-panel transition-all duration-200 hover:shadow-modal"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">Ask AI about your network</p>
          <p className="text-xs text-blue-100 mt-0.5">Explore, troubleshoot, and understand your infrastructure</p>
        </div>
      </div>
      <ArrowRight size={18} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}
