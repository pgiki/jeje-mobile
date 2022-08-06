/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, SearchBar, ListItem, Divider } from '@rneui/themed';
import { colors, utils, requests, url, font } from 'src/helpers';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import Loading from 'src/components/Loading';

export default function Chats(props) {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [response, setResonse] = useState({});
  const { nextURL, count } = response;
  // const searchInput=useRef()
  const startURL = `${url.chats.room}?order_by=-latest_message__id&is_public=false`;

  const fetchData = async link => {
    setLoading(true);
    try {
      const res = await requests.get(link);
      res.page === 1 ? setResults(res.results) : setResults([...results, ...res.results]);
      setResonse({
        nextURL: res.next,
        previousURL: res.previous,
        count: count,
      });
    } catch (error) {
      Alert.alert('Error Fetching Data', JSON.stringify(error));
    }
    setLoading(false);
  };

  const debounceFetchData = useCallback(
    _.debounce(link => fetchData(link), 800, {
      // 'wait': 3000,
      leading: false,
    }),
    [],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(startURL);
    setRefreshing(false);
  };

  const onEndReached = () => {
    nextURL && fetchData(nextURL);
  };

  useEffect(() => {
    searchText && fetchData(`${startURL}&search=${searchText}`);
  }, [searchText]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // refresh everytime focuses on screen
      onRefresh();
    });
    return unsubscribe;
  }, []);

  const onPressItem = ({ item }) => {
    navigation.navigate('Chat', { room: item, roomId: item.id });
  };

  const isEmpty = results.length === 0 && !loading;

  return (
    <View style={style.root}>
      <FlatList
        ListHeaderComponent={<>
          {!(isEmpty && !searchText) && <SearchBar
            platform={Platform.OS}
            placeholder={'Search...'}
            onChangeText={text => setSearchText(text)}
            value={searchText}
            searchIcon={{ name: 'search', type: 'evilicon' }}
            clearIcon={{ name: 'close', type: 'evilicon' }}
            cancelIcon={{ name: 'undo', type: 'evilicon', size: 30 }}
          />}
        </>}
        ListEmptyComponent={
          <View style={style.flex1}>
            {loading ? <Loading /> : <View style={style.noChatsContainer}>
              <Text>When you contact a peer or customer support, your conversations will appear here</Text>
            </View>}
          </View>
        }
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        initialNumToRender={12}
        onEndReachedThreshold={0.75}
        refreshing={refreshing}
        data={results}
        renderItem={({ item, index }) => (
          <RenderItem index={index} onPressItem={onPressItem} item={item} />
        )}
        keyExtractor={utils.keyExtractor}
      />
    </View>
  );
}

function RenderItem(props) {
  const { item, onPressItem } = props;
  const timeStamp = item.latest_message?.created || item.created;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={style.itemContainer}
      onPress={() => onPressItem({ item })}>
      <View style={style.horizontal}>
        <View>
          <ListItem.Title style={style.title} numberOfLines={1}>
            {item.display_name}
          </ListItem.Title>
        </View>
        <View>
          <Text style={style.time}>{dayjs(timeStamp).fromNow()}</Text>
        </View>
      </View>
      <ListItem.Subtitle numberOfLines={2} style={style.subtitle}>
        {item?.latest_message?.text || 'Be the first to message'}
      </ListItem.Subtitle>
      <Divider style={style.divider} />
    </TouchableOpacity>
  );
}

const style = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  noChatsContainer: { paddingHorizontal: 20, paddingTop: 50 },
  subtitle: { padding: 4 },
  textNoResults: {
    textAlign: 'center',
    marginTop: 50,
  },
  itemContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 2,
  },
  divider: {
    paddingBottom: 10,
  },
  horizontal: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.backgroundColor,
  },
  add_search_text: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    color: colors.link,
  },
  add_icon: { marginTop: 3, color: colors.link },
  selected: {
    backgroundColor: 'rgb(230,230,230)',
  },
  unselected: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    width: '99.9%',
  },
  time: {
    fontSize: 10,
    color: 'grey'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  text_center: {
    textAlign: 'center',
  },
  add_search_container: {
    flexDirection: 'row',
    marginRight: 10,
    borderColor: colors.link,
    borderRadius: 6,
    borderWidth: 0.4,
    margin: 4,
  },
  //places
  places: {
    flexDirection: 'row',
    paddingVertical: 10,
    flexWrap: 'wrap', marginBottom: 10,
    backgroundColor: 'rgb(240,240,240)',
  },
  place: {
    flexDirection: 'row',
    marginRight: 10,
    backgroundColor: 'rgb(248,248,248)',
    borderRadius: 6,
    borderWidth: 0.4,
    margin: 4,
  },
  place_name: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cancelIconPlaceName: {
    marginTop: 7,
    paddingRight: 2,
  },
  submit_button: {
    marginTop: 5,
    borderWidth: 0.8,
    paddingHorizontal: 20,
    borderRadius: 6,
    paddingVertical: 3,
    fontWeight: 'bold',
    color: colors.link,
    // alignItems:"flex-end",
  },
  search_text_add: {
    fontSize: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  submitText: {
    color: colors.link,
    fontFamily: font.bold,
    fontWeight: 'bold',
    fontSize: 16,
  },
  search_icon_add: {
    marginTop: 10,
  },
});
