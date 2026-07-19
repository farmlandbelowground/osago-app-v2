import Image from 'next/image'
import { type FC } from 'react'

import logo from '@shared/assets/logo.png'

export const Logo: FC = () => {
  return (
    <div className="logo">
      <Image alt="Osago" priority src={logo} />
    </div>
  )
}
