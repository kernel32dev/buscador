
import { load } from "cheerio";
import { semaphore } from "./semaphore.js";

type CrawlerOptions = {max_depth?: number, max_paralel?: number};
type CrawlerCallback = (url: string, html: import("cheerio").CheerioAPI) => void;

/** encontra todas as páginas e lista elas em um array */
export async function crawl_collect(entry_point: string, options: CrawlerOptions) {
    let list: {url: string, $: import("cheerio").CheerioAPI}[] = [];
    await crawl(entry_point, (url, $) => list.push({url, $}), options);
    return list;
}

/** executa um callback para cada pagina encontrada a partir de um link */
export async function crawl(entry_point: string, callback: CrawlerCallback, options: CrawlerOptions = {}) {
    let max_depth = options.max_depth ?? Infinity;
    let max_paralel = options.max_paralel ?? Infinity;

    if (max_depth == 0) return;

    let sph = semaphore(max_paralel);

    /** o conjunto de todos os links já visitados */
    let found = new Set<string>();

    // chama a primeira função recursiva
    await crawl_one(entry_point, 0);

    /** função recursiva que trata o download e analise de um link */
    async function crawl_one(url: string, depth: number) {

        // não faz nada se o link já foi visitado
        if (found.has(url)) return;

        // marca o link como visitado
        found.add(url);

        // baixa o html
        let html = await sph(() => (console.log(url), download_html(url)));
        if (html == "") return;

        // parsa o html
        let document = load(html, {}, true);

        // extrai os links e processa links relativos
        let links = document("a")
            .get()
            .map(x => x.attribs.href)
            .filter(x => x)
            .map(x => new URL(x, url).toString());

        // chama o callback com a url e o html parsado
        callback(url, document);

        // recursivamente trata todos os links e espera eles terminarem
        // mas apenas se a profundidade deixar
        if (max_depth === undefined || depth < max_depth) {
            await Promise.all(links.map(x => crawl_one(x, depth + 1)));
        }
    }
}

/** baixa o html de uma pagina e retorna como uma string
 *
 * caso o link não seja para html, ou caso ocorra um erro, retorna uma string vazia */
async function download_html(url: string | URL) {
    let response = await fetch(url, { redirect: "follow" }).catch(e => (console.warn(e), null));
    if (response == null) return "";
    let mimetype = response.headers.get("Content-Type");
    if (mimetype == null || mimetype.indexOf("text/html") == -1) return "";
    if (response.status < 200 || response.status >= 300) return "";
    return await response.text().catch(e => (console.warn(e), ""));
}
