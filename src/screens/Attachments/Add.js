import React, { useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet, Platform, Alert, Linking, KeyboardAvoidingView, ScrollView } from "react-native"
import { Button, Image, Text, Icon } from "react-native-elements";
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import DocumentPicker, {
    isInProgress,
    types,
} from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob'
import { colors, width, requests, url, utils, DEBUG } from 'src/helpers';
import uploadingGIF from 'src/assets/uploading.gif';
import Input from 'src/components/Input'

export default function AttachmentsAdd(props) {
    const { navigation } = props;
    const [cameraStatus, setCameraStatus] = useState(undefined);
    const [file, setFile] = useState()
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState();
    const [name, setName] = useState('')
    const [nameError, setNameError] = useState()
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFocus, setIsFocus] = useState(false);
    const loggedUser = utils.getUser()

    async function getcategories() {
        const res = await requests.get(url.AttachmentCategory)
        setCategories(res.results)
    }
    const handleFilePickerError = (err: unknown) => {
        if (DocumentPicker.isCancel(err)) {
            DEBUG && console.warn('cancelled')
            // User cancelled the picker, exit any dialogs or menus and move on
        } else if (isInProgress(err)) {
            DEBUG && console.warn('multiple pickers were opened, only the last will be considered')
        } else {
            // throw err
        }
    }

    async function requestCamera(canOpenSettings = false) {
        const permName = Platform.select({
            ios: PERMISSIONS.IOS.CAMERA,
            android: PERMISSIONS.ANDROID.CAMERA
        })
        const res = await request(permName)
        setCameraStatus(res)
        if (res !== RESULTS.GRANTED) {
            if (canOpenSettings) {
                Linking.openSettings()
            }
            else {
                Alert.alert(
                    "Camera Permission",
                    `Camera permission is required to be able to upload documents. Current permissions is ${res.toUpperCase()}`,
                    [{ text: 'Later' }, { text: "Check Permissions", onPress: () => requestCamera(true) }]
                )
            }
        }
    }

    useEffect(() => {
        getcategories();
        requestCamera();
    }, [])

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (file && !loading) ? <TouchableOpacity onPress={() => setFile(null)}>
                <Icon name='close' type='antdesign' style={{ margin: 10 }} color={colors.link} />
            </TouchableOpacity> : null,
        })
    }, [file, loading])

    const uploadFile = useCallback((type = "camera") => {
        if (type === 'camera') {
            launchCamera({
                saveToPhotos: false,
                mediaType: 'photo'
            }, (res) => {
                if (res.errorCode) {
                    Alert.alert("Camera Error", res.errorCode)
                } else if (res.assets) {
                    const f = res.assets[0] || {};
                    setFile({ ...f, name: f.fileName });
                }
            });
        } else {
            DocumentPicker.pick({
                type: [types.doc, types.docx, types.pdf, types.images],
            }).then(res => {
                //   [{"fileCopyUri": null, "name": "Screenshot_2022-03-18-10-03-50-334_app.niwezeshe.jpg", "size": 127614, "type": "image/jpeg", "uri": "content://com.android.providers.media.documents/document/image%3A445"}]
                setFile(res[0]);
            })
                .catch(handleFilePickerError)
        }
    }, []);

    async function onSubmit() {
        if (!name || !selectedCategory) {
            setNameError('The name is required')
            if (!selectedCategory) {
                Alert.alert("Documentary Category Error", "Please select the category of the document first")
            }
            return;
        } else {
            setNameError('')
        }

        try {
            setLoading(true);

            const uri = Platform.select({
                ios: file.uri.replace("file://", ""),
                default: file.uri,
            })
            const resp = await RNFetchBlob.fetch('POST', url.BASE_URL + url.Attachment, {
                "Authorization": `Token ${loggedUser?.token}`,
                // otherHeader : "foo",
                'Content-Type': 'multipart/form-data',
            }, [
                // element with property `filename` will be transformed into `file` in form data
                { name: 'file', filename: file.name, type: file.type, data: RNFetchBlob.wrap(uri) },
                // elements without property `filename` will be sent as plain text
                { name: 'name', data: name },
                { name: 'user', data: loggedUser?.id?.toString() },
                { name: 'attachment_category', data: selectedCategory?.id?.toString() },
            ]).uploadProgress((written, total) => {
                setProgress(written / total)
            })

            const res = JSON.parse(resp.data)
            if (res.id) {
                //hack to make sure all other data are submitted
                await requests.patch(url.Attachment + res.id + "/", { user: loggedUser?.id, attachment_category: selectedCategory?.id })
                Alert.alert("Uploaded", "Your file was uploaded successfuly")
                setLoading(false);
                navigation.goBack()
            } else {
                Alert.alert("Upload Failed", resp.data)
            }
        } catch (error) {
            setLoading(false);
            Alert.alert("File Upload Error", error.message)
        }
    }
    const isCameraOK = cameraStatus === RESULTS.GRANTED;

    return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={style.root}>
        <ScrollView>
            {!isCameraOK &&
                <View style={style.mv100}>
                    <Text>
                        Camera permission is required to be able to upload documents. Current permissions is {cameraStatus?.toUpperCase()}
                    </Text>
                    <Button
                        title={"Check Camera Permissions"}
                        onPress={() => requestCamera()}
                        containerStyle={style.mv100}
                    />
                </View>}
            {isCameraOK &&
                <View>
                    {!file ?
                        <View>
                            <View style={style.uploadInfoContainer}>
                                <Icon name='upload' type='antdesign' size={90} />
                                <Text style={style.uploadInfoText}>
                                    Upload a document which is clearly visible. These documents are private and only visible to people you choose to share with.
                                </Text>
                            </View>
                            <View style={style.cameraActionButtons}>
                                <Button
                                    title={'Camera'}
                                    buttonStyle={style.choosePickerButton}
                                    onPress={() => uploadFile('camera')}
                                    icon={{ name: "camera", type: "entypo", color: colors.black, size: 16 }}
                                    type='outline'
                                    titleStyle={style.font14}
                                />
                                <Button title={"Documents"}
                                    buttonStyle={style.choosePickerButton}
                                    onPress={() => uploadFile('browse')}
                                    icon={{ name: "file", type: "feather", color: colors.black, size: 16 }}
                                    type='outline'
                                    titleStyle={style.font14}
                                />
                            </View>
                        </View> :
                        <View>
                            <Image
                                source={!loading ? file : uploadingGIF}
                                style={style.image}
                                resizeMode={"contain"}
                            />
                            {!loading ? <>
                                <Text style={style.documentTypeTitle}>Document Type</Text>
                                <Input
                                    data={categories}
                                    labelField="name"
                                    valueField="id"
                                    placeholder={'Select Document Type'}
                                    searchPlaceholder="Search..."
                                    value={selectedCategory?.id}
                                    onFocus={() => setIsFocus(true)}
                                    onBlur={() => setIsFocus(false)}
                                    onChangeText={(categoryId, category) => {
                                        setSelectedCategory(category);
                                    }}
                                />
                                <Input
                                    placeholder={'Name or Document ID'}
                                    assistiveText={'Give this document a useful name'}
                                    onChangeText={setName}
                                    value={name}
                                    errorMessage={nameError}
                                />
                                <Button disabled={loading} onPress={onSubmit} title={'Submit'} containerStyle={style.submitButton} />
                            </> : <Text style={{ textAlign: "center" }}>Please wait! Uploading...{utils.formatNumber(progress * 100, 2)}%</Text>}
                        </View>}

                </View>}
        </ScrollView>
    </KeyboardAvoidingView>

}

const style = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 20,
    },
    categories: {
        justifyContent: "space-between",
        flexDirection: "row", flexWrap: 'wrap',
        padding: 2, paddingBottom: 20,
    },
    cameraActionButtons: {
        justifyContent: "space-between",
        flexDirection: "row", flexWrap: 'wrap',
        padding: 2, paddingBottom: 20,
        paddingHorizontal: 30,
    },
    mv100: { marginVertical: 100 },
    image: { width: width - 40, height: width, alignSelf: 'center' },
    submitButton: { margin: 50 },
    catButtonTitle: { fontSize: 14 },
    catButton: { paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
    documentTypeTitle: { fontSize: 16, fontWeight: "bold", paddingVertical: 10 },
    choosePickerButton: { paddingHorizontal: 10, },
    uploadInfoText: { paddingTop: 40, textAlign: 'center', lineHeight: 26 },
    uploadInfoContainer: { paddingVertical: 80 },
    font14: { fontSize: 14 },
})