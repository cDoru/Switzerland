/**
 * @method function ∷ ∀ a. Props p ⇒ Object String (p → a) → (p → p)
 * ---
 * Takes a map of function names to functions, and attaches them to the node, which allows you to directly
 * invoke the functions once you have a reference to the node. Using the 'methods' middleware passes the arguments
 * as-is, but also passes the current set of props as the final argument.
 */
export default function methods(fns) {
    return props => {
        Object.entries(fns).forEach(([name, fn]) => {
            props.node[name] = (...args) => fn.call(props.node, ...args, props);
        });

        return props;
    };
}
