/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Platform, TouchableOpacity,
} from 'react-native';
import { Text, SearchBar, ListItem, Icon } from '@rneui/themed';
import { colors, utils, requests, url } from 'src/helpers';
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
  const startURL = `${url.spendi.Budget}`;

  const fetchData = async link => {
    setLoading(true);
    try {
      const res = await requests.get(link);
      res.page == 1 ? setResults(res.results) : setResults([...results, ...res.results]);
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
    _.debounce(link => fetchData(link), 1000, {
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
    debounceFetchData(
      utils.stringify({ search: searchText || undefined }, { baseURL: startURL })
    );
  }, [searchText]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // refresh everytime focuses on screen
      onRefresh();
    });
    return unsubscribe;
  }, []);

  function addItem() {
    navigation.navigate('Budgets/Add', {})
  }

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
              <Text>Your budget will appear here</Text>
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
          <ListItem bottomDivider onPress={() => navigation.navigate('Budgets/Add', { itemId: item.id })}>
            <ListItem.Content>
              <ListItem.Title numberOfLines={1}>
                {item.category?.name} | {item.name}
              </ListItem.Title>
              <ListItem.Subtitle>
                {item.budget_type?.title()} Goal: {item.amount_currency} {utils.formatNumber(item.amount)}
              </ListItem.Subtitle>

              <ListItem.Subtitle>
                { //Object.keys(x).map(key=>key+" TZS "+x[key]).join(" | ")
                  Object.keys(item.stats)
                    .map(key => `${key.title()}: ${utils.formatNumber(item.stats[key] || 0)}`)
                    .join(" | ")
                }
              </ListItem.Subtitle>

              <ListItem.Subtitle>
                {utils.formatDate(item.active_from, 'll')} - {utils.formatDate(item.active_until, 'll')}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        )}
        keyExtractor={utils.keyExtractor}
      />

      <TouchableOpacity style={style.fixedButton} onPress={addItem}>
        <View style={style.fixedButtonIcon}>
          <Icon name="plus" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const style = StyleSheet.create({
  flex1: {
    flex: 1,
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
  //fixed button
  fixedButton: {
    position: 'absolute',

    bottom: Platform.select({
      ios: 20,
      default: 20,
    }),
    right: Platform.select({
      ios: 20,
      default: 15,
    }),
    backgroundColor: colors.primary9,
    height: 45,
    width: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    alignSelf: 'center',
  },
  fixedButtonIcon: {
    alignSelf: 'center',
    marginTop: 8,
  },
  //fixed button end
})
