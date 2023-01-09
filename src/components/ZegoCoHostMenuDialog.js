import React, { useEffect, useState, Fragment }from "react";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ZegoStartInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoTranslationText, ZegoInvitationType } from "../services/defines";


export default function ZegoCoHostMenuDialog(props) {
    const {
        visable,
        inviteeID,
        invitationType = ZegoInvitationType.inviteToCoHost,
        onCancel,
        onOk,
    } = props;

    const getCustomContainerStyle = (visable) => StyleSheet.create({
        customContainer: {
            display: visable ? 'flex' : 'none',
        },
    });

    return <View style={[styles.container, getCustomContainerStyle(visable).customContainer]}>
        <ZegoStartInvitationButton
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
            onPressed={onOk}
        ></ZegoStartInvitationButton>
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