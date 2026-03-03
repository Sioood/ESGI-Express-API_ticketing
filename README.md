## API Ticketing – Nexora Dynamics

API REST de gestion de tickets interne pour Nexora Dynamics (collaborateur, manager, support) construite avec **Express** et **Sequelize**, supportant **SQLite** en développement et **MySQL** en production.

### 1. Installation

- **Pré-requis**:
  - Node.js >= 18
  - npm
  - Optionnel pour la prod: un serveur MySQL

- **Cloner / se placer dans le projet**:

```bash
cd api_ticketing
npm install
```

### 2. Configuration des variables d’environnement

- Copier le fichier d’exemple:

```bash
cp .env.example .env
```

- **Développement (SQLite)** – configuration recommandée dans `.env`:

```bash
NODE_ENV=development
DB_DIALECT=sqlite
DB_STORAGE=./data/dev.sqlite
```

- **Production (MySQL)** – exemple:

```bash
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=api_ticketing
DB_PASSWORD=motdepasse
DB_NAME=api_ticketing
```

- **Sécurité**:
  - Changer `JWT_SECRET` par une valeur forte/unique en production.

### 3. Lancement de l’API

- **Développement (SQLite)**:

```bash
npm run dev
```

- **Production**:

```bash
npm start
```

Par défaut, l’API écoute sur `http://localhost:3000` (configurable via `PORT` dans `.env`).

### 4. Modèle de données (simplifié)

- **User**
  - `id`, `name`, `email`, `passwordHash`
  - `role`: `collaborator`, `manager`, `support`
  - `managerId`: lien vers le manager (user)

- **Ticket**
  - `id`, `title`, `description`
  - `category`: `bug`, `access`, `hardware`, `other`
  - `priority`: `low`, `medium`, `high`, `critical`
  - `status`: `open`, `assigned`, `in_progress`, `resolved`, `closed`, `cancelled`
  - `authorId`, `assigneeId`

- **Comment**
  - `id`, `content`, `internal` (bool)
  - `ticketId`, `authorId`

Les associations et modèles sont définis dans `src/models`.

### 5. Authentification & rôles

- **Authentification**:
  - Login par `email` / `password`.
  - Réponse: JWT (`Authorization: Bearer <token>`) + informations utilisateur.
  - Middleware `auth` qui remplit `req.user` (id, role, managerId).

- **Rôles**:
  - **Collaborateur**:
    - Crée des tickets.
    - Consulte ses propres tickets.
    - Commente ses tickets.
    - Peut annuler un ticket `open` dont il est l’auteur.
  - **Manager**:
    - Voit ses tickets + ceux de son équipe (`managerId` sur les users).
    - Peut modifier la **priorité** d’un ticket (y compris `critical`).
  - **Support**:
    - Voit tous les tickets.
    - Peut prendre en charge un ticket (assignation).
    - Peut changer le **statut** selon les règles métier.
    - Peut ajouter des commentaires internes (`internal: true`), visibles uniquement par le support.

### 6. Endpoints principaux

- **Auth**
  - `POST /auth/login` – login, renvoie `{ token, user }`.
  - `GET /auth/me` – renvoie l’utilisateur courant (JWT requis).

- **Users**
  - `POST /users` – créer un utilisateur (nom, email, mot de passe, rôle, managerId).

- **Tickets** (JWT requis pour toutes les routes)
  - `POST /tickets`
    - Crée un ticket.
    - Champs: `title`, `description`, `category`, `priority` (optionnelle).
    - **Règles**:
      - Statut initial forcé à `open`.
      - Un collaborateur ne peut pas créer un ticket en `critical`.
  - `GET /tickets`
    - Liste des tickets visibles pour l’utilisateur.
    - Filtres query: `status`, `priority`, `category`.
      - Valeurs invalides renvoient une erreur de validation.
  - `GET /tickets/:id`
    - Détail d’un ticket.
    - Les commentaires `internal` sont masqués pour les non-support.
  - `PATCH /tickets/:id/status`
    - Change le statut, en appliquant les règles de transition.
  - `PATCH /tickets/:id/priority`
    - Change la priorité.
  - `PATCH /tickets/:id/assign`
    - Assigne un ticket à un membre du support.
  - `POST /tickets/:id/comments`
    - Ajoute un commentaire (optionnel `internal: true`).

### 7. Règles métier (emplacement dans le code)

- **Statuts** – `src/core/businessRules/ticketStatusRules.js`
  - Transitions autorisées:
    - `open` => `assigned` (support).
    - `assigned` => `in_progress` (support).
    - `in_progress` => `resolved` (support).
    - `resolved` => `closed` (support ou auteur collaborateur).
    - `open` => `cancelled` (auteur uniquement).
  - Toute autre transition est refusée (`ValidationError` / `AuthorizationError`).

- **Priorités** – `src/core/businessRules/priorityRules.js`
  - Collaborateur:
    - Ne peut pas créer/modifier un ticket avec priorité `critical`.
  - Manager:
    - Peut modifier la priorité (y compris `critical`).
  - Support:
    - Ne peut pas modifier la priorité.

- **Visibilité** – `src/core/businessRules/visibilityRules.js`
  - Collaborateur: uniquement ses tickets.
  - Manager: ses tickets + ceux des membres de son équipe (`managerId`).
  - Support: tous les tickets.
  - Les commentaires `internal` sont visibles seulement pour le support.

### 8. Architecture du code

- `src/app.js` – configuration Express (middlewares, routes, gestion d’erreurs).
- `src/server.js` – bootstrap (dotenv, init DB, lancement du serveur).
- `src/config/env.js` – centralisation des variables d’environnement.
- `src/config/database.js` – configuration Sequelize (SQLite/MySQL) + `sync`.
- `src/models` – modèles Sequelize et associations.
- `src/services` – logique applicative (auth, users, tickets).
- `src/controllers` – adaptation HTTP (Express) des services.
- `src/core` – erreurs (`errors.js`) et règles métier (`businessRules`).
- `src/middleware` – `auth` (JWT), `role`.
- `src/utils` – `jwt`, `password`, `filters`.
- `docs` – fichiers de requêtes pour Postman / Insomnia / `.http`.

### 9. Scénario de démo multi-utilisateurs (exemple)

1. **Créer des utilisateurs**:
   - 1 collaborateur (Alice).
   - 1 manager (Bob).
   - 2 supports (Sophie, Sam).
2. **Login** de chaque utilisateur (récupérer les tokens JWT).
3. **Alice** crée un ticket en `high` (pas `critical`).
4. **Sophie (support)**:
   - Liste les tickets (`GET /tickets`) => voit tout.
   - Assigne le ticket à elle-même (`PATCH /tickets/:id/assign`).
   - Passe le statut à `in_progress` puis `resolved`.
   - Ajoute un commentaire `internal`.
5. **Alice** consulte le ticket:
   - Voit l’historique et les commentaires **non** internes.
   - Passe le ticket en `closed`.
6. **Bob (manager)**:
   - Met à jour la priorité d’un ticket de son équipe en `critical`.

### 10. Fichiers de requêtes

- Des exemples de requêtes (login, création d’utilisateurs, tickets, transitions de statut, commentaires, filtrage) sont disponibles dans:
  - `docs/api-requests.http` (format HTTP brut).
  - `docs/postman-collection.json` (Postman).
  - `docs/insomnia-collection.json` (Insomnia).

# ESGI-Express-API_ticketing
