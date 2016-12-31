import Rx, { Observable, Subject } from 'rxjs';


export function createTransformer(name, initialState, actionTransforms) {
    let actions = {};
    let actionCreator = (action) => {
        actions[action] = new Subject();
    };

    return {
        name, initialState, actions,
        observable: Observable.of(initialState)
            .merge(actionTransforms(actionCreator))
            .map(state => [name, state])
    };
}
