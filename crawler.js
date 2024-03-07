//@ts-check

import { load } from "cheerio";

/** encontra todas as páginas e lista elas em um array
 *
 * @param {string} entry_point 
 * @param {number} [max_depth] */
export async function crawl_collect(entry_point, max_depth) {
    /** @type {{url: string, $: import("cheerio").CheerioAPI}[]} */
    let list = [];
    await crawl(entry_point, (url, $) => list.push({url, $}), max_depth);
    return list;
}

/** executa um callback para cada pagina encontrada a partir de um link
 *
 * @param {string} entry_point 
 * @param {(url: string, html: import("cheerio").CheerioAPI) => void} callback 
 * @param {number} [max_depth]
 */
export async function crawl(entry_point, callback, max_depth) {
    if (max_depth == 0) return;

    /** o conjunto de todos os links já visitados @type {Set<string>} */
    let found = new Set();

    /** chama a primeira função recursiva */
    await crawl_one(entry_point, 0);

    /** função recursiva que trata o download e analise de um link
     *
     * @param {string} url 
     * @param {number} depth 
     */
    async function crawl_one(url, depth) {
        if (found.has(url)) return;
        found.add(url);
        let html = await download_html(url);
        let document = load(html, {}, true);
        let links = document("a")
            .get()
            .map(x => x.attribs.href)
            .filter(x => x)
            .map(x => new URL(x, url).toString());
        callback(url, document);
        if (max_depth === undefined || depth < max_depth) {
            await Promise.all(links.map(x => crawl_one(x, depth + 1)));
        }
    }
}

/** baixa o html de uma pagina e retorna como uma string
 *
 * caso o link não seja para html, ou caso ocorra um erro, retorna uma string vazia
 *
 * @param {string | URL} url  */
async function download_html(url) {
    let response = await fetch(url, { redirect: "follow" }).catch(e => (console.warn(e), null));
    if (response == null) return "";
    let mimetype = response.headers.get("Content-Type");
    if (mimetype == null || mimetype.indexOf("text/html") == -1 || response.status < 200 || response.status >= 300) return "";
    return await response.text().catch(e => (console.warn(e), ""));
}
