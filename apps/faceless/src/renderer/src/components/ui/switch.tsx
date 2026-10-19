import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@renderer/lib/utils'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props): React.JSX.Element {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent outline-none transition-all translate-x-0',
        'bg-input data-[checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
          'translate-x-0.5 data-[checked]:translate-x-[18px]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
