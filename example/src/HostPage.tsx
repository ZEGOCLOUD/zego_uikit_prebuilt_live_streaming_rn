import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import * as ZIM from 'zego-zim-react-native';

import {
    ZegoUIKitVideoConfig,
} from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltLiveStreaming, {
    HOST_DEFAULT_CONFIG,
    ZegoMenuBarButtonName,
} from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn';

import { CustomBuilder } from './CustomBuilder';
import KeyCenter from './KeyCenter';

export default function HostPage(props: any) {
    const prebuiltRef = useRef(null);
    const { route } = props;
    const { params } = route;
    const { userID, userName, liveID, type } = params;

    let videoConfig;
    if (type === '180P') {
        videoConfig = ZegoUIKitVideoConfig.preset180P();
    } else if (type === '1080P') {
        videoConfig = ZegoUIKitVideoConfig.preset1080P();
    } else {
        videoConfig = ZegoUIKitVideoConfig.preset360P(); // 默认
    }
    
    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltLiveStreaming
                ref={prebuiltRef}
                appID={KeyCenter.appID}
                appSign={KeyCenter.appSign}
                userID={userID}
                userName={userName}
                liveID={liveID}

                config={{
                    ...HOST_DEFAULT_CONFIG,
                    // startLiveButtonBuilder: (startLive) => <Button onPress={startLive} title="Start Live"></Button>,
                    onStartLiveButtonPressed: () => { console.log('########HostPage onStartLiveButtonPressed'); },
                    onLiveStreamingEnded: (duration: number) => {
                        console.log('########HostPage onLiveStreamingEnded', duration);
                    },
                    onLeaveLiveStreaming: (duration: number) => {
                        console.log('########HostPage onLeaveLiveStreaming', duration);
                        if (typeof props.navigation.popTo === 'function') {
                            props.navigation.popTo('HomePage');
                        } else {
                            props.navigation.navigate('HomePage');
                        }
                    },
                    durationConfig: {
                        isVisible: true,
                        onDurationUpdate: (duration: number) => {
                            console.log('########HostPage onDurationUpdate', duration);
                            if (duration > 100000) {
                                (prebuiltRef as any).current.leave(true);
                            }
                        }
                    },
                    topMenuBarConfig: {
                        buttons: [
                          ZegoMenuBarButtonName.minimizingButton, 
                          ZegoMenuBarButtonName.leaveButton,
                        ],
                        buttonBuilders: {
                          // leaveBuilder: CustomBuilder.leaveBuilder,
                          // minimizingBuilder: CustomBuilder.minimizingBuilder,
                          // memberBuilder: CustomBuilder.memberBuilder,
                          hostAvatarBuilder: CustomBuilder.hostAvatarBuilder,
                        },
                    },
                    bottomMenuBarConfig: {
                      buttonBuilders: {
                        // toggleCameraBuilder: CustomBuilder.toggleCameraBuilder,
                        // toggleMicrophoneBuilder: CustomBuilder.toggleMicrophoneBuilder,
                        // switchCameraBuilder: CustomBuilder.switchCameraBuilder,
                        // switchAudioOutputBuilder: CustomBuilder.switchAudioOutputBuilder,
                        // enableChatBuilder: CustomBuilder.enableChatBuilder,
                        // chatBuilder: CustomBuilder.chatBuilder,
                      },
                    },
                    memberListConfig: {
                        avatarBuilder: CustomBuilder.memberAvatarBuilder,
                    },
                    onWindowMinimized: () => {
                        console.log('[Demo]HostPage onWindowMinimized');
                        if (typeof props.navigation.popTo === 'function') {
                            props.navigation.popTo('HomePage');
                        } else {
                            props.navigation.navigate('HomePage');
                        }
                    },
                    onWindowMaximized: () => {
                        console.log('[Demo]HostPage onWindowMaximized');
                        props.navigation.navigate('HostPage', {
                          userID: userID,
                          userName: 'user_' + userID,
                          liveID: liveID,
                        });
                    },
                    video: videoConfig,
                    // logoutSignalingPluginOnLeaveLiveStreaming: false,
                    roomConfig: {
                        onUsersEnter: (userInfoList: any[]) => {
                            console.log('########HostPage onUsersEnter', userInfoList);
                            userInfoList.map((userInfo) => {
                                (prebuiltRef.current as any)?.sendSystemMessage?.(userInfo.userName + ' entered the room');
                            })
                        },
                        onUsersLeave: (userInfoList: any[]) => {
                            console.log('########HostPage onUsersLeave', userInfoList);
                        },
                    },
                    inRoomMessageViewConfig: {
                        itemBuilder: CustomBuilder.inRoomMessageItemBuilder,
                    },
                }}
                plugins={[ZIM]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    avView: {
        flex: 1,
        width: '100%',
        height: '100%',
        zIndex: 1,
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: 'red'
    },
    ctrlBar: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 50,
        width: '100%',
        height: 50,
        zIndex: 2
    },
    ctrlBtn: {
        flex: 1,
        width: 48,
        height: 48,
        marginLeft: 37 / 2,
        position: 'absolute'
    }
});
