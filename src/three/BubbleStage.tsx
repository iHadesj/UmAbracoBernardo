import { BubbleBalloon, type BubbleLook } from './BubbleBalloon'
import { StageShell } from './stage'

export default function BubbleStage({ look, className, hint = 'Arraste para girar · toque no balão' }: { look: BubbleLook; className?: string; hint?: string }) {
  return (
    <StageShell className={className} hint={hint} shadowY={-1.25} camera={{ position: [0, 0.2, 6], fov: 32, target: [0, 0.2, 0] }}>
      {(ctl, onTap) => <BubbleBalloon look={look} ctl={ctl} onTap={onTap} />}
    </StageShell>
  )
}
