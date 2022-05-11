/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect, memo } from 'react';
import {
    View,
    StyleSheet, TouchableOpacity,
} from 'react-native';
import { colors, utils, requests, url, font, height, width } from 'src/helpers';
import _ from 'lodash';
import Input from 'src/components/Input'
import { Button, ScrollView, } from 'src/components';
import { Snackbar, Text } from 'react-native-paper'
import SwitchSelector from "react-native-switch-selector";
import { Icon, ListItem } from 'react-native-elements';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function BudgetsAdd(props) {
    const { navigation, route: { params } } = props;
    const itemId = params?.itemId;
    const [item, setItem] = useState();
    const [category, setCategory] = useState();
    const [amount, setAmount] = useState();
    const [amountError, setAmountError] = useState();
    const [name, setName] = useState();
    const [initialDate, setInitialDate] = useState()

    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState();
    const [budget_type, setBudget_type] = useState('spending');
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [active_from, setActive_from] = useState();
    const [active_until, setActive_until] = useState();
    const [dateField, setDateField] = useState('active_from');

    const budgetTypes = [
        { value: 'spending', label: "Spending" },
        { value: 'income', label: 'Income' },
        { value: 'saving', label: "Saving" },
    ]

    async function fetchItem() {
        const res = await requests.get(
            url.getURL('spendi.Budget', { type: 'detail', item: { id: itemId } })
        )
        setItem(res);
    }

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            itemId && fetchItem()
        });
        return unsubscribe;
    }, [itemId]);


    useEffect(() => {
        navigation.setOptions({
            title: item ? 'Edit Budget/Goal' : `Add Budget/Goal`,
        })
    }, [item])

    useEffect(() => {
        if (item) {
            setName(item.name)
            setAmount(item.amount);
            setCategory(item.category);
            setBudget_type(item.budget_type);
            setActive_from(item.active_from);
            setActive_until(item.active_until);
        }
    }, [item])

    async function onSubmit() {
        if (amount) {
            setLoading(true);
            setAmountError(null);
            const data = {
                name,
                category: category?.id,
                budget_type,
                active_from,
                active_until,
                amount,
            }
            try {
                const METHOD = itemId ? 'patch' : 'post'
                const link = itemId ? url.getURL('spendi.Budget', { type: 'detail', item: { id: itemId } }) : url.spendi.Budget
                const res = await requests[METHOD](link, data);
                setAlertMessage(itemId ? 'Updated successfully' : 'Created successfully')
                setItem(res);
            } catch (error) {
                setAlertMessage(JSON.stringify(error.data.detail))
            }
            setLoading(false);
        } else {
            setAmountError("This is required")
        }
    }

    const showDatePicker = (_dateField) => {
        setIsDatePickerVisible(true);
        setDateField(_dateField)
        setInitialDate(_dateField === 'active_until' ? active_until : active_from)
    };

    const hideDatePicker = () => {
        setIsDatePickerVisible(false);
    };

    const handleDateConfirm = (date) => {
        if (dateField === 'active_until') {
            setActive_until(date)
        } else if (dateField === 'active_from') {
            setActive_from(date)
        }
        hideDatePicker();
    };

    console.log('date picker', isDatePickerVisible)

    return (
        <ScrollView contentContainerStyle={style.root}>
            <Snackbar
                visible={!!alertMessage}
                onDismiss={() => setAlertMessage(undefined)}
                action={{
                    label: 'OK',
                    onPress: navigation.goBack,
                }}>
                {alertMessage}
            </Snackbar>
            <Input
                label='Name'
                value={name}
                placeholder='Give a name'
                onChangeText={setName}
            />

            <Input
                label='Amount'
                value={amount ? utils.formatNumber(utils.extractDigits(amount)) : amount}
                placeholder='Enter Amount'
                onChangeText={(v) => setAmount(utils.extractDigits(v))}
                keyboardType={'decimal-pad'}
                errorMessage={amountError}
            />

            <SwitchSelector
                options={budgetTypes}
                initial={0}
                value={budgetTypes.map(t => t.value).indexOf(budget_type)}
                onPress={setBudget_type}
                textColor={colors.purple} //'#7a44cf'
                selectedColor={colors.white}
                buttonColor={colors.primary}
                borderColor={colors.primary6}
                hasPadding
                accessibilityLabel="transaction-type-switch-selector"
            />
            <Input
                label='Category'
                placeholder='Choose Category'
                onChangeText={setCategory}
                keyboardType='dropdown'
                url={url.spendi.Category}
                value={category}
            />

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
            // date={new Date(initialDate)}
            />

            <ListItem
                containerStyle={style.dateRangeContainer}>
                <Icon name='file' type='feather' color={colors.primary} size={30} />
                <ListItem.Content>
                    <ListItem.Title>Budget/Goal Duration</ListItem.Title>
                    <View style={[style.horizontal, { flex: 1, paddingTop: 4 }]}>
                        <TouchableOpacity onPress={() => showDatePicker('active_from')} style={{ flexDirection: 'row' }} >

                            <Text style={style.date}>
                                {active_from ? utils.formatDate(active_from, 'll') : 'Start Date'}
                                <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                            </Text>
                        </TouchableOpacity>
                        <Icon name='arrowright' type='antdesign' color={colors.primary} size={16} style={{ width: 40 }} />
                        <TouchableOpacity onPress={() => showDatePicker('active_until')} style={{ flexDirection: 'row' }} >

                            <Text style={style.date}>
                                {active_until ? utils.formatDate(active_until, 'll') : 'End Date'}
                                <Icon name='edit' type='antdesign' color={colors.primary} size={16} />
                            </Text>
                        </TouchableOpacity>

                    </View>
                    <ListItem.Subtitle></ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>

            <View style={style.h40} />
            <Button
                title={alertMessage ? alertMessage : (itemId ? 'Confirm Changes' : 'Submit')}
                loading={loading}
                onPress={onSubmit}
                labelStyle={style.labelStyle}
            />
        </ScrollView>
    )
}

const style = StyleSheet.create({
    flex1: {
        flex: 1,
    },
    root: {
        padding: 5,
        paddingBottom: 0.25 * height,
        backgroundColor: colors.white,
    },
    tagsContainer: {
        flex: 1,
        flexWrap: 'wrap',
        flexDirection: 'row'
    },
    labelStyle: { color: colors.white },
    h40: { height: 40 },
    horizontal: { flexDirection: 'row' },
    editIcon: {
        flexDirection: 'row',
        marginRight: 10,
    },
    dateRangeContainer: {
        backgroundColor: colors.primary2,
        marginHorizontal: 6,
        paddingVertical: 10
    },
    date: {
        color: colors.grey
    }
})