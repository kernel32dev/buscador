import { CheerioAPI, load } from "cheerio";
import { promises as fs } from "fs";
import { config } from "./config.js";

/** as opções para a função crawl */
export type CrawlerOptions = {
    /** o nível máximo de profundidade que o crawler pode ir, o padrão é `Infinity` */
    max_depth?: number,
    /** o númer máximo de páginas que o crawler pode retornar, o padrão é `Infinity` */
    max_pages?: number,
};

/** uma página dentro do resultado da função crawl, `Crawled` é um document da CheerioAPI com mais duas propiedades, `url` e `links` */
export type Crawled = CheerioAPI & {
    /** o url que foi usado para obter essa página */
    url: string;
    /** todos os links encontrados dentro dessa página */
    links: string[];
};

/** obtem todas as páginas acessíveis a partir de um link */
export async function crawl(url: string, options: CrawlerOptions = {}, depth: number = 0, pages: Crawled[] = [], found: Set<string> = new Set()) {

    // analiza as opções
    let max_depth = options.max_depth ?? Infinity;
    let max_pages = options.max_pages ?? Infinity;
    if (max_depth == 0 || max_pages == 0) return pages;

    let processed_url = normalize_url(url);
    if (processed_url === null) return pages;
    url = processed_url;

    // não faz nada se o link já foi visitado
    if (found.has(url)) return pages;

    // marca o link como visitado
    found.add(url);

    // evita fazer o request se o limite de páginas já foi atingido
    if (pages.length >= max_pages) return pages;

    // baixa o html
    let html = await download_html(url);

    // algo deu errado, ignora esse url
    if (html == "") return pages;

    // ignora a página se o limite de páginas já foi atingido
    if (pages.length >= max_pages) return pages;

    // parsa o html
    let document = load(html, {}, true);

    // extrai os links e processa links relativos
    let links = document("a")
        .get()
        .map(x => normalize_url(x.attribs.href, url))
        .filter(x => x) as string[];

    // adiciona as propiedades url e links
    let $: Crawled = Object.assign(document, { url, links });

    // chama o callback com a página
    pages.push($);

    // recursivamente trata todos os links e espera eles terminarem
    // mas apenas se a profundidade deixar
    if (depth < max_depth) {
        await Promise.all(links.map(x => crawl(x, options, depth + 1, pages, found)));
    }

    return pages;
}

/** normaliza a url, e rejeita urls inválidos, a base pode ser especificada para resolver links relativos
 *
 * exemplo:
 * ```
 * normalize_url(
 *     "a-importancia-da-tipagem",
 *     "http://meublog.com/programacao/poo-em-decadencia"
 * )
 * // retorna: "http://meublog.com/programacao/a-importancia-da-tipagem";
 * ```
 */
export function normalize_url(url: string, base?: string): string | null {
    try {
        // chama o objeto URL para validar e mergir os links
        let obj = new URL(url, base);

        // remove o hash
        obj.hash = "";

        // segue esses redirects to google
        if (obj.hostname === "www.google.com" && obj.pathname === "/url" && obj.searchParams.has("q")) {
            let q = obj.searchParams.get("q")!;
            return new URL(q).href;
        }

        // converte de volta em string
        return obj.href;
    } catch (e) {
        // o link não é válido
        return null;
    }
}

/** baixa o html de uma pagina e retorna como uma string
 *
 * caso o link não seja para html, ou caso ocorra um erro, retorna uma string vazia
 *
 * a url tem que já estar normalizada! */
async function download_html(url: string | URL) {
    // caso url seja um objeto, transforma em representação string
    if (typeof url != "string") {
        url = url.href;
    }

    /** o nome do arquivo de cache, será null caso não estejamos usando cache cache */
    let cache_filename: string | null = null;

    // caso caching esteja ligado
    if (config.cache_expiration_ms > 0) {

        // faz o caminho do cache de acordo com a url
        cache_filename = config.cache_path + encodeURIComponent(url);
        try {
            let age_ms = 0;

            // caso o cache só possa viver até certo tempo, obtem a idade do arquivo
            if (config.cache_expiration_ms < Infinity) {
                let stats = await fs.stat(cache_filename);
                let now = new Date();
                age_ms = now.getTime() - stats.mtime.getTime();
            }

            // verifica se não está velho demais
            // se `config.cache_expiration_ms` for `Infinity` então essa condição sempre vai dar true
            if (age_ms <= config.cache_expiration_ms) {
                // lê o arquivo e loga no console como se o servidor tivesse retornado 304 (NOT MODIFIED)
                let html = await fs.readFile(cache_filename, "utf-8");
                console.log("304: " + url);
                return html;
            }
        } catch (e) { }
    }

    // caso o modo offline esteja ligado, não faz o request e desiste imediatamente
    if (config.offline_mode) return "";

    let html;

    try {
        // obtem a página, caso dê erro, emita um warning no console e retorne null no lugar do response
        let response = await fetch(url, { redirect: "follow" }).catch(e => (console.warn(e), null));

        // ocorreu um erro no fetch
        if (response == null) return "";

        // o servidor retornou um status não sucesso
        // loga isso e desiste
        if (response.status < 200 || response.status >= 300) {
            console.log(response.status + ": " + url);
            return "";
        }

        /// obtem o tipo de resposta
        let mimetype = response.headers.get("Content-Type");

        // verifica se o que foi retornado realmente é html
        if (mimetype == null || mimetype.indexOf("text/html") == -1) return "";

        // obtem o html como texto, caso dê erro, emita um warning no console e retorne uma string vazia no lugar do response
        html = await response.text().catch(e => (console.warn(e), ""));

        // tudo ocorreu bem, loga o sucesso
        console.log(response.status + ": " + url);
    } catch (e) {
        console.error("!!!: " + url, e);
        return "";
    }

    if (cache_filename) {
        // caso esejamos fazendo cache, guarda o resultado, e não espera a escrita terminar (não usamos await)
        fs.writeFile(cache_filename, html, "utf-8").catch(console.warn);
    }

    return html;
}

// cria a pasta de cache
if (config.cache_expiration_ms > 0) fs.mkdir(config.cache_path, { recursive: true });
