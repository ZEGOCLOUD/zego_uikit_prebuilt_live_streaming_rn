import React, { useState, useEffect } from "react";
import { TouchableOpacity, Image} from "react-native"
import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export default function ZegoMessageButton(props: any) {
    const {
        userID,
        hostID,
        onPress,
        width = 36,
        height = 36,
        icon = require('../resources/white_bottom_button_chat_on.png'),
    } = props;
    const [isChatOn, setIsChatOn] = useState(true);

    useEffect(() => {
        const callbackID = 'ZegoMessageButton' + String(Math.floor(Math.random() * 10000));
        ZegoUIKit.onRoomPropertyUpdated(callbackID, (key: string, oldValue: any, value: any) => {
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
                source={isChatOn ? icon : require('../resources/white_bottom_button_chat_off.png')}
                onLoad={({nativeEvent: {source: {width, height}}}) => console.log('>>>>>', width, height)}
                style={{ width: "100%", height: "100%" }} />
        </TouchableOpacity>)
}
