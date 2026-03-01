# 🚀 Déployer le backend Vercel en 5 minutes

## Ce que contient ce dossier

```
vercel-backend/
├── api/
│   └── create-payment-intent.js   ← la fonction Stripe + Airtable
├── package.json
└── vercel.json
```

---

## Étapes

### 1. Créer un compte Vercel (gratuit)
→ vercel.com → "Sign up" → connecte avec Apple, GitHub ou Google

### 2. Déployer le dossier
- Va sur vercel.com → "Add New Project"
- Glisse-dépose le dossier vercel-backend
- OU installe Vercel CLI : dans le Terminal tape `npx vercel` dans le dossier

### 3. Ajouter tes 3 variables d'environnement dans Vercel
Sur vercel.com → ton projet → Settings → Environment Variables → ajoute :

```
STRIPE_SECRET_KEY  =  sk_test_51SLke0KAXVNJ977t...   (ta clé secrète Stripe)
AIRTABLE_TOKEN     =  patXXXXXXXXXXXXXX.xxxxxxxx      (ton Personal Access Token Airtable)
AIRTABLE_BASE_ID   =  appXXXXXXXXXXXXXX               (l'ID de ta base Airtable)
```

### 4. Récupérer ton URL backend
Vercel te donne une URL du style :
```
https://lasers-expert-backend.vercel.app
```

### 5. Coller l'URL dans le widget
Dans `calendrier-reservation-laser.html`, trouve cette ligne :
```javascript
const BACKEND_URL = 'https://TON-PROJET.vercel.app/api/create-payment-intent';
```
Remplace par ton URL réelle.

---

## Ce que fait le backend automatiquement à chaque paiement

1. Crée le PaymentIntent Stripe (Apple Pay, Google Pay, Klarna, carte...)
2. Écrit la réservation dans ta table Airtable "Reservations"
3. Décrémente les places disponibles dans ta table "Sessions"

---

## Passer en production (vrais paiements)

Dans Vercel Environment Variables, remplace :
```
STRIPE_SECRET_KEY = sk_live_...   (ta clé live)
```
Et dans le widget remplace :
```
pk_test_... → pk_live_...
```

⚠️ Pense à regénérer tes clés Stripe test après les tests !
