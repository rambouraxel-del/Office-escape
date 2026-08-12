# Office Escape

Prototype mobile 2D d'infiltration/puzzle développé avec Phaser 4, TypeScript et Vite.

## V0.3 — Le boss rôde

Cette version étend la boucle d'infiltration du niveau 1 : sortir du bureau, utiliser les toilettes pour passer le premier collègue, puis contourner un pilier central afin d'échapper à la ronde du boss.

- format portrait et progression du bas vers le haut ;
- joystick tactile et bouton **COURIR** à maintenir avec un second doigt ;
- horloge dynamique : 5 secondes réelles correspondent à 1 minute de jeu ;
- collègue suivant une patrouille prévisible ;
- boss suivant une ronde indépendante autour d'un pilier central ;
- paramètres de vitesse, poursuite, portée et angle de vision propres à chaque adversaire ;
- cône de vision visible, coupé par les murs et les meubles ;
- course augmentant la portée du cône et la vitesse de détection ;
- jauge de suspicion, alerte après 2 secondes et interception après 4 secondes ;
- poursuite temporaire puis retour automatique à la patrouille ;
- contact direct avec un adversaire provoquant une interception immédiate ;
- toilettes utilisables comme cachette, sans arrêter le temps ;
- tutoriel contextuel avec une nouvelle bulle dédiée au pilier ;
- commandes clavier de secours : ZQSD/WASD/flèches, Shift pour courir et Espace pour interagir.

Le jeu est automatiquement vérifié, compilé et déployé sur GitHub Pages à chaque push sur `main`.
