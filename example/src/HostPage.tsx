import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ZegoUIKitPrebuiltLiveStreaming, { HOST_DEFAULT_CONFIG } from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn'
import KeyCenter from './KeyCenter';
import * as ZIM from 'zego-zim-react-native';

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
                            if (duration > 10) {
                                (prebuiltRef as any).current.leave(true);
                            }
                        }
                    }
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
