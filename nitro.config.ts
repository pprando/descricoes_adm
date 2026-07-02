import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  // Configura o Nitro para rodar no Cloudflare Pages/Workers
  runtime: {
    cloudflare: {
      binding: 'DB'
    }
  },

  // Preset para Cloudflare Pages
  preset: 'cloudflare-pages',

  // Headers CORS para desenvolvimento local
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
})
