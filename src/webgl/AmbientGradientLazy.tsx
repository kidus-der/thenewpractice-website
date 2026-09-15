'use client'

/**
 * The only public entry to the ambient gradient. docs/04 §8, docs/07.
 *
 * Renders nothing on the server, nothing until mounted, and nothing unless
 * useAmbientEligible() says yes — so the three/R3F/shadergradient chunk is
 * never requested on a phone, under reduced motion, on a data-saver
 * connection or without WebGL2. The chunk belongs to whichever route mounts
 * this component; today that is `/` alone (docs/04 §8).
 */
import dynamic from 'next/dynamic'
import { useAmbientEligible } from './useAmbientEligible'

const AmbientGradient = dynamic(() => import('./AmbientGradient').then((m) => m.AmbientGradient), {
  ssr: false,
  loading: () => null,
})

type Props = Readonly<{
  className?: string
  opacity?: number
}>

export function AmbientGradientLazy(props: Props) {
  const eligible = useAmbientEligible()
  if (!eligible) return null
  return <AmbientGradient {...props} />
}
