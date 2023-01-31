import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native"
import ZegoUIKit, { ZegoMicrophoneStateIcon, ZegoCameraStateIcon } from '@zegocloud/zego-uikit-rn'

export default function ZegoAudioVideoForegroundView(props) {
    const { userInfo, showUserNameOnView, showCameraStateOnView, showMicrophoneStateOnView } = props;
    const { userID = '', userName = '', isMicDeviceOn } = userInfo;

    return (
        <View style={styles.foregroundViewContainer}>
            <View style={styles.bottomContainer}>
                {showUserNameOnView ?
                    <View style={styles.nameLabelContainer}>
                        <Text style={styles.nameLabel}>{userName}</Text>
                    </View> :
                    <View />
                }
                {/* {showCameraStateOnView ? <ZegoCameraStateIcon userID={userID} style={styles.deviceIcon} /> : <View />} */}
                {showMicrophoneStateOnView && !isMicDeviceOn ? <ZegoMicrophoneStateIcon userID={userID} style={styles.deviceIcon} /> : <View />}
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    foregroundViewContainer: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 10,
    },
    bottomContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor: '#2A2A2A',
        opacity: 0.5,
        position: 'absolute',
        alignSelf: 'center',
        paddingLeft: 5,
        paddingRight: 5,
        paddingBottom: 3,
        paddingTop: 3,
        borderRadius: 6,
        bottom: 5,
        right: 5
    },
    nameLabelContainer: {
        alignSelf: 'center',
    },
    nameLabel: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    deviceIcon: {
        flex: 1,
        position: 'absolute'
    }
});
