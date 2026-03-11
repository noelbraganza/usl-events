'use client'

import { motion } from 'framer-motion'

interface Props {
  coverImage: string | null
  title: string
}

export default function EventPageClient({ coverImage, title }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl"
    >
      {coverImage ? (
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `
              conic-gradient(
                from 180deg at 50% 50%,
                #905AC0 0deg,
                #D03B6E 90deg,
                #6DDEF7 180deg,
                #E8B840 270deg,
                #905AC0 360deg
              )
            `,
            filter: 'saturate(0.85) brightness(0.95)',
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backdropFilter: 'blur(0px)' }}
          >
            {/* Subtle overlay to soften the gradient */}
            <div className="absolute inset-0 bg-white/10" />
            <span className="relative text-white/90 text-5xl font-bold select-none drop-shadow-lg">
              {title.charAt(0)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
