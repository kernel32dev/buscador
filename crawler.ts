import { CheerioAPI, load } from "cheerio";
import { promises as fs } from "fs";
import { config } from "./config.js";

type CrawlerOptions = { max_depth?: number, max_pages?: number };
type CrawlerCallback = ($: Crawled) => void;
type Crawled = CheerioAPI & { url: string, links: string[] };
/** encontra todas as páginas e lista elas em um array */
export async function crawl_collect(entry_point: string, options?: CrawlerOptions) {
    let list: Crawled[] = [];
    await crawl_iter(entry_point, $ => list.push($), options);
    return list;
}

/** executa um callback para cada pagina encontrada a partir de um link
 *
 * você pode modificar a propiedade links de dentro do callback para escolher as próximas páginas a serem obtidas */
export async function crawl_iter(entry_point: string, callback: CrawlerCallback, options: CrawlerOptions = {}) {
    let max_depth = options.max_depth ?? Infinity;
    let max_pages = options.max_pages ?? Infinity;

    if (max_depth == 0 || max_pages == 0) return;

    /** o conjunto de todos os links já visitados */
    let found = new Set<string>();

    /** o número de paginas já vistas */
    let pages = 0;

    // chama a primeira função recursiva
    await crawl_one(entry_point, 0);

    /** função recursiva que trata o download e analise de um link */
    async function crawl_one(url: string, depth: number) {

        let processed_url = crawler_url(url);
        if (processed_url === null) return;
        url = processed_url;

        // não faz nada se o link já foi visitado
        if (found.has(url)) return;

        // marca o link como visitado
        found.add(url);

        // evita fazer o request se o limite de páginas já foi atingido
        if (pages >= max_pages) return "";

        // baixa o html
        let html = await download_html(url);
        if (html == "") return;

        // ignora a págia se o limite de páginas já foi atingido
        if (pages >= max_pages) return;

        pages++;

        // parsa o html
        let document = load(html, {}, true);

        // extrai os links e processa links relativos
        let links = document("a")
            .get()
            .map(x => crawler_url(x.attribs.href, url))
            .filter(x => x) as string[];

        let $: Crawled = Object.assign(document, {url, links});

        // chama o callback com a página
        callback($);

        // recursivamente trata todos os links e espera eles terminarem
        // mas apenas se a profundidade deixar
        if (depth < max_depth) {
            await Promise.all(links.map(x => crawl_one(x, depth + 1)));
        }
    }
}

/** processa um link, possivelmente de acordo com uma base para resolver links relativos */
export function crawler_url(url: string, base?: string): string | null {
    try {
        let obj = new URL(url, base);

        // remove o hash
        obj.hash = "";

        // segue esses redirects to google
        if (obj.hostname === "www.google.com" && obj.pathname === "/url" && obj.searchParams.has("q")) {
            let q = obj.searchParams.get("q")!;
            return new URL(q).toString();
        }
        return obj.toString();
    } catch (e) {
        // o link não é válido
        return null;
    }
}

/** baixa o html de uma pagina e retorna como uma string
 *
 * caso o link não seja para html, ou caso ocorra um erro, retorna uma string vazia */
async function download_html(url: string | URL) {
    if (typeof url != "string") {
        url = url.toString();
    }

    let cache_filename = null;

    if (config.cache_expiration_ms > 0) {
        cache_filename = config.cache_path + encodeURIComponent(url);
        try {
            let age_ms = 0;

            if (config.cache_expiration_ms < Infinity) {
                let stats = await fs.stat(cache_filename);
                let now = new Date();
                age_ms = now.getTime() - stats.mtime.getTime();
            }

            if (age_ms <= config.cache_expiration_ms) {
                let html = await fs.readFile(cache_filename, "utf-8");
                console.log("304: " + url);
                return html;
            }
        } catch (e) {}
    }

    if (config.offline_mode) return "";

    let html;

    try {
        let response = await fetch(url, { redirect: "follow" }).catch(e => (console.warn(e), null));
        if (response == null) return "";
    
        let mimetype = response.headers.get("Content-Type");
        if (mimetype == null || mimetype.indexOf("text/html") == -1) return "";
        if (response.status < 200 || response.status >= 300) return "";
    
        console.log(response.status + ": " + url);
    
        html = await response.text().catch(e => (console.warn(e), ""));
    } catch (e) {
        html = null;
        console.error("!!!: " + url, e);
    }
    if (cache_filename && typeof html === "string") {
        fs.writeFile(cache_filename, html, "utf-8").catch(console.warn);
    }
    return html ?? "";
}

if (config.cache_expiration_ms > 0) fs.mkdir(config.cache_path, { recursive: true });
