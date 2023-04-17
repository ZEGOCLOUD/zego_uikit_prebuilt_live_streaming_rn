import React, { useState }from "react";
import { TouchableOpacity, Image, StyleSheet, Text } from "react-native";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export default function ZegoEnableChatButton(props) {
    const {
        width = 36,
        height = 36,
        borderRadius = 1000,
        iconOn = require('../resources/white_bottom_button_chat_on.png'),
        iconOff = require('../resources/white_bottom_button_chat_off.png'),
    } = props;
    const enableChat = ZegoUIKit.getRoomProperties().enableChat;
    const [isChatOn, setIsChatOn] = useState(enableChat === undefined || enableChat === '1');
    
    const getCustomStyle = (width, height, borderRadius) => StyleSheet.create({
        enableChatButton: {
          width,
          height,
          borderRadius,
        },
      });
    const pressedHandle = () => {
        ZegoUIKit.updateRoomProperties({ enableChat: isChatOn ? '0' : '1' }).then(() => {
            setIsChatOn(!isChatOn);
        })
    };

    return (
        <TouchableOpacity onPress={pressedHandle} style={[styles.enableChatButton, getCustomStyle(width, height, borderRadius).enableChatButton]}>
            <Image source={isChatOn ? iconOn : iconOff} style={{ width: "100%", height: "100%" }} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    enableChatButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});