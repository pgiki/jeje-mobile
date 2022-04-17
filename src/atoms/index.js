import {
  atom,
} from 'recoil';
import _ from "lodash";
export * from "./Notifications";
export const roleState = atom({
  key: 'roleState',
  default: 0, //
  // effects: [persistAtom("roleState")],
});

// a global state for setting modals
export const modalState = atom({
  key: 'modalState',
  default: {
    visible: false,
    title: "",
    actions: [],
  }
});
// a global state for setting modals
export const selectedGroupsState = atom({
  key: 'selectedGroupsState',
  default: [],
});

// a global state for setting modals
export const selectedUsersState = atom({
  key: 'selectedUsersState',
  default: [],
});

export const selectedAttachmentsState = atom({
  key: 'selectedAttachmentsState',
  default: [],
});