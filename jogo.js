// RPG DAS TERRAS ANTIGAS - versao randomizada
// Felipe Camargo e Kaua Alexandre - 2025
// o jogo sorteia uma campanha diferente toda vez usando o dados.json

const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function perguntar(p) { return new Promise(r => rl.question(p, r)); }
function enter(msg) { return new Promise(r => rl.question(msg || "  [enter]  ", r)); }
function sortear(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sortearN(arr, n) {
  const copia = [...arr];
  const resultado = [];
  for (let i = 0; i < n && copia.length > 0; i++) {
    const idx = Math.floor(Math.random() * copia.length);
    resultado.push(copia.splice(idx, 1)[0]);
  }
  return resultado;
}

// carrega o json com todo o conteudo do jogo
const dados = JSON.parse(fs.readFileSync(__dirname + "/dados.json", "utf8"));

// =========================================
// CLASSES DO PERSONAGEM
// F - fez as tres classes
// =========================================

class Personagem {
  constructor(nome, hp, mana, atk, def) {
    this.nome = nome;
    this.hp = hp; this.hpMax = hp;
    this.mana = mana; this.manaMax = mana;
    this.atk = atk; this.def = def;
    this.xp = 0; this.nivel = 1;
    this.ouro = 10;
    this.inventario = [];
    this.arma = "Punho";
    this.bonusAtk = 0; this.bonusDef = 0;
  }
  vivo() { return this.hp > 0; }
  levarDano(d) {
    const real = Math.max(1, d - this.def - this.bonusDef);
    this.hp = Math.max(0, this.hp - real);
    return real;
  }
  curar(v) {
    const c = Math.min(v, this.hpMax - this.hp);
    this.hp += c; return c;
  }
  ganharXP(qtd) {
    this.xp += qtd;
    if (this.xp >= this.nivel * 40) {
      this.nivel++;
      this.xp = 0;
      this.atk += 3;
      this.hpMax += 15;
      this.hp = Math.min(this.hp + 15, this.hpMax);
      console.log("");
      console.log("  *** level up! nivel " + this.nivel + " | ataque +3 | hp +15 ***");
    }
  }
  status() {
    console.log("  HP: " + this.hp + "/" + this.hpMax + "  mana: " + this.mana + "/" + this.manaMax + "  nivel: " + this.nivel);
    console.log("  ouro: " + this.ouro + "  arma: " + this.arma);
  }
  equiparItem(nomeItem) {
    const item = dados.itens[nomeItem];
    if (!item) return;
    if (item.bonus_atk) { this.bonusAtk += item.bonus_atk; this.arma = nomeItem; }
    if (item.bonus_def) { this.bonusDef += item.bonus_def; }
    console.log("  voce equipou: " + nomeItem + " (" + item.desc + ")");
    if (item.bonus_atk) console.log("  ataque +" + item.bonus_atk);
    if (item.bonus_def) console.log("  defesa +" + item.bonus_def);
  }
}

class Guerreiro extends Personagem {
  constructor(n) { super(n, 130, 20, 20, 6); this.classe = "Guerreiro"; }
  atacar() {
    const b = Math.floor(Math.random() * 10) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.25;
    return { dano: crit ? Math.floor(b * 1.8) : b, crit };
  }
  habilidade() {
    if (this.mana < 20) return { semMana: true };
    this.mana -= 20;
    const b = Math.floor(Math.random() * 15) + this.atk + this.bonusAtk + 10;
    return { dano: b, especial: "FURIA DO GUERREIRO" };
  }
}

class Mago extends Personagem {
  constructor(n) { super(n, 75, 110, 12, 2); this.classe = "Mago"; }
  atacar() {
    const b = Math.floor(Math.random() * 6) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.30;
    return { dano: crit ? Math.floor(b * 2.0) : b, crit };
  }
  habilidade() {
    if (this.mana < 25) return { semMana: true };
    this.mana -= 25;
    const b = Math.floor(Math.random() * 20) + 28;
    const crit = Math.random() < 0.30;
    return { dano: crit ? Math.floor(b * 2.0) : b, especial: "BOLA DE FOGO" };
  }
}

class Arqueiro extends Personagem {
  constructor(n) { super(n, 95, 55, 15, 3); this.classe = "Arqueiro"; }
  atacar() {
    const b = Math.floor(Math.random() * 8) + this.atk + this.bonusAtk;
    const crit = Math.random() < 0.38;
    return { dano: crit ? Math.floor(b * 1.6) : b, crit };
  }
  habilidade() {
    if (this.mana < 18) return { semMana: true };
    this.mana -= 18;
    const b = Math.floor(Math.random() * 12) + 22;
    const crit = Math.random() < 0.38;
    return { dano: crit ? Math.floor(b * 1.6) : b, especial: "CHUVA DE FLECHAS" };
  }
}

// =========================================
// BATALHA
// K - loop de combate por turno
// =========================================

function montarInimigo(id) {
  const base = dados.inimigos[id];
  if (!base) return null;
  return {
    ...base,
    hpMax: base.hp,
    vivo() { return this.hp > 0; },
    levarDano(d) {
      const real = Math.max(1, d - this.def);
      this.hp = Math.max(0, this.hp - real);
      return real;
    },
    atacar() {
      const d = Math.floor(Math.random() * 8) + this.atk;
      const crit = Math.random() < 0.18;
      return { dano: crit ? Math.floor(d * 1.5) : d, crit };
    }
  };
}

function montarBoss(id) {
  const base = dados.bosses[id];
  if (!base) return null;
  return {
    ...base,
    hpMax: base.hp,
    vivo() { return this.hp > 0; },
    levarDano(d) {
      const real = Math.max(1, d - this.def);
      this.hp = Math.max(0, this.hp - real);
      return real;
    },
    atacar() {
      const d = Math.floor(Math.random() * 10) + this.atk;
      const crit = Math.random() < 0.22;
      // boss tem chance de ataque especial que ignora defesa
      if (Math.random() < 0.12) return { dano: Math.floor(d * 1.3), especial: true };
      return { dano: crit ? Math.floor(d * 1.5) : d, crit };
    }
  };
}

async function batalha(player, inimigo) {
  console.log("");
  console.log("  inimigo: " + inimigo.nome);
  if (inimigo.fala) console.log('  "' + inimigo.fala + '"');
  // mostra fala de entrada do boss se tiver
  if (inimigo.falas_entrada) {
    for (const f of inimigo.falas_entrada) console.log("  " + f);
  }
  console.log("");

  let turno = 1;
  while (player.vivo() && inimigo.vivo()) {
    console.log("  turno " + turno);
    player.status();
    console.log("  hp do " + inimigo.nome + ": " + inimigo.hp + "/" + inimigo.hpMax);
    console.log("");

    const habilNome = player.classe === "Guerreiro" ? "Furia (20 mana)" : player.classe === "Mago" ? "Bola de Fogo (25 mana)" : "Chuva de Flechas (18 mana)";
    console.log("  1 - atacar");
    console.log("  2 - " + habilNome);
    console.log("  3 - curar com magia (+25 hp, 15 mana)");
    console.log("  4 - usar pocao");

    const acao = await perguntar("  > ");

    if (acao === "1") {
      const r = player.atacar();
      const d = inimigo.levarDano(r.dano);
      console.log(r.crit ? "  critico! " + d + " de dano!" : "  voce causou " + d + " de dano.");

    } else if (acao === "2") {
      const r = player.habilidade();
      if (r.semMana) { console.log("  mana insuficiente!"); continue; }
      const d = inimigo.levarDano(r.dano);
      console.log("  " + r.especial + "! " + d + " de dano! mana: " + player.mana);

    } else if (acao === "3") {
      if (player.mana < 15) { console.log("  mana insuficiente!"); continue; }
      player.mana -= 15;
      const c = player.curar(25);
      console.log("  voce se curou +" + c + " hp. hp: " + player.hp);

    } else if (acao === "4") {
      const idx = player.inventario.indexOf("Pocao de Cura");
      if (idx === -1) { console.log("  voce nao tem pocoes."); continue; }
      player.inventario.splice(idx, 1);
      const c = player.curar(50);
      console.log("  pocao usada! +" + c + " hp. hp: " + player.hp);

    } else {
      console.log("  opcao invalida.");
      continue;
    }

    if (!inimigo.vivo()) break;

    // turno do inimigo
    const ri = inimigo.atacar();
    if (ri.especial) {
      // ataque especial do boss ignora defesa
      player.hp = Math.max(0, player.hp - ri.dano);
      if (inimigo.fala_crit) console.log("  " + inimigo.fala_crit);
      console.log("  ataque especial! -" + ri.dano + " hp (ignorou defesa). hp: " + player.hp);
    } else {
      const di = player.levarDano(ri.dano);
      console.log(ri.crit ? "  golpe critico do " + inimigo.nome + "! -" + di + " hp." : "  " + inimigo.nome + " ataca. -" + di + " hp.");
    }

    turno++;
    if (player.vivo() && inimigo.vivo()) await enter();
  }

  console.log("");
  if (player.vivo()) {
    const xp = inimigo.xp;
    const ouro = inimigo.ouro[0] + Math.floor(Math.random() * (inimigo.ouro[1] - inimigo.ouro[0] + 1));
    player.ganharXP(xp);
    player.ouro += ouro;
    console.log("  voce venceu! +" + xp + " xp | +" + ouro + " ouro");
    if (inimigo.drop_fala) console.log("  " + inimigo.drop_fala);
    if (Math.random() < 0.35) {
      player.inventario.push("Pocao de Cura");
      console.log("  dropou uma Pocao de Cura!");
    }
    return true;
  }
  if (inimigo.fala_derrota) console.log("  " + inimigo.fala_derrota);
  return false;
}

// =========================================
// EVENTO DE ESCOLHA
// F - sorteia um evento do json e resolve
// =========================================

async function eventoEscolha(player) {
  const evento = sortear(dados.escolhas);
  console.log("");
  console.log("  " + evento.texto);
  evento.opcoes.forEach((op, i) => console.log("  " + (i + 1) + " - " + op.texto));

  const esc = await perguntar("  > ");
  const idx = parseInt(esc) - 1;
  const opcao = evento.opcoes[idx] || evento.opcoes[0];

  console.log("  " + opcao.msg);

  if (opcao.resultado === "cura") {
    const c = player.curar(opcao.valor || 20);
    console.log("  +" + c + " hp. hp: " + player.hp);

  } else if (opcao.resultado === "item") {
    // sorteia um item do pool geral
    const nomeItem = sortear(Object.keys(dados.itens));
    console.log("  voce achou: " + nomeItem + "!");
    player.equiparItem(nomeItem);

  } else if (opcao.resultado === "compra") {
    if (player.ouro >= (opcao.custo || 5)) {
      player.ouro -= opcao.custo || 5;
      player.inventario.push("Pocao de Cura");
      console.log("  -" + opcao.custo + " ouro. pocao adicionada ao inventario.");
    } else {
      console.log("  voce nao tem ouro suficiente... o mercador da risada.");
    }

  } else if (opcao.resultado === "dano") {
    const d = opcao.valor || 5;
    player.hp = Math.max(1, player.hp - d);
    console.log("  voce perdeu " + d + " hp. hp: " + player.hp);

  } else if (opcao.resultado === "buff") {
    player.bonusAtk += 5;
    console.log("  ataque temporario +5!");
  }

  await enter();
}

// =========================================
// CAMPANHA RANDOMIZADA
// K - monta a campanha na hora sorteando tudo
// =========================================

async function rodarCampanha(player) {
  // sorteia o cenario
  const cenario = sortear(dados.cenarios);

  console.log("");
  console.log("  -- " + cenario.nome + " --");
  await enter();

  // intro do cenario (todas as linhas)
  console.log("");
  for (const linha of cenario.intro) {
    console.log("  " + linha);
  }
  await enter();

  console.log("  objetivo: " + cenario.objetivo);
  await enter();

  // sorteia 2 inimigos do pool do cenario
  const idsInimigos = sortearN(cenario.inimigos_pool, 2);

  // encontro 1
  const ambientacao1 = sortear(cenario.ambientacao);
  console.log("");
  console.log("  " + ambientacao1);
  console.log("  voce encontra um inimigo!");
  await enter("  [enter pra lutar]");

  const inimigo1 = montarInimigo(idsInimigos[0]);
  const v1 = await batalha(player, inimigo1);
  if (!v1) {
    console.log("  " + sortear(dados.finais.derrota));
    return false;
  }

  // evento de escolha entre encontros
  await eventoEscolha(player);

  // encontro 2
  const ambientacao2 = sortear(cenario.ambientacao.filter(a => a !== ambientacao1));
  console.log("");
  console.log("  " + ambientacao2);
  console.log("  outro inimigo aparece!");
  await enter("  [enter pra lutar]");

  const inimigo2 = montarInimigo(idsInimigos[1] || idsInimigos[0]);
  const v2 = await batalha(player, inimigo2);
  if (!v2) {
    console.log("  " + sortear(dados.finais.derrota));
    return false;
  }

  // segundo evento antes do boss
  await eventoEscolha(player);

  // sorteia o boss do cenario
  const idBoss = sortear(cenario.bosses_pool);
  const boss = montarBoss(idBoss);

  console.log("");
  console.log("  voce chega ao ponto final da jornada.");
  console.log("  algo muito maior que os outros espera por voce.");
  await enter("  [enter pra batalha final]");

  const v3 = await batalha(player, boss);
  console.log("");
  if (v3) {
    if (boss.fala_derrota) console.log("  " + boss.fala_derrota);
    console.log("  " + sortear(dados.finais.vitoria));
  } else {
    console.log("  " + sortear(dados.finais.derrota));
  }
  return v3;
}

// =========================================
// MENU PRINCIPAL
// F - entrada do jogo
// =========================================

async function main() {
  console.log("");
  console.log("  RPG das Terras Antigas");
  console.log("  Felipe Camargo e Kaua Alexandre - 2025");
  console.log("  (cada partida e diferente)");
  await enter("  [enter pra comecar]");

  console.log("");
  const nome = (await perguntar("  nome do personagem: ")).trim() || "Aventureiro";

  console.log("");
  console.log("  escolha a classe:");
  console.log("  1 - Guerreiro  hp:130  atk:20  def:6  habilidade: Furia");
  console.log("  2 - Mago       hp:75   atk:12  def:2  habilidade: Bola de Fogo");
  console.log("  3 - Arqueiro   hp:95   atk:15  def:3  habilidade: Chuva de Flechas");

  const cls = await perguntar("  > ");
  let player;
  if (cls === "1") player = new Guerreiro(nome);
  else if (cls === "2") player = new Mago(nome);
  else player = new Arqueiro(nome);

  console.log("");
  console.log("  ok, " + player.nome + " o " + player.classe + ".");
  console.log("  hp: " + player.hp + "  mana: " + player.mana + "  atk: " + player.atk + "  def: " + player.def);
  await enter();

  // pode jogar quantas campanhas quiser em sequencia
  let jogando = true;
  while (jogando) {
    const resultado = await rodarCampanha(player);
    console.log("");
    if (resultado) {
      console.log("  nivel: " + player.nivel + "  ouro acumulado: " + player.ouro);
    }
    console.log("");
    console.log("  jogar mais uma campanha?");
    console.log("  1 - sim");
    console.log("  2 - nao");
    const resp = await perguntar("  > ");
    if (resp !== "1") jogando = false;
  }

  console.log("");
  console.log("  obrigado por jogar :)");
  rl.close();
}

main();
