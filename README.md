# Office Escape

Prototype mobile 2D d'infiltration/puzzle développé avec Phaser 4, TypeScript et Vite.

## V0.5 — Dialogue final et sortie

Cette version ferme la boucle complète du niveau 1 : après le collègue, les toilettes, le boss et le donut, une dernière rencontre obligatoire propose trois choix avant la vraie porte de sortie.

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
- cône de vision visible, coupé par les murs et les meubles ;
- course augmentant la portée du cône et la vitesse de détection ;
- jauge de suspicion, alerte après 2 secondes et interception après 4 secondes ;
- poursuite temporaire puis retour automatique à la patrouille ;
- contact direct avec un adversaire provoquant une interception immédiate ;
- toilettes utilisables comme cachette, sans arrêter le temps ;
- tutoriel contextuel couvrant le pilier puis le ramassage du donut ;
- commandes clavier de secours : ZQSD/WASD/flèches, Shift pour courir et Espace pour interagir.

Le jeu est automatiquement vérifié, compilé et déployé sur GitHub Pages à chaque push sur `main`.
