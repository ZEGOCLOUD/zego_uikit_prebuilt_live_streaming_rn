import React, { useEffect, useRef }from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ZegoUIKit, {ZegoSendInvitationButton, ZegoUIKitReport } from '@zegocloud/zego-uikit-rn';

import { ZegoInvitationType, ZegoToastType, ZegoTranslationText } from "../services/defines";
import { zloginfo } from "../utils/logger";


export default function ZegoCoHostMenuDialog(props: any) {
    const countdownMap = useRef();
    const countdownTimerMap = useRef();
    const {
        visable,
        inviteeID,
        invitationType = ZegoInvitationType.inviteToCoHost,
        onCancel,
        onOk,
        setIsToastVisable,
        setToastExtendedData,
        resetTimer,
    } = props;

    if (visable) {
        const inviteeCountdown = (countdownMap.current as any).get(inviteeID);
        if (!inviteeCountdown) {
            (countdownMap.current as any).set(inviteeID, 60);
        }
    }
    if (resetTimer) {
        // Reset invitation timer
        clearInterval((countdownTimerMap.current as any).get(inviteeID));
        (countdownMap.current as any).set(inviteeID, 60);
        (countdownTimerMap.current as any).set(inviteeID, null);
    }

    const getCustomContainerStyle = (visable: boolean) => StyleSheet.create({
        customContainer: {
            display: visable ? 'flex' : 'none',
        },
    });
    // Verify whether invitations can be sent
    const willPressedHandle = () => {
        let result = true;
        if (invitationType === ZegoInvitationType.inviteToCoHost) {
            // Check whether the timer is running out
            zloginfo('#########Timer: Check whether the timer is running out', countdownMap.current, countdownTimerMap.current);

            if ((countdownTimerMap.current as any).get(inviteeID)) {
                // The timer did not complete and the request was not allowed to occur
                zloginfo('#########Timer: The timer did not complete and the request was not allowed to occur', countdownMap.current, countdownTimerMap.current);
                setIsToastVisable(true);
                setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.repeatInviteCoHostFailedToast });
                onCancel();
                result = false;
            } else {
                // Restart timer
                clearInterval((countdownTimerMap.current as any).get(inviteeID));
                (countdownTimerMap.current as any).set(inviteeID ,setInterval(() => {
                    zloginfo('#########Timer: countdown', countdownMap.current, countdownTimerMap.current);
                    if ((countdownMap.current as any).get(inviteeID) === 0) {
                        clearInterval((countdownTimerMap.current as any).get(inviteeID));
                        (countdownTimerMap.current as any).set(inviteeID, null);
                        (countdownMap.current as any).set(inviteeID, 60);
                    } else {
                        (countdownMap.current as any).set(inviteeID, (countdownMap.current as any).get(inviteeID) - 1);
                    }
                }, 1000));
                if (!ZegoUIKit.getUser(inviteeID)) {
                    result = false;
                    setIsToastVisable(true);
                    setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.inviteCoHostFailedToast });
                    onCancel();
                }
            }
        }
        return result;
    }
    const removeHandle = () => {
        ZegoUIKit.removeUserFromRoom([inviteeID]).then(() => {
            zloginfo(`remove ${inviteeID} from room successfully`);
            // The handling here is the same as the cancel
            onCancel();
        });
    }

    useEffect(() => {
        // First render initializes and clears timer
        zloginfo('#########Timer: First render initializes and clears timer', countdownMap.current, countdownTimerMap.current);
        (countdownMap.current as any) = new Map();
        (countdownTimerMap.current as any) = new Map();
        return () => {
            // Initializes and clears timer when component is destroyed
            zloginfo('#########Timer: Initializes and clears timer when component is destroyed', countdownMap.current, countdownTimerMap.current);
            Array.from((countdownTimerMap.current as any).keys()).forEach((key) => {
                clearInterval((countdownTimerMap.current as any).get(key));
                (countdownTimerMap.current as any).set(key, null);
            });
        };
    }, []);

    return <View style={[styles.container, getCustomContainerStyle(visable).customContainer]}>
        <ZegoSendInvitationButton
            backgroundColor={'transparent'}
            width='100%'
            height={50}
            fontSize={14}
            color='#fff'
            text={
                invitationType === ZegoInvitationType.inviteToCoHost ?
                    ZegoTranslationText.inviteCoHostButton.replace('%0', inviteeID) :
                    ZegoTranslationText.removeCoHostButton
            }
            invitees={[inviteeID]}
            type={invitationType}
            onWillPressed={willPressedHandle}
            onPressed={({invitationID, invitees: succInvitees}: {invitationID: string, invitees: string[]}) => {
                zloginfo(`[ZegoCoHostMenuDialog][SendInvitationButton] onPressed type: ${invitationType}, callID: ${invitationID}, invitees: ${JSON.stringify(succInvitees)}`)
                if (succInvitees.length === 0) {
                    // not report any event
                } else if (invitationType === ZegoInvitationType.inviteToCoHost) {
                    ZegoUIKitReport.reportEvent('livestreaming/cohost/host/invite', {
                        call_id: invitationID,
                        audience_id: succInvitees[0]
                    });
                } else if (invitationType === ZegoInvitationType.removeCoHost) {
                    ZegoUIKitReport.reportEvent('livestreaming/cohost/host/stop', {
                        call_id: invitationID,
                        cohost_id: succInvitees[0]
                    });
                }

                if (typeof onOk === 'function') {
                    onOk()
                }
            }}
        ></ZegoSendInvitationButton>
        <View style={styles.divide}></View>
        {/* remove xxx from the room */}
        <TouchableOpacity style={styles.removeButton} onPress={removeHandle}>
            <Text style={styles.removeText}>{ZegoTranslationText.removeUserMenuDialogButton.replace('%0', inviteeID)}</Text>
        </TouchableOpacity>
        <View style={styles.divide}></View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>{ZegoTranslationText.cancelMenuDialogButton}</Text>
        </TouchableOpacity>
    </View>
}
 
const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 12,
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: 'rgba(17,16,20,0.9)',
    },
    divide: {
        width: '100%',
        height: 1,
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
    },
    cancelButton: {
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 14,
        color: '#fff',
    },
    removeButton: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        fontSize: 14,
        color: '#fff',
    },
});