# Déclic — Générateur de Prestations

App interne de génération de fiches prestations pour Odoo, powered by Claude AI.

---

## Déploiement (10 minutes)

### 1. GitHub
```bash
git init
git add .
git commit -m "init: declic presta generator"
# Crée un repo sur github.com puis :
git remote add origin https://github.com/TON_USERNAME/declic-presta-generator.git
git push -u origin main
```

### 2. Vercel
1. Va sur [vercel.com](https://vercel.com) → "Add New Project"
2. Importe ton repo GitHub
3. **Settings → Environment Variables** → Ajoute :
   - Name : `ANTHROPIC_API_KEY`
   - Value : ta clé API Anthropic (console.anthropic.com)
4. Clique **Deploy**

C'est tout. Vercel détecte automatiquement le dossier `/api` et déploie la serverless function.

---

## Structure du projet

```
declic-presta-generator/
├── index.html          → App frontend complète
├── api/
│   └── generate.js     → Proxy sécurisé vers Anthropic (clé jamais exposée)
├── vercel.json         → Config routing Vercel
└── README.md
```

## Récupérer ta clé Anthropic
1. Va sur [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copie-la dans Vercel Environment Variables

---

## Usage
- Sélectionne pôle → sous-type → facturation
- Renseigne le contexte (optionnel mais améliore la qualité)
- Active "Pack" pour les forfaits multi-pôles
- Copie les champs directement dans Odoo
