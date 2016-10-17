import { create, element, html, attrs, include, once, redux, path, pipe } from '../../../../../src/switzerland';
import { get } from 'axios';
import { camelizeKeys } from 'humps';
import moment from 'moment';
import { store, event } from './store';

/**
 * @method update
 * @param {Number} timeout
 * @return {Function}
 */
const update = timeout => {

    return dispatch => {

        dispatch({ type: event.LOADING });

        get('/position', { timeout }).then(response => {

            const model = camelizeKeys(response.data);
            dispatch({ type: event.UPDATE, model });

        }).catch(() => dispatch({ type: event.TIMEOUT }));

    };

};

/**
 * @method fetch
 * @return {void}
 */
const fetch = props => {
    const timeout = Number(props.attrs.timeout);
    props.dispatch(update(timeout));
};

/**
 * @constant worker
 * @return {Promise}
 */
const worker = props => {

    return new Promise(resolve => {

        window.navigator.serviceWorker.register(path('worker.js'), { scope: '/' }).then(worker => {
            resolve({ ...props, worker });
        });

    });

};

/**
 * @constant interval
 * @param {Object} props
 * @return {void}
 */
const interval = once(props => setInterval(props.render, 2000));

create('iss-position', pipe(once(worker), attrs, redux(store), once(fetch), include(path('css/default.css')), html(props => {

    const { redux, dispatch } = props;
    const image = path(`images/flags/${redux.flag}`);

    return (
        <section>

            {!redux.loading && !redux.error ? (

                <span>
                    <label>ISS is currently flying over</label>
                    <h1>{redux.country ? redux.country : 'An Ocean Somewhere'}</h1>

                    {redux.country ? '' : <img className="ocean" src={path('images/jellyfish.svg')} />}
                    {redux.flag ? <img className="flag" src={image} /> : ''}

                    <iss-astronauts />

                    <div className="coordinates">
                        {redux.latitude}, {redux.longitude}
                    </div>

                </span>

            ) : ''}

            {redux.loading ? <img className="loading" src={path('images/loading.svg')} /> : ''}
            {redux.error ? <label className="error">Please try again a little later.</label> : ''}

            <button
                className={redux.loading ? 'loading' : ''}
                onclick={() => dispatch(update())}
                >

                <div className="update">Update Location</div>
                <iss-updated />

            </button>

        </section>
    );

})));

create('iss-astronauts', pipe(redux(store), include(path('css/astronauts.css')), html(props => {

    return (
        <div className="astronauts">

            <h3>{props.redux.people.length} Astronauts:</h3>

            <ul className="astronauts">
                {props.redux.people.map(name => <li>{name}</li>)}
            </ul>

        </div>
    );

})));

create('iss-updated', pipe(redux(store), interval, html(props => {

    return (
        <datetime>
            (Updated {moment(props.redux.updated).fromNow()})
        </datetime>
    );

})));