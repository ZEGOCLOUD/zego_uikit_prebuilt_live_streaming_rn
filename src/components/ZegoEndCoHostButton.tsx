import React from "react";
import { StyleSheet, Image, Text, TouchableOpacity } from "react-native"
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { ZegoTranslationText } from "../services/defines";

export default function ZegoEndCoHostButton(props: any) {
    const {
        onEndSuccessfully,
        setIsDialogVisable,
        setDialogExtendedData,
    } = props;

    const pressedHandle = () => {
        setIsDialogVisable(true);
        setDialogExtendedData({
            title: ZegoTranslationText.endConnectionDialogInfo.title,
            content: ZegoTranslationText.endConnectionDialogInfo.message,
            cancelText: ZegoTranslationText.endConnectionDialogInfo.cancelButtonName,
            okText: ZegoTranslationText.endConnectionDialogInfo.confirmButtonName,
            onCancel: () => {
                setIsDialogVisable(false);
            },
            onOk: () => {
                ZegoUIKit.turnCameraOn('', false)
                ZegoUIKit.turnMicrophoneOn('', false)
                onEndSuccessfully();
                setIsDialogVisable(false);
            }
        });
    }

    return (
        <TouchableOpacity style={styles.btnContainer} onPress={pressedHandle}>
            <Image style={styles.image} resizeMode="contain" source={require('../resources/icon_request_cohost.png')} />
            <Text style={styles.text}>{ZegoTranslationText.endCoHostButton}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    btnContainer: {
        width: 84,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 13, 35, 0.6)',
        borderRadius: 1000,
    },
    image: {
        marginRight: 6,
    },
    text: {
        color: '#fff'
    },
});
