'use client'

import { type FC } from 'react'

import { HelpIcon } from '../../assets/icons'
import { FOOTER_ICON_SIZE_PX } from '../../constants'
import { openHelpChat } from './openHelpChat'

export const HelpButton: FC = () => (
  <button
    aria-label="Hulp nodig? Start chat"
    className="help-btn"
    onClick={openHelpChat}
    title="Hulp nodig? Start chat"
    type="button"
  >
    <HelpIcon height={FOOTER_ICON_SIZE_PX} width={FOOTER_ICON_SIZE_PX} />
  </button>
)
