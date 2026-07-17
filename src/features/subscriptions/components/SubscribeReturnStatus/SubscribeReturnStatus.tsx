import Link from 'next/link'
import { type FC } from 'react'

import { ABONNEMENT_AFSLUITEN_PATH } from '../../constants'
import { type Props } from './types'

export const SubscribeReturnStatus: FC<Props> = ({ error }) => {
  return (
    <div
      className={`
        mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center
      `}
    >
      <div
        className={`
          flex h-14 w-14 items-center justify-center rounded-full
          bg-destructive/10 text-2xl text-destructive
        `}
      >
        !
      </div>
      <h2 className="font-serif text-xl font-medium text-foreground">
        Abonnement kon niet worden geactiveerd
      </h2>
      <p className="text-[13.5px] text-muted-foreground">
        De betaling is voltooid, maar de activatie is nog niet doorgekomen. Klik
        opnieuw om te herproberen — dat is veilig en dubbele activatie is niet
        mogelijk.
      </p>
      {error && (
        <p
          className={`
            rounded-md bg-muted px-3 py-2 font-mono text-xs
            text-muted-foreground
          `}
        >
          {error}
        </p>
      )}
      <Link
        className={`
          inline-flex items-center justify-center rounded-md bg-primary px-4
          py-2.5 text-sm font-semibold text-primary-foreground transition
          hover:bg-primary-hover
        `}
        href={`${ABONNEMENT_AFSLUITEN_PATH}?paid=1`}
      >
        Opnieuw proberen
      </Link>
    </div>
  )
}
