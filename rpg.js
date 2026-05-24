// THE ELDER SCROLLS 1: DRAGON'S REALM
// Feito por: Felipe Camargo e Kauã Alexandre
// Trabalho de programação - 2025

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function perguntar(p) {
  return new Promise(r => rl.question(p, r));
}
function enter(msg) {
  msg = msg || "  [ENTER para continuar]";
  return new Promise(r => rl.question(msg, r));
}
function pausa(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// CLASSES DO PERSONAGEM
// F - fez as tres classes jogaveis


class Personagem {
  constructor(nome, hp, mana, atk, def) {
    this.nome = nome;
    this.hp = hp;
    this.hpMax = hp;
    this.mana = mana;
    this.manaMax = mana;
    this.atk = atk;
    this.def = def;
    this.xp = 0;
    this.nivel = 1;
    this.ouro = 10;
    this.inventario = [];
    this.arma = "Punho";
    this.bonusAtk = 0;
  }

  vivo() {
    return this.hp > 0;
  }

  levarDano(d) {
    const real = Math.max(1, d - this.def);
    this.hp = Math.max(0, this.hp - real);
    return real;
  }

  curar(v) {
    const c = Math.min(v, this.hpMax - this.hp);
    this.hp += c;
    return c;
  }

  ganharXP(quantidade) {
    this.xp += quantidade;
    const xpNecessario = this.nivel * 40;
    if (this.xp >= xpNecessario) {
      this.nivel++;
      this.xp = 0;
      this.atk += 3;
      this.hpMax += 15;
      this.hp = Math.min(this.hp + 15, this.hpMax);
      console.log("");
      console.log("  *** LEVEL UP! Voce chegou ao nivel " + this.nivel + "! ***");
      console.log("  Ataque +3 | HP maximo +15");
      return true;
    }
    return false;
  }

  status() {
    console.log("  HP: " + this.hp + "/" + this.hpMax + "  |  Mana: " + this.mana + "/" + this.manaMax + "  |  Nivel: " + this.nivel);
    console.log("  Ouro: " + this.ouro + "  |  Arma: " + this.arma);
  }
}

class Guerreiro extends Personagem {
  constructor(n) {
    super(n, 130, 20, 20, 6);
    this.classe = "Guerreiro";
  }
  atacar() {
    const base = Math.floor(Math.random() * 10) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.25;
    return { dano: crit ? Math.floor(base * 1.8) : base, crit };
  }
  habilidade() {
    // guerreiro pode entrar em furia
    if (this.mana < 20) return { semMana: true };
    this.mana -= 20;
    const base = Math.floor(Math.random() * 15) + this.atk + this.bonusAtk + 10;
    return { dano: base, crit: false, especial: "FURIA DO GUERREIRO" };
  }
}

class Mago extends Personagem {
  constructor(n) {
    super(n, 75, 110, 12, 2);
    this.classe = "Mago";
  }
  atacar() {
    const base = Math.floor(Math.random() * 6) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.30;
    return { dano: crit ? Math.floor(base * 2.0) : base, crit };
  }
  habilidade() {
    if (this.mana < 25) return { semMana: true };
    this.mana -= 25;
    const base = Math.floor(Math.random() * 20) + 28;
    const crit = Math.random() < 0.30;
    return { dano: crit ? Math.floor(base * 2.0) : base, crit, especial: "BOLA DE FOGO" };
  }
}

class Arqueiro extends Personagem {
  constructor(n) {
    super(n, 95, 55, 15, 3);
    this.classe = "Arqueiro";
  }
  atacar() {
    const base = Math.floor(Math.random() * 8) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.38;
    return { dano: crit ? Math.floor(base * 1.6) : base, crit };
  }
  habilidade() {
    if (this.mana < 18) return { semMana: true };
    this.mana -= 18;
    const base = Math.floor(Math.random() * 12) + 22;
    const crit = Math.random() < 0.38;
    return { dano: crit ? Math.floor(base * 1.6) : base, crit, especial: "CHUVA DE FLECHAS" };
  }
}


// INIMIGOS
// K - fez os inimigos com personalidade


function criarInimigo(tipo) {
  const inimigos = {
    goblin:   { nome: "Goblin Fedorento",  hp: 35,  hpMax: 35,  atk: 10, def: 1, xp: 15, ouro: [2,6],  fala: "GREEEK! Vai embora daí!" },
    lobo:     { nome: "Lobo das Neves",    hp: 45,  hpMax: 45,  atk: 13, def: 2, xp: 18, ouro: [0,3],  fala: "...(rosna)..." },
    esqueleto:{ nome: "Esqueleto Antigo",  hp: 40,  hpMax: 40,  atk: 12, def: 3, xp: 20, ouro: [3,7],  fala: "...tatatata... (barulho de ossos)" },
    orc:      { nome: "Orc Guerreiro",     hp: 65,  hpMax: 65,  atk: 16, def: 4, xp: 28, ouro: [5,10], fala: "URRRGH! Orc vai esmagar!" },
    espirito: { nome: "Espirito do Gelo",  hp: 50,  hpMax: 50,  atk: 15, def: 2, xp: 22, ouro: [4,8],  fala: "...você não pertence aqui..." },
    vikingzumbi: { nome: "Viking Morto-Vivo", hp: 60, hpMax: 60, atk: 17, def: 5, xp: 30, ouro: [6,12], fala: "VALHALLAAAA!" },
    cavaleiro: { nome: "Cavaleiro da Peste", hp: 70, hpMax: 70, atk: 18, def: 6, xp: 35, ouro: [8,15], fala: "A praga vai te consumir..." },
  };
  const base = inimigos[tipo];
  if (!base) return null;
  return { ...base, vivo() { return this.hp > 0; } };
}

function ataqueInimigo(inimigo) {
  const d = Math.floor(Math.random() * 8) + inimigo.atk;
  const crit = Math.random() < 0.18;
  return { dano: crit ? Math.floor(d * 1.5) : d, crit };
}

function inimigoLevarDano(inimigo, d) {
  const real = Math.max(1, d - inimigo.def);
  inimigo.hp = Math.max(0, inimigo.hp - real);
  return real;
}


// SISTEMA DE BATALHA
// K - loop de batalha principal


async function batalha(player, inimigo, ehBoss) {
  ehBoss = ehBoss || false;
  console.log("");
  console.log("  >> batalha iniciada");
  console.log("  Inimigo: " + inimigo.nome);
  if (inimigo.fala) console.log('  "' + inimigo.fala + '"');
  

  let turno = 1;

  while (player.vivo() && inimigo.vivo()) {
    console.log("");
    console.log("  --- Turno " + turno + " ---");
    player.status();
    console.log("  HP do " + inimigo.nome + ": " + inimigo.hp + "/" + inimigo.hpMax);
    console.log("");
    console.log("  1 - Atacar com " + player.arma);
    console.log("  2 - Usar habilidade especial (custa mana)");
    console.log("    " + (player.classe === "Guerreiro" ? "Furia (+10 ataque, 20 mana)" : player.classe === "Mago" ? "Bola de Fogo (25 mana)" : "Chuva de Flechas (18 mana)"));
    console.log("  3 - Curar com magia (+25 HP, custa 15 mana)");
    console.log("  4 - Usar pocao do inventario");

    const acao = await perguntar("  > ");

    if (acao === "1") {
      const r = player.atacar();
      const d = inimigoLevarDano(inimigo, r.dano);
      console.log("");
      if (r.crit) {
        console.log("  CRITICO! Voce causou " + d + " de dano!");
      } else {
        console.log("  Voce causou " + d + " de dano.");
      }

    } else if (acao === "2") {
      const r = player.habilidade();
      if (r.semMana) { console.log("  Mana insuficiente!"); continue; }
      const d = inimigoLevarDano(inimigo, r.dano);
      console.log("");
      console.log("  " + r.especial + "! " + d + " de dano!");
      console.log("  Mana restante: " + player.mana);

    } else if (acao === "3") {
      if (player.mana < 15) { console.log("  Mana insuficiente para curar!"); continue; }
      player.mana -= 15;
      const c = player.curar(25);
      console.log("  Voce se curou! +" + c + " HP. HP: " + player.hp);

    } else if (acao === "4") {
      const pocoes = player.inventario.filter(i => i === "Pocao de Cura");
      if (pocoes.length === 0) {
        console.log("  Voce nao tem pocoes!");
        continue;
      }
      player.inventario.splice(player.inventario.indexOf("Pocao de Cura"), 1);
      const c = player.curar(50);
      console.log("  Voce usou uma Pocao de Cura! +" + c + " HP. HP: " + player.hp);

    } else {
      console.log("  Opcao invalida.");
      continue;
    }

    if (!inimigo.vivo()) break;

    // turno do inimigo
    const ri = ataqueInimigo(inimigo);
    const di = player.levarDano(ri.dano);
    console.log("");
    if (ri.crit) {
      console.log("  GOLPE CRITICO do " + inimigo.nome + "! -" + di + " HP!");
    } else {
      console.log("  " + inimigo.nome + " ataca! -" + di + " HP.");
    }

    turno++;
    if (player.vivo() && inimigo.vivo()) await enter();
  }

  console.log("");
  if (player.vivo()) {
    const xpGanho = inimigo.xp;
    const ouroGanho = inimigo.ouro[0] + Math.floor(Math.random() * (inimigo.ouro[1] - inimigo.ouro[0] + 1));
    console.log("  Voce venceu! +" + xpGanho + " XP | +" + ouroGanho + " ouro");
    player.ganharXP(xpGanho);
    player.ouro += ouroGanho;
    // chance de dropar pocao
    if (Math.random() < 0.35) {
      player.inventario.push("Pocao de Cura");
      console.log("  O inimigo dropou uma Pocao de Cura!");
    }
    return true;
  } else {
    console.log("  Voce foi derrotado por " + inimigo.nome + "...");
    return false;
  }
}


// CAMPANHAS
// F e K - cada um fez 2 campanhas


// F - Campanha 1: Nunavut
async function campanhaNumavut(player) {
  console.log("");
  
  console.log("   Campanha 1: O Frio de Nunavut");
  
  await enter();
  console.log("");
  console.log("  A neve cai silenciosamente sobre Nunavut.");
  console.log("  O sol mal aparece. O vento corta como faca.");
  await enter();
  console.log("");
  console.log("  Voce entra numa pequena taverna feita de madeira e gelo.");
  console.log("  Um velho cacador inuit te olha sem piscar.");
  console.log('  "Outro aventureiro... os espiritos nao gostam de estranhos."');
  await enter();
  console.log("");
  console.log("  Voce precisa atravessar as planices congeladas para chegar");
  console.log("  ao Templo de Gelo onde um espirito antigo esta causando nevascas");
  console.log("  que nao param ha 3 meses.");
  await enter();

  // encontro 1 - lobo
  console.log("");
  console.log("  Na primeira hora de caminhada, voce ouve um uivo...");
  console.log("  Um lobo enorme emerge da nevasca!");
  await enter("  [ENTER para lutar]");
  const lobo = criarInimigo("lobo");
  const v1 = await batalha(player, lobo);
  if (!v1) {
    console.log("  game over. O frio de Nunavut nao perdoa.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  Voce continua andando. A aurora boreal aparece no ceu.");
  console.log("  As cores dancarinas parecem te guiar... ou te enganar.");
  await enter();

  // escolha
  console.log("");
  console.log("  Voce chega a uma bifurcacao na neve.");
  console.log("  1 - Seguir a trilha marcada pelos cacadores");
  console.log("  2 - Seguir as luzes da aurora boreal");
  const escolha = await perguntar("  > ");

  if (escolha === "2") {
    console.log("");
    console.log("  As luzes te levam a um esconderijo esquecido...");
    console.log("  Voce encontra um Amuleto Arctico! +5 ataque");
    player.bonusAtk += 5;
    player.arma = "Amuleto Arctico";
    await enter();
  } else {
    console.log("");
    console.log("  A trilha te leva direto ao templo. Mais rapido, mas nada de bonus.");
    await enter();
  }

  // mini boss - espirito
  console.log("");
  console.log("  Voce chega ao Templo de Gelo.");
  console.log("  O ar congela dentro dos pulmoes.");
  console.log("  Um Espirito do Gelo bloqueia a entrada!");
  await enter("  [ENTER para lutar]");
  const espirito = criarInimigo("espirito");
  const v2 = await batalha(player, espirito);
  if (!v2) {
    console.log("  game over. Seus ossos ficaram no gelo para sempre.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  Dentro do templo, voce encontra o nucleo do Espirito Ancestral.");
  console.log("  Uma criatura feita de gelo e sombra. Seus olhos sao a aurora boreal.");
  console.log('  "Eu espero ha duzentos anos. Voce e digno de morrer aqui."');

  // boss - espirito ancestral (mais forte)
  const boss = { nome: "Espirito Ancestral de Nunavut", hp: 120, hpMax: 120, atk: 20, def: 4, xp: 80, ouro: [20, 30], fala: "O gelo sera seu tumulo.", vivo() { return this.hp > 0; } };
  await enter("  [ENTER para a batalha final]");
  const v3 = await batalha(player, boss, true);

  if (v3) {
    console.log("");
    console.log("  O espirito se desfaz em cristais de neve.");
    console.log("  A nevasca para. Por um momento, o ceu fica limpo.");
    console.log("  Nunavut respira de novo.");
    console.log("");
    console.log("  O velho cacador aparece do nada atras de voce.");
    console.log('  "Eu sabia que voce conseguia. Os espiritos te escolheram."');
    console.log("");
    console.log("  -- fim da campanha --");
  } else {
    console.log("  game over. O Espirito Ancestral foi forte demais.");
  }
  return v3;
}

// K - Campanha 2: Inglaterra
async function campanhaInglaterra(player) {
  console.log("");
  
  console.log("   Campanha 2: A Praga de Londres");
  
  await enter();
  console.log("");
  console.log("  A chuva nao para. Londres cheira a lama e morte.");
  console.log("  As ruas estao vazias. Portas com cruzes vermelhas por toda parte.");
  console.log("  A praga chegou. E dizem que nao e natural.");
  await enter();
  console.log("");
  console.log("  Um padre te para na rua, tremendo.");
  console.log('  "A Igreja de Sao Edmundo... algo horrivel mora la dentro."');
  console.log('  "Todo mundo que entrou nao voltou. Por favor, faca algo."');
  await enter();

  // encontro 1 - esqueleto
  console.log("");
  console.log("  Voce se aproxima da igreja. O portao esta aberto.");
  console.log("  Dentro, um esqueleto com armadura andrajosa bloqueia o caminho.");
  await enter("  [ENTER para lutar]");
  const esqueleto = criarInimigo("esqueleto");
  const v1 = await batalha(player, esqueleto);
  if (!v1) {
    console.log("  game over. A praga ganhou mais uma vitima.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  Voce desce escadas umidas ate o subsolo da igreja.");
  console.log("  Ha simbolos estranhos nas paredes. Tochas acesas sem ninguem por perto.");
  await enter();

  // escolha
  console.log("");
  console.log("  Voce ve dois caminhos:");
  console.log("  1 - Entrar pela sala principal (mais rapido)");
  console.log("  2 - Espiar pela janela lateral primeiro");
  const escolha = await perguntar("  > ");

  if (escolha === "2") {
    console.log("");
    console.log("  Voce espia e ve o necromante de costas, distraido.");
    console.log("  Voce consegue um ataque surpresa! Ganha 15 de bonus de ataque no proximo combate.");
    player.bonusAtk += 15; // bonus temporario
    await enter();
    console.log("  Voce entra furtivamente...");
  } else {
    console.log("");
    console.log("  Voce chuta a porta e entra com tudo!");
    await enter();
  }

  // mini boss - cavaleiro
  console.log("");
  console.log("  Um Cavaleiro da Peste aparece das sombras!");
  console.log("  Seu armadura escurece o ar ao redor. Voce sente dificuldade de respirar.");
  await enter("  [ENTER para lutar]");
  const cavaleiro = criarInimigo("cavaleiro");
  const v2 = await batalha(player, cavaleiro);
  player.bonusAtk = Math.max(0, player.bonusAtk - 15); // remove bonus
  if (!v2) {
    console.log("  game over. A escuridao da praga te engoliu.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  No fundo da sala, um homem encurvado ri devagar.");
  console.log('  "Hehehe... voce so e mais um experimento."');
  console.log('  "A praga vai consumir tudo. Nao ha cura. Nao ha esperanca."');
  console.log("  O Necromante Aldric se levanta. Seu robe preto esta manchado de sangue.");

  const boss = { nome: "Necromante Aldric", hp: 110, hpMax: 110, atk: 19, def: 3, xp: 80, ouro: [20, 35], fala: "A morte e apenas o comeco!", vivo() { return this.hp > 0; } };
  await enter("  [ENTER para a batalha final]");
  const v3 = await batalha(player, boss, true);

  if (v3) {
    console.log("");
    console.log("  Aldric cai. Os simbolos nas paredes se apagam.");
    console.log("  Uma fumaca escura sobe e desaparece no teto.");
    console.log("  Do lado de fora, a chuva finalmente para.");
    console.log("");
    console.log("  O padre corre ate voce na rua.");
    console.log('  "A praga... sumiu! As pessoas estao acordando!"');
    console.log("  Londres vai viver mais um dia.");
    console.log("");
    console.log("  -- fim da campanha --");
  } else {
    console.log("  game over. O Necromante era poderoso demais.");
  }
  return v3;
}

// F - Campanha 3: Escocia
async function campanhaEscocia(player) {
  console.log("");
  
  console.log("   Campanha 3: A Nevoa de Alba");
  
  await enter();
  console.log("");
  console.log("  As montanhas da Escocia somem na nevoa densa.");
  console.log("  Voce chega ao Cla Mactavish completamente destruido.");
  console.log("  Casas queimadas. Silencio total. Apenas corvos.");
  await enter();
  console.log("");
  console.log("  Uma mulher velha sai de dentro das ruinas.");
  console.log('  "Foi o Espirito do Penhasco. Ele acorda a cada cem anos."');
  console.log('  "Ja destruiu clans inteiros. Voce tem que sela-lo de volta."');
  await enter();

  // encontro 1 - goblin
  console.log("");
  console.log("  No caminho para o Penhasco, goblins da floresta te atacam!");
  await enter("  [ENTER para lutar]");
  const goblin = criarInimigo("goblin");
  const v1 = await batalha(player, goblin);
  if (!v1) {
    console.log("  game over. Ate goblins foram fortes demais.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  Voce sobe a montanha. A nevoa fica mais densa.");
  console.log("  Em certo momento voce nao consegue ver a mao na frente do rosto.");
  await enter();

  // escolha
  console.log("");
  console.log("  Voce ouve algo na nevoa.");
  console.log("  1 - Gritar para identificar quem e");
  console.log("  2 - Ficar quieto e esperar");
  const escolha = await perguntar("  > ");

  if (escolha === "1") {
    console.log("");
    console.log("  Um guerreiro escocês aparece! Era um sobrevivente do cla.");
    console.log('  "Tomae isso." Ele te da uma Espada do Cla. +7 ataque!');
    player.bonusAtk += 7;
    player.arma = "Espada do Cla";
    await enter();
  } else {
    console.log("");
    console.log("  O que quer que fosse passou sem te ver. Sorte sua.");
    await enter();
  }

  // mini boss - orc
  console.log("");
  console.log("  No topo do Penhasco, um Orc guardian bloqueia o altar.");
  await enter("  [ENTER para lutar]");
  const orc = criarInimigo("orc");
  const v2 = await batalha(player, orc);
  if (!v2) {
    console.log("  game over. O Orc era imenso demais.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  No centro do altar, uma figura de sombra e vento toma forma.");
  console.log('  "Por que vieste, mortal? Nao ha nada aqui para ti."');
  console.log("  O Espirito do Penhasco fala em um dialeto antigo que voce mal entende.");

  const boss = { nome: "Espirito do Penhasco de Alba", hp: 115, hpMax: 115, atk: 21, def: 5, xp: 80, ouro: [20, 30], fala: "VOLTA PARA O PO!", vivo() { return this.hp > 0; } };
  await enter("  [ENTER para a batalha final]");
  const v3 = await batalha(player, boss, true);

  if (v3) {
    console.log("");
    console.log("  O espirito grita e some na nevoa.");
    console.log("  O altar brilha por um segundo e apaga.");
    console.log("  A nevoa comeca a se dissipar devagar.");
    console.log("");
    console.log("  La embaixo, voce ve a velha mulher acenando.");
    console.log("  Ela sabe que funcionou. A Escocia pode se curar agora.");
    console.log("");
    console.log("  -- fim da campanha --");
  } else {
    console.log("  game over. O espirito era mais forte que qualquer mortal.");
  }
  return v3;
}

// K - Campanha 4: Nordico
async function campanhaNordica(player) {
  console.log("");
  
  console.log("   Campanha 4: O Ragnarok de Erikson");
  
  await enter();
  console.log("");
  console.log("  O navio encalha numa praia coberta de cinzas.");
  console.log("  A aldeia de Erikson era grande e famosa. Agora e so ruina.");
  console.log("  Corpos de vikings espalhados. Alguns... se movendo.");
  await enter();
  console.log("");
  console.log("  Um viking sobrevivente, com o baco coberto de sangue, te segura.");
  console.log('  "Jormungandr... nao, era um gigante. Um gigante de pedra e gelo."');
  console.log('  "Ele vem de noite. Se voce nao o matar, ele volta amanha."');
  await enter();

  // encontro 1 - viking zumbi
  console.log("");
  console.log("  Ao explorar a aldeia, um companheiro de cla reanimado te ataca!");
  await enter("  [ENTER para lutar]");
  const zumbi = criarInimigo("vikingzumbi");
  const v1 = await batalha(player, zumbi);
  if (!v1) {
    console.log("  game over. Virou mais um morto-vivo na aldeia.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  Voce encontra o salao do jarl destruido.");
  console.log("  Nas ruinas, ha um baú ainda intacto com runas gravadas.");
  await enter();

  // escolha
  console.log("");
  console.log("  O bau tem um cadeado com uma adivinha em norueguês antigo.");
  console.log("  Algo sobre 'o que vem antes de tudo mas nao existe'.");
  console.log("  1 - Tentar abrir (responder: 'o nada')");
  console.log("  2 - Forcar o cadeado com a arma");
  const escolha = await perguntar("  > ");

  if (escolha === "1") {
    console.log("");
    console.log("  O bau abre! Dentro, um Machado Runico! +8 ataque!");
    player.bonusAtk += 8;
    player.arma = "Machado Runico";
    await enter();
  } else {
    console.log("");
    console.log("  Voce quebra o cadeado mas estraga o conteudo. So tem po dentro.");
    await enter();
  }

  // mini boss - orc
  console.log("");
  console.log("  Na entrada do fjord, um Orc da tribo inimiga monta guarda.");
  await enter("  [ENTER para lutar]");
  const orc = criarInimigo("orc");
  const v2 = await batalha(player, orc);
  if (!v2) {
    console.log("  game over. Os orcs tomaram a aldeia de vez.");
    return false;
  }

  await enter();
  console.log("");
  console.log("  O gigante de gelo e pedra desce da montanha ao entardecer.");
  console.log("  Cada passo seu faz o chao tremer. Seus olhos sao como brasas.");
  console.log('  "PEQUENO INSETO. YMIR TEM FOME."');

  const boss = { nome: "Ymir, o Gigante de Gelo", hp: 140, hpMax: 140, atk: 23, def: 6, xp: 90, ouro: [25, 40], fala: "YMIR VAI TE ESMAGAR!", vivo() { return this.hp > 0; } };
  await enter("  [ENTER para a batalha final]");
  const v3 = await batalha(player, boss, true);

  if (v3) {
    console.log("");
    console.log("  Ymir rugiu uma ultima vez e desmoronou em pedacos de gelo.");
    console.log("  A terra parou de tremer. As estrelas apareceram.");
    console.log("");
    console.log("  O sobrevivente se ajoelha na sua frente.");
    console.log('  "Os deuses te enviaram. Odin sorri para voce."');
    console.log("  A lenda do seu nome vai ser cantada nas tavernas por geracoes.");
    console.log("");
    console.log("  -- fim da campanha --");
  } else {
    console.log("  game over. Ymir era grande demais. Nao ha vergonha nisso.");
  }
  return v3;
}


// MENU PRINCIPAL
// F - fez o menu e a logica de escolha


async function menuPrincipal() {
  console.log("");
  
  console.log("RPG das Terras Antigas");
  
  console.log("Felipe Camargo e Kaua Alexandre - 2026");
  
  await enter("[ENTER para comecar]");

  console.log("");
  const nome = (await perguntar("  Nome do seu personagem: > ")).trim() || "Aventureiro";
  console.log("");
  console.log("  Escolha sua classe:");
  console.log("  1 - Guerreiro  (HP: 130 | ATK: 20 | DEF: 6 | Furia)");
  console.log("  2 - Mago       (HP: 75  | ATK: 12 | DEF: 2 | Bola de Fogo)");
  console.log("  3 - Arqueiro   (HP: 95  | ATK: 15 | DEF: 3 | Chuva de Flechas)");

  const classeEscolha = await perguntar("  > ");
  let player;
  if (classeEscolha === "1") player = new Guerreiro(nome);
  else if (classeEscolha === "2") player = new Mago(nome);
  else player = new Arqueiro(nome);

  console.log("");
  console.log("  Bem vindo, " + player.nome + " o " + player.classe + "!");
  console.log("  HP: " + player.hp + " | Mana: " + player.mana + " | ATK: " + player.atk + " | DEF: " + player.def);
  await enter();

  console.log("");
  console.log("  Escolha a campanha:");
  console.log("  1 - O Frio de Nunavut      (espiritos, neve, gelo)");
  console.log("  2 - A Praga de Londres     (necromante, esqueletos, chuva)");
  console.log("  3 - A Nevoa de Alba        (Escocia, orcs, espiritos)");
  console.log("  4 - O Ragnarok de Erikson  (vikings, gigantes, runas)");

  const campEscolha = await perguntar("  > ");

  let resultado = false;
  if (campEscolha === "1") resultado = await campanhaNumavut(player);
  else if (campEscolha === "2") resultado = await campanhaInglaterra(player);
  else if (campEscolha === "3") resultado = await campanhaEscocia(player);
  else resultado = await campanhaNordica(player);

  console.log("");
  
  if (resultado) {
    console.log("  Parabens, " + player.nome + "!");
    console.log("  Nivel final: " + player.nivel + "  |  Ouro: " + player.ouro);
    console.log("  voce completou a campanha. foi dificil mas deu certo!");
  } else {
    console.log("  Que pena, " + player.nome + ".");
    console.log("  tenta de novo, talvez com outra classe");
  }
  
  console.log("  obrigado por jogar");
  

  rl.close();
}

menuPrincipal();
