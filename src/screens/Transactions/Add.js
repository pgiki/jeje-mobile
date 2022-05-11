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

export default function TransactionsAdd(props) {
    const { navigation, route: { params } } = props;
    const [itemId, setItemId] = useState(params?.itemId)
    const [item, setItem] = useState();
    const [duplicate, setDuplicate] = useState(params?.duplicate || false);
    const [category, setCategory] = useState();
    const [amount, setAmount] = useState();
    const [amountError, setAmountError] = useState();
    const [transaction_at, setTransaction_at] = useState();
    const [tags, setTags] = useState([]);
    const [description, setDescription] = useState();
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState();
    const [transaction_type, setTransaction_type] = useState('spending');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const transactionTypes = [
        { value: 'spending', label: "Spending" },
        { value: 'income', label: 'Income' },
        { value: 'saving', label: "Saving" },
    ]

    async function fetchItem() {
        const res = await requests.get(
            url.getURL('spendi.Transaction', { type: 'detail', item: { id: itemId } })
        )
        setItem(res);
    }

    useEffect(() => {
        setItemId(params?.itemId);
        const unsubscribe = navigation.addListener('focus', () => {
            itemId && fetchItem()
        });
        return unsubscribe;
    }, [params?.itemId]);


    useEffect(() => {
        navigation.setOptions({
            title: transaction_at ? utils.formatDate(transaction_at, 'lll') : `Add Transaction`,
            headerRight: () => transaction_at ? (<TouchableOpacity
                style={style.editIcon}
                onPress={showDatePicker}
            >
                <Icon name='edit' type='feather' />
            </TouchableOpacity>) : false && <TouchableOpacity
                style={style.editIcon}
                onPress={() => navigation.navigate('Camera')}
            >
                <Icon name='camera' type='feather' />
            </TouchableOpacity>
        })
    }, [transaction_at, duplicate])

    useEffect(() => {
        if (item) {
            setAmount(item.amount);
            setDescription(item.description);
            setCategory(item.category);
            setTransaction_type(item.transaction_type);
            setTags(item.tags);
            setTransaction_at(item.transaction_at)
        }
    }, [item])

    async function onSubmit() {
        if (amount) {
            setLoading(true);
            setAmountError(null);
            const data = {
                category: category?.id,
                transaction_type,
                transaction_at,
                amount,
                tags: tags && {
                    add: tags.map(tag => tag.id),
                    remove: (item && !duplicate) ? _.difference(
                        item.tags.map(tag => tag.id),
                        tags.map(tag => tag.id)
                    ) : undefined
                },
                description,
            }
            try {
                const METHOD = (itemId && !duplicate) ? 'patch' : 'post'
                const link = (METHOD === 'patch') ? url.getURL('spendi.Transaction', { type: 'detail', item: { id: itemId } }) : url.spendi.Transaction
                const res = await requests[METHOD](link, data);
                setAlertMessage(itemId ? 'Updated successfully' : 'Created successfully')
                setItem(res);
                setDuplicate(false);
                setItemId(res.id);
            } catch (error) {
                setAlertMessage(JSON.stringify(error.data.detail))
            }
            setLoading(false);
        } else {
            setAmountError("This is required")
        }
    }

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleDateConfirm = (date) => {
        setTransaction_at(date);
        hideDatePicker();
    };

    const attachmentsCount = item?.attachments_count || 0;

    return (<>
        <ScrollView contentContainerStyle={style.root}>
            <Input
                label='Amount'
                value={amount ? utils.formatNumber(utils.extractDigits(amount)) : amount}
                placeholder='Enter Amount'
                onChangeText={(v) => setAmount(utils.extractDigits(v))}
                keyboardType={'decimal-pad'}
                errorMessage={amountError}
            />

            <Input
                label='Descriptions'
                placeholder='Add more details (Optional)'
                value={description}
                multiline={true}
                onChangeText={setDescription}
            />
            <SwitchSelector
                options={transactionTypes}
                initial={0}
                value={transactionTypes.map(t => t.value).indexOf(transaction_type)}
                onPress={setTransaction_type}
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

            <Input
                label='Tags'
                placeholder='Select Tags'
                onChangeText={setTags}
                keyboardType='dropdown'
                url={url.spendi.Tag}
                many={true}
                multiline={true}
                value={tags}
            />
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
                date={new Date(transaction_at)}
            />

            {!!item && !duplicate && <ListItem
                onPress={() => navigation.navigate("Attachments", {
                    itemId: item.id,
                    itemType: 'transaction',
                    extraQuery: { transaction__id: item.id }
                })}
                containerStyle={style.attachmentsContainer}>
                <Icon name='file' type='feather' color={colors.primary} size={30} />
                <ListItem.Content>
                    <ListItem.Title>Attachments</ListItem.Title>
                    <ListItem.Subtitle>{attachmentsCount ? `${attachmentsCount} attachments` : 'Add attachment'}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>}
            <View style={style.h40} />
            <Button
                title={alertMessage ? alertMessage : ((itemId && !duplicate) ? 'Confirm Changes' : 'Submit')}
                loading={loading}
                onPress={onSubmit}
                labelStyle={style.labelStyle}
            />

        </ScrollView>
        <Snackbar
            visible={!!alertMessage}
            onDismiss={() => setAlertMessage(undefined)}
            action={{
                label: 'OK',
                onPress: navigation.goBack,
            }}>
            {alertMessage}
        </Snackbar>
    </>
    )
}

const style = StyleSheet.create({
    flex1: {
        flex: 1,
    },
    root: {
        padding: 5,
        // paddingBottom: 50,
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
    attachmentsContainer: {
        backgroundColor: colors.primary2,
        marginHorizontal: 6,
        paddingVertical: 10
    },
})