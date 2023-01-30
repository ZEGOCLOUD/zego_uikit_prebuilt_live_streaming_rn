import React, { useEffect, useState, useRef, Fragment }from "react";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ZegoSendInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoTranslationText, ZegoInvitationType, ZegoToastType } from "../services/defines";


export default function ZegoCoHostMenuDialog(props) {
    const countdown = useRef();
    const countdownTimer = useRef();
    const {
        visable,
        inviteeID,
        invitationType = ZegoInvitationType.inviteToCoHost,
        onCancel,
        onOk,
        setIsToastVisable,
        setToastExtendedData,
    } = props;

    const getCustomContainerStyle = (visable) => StyleSheet.create({
        customContainer: {
            display: visable ? 'flex' : 'none',
        },
    });
    // Verify whether invitations can be sent
    const willPressedHandle = () => {
        let result = true;
        if (invitationType === ZegoInvitationType.inviteToCoHost) {
            // Check whether the timer is running out
            console.log('#########Timer: Check whether the timer is running out', countdown.current, countdownTimer.current);
            if (countdownTimer.current) {
                // The timer did not complete and the request was not allowed to occur
                console.log('#########Timer: The timer did not complete and the request was not allowed to occur', countdown.current, countdownTimer.current);
                setIsToastVisable(true);
                setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.repeatInviteCoHostFailedToast });
                result = false;
            } else {
                // Restart timer
                clearInterval(countdownTimer.current);
                countdownTimer.current = setInterval(() => {
                    console.log('#########Timer: countdown', countdown.current, countdownTimer.current);
                    if (countdown.current === 0) {
                        clearInterval(countdownTimer.current);
                        countdownTimer.current = null;
                        countdown.current = 60;
                    } else {
                        countdown.current -= 1;
                    }
                }, 1000);
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

    useEffect(() => {
        // First render initializes and clears timer
        console.log('#########Timer: First render initializes and clears timer', countdown.current, countdownTimer.current);
        countdown.current = 60;
        countdownTimer.current = null;
        return () => {
            // Initializes and clears timer when component is destroyed
            console.log('#########Timer: Initializes and clears timer when component is destroyed', countdown.current, countdownTimer.current);
            clearInterval(countdownTimer.current);
            countdownTimer.current = null;
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
            onPressed={onOk}
        ></ZegoSendInvitationButton>
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
});