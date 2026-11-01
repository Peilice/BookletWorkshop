/// <reference types="vite/client" />

// Local Font Access（Chrome、Edge）：TypeScript 內建型別還沒有
interface Window {
  queryLocalFonts?: () => Promise<{ family: string; fullName: string; postscriptName: string }[]>
}
