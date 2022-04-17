/* eslint-disable no-extend-native */
import _ from 'lodash';
import { Alert, Linking, Platform } from 'react-native';
import Share from 'react-native-share';
// import dynamicLinks from '@react-native-firebase/dynamic-links';
// import analytics from '@react-native-firebase/analytics';
import * as qs from 'query-string';
import dayjs from 'dayjs';
import HRNumbers from 'human-readable-numbers';
import codePush from 'react-native-code-push';

import { requests, setAuthorization } from './apiClient';
import {
  url,
  appName,
  appID,
  FirebaseWebApiKey,
  firebaseDynamicLinkPrefix,
  DEBUG,
} from './config';

import { storage } from './storage';

const customParseFormat = require('dayjs/plugin/customParseFormat');
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

String.prototype.count = function (c) {
  var result = 0, i = 0;
  for (i; i < this.length; i++) { if (this[i] === c) { result++; } }
  return result;
};

String.prototype.trimChars = function (c) {
  var re = new RegExp('^[' + c + ']+|[' + c + ']+$', 'g');
  return this.replace(re, '');
};

String.prototype.replaceAll = function (search, replacement) {
  return this.split(search).join(replacement);
};

String.prototype.title = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

class Actions {
  keyExtractor = (item, index) => `item-${item.id}`;
  createFormData = ({ body, fileFields = ['file'] } = {}) => {
    const data = new FormData();
    Object.keys(body).forEach(key => {
      const value = body[key];
      if (value != null) {
        if (fileFields.includes(key)) {
          //only add if has fileName
          if (value.fileSize) {
            data.append(key, {
              name: value.fileName,
              uri: Platform.OS === 'android' ? value.uri : value.uri.replace('file://', ''),
              type: value.type,
              width: value.width, height: value.height,
            });
          }
        } else {
          data.append(key, value);
        }
      }
    });
    return data;
  };

  parseParams = (params) => {
    /*
    convert parsed strings to objects
    */
    if (typeof params === 'string') {
      try {
        return JSON.parse(params);
      } catch {
        return undefined;
      }
    } else {
      return params;
    }
  }

  getItemByID = (items, id) => {
    const itemIndex = items.map(i => i.id).indexOf(id);
    return items[itemIndex];
  };
  openURL = link => {
    Linking.canOpenURL(link)
      .then(supported => {
        if (!supported) {
          Alert.alert('Link Not Supported', 'Sorry! ' + link + ' is not supported');
        } else {
          return Linking.openURL(link);
        }
      })
      .catch(err => Alert.alert('Link Error', 'Error ' + err));
  };

  // analytics
  logEvent = async (content_type, data) => {
    if (DEBUG||true) {
      return new Promise(resolve =>
        console.log(`logEvent: ${content_type}=>${JSON.stringify(data)}`)
      );
    }
    // return await analytics().logEvent(content_type, data);
  };

  logSelectContent = async (content_type, item_id) => {
    if (DEBUG) {
      return new Promise(resolve =>
        console.log(
          `logSelectContent: ${content_type}=>${JSON.stringify(item_id)}`,
        )
      );
    }
    return await analytics().logSelectContent({
      content_type,
      item_id: `${item_id}`,
    });
  };
  // analytics ends

  setUser = user => {
    return storage.setUser(user);
  };

  getUser = () => {
    return storage.getUser();
  };

  logout = async () => {
    /*
      TODO: should leave some caches when logout? For now clear all
    */
    setAuthorization(undefined);
    storage.store.clearAll();
    try {
      await requests.post(url.logout, {}, { withCredentials: false });
    } catch (e) {
    }
    codePush.restartApp();
  };

  replaceAll = (str, a, b) => {
    return str?.replaceAll(a, b);
  };

  formatNumber = (n, dp = 2) => {
    if (!n) {
      return n;
    }
    let s = '' + (Math.floor(n)), d = n % 1, i = s.length, r = '';
    while ((i -= 3) > 0) { r = ',' + s.substr(i, 3) + r; }
    return s.substr(0, i + 3) + r +
      (d ? '.' + Math.round(d * Math.pow(10, dp || 2)) : '');
  };

  toHR = number => HRNumbers.toHumanString(number);
  formatDate = (date, format = 'lll') => {
    const table = {
      LT: 'h:mm A', //  8:02 PM
      LTS: 'h:mm:ss', // A  8:02:18 PM
      L: 'MM/DD/YYYY', //  08/16/2018
      LL: 'MMMM D, YYYY', //  August 16, 2018
      LLL: 'MMMM D, YYYY h:mm A', //  August 16, 2018 8:02 PM
      LLLL: 'dddd, MMMM D, YYYY h:mm A', //  Thursday, August 16, 2018 8:02 PM
      l: 'M/D/YYYY', //  8/16/2018
      ll: 'MMM D, YYYY', //  Aug 16, 2018
      lll: 'MMM D, YYYY h:mm A', //  Aug 16, 2018 8:02 PM
      llll: 'ddd, MMM D, YYYY h:mm A', //Thu, Aug 16, 2018 8:02 PM
    };
    return dayjs(date).format(table[format] || format);
  };

  timeFromNow = ({ date, absolute = false, format = undefined } = {}) => {
    return format
      ? dayjs(date, format).fromNow(absolute)
      : dayjs(date).fromNow(absolute);
  };
  getDistance = (cord1, cord2) => {
    /*
        calculate distance between two points and return distance in km
       */
    if (cord1.lat === cord2.lat && cord1.lng === cord2.lng) {
      return 0;
    }

    const radlat1 = (Math.PI * cord1.lat) / 180;
    const radlat2 = (Math.PI * cord2.lat) / 180;

    const theta = cord1.lng - cord2.lng;
    const radtheta = (Math.PI * theta) / 180;

    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) {
      dist = 1;
    }

    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; //convert miles to km

    return dist;
  };

  navigate = (path, w) => {
    if (w) {
      window = w;
    }
    return window.history.push(path);
  };

  goBack = () => {
    return window.history.go(-1);
  };

  cmpVersions = (a, b) => {
    /*
        https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
        Return values:
        - a number < 0 if a < b
        - a number > 0 if a > b
        - 0 if a = b
        */
    let i, diff;
    let regExStrip0 = /(\.0+)+$/;
    let segmentsA = a.replace(regExStrip0, '').split('.');
    let segmentsB = b.replace(regExStrip0, '').split('.');
    let l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
      diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
      if (diff) {
        return diff;
      }
    }
    return segmentsA.length - segmentsB.length;
  };

  uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v?.toString(16);
    });
  };

  sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  lettersToNumber = str => {
    /*
          source: https://stackoverflow.com/questions/22624379/how-to-convert-letters-to-numbers-with-javascript
        */
    var out = 0,
      len = str.length;
    for (var pos = 0; pos < len; pos++) {
      out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
    }
    return out;
  };

  toNumber = name => {
    /*
          change letters to numbers
        */
    return this.lettersToNumber(name);
  };


  getObject = (_obj, path, defaultValue = undefined) => {
    let obj = _.clone(_obj, true);
    if (!path) { return obj; }
    if (obj == null) { return defaultValue; }
    path = `${path}`.split('.');
    var current = obj;
    while (path.length) {
      if (typeof current !== 'object' || typeof path !== 'object') { return defaultValue; }

      if (!path || !current) { return current; }
      current = current[path.shift()];
    }
    if (current == null) {
      current = defaultValue;
    }
    return current;
  };

  createObject = (obj, path = null, value = null) => {
    if (path == null) {
      //then shift the variables
      obj = {};
      path = obj;
      value = path;
    }
    if (!obj) {
      obj = {};
    }
    path = typeof path === 'string' ? path.split('.') : path;
    let current = obj;
    while (path.length > 1) {
      const [head, ...tail] = path;
      path = tail;
      if (!current[head]) {
        current[head] = {};
      }
      current = current[head];
    }
    current[path[0]] = value;
    return obj;
  };


  getRandomInt = (min = 1, max = 100000) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  round = (value, decimals = 2) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  getAvatarInitials = (textString, maxCount = 2) => {
    if (!textString) { return ''; }
    const text = `${textString}`.trim();
    const textSplit = text.split(' ');
    if (textSplit.length <= 1) { return text.slice(0, maxCount).toUpperCase(); }
    const initials =
      textSplit[0].charAt(0) + textSplit[textSplit.length - 1].charAt(0);
    return initials.toUpperCase();
  };

  stringify = (data, params = {}) => {
    let link = qs.stringify(data, { arrayFormat: 'bracket', ...params });
    if (params.baseURL) {
      link = `${params.baseURL}${params.baseURL?.includes('?') ? '&' : '?'
        }${link}`;
    }
    return link;
  };

  getSearchParams = str => {
    let data = {};
    if (!str) { return data; }
    const index = str.search(/(\?)\w+/i);
    if (index > -1) {
      data = qs.parse(str.slice(index));
    } else {
      data = qs.parse(str);
    }
    return data;
  };

  toTitle = str => {
    return `${str}`.title();
  };

  distinct = (results, path) => {
    return _.uniqBy(results, obj => {
      return this.getObject(obj, path);
    });
  };

  extractDigits = (s, parse) => {
    /*
    return
    */
    if (!s) {
      return null;
    }
    const parsedValue = `${s}`?.replaceAll(',', '').match(/\d+\.?\d*/g)?.join('');
    return (parsedValue && parse) ? parse(parsedValue) : parsedValue;
  };

  isNumeric = s => {
    //to simplify checking for phone number remove the leading +
    s = `${s}`; //cast s to string
    if (!s) { return false; }
    if (s && s.replace) {
      s = s.replace('+', '');
    }
    if (s == null) { return false; }
    s = s.trim();
    return /^\d+$/.test(s);
  };

  getNumeric = s => {
    if (!s) { return s; }
    var data = `${s}`.match(/\d+/g);
    if (data) { data = data.join(''); }
    return data;
  };

  convertToSlug(text) {
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  /*
    replace any string in format {variable with a variable string}
    */
  replaceVariablesFromString = (text, dic) => {
    text = _.clone(text, true);
    if (!text) { return text; }
    let variables = `${text}`.match(/[^{\}]+(?=})/g); //get the variable name from a regex
    if (Array.isArray(variables)) {
      //start replacing here. A list is returned
      variables.map(variable => {
        let variable_value = this.getObject(dic, variable); //value can be null
        text = text.replaceAll(`{${variable}}`, variable_value);
      });
      text = text.replaceAll('{', '');
      text = text.replaceAll('}', '');
      return text;
    } else {
      return text;
    }
  };

  replaceVariables = (arrayData, obj) => {
    let newArrayData = [];
    arrayData.map((element, index) => {
      let value = this.replaceVariablesFromString(element, obj);
      value = value !== 'undefined' ? value?.toString() : '-';
      if (value === ',') { value = '-'; }
      newArrayData.push(value);
    });
    return newArrayData;
  };

  truncate = ({ text, size = 160, params = {} } = {}) => {
    return _.truncate(text, {
      length: size,
      separator: '...',
      ...params,
    });
  };

  share = async ({ url, title, message, icon, callback } = {}) => {
    const options = Platform.select({
      ios: {
        activityItemSources: [{
          // For sharing url with custom title.
          placeholderItem: { type: 'url', content: url },
          item: {
            default: { type: 'url', content: url },
          },
          subject: {
            default: title,
          },
          linkMetadata: { originalUrl: url, url, title },
        },

        {
          // For sharing text.
          placeholderItem: { type: 'text', content: message },
          item: {
            default: { type: 'text', content: message },
            message: null, // Specify no text to share via Messages app.
          },
          linkMetadata: {
            // For showing app icon on share preview.
            title: message,
          },
        },

          // { // For using custom icon instead of default text icon at share preview when sharing with message.
          //   placeholderItem: {
          //     type: 'url',
          //     content: icon
          //   },
          //   item: {
          //     default: {
          //       type: 'text',
          //       content: `${message} ${url}`
          //     },
          //   },
          //   linkMetadata: {
          //      title: message,
          //      icon: icon
          //   }
          // },
        ],
      },
      default: {
        title,
        subject: title,
        message: `${message}`,
        url,
      },
    });

    return Share.open(options)
      .then(res => {
        callback && callback({ res });
        // console.log("Results sharing ", res)
        // {"app": "com.google.android.apps.messaging/com.google.android.apps.messaging.ui.conversationlist.ShareIntentActivity", "message": "com.google.android.apps.messaging/com.google.android.apps.messaging.ui.conversationlist.ShareIntentActivity"}
      })
      .catch(errors => {
        // console.log("Error sharing ", error)
        // [Error: User did not share]
        callback && callback({ errors });
      });
  };

  chunkString = (str, size) => {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }

    return chunks;
  };

  api = async ({
    link,
    authorization = 'Token ',
    ignoreSearchParams = false,
    token = null,
    method = 'GET',
    data = {},
    language = 'en',
    stringify = true,
    contentType = 'application/json',
    header = {},
  } = {}) => {
    header = {
      'Content-Type': contentType,
      Accept: 'application/json',
      'Accept-Language': language,
      ...header,
    };

    token = token;
    if (token != null) {
      header = {
        Authorization: authorization + token,
        ...header,
      };
    }

    let headers = {};
    if (method === 'GET') {
      headers = {
        method: 'GET',
        headers: header,
      };
      // add the data to the url by encoding them
      if (data) {
        const qs = this.stringify(data);
        link = `${link}${link?.includes('?') ? '&' : '?'}${qs}`;
      }

    } else {
      //get any data from the URL as a hack for POST requests encoded as GET requests
      let searchParams = this.getSearchParams(link);
      // console.log("searchParams,", searchParams, "link, ", link)
      if (searchParams && !ignoreSearchParams) {
        data = { ...searchParams, ...data };
      }
      // console.log("data for post", data)
      headers = {
        method: method,
        headers: header,
        body: stringify ? JSON.stringify(data) : data,
      };
    }
    //confirm link
    if (link && !link?.startsWith('http', 0)) {
      link = baseURL + link;
    }
    return fetch(link, headers).then(response => {
      // console.log("link104", link, "response101:", response)
      return response.json();
    });
  };

  showDirections = item =>
    this.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${item.lat || item.latitude
      },${item.lng || item.longitude}`,
    );

  requireLogin = (action, navigation) => {
    /*
        Todo: Implement a way to run next action on successful login
      */
    const loggedUser = this.getUser();
    if (!loggedUser) {
      if (navigation) {
        navigation.navigate('Auth/Login', {
          notification: {
            title: 'Login Required',
            body: 'Please login or register in order to proceed',
          },
        });
      } else {
        Alert.alert('Firewall', 'You must login to proceed');
      }
    } else {
      action();
    }
  };

  privateChat = async ({ navigation, name, users = [], onError, params = {} } = {}) => {
    let names = users.map(u => u?.username);
    names.sort();
    name = name || names.join(', ');
    const data = {
      description: names.join(', '),
      category: 'private',
      is_public: false,
      name: name,
      add_to_room: true,
      users: users.map(u => u.id),
    };
    try {
      const room = await requests.post(`${url.chats.room}get_or_create/`, data);
      if (room?.id) {
        navigation.navigate('Chat', { roomId: room.id, room, ...params });
      } else {
        onError && onError(room);
      }
    } catch (error) {
      onError && onError(error);
    }
  };

  getReviews = async ({
    navigation,
    item = {},
    onError,
    params = {},
  } = {}) => {
    const data = {
      description: item?.description || '',
      category: 'reviews',
      is_public: true,
      name: `Reviews for Item  ${item.id}`,
      add_to_room: false,
      users: [],
      defaults: {
        content_type_id: item.content_type,
        object_id: item.id,
        data: {
          item: item.id,
        },
      },
    };
    try {
      const room = await requests.post(`${url.chats.room}get_or_create/`, data);
      if (room?.id) {
        navigation.navigate('Chat', { roomId: room.id, room, ...params });
      } else {
        onError && onError(room);
      }
    } catch (error) {
      onError && onError(error);
    }
  };

  // dynamic links
  getDynamicLink = async ({
    campaign = 'invite',
    params = {},
  } = {}) => {
    /*
          Demo invited you to download Nibebe - for convenient commuting and carpooling Download
          generate a short link which can be shared and link users
          internalLink is a url already configured in Firebase console
        */
    const firebaseAPI =
      'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' +
      FirebaseWebApiKey;
    const identifier = appID;
    const deepLink = `https://onelink.to/${appName}?campaign=${campaign}&${this.stringify(
      params
    )}`;
    const dynamicLink = {
      dynamicLinkInfo: {
        domainUriPrefix: `https://${firebaseDynamicLinkPrefix}`,
        link: deepLink,
        androidInfo: {
          androidPackageName: identifier,
        },
        iosInfo: {
          iosBundleId: identifier,
        },
      },
      suffix: {
        option: 'SHORT',
      },
    };
    const res = await this.api({
      link: firebaseAPI,
      method: 'POST',
      data: dynamicLink,
      ignoreSearchParams: true,
    });
    //save the referral for future use;
    return res;
  };
}
export const utils = new Actions();
