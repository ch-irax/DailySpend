/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react'
  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }
  export function createRoot(container: Element | DocumentFragment): Root
  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: ReactNode): Root
}
