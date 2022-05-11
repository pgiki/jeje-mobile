/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Text, SearchBar, ListItem, Divider, Icon, Avatar } from 'react-native-elements';
import { colors, utils, requests, url, font, height, width, setAuthorization } from 'src/helpers';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import Loading from 'src/components/Loading';
import Modal from 'src/components/Modal';
import Input from 'src/components/Input'
import { Button } from 'src/components';

//TODO: April 18, 2022: use a reducer to set and manage filters

export default function Dashboard(props) {
  const { navigation, route: { params } } = props;
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResonse] = useState({
    total_spending: 0,
    total_income: 0,
    total_budget_spending: 0,
    total_budget_income: 0,
    total_balance: 0,
    count: 0,
  });
  const [searchFilters, setSearchFilters] = useState(params?.searchFilters || {})
  const [loggedUser, setLoggedUser] = useState(utils.getUser);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [transaction_at__gte, setTransaction_at__gte] = useState(undefined);
  const [transaction_at__lte, setTransaction_at__lte] = useState(undefined);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dateField, setDateField] = useState('transaction_at__gte');
  const [users, setUsers] = useState([]);
  const [initialDate, setInitialDate] = useState();

  const showDatePicker = (_dateField) => {
    setIsDatePickerVisible(true);
    setDateField(_dateField)
    setInitialDate(_dateField === 'transaction_at__lte' ? transaction_at__lte : transaction_at__gte)
  };

  const hideDatePicker = () => {
    setIsDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    if (dateField === 'transaction_at__lte') {
      setTransaction_at__lte(date)
    } else if (dateField === 'transaction_at__gte') {
      setTransaction_at__gte(date)
    }
    hideDatePicker();
  };

  const { nextURL, count } = response;
  const startURL = `${url.spendi.Transaction}?order_by=-id&distinct=id`;
  const {
    total_spending,
    total_income,
    total_budget_spending,
    total_budget_income,
    total_balance
  } = response

  const currency = loggedUser?.currency;
  const card = { marginVertical: 10, paddingHorizontal: 10 }
  const toggleSearch = () => setIsSearching(!isSearching);
  const filtersLength = _.size(_.omitBy(searchFilters, _.isNil));

  function login() {
    utils.logout()
    return navigation.navigate('Auth/Login')
  }

  useEffect(() => {
    setAuthorization(loggedUser?.token)
  }, [loggedUser])

  useEffect(() => {
    setSearchFilters(params?.searchFilters || {});
  }, [params?.searchFilters])


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
    const link = utils.stringify({
      search: searchText,
      ...searchFilters
    }, { baseURL: startURL })
    await fetchData(link);
    setRefreshing(false);
  };

  const onEndReached = () => {
    nextURL && fetchData(nextURL);
  };

  const debounceFetchData = useCallback(
    _.debounce(link => fetchData(link), 1000, {
      // 'wait': 3000,
      leading: false,
    }),
    [],
  );

  useEffect(() => {
    const link = utils.stringify({
      search: searchText,
      ...searchFilters
    }, { baseURL: startURL })
    debounceFetchData(link)
  }, [searchText, searchFilters]);

  useEffect(() => {
    setSearchFilters({
      ...searchFilters,
      transaction_at__gte: transaction_at__gte ? dayjs(transaction_at__gte).format() : undefined,
      transaction_at__lte: transaction_at__lte ? dayjs(transaction_at__lte).format() : undefined,
      tags__id: tags.length > 0 ? tags.map(tag => tag.id) : undefined,
      user__id: users.length > 0 ? users.map(user => user.id) : undefined,
      category__id: categories.length > 0 ? categories.map(cat => cat.id) : undefined,
    });
  }, [tags, categories, transaction_at__gte, transaction_at__lte, users])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // refresh everytime focuses on scree and extraquery params changes
      onRefresh();
    });
    return unsubscribe;

  }, [searchFilters]);

  // const isEmpty = results.length ===0 && !loading;
  const openNotifications = () => navigation.navigate("Notifications");
  const addTransaction = () => navigation.navigate("Transactions/Add");
  const onCloseFilters = () => setIsFilterModalVisible(false)


  return (
    <SafeAreaView style={style.root}>
      <View style={{ flexDirection: 'row', paddingTop: 10, justifyContent: 'space-between' }}>
        <View style={style.horizontal}>
          <Avatar
            title={utils.getAvatarInitials(loggedUser?.display_name)}
            rounded
            size={'medium'}
            onPress={() => navigation.navigate('Settings')}
          />
          <View style={{ marginLeft: 10 }}>
            <ListItem.Subtitle>Hello!</ListItem.Subtitle>
            <ListItem.Title>{loggedUser?.first_name} {loggedUser?.last_name}</ListItem.Title>
          </View>
        </View>

        <View style={style.horizontal}>
          {/* <TouchableOpacity style={{ marginRight: 15 }}>
            <Icon name={'share'} type='simple-line-icon' size={25} />
          </TouchableOpacity> */}
          <TouchableOpacity onPress={toggleSearch} style={{ marginRight: 15 }}>
            <Icon name={isSearching ? 'close' : 'search'} type='evilicon' size={32} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openNotifications} style={{ marginRight: 10 }}>
            <Icon name='bells' type='antdesign' />
          </TouchableOpacity>
        </View>
      </View>
      {/* <Divider /> */}
      <FlatList
        ListHeaderComponent={<View>
          <View>
            <View style={card}>
              <View style={style.horizontal}>
                <View>
                  <Text>Spending</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.danger }}>{currency} {utils.formatNumber(total_spending)}</Text>
                </View>
                <View>
                  <Text>Income</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.black }}>{currency} {utils.formatNumber(total_income)}</Text>
                </View>
                <View>
                  <Text>Balance</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>{currency} {utils.formatNumber(total_balance)}</Text>
                </View>
              </View>
              <View style={{ height: 15 }} />
              <Divider />
            </View>

            {isSearching && <>
              <View style={card}>
                <SearchBar
                  platform={Platform.OS}
                  placeholder={'Search...'}
                  onChangeText={text => setSearchText(text)}
                  value={searchText}

                />
              </View>
              <Divider />
            </>}
          </View>

          <View style={style.horizontal}>
            <Text style={[style.title, style.ph10]}>
              Transactions ({count})
            </Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}
              style={{ flexDirection: 'row', marginTop: 10, marginRight: 10 }}>
              {filtersLength > 0 && <Icon
                name={`filter-${filtersLength <= 9 ? filtersLength : '9-plus'}`}
                type='materialicons' size={14}
                color={colors.primary} />}
              <Text style={{ color: colors.primary, marginTop: -5 }}>{' '}Filters</Text>
            </TouchableOpacity>
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
          <RenderItem index={index} item={item} onRefresh={onRefresh} />
        )}
        keyExtractor={utils.keyExtractor}
      />
      <TouchableOpacity style={style.fixedButton} onPress={addTransaction}>
        <View style={style.fixedButtonIcon}>
          <Icon name="plus" type="entypo" color={colors.white} size={30} />
        </View>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      // date={new Date(initialDate)}
      />
      {true && <Modal
        visible={isFilterModalVisible}
        title={'Transaction Filters'}
        modalHeight={height - 60}
        extraProps={{
          onClosed: onCloseFilters,
        }}
      >
        <View style={{ paddingHorizontal: 10 }}>
          <Input
            label='Keyword'
            placeholder='Enter Keyword'
            onChangeText={setSearchText}
            value={searchText}
          />
          <Input
            label='Categories'
            placeholder='Choose Categories'
            onChangeText={setCategories}
            keyboardType='dropdown'
            url={url.spendi.Category}
            many={true}
            value={categories}
          />
          <Input
            label='Tags'
            placeholder='Choose tags'
            onChangeText={setTags}
            keyboardType='dropdown'
            url={url.spendi.Tag}
            many={true}
            value={tags}
          />
          <Input
            label='Created By'
            placeholder='Filter by User'
            onChangeText={setUsers}
            keyboardType='dropdown'
            url={url.User}
            many={true}
            value={users}
            canCreate={false}
            getLabel={(item) => `${item.display_name} (${item.username})`}
          />
          <ListItem
            containerStyle={style.dateRangeContainer}>
            <Icon name='date' type='fontisto' color={colors.primary} size={30} />
            <ListItem.Content>
              <ListItem.Title>Transaction Time Range</ListItem.Title>
              <View style={[style.horizontal, { flex: 1, paddingTop: 4 }]}>
                <TouchableOpacity onPress={() => showDatePicker('transaction_at__gte')} style={{ flexDirection: 'row' }} >
                  <Text style={style.date}>
                    {transaction_at__gte ? utils.formatDate(transaction_at__gte, 'll') : 'Start Date'}
                    <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                  </Text>
                </TouchableOpacity>
                <Icon name='arrowright' type='antdesign' color={colors.primary} size={16} style={{ width: 40 }} />
                <TouchableOpacity onPress={() => showDatePicker('transaction_at__lte')} style={{ flexDirection: 'row' }} >

                  <Text style={style.date}>
                    {transaction_at__lte ? utils.formatDate(transaction_at__lte, 'll') : 'End Date'}
                    <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                  </Text>
                </TouchableOpacity>

              </View>
              <ListItem.Subtitle></ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>

          {filtersLength > 0 &&
            <Button
              title={`Clear all ${filtersLength} filters(s)`}
              onPress={() => {
                setTags([]);
                setCategories([])
                setTransaction_at__gte(undefined);
                setTransaction_at__lte(undefined);
                setSearchFilters({});
                setIsFilterModalVisible(false);
                setUsers([]);
              }}
              type='clear'
              buttonStyle={{ marginVertical: 30 }}
            />}
          <Button
            title='Search'
            onPress={onCloseFilters}
          />
        </View>
      </Modal>}
    </SafeAreaView>
  );
}

function RenderItem(props) {
  const navigation = useNavigation();
  const { item, onRefresh } = props;
  const { transaction_type = 'spending' } = item;
  const isSpending = transaction_type === 'spending'

  const onPressItem = () => {
    navigation.navigate('Transactions/Add', { itemId: item.id });
  };
  const onLongPressItem = () => {
    Alert.alert(
      "Duplicate Transaction",
      `Confirm action for: ${item.description}`,
      [{ text: 'Cancel' },
      {
        text: 'Delete', onPress: async () => {
          try {
            await requests.delete(url.getURL('spendi.Transaction', { item, type: 'delete' }));
            Alert.alert('Item Deleted', 'This transaction was deleted successfully');
            onRefresh && onRefresh()
          } catch (error) {
            Alert.alert('Error Deleting', JSON.stringify(error.data?.detail || error.message));
          }
        }
      },
      {
        text: 'Duplicate', onPress: () => {
          navigation.navigate('Transactions/Add', { itemId: item.id, duplicate: true });
        }
      },
      ])
  };

  return (
    <ListItem onLongPress={onLongPressItem} onPress={onPressItem} bottomDivider containerStyle={{ marginHorizontal: 8 }}>
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
  bold: { fontWeight: '700' },

  title: {
    fontSize: 17,
    fontWeight: 'bold',
    paddingVertical: 10,
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
  ph10: {
    paddingHorizontal: 10,
  },
  divider: {
    paddingBottom: 10,
  },
  time: {
    fontSize: 13,
    color: 'grey'
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
  dateRangeContainer: {
    backgroundColor: colors.primary2,
    marginHorizontal: 6,
    paddingVertical: 10
  },
  date: {
    color: colors.grey
  }
});
