import { Platform } from 'react-native';
import { utils } from './utils';
export const DEBUG = false;
export const MIN_LOAN_DURATION = 60;
export const DISABLED_ADS = true;
export const appName = 'Jeje';
export const appID = 'app.jeje'; //TODO: set different ids for android and ios
export const FirebaseWebApiKey = 'AIzaSyCUSbQow9BfIb3jdOBdLp6ZMDp9u4ID21E';
export const firebaseDynamicLinkPrefix = 'niwezeshe.page.link';

export const config = {
  // API_URL: 'http://192.168.247.28:8000',
  API_URL: 'http://192.168.43.25:8000',
  // API_URL: 'https://niwezesheapi.hudumabomba.com',
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
  // light: Platform.select({
  //   ios: 'AirbnbCerealApp-Light',
  //   default: 'AirbnbCerealLight',
  // }),
  // medium: Platform.select({
  //   ios: 'AirbnbCerealApp-Medium',
  //   default: 'AirbnbCerealMedium',
  // }),
  // regular: Platform.select({
  //   ios: 'AirbnbCerealApp-Book',
  //   default: 'AirbnbCerealBook',
  // }),
  // bold: Platform.select({
  //   ios: 'AirbnbCerealApp-Bold',
  //   default: 'AirbnbCerealBold',
  // }),
};

export const ads = {
  banner: Platform.select({
    android: {
      // ca-app-pub-3003997714287872/9776591823 //# inline banner | ca-app-pub-3940256099942544/2934735716
      banner: 'ca-app-pub-3003997714287872/9776591823',
      // ca-app-pub-3003997714287872/9776591823 //inline banner | ca-app-pub-3940256099942544/2247696110
      // listingSingle:'ca-app-pub-3003997714287872/9776591823',
      listingSingle: 'ca-app-pub-3003997714287872/1740428947',
      // ca-app-pub-3003997714287872/4149586976 //#covers entire screen | ca-app-pub-3940256099942544/2521693316
      interstitial: 'ca-app-pub-3003997714287872/4149586976',
      // ca-app-pub-3003997714287872/1740428947 //#custom native ads | ca-app-pub-3940256099942544/2247696110
      listings: 'ca-app-pub-3003997714287872/1740428947',
      rewardOpted: 'ca-app-pub-3003997714287872/8656303033',
      reward: 'ca-app-pub-3003997714287872/3140607696',
    },
    ios: {
      // ca-app-pub-3003997714287872/9776591823 //# inline banner | ca-app-pub-3940256099942544/2934735716
      banner: 'ca-app-pub-3003997714287872/2149323171',
      // ca-app-pub-3003997714287872/9776591823 //inline banner | ca-app-pub-3940256099942544/2247696110
      listingSingle: 'ca-app-pub-3003997714287872/2149323171',
      // ca-app-pub-3003997714287872/4149586976 //#covers entire screen | ca-app-pub-3940256099942544/2521693316
      interstitial: 'ca-app-pub-3003997714287872/6426661294',
      // ca-app-pub-3003997714287872/1740428947 //#custom native ads | ca-app-pub-3940256099942544/2247696110
      listings: 'ca-app-pub-3003997714287872/5896996493',
      rewardOpted: 'ca-app-pub-3003997714287872/6858724371',
      reward: 'ca-app-pub-3003997714287872/6858724371',
    },
  }),
};

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
  tnc: 'https://hudumabomba.com/tnc?app=instadalali',
  privacy: 'https://hudumabomba.com/privacy?app=instadalali',
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
  spendi:{
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
