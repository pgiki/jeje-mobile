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
import Input from 'src/components/Input'
import { Button, ScrollView, } from 'src/components';

export default function TransactionsView(props){
    return <View>
        <Text>Transaction Details</Text>
    </View>
}