# 2ème Bac Sciences Mathématiques — Curriculum Tracker

A proposed curriculum structure for a personal study-organization platform. It is organized into subjects, lessons, and lesson subtitles. Each subtitle can be reviewed independently and linked to questions for teachers.

> **Curriculum note:** This is an organizational breakdown based on the AlloSchool 2 Bac SM course structure, not a verbatim export of every AlloSchool heading. Subtitle names and ordering should be checked against the lessons taught in your class. Some Physics-Chemistry topics differ between SM A and SM B.

## 1. Application hierarchy

```text
2 BAC SM
├── Mathematics
│   └── Lesson / Chapter
│       └── Subtitles
│           ├── Review status
│           └── Linked questions
└── Physique-Chimie
    ├── Physics
    │   └── Lesson
    │       └── Subtitles
    │           ├── Review status
    │           └── Linked questions
    └── Chemistry
        └── Lesson
            └── Subtitles
                ├── Review status
                └── Linked questions
```

## 2. Review statuses

Each subtitle should have its own review status:

| Status | Meaning |
|---|---|
| Not studied | I have not studied this part yet. |
| Understood | I understand it and can explain/apply it. |
| Confusing | I have studied it, but some points remain unclear. |
| Has questions | I have a specific question to ask or resolve. |
| Needs revision | I understood it before, but should review it again. |

Suggested fields for each subtitle:

- `title`
- `status`
- `review_note` (optional)
- `last_reviewed_at`
- Linked questions (zero or more)

A lesson's overall status can be calculated from its subtitles. Allow a manual override if needed.

## 3. Mathematics — Mathématiques

The following chapter list follows the proposed AlloSchool-oriented organization. The subtitles are a practical breakdown for tracking study progress.

### 1. Limites et continuité

- Limites des fonctions
- Limites usuelles et opérations sur les limites
- Théorèmes de comparaison
- Continuité en un point
- Continuité sur un intervalle
- Opérations sur les fonctions continues
- Image d'un intervalle par une fonction continue
- Théorème des valeurs intermédiaires
- Fonction réciproque
- Fonction racine n-ième

### 2. Suites numériques

- Généralités sur les suites
- Suites majorées, minorées et bornées
- Monotonie d'une suite
- Suites arithmétiques
- Suites géométriques
- Limites d'une suite numérique
- Opérations sur les limites
- Critères de convergence
- Suites particulières

### 3. Dérivation et étude des fonctions

- Dérivabilité et fonction dérivée
- Dérivées des fonctions usuelles
- Dérivée d'une fonction composée
- Sens de variation d'une fonction
- Extremums d'une fonction
- Dérivée seconde
- Concavité et convexité
- Points d'inflexion
- Symétrie des courbes
- Branches infinies et asymptotes

### 4. Fonctions logarithmiques

- Définition de la fonction logarithme népérien
- Propriétés algébriques de ln
- Limites de ln
- Dérivée de ln
- Étude de fonctions logarithmiques
- Fonction logarithme de base a

### 5. Fonctions exponentielles

- Définition de la fonction exponentielle
- Propriétés algébriques
- Limites de la fonction exponentielle
- Dérivée de la fonction exponentielle
- Étude de fonctions exponentielles
- Fonction exponentielle de base a

### 6. Nombres complexes

- Forme algébrique
- Conjugué et module
- Argument d'un nombre complexe
- Forme trigonométrique
- Forme exponentielle
- Interprétation géométrique
- Équations dans C
- Racines n-ièmes d'un nombre complexe

### 7. Calcul intégral

- Primitives d'une fonction
- Intégrale d'une fonction continue
- Propriétés de l'intégrale
- Relation de Chasles
- Calcul d'aires
- Intégration par parties
- Applications du calcul intégral

### 8. Équations différentielles

- Équations différentielles de type y' = ay
- Équations différentielles de type y' = ay + b
- Conditions initiales
- Problèmes d'application

### 9. Arithmétique dans ℤ

- Divisibilité dans ℤ
- Division euclidienne
- Congruences
- Propriétés des congruences
- PGCD et algorithme d'Euclide
- Nombres premiers
- Applications des congruences

### 10. Structures algébriques

- Lois de composition interne
- Associativité et commutativité
- Élément neutre
- Élément symétrique
- Groupes
- Anneaux
- Corps

### 11. Espaces vectoriels

- Définition d'un espace vectoriel
- Sous-espaces vectoriels
- Combinaisons linéaires
- Familles libres et liées
- Familles génératrices
- Bases et dimension

### 12. Calcul de probabilités

- Expérience aléatoire et événements
- Dénombrement et arrangements
- Combinaisons
- Probabilité conditionnelle
- Indépendance
- Formule des probabilités totales
- Variables aléatoires
- Espérance mathématique
- Variance et écart-type

## 4. Physique — Physique

### 1. Ondes mécaniques progressives

- Propagation d'une onde mécanique
- Célérité d'une onde
- Retard temporel

### 2. Ondes mécaniques progressives périodiques

- Périodicité temporelle et spatiale
- Période et fréquence
- Longueur d'onde
- Relation entre célérité, fréquence et longueur d'onde

### 3. Propagation des ondes lumineuses

- Propagation de la lumière
- Diffraction
- Dispersion
- Indice de réfraction

### 4. Dipôle RC

- Condensateur
- Charge d'un condensateur
- Décharge d'un condensateur
- Équation différentielle
- Constante de temps

### 5. Dipôle RL

- Bobine et inductance
- Établissement du courant
- Rupture du courant
- Équation différentielle
- Constante de temps

### 6. Oscillations libres d'un circuit RLC série

- Circuit RLC
- Oscillations électriques libres
- Équation différentielle
- Période propre
- Amortissement énergétique

### 7. Circuit RLC série en régime sinusoïdal forcé (SM)

- Excitation sinusoïdale
- Impédance
- Résonance électrique
- Puissance électrique

### 8. Ondes électromagnétiques et modulation d'amplitude

- Ondes électromagnétiques
- Transmission de l'information
- Modulation d'amplitude
- Démodulation

### 9. Lois de Newton

- Référentiels galiléens
- Première loi de Newton
- Deuxième loi de Newton
- Troisième loi de Newton
- Applications

### 10. Chute libre et chute verticale avec frottement

- Chute libre d'un corps solide
- Équations horaires
- Chute verticale avec frottement
- Vitesse limite

### 11. Mouvements plans

- Projectile dans le champ de pesanteur
- Particule chargée dans un champ magnétique
- Particule chargée dans un champ électrique (SM)

### 12. Mouvement des satellites et des planètes

- Loi de gravitation universelle
- Lois de Kepler
- Mouvement des satellites
- Vitesse orbitale et période

### 13. Mouvement de rotation d'un solide autour d'un axe fixe

- Repérage angulaire
- Vitesse angulaire
- Moment d'inertie
- Moment d'une force
- Relation fondamentale de la dynamique en rotation

### 14. Oscillateurs mécaniques

- Pendule élastique
- Pendule pesant
- Pendule simple
- Pendule de torsion
- Équation différentielle
- Période propre

### 15. Aspects énergétiques des oscillateurs mécaniques

- Énergie cinétique
- Énergie potentielle
- Énergie mécanique
- Conservation de l'énergie

### 16. Atome et mécanique de Newton

- Modèle de l'atome
- Forces électrostatiques
- Mouvement d'une particule dans l'atome
- Applications du modèle de Newton

## 5. Chimie — Chimie

### 1. Transformations lentes et transformations rapides

- Transformation chimique
- Transformations rapides
- Transformations lentes
- Facteurs cinétiques

### 2. Suivi temporel d'une transformation chimique — Vitesse de réaction

- Avancement d'une réaction
- Tableau d'avancement
- Suivi temporel
- Vitesse volumique de réaction
- Temps de demi-réaction

### 3. Décroissance radioactive

- Stabilité et instabilité des noyaux
- Radioactivité alpha, bêta et gamma
- Loi de décroissance radioactive
- Constante radioactive
- Activité radioactive
- Temps de demi-vie

### 4. Noyaux, masse et énergie

- Défaut de masse
- Équivalence masse-énergie
- Énergie de liaison
- Stabilité des noyaux
- Fission et fusion

### 5. Transformations chimiques s'effectuant dans les deux sens

- Transformations totales et limitées
- Réactions réversibles
- État d'équilibre chimique
- Quotient de réaction

### 6. État d'équilibre d'un système chimique

- Équilibre chimique
- Constante d'équilibre
- Taux d'avancement final
- Influence des facteurs externes

### 7. Transformations liées à des réactions acide-base

- Acides et bases selon Brønsted
- Couple acide-base
- Réaction acido-basique
- Constante d'acidité Ka
- pH et équilibre

### 8. Dosage acido-basique

- Principe du dosage
- Équivalence
- Dosage pH-métrique
- Dosage colorimétrique
- Courbe de dosage

### 9. Évolution spontanée d'un système chimique

- Réactions d'oxydoréduction
- Quotient de réaction
- Sens d'évolution spontanée
- Critère d'évolution

### 10. Transformations spontanées dans les piles et production d'énergie

- Pile électrochimique
- Constitution et fonctionnement
- Sens du courant et des électrons
- Force électromotrice
- Énergie électrique produite

### 11. Transformations forcées (Électrolyse)

- Électrolyse
- Transformation forcée
- Réactions aux électrodes
- Quantité d'électricité

### 12. Réactions d'estérification et d'hydrolyse

- Estérification
- Hydrolyse
- Équilibre chimique
- Rendement d'une réaction

### 13. Contrôle de l'évolution d'un système chimique

- Estérification et hydrolyse contrôlées
- Optimisation du rendement
- Déplacement de l'équilibre
- Choix des conditions expérimentales

## 6. Questions linked to lessons

Questions should be separate records linked to a subject, lesson, and (optionally) a subtitle.

Suggested question fields:

- `title`
- `question_text`
- `subject_id`
- `lesson_id`
- `subtitle_id` (optional)
- `teacher` (optional)
- `priority` (Low / Normal / High)
- `status` (Pending / Asked / Answered / Archived)
- `response` (optional)
- `personal_note` (optional)
- `created_at`
- `answered_at` (optional)

Suggested workflow:

1. Create a question from a lesson or subtitle.
2. It starts as **Pending** (not yet asked).
3. Mark it **Asked** after speaking to or contacting the teacher.
4. Add the teacher's explanation and mark it **Answered**.
5. Optionally add a personal note explaining what you understood.

## 7. Suggested main navigation

- **Dashboard** — lesson review overview and questions requiring attention.
- **Subjects** — Mathematics and Physique-Chimie.
  - Mathematics
  - Physics
  - Chemistry
- **Questions** — all questions, filterable by subject, lesson, subtitle, teacher, priority, and status.
- **Settings** — edit subjects, lessons, subtitles, and review-status options.

## 8. Suggested dashboard information

- Total number of lessons and subtitles
- Number of understood subtitles
- Number of confusing subtitles
- Number of subtitles marked as having questions
- Number of unstudied subtitles
- Questions by status: Pending, Asked, Answered
- Questions grouped by subject
- Lessons with the most unresolved questions
