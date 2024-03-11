
import { crawl_collect } from "./crawler.js";

export async function index(entry_point: string, console_output = true) {

    let pages = await crawl_collect(entry_point);
    
    let links = new Map<string, string[]>(pages.map($ => [$.url, $.links]));
    
    let backlinks = reverse_multimap(links);
    
    let indexed_pages = pages.map($ => {
        return {
            $,
            name: $.url.substring($.url.lastIndexOf("/") + 1),
            linked: (backlinks.get($.url) ?? []).filter(x => x != $.url).length,
            self_link: ($.links.filter(x => x == $.url).length),
        };
    });
    
    return indexed_pages;
}

/** pega um mapeamento de A para vários B e transforma em um mapeamento de B para vários A */
function reverse_multimap(original: Map<string, string[]>): Map<string, string[]> {
    let reversed = new Map();
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