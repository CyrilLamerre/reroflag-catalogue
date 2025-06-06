const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_QUOTE_TABLE;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  const data = JSON.parse(event.body);

  // Prépare les champs à enregistrer (adapter selon ta table Devis)
  const fields = {
    Date: new Date().toISOString(),
    Nom: data.lastname,
    Prénom: data.firstname,
    Email: data.email,
    Téléphone: data.phone,
    Société: data.company,
    Total: data.total,
    Sélection: JSON.stringify(data.selection)
  };

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  const result = await res.json();

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}; 