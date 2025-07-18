import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the cast creation event
    console.log('Cast created webhook received:', JSON.stringify(req.body, null, 2));

    // Here you can process the cast creation event
    // For example, track analytics, send notifications, etc.
    
    const castData = req.body;
    
    // Basic validation
    if (!castData || !castData.data) {
      return res.status(400).json({ error: 'Invalid cast data' });
    }

    // You can add specific logic here based on your app's needs
    // For example:
    // - Track when users share your app
    // - Send rewards for sharing
    // - Update user engagement metrics
    // - Send notifications to shop owners

    return res.status(200).json({ 
      success: true, 
      message: 'Cast creation event processed successfully' 
    });

  } catch (error) {
    console.error('Error processing cast creation webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}