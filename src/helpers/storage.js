import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { requests } from './apiClient';
import { url } from './config';
const DEBUG = false;

const store = new MMKV();

class Store {
  constructor() {
    this.store = store;
  }

  saveDeviceToken = async (token) => {
    const previousToken = this.getDeviceToken();
    if (previousToken !== token) { //do this check to help reduce unnecessary API calls
      // also update remote token if user is logged in
      const loggedUser = this.getUser();
      if (loggedUser) {
        const data = {
          user: loggedUser?.id,
          name: loggedUser?.username,
          type: Platform.OS,
          registration_id: token,
          device_id: loggedUser?.username,
        };
        try {
          // only catch the device token locally after having it saved remotely successfully
          await requests.post(url.device, data);
          this.store.set(
            'deviceToken', // Note: Do not use underscore("_") in key!
            token,
          );
        } catch (error) {
          DEBUG && console.log('Error saving token', error);
        }
      }
    }
  }

  setUser = (user) => {
    if (user?.pk && !user?.id) { user.id = user.pk; }
    this.set('authUser', user);
    return user;
  }

  removeKey = (key) => {
    // checking if a specific key exists
    if (this.store.contains(key)) {
      return this.store.delete(key);
    }
    return false;
  }

  set = (k, v) => {
    if (v === undefined) {
      this.removeKey(k);
      return undefined;
    } else {
      return this.store.set(k, JSON.stringify(v));
    }
  }

  get = (k, parse = true) => {
    const v = this.store.getString(k);
    return (parse && v) ? JSON.parse(v) : v;
  }

  getUser = () => {
    const user = this.store.getString('authUser');
    return user ? JSON.parse(user) : user;
  }


  getDeviceToken() {
    const key = 'deviceToken';
    return this.store.getString(key);
  }

  // notifications
  saveNotification(notification, status = 'unread') {
    const key = 'notificationsState';
    let notifications = this.get(key) || [];
    this.set(
      key, // Note: Do not use underscore("_") in key!
      [{ ...notification, status }, notifications],
    );
  }
}

export const storage = new Store();



