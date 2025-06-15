document.addEventListener("DOMContentLoaded", function () {
  const selectedCharacter = localStorage.getItem("selectedCharacter");

  if (selectedCharacter) {
    currentPlayer = characters[selectedCharacter];
  updateUIForCharacter(currentPlayer);
  } else {
    window.location.href = "seleccion.php";
  }
});

const characters = {
  red: {
    name: "Red",
    maxHealth: 1100,
    health: 1100,
    attack: {
      name: "Mordida Canina",
      damage: { min: 70, max: 120 },
    },
    defense: {
      name: "Reunión de Lobos",
      reduction: 20,
      message: "Red se reúne con sus lobos para protegerse.",
    },
    image: "https://media.karousell.com/media/photos/products/2022/2/27/arknights_projekt_red_cosplay_1645973320_75e51313.jpg",
    specialAbility: {
      name: "Modo Suicidio",
      description: "Aumenta el daño mínimo en 100 y el daño máximo en 10.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 50;
        currentPlayer.attack.damage.max += 50;
        currentPlayer.image = "https://static.zerochan.net/Cardigan.%28Arknights%29.full.3682653.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Red: - Este sentimiento me carcome...Acabaré con el");
      },
    },
  },
  riyuri: {
    name: "Riyuri",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "Reishi Agresivo",
      damage: { min: 80, max: 180 },
    },
    defense: {
      name: "Blut Vene",
      reduction: 15,
      message: "Riyuri utiliza Blut Vene para defenderse.",
    },
    image: "https://cdna.artstation.com/p/assets/images/images/051/734/880/large/kian-reglos-hayan-fin.jpg?1658059418",
    specialAbility: {
      name: "Modo Yhwach",
      description: "Reduce el daño recibido en un 30% y aumenta el daño mínimo en 50.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.defense.reduction = 3;
        currentPlayer.attack.damage.min += 60;
        currentPlayer.image = "https://i.pinimg.com/736x/50/d4/2d/50d42d0550f09c590ce3f9d10078e952.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Riyuri: - Reclamo este poder que me pertenece, ¿lo oyes?...Yhwach");
      },
    },
  },
  marceline: {
    name: "Marceline",
    maxHealth: 1100,
    health: 1100,
    attack: {
      name: "Unlimited Blade Works",
      damage: { min: 90, max: 135 },
    },
    defense: {
      name: "All Fiction",
      reduction: 0,
      message: "Marceline activa All Fiction y se protege.",
    },
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbHFYhyUaVJNDCVSNm8bL8Fb10SWACzPNWrQ&usqp=CAU",
    specialAbility: {
      name: "All Fiction",
      description: "Reduce el daño recibido en un 70% y aumenta el daño máximo en 20.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.defense.reduction /= 2;
        currentPlayer.attack.damage.max += 70;
        currentPlayer.image = "https://e0.pxfuel.com/wallpapers/262/604/desktop-wallpaper-eula-genshin-impact-1904%C3%973173-dist.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Marceline: - Tus probabilidades de vivir son nulas ahora");
      },
    },
  },
  garouth: {
    name: "Garouth",
    maxHealth: 1300,
    health: 1300,
    transformed: false,
    attack: {
      name: "Resplandor Rojo",
      damage: { min: 80, max: 140 },
    },
    defense: {
      name: "Infinito",
      reduction: 10,
      message: "Garouth se protege con el infinito.",
    },
    image: "https://somoskudasai.com/wp-content/uploads/2021/09/portada_jujutsu-kaisen-89.jpg",
    specialAbility: {
      name: "Extensión de Dominio: Vacío Infinito",
      description: "Aumenta enormemente el daño mínimo y máximo en 200.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 200;
        currentPlayer.attack.damage.max += 200;
        currentPlayer.image = "https://anime.atsit.in/es/wp-content/uploads/2023/03/expansion-del-dominio-de-sukuna-santuario-malevolo-en-jujutsu-kaisen-explicado-4.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Garouth: - Extensión de Dominio: Vacío Infinito...");
      },
    },
  },
  onji: {
    name: "Onji",
    maxHealth: 1300,
    health: 1300,
    transformed: false,
    attack: {
      name: "Garra Afilada",
      damage: { min: 60, max: 110 },
    },
    defense: {
      name: "Reflejos Felinos",
      reduction: 0,
      message: "Onji esquivó el ataque con sus rápidos reflejos felinos.",
    },
    image: "https://i.pinimg.com/736x/92/b0/04/92b0042a91e10f8a1b54e7dc5c88847f.jpg",
    specialAbility: {
      name: "Doctrina Primordial Zen",
      description: "Aumenta el daño y la defensa de Onji durante un turno.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 30;
        currentPlayer.attack.damage.max += 65;
        currentPlayer.image = "https://i.pinimg.com/736x/76/97/df/7697dfec21f2ce10e7c9f1e55d45ec5f.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Onji: - No te servirán tus trucos, el león anda suelto");
      },
    },
  },
  medaka: {
    name: "Medaka",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "Golpe Divino",
      damage: { min: 70, max: 140 },
    },
    defense: {
      name: "Escudo Divino",
      reduction: 15,
      message: "Medaka invoca un escudo divino que reduce todo el daño recibido.",
    },
    image: "https://images.static-bluray.com/reviews/8968_1.jpg",
    specialAbility: {
      name: "Modo End God",
      description: "Aumenta el poder de ataque y reduce la defensa de Medaka temporalmente.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min *= 2;
        currentPlayer.attack.damage.max *= 2;
        currentPlayer.defense.reduction /= 2;
        currentPlayer.image = "https://static.zerochan.net/Kurokami.Medaka.full.1390453.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Medaka: -  Se acabaron los juegos, me hiciste enojar");
      },
    },
  },
  yato: {
    name: "Yato",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "Golpe",
      damage: { min: 60, max: 90 },
    },
    defense: {
      name: "Estilo Nyko: Indestructible",
      reduction: 15,
      message: "Yato se defende con Estilo Nyko: Indestructible ",
    },
    image: "https://i.pinimg.com/550x/0d/c6/2d/0dc62d99d46197e71a577e8c969a820d.jpg",
    specialAbility: {
      name: "Modo Histeria: Nivel 4",
      description: "Yato usa a histeria para ser más fuerte.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 40;
        currentPlayer.attack.damage.max += 90;
        currentPlayer.defense.reduction /= 2;
        currentPlayer.health += 200;
        currentPlayer.image = "https://i.pinimg.com/originals/15/07/a9/1507a978900e9ce8404a0e8907b8cbc8.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Yato: - Sufre hasta tu muerte, vamos, ¡Histeria!");
      },
    },
  },
  argos: {
    name: "Argos",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "Elemento Devastación",
      damage: { min: 80, max: 140 },
    },
    defense: {
      name: "Armadura del Emperador",
      reduction: 25,
      message: "Argos se protege con su Armadura del Emperador.",
    },
    image: "https://pm1.aminoapps.com/6471/e23711b95caa03ab0325368724fb20ae0363b380_hq.jpg", // Reemplaza con la URL de la imagen de Argos
    specialAbility: {
      name: "Doctrina Primordial Requiem",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 40;
        currentPlayer.attack.damage.max *= 2;
        currentPlayer.defense.reduction /= 4;
        currentPlayer.image = "https://i.pinimg.com/originals/03/9f/6d/039f6dd615df52da8bc5076216ec7b34.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Argos: - Más allá del espacio/tiempo, ¡Doctrina Activada!");
      },
    },
  },
  hector: {
    name: "Hector",
    maxHealth: 1400,
    health: 1400,
    attack: {
      name: "Dimensional Cut",
      damage: { min: 90, max: 160 },
    },
    defense: {
      name: "Ritual: Don't Touch",
      reduction: 30,
      message: "Hector realiza su Ritual: 'Don't Touch' para protegerse.",
    },
    image: "https://e0.pxfuel.com/wallpapers/593/727/desktop-wallpaper-zhongli-genshin-fanart.jpg", 
    specialAbility: {
      name: "Modo Avatar", 
      description: "Mejora enormemente el ataque de Héctor.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 80;
        currentPlayer.attack.damage.max += 40;
        currentPlayer.defense.reduction /= 2;
currentPlayer.health += 100;
        currentPlayer.image = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/68a42dd7-ce4d-456d-f743-6ef27a67ba00/width=1200/68a42dd7-ce4d-456d-f743-6ef27a67ba00.jpeg";
        updateUIForCharacter(currentPlayer);
        showMessage("Héctor: - ¿Quieres apurarte y morir? Mi harem espera");
      },
    },
  },
  raiden: {
    name: "Raiden",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "Liberación de la Sombras",
      damage: { min: 60, max: 110 },
    },
    defense: {
      name: "Luna Oscura",
      reduction: 25,
      message: "Raiden usa Luna oscura, creando un domo para protegerse.",
    },
    image: "https://i.pinimg.com/1200x/1b/c1/4c/1bc14c13a97bb6879413c2e3c55cd24b.jpg", 
    specialAbility: {
      name: "Poder Máximo",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 40;
        currentPlayer.attack.damage.max += 40;
        currentPlayer.defense.reduction /= 2;
        currentPlayer.image = "https://s1.aminoapps.com/image/kciyvieu4k6tjuvnhbhldtlx5fczhmou_hq.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Raiden: - Es hora de ponerme serio");
      },
    },
  },
  histeria: {
    name: "Histeria",
    maxHealth: 1400,
    health: 1400,
    attack: {
      name: "Magic Blaster",
      damage: { min: 100, max: 120 },
    },
    defense: {
      name: "Magic Wall",
      reduction: 4,
      message: "Histeria usa Magic Wall para protegerse",
    },
    image: "https://pbs.twimg.com/media/E0ZRBEGWYAEiEhl.jpg:small",
    specialAbility: {
      name: "Dragon Nova",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 20;
        currentPlayer.attack.damage.max += 40;
        currentPlayer.defense.reduction /= 2;
        currentPlayer.health += 240;
        currentPlayer.image = "https://pm1.aminoapps.com/6702/9aadf431dcbd0530f00a1c76a9874cd05e8a0484_hq.jpg";
        updateUIForCharacter(currentPlayer);
        showMessage("Histeria: - ¡Te cabornizaré hasta los huesos!");
      },
    },
  },
  tobirama: {
    name: "Tobirama",
    maxHealth: 1300,
    health: 1300,
    attack: {
      name: "Mordida del Dragon de Agua",
      damage: { min: 90, max: 130 },
    },
    defense: {
      name: "Muro de Agua",
      reduction: 6,
      message: "Tobirama levanta un muro de agua para protegerse",
    },
    image: "https://w0.peakpx.com/wallpaper/665/872/HD-wallpaper-naruto-tobirama-senju.jpg",
    specialAbility: {
      name: "Hirashin",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 30;
        currentPlayer.attack.damage.max += 30;
        currentPlayer.defense.reduction /= 2;
        currentPlayer.image = "https://pm1.aminoapps.com/7802/46b076f8a8762d8af6769df43f2473cd726199a1r1-672-900v2_uhq.jpg";
        showMessage("Tobirama:- Me cansé de jugar contigo, es hora de acabar con esto.");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  tesla: {
    name: "Tesla",
    maxHealth: 1600,
    health: 1600,
    attack: {
      name: "Plasma Punch",
      damage: { min: 90, max: 160 },
    },
    defense: {
      name: "Tesla Dance",
      reduction: 0,
      message: "Tesla esquiva todos los ataques con una extraña danza sobre la arena de combate.",
    },
    image: "https://i.redd.it/b6flfqzb2fk91.png",
    specialAbility: {
      name: "Jaula de los Dioses",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 36;
        currentPlayer.attack.damage.max += 90;
        currentPlayer.image = "https://www.theanimedaily.com/wp-content/uploads/2022/11/Record-Of-Ragnarok-Chapter-72-a-1024x670.jpg";
        showMessage("Tesla:- En esta jaula de 3.69 metros, el único Dios soy yo.");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  hades: {
    name: "Hades",
    maxHealth: 1600,
    health: 1600,
    attack: {
      name: "Perséfone Rompetormentas",
      damage: { min: 100, max: 160 },
    },
    defense: {
      name: "Puertas del Bifrost",
      reduction: 0,
      message: ".",
    },
    image: "https://ih1.redbubble.net/image.4816017628.9078/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg",
    specialAbility: {
      name: "Ikor Eos",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.name = "Amanecer Guiado por la Sangre"
        currentPlayer.health -= 150;
        currentPlayer.attack.damage.min *= 2;
        currentPlayer.attack.damage.max *= 2;
        currentPlayer.image = "https://pm1.aminoapps.com/8347/f718fc23038419fb694d3c213ade82f8e6d88b08r1-1080-1059v2_hq.jpg";
        showMessage("Hades: - Al fin está listo, Ikor Eos.");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  rosmontis: {
    name: "Rosmontis",
    maxHealth: 1000,
    health: 1000,
    attack: {
      name: "Magnetismo",
      damage: { min: 60, max: 100 },
    },
    defense: {
      name: "The Balance",
      reduction: 0,
      message: ".",
    },
    image: "https://cdn.donmai.us/original/c9/5e/c95ef055ef4e651abb4f7e7d5c99e1d3.png",
    specialAbility: {
      name: "Invocacion: Servant Mordred  ",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer = mordred;
        showMessage("Rosmontis:  - Usando este tesoro, yo te invoco, ¡Servant Mordred!");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  mordred: {
    name: "Mordred",
    maxHealth: 800,
    health: 800,
    attack: {
      name: "Explosion de Maná",
      damage: { min: 120, max: 140 },
    },
    defense: {
      name: "Vacio",
      reduction: 12,
      message: ".",
    },
    image: "https://w7.pngwing.com/pngs/312/164/png-transparent-mordred-saber-fate-stay-night-cosplay-costume-cosplay-fictional-character-weapon-fategrand-order.png",
  },

  ryuu: {
    name: "Ryuu",
    maxHealth: 1200,
    health: 1200,
    attack: {
      name: "High Hopes",
      damage: { min: 60, max: 100 },
    },
    defense: {
      name: "Astrea Record´s",
      reduction: 0,
      message: ".",
    },
    image: "https://i.pinimg.com/originals/27/82/59/2782591d357853a5d82a0edfe5e1b97a.jpg",
    specialAbility: {
      name: "Invocacion: Arjuna Alter  ",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer = arjuna;
        showMessage("Ryuu: - Contempla el poder... yo te invoco, Servant Arjuna Alter");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  arjuna: {
    name: "Arjuna",
    maxHealth: 900,
    health: 900,
    attack: {
      name: "Mad Enhancement",
      damage: { min: 120, max: 140 },
    },
    defense: {
      name: "Mahapralaya",
      reduction: 12,
      message: ".",
    },
    image: "https://gamepress.gg/grandorder/sites/grandorder/files/2019-06/247_Arjuna%20Alter_2.png",
  },
  kenjaku: {
    name: "Kenjaku (Geto)",
    currentForm: "Falso Suguru Geto",
    maxHealth: 1000,
    health: 1000,
    attack: {
      name: "Uzumaki",
      damage: { min: 140, max: 180 },
    },
    defense: {
      name: "Recubrimiento de Energia Maldita",
      reduction: 0,
      message: ".",
    },
    image: "https://i2.wp.com/s1.zerochan.net/Kenjaku.600.3389180.jpg",
    specialAbility: {
      name: "Transformación Ilusoria",
      description: "Pasa de Falso Suguru Geto a Falso Gojo Satoru.",
      canUse: function () {
        return true; // Condición para usar la habilidad especial (puede ser cualquier condición que desees)
      },
      use: function () {
        if (currentPlayer.currentForm === "Falso Suguru Geto") {
          showMessage("Kenjaku: - Mi voluntad ha sido heredada");
          currentPlayer.currentForm = "Falso Gojo Satoru";
          // Actualizar otras propiedades o habilidades para la forma de Falso Gojo Satoru si es necesario
          // Por ejemplo:
          currentPlayer.name = "Kenjaku (Gojo)";
          currentPlayer.maxHealth = 1000;
          currentPlayer.health = 1000;
          currentPlayer.attack.damage.min = 200;
          currentPlayer.attack.damage.max = 220;
          currentPlayer.attack.name = "Resplandor Rojo";
          currentPlayer.defense.name = "Infinito";
          currentPlayer.defense.reduction = 0;
          currentPlayer.image = " https://i.ytimg.com/vi/qIqtgZIRiHw/hq720.jpg?sqp=-oaymwEiCL0EENAFSFryq4qpAxQIARUAAAAAJQAAyEI9AICiQ9ABAQ==&rs=AOn4CLCNYtd2x-XqiFskc5Y93G23CPdgtQ"; // Cambiar la imagen del personaje
        } else {
          showMessage("Kenjaku: ¡Volver a Falso Suguru Geto!");
          currentPlayer.currentForm = "Falso Suguru Geto";
          // Restaurar otras propiedades o habilidades para la forma de Falso Suguru Geto si es necesario
          // Por ejemplo:
          currentPlayer.maxHealth = 1000;
          currentPlayer.health = 1000;
          currentPlayer.attack.damage.min = 180;
          currentPlayer.attack.damage.max = 200;
          currentPlayer.image = "https://i2.wp.com/s1.zerochan.net/Kenjaku.600.3389180.jpg"; // Cambiar la imagen del personaje
        }
        updateUIForCharacter(currentPlayer);
      }
    }
  },
  xair: {
    name: "Xair",
    maxHealth: 1300,
    health: 1300,
    attack: {
      name: "Filo Congelado",
      damage: { min: 60, max: 160 },
    },
    defense: {
      name: "Recubrimiento de C.E.O",
      reduction: 5,
      message: ".",
    },
    image: "https://th.bing.com/th/id/OIG2.TKcSS4d25EKerSS1GdZ.?w=270&h=270&c=6&r=0&o=5&dpr=1.5&pid=ImgGn",
    specialAbility: {
      name: "Bijon: Ojos de la Eternidad",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 60;
        currentPlayer.attack.damage.max += 30;
        currentPlayer.image = "https://th.bing.com/th/id/OIG2.rPPK3iTbYE4nDEIFZRJr?w=270&h=270&c=6&r=0&o=5&dpr=1.5&pid=ImgGn";
        showMessage("Xair: - Te congelaré hasta los huesos...");
        updateUIForCharacter(currentPlayer);
      },
    },
  },
  nathan: {
    name: "Nathan",
    maxHealth: 1270,
    health: 1270,
    attack: {
      name: "Paso Flash",
      damage: { min: 35, max: 170 },
      chargedDamage: 400, 
      chargePercentage: 0,
    },
    defense: {
      name: "Kami",
      reduction: 0,
      message: ".",
    },
    image: "https://c4.wallpaperflare.com/wallpaper/547/180/15/fate-series-fate-grand-order-okada-izou-fate-series-hd-wallpaper-preview.jpg",
    specialAbility: {
      name: "Kakusei Hiraishin",
      description: "Aumenta la precisión y la probabilidad de golpear críticos.",
      canUse: function () {
        return currentPlayer.health <= currentPlayer.maxHealth * 0.5;
      },
      use: function () {
        currentPlayer.attack.damage.min += 75;
        currentPlayer.attack.damage.max += 35;
        currentPlayer.image = "https://pm1.aminoapps.com/7904/5a576f1a011390d7b459dfcbef5e46c8ee527243r1-735-1031v2_hq.jpg";
        showMessage("Nathan: - No desperdiciaré esta oportunidad, Kakusei...");
        updateUIForCharacter(currentPlayer);
      },
    },  
  }
};


let currentPlayer = characters.red;
let userDefending = false;


function updateUIForCharacter(character) {
  const characterImage = document.querySelector(".character-image");
  characterImage.src = character.image;

  
  const specialAbilityButton = document.getElementById("specialAbilityButton");
  if (specialAbilityButton) {
    specialAbilityButton.addEventListener("click", function () {
      useSpecialAbility(currentPlayer);
    });
  }

  const attackButton = document.getElementById("attackButton");
  if (attackButton) {
    attackButton.addEventListener("click", function () {
      attack(currentPlayer);
    });
  }

  const defenseButton = document.getElementById("defenseButton");
  if (defenseButton) {
    defenseButton.addEventListener("click", function () {
      defend(currentPlayer);
    });
  }
  
}

function useSpecialAbility(character) {
  const specialAbilityMessage = document.getElementById("specialAbilityMessage");

  if (character.specialAbility && character.specialAbility.canUse()) {
    const specialAbilityName = character.specialAbility.name;
    specialAbilityMessage.textContent = `${character.name} ha activado su Habilidad Especial: ${specialAbilityName}`;
    specialAbilityMessage.classList.add("show");
    specialAbilityMessage.style.color = "blue";
    specialAbilityMessage.style.fontWeight = "bold";

    if (character.name === "Rosmontis") {
      showMessage("Rosmontis: - Usando este tesoro, yo te invoco, ¡Servant Mordred!");
      currentPlayer = characters.mordred;
    } else if (character.name === "Ryuu") {
      showMessage("Ryuu: - Contempla el poder... yo te invoco, Servant Arjuna Alter");
      currentPlayer = characters.arjuna;
    }

    if (currentPlayer.name === "Tesla" || "Nathan") {
      const teslaSpecialBar = document.getElementById("tesla-special-bar");
      teslaSpecialBar.style.width = "100%"; // Llena la barra
      teslaSpecialBar.classList.add("titilar");
    }

    if (currentPlayer.name ==="Onji"){
      const onjiHealthBar = document.querySelector(".user-health");
      onjiHealthBar.style.backgroundColor = "purple";
      onjiHealthBar.classList.add("titilar");
  
      const extraDamage = currentPlayer.attack.damage.min * 0.90; // 10% de daño extra
      currentPlayer.attack.damage.min += extraDamage;
      currentPlayer.attack.damage.max += extraDamage;
      }

      if (currentPlayer.name ==="Xair"){
        const xairHealthBar = document.querySelector(".user-health");
        xairHealthBar.style.backgroundColor = "cyan";
        xairHealthBar.classList.add("titilar");}

    updateUIForCharacter(currentPlayer);

    setTimeout(() => {
      specialAbilityMessage.classList.remove("show");
    }, 3000);

    const specialAbilityButton = document.getElementById("specialAbilityButton");
    if (specialAbilityButton) {
      specialAbilityButton.disabled = true;
    }
    character.specialAbility.use();
  } else {
    specialAbilityMessage.textContent = "No puedes usar la habilidad especial en este momento o ya la has usado.";
    specialAbilityMessage.classList.add("show");
    specialAbilityMessage.style.color = "red";

    setTimeout(() => {
      specialAbilityMessage.classList.remove("show");
    }, 3000);
  }
}




function updateButtons() {
  const attackButton = document.getElementById("attackButton");
  const defenseButton = document.getElementById("defenseButton");
  defenseButton.innerHTML = `<i class="fas fa-shield-alt"></i> Defensa: ${currentPlayer.defense.name}`;
}


const boss = {
  name: "Jogo",
  maxHealth: 1700,
  health: 1700,
};

function changeCharacter(character) {
  currentPlayer = characters[character];
  updateButtons();
  updateUIForCharacter(currentPlayer);
}

function showMessage(message) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = message;
}

function showDamageLog(message) {
  const damageLog = document.getElementById("damageLog");
  const logMessage = document.createElement("p");
  logMessage.textContent = message;
  damageLog.appendChild(logMessage);
}

function clearDamageLog() {
  const damageLog = document.getElementById("damageLog");
  damageLog.innerHTML = "";
}

function disableOptions() {
  const options = document.querySelectorAll(".option");
  options.forEach((option) => {
    option.disabled = true;
    option.classList.add("disabledCursor");
  });
}

function disableSpecialAbilityButton() {
  const specialAbilityButtons = document.querySelectorAll(".specialAbilityButton");
  specialAbilityButtons.forEach((specialAbilityButton) => {
    specialAbilityButton.disabled = true;
    specialAbilityButton.classList.add("disabledCursor");
  });
}

function enableOptions() {
  const options = document.querySelectorAll(".option");
  options.forEach((option) => {
    option.disabled = false;
  });
}

function calculateDamage(damageRange) {
  const minDamage = damageRange.min;
  const maxDamage = damageRange.max;
  return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
}

let turnCounter = 3;

function attack() {
  if (!userDefending) {
    const damage = calculateDamage(currentPlayer.attack.damage);
    const criticalChance = Math.random();
    const attackMessage = criticalChance <= 0.2
      ? `¡Ataque crítico! ${currentPlayer.name} utiliza ${currentPlayer.attack.name} y inflige un daño masivo a ${boss.name}.`
      : `${currentPlayer.name} utiliza ${currentPlayer.attack.name} y ataca a ${boss.name}, quitándole ${damage} puntos de vida.`;

    showMessage(attackMessage);
boss.health -= criticalChance <= 0.2 ? damage * 2 : damage;

turnCounter--;
if (currentPlayer.name === "Xair" && turnCounter === 0) {
  showMessage("¡Xair activa C.E.O y congela al oponente!");
  // Congelar al oponente
  boss.frozen = true;
  // Triplicar el daño del jugador en el próximo turno
  currentPlayer.attack.damage.min += 30;
  currentPlayer.attack.damage.max += 30;
  // Reiniciar el contador de turnos
  turnCounter = 3;
}
    if (currentPlayer.name === "Histeria") {
      const lifeGained = damage * 0.2; 
      currentPlayer.health += lifeGained;
      showDamageLog(`Histeria ha robado ${lifeGained.toFixed()} puntos de vida.`);
      updateHealthBars();
    }
    
    if(currentPlayer.name === "Nathan"){
    const characterImage = document.querySelector(".character-image");
    characterImage.classList.add("yellowShadow");

    // Restablecer el efecto después de un tiempo
    setTimeout(() => {
      characterImage.classList.remove("yellowShadow");
    }, 3000);}

    currentPlayer.attack.chargePercentage += 20;

  // Verificar si la barra está completamente cargada
  if (currentPlayer.attack.chargePercentage >= 100) {
    showMessage(`${currentPlayer.name} ha cargado su ataque al máximo, provocando 400 puntos de daño.`);
    currentPlayer.attack.chargePercentage = 0; // Reiniciar la barra después de usar el ataque cargado
    boss.health -= currentPlayer.attack.chargedDamage; // Aplicar daño cargado al enemigo
  }

    if (boss.health <= 0) {
        // Función para obtener el usuario actual mediante una solicitud AJAX
function obtenerUsuarioActual() {
    var xhr = new XMLHttpRequest();
    var url = "estadisticas.php";

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // Dividir la respuesta por saltos de línea y tomar la primera línea
                var primeraLinea = xhr.responseText.split('\n')[0];
                // Parsear la respuesta JSON de la primera línea para obtener el nombre de usuario
                var respuesta = JSON.parse(primeraLinea);
                var usuario = respuesta.username;
                
                console.log("Usuario actual:", usuario);
                
                // Ejecutar la función para actualizar el contador de jefes derrotados
                actualizarJefe(usuario);
            } else {
                console.error("Error en la solicitud AJAX:", xhr.status);
            }
        }
    };

    xhr.open("GET", url, true);
    xhr.send();
}

function actualizarJefe(usuario) {
    // Ejecutar AJAX para actualizar el contador de jefes derrotados
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "actualizar_megajefe.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
        }
    };
    xhr.send("usuario=" + encodeURIComponent(usuario)); // Pasar el nombre de usuario como parámetro en la solicitud AJAX
}

// Llamar a la función para obtener el usuario actual
obtenerUsuarioActual();


      showMessage(`¡Has derrotado a ${boss.name}! ¡Has ganado!`);
      disableOptions();
      disableSpecialAbilityButton();
       helpButton.disabled = true;
      updateHealthBars();
    } else {
      clearDamageLog();
      disableOptions();
      setTimeout(() => {
        bossTurn();
      }, 2000);
    }

    updateHealthBars();
  } else {
    showMessage("¡Estás defendiéndote este turno y no puedes atacar!");
  }
}


function defend() {
  if (!userDefending) {
    userDefending = true;
    showMessage(`${currentPlayer.name} está utilizando ${currentPlayer.defense.name} para defenderse este turno.`); 
    disableOptions();
    setTimeout(() => {
      bossTurn(); 
      enableOptions(); 
    }, 2000); 
  } else {
    showMessage("¡Ya estás defendiéndote este turno!");
  }
}


// Declarar una variable de bandera para verificar si la expansión de dominio está activa
let expansionActivated = false;

function bossTurn() {
  let bossDamage = Math.floor(Math.random() * 110) + 70;
  let halfHealth = boss.maxHealth / 2; // Obtener la mitad de la salud máxima del jefe

  if (userDefending) {
    currentPlayer.health -= currentPlayer.defense.reduction;
    showDamageLog(`${boss.name} te ha quitado ${currentPlayer.defense.reduction} puntos de vida con su ataque.`);
  } else {
    currentPlayer.health -= bossDamage;

    if (currentPlayer.name === "Tobirama") {
      bossDamage *= 0.7; 
      showDamageLog(`¡El Hiraishin de Tobirama ha reducido el daño pasivamente!`);
    }

    if (boss.frozen) {
      showMessage("¡El jefe está congelado y su fuerza es menor!");
      boss.frozen = false;
      bossDamage *= 0.3;
    }

    // Verificar si la expansión de dominio está activa
    if (expansionActivated) {
      bossDamage *= 2; // Aumentar el daño del jefe al doble
    }

    if (boss.health <= halfHealth && !boss.halfHealthReached) {
      // Si la vida del jefe es menor o igual al 50% y aún no ha alcanzado este punto
      boss.halfHealthReached = true; // Marcar que se ha alcanzado el 50% de la salud del jefe

      // Aumentar el daño del jefe al doble
      bossDamage *= 2;

      // Mostrar el gif
      const bossImageContainer = document.getElementById("bossImage");
      bossImageContainer.src = "https://static.wikia.nocookie.net/jujutsu-kaisen/images/4/46/Jogo%27s_Coffin_of_the_Iron_Mountain.gif/revision/latest/scale-to-width/360?cb=20210218114405";

      // Después de que termine el gif, mostrar la imagen estática después de un tiempo
      setTimeout(() => {
        bossImageContainer.src = "https://i.ytimg.com/vi/4rLS-ANg3oQ/maxresdefault.jpg";
      }, 24000); // Reemplaza duracion_del_gif con la duración real del gif en milisegundos

      // Actualizar la frase del jefe
      showMessage("Expansión de Dominio: Montaña Ataúd de Hierro");

      // Activar la expansión de dominio
      expansionActivated = true;
    } else if (boss.name === "Jogo") {
      const phrases = [
        "Jogo: - No eres la gran cosa",
        "Jogo: - Me estas aburriendo con tus trucos",
        "Jogo: - Espera...Deberías haberte calcinado con eso",
        "Jogo: - Por favor, no llames a Sukuna",
        "Jogo: - Ya te dije que no me llames cabeza de volcán",
        // Agrega más frases aquí según desees
      ];
      const randomIndex = Math.floor(Math.random() * phrases.length);
      const phrase = phrases[randomIndex];
      showMessage(phrase);
    }

    showDamageLog(`${boss.name} te ha quitado ${bossDamage.toFixed()} puntos de vida con su ataque.`);
  }


  if (currentPlayer.name === "Red" && currentPlayer.specialAbility.canUse()) {
    const reflectedDamage = Math.floor(bossDamage * 0.5); // Reflejar el 50% del daño recibido
    boss.health -= reflectedDamage;
    const message = `${currentPlayer.name} ha reflejado ${reflectedDamage} puntos de daño a ${boss.name} con el Modo Suicidio.`;

    const pasivasContainer = document.getElementById("pasivas");
    const redSpecialMessage = document.createElement("p");
    redSpecialMessage.textContent = message;
    pasivasContainer.appendChild(redSpecialMessage);

    setTimeout(() => {
      pasivasContainer.removeChild(redSpecialMessage);
    }, 2000);
  }

  updateHealthBars();
  
  if (currentPlayer.health <= 0) {
    showMessage(`¡${boss.name} te ha vencido! Vuelve a intentarlo en la próxima pelea.`);
    disableOptions();
    disableSpecialAbilityButton();
    helpButton.disabled = true;
  } else {
    userDefending = false;
    enableOptions();
  }

  setTimeout(() => {
    clearDamageLog();
    updateHealthBars();
  }, 2000);
} 

 
function updateHealthBars() {
  const userHealthBar = document.querySelector(".user-health");
  const bossHealthBar = document.querySelector(".boss-health");
  const userPercentage = (currentPlayer.health / currentPlayer.maxHealth) * 100;
  const bossPercentage = (boss.health / boss.maxHealth) * 100;
  userHealthBar.style.width = userPercentage + "%";
  bossHealthBar.style.width = bossPercentage + "%";
}

function goBack() {
  window.history.back();
}



function askForHelp() {
  const helpButton = document.getElementById("helpButton");

  if (currentPlayer.health <= 0) {
      helpButton.disabled = true;
    showMessage(`${currentPlayer.name} está derrotado y no puede pedir ayuda.`);
  } else {
    if (helpButton.disabled) {
      showMessage(`Ya has pedido ayuda y debes esperar a que el jefe ataque.`);
    } else {
      const healthRecovered = 120; // Cambiar la cantidad de vida recuperada según tus necesidades
      currentPlayer.health = Math.min(currentPlayer.health + healthRecovered, currentPlayer.maxHealth);

      showMessage(`${currentPlayer.name} ha usado la Técnica de Maldicion Inversa y ha recuperado ${healthRecovered} puntos de vida.`);
      updateHealthBars();
      disableOptions(); // Deshabilita otras opciones del jugador

      helpButton.disabled = true; // Desactiva el botón hasta que el jefe ataque

      setTimeout(() => {
        bossTurn(); // Llamar a bossTurn para que el jefe ataque después de la recuperación de salud

        setTimeout(() => {
          helpButton.disabled = false; // Habilita el botón nuevamente después del ataque del jefe
          enableOptions(); // Habilita las opciones después del retraso
        }, 2000); // Espera 2 segundos después del ataque para habilitar el botón y las opciones nuevamente
      }, 2000); // Espera 2 segundos antes de que el jefe ataque
    }
  }
}