//@ts-check

/**
 * cria uma função que executa funções asíncronas,
 * mas garante que no máximo `max` promessas estão executando por vez
 *
 * caso `max` tarefas já estejam executando, a proxima tarefa vai ter que esperar uma delas terminar para poder começar
 *
 * @param {number} max - um inteiro maior que zero ou infinito
 * @returns {<T>(promise: () => Promise<T>) => Promise<T>}
 */
export function semaphore(max) {
    if (max < 0) throw new Error("um semáforo não pode ter um limite negativo");
    if (max == 0) throw new Error("um semáforo não pode ter um limite zero");
    if (max == Infinity) return x => x();
    if (Number.isNaN(max)) throw new Error("um semáforo não pode ter um limite NaN");
    if (!Number.isSafeInteger(max)) throw new Error("um semáforo não pode ter um limite fracional");

    /** se for um número, recursos sobrando, ou a lista de funções esperando se for um array @type {number | (() => void)[]} */
    let state = max;

    /** @type {<T>(arg: T) => T} */
    const regain = x => {
        if (typeof state === "number") {
            state++;
        } else if (state.length !== 0) {
            let next = state.shift();
            if (next === undefined) {
                state = 1;
            } else {
                next();
            }
        }
        return x;
    };

    return x => {
        if (typeof state === "number" && state !== 0) {
            state--;
            return x().then(regain);
        }
        return new Promise((resolve, reject) => {
            if (typeof state === "object") {
                state.push(() => void x().then(regain).then(resolve).catch(reject));
            } else if (state === 0) {
                state = [() => void x().then(regain).then(resolve).catch(reject)];
            } else {
                state--;
                x().then(regain).then(resolve).catch(reject);
            }
        });
    };
}