import { Crawled } from "./crawler.js";

export type Indexed = {
    // o object cheerio contendo a pagina
    $: Crawled;
    // o nome da pagina (o último segmento do caminho)
    name: string;
    // o número de links que apontam para essa página (excluindo auto links)
    linked: number;
    // o número auto links nesta página
    self_link: number;
};

/** chama o crawler e conta os links entre as páginas */
export function index(pages: Crawled[]): Indexed[] {

    /** esse map relaciona cada link aos vários links que foram encontrados dentro dele
     *
     * exemplo:
     * ```
     * "http://meublog.com/index.html" => [
     *      "http://meublog.com/post1.html",
     *      "http://meublog.com/post2.html",
     *      "http://meublog.com/post3.html",
     * ]
     * ```
     */
    let links = new Map<string, string[]>(pages.map($ => [$.url, $.links]));
    
    /** esse map relaciona cada link aos vários links dentro dos quais foram encontrados links apontando para ele
     * 
     * exemplo:
     * ```
     * "http://meublog.com/post1.html" => ["http://meublog.com/index.html"]
     * "http://meublog.com/post2.html" => ["http://meublog.com/index.html"]
     * "http://meublog.com/post3.html" => ["http://meublog.com/index.html"]
     * ```
     */
    let backlinks = reverse_multimap(links);
    
    /** atualiza cada pagina com algumas informações adiconais */
    let indexed_pages = pages.map($ => {
        return {
            // o object cheerio contendo a pagina
            $,
            // o nome da pagina (o último segmento do caminho)
            name: $.url.substring($.url.lastIndexOf("/") + 1) || $.url.substring($.url.lastIndexOf("/", $.url.length - 2) + 1).slice(0, -1),
            // o número de links que apontam para essa página (excluindo auto links)
            linked: (backlinks.get($.url) ?? []).filter(x => x != $.url).length,
            // o número auto links nesta página
            self_link: ($.links.filter(x => x == $.url).length),
        };
    });
    
    return indexed_pages;
}

/** pega um mapeamento de A para vários B e transforma em um mapeamento de B para vários A */
function reverse_multimap<A, B>(original: Map<A, B[]>): Map<B, A[]> {
    let reversed = new Map<B, A[]>();
    for (let [source, dests] of original) {
        for (let dest of dests) {
            let sources = reversed.get(dest);
            if (sources === undefined) {
                sources = [];
                reversed.set(dest, sources);
            }
            sources.push(source);
        }
    }
    return reversed;
}