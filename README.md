# Redux State Tree

This package provides a different and more managable way to deal with redux applications by using a tree structure to manage the state.

## Context

When dealing with redux applications we normally split the state in different slices and we manage each slice separately.

However, things start to get complicated when different slices are related and have to change its state for the same action.

The structure of the reducers is not the most appropiate to deal with these situations because they are organized in a way that they are independent of each other.

To solve this issue this library provides a way to organize the structure of the reducers as a tree. A structure that is simple to manage and reason about.

### Example: Note taking app

Let's say we want to create a note taking web application. This application has to let you login, see a list of all your notes and select a note to see more info about.

The conventional way of managing the state using a redux application is by splitting the state in three slices:

- user: It defines if the user is authenticated and if so it contains data about the user (name, email...).

- notes: It is a list with all the main info about the notes (title, date...).

- note: It is the note that you have selected to see more info about.

The notes are related to the user. That means that when the user logs out all the data about the notes should be deleted in the redux store. This relation between the user and the notes is not reflected using the conventional way.

Using this package this problem can be solved. There will be a user slice that will contain a notes slice and a note slice. The user reducer will manage all the data about the user and about its nested slices. Moreover, each nested slice will have its own reducer to manage its own data.

## How To Use

We will show how to use this library through an example project that uses React. The example that we will be building will be very basic just to show all the features about the library.

We will create a react project executing this command:

```bash
npx create-react-app app
```

Now, we will open the project and execute the following command to install the package and react-redux too:

```bash
npm install redux-state-tree react-redux
```

### Create Store

We will create a **store** folder with the **store.js** file and we will put the following:

```javascript
import { createStore } from "redux-state-tree";

export const { store, actions, thunks } = createStore(null /* state */);
```

The `createStore()` function is mainly used to create the redux store. However, it also returns two functions called **actions** and **thunks** and we will see later what they do.

We have to use this store in the redux application, so we have to do the following:

```javascript
// ...
import { Provider } from "react-redux";
import { store } from "./store/store";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

## Create State

We have put a null value inside `createStore()` but that is not correct. This function expects a state object that represents the root state. To create it we have to use `createState()`:

```javascript
import { createStore, createState, createNode } from "redux-state-tree";

const initialState = { value: 0 };

const state = createState({
  node: createNode(initialState),
});

export const { store, actions, thunks } = createStore(state);
```

This function receives an object as argument and we have only used the **node** property. This property defines the data about the state. We can also use the **children** property to define states that are children of this one:

```javascript
import {
  // ...
  createChild,
} from "redux-state-tree";

const aState = createState({
  node: createNode({ value: 0 }),
});

const state = createState({
  node: createNode({ value: 0 }),
  children: {
    a: createChild(aState),
  },
});

// ...
```

The structure of the resulting redux state will consist of a tree structure starting from the root state in which every state will have the **node** property to access its data and the **children** property to access the data of every child.

## Create Components

We can now create components that use these states. To do that we will create a component that we will be able to reuse. We will create a folder called **TextButton** and we will create the files **TextButton.js** and **TextButton.module.css**:

```javascript
import styles from "./TextButton.module.css";

function TextButton({ text, buttons }) {
  return (
    <div className={styles.textButton}>
      <span>{text}</span>
      {buttons.map((button, key) => (
        <button key={key} onClick={button.onClick}>
          {button.text}
        </button>
      ))}
    </div>
  );
}

export default TextButton;
```

```css
.textButton {
  font-family: Verdana;
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px;
  text-align: center;
}

.textButton span {
  flex-grow: 1;
  font-size: 16px;
}

.textButton button {
  flex-grow: 1;
  font-size: 16px;
  color: white;
  background-color: #18314f;
  border: none;
  padding: 10px 20px;
  font-size: inherit;
  font-family: inherit;
  border-radius: 5px;
  cursor: pointer;
}
```

We will create a folder called **components** and in it we will create the files **State.js** and **A.js**:

```javascript
import TextButton from "../TextButton/TextButton";

import { useSelector } from "react-redux";

function State() {
  const state = useSelector((state) => state);
  return (
    <TextButton
      text={state.node.value}
      buttons={[{ text: "Increment", onClick: () => {} }]}
    />
  );
}

export default State;
```

```javascript
import TextButton from "../TextButton/TextButton";

import { useSelector } from "react-redux";

function A() {
  const a = useSelector((state) => state.children.a);
  return (
    <TextButton
      text={a.node.value}
      buttons={[{ text: "Increase By Amount", onClick: () => {} }]}
    />
  );
}

export default A;
```

We have used the `useSelector()` hook to get the redux storage data.

We will use these components in **App.js**:

```javascript
import State from "./components/State";
import A from "./components/A";

function App() {
  return (
    <>
      <State />
      <A />
    </>
  );
}

export default App;
```

## Create Actions

We can define the reducers to specify how the state has to be changed when some actions take place. However, we first need to define what are the actions that can take place:

```javascript
// ...

const aState = createState({
  node: createNode({ value: 0 }),
  actions: {
    increaseByAmount: (amount) => amount,
  },
});

const state = createState({
  node: createNode({ value: 0 }),
  children: {
    a: createChild(aState),
  },
  actions: {
    increment: () => null,
  },
});

// ...
```

We have used the property **actions** to define what actions can take place. These actions are defined using functions and they receive as many parameters as we want and return a value that will be the payload of the action.

## Create Reducers

Now that we have defined the actions that can take place we can define the reducers:

```javascript
// ...

const initialState = { value: 0 };

const aState = createState({
  node: createNode(initialState, {
    increaseByAmount(state, action) {
      state.value += action.payload;
    },
  }),
  actions: {
    increaseByAmount: (amount) => amount,
  },
});

const state = createState({
  node: createNode(initialState, {
    increment(state, action) {
      state.value += 1;
    },
  }),
  children: {
    a: createChild(aState),
  },
  actions: {
    increment: () => null,
  },
});

// ...
```

To define the reducers we have passed a second argument to `createNode()`. The names of the reducers have to be exactly the same as the names of the actions. This library uses Immer internally and for this reason we can "modify" the state.

We can also define reducers inside `createChild()`:

```javascript
// ...

const state = createState({
  node: createNode(initialState, {
    increment(state, action) {
      state.value += 1;
    },
  }),
  children: {
    a: createChild(aState, {
      increment(state, action) {
        state.node.value += 1;
      },
    }),
  },
  actions: {
    increment: () => null,
  },
});

// ...
```

## Dispatch Actions

We have defined all the actions and reducers. We are able to dispatch actions now. To do that we will use the `useDispatch()` hook and the **actions** function that was returned by `createStore()`.

The value that we use in `useDispatch()` has to be an action object. Using the **actions** function we can pass as the argument a function that lets us access the action creator functions of the state that we are interested about:

```javascript
// ...

import { useDispatch, useSelector } from "react-redux";

import { actions } from "../store/store";

function State() {
  const dispatch = useDispatch();
  const state = useSelector((state) => state);
  return (
    <TextButton
      text={state.node.value}
      buttons={[
        {
          text: "Increment",
          onClick: () => {
            dispatch(actions((state) => state).increment());
          },
        },
      ]}
    />
  );
}

// ...
```

```javascript
// ...

import { useDispatch, useSelector } from "react-redux";

import { actions } from "../store/store";

function A() {
  const dispatch = useDispatch();
  const a = useSelector((state) => state.children.a);
  return (
    <TextButton
      text={a.node.value}
      buttons={[
        {
          text: "Increase By Amount",
          onClick: () => {
            dispatch(actions((state) => state.a).increaseByAmount(5));
          },
        },
      ]}
    />
  );
}

// ...
```

## Create Thunks

To create thunks you have to use the **thunks** property in `createState()`. We have to define a function for each thunk that will return a function that will have the parameters **dispatch** and **getState**.

When we dispatch a thunk the action objects will be automatically dispatched. There are three actions that can be dispatched:

- **(thunkName)Pending**: When the thunk has started executing.

- **(thunkName)Resolved**: When the thunk has finished executing successfully. The action payload is the data returned from the thunk.

- **(thunkName)Rejected**: When the thunk has finished executing because of an error. The action payload contains the data of the error.

The following code shows how a thunk can be used:

```javascript
// ...

const aState = createState({
  node: createNode(initialState, {
    increaseByAmount(state, action) {
      state.value += action.payload;
    },
    increaseAsyncPending(state, action) {
      console.log("Pending");
    },
    increaseAsyncResolved(state, action) {
      state.value += action.payload;
    },
  }),
  actions: {
    increaseByAmount: (amount) => amount,
  },
  thunks: {
    increaseAsync: (amount) => {
      return async (dispatch, getState) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return amount;
      };
    },
  },
});

// ...
```

In case that there is an error it can be managed like this:

```javascript
// ...

const aState = createState({
  node: createNode(initialState, {
    // ...
    increaseAsyncRejected(state, action) {
      console.log(action.payload);
    },
  }),
  actions: {
    increaseByAmount: (amount) => amount,
  },
  thunks: {
    increaseAsync: (amount) => {
      return async (dispatch, getState) => {
        throw "There was an error";
      };
    },
  },
});

// ...
```

## Dispatch Thunk

We have defined all the thunks and reducers. We are able to dispatch thunks now. To do that we will use the `useDispatch()` hook and the **thunks** function that was returned by `createStore()`.

The value that we use in `useDispatch()` has to be a thunk function. Using the **thunks** function we can pass as the argument a function that lets us access the thunk creator functions of the state that we are interested about:

```javascript
// ...

import { useDispatch, useSelector } from "react-redux";

import { actions, thunks } from "../store/store";

function A() {
  const dispatch = useDispatch();
  const a = useSelector((state) => state.children.a);
  return (
    <TextButton
      text={a.node.value}
      buttons={[
        // ...
        {
          text: "Increase Async",
          onClick: () => {
            dispatch(thunks((state) => state.a).increaseAsync(10));
          },
        },
      ]}
    />
  );
}

// ...
```

## Refractor

We can improve the code separating the **root state** and the **a** state to different files. We can create the folder **a** inside store and create the **a.js** file:

```javascript
import { createState, createNode } from "redux-state-tree";

const initialState = { value: 0 };

const aState = createState({
  // ...
});

export default aState;
```

Then, we can import the the **a** state:

```javascript
// ...

import aState from "./a/a";

const initialState = { value: 0 };

const state = createState({
  // ...
  children: {
    a: createChild(aState, {
      increment(state, action) {
        state.node.value += 1;
      },
    }),
  },
  actions: {
    increment: () => null,
  },
});

// ...
```
