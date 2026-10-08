import { useMemo } from 'react'
import { PlushBear, type BearLook } from './PlushBear'
import { isLowEnd, StageShell } from './stage'

export default function BearStage({ look, className, hint = 'Arraste para girar · toque para abraçar' }: { look: BearLook; className?: string; hint?: string }) {
  const shells = useMemo(() => (isLowEnd() ? 22 : 32), [])
  return (
    <StageShell className={className} hint={hint} camera={{ position: [0, 1.7, 7.4], fov: 30, target: [0, 1.36, 0] }}>
      {(ctl, onTap) => <PlushBear look={look} ctl={ctl} shells={shells} onTap={onTap} />}
    </StageShell>
  )
}
