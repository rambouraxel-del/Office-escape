# Office Escape

Prototype mobile 2D d'infiltration/puzzle développé avec Phaser 4, TypeScript et Vite.

## V0.7 — Direction graphique « Corporate Cartoon »

La phase graphique installe une identité chaleureuse, lisible et légèrement satirique sans modifier les mécaniques du niveau.

- illustration originale et responsive sur l'écran d'accueil ;
- palette crème, bleu nuit, turquoise, corail et prune ;
- personnages illustrés et différenciés pour le joueur, les collègues et le boss ;
- mobilier enrichi avec écrans, dossiers, tasses, plantes, ombres et volumes ;
- sol en dalles nuancées et obstacles mieux détachés du décor ;
- HUD mobile arrondi, hiérarchie typographique renforcée et contrôles harmonisés ;
- cônes de vision ambrés conservant une lecture immédiate du gameplay.

## V0.6 — Consolidation du niveau 1

Cette version transforme la boucle complète du niveau 1 en prototype présentable et plus robuste sur mobile.

- format portrait et progression du bas vers le haut ;
- joystick tactile et bouton **COURIR** à maintenir avec un second doigt ;
- horloge dynamique : 5 secondes réelles correspondent à 1 minute de jeu ;
- collègue suivant une patrouille prévisible ;
- boss suivant une ronde indépendante autour d'un pilier central ;
- paramètres de vitesse, poursuite, portée et angle de vision propres à chaque adversaire ;
- donut animé placé sur un détour optionnel ;
- bouton contextuel **RAMASSER** uniquement visible à proximité ;
- inventaire permanent limité à deux emplacements ;
- dialogue final à trois choix avec probabilités affichées ;
- donut consommable garantissant une sortie sans pénalité ;
- réponses à 70 % et 30 %, avec pénalités respectives de 10 et 30 minutes en cas d'échec ;
- temps figé pendant le dialogue puis repris après le résultat ;
- vraie sortie avec heure finale, étoiles et meilleur temps local ;
- écran d'accueil avec objectif et seuils d'étoiles ;
- pause manuelle et pause automatique lorsque l'application passe en arrière-plan ;
- écran spécial **Heures sup catastrophiques** à 22h00 ;
- remise à zéro du tutoriel et du meilleur temps depuis l'accueil ;
- retours visuels et vibrations optionnelles lors des alertes, objets et résultats ;
- caméra plus réactive et zone morte réduite pour améliorer le contrôle en portrait ;
- cône de vision visible, coupé par les murs et les meubles ;
- course augmentant la portée du cône et la vitesse de détection ;
- jauge de suspicion, alerte après 2 secondes et interception après 4 secondes ;
- poursuite temporaire puis retour automatique à la patrouille ;
- contact direct avec un adversaire provoquant une interception immédiate ;
- toilettes utilisables comme cachette, sans arrêter le temps ;
- tutoriel contextuel couvrant le pilier puis le ramassage du donut ;
- commandes clavier de secours : ZQSD/WASD/flèches, Shift pour courir et Espace pour interagir.

Le jeu est automatiquement vérifié, compilé et déployé sur GitHub Pages à chaque push sur `main`.
