/**
 * Script para gerar ícones do PWA TicketFlow
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')

// Criar diretório se não existir
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true })
  console.log('✅ Criado diretório /public/icons/')
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcon(size) {
  const radius = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.36)
  const padding = Math.round(size * 0.12)

  // SVG com fundo violeta, cantos arredondados e texto "TF"
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="rounded">
          <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
        </clipPath>
      </defs>
      
      <!-- Fundo gradiente primário -->
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6"/>
          <stop offset="100%" style="stop-color:#6D28D9"/>
        </linearGradient>
      </defs>
      
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
      
      <!-- Detalhe decorativo sutil -->
      <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.25}" fill="white" fill-opacity="0.07"/>
      <circle cx="${size * 0.15}" cy="${size * 0.85}" r="${size * 0.2}" fill="white" fill-opacity="0.05"/>
      
      <!-- Ícone de ingresso simplificado -->
      <rect x="${padding}" y="${size * 0.35}" width="${size - padding * 2}" height="${size * 0.3}" 
            rx="${size * 0.04}" fill="white" fill-opacity="0.15"/>
      
      <!-- Texto "TF" -->
      <text
        x="${size / 2}"
        y="${size / 2 + fontSize * 0.35}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        fill="white"
        text-anchor="middle"
        letter-spacing="-${Math.round(fontSize * 0.05)}"
      >TF</text>
    </svg>
  `

  const outputPath = join(iconsDir, `icon-${size}x${size}.png`)

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)

  console.log(`✅ Gerado: icon-${size}x${size}.png`)
}

async function main() {
  console.log('\n🎨 Gerando ícones do TicketFlow PWA...\n')

  for (const size of sizes) {
    await generateIcon(size)
  }

  console.log('\n🚀 Todos os ícones foram gerados em /public/icons/\n')
}

main().catch((err) => {
  console.error('❌ Erro ao gerar ícones:', err)
  process.exit(1)
})
