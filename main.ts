
import { crawl_collect } from "./crawler.js";

const ENTRY_POINT = "https://kernel32dev.github.io/hosp-pi/matrix.html";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/home";
//const ENTRY_POINT = "http://127.0.0.1:5500/matrix.html";

console.clear();

let pages = await crawl_collect(ENTRY_POINT);

let links = new Map<string, string[]>(pages.map($ => [$.url, $.links]));

let backlinks = reverse_multimap(links);

let indexed_pages = pages.map($ => {
    return {
        page: $.url.substring($.url.lastIndexOf("/") + 1),
        linked: (backlinks.get($.url) ?? []).filter(x => x != $.url).length,
        self_link: ($.links.filter(x => x == $.url).length),
    };
});

console.table(indexed_pages);

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
