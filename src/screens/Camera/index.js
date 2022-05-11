import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';
import { Overlay } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { Button } from 'src/components';
import { height, width } from 'src/helpers';
import { selectedFileState } from 'src/atoms';
import { useRecoilState } from 'recoil';

export default function Camera(props) {
    const { navigation } = props;
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useRecoilState(selectedFileState);
    const [image, setImage] = useState()

    useEffect(() => {
        if (image) {
            setIsOverlayVisible(true)
        }
    }, [image])

    function confirmImage() {
        setSelectedFile(image);
        navigation.goBack();
    }

    const aspectRatio = (width / height) * 0.8

    return (
        <>
            <CameraScreen
                actions={{ rightButtonText: 'Done', leftButtonText: 'Cancel' }}
                onBottomButtonPressed={(event) => {
                    // console.log("button pressed", event)
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
            // scanBarcode={true}
            // onReadCode={(event) => console.log('QR code found', event)} // optional
            // showFrame={true} // (default false) optional, show frame with transparent layer (qr code or barcode will be read on this area ONLY), start animation for scanner,that stoped when find any code. Frame always at center of the screen
            // laserColor='red' // (default red) optional, color of laser in scanner frame
            // frameColor='white' // (default white) optional, color of border of scanner frame
            />
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button title="Retake" type='clear' />
                    <Button title="Confirm" type='solid' onPress={confirmImage} />
                </View>
            </Overlay>
        </>
    )
}