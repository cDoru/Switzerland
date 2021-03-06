/**
 * @method function ∷ Props p ⇒ (Promise p → p) → Number → (p → p)
 * ---
 * Invokes the function (likely a middleware function) after X milliseconds, unless the current render cycle
 * has been completed. It's useful for such things as only rendering a "Loading" message if the component is
 * taking a while to load for improved perception of speed.
 */
export default function defer(fnP, milliseconds) {
    return props => {
        setTimeout(async () => {
            const fn = await fnP;
            !(await props.resolved()) && (await fn(props));
        }, milliseconds);
        return props;
    };
}
