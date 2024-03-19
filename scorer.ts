import { config } from "./config.js";
import { Indexed } from "./indexer.js";

export type Scored = Indexed & {
    has_term: boolean,
    score_linked: number,
    score_self_link: number,
    score_term: number,
    score_term_on_title: number,
    score_term_on_meta: number,
    score_term_on_header1: number,
    score_term_on_header2: number,
    score_term_on_paragraph: number,
    score_term_on_anchor: number,
    score_date: number,
    score_year_age: number,
    score_total: number,
};

/** calcula a pontuação das páginas indexadas e retorna as páginas pontuadas ordenadas da maior pontuação total até a menor */
export function score(indexed: Indexed[], term: string): Scored[] {
    return indexed.map(x => score_indexed_page(x, normalize(term))).sort((a, b) => b.score_total - a.score_total);
}

/** calcula a pontuação de uma página indexada, o parâmetro term deve já estar normalizado */
function score_indexed_page(page: Indexed, term: string): Scored {
    let $ = page.$;

    let score_linked = page.linked * config.reward_linked;
    let score_self_link = page.self_link * config.reward_self_link;

    let title_text = $("title").get().map(x => $(x).prop("innerText")).join(" ");
    let count_term_title = count_terms(normalize(title_text), term);
    let score_term_on_title = count_term_title * config.reward_term_on_title;

    let meta_text = $("meta").get().map(x => x.attribs["content"] ?? "").join(" ");
    let count_term_meta = count_terms(normalize(meta_text), term);
    let score_term_on_meta = count_term_meta * config.reward_term_on_meta;

    let header1_text = $("h1").get().map(x => $(x).prop("innerText")).join(" ");
    let score_term_on_header1 = count_terms(normalize(header1_text), term) * config.reward_term_on_header1;

    let header2_text = $("h2").get().map(x => $(x).prop("innerText")).join(" ");
    let score_term_on_header2 = count_terms(normalize(header2_text), term) * config.reward_term_on_header2;

    let paragraph_text = $("p").get().map(x => $(x).prop("innerText")).join(" ");
    let score_term_on_paragraph = count_terms(normalize(paragraph_text), term) * config.reward_term_on_paragraph;

    let anchor_text = $("a").get().map(x => $(x).prop("innerText")).join(" ");
    let score_term_on_anchor = count_terms(normalize(anchor_text), term) * config.reward_term_on_anchor;

    let text = $("body").get().map(x => $(x).prop("innerText")).join(" ");
    let count_term = count_terms(normalize(text), term) + count_term_title + count_term_meta;
    let has_term = count_term > 0;
    let score_term = count_term * config.reward_term;

    let now = new Date();
    let date = find_date(text);

    if (date && date.getTime() > now.getTime()) date = null;

    let score_date = date ? config.reward_date : 0;
    let score_year_age = date ? (now.getFullYear() - date.getFullYear()) * config.reward_year_age : 0;

    let score_total = score_linked + score_self_link + score_term + score_term_on_title + score_term_on_meta + score_term_on_header1 + score_term_on_header2 + score_term_on_paragraph + score_term_on_anchor + score_date + score_year_age;

    return {
        has_term,
        score_linked,
        score_self_link,
        score_term,
        score_term_on_title,
        score_term_on_meta,
        score_term_on_header1,
        score_term_on_header2,
        score_term_on_paragraph,
        score_term_on_anchor,
        score_date,
        score_year_age,
        score_total,
        ...page
    };
}

/** normaliza strings para comparação exemplo: `Ímã` -> `ima` */
function normalize(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** conta quantas vezes term aparece em text */
function count_terms(text: string, term: string): number {
    let i = -1;
    let count = 0;
    while (true) {
        i = text.indexOf(term, i + 1);
        if (i == -1) return count;
        count++;
    }
}

/** encontra e retorna a primeira data em text */
function find_date(text: string): Date | null {
    let date_matches = text.match(/\d{1,4}[-\/\\]\d{1,2}[-\/\\]\d{1,4}/g);
    for (let date_match of date_matches ?? []) {
        let component_matches = date_match.match(/\d+/g);
        if (component_matches === null || component_matches.length != 3) continue;
        let [a, b, c] = component_matches.map(Number) as [number, number, number];
        try {
            if (a >= 1000 && a <= 9999 && b <= 12 && c <= 31) return new Date(`${a}-${b}-${c}`);
            if (c >= 1000 && c <= 9999 && b <= 12 && a <= 31) return new Date(`${c}-${b}-${a}`);
            if (a > 31 && a <= 99 && b <= 12 && c <= 31) return new Date(`19${a}-${b}-${c}`);
            if (c > 31 && c <= 99 && b <= 12 && a <= 31) return new Date(`19${c}-${b}-${a}`);
        } catch (e) {}
    }
    return null;
}
