/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text, ListItem, Icon } from '@rneui/themed';
import { colors, utils, requests, url, width, LocalizationContext } from 'src/helpers';
import { Menu } from 'react-native-paper';
import _ from 'lodash';
import Loading from 'src/components/Loading';
import { Button } from 'src/components';
import FlatList from 'src/components/FlatList';
import dayjs from 'dayjs';

import {
  LineChart,
} from "react-native-chart-kit";
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ScrollView } from 'src/components';


const chartConfig = {
  backgroundColor: colors.white,
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  decimalPlaces: 2, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "2",
    strokeWidth: "1",
    stroke: "#ffa726"
  }
}


export default function Stats(props) {
  const { navigation, route: { params } } = props
  const { i18n } = useContext(LocalizationContext);
  const day = dayjs()

  const durations = [
    { value: 'all', label: i18n.t("All"), dates: [] },
    { value: 'today', label: i18n.t("Today"), dates: [day.startOf('day'), day] },
    { value: 'week', label: i18n.t("This Week"), dates: [day.startOf('week'), day] },
    { value: 'month', label: i18n.t('This Month'), dates: [day.startOf('month'), day] },
    { value: 'year', label: i18n.t('This Year'), dates: [day.startOf('year'), day] },
  ]
  const dataTypes = [
    { value: 'Tag', label: i18n.t("Tags"), filter: 'tags__id' },
    { value: 'Category', label: i18n.t("Categories"), filter: 'category__id' },
  ]
  const [searchText, setSearchText] = useState('');
  const [visibleDurationPicker, setVisibleDurationPicker] = useState(false);
  const [visibleDataTypePicker, setVisibleDataTypePicker] = useState(false);
  const [durationPicked, setDurationPicked] = useState(durations[0]);
  const [dataTypePicked, setDataTypePicked] = useState(dataTypes[0]);
  const openDurationPicker = () => setVisibleDurationPicker(true);
  const closeDurationPicker = () => setVisibleDurationPicker(false);
  const openDataTypePicker = () => setVisibleDataTypePicker(true);
  const closeDataTypePicker = () => setVisibleDataTypePicker(false);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState();
  const [labelColors, setLabelColors] = useState([]);
  const [weekdays] = useState(dayjs.weekdaysShort().slice(1, 6).concat(dayjs.weekdaysShort().slice(5, 6)));
  const [months] = useState(dayjs.monthsShort());

  function getXlabels(d) {
    return {
      "all": months,
      "year": months,
      // "month": ["created_at__day", range(days_in_month)],
      "week": weekdays,
      "today": ['0', '2hr', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h', '24h'],
    }[durationPicked.value] || d
  }

  function getColorCode() {
    const makeColorCode = '0123456789ABCDEF';
    let code = '#';
    for (var count = 0; count < 6; count++) {
      code = code + makeColorCode[Math.floor(Math.random() * 16)];
    }
    return code;
  }

  async function getGraphData() {
    setLoading(true);
    const link = utils.stringify({
      data_type: 'transaction_type', //this is any field on the transaction object eg amount, tags__id etc,
      transaction_at__gte: durationPicked.dates[0]?.format(),
      transaction_at__lte: durationPicked.dates[1]?.format(),
      request_duration: durationPicked.value,
    }, {
      baseURL: url.spendi.Transaction + 'graph/'
    })
    const res = await requests.get(link)
    setGraphData(res);
    setLoading(false);
  }

  useEffect(() => {
    getGraphData();
  }, [durationPicked])

  useEffect(() => {
    if (graphData) {
      setLabelColors(graphData.labels.map(getColorCode))
    }
  }, [graphData, params])

  const startURL = utils.stringify({
    distinct: 'id',
    search: searchText,
    order_by: '-id',
    query: '{id,name,total_income,total_spending,total_saving}',
    "advanced_search[transactions__transaction_at__gte]": durationPicked.dates[0]?.format(),
    "advanced_search[transactions__transaction_at__lte]": durationPicked.dates[1]?.format()
  }, {
    baseURL: url.spendi[dataTypePicked.value]
  })

  return (
    <View style={style.root}>
      <FlatList
        ListHeaderComponent={<>
          <View style={style.horizontal}>
            <ScrollView horizontal>
              {graphData && Object.keys(graphData.data).map((key, index) => (
                <Text key={index}><Icon name='square' type='ionicon' size={10} color={labelColors[index]} /> {' '}{i18n.t(key).title()} <Icon name='sigma' type='material-community' size={10} />{`${utils.formatNumber(_.sum(graphData.data[key]))}  `}</Text>
              ))}
            </ScrollView>

            <Menu
              visible={visibleDurationPicker}
              onDismiss={closeDurationPicker}
              contentStyle={style.whiteBackground}
              anchor={<TouchableOpacity onPress={openDurationPicker}>
                <Text style={style.menuText}>{durationPicked.label} <Icon size={14} name='chevron-down' type='entypo' /></Text>
              </TouchableOpacity>}
            >
              {durations.map(duration => <Menu.Item
                key={duration.value}
                onPress={() => {
                  closeDurationPicker();
                  setDurationPicked(duration);
                }}
                title={duration.label} />)}
            </Menu>

          </View>
          {(loading || !graphData) ? <Loading /> : <LineChart
            data={{
              labels: getXlabels(graphData.labels).filter((label, x) => x % (durationPicked.value === 'month' ? 4 : 2) === 0),
              datasets: Object.keys(graphData?.data).map((key, index) => (
                {
                  color: () => labelColors[index] || 'gray',
                  data: graphData?.data[key]
                }))
            }}
            width={Dimensions.get("window").width * 0.95} // from react-native
            height={Dimensions.get("window").height * 0.25}
            yAxisLabel={''}
            // yAxisSuffix="k"
            yAxisInterval={1} // optional, defaults to 1
            chartConfig={chartConfig}
            bezier
            style={style.lineChart}
          />}


          <View style={style.horizontal}>
            <Text style={style.summaryText}>{i18n.t('Summary')}</Text>
            <Menu
              visible={visibleDataTypePicker}
              onDismiss={closeDataTypePicker}
              contentStyle={style.whiteBackground}
              anchor={<Button onPress={openDataTypePicker} title={dataTypePicked.label} type='clear' />}
            >
              {dataTypes.map(dataType => <Menu.Item
                key={dataType.value}
                onPress={() => {
                  closeDataTypePicker();
                  setDataTypePicked(dataType);
                }}
                title={dataType.label} />)}
            </Menu>
          </View>
        </>}
        startURL={startURL}
        renderItem={({ item, index }) => (
          <ListItem bottomDivider onPress={() => navigation.navigate("Dashboard", {
            searchFilters: {
              [dataTypePicked.filter]: item.id
            }
          })}>
            <ListItem.Content>
              <View style={style.itemContainer1}>
                <ListItem.Title numberOfLines={1} style={style.itemTitle}>
                  {item.name}
                </ListItem.Title>
                <ListItem.Subtitle style={item.total_income - item.total_spending > 0 ? style.balancePositive : style.balanceNegative}>
                  {utils.toHR(item.total_income - item.total_spending)}
                </ListItem.Subtitle>
              </View>

              <View style={style.totalAmounts}>
                <View>
                  <Text><Icon name='arrowdown' color={colors.primary} type='antdesign' size={14} /> {utils.formatNumber(item.total_income || 0)}</Text>
                </View>
                <View>
                  <Text><Icon name='arrowup' color={colors.warning} type='antdesign' size={14} /> {utils.formatNumber(item.total_spending || 0)}</Text>
                </View>
              </View>
            </ListItem.Content>
          </ListItem>
        )}
      />
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
    paddingHorizontal: 15,
    backgroundColor: colors.backgroundColor,
    paddingBottom: 10,
  },
  title: { fontWeight: 'bold' },
  whiteBackground: { backgroundColor: 'white' },
  menuText: { color: colors.primary, fontWeight: '600' },
  lineChart: {
    padding: 8,
    borderRadius: 16
  },
  summaryText: { marginLeft: 10, marginTop: 2, fontSize: 18, fontWeight: '500' },
  itemContainer1: { flexDirection: 'row', justifyContent: 'space-between', width: 0.8 * width },
  itemTitle: { fontSize: 16, color: colors.black, justifyContent: 'space-between' },
  totalAmounts: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  balancePositive: { textAlign: 'right', color: colors.success },
  balanceNegative: { textAlign: 'right', color: colors.warning },

});
