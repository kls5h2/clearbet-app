const sharp = require('sharp');
const path = require('path');

const width = 1200;
const height = 160;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0E0E0E"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="56"
    font-weight="400"
  >
    <tspan fill="#F7F5F0" font-weight="700" font-style="normal">Raw</tspan><tspan fill="#8A8A86" font-style="normal">Intel</tspan><tspan fill="#D93B3A" font-style="normal">.</tspan>
  </text>
</svg>
`;

const outputPath = path.join(__dirname, '../public/email-banner.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath)
  .then(() => console.log(`Written: ${outputPath}`))
  .catch(err => { console.error(err); process.exit(1); });
