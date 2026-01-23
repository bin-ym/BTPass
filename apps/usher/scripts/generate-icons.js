// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svg192 = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#000000"/>
  <text x="96" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#FFFFFF" text-anchor="middle">BT</text>
</svg>`;

const svg512 = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="#FFFFFF" text-anchor="middle">BT</text>
</svg>`;

// For PWA, we need PNG. Let's create a simple approach using sharp or just use SVG
// Since we can't install packages easily, let's create a simple HTML file that can generate PNGs
// Or we can use an online service

// For now, let's create a simple HTML file that generates the icons
const htmlGenerator = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
</head>
<body>
  <canvas id="canvas192" width="192" height="192"></canvas>
  <canvas id="canvas512" width="512" height="512"></canvas>
  <script>
    function generateIcon(size, canvasId) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');
      
      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      // White text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold ' + (size * 0.4) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BT', size / 2, size / 2);
      
      // Download
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon-' + size + '.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    
    generateIcon(192, 'canvas192');
    setTimeout(() => generateIcon(512, 'canvas512'), 500);
  </script>
</body>
</html>`;

// Write the HTML generator
const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'generate-icons.html'), htmlGenerator);

console.log('Icon generator HTML created at public/generate-icons.html');
console.log('Open it in a browser to generate the PNG icons');
console.log('');
console.log('Alternatively, you can use an online tool like:');
console.log('https://realfavicongenerator.net/');
console.log('or create simple 192x192 and 512x512 PNG files with "BT" text');
