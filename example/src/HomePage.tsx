import React, { useEffect, useState } from "react";
import { Button, View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFirstInstallTime, getStartupTime } from 'react-native-device-info'

export default function HomePage() {
    const navigation = useNavigation();
    const onJoinPress = (isHost: boolean) => {
        // @ts-ignore
        navigation.navigate(isHost ? 'HostPage' : 'AudiencePage', {
            userID: userID,
            userName: `user_${userID}`,
            liveID: liveID,
            type: type,
        })
    }
    const [userID, setUserID] = useState('');
    const [liveID, setLiveID] = useState('');
    const [type, setType] = useState<'180P' | '360P' | '1080P'>('360P');

    useEffect(() => {
        getFirstInstallTime().then(firstInstallTime => {
            console.log('firstInstallTime: ', firstInstallTime)
            const id = String(firstInstallTime).slice(-5);
            setUserID(id);
        });
        getStartupTime().then(firstStartupTime => {
            console.log('firstStartupTime: ', firstStartupTime)
            const id = String(firstStartupTime).slice(-7, -3);
            setLiveID(id);
        });
    }, []);

    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Text style={styles.userID}>Your User ID: {userID}</Text>
            <Text style={[styles.liveID, styles.leftPadding]}>Live ID:</Text>
            <TextInput
                placeholder="Enter the Live ID. e.g. 6666"
                style={[styles.input]}
                onChangeText={text => setLiveID(text.replace(/[^0-9A-Za-z_]/g, ''))}
                maxLength={4}
                value={liveID}
            >
            </TextInput>

            {/* 类型单选框 */}
            <Text style={styles.leftPadding}>video:</Text>
            <View style={[styles.buttonLine, styles.leftPadding]}>
                <TouchableOpacity onPress={() => setType('180P')}>
                    <Text style={{ color: type === '180P' ? 'blue' : 'black', fontSize: 16 }}>
                        {type === '180P' ? '●' : '○'} 180P
                    </Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacing} />
                <TouchableOpacity onPress={() => setType('360P')}>
                    <Text style={{ color: type === '360P' ? 'blue' : 'black', fontSize: 16 }}>
                        {type === '360P' ? '●' : '○'} 360P
                    </Text>
                </TouchableOpacity>
                <View style={styles.buttonSpacing} />
                <TouchableOpacity onPress={() => setType('1080P')}>
                    <Text style={{ color: type === '1080P' ? 'blue' : 'black', fontSize: 16 }}>
                        {type === '1080P' ? '●' : '○'} 1080P
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.buttonLine, styles.leftPadding]}>
                {/* @ts-ignore */}
                <Button disabled={liveID.length == 0} style={styles.button} title="Start a live" onPress={() => { onJoinPress(true) }} />
                <View style={styles.buttonSpacing} />
                {/* @ts-ignore */}
                <Button  disabled={liveID.length == 0} style={styles.button} title="Watch a live" onPress={() => { onJoinPress(false) }} />
            </View>
            {/* <View style={styles.buttonLine}>
                <Button title="Disconnect SDK" onPress={() => { ZegoUIKit.disconnectSDK() }} />
            </View> */}
        </View>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
    },
    buttonLine: {
        // flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 42,
    },
    buttonSpacing: {
        width: 13,
    },
    input: {
        height: 42,
        width: 305,
        borderWidth: 1,
        borderRadius: 9,
        borderColor: '#333333',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginLeft: 35,
        marginBottom: 20,
    },
    userID: {
        fontSize: 14,
        color: '#2A2A2A',
        marginBottom: 27,
        paddingBottom: 12,
        paddingTop: 12,
        paddingLeft: 20,
    },
    liveID: {
        fontSize: 14,
        color: '#2A2A2A',
        marginBottom: 5,
    },
    simpleCallTitle: {
        color: '#2A2A2A',
        fontSize: 21,
        width: 330,
        fontWeight: 'bold',
        marginBottom: 27,
    },
    button: {
        height: 42,
        borderRadius: 9,
        backgroundColor: '#F4F7FB',
    },
    leftPadding: {
        paddingLeft: 35,
    }
})