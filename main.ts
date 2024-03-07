
import { crawl_collect } from "./crawler.js";

const ENTRY_POINT = "https://kernel32dev.github.io/hosp-pi/matrix.html";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/home";
//const ENTRY_POINT = "http://127.0.0.1:5500/matrix.html";

console.clear();

console.table(
    (await crawl_collect(ENTRY_POINT)).map(({ url, $ }) => ({ url: url.substring(0, 100), title: $("title").text() }))
);
