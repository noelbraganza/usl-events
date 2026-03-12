'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const animals = [
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/6231ac0372a11ceb1506b829_Duckorn.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fe0cd2980460ca0bd0d3202_Sharky_USL.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc6ca026ba567f345368_FrogDestroyer.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc650d32d44b9d92a4c7_Owlie.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc67054e8e3ba1e8007f_Kittykat.avif',
  'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbcc6a7ac0d8d48593313e_BunnyHoney.avif',
]

const USL_WORDMARK = 'https://cdn.prod.website-files.com/5bd5a72a5a6dba8eece24cfd/5fdbc077c5dde892e98cc900_USL.svg'

export default function BrandAnimals() {
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * animals.length))
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
          src={animals[current]}
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
        style={{ minWidth: '120px' }}
        unoptimized
      />
    </div>
  )
}
