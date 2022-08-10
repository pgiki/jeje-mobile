/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Text, SearchBar, ListItem, Divider, Icon, Avatar } from '@rneui/themed';
import { colors, utils, requests, url, height, setAuthorization, LocalizationContext } from 'src/helpers';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from 'dayjs';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import Loading from 'src/components/Loading';
import Modal from 'src/components/Modal';
import Input from 'src/components/Input'
import { Button } from 'src/components';
import schema from 'src/schema';

//TODO: April 18, 2022: use a reducer to set and manage filters

export default function Dashboard(props) {
  const { navigation, route: { params } } = props;
  const { i18n, loggedUser } = useContext(LocalizationContext);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingVisible, setIsDownloadingVisible] = useState(false);
  const [response, setResonse] = useState({
    total_spending: 0,
    total_income: 0,
    total_budget_spending: 0,
    total_budget_income: 0,
    total_balance: 0,
    count: 0,
  });
  const [searchFilters, setSearchFilters] = useState(params?.searchFilters || {})
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [transaction_at__gte, setTransaction_at__gte] = useState(undefined);
  const [transaction_at__lte, setTransaction_at__lte] = useState(undefined);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dateField, setDateField] = useState('transaction_at__gte');
  const [users, setUsers] = useState([]);

  const [initialDate, setInitialDate] = useState();
  const [reportTitle, setReportTitle] = useState('')

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
  const startURL = `${url.spendi.Transaction}?order_by=-id&distinct=id&query=${schema.transaction}`;
  const {
    total_spending,
    total_income,
  } = response

  const currency = loggedUser?.currency;
  const card = { marginVertical: 10, paddingHorizontal: 10 }
  const toggleSearch = () => setIsSearching(!isSearching);
  const filtersLength = _.size(_.omitBy(searchFilters, _.isNil));

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
      if (error.data?.detail === 'Invalid token.') {
        return utils.logout()
      } else {
        Alert.alert('Error Fetching Data', JSON.stringify(error.data?.detail || error.message));
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
      const link = utils.stringify({
        search: searchText,
        ...searchFilters
      }, { baseURL: startURL })
      debounceFetchData(link);
    });
    return unsubscribe;

  }, [searchFilters]);

  const openNotifications = () => navigation.navigate("Notifications");
  const addTransaction = () => navigation.navigate("Transactions/Add");
  const onCloseFilters = () => setIsFilterModalVisible(false);

  async function downloadData() {
    setIsDownloading(true);
    const link = utils.stringify({
      search: searchText,
      ...searchFilters,
      download_report: 1,
      report_title: reportTitle,
      query: '{}'
    }, { baseURL: startURL })
    const res = await requests.get(link);
    setIsDownloading(false);
    setIsDownloadingVisible(false);
    utils.openURL(res.report)
  }

  function downloadTransactions() {
    setIsDownloadingVisible(true);
  }

  return (
    <SafeAreaView style={style.root}>
      <View style={style.container1}>
        <View style={style.horizontal}>
          <Avatar
            title={utils.getAvatarInitials(loggedUser?.display_name)}
            rounded
            size={'medium'}
            onPress={() => navigation.navigate('Settings')}
          />
          <View style={style.greetingContainer}>
            <ListItem.Subtitle>{i18n.t('Hello')}</ListItem.Subtitle>
            <ListItem.Title>{loggedUser?.display_name}</ListItem.Title>
          </View>
        </View>
        <View style={style.horizontal}>
          {results?.length > 0 && <TouchableOpacity style={style.mr15} onPress={downloadTransactions}>
            <Icon name={'download'} type='antdesign' size={25} />
          </TouchableOpacity>}
          <TouchableOpacity onPress={openNotifications} style={style.mr10}>
            <Icon name='notifications-outline' type='ionicon' size={30} />
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
                  <Text>{i18n.t('Spending')}</Text>
                  <Text style={style.spendingNumber}>{currency} {utils.toHR(total_spending)}</Text>
                </View>
                <View>
                  <Text>{i18n.t('Income')}</Text>
                  <Text style={style.incomeNumber}>{currency} {utils.toHR(total_income)}</Text>
                </View>
                <View>
                  <Text>{i18n.t('Balance')}</Text>
                  <Text style={style.balanceNumber}>{currency} {utils.toHR(total_income - total_spending)}</Text>
                </View>
              </View>
              <View style={style.h15} />
              <Divider />
            </View>
            {isSearching && <>
              <View style={card}>
                <SearchBar
                  platform={Platform.OS}
                  placeholder={i18n.t('Search')}
                  onChangeText={text => setSearchText(text)}
                  value={searchText}
                />
              </View>
              <Divider />
            </>}
          </View>
          <View style={style.horizontal}>
            <Text style={[style.title, style.ph10]}>
              {i18n.t('transactions_count', { count })}
            </Text>
            <View style={style.horizontal}>
              <TouchableOpacity onPress={toggleSearch} style={style.searchIcon}>
                <Icon name={isSearching ? 'close' : 'search'} type='evilicon' size={26} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}
                style={style.filtersIconContainer}>
                {filtersLength > 0 && <Icon
                  name={`filter-${filtersLength <= 9 ? filtersLength : '9-plus'}`}
                  type='materialicons' size={14}
                  color={colors.primary} />}
                <Text style={style.filtersText}>{' '}{i18n.t('Filters')}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>}
        ListEmptyComponent={
          <View style={style.flex1}>
            {loading ? <Loading /> : <View style={style.noItemsContainer}>
              <Text>{i18n.t('A list of your transactions will appear hear')}</Text>
              <Button
                title={i18n.t('Add Transaction')}
                style={style.noItemaddTransactionButton}
                onPress={addTransaction}
                textColor={colors.white}
                icon={'note-plus-outline'}
              />
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
      {results?.length > 0 &&
        <TouchableOpacity style={style.fixedButton} onPress={addTransaction}>
          <View style={style.fixedButtonIcon}>
            <Icon name="plus" type="entypo" color={colors.white} size={30} />
          </View>
        </TouchableOpacity>}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
        date={new Date(initialDate)}
      />
      {true && <Modal
        visible={isFilterModalVisible}
        title={i18n.t('Transaction Filters')}
        modalHeight={height - 60}
        extraProps={{
          onClosed: onCloseFilters,
        }}
      >
        <View style={style.ph10}>
          <Input
            label={i18n.t('Search Keyword')}
            placeholder={i18n.t('Enter Keyword')}
            onChangeText={setSearchText}
            value={searchText}
          />
          <Input
            label={i18n.t('Categories')}
            placeholder={i18n.t('Choose Categories')}
            onChangeText={setCategories}
            keyboardType='dropdown'
            url={url.spendi.Category + '?query={id,name}'}
            many={true}
            value={categories}
          />
          <Input
            label={i18n.t('Tags')}
            placeholder={i18n.t('Choose tags')}
            onChangeText={setTags}
            keyboardType='dropdown'
            url={url.spendi.Tag + '?query={id,name}'}
            many={true}
            value={tags}
          />
          <Input
            label={i18n.t('Created By')}
            placeholder={i18n.t('Filter by User')}
            onChangeText={setUsers}
            keyboardType='dropdown'
            url={url.User + '?query={id,username,display_name}'}
            many={true}
            value={users}
            canCreate={false}
            getLabel={(item) => `${item.display_name} (${item.username})`}
          />
          <ListItem
            containerStyle={style.dateRangeContainer}>
            <Icon name='date' type='fontisto' color={colors.primary} size={30} />
            <ListItem.Content>
              <ListItem.Title>{i18n.t('Transaction Time Range')}</ListItem.Title>
              <View style={style.transactionTimeContainer}>
                <TouchableOpacity onPress={() => showDatePicker('transaction_at__gte')} style={style.horizontal} >
                  <Text style={style.date}>
                    {transaction_at__gte ? utils.formatDate(transaction_at__gte, 'll') : i18n.t('Start Date')}
                    <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                  </Text>
                </TouchableOpacity>
                <Icon name='arrowright' type='antdesign' color={colors.primary} size={16} style={style.arrowRight} />
                <TouchableOpacity onPress={() => showDatePicker('transaction_at__lte')} style={style.horizontal} >
                  <Text style={style.date}>
                    {transaction_at__lte ? utils.formatDate(transaction_at__lte, 'll') : i18n.t('End Date')}
                    <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                  </Text>
                </TouchableOpacity>
              </View>
              <ListItem.Subtitle></ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <Button
            title={i18n.t('Apply Filters')}
            onPress={onCloseFilters}
            textColor={colors.white}
            icon='filter-outline'
            buttonStyle={style.clearFiltersButton}
          />
          {filtersLength > 0 &&
            <Button
              title={i18n.t('Clear all {count} filters', { count: filtersLength })}
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
              // textColor={colors.white}
              buttonStyle={style.clearFiltersButton}
            />}
        </View>
      </Modal>}

      <Modal
        visible={isDownloadingVisible}
        title={i18n.t('Download Transactions')}
        modalHeight={0.5 * height}
        containerStyle={style.p20}
        extraProps={{
          onClosed: () => setIsDownloadingVisible(false),
        }}
      >
        <Text style={style.downloadInfoText}>
          {isDownloading ? i18n.t('Please Wait') : i18n.t('You are about to download {count} transactions', { count })}</Text>
        {!isDownloading && <Input
          label={i18n.t('Report Title')}
          placeholder={i18n.t('Enter Title')}
          onChangeText={setReportTitle}
          value={reportTitle}
        />}
        <Button
          loading={isDownloading}
          disabled={isDownloading}
          title={i18n.t('Download Now')}
          onPress={downloadData}
          buttonStyle={style.mt20}
          labelStyle={style.white}
        />
        <Button
          title={i18n.t('Cancel')}
          type='clear'
          onPress={() => setIsDownloadingVisible(false)}
          buttonStyle={style.mt20}
        />
      </Modal>
    </SafeAreaView>
  );
}

function RenderItem(props) {
  const navigation = useNavigation();
  const { i18n } = useContext(LocalizationContext);
  const { item, onRefresh } = props;
  const { transaction_type = 'spending' } = item;
  const isSpending = transaction_type === 'spending'

  const onPressItem = () => {
    navigation.navigate('Transactions/Add', { itemId: item.id });
  };
  const onLongPressItem = () => {
    Alert.alert(
      i18n.t("Duplicate Transaction"),
      i18n.t('Confirm duplicating {description}', item),
      [{ text: i18n.t('Cancel') },
      {
        text: i18n.t('Delete'), onPress: async () => {
          try {
            await requests.delete(url.getURL('spendi.Transaction', { item, type: 'delete' }));
            Alert.alert(i18n.t('Item Deleted'), i18n.t('This transaction was deleted successfully'));
            onRefresh && onRefresh()
          } catch (error) {
            Alert.alert(i18n.t('Error Deleting'), JSON.stringify(error.data?.detail || error.message));
          }
        }
      },
      {
        text: i18n.t('Duplicate'), onPress: () => {
          navigation.navigate('Transactions/Add', { itemId: item.id, duplicate: true });
        }
      },
      ])
  };

  return (
    <ListItem onLongPress={onLongPressItem} onPress={onPressItem} bottomDivider containerStyle={style.transactionContainer}>
      <Icon name={isSpending ? 'arrowup' : 'arrowdown'} type='antdesign' color={isSpending ? colors.warning : colors.primary} />
      <ListItem.Content>
        <ListItem.Title numberOfLines={1}>{item.description}</ListItem.Title>
        <ListItem.Subtitle numberOfLines={1}>
          {item.tags.map(tag => tag.name).join(", ") || item.category?.name}
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
  flex1: { flex: 1 },
  arrowRight: { width: 40 },
  mt20: { marginTop: 20 },
  transactionContainer: { marginHorizontal: 8 },
  mr15: { marginRight: 15 },
  mr10: { marginRight: 10 },
  p20: { padding: 20 },
  white: { color: colors.white },
  downloadInfoText: { paddingTop: 30, paddingBottom: 20, textAlign: 'center' },
  greetingContainer: { marginLeft: 10 },
  container1: { flexDirection: 'row', paddingTop: 10, justifyContent: 'space-between' },
  spendingNumber: { fontSize: 16, fontWeight: 'bold', color: colors.danger },
  incomeNumber: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  balanceNumber: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  noItemsContainer: { paddingHorizontal: 20, paddingTop: 50 },
  noItemaddTransactionButton: { marginTop: 40 },
  subtitle: { padding: 4 },
  bold: { fontWeight: '700' },
  clearFiltersButton: { marginTop: 30 },
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
    paddingVertical: 10,
    marginBottom: 30,
  },
  date: {
    color: colors.grey
  },
  h15: { height: 15 },
  filtersIconContainer: { flexDirection: 'row', marginTop: 10, marginRight: 10 },
  searchIcon: { margin: 8, marginRight: 20 },
  filtersText: { color: colors.primary, marginTop: -5 },
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
  transactionTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 4
  },
});
