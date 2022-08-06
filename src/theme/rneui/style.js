import { StyleSheet } from 'react-native';
import { font, colors } from 'src/helpers';

const style = StyleSheet.create({
  ListItemSubtitle__style: {
    fontSize: 14,
    color: colors.grey,
    fontFamily: font.regular,
  },
  ListItemTitle__style: {
    fontFamily: font.regular,
  },
  CheckBox__containerStyle: {
    marginTop: 0,
    paddingVertical: 10,
    marginLeft: 0,
    backgroundColor: 'transparent',
  },
  CheckBox__textStyle: {
    flex: 1,
    fontWeight: 'normal',
    fontFamily: font.regular,
  },
  Text__style: {
    fontSize: 15,
    fontWeight: 'normal',
    fontFamily: font.regular,
    paddingVertical: 2,
    // lineHeight:18,
  },
  SearchBar__inputContainerStyle: {
    backgroundColor: 'rgb(246,246,246)',
    borderRadius: 20,
    paddingLeft: 6,
  },
  SearchBar__containerStyle: {
    //backgroundColor:"rgba(245,245,245,0.9)",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    //maxHeight:60,
  },
  Button__titleStyle: {
    // fontSize:12,
    fontFamily: font.light,
  },
  Input__inputStyle: {
    fontFamily: font.light,
  },
  Input__labelStyle: {
    fontFamily: font.medium,
    fontSize: 18,
    color: 'rgba(0,0,0,0.65)',
  },
  bold: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 10,
  },
  avatarContainer: {
    backgroundColor: colors.primary,
    marginLeft: 6
  },
});

export default style;
