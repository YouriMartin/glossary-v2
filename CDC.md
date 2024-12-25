# Cahier des charges du projet Glossary

## Fonctionnement   
Projet d'une extension browser compatible avec Chrome et Firefox.
Cette extension permet de fournir un glossaire d'acronyme sous format csv, de le stocké dans le indexeddb du navigateur. Elle permet ensuite en surlignant un mot, d'afficher sa définition a coté du mot dans une fenêtre.

Le glossaire est stocké sous forme de csv et peut donc facilement et rapidement etre modifié par l'utilisateur.

Le glossaire est accessible en ligne et peut donc facilement et rapidement etre modifié par l'utilisateur.

Cette extention doit être très sécurisé, c'est a dire qu'aucun site web ni autre extention doivent avoir accès aux différenht accronyme stocké par l'utilisateur.

## Techniquement
On va utiliser le indexeddb pour stocker le glossaire.
On utilise du typescript pour le developpement.
On utilisera une methodoligie TDD (test driven developpement)
L'architecture doit respecter la clean architecture.
Les commentaires, noms des variables et fonctions doivent respecter la norme de l'anglais.
