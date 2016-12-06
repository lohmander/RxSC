import Rx from 'rxjs';
import React, { Component } from 'react';

export function createContainer(actions, reducers,
    initialState = Rx.Observable.of({})) {

    const observable = initialState
        .merge(...reducers)
        .scan((state, [scope, reducer]) =>
            ({ ...state, [scope]: reducer(state[scope]) }))
        .publishReplay(1)
        .refCount();

    let $actions = {};

    for (let action in actions) {
        $actions[action] = (...args) => actions[action].next(...args);
    }

    return {
        observable,
        connect: component => {
            class Connect extends Component {
                constructor() {
                    super();
                    this.state = {};
                }
                componentWillMount() {
                    this.subscription = observable
                        .subscribe(state => this.setState(state));
                }

                componentWillUnmount() {
                    this.subscription.unsubscribe();
                }

                render() {
                    return React.createElement(component, {
                        ...this.state,
                        ...this.props,
                        $actions,
                    });
                }
            }

            return Connect;
        }
    }
}

export function createActions(...actions) {
    let o = {};
    for (let action of actions) {
        o[action] = new Rx.Subject();
    }
    return o;
}

export function createReducer(name, initialState, reductions) {
    return Rx.Observable.of(() => initialState)
        .merge(...reductions)
        .map(reducerState => [name, reducerState]);
}

