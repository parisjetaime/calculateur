# Éco-Calculateur - Product Requirements Document

## Description du projet
Application web de calcul d'empreinte carbone pour les événements, reproduisant la logique de calcul d'un fichier Excel complexe.

## Architecture technique
- **Frontend**: React avec Shadcn/UI
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Thème**: Vert foncé (#0d5f4d) et blanc

## État d'avancement

### ✅ Modules implémentés

#### Module 1 - Général (100%)
- [x] Structure à deux colonnes (Saisie | Paramètres calculés)
- [x] Champs de saisie:
  - Nom de l'événement
  - Type d'événement (Professionnel, Culturel, Sportif)
  - Sous-type selon le type principal
  - Dates (début/fin)
  - Nombre de visiteurs
  - % visiteurs étrangers (avec option "je ne connais pas")
  - % visiteurs franciliens (avec option "je ne connais pas")
  - Paramètres exposants (événements professionnels)
  - Paramètres sportifs/artistes (événements culturels/sportifs)
- [x] Calculs automatiques en temps réel:
  - Durée de l'événement
  - Nombre de visiteurs étrangers
  - Nombre de visiteurs nationaux non IDF
  - Nombre de visiteurs franciliens
  - Nombre d'exposants/sportifs/artistes par origine
  - Totaux généraux
- [x] Utilisation des données OTCP pour les valeurs par défaut

#### Module 2 - Énergie (100%)
- [x] Structure à deux colonnes
- [x] Choix lieu (intérieur/extérieur)
- [x] Choix approche (réelle/estimée)
- [x] Message d'orientation dynamique
- [x] 2.1. Approche réelle:
  - Combustibles (Gaz, Fioul, Électricité, Charbon)
  - Réseaux de chaleur et de froid (par ville)
  - Groupes électrogènes (puissance, temps, nombre)
- [x] 2.2. Approche estimée:
  - Type de bâtiment (facteurs CEREN)
  - Surface occupée
- [x] Calculs automatiques des émissions kgCO2e

### 🔄 Modules à implémenter

#### Module 3 - Transport (0%)
- [ ] 3.1. Transport des visiteurs
  - Accès à l'IDF (approche par origines / statistique)
  - Transport local
- [ ] 3.2. Transport des exposants/sportifs/artistes
- [ ] 3.3. Transport des organisateurs

#### Module 4 - Aménagements et accueil (0%)
- [ ] 4.1. Approche par les quantités
- [ ] 4.2. Approche par les dépenses
- [ ] 4.3. Approche statistique

#### Module 5 - Restauration (0%)
- [ ] 5.1. Approche par les quantités
- [ ] 5.2. Approche par les dépenses réelles
- [ ] 5.3. Approche statistique

#### Module 6 - Hébergements (0%)
- [ ] 6.1. Approche par les types d'hébergements
- [ ] 6.2. Approche statistique

#### Module 7 - Achats et goodies (0%)
- [ ] 7.1. Les goodies
- [ ] 7.2. Les badges
- [ ] 7.3. Achats matériel sportif

#### Module 8 - Communication (0%)
- [ ] 8.1. Approche par les quantités
- [ ] 8.2. Approche par les dépenses réelles
- [ ] 8.3. Approche statistique

#### Module 9 - Fret (0%)
- [ ] 9.1. Approche par les distances
- [ ] 9.2. Approche par les dépenses

#### Module 10 - Déchets (0%)
- [ ] Badges, vaisselle et supports de communication
- [ ] Déchets divers

## Fichiers clés

### Backend
- `/app/backend/server.py` - API FastAPI, modèles Pydantic, logique de calcul
- `/app/backend/hypotheses_loader.py` - Chargement des données JSON
- `/app/backend/hypotheses/` - Fichiers JSON des facteurs d'émission

### Frontend
- `/app/frontend/src/pages/EventFormPage.js` - Page principale du formulaire
- `/app/frontend/src/components/GeneralSection.js` - Module 1 Général
- `/app/frontend/src/components/EnergySection.js` - Module 2 Énergie

## API Endpoints

- `POST /api/events` - Créer un événement
- `GET /api/events/{id}` - Récupérer un événement
- `POST /api/events/preview` - Prévisualiser les calculs
- `POST /api/energy` - Enregistrer données énergie
- `GET /api/calculate/{event_id}` - Calculer les émissions totales

## Prochaines étapes (Priorité)

1. **P0**: Implémenter le module Transport (Module 3)
2. **P1**: Implémenter les modules 4-7
3. **P2**: Implémenter les modules 8-10
4. **P2**: Export PDF des résultats

## Notes techniques

- Pas de système d'authentification (demande utilisateur)
- Calculs en temps réel côté frontend
- Sauvegarde en base de données côté backend
- Données de référence chargées depuis fichiers JSON au démarrage

---
*Dernière mise à jour: 30 Janvier 2025*
