//@ts-check

import { crawl_collect } from "./crawler.js";

const ENTRY_POINT = "https://kernel32dev.github.io/hosp-pi/matrix.html";

console.clear();

console.table(
    (await crawl_collect(ENTRY_POINT)).map(({ url, $ }) => ({ url, title: $("title").text() }))
);
