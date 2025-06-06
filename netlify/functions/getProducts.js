const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?pageSize=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`
    }
  });
  const data = await res.json();
  // On parse le prix pour obtenir un nombre
  const products = data.records.map(r => ({
    id: r.id,
    ...r.fields,
    Prix: typeof r.fields.Prix === 'number'
      ? r.fields.Prix
      : parseFloat((r.fields.Prix || '0').replace('€', '').replace(',', '.'))
  }));
  return {
    statusCode: 200,
    body: JSON.stringify(products)
  };
}; 