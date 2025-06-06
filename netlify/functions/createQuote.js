const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_QUOTE_TABLE;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    console.error('Erreur de parsing JSON:', err, event.body);
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Conversion du total en nombre (float)
  let total = data.total;
  if (typeof total === 'string') {
    total = total.replace(/[^0-9.,-]/g, '').replace(',', '.');
    total = parseFloat(total);
  }
  if (isNaN(total)) total = 0;

  // Prépare les champs à enregistrer (adapter selon ta table Devis)
  const fields = {
    Date: new Date().toISOString(),
    Nom: data.lastname,
    Prénom: data.firstname,
    Email: data.email,
    Téléphone: data.phone,
    Société: data.company,
    Total: total
    // Devis PDF sera ajouté plus bas si besoin
  };

  // Upload du PDF sur file.io si présent
  let pdfUrl = null;
  if (data.pdfBase64) {
    try {
      const uploadRes = await fetch('https://file.io/?expires=1d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from(data.pdfBase64, 'base64')
      });
      const uploadJson = await uploadRes.json();
      if (uploadJson.success && uploadJson.link) {
        pdfUrl = uploadJson.link;
        fields['Devis PDF'] = [ { url: pdfUrl } ];
      } else {
        console.error('Erreur upload PDF file.io:', uploadJson);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Erreur upload PDF file.io', details: uploadJson })
        };
      }
    } catch (err) {
      console.error('Erreur upload PDF file.io:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erreur upload PDF file.io', details: err.message })
      };
    }
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`;
  let res, result;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    result = await res.json();
    if (!res.ok) {
      console.error('Airtable API error:', res.status, result);
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: 'Airtable API error', details: result })
      };
    }
  } catch (err) {
    console.error('Erreur lors de la requête Airtable:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la requête Airtable', details: err.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}; 