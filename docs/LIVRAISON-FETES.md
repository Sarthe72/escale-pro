# Escale Pro — version de validation des fêtes

Cette branche prépare le CRM pour son hébergement actuel, sans déploiement. La clé d’accès serveur commune remplace l’ancien PIN local comme authentification d’entrée dans cette version. Les données locales existantes ne sont ni effacées ni migrées automatiquement.

Les commandes et leurs factures se partagent via le Worker du site et D1. Les factures de commande se corrigent depuis la commande liée ; elles ne sont pas éditées dans le stockage local des factures manuelles.

Production : `npm ci`, `npm test`, `npm run build`. L’URL serveur est `https://uneescalegourmande.fr/api/holiday` par défaut. La base des assets est `/escale-pro/`, avec navigation hash compatible GitHub Pages. Aucune clé d’accès ne doit apparaître dans une variable VITE ou le dossier dist.

Recette locale : `ORDERS_LOCAL=true`, `VITE_ORDERS_API=http://127.0.0.1:8791/api/holiday`, `npm run dev`. Le mode visiteur utilise des données fictives séparées. Le serveur et la base doivent être démarrés depuis le dépôt du site.

La livraison commune contient le guide complet `LIVRAISON-FETES-2026.md` : configuration de production, migrations, paramètres à valider et retour arrière. Sauvegarder les anciens devis/factures et la version actuelle avant remplacement. La réception d’alertes hors CRM reste à choisir ; aucun e-mail de notification n’est activé.
