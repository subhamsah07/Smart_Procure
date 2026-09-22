import fs from 'fs';
import path from 'path';

// Generate seamless botanical halftone pattern inspired by the uploaded crop & wheat halftone reference
function generateHalftoneSvg({
  width = 600,
  height = 600,
  dotColor = '#059669',
  stemColor = '#10b981',
  baseDotOpacity = 0.08,
  featureDotOpacity = 0.22,
  tintBg = 'transparent',
}) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  
  if (tintBg !== 'transparent') {
    svg += `  <rect width="${width}" height="${height}" fill="${tintBg}" />\n`;
  }

  // 1. Regular background halftone stipple matrix (subtle angle)
  const step = 14;
  svg += `  <g fill="${dotColor}">\n`;

  // Define mathematical curves for wheat stalks and foliage
  // Stalk 1 (diagonal main wheat stalk with spikelets)
  // Stalk 2 (side curved crop blade)
  // Stalk 3 (rising tall grain ears)
  for (let y = 0; y <= height; y += step) {
    for (let x = 0; x <= width; x += step) {
      // Rotate coordinates slightly for classic 45-deg or 30-deg halftone screen
      const rotX = (x * 0.866 - y * 0.5 + width) % width;
      const rotY = (x * 0.5 + y * 0.866 + height) % height;

      // Distance to foliage features:
      // Feature A: Diagonal wheat ear clusters rising from bottom-left to top-right
      const lineDist1 = Math.abs(y - (height - (x * 0.95)));
      // Feature B: Secondary wheat ear curving at right
      const lineDist2 = Math.abs(x - (width - 120 + Math.sin(y / 45) * 40));
      // Feature C: Arched leaves curving across top right
      const leafCurve1 = Math.abs(y - (100 + Math.sin(x / 60) * 80 + (x * 0.4)));
      const leafCurve2 = Math.abs(y - (height - 80 - Math.cos(x / 70) * 90 - (x * 0.2)));

      // Calculate grain/seed head periodic clusters along stalk 1
      const grainPeriod = (x + y) % 28;
      const isGrainCluster = lineDist1 < 45 && grainPeriod < 16;

      let radius = 0.7;
      let opacity = baseDotOpacity;

      if (isGrainCluster) {
        radius = 2.4 - (lineDist1 / 45) * 1.5;
        opacity = featureDotOpacity;
      } else if (lineDist1 < 30) {
        radius = 1.6;
        opacity = featureDotOpacity * 0.8;
      } else if (lineDist2 < 35) {
        const seg = y % 32;
        if (seg < 18) {
          radius = 2.2 - (lineDist2 / 35) * 1.3;
          opacity = featureDotOpacity * 0.85;
        } else {
          radius = 1.3;
          opacity = featureDotOpacity * 0.5;
        }
      } else if (leafCurve1 < 25) {
        radius = 1.8 - (leafCurve1 / 25) * 1.1;
        opacity = featureDotOpacity * 0.7;
      } else if (leafCurve2 < 28) {
        radius = 1.9 - (leafCurve2 / 28) * 1.2;
        opacity = featureDotOpacity * 0.65;
      } else {
        // Ambient background stipple with organic noise
        const noise = (Math.sin(x * 0.05) * Math.cos(y * 0.05) + 1) / 2;
        if (noise > 0.65) {
          radius = 1.1;
          opacity = baseDotOpacity * 1.4;
        } else {
          radius = 0.75;
          opacity = baseDotOpacity;
        }
      }

      // Halftone dot
      svg += `    <circle cx="${x}" cy="${y}" r="${radius.toFixed(2)}" opacity="${opacity.toFixed(3)}" />\n`;
    }
  }
  svg += `  </g>\n`;

  // 2. Delicate botanical awns and leaf striae (vector grain bristles)
  svg += `  <g stroke="${stemColor}" stroke-linecap="round" fill="none">\n`;
  // Wheat bristles/awns (delicate angled hairs characteristic of wheat spikelets)
  for (let i = 0; i < 18; i++) {
    const sx = 100 + i * 24;
    const sy = height - (sx * 0.95);
    if (sy > 40 && sy < height - 40 && sx < width - 40) {
      // Left awn
      svg += `    <path d="M ${sx} ${sy} Q ${sx - 15} ${sy - 25} ${sx - 28} ${sy - 42}" stroke-width="0.85" opacity="${(featureDotOpacity * 0.6).toFixed(3)}" stroke-dasharray="2 3" />\n`;
      // Right awn
      svg += `    <path d="M ${sx} ${sy} Q ${sx + 20} ${sy - 20} ${sx + 35} ${sy - 35}" stroke-width="0.85" opacity="${(featureDotOpacity * 0.6).toFixed(3)}" stroke-dasharray="2 3" />\n`;
    }
  }
  // Secondary stalk awns on right side
  for (let j = 0; j < 12; j++) {
    const sy = 80 + j * 32;
    const sx = width - 120 + Math.sin(sy / 45) * 40;
    svg += `    <path d="M ${sx} ${sy} Q ${sx + 22} ${sy - 15} ${sx + 36} ${sy - 28}" stroke-width="0.8" opacity="${(featureDotOpacity * 0.55).toFixed(3)}" stroke-dasharray="2 3" />\n`;
  }
  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

// 1. Light Mode Pattern: Fresh light emerald & sage dots over transparent/light green
const lightSvg = generateHalftoneSvg({
  width: 600,
  height: 600,
  dotColor: '#059669',
  stemColor: '#10b981',
  baseDotOpacity: 0.07,
  featureDotOpacity: 0.24,
});

// 2. Dark Mode Pattern: Luminous subtle emerald/mint stipple dots
const darkSvg = generateHalftoneSvg({
  width: 600,
  height: 600,
  dotColor: '#34d399',
  stemColor: '#10b981',
  baseDotOpacity: 0.05,
  featureDotOpacity: 0.18,
});

const outDir = path.resolve('public/textures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'crop-halftone-light.svg'), lightSvg);
fs.writeFileSync(path.join(outDir, 'crop-halftone-dark.svg'), darkSvg);
console.log('Successfully generated crop-halftone-light.svg and crop-halftone-dark.svg!');
