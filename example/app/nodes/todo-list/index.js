import { create, init, h, m } from '/vendor/index.js';
import store from '../../utils/store.js';

const path = init(import.meta);

const container = ({ redux, props }) =>
    h('ul', {}, [
        h.stylesheet(path('styles.css')),
        list(props),
        !redux.state.list.length && nothing(props)
    ]);

const list = ({ redux }) =>
    redux.state.list.sort((a, b) => a.created - b.created).map(model =>
        h('li', { class: model.done ? 'done' : '' }, [
            h('p', { onclick: () => redux.actions.mark(model.id) }, model.text),
            h(
                'button',
                {
                    class: 'delete',
                    onclick: () => redux.actions.remove(model.id)
                },
                'Delete'
            )
        ])
    );

const nothing = () =>
    h('li', { class: 'none' }, [
        h('p', {}, 'You have not added any todos yet.')
    ]);

export default create('todo-list', store, m.html(container));