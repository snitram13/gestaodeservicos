/** Gera os ícones PWA (PNG) a partir de SVG. npx tsx scripts/gen-icons.ts */
import { mkdir } from "node:fs/promises"

import sharp from "sharp"

const WRENCH =
  '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><g transform="translate(136,136) scale(10)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${WRENCH}</g></svg>`

const MASKABLE = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2563eb"/><g transform="translate(166,166) scale(7.5)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${WRENCH}</g></svg>`

async function main() {
  await mkdir("public/icons", { recursive: true })
  await sharp(Buffer.from(ICON)).resize(192, 192).png().toFile("public/icons/icon-192.png")
  await sharp(Buffer.from(ICON)).resize(512, 512).png().toFile("public/icons/icon-512.png")
  await sharp(Buffer.from(MASKABLE)).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png")
  await sharp(Buffer.from(ICON)).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png")
  console.log("✅ Ícones PWA gerados em public/icons/")
}

main().catch((e) => {
  console.error("❌ Erro:", e)
  process.exit(1)
})
