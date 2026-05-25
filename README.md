# Application Web de Réservation d'Hôtel

**Étudiant :** Hind Sabar  
**Contrôle :** 3  
**Thème :** Réservation d'hôtel

## Structure du projet

```
nouri-saad/
└── controle3/
    └── reservation-app/
        ├── server.js          # Serveur Node.js (backend)
        ├── package.json
        ├── data/
        │   └── reservations.json   # Stockage des données
        ├── public/            # Frontend (HTML / CSS / JS)
        │   ├── index.html
        │   ├── css/style.css
        │   └── js/app.js
        └── README.md
```

## Fonctionnalités

- Consulter les réservations enregistrées (GET)
- Ajouter une nouvelle réservation (POST)
- Afficher les informations enregistrées dynamiquement
- Validation des champs côté client et serveur
- Stockage persistant dans un fichier JSON

## Lancement

1. Ouvrir un terminal dans le dossier `reservation-app`
2. Démarrer le serveur :

```bash
node server.js
```

3. Ouvrir le navigateur à l'adresse : **http://localhost:3000**

## Routes API

| Méthode | Route                 | Description                    |
|---------|-----------------------|--------------------------------|
| GET     | `/api/reservations`   | Récupérer toutes les réservations |
| POST    | `/api/reservations`   | Ajouter une nouvelle réservation  |

## Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- Node.js (module `http` natif, sans dépendances externes)
