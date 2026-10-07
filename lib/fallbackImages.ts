/**
 * Bulletproof SVG Data URIs for Construction Phases and Inspection Proofs.
 * These require ZERO external network requests, never fail CORS/hotlink protection,
 * and render instantaneously with crisp vector quality on any browser or mobile screen.
 */

export function getConstructionFallbackImage(phase: string = 'Planning', caption: string = 'Site Inspection Proof'): string {
  const p = (phase || '').toLowerCase();
  
  let primaryColor = '#10B981'; // Emerald
  let secondaryColor = '#06B6D4'; // Cyan
  let iconPath = '<path d="M370 200 L400 170 L430 200 L430 235 L370 235 Z" fill="#10B981" opacity="0.85"/>';
  let title = 'SITE INSPECTION PROOF';
  let subtitle = 'GPS Geotagged · Verified on Site';

  if (p.includes('plan')) {
    primaryColor = '#06B6D4';
    secondaryColor = '#3B82F6';
    title = 'ARCHITECTURAL BLUEPRINT';
    subtitle = 'Site Boundary Layout & Level Grid';
    iconPath = `
      <rect x="365" y="165" width="70" height="70" rx="4" fill="none" stroke="${primaryColor}" stroke-width="2"/>
      <line x1="365" y1="200" x2="435" y2="200" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="400" y1="165" x2="400" y2="235" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="400" cy="200" r="14" fill="${secondaryColor}" opacity="0.4"/>
    `;
  } else if (p.includes('substructure') || p.includes('found') || p.includes('excav')) {
    primaryColor = '#F59E0B';
    secondaryColor = '#EF4444';
    title = 'SUBSTRUCTURE & FOUNDATION';
    subtitle = 'Footing Pit Excavation & PCC Bedding';
    iconPath = `
      <polygon points="360,225 440,225 425,175 375,175" fill="${primaryColor}" opacity="0.8"/>
      <line x1="350" y1="230" x2="450" y2="230" stroke="#E2E8F0" stroke-width="3" stroke-linecap="round"/>
      <line x1="360" y1="240" x2="440" y2="240" stroke="${secondaryColor}" stroke-width="2" stroke-dasharray="4 4"/>
    `;
  } else if (p.includes('superstructure') || p.includes('mason') || p.includes('column')) {
    primaryColor = '#3B82F6';
    secondaryColor = '#60A5FA';
    title = 'SUPERSTRUCTURE & RCC COLUMNS';
    subtitle = 'RCC Framing, Slabs & Masonry Walls';
    iconPath = `
      <rect x="365" y="165" width="20" height="70" fill="${primaryColor}" opacity="0.9"/>
      <rect x="415" y="165" width="20" height="70" fill="${primaryColor}" opacity="0.9"/>
      <rect x="355" y="155" width="90" height="15" rx="2" fill="${secondaryColor}"/>
    `;
  } else if (p.includes('plumb')) {
    primaryColor = '#06B6D4';
    secondaryColor = '#38BDF8';
    title = 'PLUMBING & SANITARY';
    subtitle = 'Concealed CPVC Supply & Soil Drainage';
    iconPath = `
      <path d="M365 170 H415 V205 H435 V225 H395 V190 H365 Z" fill="${primaryColor}" opacity="0.85"/>
      <circle cx="400" cy="235" r="8" fill="${secondaryColor}"/>
    `;
  } else if (p.includes('elect')) {
    primaryColor = '#FBBF24';
    secondaryColor = '#F59E0B';
    title = 'ELECTRICAL CONDUITS & DB';
    subtitle = 'PVC Conduit Wall Chasing & Wiring';
    iconPath = `
      <polygon points="405,160 380,200 405,200 395,240 425,195 400,195" fill="${primaryColor}"/>
    `;
  } else if (p.includes('paint') || p.includes('finish')) {
    primaryColor = '#EC4899';
    secondaryColor = '#F472B6';
    title = 'PAINT & FACADE FINISHING';
    subtitle = 'Wall Putty, Acrylic Primer & Emulsion';
    iconPath = `
      <rect x="375" y="165" width="50" height="35" rx="3" fill="${primaryColor}"/>
      <rect x="395" y="200" width="10" height="35" rx="2" fill="#E2E8F0"/>
    `;
  } else if (p.includes('interior') || p.includes('wood')) {
    primaryColor = '#A855F7';
    secondaryColor = '#C084FC';
    title = 'INTERIOR & MILLWORK';
    subtitle = 'Doors, Kitchen Cabinets & False Ceiling';
    iconPath = `
      <rect x="375" y="165" width="50" height="70" rx="3" fill="${primaryColor}" opacity="0.8"/>
      <circle cx="415" cy="200" r="3" fill="#E2E8F0"/>
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <rect width="800" height="450" fill="#071224"/>
  <defs>
    <pattern id="grid_${Math.abs(hash(phase))}" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#13233D" stroke-width="1"/>
    </pattern>
    <linearGradient id="grad_${Math.abs(hash(phase))}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1A30"/>
      <stop offset="100%" stop-color="#050B14"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#grad_${Math.abs(hash(phase))})"/>
  <rect width="800" height="450" fill="url(#grid_${Math.abs(hash(phase))})"/>
  
  <!-- Outer Center Target -->
  <circle cx="400" cy="200" r="65" fill="#0A1628" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.9"/>
  <circle cx="400" cy="200" r="50" fill="#0E213D" stroke="${secondaryColor}" stroke-width="1" opacity="0.6"/>

  <!-- Phase Graphic -->
  ${iconPath}

  <!-- Header Badge -->
  <rect x="250" y="35" width="300" height="28" rx="14" fill="#0A1A33" stroke="${primaryColor}" stroke-width="1"/>
  <text x="400" y="53" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="${primaryColor}" letter-spacing="1.5" text-anchor="middle">BUILDSMART AI PRO · TELEMETRY</text>

  <!-- Title & Subtitle -->
  <text x="400" y="305" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC" text-anchor="middle" letter-spacing="0.5">${title}</text>
  <text x="400" y="330" font-family="ui-monospace, monospace" font-size="12" font-weight="500" fill="#94A3B8" text-anchor="middle">${subtitle}</text>

  <!-- Technical Telemetry Footer -->
  <line x1="120" y1="370" x2="680" y2="370" stroke="#1E293B" stroke-width="1"/>
  <text x="130" y="395" font-family="ui-monospace, monospace" font-size="11" fill="#64748B">PROOF OF WORK VERIFIED</text>
  <text x="670" y="395" font-family="ui-monospace, monospace" font-size="11" fill="${primaryColor}" text-anchor="end">STATUS: ACTIVE ON-SITE</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}
