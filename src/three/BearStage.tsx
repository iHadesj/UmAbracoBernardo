import { useMemo } from 'react'
import { finePointer } from '../lib/device'
import { loadBearParts, useBearParts } from './bearParts'
import { PlushBear, type BearLook } from './PlushBear'
import { isLowEnd, StageShell } from './stage'

// começa a gerar a malha assim que este pedaço (o 3D) é baixado
void loadBearParts()

export default function BearStage({ look, className, hint, onReady }: { look: BearLook; className?: string; hint?: string; onReady?: () => void }) {
  const shells = useMemo(() => (isLowEnd() ? 24 : 32), [])
  const parts = useBearParts()
  const text = hint ?? (finePointer() ? 'Arraste para girar · clique para abraçar' : 'Arraste para girar · toque para abraçar')
  // até a malha ficar pronta, a ilustração continua no lugar (ProductStage)
  if (!parts) return null
  return (
    <StageShell className={className} hint={text} onReady={onReady} camera={{ position: [0, 1.7, 7.4], fov: 30, target: [0, 1.36, 0] }}>
      {(ctl, onTap) => <PlushBear parts={parts} look={look} ctl={ctl} shells={shells} onTap={onTap} />}
    </StageShell>
  )
}
