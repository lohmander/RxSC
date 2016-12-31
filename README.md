# RxSC

RxSC (ReactiveX State Container) uses the phenomenal RxJS library to provide a
Redux-like state container, but with the power of RxJS. Thus the amount of 
boilerplate code required to get up and running is greatly reduced (see [example](#example)).

## Terms

Since some concepts of Redux has been merged, or does not translate directly
we use some different terms for RxSC.

### Transformer

A transformer takes care of mapping actions to state changes. You define both
the action and its effect on the state in the transformer unlike Redux, where
this is separated into actions, action creators and reducers.

The `Transformer` class constructor takes three arguments
`Transformer(name: string, initialState: any, transforms: Function)`.

- **name** scope name of the transformer, will be the key for the transformer's state
- **initialState** the initialState of the transformer before any action has been performed
- **transforms** a function which takes an action creator and returns a list of transforms

**Example**

```javascript
// transformer.js

import { Transformer } from 'rxsc';

export default new Transformer('counter', 0, action => [
    action('increment').map(amount => state => state + amount),
]);
```

### Container

The `Container` class takes an array of `Transformer`s and merges them into a
single observable. It also provides a nice mapping of all the transformer actions
under the `container.actions$` object.

**Example**

```javascript
// container.js

import { Container } from 'rxsc';
import counterTransformer from './transformer';

const container = new Container([counterTransformer]);

// performing actions
container.actions$.increment(1);
```

## Example

Putting it all together, it might look something like this

```javascript
import { Transformer, Container } from 'rxjs';


const transformer = new Transformer('count', 0, action => [
    action('increment').map(amount => state => state + amount),
    action('decrement').map(amount => state => state - amount),
]);

const container = new Container([transformer]);

container.subscribe(console.log);

container.actions$.increment(1);
container.actions$.increment(2);
container.actions$.decrement(2);
```

Which should give you the following output

```
{ count: 0 }
{ count: 0 }
{ count: 1 }
{ count: 3 }
{ count: 1 }
```
