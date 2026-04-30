import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { overlayQueries } from '@/lib/overlay-queries'
import { useLiveTimer } from '@/hooks/use-live-timer'
import { useOverlayAuthStore } from '@/stores/auth.store'

const startDrag = (e: React.MouseEvent) => {
  if (e.button !== 0) return
  void getCurrentWebviewWindow().startDragging()
}

export function Bubble() {
  const { isAuthenticated } = useOverlayAuthStore()
  const { data: session = null } = useQuery({
    ...overlayQueries.activeSession(),
    enabled: isAuthenticated,
  })
  const { data: tasks = [] } = useQuery({
    ...overlayQueries.todayTasks(),
    enabled: isAuthenticated,
  })
  const timer = useLiveTimer(session)

  const activeTask = tasks.find((t) => t.id === session?.taskId) ?? tasks.find((t) => t.status === 'open')
  const hasTimer = timer.isActive
  const focus = hasTimer

  return (
    <motion.div
      onMouseDown={startDrag}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      {hasTimer ? (
        <>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - timer.progress)}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-white text-[11px] font-mono font-semibold leading-none">
            {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
          </span>
          {activeTask && (
            <span className="text-white/80 text-[8px] leading-none mt-0.5 px-1 truncate max-w-[56px]">
              {activeTask.title}
            </span>
          )}
        </>
      ) : (
        <span className="text-white text-2xl font-bold">P</span>
      )}
      {focus && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/40" />
      )}
    </motion.div>
  )
}
