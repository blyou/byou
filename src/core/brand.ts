import type { Component, ComponentInstance } from './component.type'

export const tag = <T, S extends symbol>(obj: T, key: S): T & { [K in S]: boolean } =>
  Object.defineProperty(obj, key, { value: true }) as T & { [K in S]: boolean }

export const COMPONENT = Symbol('byou:component')
export const COMPONENT_INSTANCE = Symbol('byou:component-node')

export const isComponent = (fn: any): fn is Component => typeof fn === 'function' && fn[COMPONENT]
export const isComponentInstance = (value: any): value is ComponentInstance =>
  value && value[COMPONENT_INSTANCE]
