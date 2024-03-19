import { index } from "./indexer.js";

const ENTRY_POINT = "https://kernel32dev.github.io/hosp-pi/matrix.html";
//const ENTRY_POINT = "https://iep.utm.edu/";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/singleton-considered-stupid";
//const ENTRY_POINT = "https://sites.google.com/site/steveyegge2/home";
//const ENTRY_POINT = "http://127.0.0.1:5500/matrix.html";

let pages = await index(ENTRY_POINT);

console.table(pages, ["name", "linked", "self_link"]);
