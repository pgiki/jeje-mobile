import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';
import { Overlay, ListItem, Icon } from '@rneui/themed';
import { Snackbar, Text } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from 'react-native-fast-image';
import { Button } from 'src/components';
import { height, width, requests, url, LocalizationContext, colors, utils } from 'src/helpers';
import { selectedFileState } from 'src/atoms';
import { useRecoilState } from 'recoil';
import Modal from 'src/components/Modal';
import { ScrollView } from 'src/components';
import _ from 'lodash';
const aspectRatio = (width / height) * 0.8;

export default function Camera(props) {
    const { navigation, route: { params } } = props;
    const { i18n, loggedUser } = useContext(LocalizationContext)
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useRecoilState(selectedFileState);
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const [traReceipt, setTraReceipt] = useState();
    const [image, setImage] = useState();
    const [scanBarcode, setScanBarcode] = useState(params?.scanBarcode === undefined ? true : params?.scanBarcode);

    useEffect(() => {
        if (image) {
            setIsOverlayVisible(true)
        }
    }, [image])

    useEffect(() => {
        if (params?.scanBarcode !== undefined) {
            setScanBarcode(params.scanBarcode)
        }
    }, [params?.scanBarcode])

    useEffect(() => {
        // automatically added scanned barcode to transaction page
        if (barcode) {
            if (params?.autoAddTransaction) {
                addTransaction()
            }
        }
    }, [barcode])


    function confirmImage() {
        setSelectedFile(image);
        navigation.goBack();
    }

    function closeModal() {
        setIsModalVisible(false);
        setTraReceipt(undefined);
        setBarcode('');
        loading && setLoading(false);
    }

    async function saveTraReceipt() {
        try {
            setLoading(true);
            const res = await requests.post(url.spendi.Transaction + 'bulk_create/', traReceipt)
            setLoading(false);
            if (res.success) {
                closeModal();
                Alert.alert(i18n.t('Receipt Saved'), i18n.t('The receipt was saved successfully'),
                    [{ text: i18n.t('Dismiss') }, { text: i18n.t('View Transactions'), onPress: goToDashboard }]
                )
            } else {
                Alert.alert(i18n.t("Error Sending Request"), JSON.stringify(res))
            }
        } catch (e) {
            setLoading(false);
            Alert.alert(i18n.t("Error Sending Request"), JSON.stringify(e.data))
        }
    }

    const goToDashboard = () => navigation.navigate('Dashboard')

    async function onSubmit() {
        try {
            if (traReceipt) {
                return await saveTraReceipt()
            } else if (!barcode.includes('tra')) {
                return Alert.alert(
                    i18n.t("Error Parsing Receipt"),
                    i18n.t("Sorry this qr code scanner can only process TRA receipts at the moment"),
                )
            } else {
                setLoading(true);
                const res = await requests.get(url.spendi.Transaction + 'tra_receipt/?url=' + barcode);
                if (res.data) {
                    setTraReceipt(res.data)
                } else {
                    Alert.alert(i18n.t("Error Parsing Receipt"), JSON.stringify(res),
                        [{ text: i18n.t('Dismiss'), onPress: goToDashboard }]
                    )
                }
            }

        } catch (e) {
            Alert.alert(i18n.t("Error Sending Request"), JSON.stringify(e.data))
        }
        setLoading(false);
    }
    const copyClipboard = async (text) => {
        Clipboard.setString(text);
        setAlertMessage(i18n.t('Copied to clipboard'));
        if (params?.nextScene) {
            navigation.navigate(params?.nextScene, {
                ...params.nextParams || {},
                barcode: text,
            })
        }
    }
    const addTransaction = () => {
        navigation.navigate('Home', {
            screen: 'Transactions/Add',
            params: { barcode }
        })
    }
    const actionName = !traReceipt ? i18n.t('Process Receipt') : i18n.t('Save Receipt for {currency}{amount}', { currency: loggedUser.currency || 'XYZ', amount: utils.formatNumber(_.sumBy(traReceipt, 'amount')) });
    return (
        <>
            {(!isOverlayVisible && !isModalVisible) ? <CameraScreen
                actions={{ rightButtonText: i18n.t('Done'), leftButtonText: i18n.t('Cancel') }}
                onBottomButtonPressed={(event) => {
                    if (event.type === 'left') {
                        navigation.goBack();
                    }
                    else if (event.image) {
                        setImage(event.image)
                    }
                }}
                flashImages={{
                    // optional, images for flash state
                    on: require('src/assets/camera/flashOn.png'),
                    off: require('src/assets/camera/flashOff.png'),
                    auto: require('src/assets/camera/flashAuto.png'),
                }}
                cameraFlipImage={require('src/assets/camera/cameraFlipIcon.png')} // optional, image for flipping camera button
                captureButtonImage={require('src/assets/camera/cameraButton.png')} // optional, image capture button
                torchOnImage={require('src/assets/camera/torchOn.png')} // optional, image for toggling on flash light
                torchOffImage={require('src/assets/camera/torchOff.png')} // optional, image for toggling off flash light
                hideControls={false} // (default false) optional, hides camera controls
                showCapturedImageCount={true} // (default false) optional, show count for photos taken during that capture session
                // barcode
                scanBarcode={scanBarcode}
                onReadCode={({ nativeEvent } = {}) => {
                    const { codeStringValue } = nativeEvent;
                    setBarcode(codeStringValue);
                    setIsModalVisible(true);
                }}
                showFrame={scanBarcode} // (default false) optional, show frame with transparent layer (qr code or barcode will be read on this area ONLY), start animation for scanner,that stoped when find any code. Frame always at center of the screen
                laserColor={colors.primary} // (default red) optional, color of laser in scanner frame
                frameColor={colors.primary} // (default white) optional, color of border of scanner frame
            // surfaceColor={colors.primary}
            /> : <View style={style.root} />}
            <Overlay
                fullScreen
                isVisible={isOverlayVisible}>
                {!!image && <FastImage
                    source={image}
                    style={{
                        width: image.width * aspectRatio,
                        height: image.height * aspectRatio,
                        alignItems: "center",
                        alignSelf: 'center'
                    }}
                    resizeMode={'contain'}
                />}
                <View style={style.imageOptions}>
                    <Button title={i18n.t("Retake")} type='clear' />
                    <Button title={i18n.t("Confirm")} type='solid' onPress={confirmImage} />
                </View>
            </Overlay>
            <Modal
                visible={isModalVisible}
                title={i18n.t("QR Scan")}
                // subtitle={barcode}
                openType={'top'}
                modalHeight={0.5 * height}
                extraProps={{ onClosed: closeModal }}
            >
                <Text style={style.barcodeText}>{barcode}</Text>
                <ScrollView horizontal={true}>
                    {!!traReceipt && traReceipt.map((receipt, i) => <ListItem
                        key={i}
                        containerStyle={{ width }}
                    >
                        <ListItem.Content>
                            <ListItem.Title>#{i + 1}. {receipt.description}</ListItem.Title>
                            <ListItem.Subtitle>{receipt.tags.create.map(t => t.name).join(', ')}</ListItem.Subtitle>
                        </ListItem.Content>
                        <Text style={style.receiptAmount}>{receipt.amount_currency} {utils.formatNumber(receipt.amount)}</Text>
                    </ListItem>)}
                </ScrollView>
                {(!traReceipt && !loading) && <View style={style.copyAdd}>
                    <Button
                        disabled={loading}
                        loading={loading}
                        type='contained-tonal'
                        icon='content-copy'
                        onPress={() => copyClipboard(barcode)}
                        title={i18n.t('Copy Text')}
                    />
                    <Button
                        type='outline'
                        disabled={loading}
                        loading={loading}
                        onPress={addTransaction}
                        title={i18n.t('Add Transaction')}
                        icon='plus'
                    />
                </View>}
                <Button
                    disabled={loading}
                    loading={loading}
                    style={style.submitButton}
                    onPress={onSubmit}
                    icon={!traReceipt ? 'paper-roll-outline' : 'plus'}
                    title={(loading ? i18n.t('wait_loading') : actionName)}
                    textColor={colors.white}
                />
                <Snackbar
                    visible={!!alertMessage}
                    onDismiss={() => setAlertMessage(undefined)}
                    action={{
                        label: i18n.t('OK'),
                        // onPress: navigation.goBack,
                    }}
                >
                    {alertMessage}
                </Snackbar>
            </Modal>
        </>
    )
}

const style = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    imageOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    white: { color: colors.white },
    submitButton: {
        marginTop: 50,
        marginHorizontal: 10,
        alignItems: 'center',
        // backgroundColor: 'red'
    },
    receiptAmount: { fontWeight: 'bold' },
    barcodeText: {
        margin: 10,
    },
    copyAdd: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 50,
        marginHorizontal: 10
    }
})