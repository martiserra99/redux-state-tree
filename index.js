import { configureStore } from "@reduxjs/toolkit";

import produce from "immer";

/**
 * It is a function that is used to create the store, create a function to retrieve the action creators and create a function to retrieve the thunk creators.
 * @param {object} state It is an object created from createState().
 * @returns {object} An object with the properties store for the created store, a function to retrieve the action creators and a function to retrieve the thunk creators.
 */
export function createStore(state) {
  const store = configureStore({ reducer: state.reducer() });
  const actions = (select) => select(state.actions())._;
  const thunks = (select) => select(state.thunks())._;
  return { store, actions, thunks };
}

/**
 * It creates a state object. This object is used to define a slice of the state of the redux store and it can be nested inside another state.
 * @param {object} options This object has the property node that represents the data about the state, children that contains the nested states, actions that are the action creators and thunks that are the thunk creators.
 * @returns {object} A state object.
 */
export function createState({
  node = createNode(null, {}),
  children = {},
  actions: _actions = {},
  thunks: _thunks = {},
}) {
  return {
    reducer(path = "") {
      const nodeReducer = node.reducer(path);
      const childrenReducer = (state = {}, action) =>
        mapObject(children, (child, label) =>
          child.reducer(path, label)(state[label], action)
        );

      return (state = {}, action) => ({
        node: nodeReducer(state.node, action),
        children: childrenReducer(state.children, action),
      });
    },
    actions(path = "") {
      return {
        _: mapObject(_actions, (action, label) => (...args) => {
          return { type: `${path}/${label}`, payload: action(...args) };
        }),
        ...mapObject(children, (child, label) => child.actions(path, label)),
      };
    },
    thunks(path = "") {
      return {
        _: mapObject(_thunks, (thunk, label) => (...args) => {
          return async (dispatch, getState) => {
            dispatch({ type: `${path}/${label}Pending`, payload: null });
            return Promise.resolve(thunk(...args)(dispatch, getState))
              .then((payload) => {
                dispatch({ type: `${path}/${label}Resolved`, payload });
              })
              .catch((payload) => {
                dispatch({ type: `${path}/${label}Rejected`, payload });
              });
          };
        }),
        ...mapObject(children, (child, label) => child.thunks(path, label)),
      };
    },
  };
}

/**
 * This function is used to create the node of the state that it will be attached to. The node represents the data about the state.
 * @param {*} initialState It is the initial state of the node.
 * @param {object} reducers It is the reducers of the node.
 * @returns {object} It returns the node object.
 */
export function createNode(initialState, reducers = {}) {
  return {
    reducer(path) {
      return (state = initialState, action) => {
        for (const [label, reducer] of Object.entries(reducers))
          if (action.type === `${path}/${label}`)
            return produce(reducer)(state, action);
        return state;
      };
    },
  };
}

/**
 * This function is used to create a child of the state that it is attached to.
 * @param {object} childState It is a state object.
 * @param {object} reducers They are reducers
 * @returns {object} A child object that will be attached to a state object.
 */
export function createChild(childState, reducers = {}) {
  return {
    reducer(path, label) {
      return (state, action) => {
        for (const [label, reducer] of Object.entries(reducers))
          if (action.type === `${path}/${label}`)
            return produce(reducer)(state, action);
        return childState.reducer(`${path}/${label}`)(state, action);
      };
    },
    actions(path, label) {
      return childState.actions(`${path}/${label}`);
    },
    thunks(path, label) {
      return childState.thunks(`${path}/${label}`);
    },
  };
}

function mapObject(object, callback) {
  const result = {};
  for (const [label, value] of Object.entries(object))
    result[label] = callback(value, label);
  return result;
}
