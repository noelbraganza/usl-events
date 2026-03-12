'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const CDN = 'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/'

const animals = [
  '5fdbcc637c048b16002b8a57_Sharky.avif',
  '5fdbcc650d32d44b9d92a4c7_Owlie.avif',
  '5fdbcc67054e8e3ba1e8007f_Kittykat.avif',
  '5fdbcc6a7ac0d8d48593313e_BunnyHoney.avif',
  '5fdbcc6ca026ba567f345368_FrogDestroyer.avif',
  '6231ac0372a11ceb1506b829_Duckorn.avif',
]

const USL_WORDMARK = `${CDN}5fdbc077c5dde892e98cc900_USL.svg`

export default function BrandAnimals() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % animals.length)
        setVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[50px] h-[50px]">
        <Image
          src={`${CDN}${animals[current]}`}
          alt="USL mascot"
          width={50}
          height={50}
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}
          unoptimized
        />
      </div>
      <Image
        src={USL_WORDMARK}
        alt="USL"
        width={48}
        height={20}
        unoptimized
      />
    </div>
  )
}
