import Rx, { Observable, Subject } from 'rxjs';


/*
 * Remaps the subject methods `next` and `error` to the "root fucction" and
 * error prop respectively.
 */
function remapActions(actions) {
    return Object.keys(actions)
        .map(name => {
            let action = (val) => actions[name].next(val);
            action.error = (err) => actions[name].error(err);

            return [name, action]
        })
        .reduce((acc, [name, action]) => ({ ...acc, [name]: action  }), {});
}

/*
 * Container
 *
 * Takes an arbitrary number of transformers and holds their state and actions
 * for consumption by any subscriber.
 */
export class Container {

    actions$ = {};

    /*
     * The constructor takes a list of transformers.
     *
     * @param {Array} transformers
     */
    constructor(transformers) {
        this.transformers = transformers;
        this.observable = null;
        this.actions$ = this.transformers
            .reduce((acc, t) => ({ ...acc, ...remapActions(t._actions) }), {});
    }

    /*
     * Creates the observable if it doesn't already exist and subscribes
     * to it with the provided arguments
     *
     * @see Rx.Observable.subscribe
     */
    subscribe(...args) {
        if (this.observable) {
            return this.observable.subscribe(...args);
        }

        let initialState = this.transformers
            .reduce((acc, t) => ({ ...acc, [t.name]: t.initialState }), {})

        this.observable = Observable.of(initialState)
            .merge(...(this.transformers.map(t => t.getObservable())))
            .scan((state, [scope, transformer]) =>
                ({ ...state, [scope]: transformer(state[scope]) }))
            .publishReplay(1)
            .refCount();

        return this.observable.subscribe(...args);
    }
}

/*
 * A transformer maps actions to state transforms.
 */
export class Transformer {

    _actions = {};

    /*
     * @param {String} name Name of the transformer (will be used as state scope)
     * @param {any} initialState The state before any action has been performed
     * @param {Function} transforms A function which will be passed `createAction`
     * and should return a list of actions (Subjects)
     */
    constructor(name, initialState, transforms) {
        this.name = name;
        this.initialState = initialState;
        this.observable = Observable.of(() => initialState)
            .merge(...transforms(this.createAction))
            .map(transformer => [name, transformer]);
    }

    /*
     * Creates an action (Subject), registers it with the transformer and returns it
     *
     * @param {String} action Name of the action
     */
    createAction = (action) => {
        this._actions = { ...this._actions, [action]: new Subject() };
        return this._actions[action];
    }

    /*
     * Convenience method to get the observable. Doesn't do much atm.
     */
    getObservable() {
        return this.observable;
    }
}
