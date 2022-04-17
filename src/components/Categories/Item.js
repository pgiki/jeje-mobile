import React from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {Text} from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {width, font, utils, colors} from 'src/helpers';

export default function Item(props) {
  const {item, imageStyle, itemContainer} = props;
  const navigation = useNavigation();
  const onPressItem = () =>
    navigation.navigate('Listing', {id: item?.id, item});
  if (!item) {
    return null;
  }
  const uri = 'https://th.bing.com/th/id/R.132d8c16d50ab5e71560aad1bb8c1ff1?rik=b2o9iR%2ffdtQaEg&pid=ImgRaw&r=0'; //item?.post?.url;
  return (
    <TouchableOpacity
      onPress={onPressItem}
      activeOpacity={0.8}
      style={itemContainer || style.itemContainer}>
      <FastImage
        source={uri ? {uri} : null}
        style={imageStyle || style.image}
      />
      <Text style={style.title}>Cardiology</Text>
      <Text style={style.subtitle}>41 doctors</Text>
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  itemContainer: {
    marginTop: 0,
    marginRight: 3,
    marginBottom: 10,
    backgroundColor:colors.white,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.9,
    shadowRadius: 0,
    borderRadius: 2,
    elevation: 2,
    width: 0.35 * width,
    height: 0.4 * width,
    alignItems:"center",

  },
  image: {
    width: 0.2 * width,
    height: 0.2 * width,
    marginHorizontal: 5,
    borderRadius: 4,
    marginVertical:10,
  },
  title: {
    fontSize: 16,
    fontFamily: font.medium,
    paddingTop: 4,
    paddingLeft: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: font.light,
    paddingTop: 4,
    paddingLeft: 6,
    color:colors.grey,
  },
});
