export function counterReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'increase':
      newState = state + 1;
      break;
    case 'decrease':
      newState = state - 1;
      break;
    default:
      return action.value||0;
  }
  return newState;
}
