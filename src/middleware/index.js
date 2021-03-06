/**
 * @function load ∷ ∀ a. Props p ⇒ String → a|[a] → p → p
 */
const load = name => async (...args) => {
    const module = await import(`./${name}/index.js`);
    return module.default(...args);
};

export const adapt = load('adapt');
export const attrs = load('attrs');
export const defer = load('defer');
export const delay = load('delay');
export const intersect = load('intersect');
export const interval = load('interval');
export const loader = load('loader');
export const methods = load('methods');
export const once = load('once');
export const redux = load('redux');
export const rescue = load('rescue');
export const template = load('template');
export const vdom = load('vdom');
export const wait = load('wait');
