// THE ELDER SCROLLS 1: Dragon's Realm
// Felipe Camargo e Kaua Alexandre - 2025
// cada partida sorteia cenario, inimigos e boss diferentes usando o dados.json

const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function perguntar(p) { return new Promise(r => rl.question(p, r)); }
function enter(msg) { return new Promise(r => rl.question(msg || "  [enter]  ", r)); }

// Felipe: fiz essas duas funcoes de sorteio, a primeira pega um elemento aleatorio
// de um array, a segunda pega N elementos sem repetir (tipo embaralhar e cortar)
function sortear(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sortearN(arr, n) {
  const copia = [...arr];
  const res = [];
  for (let i = 0; i < n && copia.length > 0; i++) {
    res.push(copia.splice(Math.floor(Math.random() * copia.length), 1)[0]);
  }
  return res;
}

// Kaua: carreguei o json aqui em cima pra ficar acessivel em tudo
const dados = JSON.parse(fs.readFileSync(__dirname + "/dados.json", "utf8"));

// -----------------------------------------------
// CLASSES DO PERSONAGEM
// Felipe: fiz a classe base Personagem com tudo
// que todo mundo compartilha (hp, mana, xp, etc)
// depois fiz Guerreiro, Mago e Arqueiro herdando dela
// cada um tem stats diferentes e habilidade propria
// -----------------------------------------------

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
  curar(v) { const c = Math.min(v, this.hpMax - this.hp); this.hp += c; return c; }
  ganharXP(qtd) {
    this.xp += qtd;
    if (this.xp >= this.nivel * 40) {
      this.nivel++; this.xp = 0; this.atk += 3; this.hpMax += 15;
      this.hp = Math.min(this.hp + 15, this.hpMax);
      console.log("\n  *** level up! nivel " + this.nivel + " | atk+3 | hp+15 ***");
    }
  }
  status() {
    console.log("  HP: " + this.hp + "/" + this.hpMax + "  mana: " + this.mana + "/" + this.manaMax + "  nv:" + this.nivel);
    console.log("  ouro: " + this.ouro + "  arma: " + this.arma);
  }
  // Felipe: equipar item lendo do json, aplica bonus de atk ou def
  equiparItem(nomeItem) {
    const item = dados.itens[nomeItem];
    if (!item) return;
    if (item.bonus_atk) { this.bonusAtk += item.bonus_atk; this.arma = nomeItem; }
    if (item.bonus_def) this.bonusDef += item.bonus_def;
    console.log("  equipou: " + nomeItem + " - " + item.desc);
    if (item.bonus_atk) console.log("  atk +" + item.bonus_atk);
    if (item.bonus_def) console.log("  def +" + item.bonus_def);
  }
}

// Felipe: guerreiro tem mais hp e defesa, chance de critico media
// habilidade e furia que soma 10 fixo no ataque
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
    return { dano: Math.floor(Math.random() * 15) + this.atk + this.bonusAtk + 10, especial: "FURIA DO GUERREIRO" };
  }
}

// Felipe: mago e mais fraco fisicamente mas a magia dele da muito dano
// critico dele e 2x o dano, o maior multiplicador
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

// Felipe: arqueiro e equilibrado, tem a maior chance de critico dos tres (38%)
// mas o multiplicador e menor que o do mago
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

// -----------------------------------------------
// INIMIGOS E BOSS
// Kaua: fiz as funcoes que montam inimigo e boss
// a partir do json, adiciona os metodos vivo/levarDano/atacar
// separei boss dos inimigos normais pq o boss tem
// ataque especial que ignora defesa do jogador
// -----------------------------------------------

// Kaua: pega os dados do inimigo no json e adiciona os metodos necessarios
function montarInimigo(id) {
  const base = dados.inimigos[id];
  if (!base) return null;
  return {
    ...base, hpMax: base.hp,
    vivo() { return this.hp > 0; },
    levarDano(d) { const r = Math.max(1, d - this.def); this.hp = Math.max(0, this.hp - r); return r; },
    atacar() {
      const d = Math.floor(Math.random() * 8) + this.atk;
      const crit = Math.random() < 0.18;
      return { dano: crit ? Math.floor(d * 1.5) : d, crit };
    }
  };
}

// Kaua: boss e igual mas com 12% de chance de ataque especial
// que passa direto pela defesa do jogador
function montarBoss(id) {
  const base = dados.bosses[id];
  if (!base) return null;
  return {
    ...base, hpMax: base.hp,
    vivo() { return this.hp > 0; },
    levarDano(d) { const r = Math.max(1, d - this.def); this.hp = Math.max(0, this.hp - r); return r; },
    atacar() {
      const d = Math.floor(Math.random() * 10) + this.atk;
      if (Math.random() < 0.12) return { dano: Math.floor(d * 1.3), especial: true };
      const crit = Math.random() < 0.22;
      return { dano: crit ? Math.floor(d * 1.5) : d, crit };
    }
  };
}

// -----------------------------------------------
// BATALHA POR TURNO
// Kaua: fiz o loop principal de batalha
// jogador escolhe acao, depois o inimigo ataca automatico
// repete ate um dos dois morrer
// -----------------------------------------------
async function batalha(player, inimigo) {
  console.log("\n  inimigo: " + inimigo.nome);
  if (inimigo.fala) console.log('  "' + inimigo.fala + '"');
  if (inimigo.falas_entrada) inimigo.falas_entrada.forEach(f => console.log("  " + f));

  // Kaua: nomes das habilidades mudam dependendo da classe do jogador
  const hNome = { Guerreiro: "Furia (20mn)", Mago: "Bola de Fogo (25mn)", Arqueiro: "Chuva de Flechas (18mn)" };

  let turno = 1;
  while (player.vivo() && inimigo.vivo()) {
    console.log("\n  turno " + turno);
    player.status();
    console.log("  hp " + inimigo.nome + ": " + inimigo.hp + "/" + inimigo.hpMax);
    console.log("  1-atacar  2-" + hNome[player.classe] + "  3-curar(15mn)  4-pocao");

    const acao = await perguntar("  > ");

    if (acao === "1") {
      const r = player.atacar();
      const d = inimigo.levarDano(r.dano);
      console.log(r.crit ? "  critico! " + d + " de dano!" : "  voce causou " + d + " de dano.");

    } else if (acao === "2") {
      const r = player.habilidade();
      if (r.semMana) { console.log("  mana insuficiente!"); continue; }
      console.log("  " + r.especial + "! " + inimigo.levarDano(r.dano) + " de dano! mana: " + player.mana);

    } else if (acao === "3") {
      if (player.mana < 15) { console.log("  mana insuficiente!"); continue; }
      player.mana -= 15;
      console.log("  curou +" + player.curar(25) + " hp. hp: " + player.hp);

    } else if (acao === "4") {
      const idx = player.inventario.indexOf("Pocao de Cura");
      if (idx === -1) { console.log("  sem pocoes."); continue; }
      player.inventario.splice(idx, 1);
      console.log("  pocao usada! +" + player.curar(50) + " hp. hp: " + player.hp);

    } else { console.log("  opcao invalida."); continue; }

    if (!inimigo.vivo()) break;

    // Kaua: turno do inimigo, se for ataque especial passa pela defesa
    const ri = inimigo.atacar();
    if (ri.especial) {
      player.hp = Math.max(0, player.hp - ri.dano);
      if (inimigo.fala_crit) console.log("  " + inimigo.fala_crit);
      console.log("  ataque especial! -" + ri.dano + " hp (ignorou defesa). hp: " + player.hp);
    } else {
      const di = player.levarDano(ri.dano);
      console.log(ri.crit ? "  critico do " + inimigo.nome + "! -" + di + " hp." : "  " + inimigo.nome + " ataca. -" + di + " hp.");
    }
    turno++;
    if (player.vivo() && inimigo.vivo()) await enter();
  }

  console.log("");
  if (player.vivo()) {
    const ouro = inimigo.ouro[0] + Math.floor(Math.random() * (inimigo.ouro[1] - inimigo.ouro[0] + 1));
    player.ganharXP(inimigo.xp); player.ouro += ouro;
    console.log("  voce venceu! +" + inimigo.xp + " xp | +" + ouro + " ouro");
    if (inimigo.drop_fala) console.log("  " + inimigo.drop_fala);
    if (Math.random() < 0.35) { player.inventario.push("Pocao de Cura"); console.log("  dropou Pocao de Cura!"); }
    return true;
  }
  if (inimigo.fala_derrota) console.log("  " + inimigo.fala_derrota);
  return false;
}

// -----------------------------------------------
// EVENTO DE ESCOLHA
// Kaua: sorteia um evento do json e executa o resultado
// pode curar, dar item, vender pocao, causar dano ou dar buff
// -----------------------------------------------
async function eventoEscolha(player) {
  const ev = sortear(dados.escolhas);
  console.log("\n  " + ev.texto);
  ev.opcoes.forEach((op, i) => console.log("  " + (i + 1) + " - " + op.texto));
  const op = ev.opcoes[(parseInt(await perguntar("  > ")) - 1)] || ev.opcoes[0];
  console.log("  " + op.msg);

  // Kaua: cada resultado faz uma coisa diferente
  if (op.resultado === "cura")   { console.log("  +" + player.curar(op.valor || 20) + " hp. hp: " + player.hp); }
  if (op.resultado === "item")   { const n = sortear(Object.keys(dados.itens)); console.log("  achou: " + n); player.equiparItem(n); }
  if (op.resultado === "compra") {
    if (player.ouro >= (op.custo || 5)) { player.ouro -= op.custo || 5; player.inventario.push("Pocao de Cura"); console.log("  -" + op.custo + " ouro. pocao adicionada."); }
    else console.log("  ouro insuficiente... o mercador da risada.");
  }
  if (op.resultado === "dano")   { player.hp = Math.max(1, player.hp - (op.valor || 5)); console.log("  -" + (op.valor || 5) + " hp. hp: " + player.hp); }
  if (op.resultado === "buff")   { player.bonusAtk += 5; console.log("  atk temporario +5!"); }
  await enter();
}

// -----------------------------------------------
// CAMPANHA RANDOMIZADA
// Felipe: essa funcao monta a campanha inteira na hora
// sorteia o cenario, os inimigos e o boss do json
// ai roda intro -> encontro1 -> evento -> encontro2 -> evento -> boss
// -----------------------------------------------
async function rodarCampanha(player) {
  const cenario = sortear(dados.cenarios);
  console.log("\n  -- " + cenario.nome + " --");
  await enter();
  console.log("");
  cenario.intro.forEach(l => console.log("  " + l));
  await enter();
  console.log("  objetivo: " + cenario.objetivo);
  await enter();

  // Felipe: sorteia 2 inimigos do pool do cenario sem repetir
  const ids = sortearN(cenario.inimigos_pool, 2);

  // encontro 1
  console.log("\n  " + sortear(cenario.ambientacao));
  console.log("  voce encontra um inimigo!");
  await enter("  [enter pra lutar]");
  if (!await batalha(player, montarInimigo(ids[0]))) { console.log("  " + sortear(dados.finais.derrota)); return false; }

  await eventoEscolha(player);

  // encontro 2
  console.log("\n  " + sortear(cenario.ambientacao));
  console.log("  outro inimigo aparece!");
  await enter("  [enter pra lutar]");
  if (!await batalha(player, montarInimigo(ids[1] || ids[0]))) { console.log("  " + sortear(dados.finais.derrota)); return false; }

  await eventoEscolha(player);

  // boss final
  const boss = montarBoss(sortear(cenario.bosses_pool));
  console.log("\n  voce chega ao destino final.");
  console.log("  algo muito maior que os outros espera.");
  await enter("  [enter pra batalha final]");
  const venceu = await batalha(player, boss);
  console.log("");
  if (venceu && boss.fala_derrota) console.log("  " + boss.fala_derrota);
  console.log("  " + sortear(venceu ? dados.finais.vitoria : dados.finais.derrota));
  return venceu;
}

// -----------------------------------------------
// MENU PRINCIPAL
// Felipe: tela inicial, escolha de classe e loop
// de campanha (pode continuar jogando apos vencer)
// -----------------------------------------------
async function main() {
  console.log("\n  THE ELDER SCROLLS 1: Dragon's Realm");
  console.log("  Felipe Camargo e Kaua Alexandre - 2025");
  console.log("  (cada partida e diferente)");
  await enter("  [enter pra comecar]");

  const nome = (await perguntar("\n  nome do personagem: ")).trim() || "Aventureiro";
  console.log("\n  escolha a classe:");
  console.log("  1 - Guerreiro  hp:130  atk:20  def:6   | Furia");
  console.log("  2 - Mago       hp:75   atk:12  def:2   | Bola de Fogo");
  console.log("  3 - Arqueiro   hp:95   atk:15  def:3   | Chuva de Flechas");

  const cls = await perguntar("  > ");
  const player = cls === "1" ? new Guerreiro(nome) : cls === "2" ? new Mago(nome) : new Arqueiro(nome);
  console.log("\n  ok, " + player.nome + " o " + player.classe + ".");
  console.log("  hp:" + player.hp + "  mana:" + player.mana + "  atk:" + player.atk + "  def:" + player.def);
  await enter();

  // Felipe: loop pra jogar varias campanhas seguidas com o mesmo personagem
  let jogando = true;
  while (jogando) {
    const ok = await rodarCampanha(player);
    if (ok) console.log("\n  nivel: " + player.nivel + "  ouro: " + player.ouro);
    console.log("\n  jogar mais uma campanha?  1-sim  2-nao");
    if (await perguntar("  > ") !== "1") jogando = false;
  }

  console.log("\n  obrigado por jogar :)");
  rl.close();
}

main();
