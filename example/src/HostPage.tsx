import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ZegoUIKitPrebuiltLiveStreaming, {
    HOST_DEFAULT_CONFIG,
    ZegoMenuBarButtonName,
} from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn';
import KeyCenter from './KeyCenter';
import * as ZIM from 'zego-zim-react-native';
import { CustomBuilder } from './CustomBuilder';

export default function HostPage(props: any) {
    const prebuiltRef = useRef();
    const { route } = props;
    const { params } = route;
    const { userID, userName, liveID } = params;
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
                        props.navigation.navigate('HomePage')
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
                        props.navigation.navigate('HomePage');
                    },
                    onWindowMaximized: () => {
                        console.log('[Demo]HostPage onWindowMaximized');
                        props.navigation.navigate('HostPage', {
                          userID: userID,
                          userName: 'user_' + userID,
                          liveID: liveID,
                        });
                    },
                    // logoutSignalingPluginOnLeaveLiveStreaming: false,
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
