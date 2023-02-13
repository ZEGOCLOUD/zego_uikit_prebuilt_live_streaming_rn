import React, { useState, useEffect } from "react";
import { TouchableOpacity, Image, StyleSheet} from "react-native"
import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export default function ZegoMessageButton(props) {
    const {
        userID,
        hostID,
        onPress,
        width = 36,
        height = 36,
        icon = require('../resources/white_bottom_button_message.png'),
    } = props;
    const [isChatOn, setIsChatOn] = useState(true);

    useEffect(() => {
        const callbackID = 'ZegoMessageButton' + String(Math.floor(Math.random() * 10000));
        ZegoUIKit.onRoomPropertyUpdated(callbackID, (key, oldValue, value, type) => {
            if (key === 'enableChat' && value && userID !== hostID) {
                setIsChatOn(!!parseInt(value));
            }
        });
        return () => {
            ZegoUIKit.onRoomPropertyUpdated(callbackID);
        }
    }, []);

    return (
        <TouchableOpacity style={{ width: width, height: height, opacity: isChatOn ? 1 : 0.7 }}
            onPress={onPress}
            disabled={!isChatOn}>
            <Image
                resizeMode='contain'
                source={icon}
                onLoad={({nativeEvent: {source: {width, height}}}) => console.log('>>>>>', width, height)}
                style={{ width: "100%", height: "100%" }} />
        </TouchableOpacity>)
}
