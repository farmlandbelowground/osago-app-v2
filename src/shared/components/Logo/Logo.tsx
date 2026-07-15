import Image from 'next/image'
import { type FC } from 'react'

import logo from '@shared/assets/logo.png'
import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const Logo: FC<Props> = ({ className, inverted = false }) => {
  return (
    <Image
      alt="Osago"
      className={cn(
        'h-7 w-[87px] shrink-0',
        inverted && 'brightness-0 invert',
        className,
      )}
      priority
      src={logo}
    />
  )
}
