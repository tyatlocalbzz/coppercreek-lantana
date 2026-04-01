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
    const clean = (value, max = 2000) =>
      String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .slice(0, max);

    const {
      name = '',
      email = '',
      phone = '',
      preferred_time = '',
      notes = '',
      website = '',
      source = 'Lantana Landing Page',
    } = req.body || {};

    const safeName = clean(name, 120);
    const safeEmail = clean(email, 160).toLowerCase();
    const safePhone = clean(phone, 40);
    const safePreferredTime = clean(preferred_time, 160);
    const safeNotes = clean(notes, 4000);
    const safeWebsite = clean(website, 120);
    const safeSource = clean(source, 120) || 'Lantana Landing Page';

    if (safeWebsite) {
      return res.status(200).json({ success: true });
    }

    if (!safeName || !safeEmail || !safePhone || !safePreferredTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (safePhone.replace(/[^\d]/g, '').length < 10) {
      return res.status(400).json({ error: 'Invalid phone' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const lines = [
      'COPPER CREEK LANTANA TOUR REQUEST',
      '=================================',
      '',
      `NAME: ${safeName}`,
      `EMAIL: ${safeEmail}`,
      `PHONE: ${safePhone}`,
      `PREFERRED TIME: ${safePreferredTime}`,
      '',
    ];

    if (safeNotes) {
      lines.push('NOTES:');
      lines.push(safeNotes);
      lines.push('');
    }

    lines.push(`SOURCE: ${safeSource}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Copper Creek Tours <noreply@localbzz.com>',
        to: ['ty@localbzz.com'],
        subject: `Copper Creek Tour Request — ${safeName}`,
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
