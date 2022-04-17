/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Platform, Dimensions, ScrollView,
} from 'react-native';
import { Text, SearchBar, ListItem, Divider, Icon } from 'react-native-elements';
import { colors, utils, requests, url, font } from 'src/helpers';
import { Menu } from 'react-native-paper';
import dayjs, { duration } from 'dayjs';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import Loading from 'src/components/Loading';
import { Button } from 'src/components';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";

const chartConfig = {
  backgroundColor: colors.white,
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  decimalPlaces: 2, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#ffa726"
  }
}


export default function Stats(props) {
  const navigation = useNavigation();
  const durations =[
    {value:'today', label:"Today"}, 
    {value:'week', label:"Week"}, 
    {value:'month', label:'Month'},
    {value: 'year', label:'Year'},
  ] 
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [response, setResonse] = useState({});
  const [isPieAbsolute, setIsPieAbsolute] = useState(false);
  const { nextURL, count } = response;
  const [loggedUser, setLoggedUser] = useState(utils.getUser())
  const [visibleDurationPicker, setVisibleDurationPicker] = useState(false);
  const [durationPicked, setDurationPicked] = useState(durations[0]);



  const openDurationPicker = () => setVisibleDurationPicker(true);
  const closeDurationPicker = () => setVisibleDurationPicker(false);


  // const searchInput=useRef()
  const startURL = `${url.spendi.Tag}`;
  const currency = loggedUser?.currency;

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

  const data = [
    {
      name: "Seoul",
      population: 21500000,
      color: "rgba(131, 167, 234, 1)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Toronto",
      population: 2800000,
      color: "#F00",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Beijing",
      population: 527612,
      color: "red",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "New York",
      population: 8538000,
      color: "tomato",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Moscow",
      population: 11920000,
      color: "rgb(0, 0, 255)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];

  return (
    <ScrollView contentContainerStyle={style.root}>
      <View style={style.horizontal}>
        <Text style={style.title}>Analytics</Text>
        <Menu
          visible={visibleDurationPicker}
          onDismiss={closeDurationPicker}
          anchor={<Button onPress={openDurationPicker} title={durationPicked.label} type='clear'/>}
        >
          {durations.map(duration=><Menu.Item 
          key={duration.value} 
          onPress={() =>{
            closeDurationPicker();
            setDurationPicked(duration);
          }} 
          title={duration.label} />)}
        </Menu>

      </View>
      <LineChart
        data={{
          labels: ["January", "February", "March", "April", "May", "June"],
          datasets: [
            {
              color: () => 'red',
              data: [
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
              ]
            },
            {
              color: () => colors.primary,
              data: [
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
              ]
            },
            {
              color: () => 'gray',
              data: [
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
              ]
            }
          ]
        }}
        width={Dimensions.get("window").width*0.95} // from react-native
        height={Dimensions.get("window").height*0.2}
        yAxisLabel={currency}
        // yAxisSuffix="k"
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={chartConfig}
        // bezier
        style={{
          padding: 8,
          borderRadius: 16
        }}
      />

      <View style={style.horizontal}>
        <Text style={style.title}>By Categories</Text>
        <Button onPress={() => setIsPieAbsolute(!isPieAbsolute)} 
        title={isPieAbsolute ? '%' : currency} type='clear'/>
      </View>
      <ScrollView horizontal contentContainerStyle={{ paddingVertical: 10 }}>
        <PieChart
          data={data}
          width={Dimensions.get("window").width * 1.2}
          height={Dimensions.get("window").height * 0.15}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          // paddingLeft={"1"}
          center={[-10, 0]}
          absolute={isPieAbsolute}
        // style={{
        //   paddingVertical: 8,
        //   borderRadius: 0
        // }}
        />
      </ScrollView>

      <View style={style.horizontal}>
        <Text style={style.title}>Budget Spending Progress</Text>
      </View>
      <ProgressChart
        data={{
          labels: ["Swim", "Bike", "Run", "Maish Plus"], // optional
          data: [0.4, 0.6, 0.8, 1.0]
        }}
        width={Dimensions.get("window").width * 0.9}
        height={220}
        chartConfig={chartConfig}
        hideLegend={false}
        radius={10}
        strokeWidth={8}
      />
      <View style={style.horizontal}>
        <Text style={style.title}>Spending by Tags</Text>
        <TouchableOpacity>
          <Icon name='arrowright' type='antdesign' color={colors.primary}/>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingBottom:10,
  },
  title:{fontWeight:'bold'}

});
