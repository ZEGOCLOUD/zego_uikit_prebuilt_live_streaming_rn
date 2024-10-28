import React, { Fragment, useEffect, useState } from "react";
import { StyleSheet, View, Image, Text, TouchableWithoutFeedback, TouchableOpacity } from "react-native"
import { OrientationType } from 'react-native-orientation-locker';

import ZegoUIKit, { ZegoMemberList } from '@zegocloud/zego-uikit-rn';

import { getShortName } from '../utils';
import { ZegoCoHostConnectState, ZegoInvitationType, ZegoLiveStreamingRole, ZegoToastType, ZegoTranslationText } from '../services/defines';
import ZegoAgreeCoHostButton from "./ZegoAgreeCoHostButton";
import ZegoDisagreeCoHostButton from "./ZegoDisagreeCoHostButton";
import { zloginfo } from "../utils/logger";

export default function ZegoLiveStreamingMemberList(props: any) {
    const {
        isPluginsInit,
        showMicrophoneState,
        showCameraState,
        itemBuilder,
        avatarBuilder,
        onCloseMemberList,
        memberConnectStateMap,
        hostID,
        memberCount,
        onCoHostDisagree,
        onCoHostAgree,
        onConnectStateChanged,
        setIsToastVisable,
        setToastExtendedData,
        setIsCoHostDialogVisable,
        setCoHostDialogExtendedData,
        orientationState,
    } = props;
    zloginfo('#######ZegoLiveStreamingMemberList', memberConnectStateMap);

    const maxWidthLimit1 = 140; // Anchor interface with buttons
    const maxWidthLimit2 = 250; // Non-anchor interface and no buttons
    const localUserID = ZegoUIKit.getLocalUserInfo().userID;
    
    // Determine whether you are the host and whether the current member has sent a cohost request
    const showOperationButton = (userID: string) => {
        return localUserID === hostID && memberConnectStateMap[userID] === ZegoCoHostConnectState.connecting;
    };
    const showOperationIcon = (userID: string) => {
        return isPluginsInit && (localUserID === hostID && userID !== localUserID && memberConnectStateMap[userID] !== ZegoCoHostConnectState.connecting);
    };
    const operateHandle = (userID: string) => {
        onCloseMemberList();
        setIsCoHostDialogVisable(true);
        if (memberConnectStateMap[userID] === ZegoCoHostConnectState.connected) {
            // You can force prohibit to connect
            setCoHostDialogExtendedData({
                inviteeID: userID,
                invitationType: ZegoInvitationType.removeCoHost,
                onOk: () => {
                    setIsCoHostDialogVisable(false);
                    onConnectStateChanged(userID, ZegoCoHostConnectState.idle);
                },
                onCancel: () => {
                    setIsCoHostDialogVisable(false);
                },
            });
        } else {
            // You can invite to cohost
            setCoHostDialogExtendedData({
                inviteeID: userID,
                invitationType: ZegoInvitationType.inviteToCoHost,
                onOk: () => {
                    setIsCoHostDialogVisable(false);
                    setIsToastVisable(true);
                    setToastExtendedData({ type: ZegoToastType.success, text: ZegoTranslationText.inviteCoHostSuccessfullyToast });
                },
                onCancel: () => {
                    setIsCoHostDialogVisable(false);
                },
            });
        }
    };

    const sortUserList = (userList: any[]) => {
        const hostArr: any[] = [],
            speakerArr: any[] = [],
            willSpeakerArr: any[] = [],
            audienceArr: any[] = [];
        userList.forEach((item: any) => {
            if (item.userID === hostID) {
                if (item.userID === localUserID) {
                    hostArr.unshift(item);
                } else {
                    hostArr.push(item);
                }
            } else if (memberConnectStateMap[item.userID] === ZegoCoHostConnectState.connected) {
                if (item.userID === localUserID) {
                    speakerArr.unshift(item);
                } else {
                    speakerArr.push(item);
                }
            } else if (memberConnectStateMap[item.userID] === ZegoCoHostConnectState.connecting) {
                if (item.userID === localUserID) {
                    willSpeakerArr.unshift(item);
                } else {
                    willSpeakerArr.push(item);
                }
            } else {
                if (item.userID === localUserID) {
                    // LocalUser is audience, sort after hostArr
                    speakerArr.unshift(item);
                } else {
                    audienceArr.push(item);
                }
            }
        });
        const allArr = hostArr.concat(speakerArr, willSpeakerArr, audienceArr);
        return allArr;
    };
    const streamingRenderItem = ({ userInfo }: any) => {
        userInfo.connectState = memberConnectStateMap[userInfo.userID];
        const role = (userInfo.userID === hostID) ? ZegoLiveStreamingRole.host : (userInfo.connectState === ZegoCoHostConnectState.connected ? ZegoLiveStreamingRole.coHost : ZegoLiveStreamingRole.audience);
        userInfo.role = role;
        userInfo.isSelf = (userInfo.userID === localUserID);

        const showMe = userInfo.isSelf ? 'You' : '';
        const roleName = userInfo.role === ZegoLiveStreamingRole.host ? 'Host' : (userInfo.role === ZegoLiveStreamingRole.coHost ? 'Co-host' : '');
        let roleDesc = ''
        if (!showMe) {
          roleDesc = `${roleName ? ('(' + roleName + ')') : ''}`;
        } else {
          roleDesc = `(${showMe + (roleName ? (',' + roleName) : '')})`;
        } 

        return <View style={styles.memberItem}>
            {avatarBuilder 
                ? avatarBuilder(userInfo)
                : <View style={styles.memberItemLeft}>
                    <View style={styles.memberAvatar}>
                        <Text style={styles.memberNameLabel}>{getShortName(userInfo.userName)}</Text>
                    </View>
                    <View style={[styles.memberName, {maxWidth: showOperationButton(userInfo.userID) ? maxWidthLimit1 : maxWidthLimit2}]}>
                        <Text numberOfLines={1} style={{fontSize: 16, color: '#FFFFFF'}}>{userInfo.userName}{roleDesc}</Text>
                    </View>
                </View>
            }
            <View style={styles.memberItemRight}>
                {
                    showOperationButton(userInfo.userID) ? <Fragment>
                        <View style={{marginRight: 6}}>
                            {/* @ts-ignore */}
                            <ZegoDisagreeCoHostButton onPressed={onCoHostDisagree.bind(this, userInfo.userID)} inviterID={userInfo.userID} />
                        </View>
                        <View>
                            {/* @ts-ignore */}
                            <ZegoAgreeCoHostButton onPressed={onCoHostAgree.bind(this, userInfo.userID)} inviterID={userInfo.userID} />
                        </View>
                    </Fragment> : null
                }
                {
                    // @ts-ignore
                    showOperationIcon(userInfo.userID) ? <TouchableOpacity onPress={operateHandle.bind(this, userInfo.userID)}>
                        <Image source={require('../resources/icon_more_vertical.png')} />
                    </TouchableOpacity> : null
                }
            </View>
        </View>
    };

    const [containerHeight, setContainerHeight] = useState(260);

    useEffect(() => {
        zloginfo(`orientationState: ${orientationState}`)
        if (orientationState === OrientationType["PORTRAIT"] || orientationState === OrientationType["PORTRAIT-UPSIDEDOWN"]) {
            setContainerHeight(571);
        } else {
            setContainerHeight(260);
        }
    }, [orientationState]);

    return (<View style={[styles.container, {height: containerHeight}]}>
        <View style={styles.header}>
            <TouchableWithoutFeedback
                onPress={onCloseMemberList}>
                <Image
                    style={styles.downArrowIcon}
                    source={require('../resources/white_button_back.png')}
                />
            </TouchableWithoutFeedback>
            <Text style={styles.title}>{ZegoTranslationText.memberListTitle} · {memberCount}人</Text>
        </View>
        <View style={styles.divide}></View>
        <View style={styles.memberListContainer}>
            <ZegoMemberList 
                showMicrophoneState={showMicrophoneState}
                showCameraState={showCameraState}
                itemBuilder={itemBuilder || streamingRenderItem}     // itemBuilder path: ZegoUIKitPrebuiltLiveStreaming.config.memberListConfig.itemBuilder
                sortUserList={sortUserList}
            />
        </View>
    </View>);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: 'rgba(34,34,34,0.8)',
        width: '100%',
        // height: 571,     // dynamic control in code
        zIndex: 12,
        position: 'absolute',
        bottom: 0,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 43,
    },
    downArrowIcon: {
        marginLeft: 11.5,
        marginRight: 5,
    },
    title: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    divide: {
        width: '100%',
        height: 1,
        backgroundColor: '#FFFFFF',
        opacity: 0.15,
    },
    memberListContainer: {
        flex: 1,
        paddingTop: 12,
        paddingBottom: 14,
    },
    memberItem: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 18,
        paddingRight: 17,
        height: 62,
    },
    memberItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberAvatar: {
        width: 36,
        height: 36,
        backgroundColor: '#DBDDE3',
        borderRadius: 1000,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberNameLabel: {
        flex: 1,
        textAlign: 'center',
        color: '#222222',
        fontSize: 16,
    },
    memberName: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
