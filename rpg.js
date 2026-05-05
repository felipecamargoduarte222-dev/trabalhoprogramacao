// estamos estruturando usando classes (orientação a objetos)
// a ideia é depois integrar tudo no sistema de batalha principal

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function perguntar(pergunta) {
  return new Promise((resolve) => rl.question(pergunta, resolve));
}

// ===== CLASSE BASE =====
class Personagem {
  constructor(nome, hp, mana) {
    this.nome = nome;
    this.hp = hp;
    this.mana = mana;
  }

  receberDano(dano) {
    this.hp -= dano;
  }
}

// ===== CLASSES =====

// Guerreiro: mais dano físico
class Guerreiro extends Personagem {
  atacar() {
    return Math.floor(Math.random() * 10) + 15;
  }
}

// Mago: usa mana pra causar mais dano
class Mago extends Personagem {
  usarMagia() {
    if (this.mana >= 10) {
      this.mana -= 10;
      return Math.floor(Math.random() * 15) + 20;
    } else {
      return 0;
    }
  }
}

// Arqueiro: equilibrado (esquiva ainda vai ser adicionada)
class Arqueiro extends Personagem {
  atacar() {
    return Math.floor(Math.random() * 12) + 12;
  }
}

// ===== INÍCIO DO JOGO =====

async function iniciar() {
  console.log("=== RPG TESTE ===");

  let nome = await perguntar("Nome do personagem: ");

  console.log("Escolha sua classe:");
  console.log("1 - Guerreiro");
  console.log("2 - Mago");
  console.log("3 - Arqueiro");

  let escolha = await perguntar("> ");

  let player;

  // criação do personagem com base na escolha
  if (escolha == "1") {
    player = new Guerreiro(nome, 100, 30);
  } else if (escolha == "2") {
    player = new Mago(nome, 70, 100);
  } else {
    player = new Arqueiro(nome, 85, 60);
  }

  console.log("Personagem criado:");
  console.log("HP:", player.hp);
  console.log("Mana:", player.mana);

  // ===== INÍCIO DA BATALHA (ainda incompleto) =====

  let dragaoHP = 150;

  console.log("");
  console.log("Um dragão apareceu!");

  console.log("Seu HP:", player.hp);
  console.log("HP do dragão:", dragaoHP);

  console.log("");
  console.log("1 - Atacar");
  console.log("2 - Magia");

  let acao = await perguntar("> ");

  if (acao == "1") {
    let dano = player.atacar ? player.atacar() : 0;
    dragaoHP -= dano;
    console.log("Você causou", dano, "de dano");
  }

  if (acao == "2") {
    if (player.usarMagia) {
      let dano = player.usarMagia();
      dragaoHP -= dano;
      console.log("Magia causou", dano, "de dano");
    } else {
      console.log("Sua classe não usa magia ainda");
    }
  }

  console.log("HP do dragão agora:", dragaoHP);

  // aqui ainda falta:
  // - loop de batalha
  // - turno do inimigo
  // - sistema de cura
  // - condições de vitória/derrota

  rl.close();
}

iniciar();
