import { question } from "readline-sync";
import { index } from "./indexer.js";
import { config } from "./config.js";
import { crawl } from "./crawler.js";

const entry_point = "https://kernel32dev.github.io/hosp-pi/matrix.html";
//const entry_point = "https://iep.utm.edu/";
//const entry_point = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid";
//const entry_point = "https://sites.google.com/site/steveyegge2/home";
//const entry_point = "http://127.0.0.1:5500/matrix.html";

async function main() {
    console.clear();

    console.log("a raiz da busca é " + entry_point);
    console.log("a profundidade máxima é " + config.max_depth);
    console.log("a máximo de paginas é " + config.max_pages);
    console.log("o modo offline está " + (config.offline_mode ? "ligado" : "desligado"));
    console.log();

    // obtem do usuário o termo a pesquisar
    let termo = question("informe o termo a pesquisar: ").trim();
    if (termo == "") return;

    // obtem todas as páginas a partir de um link
    let crawled = await crawl(entry_point);

    // conta os links relacionando essas páginas
    let pages = index(crawled);

    console.table(pages, ["name", "linked", "self_link"]);    
}

main();
