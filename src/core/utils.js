import { handler } from '../middleware/rescue/index.js';
import { meta, CancelError } from './index.js';

const roots = new WeakMap();
const handlers = new WeakMap();
const previous = new WeakMap();

/**
 * @function dispatchEvent ∷ ∀ a b. HTMLElement e ⇒ e → b → Boolean
 * ---
 * Dispatches an event, merging in the current package's version for handling legacy events
 * if/when the payloads differ from version-to-version.
 */
export const dispatchEvent = node => (name, payload) => {
    const model = typeof payload === 'object' ? payload : { value: payload };
    return node.dispatchEvent(
        new window.CustomEvent(name, {
            detail: { ...model, version: 3 },
            bubbles: true,
            composed: true
        })
    );
};

/**
 * @function createShadowRoot ∷ ∀ a. ShadowRoot s, HTMLElement e ⇒ e → Object String a → s|e
 * ---
 * Takes the node element and attaches the shadow boundary to it if it doesn't exist
 * already. Returns the node if a shadow boundary cannot be attached to the element.
 */
export const createShadowRoot = (node, options = {}) => {
    const defaultOptions = { mode: 'open', delegatesFocus: false };

    if (roots.has(node)) {
        return roots.get(node);
    }

    try {
        const root = node.attachShadow({
            ...defaultOptions,
            ...options
        });
        roots.set(node, root);
        return root;
    } catch (err) {
        return node;
    }
};

/**
 * @function getRandomId ∷ String
 */
export const getRandomId = () => {
    const a = new Uint32Array(1);
    window.crypto.getRandomValues(a);
    return a[0].toString(16);
};

export const parseTagName = name => {
    const parts = name.split('/');
    return [findFreeTagName(parts[0]), determinePrototype(parts[1])];
};

/**
 * @function findFreeTagName ∷ String → String → String
 * ---
 * Resolves the node name by first attempting to use the requested node name, unless it already exists as
 * a custom component. If so, we recursively call the `resolveTagName` function to append a random suffix
 * to the end of the node name until we find a node that isn't registered.
 */
export const findFreeTagName = (name, suffix = null) => {
    const tag = suffix ? `${name}-${suffix}` : name;
    return !window.customElements.get(tag) ? tag : findFreeTagName(tag, getRandomId());
};

/**
 * @function getEventName ∷ String → String
 * ---
 * Prepends all event names with the '@switzerland' scope.
 */
export const getEventName = label => `@switzerland/${label}`;

/**
 * @function determinePrototype ∷ HTMLElement e ⇒ String → e
 * ---
 * Determines which constructor to extend from for the defining of the custom element. In most cases it
 * will be `HTMLElement` unless the user is extending an existing element.
 */
export const determinePrototype = tag => (tag ? document.createElement(tag).constructor : window.HTMLElement);

/**
 * @function consoleMessage ∷ String → String → void
 * ---
 * Takes a message and an optional console type for output. During minification this function will be removed
 * from the generated output if 'NODE_ENV' is defined as 'production', as it will be unused due to 'process.env'
 * checks later on in the code.
 */
export const consoleMessage = (text, type = 'error') => console[type](`\uD83C\uDDE8\uD83C\uDDED Switzerland: ${text}.`);

/**
 * @function getInitialProps ∷ HTMLElement e, Props p ⇒ e → p → Promise (void) → p
 */
export const getInitialProps = (node, mergeProps, scheduledTask) => ({
    ...(previous.get(node) || {}),
    ...mergeProps,
    node,
    render: node.render.bind(node),
    dispatch: dispatchEvent(node),
    prevProps: previous.get(node) || null,
    resolved: async () => {
        const resolution = await Promise.race([scheduledTask, Promise.resolve(false)]);
        return resolution !== false;
    },
    abort: () => {
        throw new CancelError();
    }
});

/**
 * @function handleMiddleware ∷ HTMLElement e, Props p ⇒ e → p → [(p → Promise p|p)] → p
 */
export const handleMiddleware = async (node, initialProps, middleware) => {
    const props = await middleware.reduce(async (accumP, middlewareP) => {
        const props = await accumP;
        props.props = props;
        const middleware = await middlewareP;
        const newProps = middleware({ ...props });

        // Determine if there's an error handler in the current set of props. If there is then
        // set the handler function as the default to be used if an error is subsequently thrown.
        handler in newProps && handlers.set(node, newProps);
        return newProps;
    }, initialProps);

    previous.set(node, props);
    return props;
};

/**
 * @function handleError ∷ ∀ a. HTMLElement e ⇒ e → Error a → void
 */
export const handleError = (node, error) => {
    // Attempt to find an error handler for the current node which can handle the error gracefully.
    // Otherwise a simple yet abrasive `console.error` will be used with no recovery possible.
    const props = handlers.get(node);

    if (!props) {
        consoleMessage(error);
        return;
    }

    previous.set(node, { ...props, error });

    props[handler]({
        ...props,
        error,
        render: mergeProps => {
            node[meta].state.setNormal();
            return node.render(mergeProps);
        }
    });
};

/**
 * @function fetchedCSSImports ∷ HTMLElement e ⇒ e → Promise void
 * ---
 * Finds all of the component's `HTMLStyleElement` nodes and extracts the `CSSImportRule` rules, awaiting
 * the resolution of each one before resolving the yielded promise.
 */
export const fetchedCSSImports = node => {
    const styles = createShadowRoot(node).querySelectorAll('style');

    return new Promise(resolve => {
        try {
            const isLoaded = rules =>
                rules.every(a => a.styleSheet)
                    ? resolve()
                    : 'requestIdleCallback' in window
                        ? requestIdleCallback(() => isLoaded(rules))
                        : setTimeout(() => isLoaded(rules), 10);

            const importRules = [...styles].flatMap(({ sheet }) =>
                [...sheet.rules].filter(a => a instanceof CSSImportRule)
            );

            return isLoaded(importRules);
        } catch (error) {
            resolve();
        }
    });
};
