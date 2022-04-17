/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, SearchBar, ListItem, Divider, Icon, Avatar } from 'react-native-elements';
import { colors, utils, requests, url, font } from 'src/helpers';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import Loading from 'src/components/Loading';
import { Button, ScrollView } from 'src/components';
import { Appbar } from 'react-native-paper';

export default function Dashboard(props) {
  const { navigation } = props;
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [response, setResonse] = useState({
    total_spending: 0,
    total_income: 0,
    total_budget_spending: 0,
    total_budget_income: 0,
    total_balance: 0,
  });

  const [loggedUser, setLoggedUser] = useState(utils.getUser);
  const { nextURL, count } = response;
  const startURL = `${url.spendi.Transaction}`;

  function login() {
    utils.logout()
    return navigation.navigate('Auth/Login')
  }

  const fetchCategories = async () => {
    try {
      const res = await requests.get(url.spendi.Category);
      setCategories(res.results)
    } catch (error) {
      if (error.data?.detail === 'Invalid token.') {
        return login()
      } else {
        Alert.alert('Error Fetching Categories', JSON.stringify(error.data.detail || error.message));
      }
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchData = async link => {
    setLoading(true);
    try {
      const res = await requests.get(link);
      res.page === 1 ? setResults(res.results) : setResults([...results, ...res.results]);
      const {
        total_spending,
        total_income,
        total_budget_spending,
        total_budget_income,
        total_balance
      } = res;
      setResonse({
        nextURL: res.next,
        previousURL: res.previous,
        count: res.count,
        total_spending,
        total_income,
        total_budget_spending,
        total_budget_income,
        total_balance
      });
    } catch (error) {
      if (error.detail?.data === 'Invalid token.') {
        return utils.logout()
      } else {
        Alert.alert('Error Fetching Data', JSON.stringify(error.data.detail || error.message));
      }
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(startURL);
    await fetchCategories();
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

  // const isEmpty = results.length ===0 && !loading;
  const openNotifications = () => navigation.navigate("Notifications");
  const addTransaction = () => navigation.navigate("Transactions/Add");

  const {
    total_spending,
    total_income,
    total_budget_spending,
    total_budget_income,
    total_balance
  } = response

  const currency = loggedUser?.currency;

  const card = { marginVertical: 10, paddingHorizontal: 10 }

  return (
    <SafeAreaView style={style.root}>
      <View style={{ flexDirection: 'row', paddingTop: 10, justifyContent: 'space-between' }}>
        <View style={style.horizontal}>
          <Avatar
            title={utils.getAvatarInitials(loggedUser?.display_name)}
            rounded
            size={'medium'}
            onPress={()=>navigation.navigate('Settings')}
          />
          <View style={{ marginLeft: 10 }}>
            <ListItem.Subtitle>Good Morning!</ListItem.Subtitle>
            <ListItem.Title>{loggedUser?.first_name} {loggedUser?.last_name}</ListItem.Title>
          </View>
        </View>

        <TouchableOpacity onPress={openNotifications} style={{ marginRight: 10 }}>
          <Icon name='bells' type='antdesign' />
        </TouchableOpacity>
      </View>
      <FlatList
        ListHeaderComponent={<View>
          <View>
            <View style={card}>
              <View style={style.horizontal}>
                <View>
                  <Text>Total Spent</Text>
                  <Text style={{fontSize:16, fontWeight:'bold', color: colors.danger}}>{currency} {utils.formatNumber(total_spending)}</Text>
                </View>
                <View>
                  <Text>Total Earned</Text>
                  <Text style={{fontSize:16, fontWeight:'bold', color: colors.black}}>{currency} {utils.formatNumber(total_income)}</Text>
                </View>
                <View>
                  <Text>Balance</Text>
                  <Text style={{fontSize:16, fontWeight:'bold', color: colors.primary}}>{currency} {utils.formatNumber(total_balance)}</Text>
                </View>
              </View>
            </View>
            <View style={card}>
              <Text style={style.title}>Popular Categories</Text>
              <FlatList
                horizontal
                data={categories}
                renderItem={({ item, index }) => (
                  <View key={index} style={{ marginRight: 10 }}>
                    <Avatar title={utils.getAvatarInitials(item.name)} />
                    <ListItem.Subtitle>{item.name}</ListItem.Subtitle>
                    {!!item.budget && false && <Text>{item.budget?.amount_currency}{utils.formatNumber(item.budget?.amount)}</Text>}
                  </View>
                )}
              />
            </View>
          </View>

          <View style={style.horizontal}>
            <Text style={[style.title, style.ph10]}>
              Transactions
            </Text>
            <Button 
            title={`Total (${count})`} type='clear' 
            // onPress={openTransactions} 
            />
          </View>

        </View>}
        ListEmptyComponent={
          <View style={style.flex1}>
            {loading ? <Loading /> : <View style={style.noItemsContainer}>
              <Text>A list of your transactions will appear hear</Text>
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
          <RenderItem index={index} item={item} />
        )}
        keyExtractor={utils.keyExtractor}
      />
      <TouchableOpacity style={style.fixedButton} onPress={addTransaction}>
        <View style={style.fixedButtonIcon}>
          <Icon name="plus" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function RenderItem(props) {
  const navigation = useNavigation();
  const { item } = props;
  const { transaction_type = 'spending' } = item;
  const isSpending = transaction_type == 'spending'

  const onPressItem = () => {
    navigation.navigate('Transactions/View', { itemId: item.id });
  };

  return (
    <ListItem onPress={onPressItem} bottomDivider containerStyle={{ marginHorizontal: 8 }}>
      <Icon name={isSpending ? 'arrowup' : 'arrowdown'} type='antdesign' color={isSpending ? colors.warning : colors.primary} />
      <ListItem.Content>
        <ListItem.Title numberOfLines={1}>{item.description}</ListItem.Title>
        <ListItem.Subtitle numberOfLines={1}>
          {item.tags.map(tag => tag.name).join(", ")}
        </ListItem.Subtitle>
      </ListItem.Content>
      <View>
        <Text style={style.bold}>{item.amount_currency} {utils.formatNumber(item.amount, 0)}</Text>
        <Text style={style.time}>{dayjs(item.transaction_at || item.created_at).format("MMM DD, 'YY")}</Text>
      </View>
    </ListItem>
  );
}

const style = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  noItemsContainer: { paddingHorizontal: 20, paddingTop: 50 },
  subtitle: { padding: 4 },
  bold:{fontWeight:'700'},

  title:{
    fontSize:17, fontWeight:'bold',
    paddingVertical:10,
  },
  textNoResults: {
    textAlign: 'center',
    marginTop: 50,
  },
  itemContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 2,
  },
  ph10:{
    paddingHorizontal:10,
  },
  divider: {
    paddingBottom: 10,
  },
  time: {
    fontSize: 13,
    color:'grey'
  },
  horizontal: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },
  root: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.backgroundColor,
  },
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
});
