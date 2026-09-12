"use client"

import { Toaster } from "sonner"

/**
 * Client-only wrapper around sonner Toaster.
 * Importing Toaster directly in a Server Component layout can break
 * Next.js webpack HMR in cloud/dev with:
 * "Cannot read properties of undefined (reading 'call')".
 */
export default function AppToaster() {
  return <Toaster richColors position="top-center" closeButton />
}
