/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useState, useEffect, memo } from 'react';
import {
    View,
    StyleSheet,
    Platform,
} from 'react-native';
import { colors, utils, requests, url, font, height, width } from 'src/helpers';
import _ from 'lodash';
import Input from 'src/components/Input'
import { Button, ScrollView, } from 'src/components';
import { Snackbar, Text} from 'react-native-paper'
import SwitchSelector from "react-native-switch-selector";

export default function TransactionsAdd(props) {
    const { navigation } = props;
    const [category, setCategory] = useState();
    const [amount, setAmount] = useState();
    const [tags, setTags] = useState([]);
    const [description, setDescription] = useState();
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState();
    const [transaction_type, setTransaction_type] = useState('spending');

    const transactionTypes = [{ value: 'spending', label: "Spending" }, { value: 'income', label: 'Income' }]

    async function onSubmit() {
        setLoading(true)
        const data = {
            category:category.id,
            transaction_type,
            amount,
            tags: {
                add: tags.map(tag=>tag.id)
            },
            description,
        }
        try {
            const res = await requests.post(url.spendi.Transaction, data)
            setAlertMessage('Transaction added successfully')
        } catch (error) {
            setAlertMessage(JSON.stringify(error.data.detail))
        }
        setLoading(false);
    }

    return <ScrollView contentContainerStyle={style.root}>
        <Input 
        label='Amount' 
        value={amount} 
        placeholder='Enter Amount' 
        onChangeText={setAmount} 
        keyboardType={'decimal-pad'}
        />
        <SwitchSelector
            options={transactionTypes}
            initial={0}
            onPress={setTransaction_type}
            textColor={colors.purple} //'#7a44cf'
            selectedColor={colors.white}
            buttonColor={colors.primary}
            borderColor={colors.primary6}
            hasPadding
            accessibilityLabel="transaction-type-switch-selector"
        />

        <Input 
        label='Descriptions' 
        placeholder='Add more details (Optional)' 
        value={description} 
        multiline ={true}
        onChangeText={setDescription} 
        />

        <Input
            label='Category'
            placeholder='Choose Category'
            onChangeText={setCategory}
            keyboardType='dropdown'
            url={url.spendi.Category}
        />

        <Input
            label='Tags'
            placeholder='Select Tags'
            onChangeText={setTags}
            keyboardType='dropdown'
            url={url.spendi.Tag}
            many={true}
            value={[]}
        />
        {/* 
                <View style={style.tagsContainer}>
                    {tags.map((tag, index)=>(
                        <Button title = {tag.name} key={index} type={'outline'} onPress={()=>removeTag(tag)}/>
                    ))}
                     <Button title = {"Add Tag"}  type={'outline'} onPress={openAddTag}/>
                </View> */}

        <Button title={'Submit'} loading={loading} onPress={onSubmit} />

        <Snackbar
            visible={!!alertMessage}
            onDismiss={() => {
                setAlertMessage(undefined);
                navigation.goBack();
            }}
            action={{
                label: 'OK',
                onPress: () => {
                    // Do something
                },
            }}>
            {alertMessage}
        </Snackbar>
    </ScrollView>
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
    }
})