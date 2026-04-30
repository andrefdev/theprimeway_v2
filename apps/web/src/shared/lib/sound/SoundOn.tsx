import { Children, cloneElement, isValidElement, type ReactElement } from 'react'
import { playSound } from './engine'
import type { SoundKey } from './sounds'

type Trigger = 'click' | 'hover' | 'focus'

const HANDLER_BY_TRIGGER: Record<Trigger, 'onClick' | 'onMouseEnter' | 'onFocus'> = {
  click: 'onClick',
  hover: 'onMouseEnter',
  focus: 'onFocus',
}

interface SoundOnProps {
  on?: Trigger
  sound: SoundKey
  children: React.ReactNode
}

type AnyHandler = (e: unknown) => void
type ChildProps = Record<string, unknown> & { [k: string]: AnyHandler | unknown }

/**
 * Decoupled wrapper: clones single child and composes the chosen event handler
 * so any component (Button, Link, custom) gains a sound trigger without
 * touching its implementation.
 *
 * <SoundOn on="click" sound="uiClick"><Button>Save</Button></SoundOn>
 */
export function SoundOn({ on = 'click', sound, children }: SoundOnProps) {
  const child = Children.only(children)
  if (!isValidElement(child)) return <>{children}</>

  const handlerName = HANDLER_BY_TRIGGER[on]
  const childProps = (child.props ?? {}) as ChildProps
  const existing = childProps[handlerName] as AnyHandler | undefined

  const composed = (e: unknown) => {
    playSound(sound)
    if (typeof existing === 'function') existing(e)
  }

  return cloneElement(child as ReactElement<ChildProps>, {
    [handlerName]: composed,
  } as ChildProps)
}
