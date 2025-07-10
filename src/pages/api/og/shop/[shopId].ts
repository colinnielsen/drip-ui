import { NextApiRequest, NextApiResponse } from 'next';
import ShopService from '@/services/ShopService';
import { UUID } from '@/data-model/_common/type/CommonType';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { shopId } = req.query;

    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }

    // Get shop data
    const shop = await ShopService.findById(shopId as UUID);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Generate SVG for the OG image
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#D2691E;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Coffee pattern overlay -->
        <circle cx="100" cy="100" r="30" fill="#654321" opacity="0.1"/>
        <circle cx="1100" cy="100" r="25" fill="#654321" opacity="0.1"/>
        <circle cx="150" cy="530" r="35" fill="#654321" opacity="0.1"/>
        <circle cx="1050" cy="530" r="20" fill="#654321" opacity="0.1"/>
        
        <!-- Main content area -->
        <rect x="80" y="120" width="1040" height="390" rx="20" fill="#fff" opacity="0.95" filter="url(#shadow)"/>
        
        <!-- Header -->
        <text x="600" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#8B4513">
          ☕ Drip Coffee
        </text>
        
        <!-- Shop name -->
        <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#2C1810">
          ${shop.label}
        </text>
        
        <!-- Call to action -->
        <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#654321">
          Buy a coffee from ${shop.label}
        </text>
        
        <!-- Tagline -->
        <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#8B4513">
          Fresh coffee delivered through blockchain technology
        </text>
        
        <!-- Bottom decoration -->
        <rect x="450" y="450" width="300" height="4" rx="2" fill="#D2691E"/>
        
        <!-- Coffee cup icon -->
        <g transform="translate(520, 460)">
          <ellipse cx="40" cy="35" rx="35" ry="30" fill="#8B4513" opacity="0.8"/>
          <ellipse cx="40" cy="32" rx="30" ry="25" fill="#D2691E"/>
          <ellipse cx="40" cy="28" rx="25" ry="20" fill="#F5DEB3"/>
          <path d="M 65 25 Q 75 25 75 35 Q 75 45 65 45" stroke="#8B4513" stroke-width="3" fill="none"/>
        </g>
        
        <!-- Powered by text -->
        <text x="600" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#654321" opacity="0.8">
          Powered by Farcaster Mini Apps
        </text>
      </svg>
    `;

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return res.send(svg);
  } catch (error) {
    console.error('Error generating OG image:', error);
    return res.status(500).json({ error: 'Failed to generate OG image' });
  }
}