import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native"
import ZegoUIKit, { ZegoMicrophoneStateIcon, ZegoCameraStateIcon, ZegoToggleCameraButton, ZegoToggleMicrophoneButton } from '@zegocloud/zego-uikit-rn'
import { ZegoLiveStreamingRole } from "../services/defines";

export default function ZegoAudioVideoForegroundView(props) {
    const { userInfo, showUserNameOnView, showCameraStateOnView, showMicrophoneStateOnView, turnOnMicrophoneWhenJoining, turnOnCameraWhenJoining, role, localUserID } = props;
    const { userID = '', userName = '', isMicDeviceOn } = userInfo;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
            console.log(`Toggle the state of other people's devices`);
        }
    })).current;

    return (
        <View style={styles.foregroundViewContainer}>
            {
                role === ZegoLiveStreamingRole.host && userID !== localUserID ? <View style={styles.topContainer} {...panResponder.panHandlers}>
                    <ZegoToggleMicrophoneButton userID={userID} isOn={turnOnMicrophoneWhenJoining} width={24} height={24}></ZegoToggleMicrophoneButton>
                    <ZegoToggleCameraButton userID={userID} isOn={turnOnCameraWhenJoining} width={24} height={24}></ZegoToggleCameraButton>
                </View> : null
            }
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
    topContainer: {
        paddingTop: 3,
        paddingRight: 3,
        paddingLeft: 3,
        paddingBottom: 3,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bottomContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor: '#2A2A2A',
        opacity: 0.5,
        position: 'absolute',
        alignSelf: 'center',
        paddingLeft: 3,
        paddingRight: 3,
        paddingBottom: 1,
        paddingTop: 1,
        borderRadius: 4,
        bottom: 3,
        right: 3
    },
    nameLabelContainer: {
        alignSelf: 'center',
    },
    nameLabel: {
        color: '#FFFFFF',
        fontSize: 10,
    },
    deviceIcon: {
        flex: 1,
        position: 'absolute',
    }
});
