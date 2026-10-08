import { finePointer } from '../lib/device'
import { BubbleBalloon, type BubbleLook } from './BubbleBalloon'
import { StageShell } from './stage'

export default function BubbleStage({ look, className, hint, onReady }: { look: BubbleLook; className?: string; hint?: string; onReady?: () => void }) {
  const text = hint ?? (finePointer() ? 'Arraste para girar · clique no balão' : 'Arraste para girar · toque no balão')
  return (
    <StageShell className={className} hint={text} onReady={onReady} shadowY={-1.25} camera={{ position: [0, 0.2, 6], fov: 32, target: [0, 0.2, 0] }}>
      {(ctl, onTap) => <BubbleBalloon look={look} ctl={ctl} onTap={onTap} />}
    </StageShell>
  )
}
