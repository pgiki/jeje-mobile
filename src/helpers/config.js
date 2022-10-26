import { Platform } from 'react-native';
import { utils } from './utils';
export const DEBUG = false;
export const MIN_LOAN_DURATION = 60;
export const DISABLED_ADS = true;
export const appName = 'Jeje';
export const appID = 'app.jeje'; //TODO: set different ids for android and ios
export const FirebaseWebApiKey = env.process.FIREBASE_KEY;
export const firebaseDynamicLinkPrefix = 'jeje.page.link';

export const config = {
  // API_URL: 'http://192.168.247.28:8000',
  // API_URL: 'http://192.168.43.25:8000',
  API_URL: 'https://niwezesheapi.hudumabomba.com',
};

export const priceSliderScale = {
  minFactor: 1e2,
  getMinValue: (x, a = 350) => {
    const maxFactor = 1e4;
    const minFactor = 1e2;
    if (!x) {
      x = 0;
    }
    const b = maxFactor / minFactor;
    return x * minFactor * (b * (1 - Math.exp((-1 * x) / a)));
  },
  getMaxValue: (x, a = 350) => {
    if (!x) {
      x = 0;
    }
    const maxFactor = 1e4;
    return x * maxFactor;
  },
  maxFactor: 1e4,
};

export const font = {
  light: Platform.select({
    ios: 'AirbnbCerealApp-Light',
    default: 'AirbnbCerealLight',
  }),
  medium: Platform.select({
    ios: 'AirbnbCerealApp-Medium',
    default: 'AirbnbCerealMedium',
  }),
  regular: Platform.select({
    ios: 'AirbnbCerealApp-Book',
    default: 'AirbnbCerealBook',
  }),
  bold: Platform.select({
    ios: 'AirbnbCerealApp-Bold',
    default: 'AirbnbCerealBold',
  }),
};

export const ads = {};

export const url = {
  BASE_URL: config.API_URL,
  socket: 'https://socket.hudumabomba.com',
  //
  User: '/api/v1/User/',
  Group: '/api/v1/Group/',
  Profile: '/api/v1/Profile/',
  PhoneNumber: '/api/v1/PhoneNumber/',
  Address: '/api/v1/Address/',
  Contact: '/api/v1/Contact/',
  Organization: '/api/v1/Organization/',
  Attachment: '/api/v1/Attachment/',
  AttachmentCategory: '/api/v1/AttachmentCategory/',
  device: '/api/v1/device/',
  // auth
  login: '/api/v1/auth/login/',
  logout: '/api/v1/auth/logout/',
  // register: '/api/v1/register/',
  register: '/api/v1/auth/register/',
  user: '/api/v1/auth/user/',
  // pasword
  tnc: 'https://hudumabomba.com/tnc?app=jeje',
  privacy: 'https://hudumabomba.com/privacy?app=jeje',
  password: {
    reset: '/api/v1/auth/password/reset/' /*POST: email*/,
    resetConfirm: '/api/v1/auth/password/reset/confirm/',
    change: '/api/v1/auth/password/change/',
  },
  p2p: {
    Loan: '/p2p/api/v1/Loan/',
    Portfolio: '/p2p/api/v1/Portfolio/',
    Payment: '/p2p/api/v1/Payment/',
  },
  chats: {
    room: '/chats/api/v1/room/',
    message: '/chats/api/v1/message/',
  },
  spendi: {
    Transaction: '/spendi/api/v1/Transaction/',
    Category: '/spendi/api/v1/Category/',
    TransactionRecurrence: '/spendi/api/v1/TransactionRecurrence/',
    Tag: '/spendi/api/v1/Tag/',
    Attachment: '/spendi/api/v1/Attachment/',
    Budget: '/spendi/api/v1/Budget/'
  },
  getURL: (path, { item, type = 'detail' } = {}) => {
    const base = utils.getObject(url, path);
    let link = base;
    if (['detail', 'delete', 'edit'].includes(type)) {
      link = `${base}{id}/`;
    }
    return utils.replaceVariablesFromString(link, item);
  },
};
