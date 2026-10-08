import { useMemo } from 'react'
import { finePointer } from '../lib/device'
import { PlushBear, type BearLook } from './PlushBear'
import { isLowEnd, StageShell } from './stage'

export default function BearStage({ look, className, hint, onReady }: { look: BearLook; className?: string; hint?: string; onReady?: () => void }) {
  const shells = useMemo(() => (isLowEnd() ? 22 : 32), [])
  const text = hint ?? (finePointer() ? 'Arraste para girar · clique para abraçar' : 'Arraste para girar · toque para abraçar')
  return (
    <StageShell className={className} hint={text} onReady={onReady} camera={{ position: [0, 1.7, 7.4], fov: 30, target: [0, 1.36, 0] }}>
      {(ctl, onTap) => <PlushBear look={look} ctl={ctl} shells={shells} onTap={onTap} />}
    </StageShell>
  )
}
