import {
  RingIcon,
  NecklaceIcon,
  EarringIcon,
  PendantIcon,
  BraceletIcon,
  BroochIcon,
  CoinIcon,
  GemIcon,
} from '@/components/Icons'

const MAP: Record<string, any> = {
  Ringar: RingIcon,
  Halsband: NecklaceIcon,
  Örhängen: EarringIcon,
  Hängen: PendantIcon,
  Armband: BraceletIcon,
  Broscher: BroochIcon,
  Mynt: CoinIcon,
  Övrigt: GemIcon,
}

export default function CategoryIcon({
  category,
  size,
  className,
  strokeWidth,
}: {
  // Null tillåts: items.category är nullable i databasen, och raden nedan
  // faller redan tillbaka på GemIcon för tomt värde.
  category?: string | null
  size?: number
  className?: string
  strokeWidth?: number
}) {
  const Icon = (category && MAP[category]) || GemIcon
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />
}
