/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useCallback,
  useState, useEffect, useContext
} from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text } from '@rneui/themed';
import { utils, requests, DEBUG, height, LocalizationContext } from 'src/helpers';
import _ from 'lodash';
import Loading from './Loading';

function useAsync(asyncFn, onSuccess) {
  useEffect(() => {
    let isActive = true;
    asyncFn().then(data => {
      if (isActive && onSuccess) { onSuccess(data); }
    });
    return () => { isActive = false; };
  }, [asyncFn, onSuccess]);
}

export default function FlatListCustom(props) {
  const { startURL, ListEmptyComponent } = props;
  const { i18n } = useContext(LocalizationContext);

  const [searchText, setSearchText] = useState(props.searchText);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [response, setResonse] = useState({});
  const { nextURL, count } = response;
  // useAsync(simulateFetchData, setState);

  const fetchData = async (link) => {
    try {
      const res = await requests.get(link);
      setResults(res.page > 1 ? [...results, ...res.results] : res.results);
      setResonse({
        nextURL: res.next,
        previousURL: res.previous,
        count: count,
      });
    } catch (error) {
      DEBUG && console.warn(error);
    }
    setLoading(false);
  };

  const debounceFetchData = useCallback(
    _.debounce((link) => fetchData(link),
      800,
      {
        //// 'wait': 3000,
        // 'leading': false,
      }), []);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    setResults([]); //clear on refresh
    await fetchData(startURL);
    setRefreshing(false);
  };

  const onEndReached = () => {
    nextURL && fetchData(nextURL);
  };

  useEffect(() => {
    searchText !== props.searchText && setSearchText(props.searchText);
  }, [props.searchText]);


  useEffect(() => {
    !loading && setLoading(true);
    //clear results
    if (!loading && props.clearOnRefresh) {
      setResults([]);
    }
    return debounceFetchData.cancel;
  }, [startURL]);

  useEffect(() => {
    const link = utils.stringify({ search: searchText }, { baseURL: startURL });
    debounceFetchData(link);
  }, [searchText, startURL]);

  return (
    <FlatList
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      initialNumToRender={12}
      onEndReachedThreshold={0.75}
      refreshing={refreshing}
      data={results}
      keyExtractor={utils.keyExtractor}
      contentContainerStyle={style.contentContainerStyle}
      {...props}
      ListEmptyComponent={(
        loading ? <Loading containerStyle={style.loading} /> :
          (!ListEmptyComponent ?
            <View style={style.emptyList}>
              <Text>{i18n.t('Your data will appear here')}</Text>
            </View > :
            ListEmptyComponent(response)
          )
      )}
    />
  );
}

const style = StyleSheet.create({
  emptyList: {
    alignSelf: 'center',
    paddingVertical: 40,
  },
  loading: {
    backgroundColor: 'white',
    minHeight: 0.8 * height,
    marginHorizontal: 5,
    padding: 10,
  },
  contentContainerStyle: {
    paddingBottom: 50,
  },
});
