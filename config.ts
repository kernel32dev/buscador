
export const config: {
    /** quantos pontos uma página ganha por link apontando para ela */
    reward_linked: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado */
    reward_term: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<title>` */
    reward_term_on_title: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<meta>` */
    reward_term_on_meta: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<h1>` */
    reward_term_on_header1: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<h2>` */
    reward_term_on_header2: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<p>` */
    reward_term_on_paragraph: number,
    /** quantos pontos uma página ganha por ocorrência do termo sendo buscado, dentro de uma tag `<a>` */
    reward_term_on_anchor: number,
    /** quantos pontos uma página ganha por link dela apontando para ela mesma */
    reward_self_link: number,
    /** quantos pontos uma página ganha por disponibilizar uma data */
    reward_date: number,
    /** quantos pontos uma página ganha por ano de idade */
    reward_year_age: number,
    /** o caminho para a pasta do cache */
    cache_path: string,
    /** o tempo em ms até que o cache deve ser re-lido */
    cache_expiration_ms: number,
    /** modo offline, apenas ler do cache, nunca fazer nenhum request */
    offline_mode: boolean,
    /** o nível máximo de profundidade que o crawler pode ir */
    max_depth: number,
    /** o númer máximo de páginas que o crawler pode retornar */
    max_pages: number,
} = {
    reward_linked: 20,
    reward_self_link: -20,
    reward_term: 5,
    reward_term_on_title: 20,
    reward_term_on_meta: 20,
    reward_term_on_header1: 15,
    reward_term_on_header2: 10,
    reward_term_on_paragraph: 5,
    reward_term_on_anchor: 2,
    reward_date: 30,
    reward_year_age: -5,
    cache_path: './cache/',
    cache_expiration_ms: 1000 * 60 * 60, // 1 hora
    offline_mode: false,
    max_depth: 4,
    max_pages: 200,
};
