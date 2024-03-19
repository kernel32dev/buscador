import { question } from "readline-sync";
import { index } from "./indexer.js";
import { config } from "./config.js";
import { crawl } from "./crawler.js";
import { score } from "./scorer.js";

const entry_point = "https://kernel32dev.github.io/hosp-pi/matrix.html";
//const entry_point = "https://starbuzzcoffee.com/";
//const entry_point = "https://iep.utm.edu/";
//const entry_point = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid";
//const entry_point = "https://sites.google.com/site/steveyegge2/home";
//const entry_point = "http://127.0.0.1:5500/matrix.html";

async function main() {
    console.clear();

    console.log("buscador");
    console.log();
    console.log("Germano Barbosa");
    console.log("Marcos Araújo");
    console.log("Gabriel Souza");
    console.log();
    console.log("a raiz da busca é " + entry_point);
    console.log("a profundidade máxima é " + config.max_depth);
    console.log("a máximo de paginas é " + config.max_pages);
    console.log("o modo offline está " + (config.offline_mode ? "ligado" : "desligado"));
    console.log();

    // obtem do usuário o termo a pesquisar
    let term = question("informe o termo a pesquisar: ").trim();
    if (term == "") return;

    // obtem todas as páginas a partir de um link
    let crawled = await crawl(entry_point);

    // conta os links relacionando essas páginas
    let indexed = index(crawled);

    // calcula os pontos de cada página
    let scored = score(indexed, term);

    // mostra os links em ordem de relevância
    console.log(scored.map((x, i) => `(${i}): ${x.$.url}`).join('\n'));

    // mostra a tabela detalhando tudo
    let table = scored.map(x => ({
        name: x.name,
        autoridade: x.score_linked,
        termos: x.score_term,
        tags: x.score_term_on_title + x.score_term_on_meta + x.score_term_on_header1 + x.score_term_on_header2 + x.score_term_on_paragraph + x.score_term_on_anchor,
        // title: x.score_term_on_title,
        // meta: x.score_term_on_meta,
        // h1: x.score_term_on_header1,
        // h2: x.score_term_on_header2,
        // p: x.score_term_on_paragraph,
        // a: x.score_term_on_anchor,
        autoreferencia: x.score_self_link,
        frescor: x.score_date + x.score_year_age,
        total: x.score_total,
        exibida: x.has_term ? "sim" : "não",
    }))

    console.table(table);
}

main();
