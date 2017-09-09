import { takePrevProps, errorHandlers } from './middleware';

export { h } from 'picodom/src/h';
export { path } from './middleware';

/**
 * @method message :: string -> string -> void
 * @param {String} message
 * @param {String} type
 * @return {void}
 *
 * Takes a message and an optional console type for output. During minification this function will be removed
 * from the generated output if 'NODE_ENV' is defined as 'production', as it will be unused due to 'process.env'
 * checks later on in the code.
 */
function message(message, type = 'error') {
    console[type](`\uD83C\uDDE8\uD83C\uDDED Switzerland: ${message}.`);
}

/**
 * @constant MERGE
 * @type {Symbol}
 */
export const MERGE = Symbol('merge');

/**
 * @constant eventName
 * @type {String}
 */
export const eventName = 'switzerland/resolved';

/**
 * @class CancelError
 * @extends {Error}
 */
class CancelError extends Error {}

/**
 * @method create :: string -> array function -> Promise
 * @param {String} name
 * @param {Array<Function>} middlewares
 * @return {Promise}
 *
 * Takes a valid name for the custom element, as well as a list of the middleware. In the future when browsers
 * support extended native elements, the 'name' argument will allowed to be passed in a slightly different format
 * to indicate its intention to extend a native element.
 *
 * This function yields a promise that is resolved when the first instance of the node has been resolved, which
 * includes the processing of its associated middleware.
 */
export function create(name, ...middlewares) {

    return new Promise(resolve => {

        /**
         * @class SwitzerlandElement
         * @extends {HTMLElement}
         */
        customElements.define(name, class extends HTMLElement {

            /**
             * @method connectedCallback :: void -> Promise
             * @return {Promise}
             */
            connectedCallback() {
                !this.shadowRoot && this.attachShadow({ mode: 'open' });
                return this.render();
            }

            /**
             * @method disconnectedCallback :: void -> Promise
             * @return {Promise}
             */
            disconnectedCallback() {
                this.classList.remove('resolved');
                return this.render();
            }

            /**
             * @method render :: object -> Promise
             * @param {Object} [state = {}]
             * @return {Promise}
             */
            async render(state = {}) {

                /**
                 * @constant initialProps :: object
                 * @type {Object}
                 */
                const initialProps = {
                    prevProps: takePrevProps(this),
                    node: this,
                    render: this.render.bind(this),
                    [MERGE]: state,
                    cancel: () => { throw new CancelError(); }
                };

                try {

                    // Attempt to render the component, catching any errors that may be thrown in the middleware to
                    // prevent the component from being in an invalid state. Recovery should ALWAYS be possible!
                    await middlewares.reduce(async (accumP, _, index) => {
                        const middleware = middlewares[index];
                        return middleware(await accumP);
                    }, initialProps);

                } catch (err) {

                    if (!(err instanceof CancelError)) {

                        const getTree = errorHandlers.get(this);
                        const consoleError = !getTree || !this.isConnected;

                        consoleError ? (process.env.NODE_ENV !== 'production' && message(err)) : do {

                            try {

                                // Attempt to render the component using the error handling middleware.
                                getTree({ node: this, render: this.render.bind(this), error: err, prevProps: takePrevProps(this) });

                            } catch (err) {

                                if (process.env.NODE_ENV !== 'production') {

                                    // When the error handling middleware throws an error we'll need to halt the execution
                                    // because the error handler should be recovering, not compounding the problem.
                                    message(`Throwing an error from the recovery middleware for <${this.nodeName.toLowerCase()} /> is forbidden`);
                                    console.error(err);

                                }

                            }

                        };

                    }

                }

                // Add the "resolved" class name regardless of how the component's rendered.
                setTimeout(() => this.isConnected && !this.classList.contains('resolved') && this.classList.add('resolved'));

                // Dispatch the event for parent components to be able to resolve.
                this.dispatchEvent(new CustomEvent(eventName, {
                    detail: { node: this, version: 1 },
                    bubbles: true,
                    composed: true
                }));

                // Finally we'll resolve the promise that is yielded from the `render` method.
                resolve();

            }

        });

    });

}
