import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { filtersState, filtersSelector, listingsState } from 'src/atoms';
import { useRecoilState, useRecoilValue } from 'recoil';
import { config, width, height, font, requests, url, utils } from 'src/helpers';
import Item from './Item';

export default function RelatedListings(props) {
  const {
    itemID,
    price,
    title,
    subtitle,
    query,
    containerStyle,
    horizontal = true,
    numColumns = 1,
    hideEmpty,
  } = props;
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const filters = useRecoilValue(filtersSelector);
  const startURL = props.startURL || filters.startURL;
  const [nextURL, setNextURL] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function fetchData(link) {
    if (!link) {
      link = `${startURL}&size=8&query={id,price,price_currency,post{url}}`; //
      if (query) {
        link = `${link}&${query}`;
      }
      if (price) {
        // &id__gt=${itemID}
        link = `${link}&price__gte=${price - 5e4}&price__lte=${price + 5e4}`;
      }
    }
    const res = await requests.get(link);
    if (res.results) {
      if (res.page === 1) {
        setItems(res.results);
      } else {
        setItems([...res.results, ...items]);
      }
      setNextURL(res.next);
    }
    setLoading(false);
  }
  const onRefresh = fetchData;
  const onEndReached = () => {
    nextURL && fetchData(nextURL);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchData, [itemID, startURL]);

  if (hideEmpty && items.length === 0) {
    return null;
  }

  return (
    <View style={containerStyle}>
      {!!title && <Text style={style.title}>{title}</Text>}
      {!!subtitle && <Text style={style.subtitle}>{subtitle}</Text>}
      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={style.container}
        data={items}
        horizontal={horizontal}
        numColumns={numColumns}
        renderItem={_props => <Item {..._props} />}
        keyExtractor={utils.keyExtractor}
        //customization
        refreshing={loading}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        initialNumToRender={12}
        onEndReachedThreshold={0.85}
        ListEmptyComponent={
          <View>{!loading && <Text>Ooops! Nothing here for now</Text>}</View>
        }
      />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    paddingBottom: 0,
    paddingTop: 8,
    // shadow
  },
  title: {
    fontSize: 18,
    paddingBottom: 10,
    fontFamily: font.medium,
  },
  subtitle: {
    fontSize: 16,
    paddingBottom: 10,
    fontFamily: font.light,
  },
});
