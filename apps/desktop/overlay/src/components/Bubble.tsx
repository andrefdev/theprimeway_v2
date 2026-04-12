import { motion } from 'motion/react'

export function Bubble() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-18 h-18 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
    >
      <div className="text-white text-2xl font-bold">P</div>
    </motion.div>
  )
}
