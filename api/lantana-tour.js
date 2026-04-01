export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name = '',
      email = '',
      phone = '',
      preferred_time = '',
      notes = '',
      source = 'Lantana Landing Page',
    } = req.body || {};

    if (!name || !email || !phone || !preferred_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lines = [
      'COPPER CREEK LANTANA TOUR REQUEST',
      '=================================',
      '',
      `NAME: ${name}`,
      `EMAIL: ${email}`,
      `PHONE: ${phone}`,
      `PREFERRED TIME: ${preferred_time}`,
      '',
    ];

    if (notes) {
      lines.push('NOTES:');
      lines.push(notes);
      lines.push('');
    }

    lines.push(`SOURCE: ${source}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Copper Creek Tours <noreply@localbzz.com>',
        to: [
          'sales@coppercreekluxuryhomes.com',
          'jeff@localbzz.com',
          'ty@localbzz.com',
        ],
        subject: `Copper Creek Tour Request — ${name}`,
        text: lines.join('\n'),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: 'Failed to send email', details: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
