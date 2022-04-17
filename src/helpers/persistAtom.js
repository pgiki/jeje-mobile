import { storage } from "./storage";
import { requests } from "./apiClient";
import { DefaultValue } from 'recoil'
// import { runOnJS } from "react-native-reanimated";

const remoteSync = {
  //  "key":`urlEndpoint`
}

export const persistAtom = (key) => ({ setSelf, onSet }) => {
  const savedValue = storage.get(key);
  function saveLocally(value) {
    storage.set(key, value);
    const remoteSyncLink = remoteSync[key]
    if (remoteSyncLink) {
      requests.post(remoteSyncLink, { data: value })
    }
  }

  function onSetCallback(value){
    // 'worklet'
    // runOnJS(saveLocally)(value)
  }

  setSelf(savedValue != null ? savedValue : new DefaultValue());
  onSet(onSetCallback)
}


