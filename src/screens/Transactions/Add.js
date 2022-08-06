/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect, memo, useContext } from 'react';
import {
    View,
    StyleSheet, TouchableOpacity, Keyboard,
} from 'react-native';
import { colors, utils, requests, url } from 'src/helpers';
import _ from 'lodash';
import Input from 'src/components/Input'
import { Button, ScrollView, } from 'src/components';
import { Snackbar, TextInput, Modal, Portal, Text, List } from 'react-native-paper'
import SwitchSelector from "react-native-switch-selector";
import { Icon, ListItem } from '@rneui/themed';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LocalizationContext } from 'src/helpers';
// import Modal from 'src/components/Modal';
import nlpProviders from 'src/helpers/nlpbomba/providers';
import nlpUtils from 'src/helpers/nlpbomba/utils';
import { saveTransaction } from 'src/helpers/headlessNotificationListener';
import Clipboard from '@react-native-clipboard/clipboard';

export default function TransactionsAdd(props) {
    const { navigation, route, route: { params } } = props;
    const { i18n, loggedUser } = useContext(LocalizationContext)
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
    const [isGuessing, setIsGuessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState();
    const [transaction_type, setTransaction_type] = useState('spending');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [nlpData, setNlpData] = useState();
    const [isNlpLoading, setIsNlpLoading] = useState(false);
    const [isMessageExpanded, setIsMessageExpanded] = useState(false);


    const searchTriggerSuffix = '.  ';

    const transactionTypes = [
        { value: 'spending', label: i18n.t("Spending") },
        { value: 'income', label: i18n.t('Income') },
        { value: 'saving', label: i18n.t("Saving") },
    ]

    useEffect(() => {
        setItemId(params?.itemId);
        const unsubscribe = navigation.addListener('focus', () => {
            itemId && fetchItem()
        });
        return unsubscribe;
    }, [params?.itemId]);

    useEffect(() => {
        if (params?.barcode) {
            // Append search trigger to automatically fetch similarities
            setDescription(params?.barcode + searchTriggerSuffix);
        }
    }, [params?.barcode]);



    useEffect(() => {
        if (item) {
            setAmount(item.amount);
            setDescription(item.description);
            setCategory(item.category);
            setTransaction_type(item.transaction_type);
            setTags(item.tags);
            setTransaction_at(duplicate ? new Date() : item.transaction_at)
        }
    }, [item])

    useEffect(() => {
        navigation.setOptions({
            title: transaction_at ? utils.formatDate(transaction_at, 'l HH:mm') : (params?.barcode || i18n.t('Add Transaction')),
            headerRight: () => (transaction_at && !duplicate) ? (<View style={style.horizontal}>
                <TouchableOpacity
                    style={style.editIcon}
                    onPress={showDatePicker}
                >
                    <Icon name='edit' type='feather' />
                </TouchableOpacity>

                <TouchableOpacity onPress={shareItem}>
                    <View style={style.shareButtonContainer}>
                        <Icon name="share" type="entypo" />
                    </View>
                </TouchableOpacity>

            </View>) : <TouchableOpacity
                style={style.editIcon}
                onPress={() => navigation.navigate('Camera', {
                    scanBarcode: true,
                    nextScene: route.name,
                    autoAddTransaction: true,
                })}
            >
                <Icon name={'qrcode'} type='antdesign' />
            </TouchableOpacity>
        })
    }, [transaction_at, duplicate, params?.barcode])

    useEffect(() => {
        /*
        * automattically search and autocomplete 
        * if user clicks space 3 times on description
        */
        if (description && description.endsWith(searchTriggerSuffix)) {
            Keyboard.dismiss();
            guessAttrs(['amount', 'category', 'tags'])
            // remove the unnecessary searchTriggerSuffix since don't need it anymore
            setDescription(description.replace(searchTriggerSuffix, ''))
        }
    }, [description])

    async function fetchItem() {
        const res = await requests.get(
            url.getURL('spendi.Transaction', { type: 'detail', item: { id: itemId } })
        )
        setItem(res);
    }

    function guessNlp(text) {
        const results = nlpUtils.getIntents(nlpProviders, text);
        const selectedIntent = results.intents[0];
        if (selectedIntent.confidence > 0.7) {
            setNlpData(selectedIntent);
            return true
        } else {
            setAlertMessage(i18n.t('Sorry nothing matches this transaction description'));
        }
        return false
    }

    async function guessAttrs(dataTypes = []) {
        setIsGuessing(true);
        try {
            const text = description.replace(searchTriggerSuffix, '');
            if (!guessNlp(text)) {
                const link = url.spendi.Transaction + `guess_attrs/?description=${text}&similarity_lim=0.4`
                const res = await requests.get(link);
                if (res.category && dataTypes.includes('category')) {
                    setCategory(res.category);
                }
                if (res.tags?.length > 0 && dataTypes.includes('tags')) {
                    setTags(res.tags)
                }
                if (res.amount && dataTypes.includes('amount')) {
                    setAmount(res.amount.amount);
                    // also update description
                    res.amount.description && setDescription(res.amount.description);
                }
                if (res.category || res.amount || res.tags?.length > 0) {
                    setAlertMessage(i18n.t('Transaction guessed and updated successfully'));
                }
            }
        } catch (error) {
            setAlertMessage(JSON.stringify(error.data?.detail || error.data || error.message))
        }
        setIsGuessing(false);
        setTimeout(() => {
            setAlertMessage('');
        }, 5e5)
    }
    async function onSubmit() {
        if (amount) {
            setLoading(true);
            setAmountError(null);
            const data = {
                category: category?.id,
                transaction_type,
                transaction_at,
                barcode: params?.barcode,
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
                setAlertMessage((itemId && !duplicate) ? i18n.t('Updated successfully') : i18n.t('Created successfully'))
                setItem(res);
                setDuplicate(false);
                setItemId(res.id);
            } catch (error) {
                setAlertMessage(JSON.stringify(error.data.detail))
            }
            setLoading(false);
        } else {
            setAmountError(i18n.t("This is required"))
        }
    }
    function shareItem() {
        navigation.navigate('Groups', {
            itemURL: url.getURL('spendi.Transaction', { type: 'detail', item }),
            itemType: 'spendi.Transaction',
            title: description,
        });
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

    async function addNlpTransaction() {
        setIsNlpLoading(true);
        const res = await saveTransaction({
            selectedIntent: nlpData,
            description: nlpData.accountName,
            text: description,
            user: loggedUser?.id,
            source: 'NLP',
            category: category?.name || 'Mobile Wallet',
            notification: {
                title: nlpData.accountName,
                text: description,
            }
        })
        setNlpData(undefined);
        res.data && setItem(res.data[0]);
        setIsNlpLoading(false);
    }

    const attachmentsCount = item?.attachments_count || 0;
    const nlpAmountKeys = ['amount', 'transactionFee', 'latestBalance'];

    const copyText = async (text) => {
        Clipboard.setString(text)
        setAlertMessage(i18n.t('Copied successfully'))
    }

    const duplicateTransaction = () => {
        setDuplicate(true);
    }


    return (<>
        <ScrollView contentContainerStyle={style.root}>
            <Input
                label={i18n.t('Descriptions')}
                placeholder={i18n.t('Add more details')}
                value={description}
                multiline={true}
                onChangeText={setDescription}
                right={<TextInput.Icon name={({ size, color }) => (
                    !isGuessing && <TouchableOpacity onPress={() => guessAttrs(['tags', 'category', 'amount'])}>
                        <Icon name='auto-fix-high' type='materialicon' color={color} size={size} />
                    </TouchableOpacity>
                )} />}
            />
            <Input
                label={i18n.t('Amount')}
                placeholder={i18n.t('Enter Amount')}
                value={amount ? utils.formatNumber(utils.extractDigits(amount)) : amount}
                onChangeText={(v) => setAmount(utils.extractDigits(v))}
                keyboardType={'decimal-pad'}
                errorMessage={amountError}
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
                label={i18n.t('Category')}
                placeholder={i18n.t('Choose Category')}
                onChangeText={setCategory}
                keyboardType='dropdown'
                url={url.spendi.Category + '?query={id,name,user{id}}'}
                value={category}
                right={<TextInput.Icon name={({ size, color }) => (
                    !isGuessing && <TouchableOpacity onPress={() => guessAttrs(['category'])}>
                        <Icon name='auto-awesome' type='materialicon' color={color} size={size} />
                    </TouchableOpacity>
                )} />}
            />

            <Input
                label={i18n.t('Tags')}
                placeholder={i18n.t('Select Tags')}
                onChangeText={setTags}
                keyboardType='dropdown'
                url={url.spendi.Tag + '?query={id,name,user{id}}'}
                many={true}
                multiline={true}
                value={tags}
                right={<TextInput.Icon name={({ size, color }) => (
                    !isGuessing && <TouchableOpacity onPress={() => guessAttrs(['tags'])}>
                        <Icon name='auto-awesome' type='materialicon' color={color} size={size} />
                    </TouchableOpacity>
                )} />}
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
                    <ListItem.Title>{i18n.t('Attachments')}</ListItem.Title>
                    <ListItem.Subtitle>{
                        attachmentsCount ? i18n.t('{attachmentsCount} attachments', { attachmentsCount }) : i18n.t('Add attachment')
                    }</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>}
            {!!item?.data?.notification?.text &&
                <List.Accordion
                    expanded={isMessageExpanded}
                    title={i18n.t('Transaction Message')}
                    titleStyle={{ fontSize: 18, color: colors.black }}
                    description={item?.data?.notification?.text}
                    descriptionNumberOfLines={isMessageExpanded ? 7 : 1}
                    onLongPress={() => copyText(item?.data?.notification?.text)}
                    onPress={() => setIsMessageExpanded(!isMessageExpanded)}
                />}
            <View style={style.h40} />
            <Button
                title={loading ? i18n.t('Please Wait') : ((itemId && !duplicate) ? i18n.t('Confirm Changes') : i18n.t('Save Transaction'))}
                loading={loading}
                onPress={onSubmit}
                textColor={colors.white}
                disabled={loading}
                icon={(itemId && !duplicate) ? 'update' : 'plus'}
            />
        </ScrollView>
        <Portal>
            <Modal
                visible={!!nlpData}
                title={i18n.t('Auto added transaction')}
                contentContainerStyle={style.nlpModal}
                // modalHeight={height - 40}
                onDismiss={() => setNlpData(undefined)}
            >
                {nlpData && Object.keys(nlpData).filter(key => !['confidence', 'transactionTime', 'isAmountIn'].includes(key)).map((key, index) => {
                    const value = nlpData[key];
                    const isAmountKey = nlpAmountKeys.includes(key);
                    return (
                        <Input
                            key={index}
                            label={i18n.t(key)}
                            onChangeText={(v) => setNlpData({ ...nlpData, [key]: isAmountKey ? utils.extractDigits(v) : v })}
                            value={(isAmountKey && value) ? utils.formatNumber(utils.extractDigits(value)) : value}
                            keyboardType={isAmountKey ? 'decimal-pad' : 'default'}

                        />
                    )
                }
                )}

                <Button
                    title={i18n.t('Add Transaction')}
                    style={style.noItemaddTransactionButton}
                    onPress={addNlpTransaction}
                    textColor={colors.white}
                    icon={'note-plus-outline'}
                    disabled={isNlpLoading}
                    loading={isNlpLoading}
                />
            </Modal>
        </Portal>
        <Snackbar
            duration={Snackbar.DURATION_LONG}
            visible={!!alertMessage}
            onDismiss={() => setAlertMessage(undefined)}
            action={{
                label: i18n.t('Add New'),
                onPress: duplicateTransaction
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
    shareButtonContainer: {
        alignSelf: 'center',
        marginRight: 10,
    },
    noItemaddTransactionButton: { marginTop: 40 },
    nlpModal: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        backgroundColor: 'white',
        flex: 1,
        borderTopRightRadius: 40,
        borderTopLeftRadius: 40,
    },
})