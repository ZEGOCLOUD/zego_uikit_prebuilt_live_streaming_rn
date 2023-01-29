import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native"
import ZegoRequestCoHostButton from './ZegoRequestCoHostButton';
import ZegoCancelRequestCoHostButton from './ZegoCancelRequestCoHostButton';
import ZegoEndCoHostButton from './ZegoEndCoHostButton';
import { ZegoCoHostConnectState, ZegoToastType, ZegoTranslationText } from '../services/defines'
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { zloginfo } from "../utils/logger";
import { grantPermissions } from '../utils';

export default function ZegoCoHostControlButton(props) {
    const {
        hostID,
        liveStatus,
        isPluginsInit,
        memberConnectState = ZegoCoHostConnectState.idle,
        onConnectStateChanged,
        setIsToastVisable,
        setToastExtendedData,
        setIsDialogVisable,
        setDialogExtendedData,
    } = props;
    const ZegoCoHostControlButtonType = {
        request: 0,
        cancel: 1,
        end: 2,
    };

    const coHostControlHandle = (btnType) => {
        let newConnectState = memberConnectState;
        if (btnType === ZegoCoHostControlButtonType.request) {
            newConnectState = ZegoCoHostConnectState.connecting;
        } else if (btnType === ZegoCoHostControlButtonType.cancel) {
            newConnectState = ZegoCoHostConnectState.idle;
        } else if (btnType === ZegoCoHostControlButtonType.end) {
            newConnectState = ZegoCoHostConnectState.idle;
        }
        onConnectStateChanged('', newConnectState);
    };

    useEffect(() => {
        const callbackID = 'ZegoCoHostControlButton' + String(Math.floor(Math.random() * 10000));
        if (isPluginsInit) {
            // Plugins init success and register plugins callback
            zloginfo('[ZegoCoHostControlButton]Plugins init success and register plugins callback');
            ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, ({ callID, invitees, data }) => {
                // The host did not process your cohost request, resulting in a timeout
                console.log('#######onInvitationResponseTimeout, The host did not process your cohost request, resulting in a timeout');
                onConnectStateChanged('', ZegoCoHostConnectState.idle);
            });
            ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, async ({ callID, invitee, data }) => {
                // The host accepted your cohost request
                console.log('#######onInvitationAccepted, The host accepted your cohost request');
                try {
                    await grantPermissions();
                } catch (error) {
                }
                ZegoUIKit.turnCameraOn('', true);
                ZegoUIKit.turnMicrophoneOn('', true);
                onConnectStateChanged('', ZegoCoHostConnectState.connected);
            });
            ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
                // The host rejected your cohost request
                console.log('#######onInvitationRefused, The host rejected your cohost request');
                onConnectStateChanged('', ZegoCoHostConnectState.idle);
                setIsToastVisable(true);
                setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.hostRejectCoHostRequestToast });
            });
        }
        return () => {
            if (isPluginsInit) {
                ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID);
                ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
                ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
            }
        };
    }, [isPluginsInit]);

    return (
        <View style={styles.btnContainer}>
            {
                memberConnectState === ZegoCoHostConnectState.idle ? <ZegoRequestCoHostButton
                    hostID={hostID}
                    liveStatus={liveStatus}
                    onRequestSuccessfully={coHostControlHandle.bind(this, ZegoCoHostControlButtonType.request)}
                    setIsToastVisable={setIsToastVisable}
                    setToastExtendedData={setToastExtendedData}
                    
                /> :
                memberConnectState === ZegoCoHostConnectState.connecting ? <ZegoCancelRequestCoHostButton
                    hostID={hostID}
                    onCancelSuccessfully={coHostControlHandle.bind(this, ZegoCoHostControlButtonType.cancel)}
                    setIsToastVisable={setIsToastVisable}
                    setToastExtendedData={setToastExtendedData}
                /> :
                memberConnectState === ZegoCoHostConnectState.connected ? <ZegoEndCoHostButton
                    onEndSuccessfully={coHostControlHandle.bind(this, ZegoCoHostControlButtonType.end)}
                    setIsDialogVisable={setIsDialogVisable}
                    setDialogExtendedData={setDialogExtendedData}
                /> :
                null
            }
        </View>
    )
}

const styles = StyleSheet.create({
    btnContainer: {},
});
