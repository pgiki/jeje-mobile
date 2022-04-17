/**
 * @format
 */
import FastImage from 'react-native-fast-image';
import style from './style';
import {colors} from 'src/helpers'

export const elementTheme = {
  colors: {
    primary: colors.primary, //'rgba(0,0,0, 0.85)',
    secondary: 'red',
    // secondary:"black"
    // white;
    // black;
    // grey0;
    // grey1;
    // grey2;
    // grey3;
    // grey4;
    // grey5;
    // greyOutline;
    // searchBg;
    // success;
    // error;
    // warning;
    // divider;
    // platform: {
    //   ios: {
    //     primary;
    //     secondary;
    //     grey;
    //     searchBg;
    //     success;
    //     error;
    //     warning;
    //   };
  },
  Input: {
    inputStyle: style.Input__inputStyle,
    labelStyle: style.Input__labelStyle,
  },
  SearchBar: {
    // have noidea why they are not workig
    containerStyle: style.searchContainer,
    searchIcon: { name: 'search', type: 'evilicon' },
    clearIcon: { name: 'close', type: 'evilicon' },
    cancelIcon: { name: 'undo', type: 'evilicon', size: 30 },
  },
  Button: {
    titleStyle: style.Button__titleStyle,
  },
  Image: {
    ImageComponent: FastImage,
  },
  Avatar: {
    ImageComponent: FastImage,
    containerStyle: style.avatarContainer,
    rounded: true,
  },
  ListItem: {
    activeOpacity: 0.9,
    underlayColor: 'white',

  },
  ListItemSubtitle: {
    style: style.ListItemSubtitle__style,
  },
  ListItemChevron: {
    name: 'chevron-right',
    type: 'evilicon',
  },
  SearchBar: {
    // containerStyle:style.SearchBar__containerStyle,
    inputContainerStyle: style.SearchBar__inputContainerStyle,
  },
  Text: {
    style: style.Text__style,
  },
  CheckBox: {
    containerStyle: style.CheckBox__containerStyle,
    textStyle: style.CheckBox__textStyle,
  },
  root: {
    marginHorizontal: 5,
  },
  Icon: {
    type: 'antdesign',
  },

};

