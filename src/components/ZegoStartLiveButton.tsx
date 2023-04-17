import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native"
import { ZegoTranslationText } from "../services/defines";

export default function ZegoStartLiveButton(props) {
    const { onPressed } = props;

    return (
        <TouchableOpacity onPress={onPressed} style={styles.btnContainer}>
            <Text style={styles.btnText}>{ZegoTranslationText.startLiveStreamingButton}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    btnContainer: {
        width: 150,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(167, 84, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        fontSize: 16,
        lineHeight: 22.5,
        color: '#fff',
    },
});
