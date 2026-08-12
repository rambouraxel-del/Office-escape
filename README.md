# Office Escape

Prototype mobile 2D d'infiltration/puzzle développé avec Phaser 4, TypeScript et Vite.

## V0.2 — Première infiltration

Cette version permet de tester la première boucle de gameplay du niveau 1 : sortir du bureau, observer un collègue, éviter son regard, se cacher dans les toilettes puis atteindre le haut de la zone.

- format portrait et progression du bas vers le haut ;
- joystick tactile et bouton **COURIR** à maintenir avec un second doigt ;
- horloge dynamique : 5 secondes réelles correspondent à 1 minute de jeu ;
- collègue suivant une patrouille prévisible ;
- cône de vision visible, coupé par les murs et les meubles ;
- course augmentant la portée du cône et la vitesse de détection ;
- jauge de suspicion, alerte après 2 secondes et interception après 4 secondes ;
- poursuite temporaire puis retour automatique à la patrouille ;
- contact direct avec le collègue provoquant une interception immédiate ;
- toilettes utilisables comme cachette, sans arrêter le temps ;
- tutoriel contextuel avec bulles cliquables ;
- commandes clavier de secours : ZQSD/WASD/flèches, Shift pour courir et Espace pour interagir.

Le jeu est automatiquement vérifié, compilé et déployé sur GitHub Pages à chaque push sur `main`.
