// ================================================
// Backend Vercel — Stripe + Airtable
// Lasers Expert — Formation Épilation Laser
// ================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AT_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// ── Écrire une réservation dans Airtable ──
async function saveReservation(data) {
  const res = await fetch(`${AT_URL}/Reservations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        Nom:             data.nom,
        Email:           data.email,
        Telephone:       data.telephone,
        Profession:      data.profession || '',
        Tarif:           data.tarif,
        SessionDates:    data.session_dates,
        SessionId:       data.session_id || '',
        Statut:          'Confirmé',
        DateReservation: new Date().toISOString().split('T')[0],
        StripePaymentId: data.payment_intent_id,
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Airtable error: ' + err);
  }
  return res.json();
}

// ── Décrémenter les places dans la table Sessions ──
async function decrementSession(sessionId) {
  if (!sessionId) return;

  // Récupérer la session actuelle
  const res = await fetch(`${AT_URL}/Sessions/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
  });
  if (!res.ok) return;
  const record = await res.json();
  const currentTaken = record.fields.Taken || 0;

  // Mettre à jour
  await fetch(`${AT_URL}/Sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { Taken: currentTaken + 1 } })
  });
}

// ── Handler principal ──
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const {
    amount, currency = 'eur',
    customer_email, customer_name, customer_phone, customer_profession,
    session_dates, session_id, tarif_type, tarif_amount
  } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  try {
    // 1. Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: customer_email,
      metadata: {
        nom:           customer_name   || '',
        email:         customer_email  || '',
        telephone:     customer_phone  || '',
        profession:    customer_profession || '',
        session_dates: session_dates   || '',
        session_id:    session_id      || '',
        tarif_type:    tarif_type      || 'standard',
        formation:     'Épilation Laser — Lasers Expert',
      },
    });

    // 2. Enregistrer dans Airtable + décrémenter places
    //    (on le fait ici à titre préventif — idéalement via webhook Stripe
    //     pour être sûr que le paiement est bien passé)
    try {
      await saveReservation({
        nom:               customer_name,
        email:             customer_email,
        telephone:         customer_phone,
        profession:        customer_profession,
        tarif:             tarif_amount || (amount / 100),
        session_dates:     session_dates,
        session_id:        session_id,
        payment_intent_id: paymentIntent.id,
      });
      await decrementSession(session_id);
    } catch (atError) {
      // On ne bloque pas le paiement si Airtable échoue
      console.error('Airtable warning:', atError.message);
    }

    // 3. Retourner le clientSecret au widget
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Stripe error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
