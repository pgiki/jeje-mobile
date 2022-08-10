/**
 * @format
 */
import FastImage from 'react-native-fast-image';
import style from './style';
import { colors } from 'src/helpers';
import { createTheme, lightColors } from '@rneui/themed';

export const elementTheme = createTheme({
  lightColors: {
    ...Platform.select({
      default: lightColors.platform.android,
      ios: lightColors.platform.ios,
    }),
    primary: colors.primary,
  },
  darkColors: {
    primary: '#000',
  },
  components: {
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
      inputStyle: style.SearchBarInputContainerStyle
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
    ListItemTitle: {
      style: style.ListItemTitle__style,
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
    Icon: {
      type: 'antdesign',
    },
  },
});

