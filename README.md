Documentation préliminaire

## Installation

### Ink seul

1. Copiez `dist/pure-ink/storylets.ink` à côté de votre fichier `mon_jeu.ink` et modifiez le pour inclure les storylets : `INCLUDE ./storylets.ink`
2. Exportez votre jeu au format web depuis Inky
3. Copiez `dist/pure-ink/storylets.js` dans le dossier généré par Inky
4. Modifiez le fichier `index.html` pour y ajouter `<script src="storylets.js"></script>` **juste après** le script `ink.js`
5. Modifier le début de `main.js` :
   Juste après

   ```
     var story = new inkjs.Story(storyContent);
   ```

   il faut ajouter :

   ```
     const storylets = new Storylets(story);
     // la ligne suivante est optionelle, c'est uniquement pour du debug.
     window.storyletsDebugger = new StoryletsDebugger(storylets);
   ```

### Avec Calico

1. Copier `dist/calico/storylets.ink` et `dist/calico/storylets.js` dans le dossier `patches` de votre jeu Calico. Si vous préférez ne pas remplacer le patch existant, vous pouvez renommer les fichiers ou les mettre ailleurs que dans `patches`.
2. Dans votre `story.ink` : `INCLUDE patches/storylets.ink`
3. Dans votre `project.js` : `import "./patches/storylets.js";`

## Format storylet

Je reprends à peu près le format du patch `storylets` de Calico :

```ink
=== nom_storylet
#storylet
= open
{true}
= exclusivity
{0}
= urgency
{0}
= frequency // N'existe pas dans Calico
{1}
= content // S'appelle text dans Calico
// Contenu de la narramiette, a priori un choix qui permet de la lancer mais vous êtes libre de mettre plusieurs choix
+ [Quête du talisman sacré]
…
->->
```

Les éléments obligatoires :

- le `knot` qui englobe toute la storylet
- le tag `#storylet`
- le stitch `=content`, qui doit être [un tunnel](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-tunnels), c'est à dire qu'il se termine systématiquement par un `->->` (ou un `-> END` pour une fin de jeu)

Ce qui est optionnel :

- les catégories sur le tag: `#storylet: quest`, `#storylet: quest, phase_1`
- les stitches :
  - `=open` (défaut = true) : sert à savoir si un storylet est disponible ou non
  - `=exclusivity` (défaut = 0) : sert à exclure toute storylet d'un niveau inférieur (s'il y a 3 storylets d'exclusitivity 1 et une d'exclusitivity 2, seule cette dernière sera disponible)
  - `=urgency` (défaut = 0)
  - `=frequency` (défaut = 1)

Vous pouvez mettre ce que vous voulez dans ces stitches à condition qu'ils terminent par une valeur entre accolades : `{valeur}`. Ça peut être une simple valeur `{true}` ou `{7}`, ou une variable `{knows_arthur}` ou encore une expression `{inventory has (butter, sugar) && some_function()}`.

En n'utilisant que les champs obligatoires, notre storylet devient :

```ink
=== nom_storylet
#storylet
= content
+ [Quête du talisman sacré]
…
->->
```

## Lister les storylets dans ink

L'affichage de vos storylets va se faire selon des critères (open/close, catégories, nombre max, aléatoire…) qu'il va falloir exprimer. C'est l'objet de toute la section suivante.
Pour commencer, contentons nous d'un critère simple : je veux 3 storylets. La requête correspondante est `"max=3"`.

Pour exécuter cette requête depuis ink, vous avez 2 options :

- utiliser [un tunnel](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-tunnels) : `-> storylets_tunnel("max=3") ->`
- utiliser [un thread](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-threads) : `<- storylets_thread("max=3", -> retour)`

Dans le premier cas, ink listera les `=content` des 3 storylets. Votre lecteur prendra l'un de ces choix, puis à un moment, la storylet sera terminée et le tunnel nous ramènera juste après l'appel à `storylets_tunnel`.

Dans le deuxième cas, c'est pareil mais avec thread, ce qui veut dire 2 choses :

- vous devez préciser où aller quand la storylet sera terminée (`-> retour`)
- vous pouvez ajouter d'autres choix ou d'autres appels à `storylets_thread` pour cumuler les choix.

Par exemple :

```ink
Vous parlez avec Arthur :
-(boucle)
<- storylets_thread("max=3&category=dialogue_quete", -> boucle)
<- storylets_thread("max=1&category=dialogue_meteo", -> boucle)
+ [Quitter Arthur] -> retour_au_village
```

## Format query string

Étant donné que :

- on veut filer pas mal d'infos au JavaScript pour choisir les storylets selon différents critères mais on veut pas forcément préciser tous les critères possibles la plupart du temps
- ink ne permet pas de passer de données structurées à une fonction
- ink ne permet pas de passer un nombre variable de paramètres à une fonction

j'ai décidé de passer par une seule grosse chaîne de caractères. Pour passer les différents critères, j'ai choisi un format connu de tout le monde : la _query string_.

Keskecé ? C'est la partie d'une URL qui est après le `?`. Mais si vous connaissez : `title=blabla&action=edit`.
C'est standard, c'est facile à parser, ça peut aussi prendre des valeurs multiples (`foo=bar&foo=qux` donne `foo = ["bar", "qux"]`), ou pas de valeur `foo=1&bar=` ou `foo=1&bar`.

## Critères possibles

Pour l'instant, les critères implémentés :

- `max=<nombre>` : pour limiter le nombre de storylets choisies
  - exemple : `max=3`
- `category=<texte>` : sélectionne uniquement les storylets de la catégorie demandée. Si plusieurs categories sont données, il faut que les storylets aient toutes les catégories.
  - exemples : `category=quest`, `category=quest&category=phase_3`
- `random=<frequency|uniform|0|false|pas de valeur>` : pour choisir aléatoirement les storylets
  - `frequency` : pour choisir plus souvent les storylets avec une plus grande `frequency`. Par exemple, une storylet avec une frequency de 2 sortira 2 fois plus souvent qu'une avec une frequency de 1.
  - `uniform` : pour ignorer la `frequency` et choisir de manière homogène
  - `0` ou `false` : ne pas choisir aléatoirement, équivalent à ne pas préciser `random`
  - `pas de valeur` : tirage aléatoire avec algorithme par défaut (`frequency`). :warning: Ne pas confondre `max=1&random` (pas de valeur, donc frequency) avec `max=1` (pas de random, donc pas d'aléatoire)
  - exemples : `category=dog&random`, `max=1&random=uniform`
- `filter=<nom d'une fonction ink>`: pour filtrer selon une logique personnalisée (voir section dédiée)
  - exemple : `filter=mon_filtre`

## Avancé - Filtre personnalisé

Vous pouvez filtrer selon des critères personnalisés avec une fonction implémentée en ink.
Cette fonction sera appelée avec le nom de chaque storylet ouverte pour savoir si vous voulez l'inclure (`return true`) ou non (`return false` ou pas de `return`).
Pour récupérer des infos sur une storylet à partir de son nom, une fonction `storylets_get_prop(storylet_name, prop_name, defaut_value)` est fournie.

Voici un exemple de filtre :

```ink
== function filter_magic_3_to_8(storylet_name)
~ temp magic = storylets_get_prop(storylet_name, "magic", 0)
~ return 3 <= magic && magic <= 8
```

Ce filtre sélectionnera les storylets qui ont un stitch `=magic` qui vaut entre 3 et 8. Pour l'utiliser : `filter=filter_magic_3_to_8`.

## Debug JavaScript

Vous pouvez vérifiez que vos storylets se comportent comme prévu en utilisant le `storyletsDebugger` depuis la console JavaScript de votre navigateur.

⚠️ Si votre jeu est dans une iframe (itch / Catmint par exemple), il faudra vous assurer que la console est connectée à la bonne frame.

<img width="555" alt="image" src="https://github.com/floriancargoet/calico-storylets/assets/110431/f191bbcc-5007-4833-bac9-cf73ae6f07f5">

```
// Pour récupérer des objets simples avec name/categories/open/exclusivity/urgency/frequency
// Les objets simples sont une copie de l'état à l'instant T
storyletsDebugger.get("nom_de_la_storylet")
storyletsDebugger.all() // Toutes, même les fermées
storyletsDebugger.select("category=quest&max=3&random")

// Pour récupérer les instances "Storylet", il faut passer true en plus
// Les instances sont dynamiques (si tu fais avancer l'histoire et que tu regardes la même instance, elle sera à jour)
storyletsDebugger.get("nom_de_la_storylet", true)
storyletsDebugger.all(true)
storyletsDebugger.select("category=quest&max=3&random", true)

ma_storylet = storyletsDebugger.get("nom_de_la_storylet", true)
ma_storylet.open // et autres propriétés standards des storylets
ma_storylet.get("magic") // on peut aussi accéder à la valeur des stitches supplémentaires
ma_storylet.get("magic", 0) // on peut préciser une valeur par défaut à retourner si le stitch n'existe pas ou qu'il ne renvoie pas de valeur
```
