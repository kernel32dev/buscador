//@ts-check

import { crawl_collect } from "./crawler.js";

//const ENTRY_POINT = "https://kernel32dev.github.io/hosp-pi/matrix.html";
const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid?authuser=0";

console.clear();

console.table(
    (await crawl_collect(ENTRY_POINT, {max_paralel: 5, max_depth: 1})).map(({ url, $ }) => ({ url, title: $("title").text() }))
);
