// Make PostCSS tolerant to missing dev dependencies (e.g., tailwindcss)
let tailwindPlugin = null
let autoprefixerPlugin = null
try {
  tailwindPlugin = require('tailwindcss')
} catch (e) {
  // tailwind not installed — continue without it
}
try {
  autoprefixerPlugin = require('autoprefixer')
} catch (e) {
  // autoprefixer not installed — continue
}

const plugins = {}
if (tailwindPlugin) plugins['tailwindcss'] = {}
if (autoprefixerPlugin) plugins['autoprefixer'] = {}

module.exports = { plugins }
