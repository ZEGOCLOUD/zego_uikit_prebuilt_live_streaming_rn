import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import {
  ZegoLiveStreamingRole,
} from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn';

export class CustomBuilder {
  static toggleCameraBuilder = (isOn : boolean) => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{isOn ? 'C On' : 'C Off'}</Text>
    </View>
    );
  }
  
  static toggleMicrophoneBuilder = (isOn: boolean) => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{isOn ? 'M On' : 'M Off'}</Text>
    </View>
    );
  }

  static switchCameraBuilder = (isFront: boolean) => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{isFront ? 'Front' : 'Back'}</Text>
    </View>
    );
  }

  // deviceType
  // ZegoAudioRouteSpeaker=(0) ZegoAudioRouteHeadphone=(1) ZegoAudioRouteBluetooth=(2) ZegoAudioRouteReceiver=(3) ZegoAudioRouteExternalUSB=(4) ZegoAudioRouteAirPlay=(5)
  static switchAudioOutputBuilder = (deviceType: number) => {
    console.log('+++++++++++++ switchAudioOutputBuilder', deviceType);
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{`D: ${deviceType}`}</Text>
    </View>
    );
  }

  static leaveBuilder = () => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{'Quit'}</Text>
    </View>
    );
  }

  static minimizingBuilder = () => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{'Mini'}</Text>
    </View>
    );
  }

  static memberBuilder = (memberCount: number, requestCoHostCount: number) => {
    console.log('++++++++, memberBuilder', memberCount, requestCoHostCount);
    return (
      <View style={{width: 80, height: 30, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
        <Text>{`Member: ${memberCount}`}</Text>
      </View>
    );
  }

  static getUserAvatar = (userID: string) => {
    return `https://robohash.org/${userID}.png`
  }

  static hostAvatarBuilder = (hostInfo: any) => {
    return (
      <View style={[styles.hostInfo]}>
          <Image
            style={styles.memberAvatar}
            defaultSource={require('./resources/avatar_def.png')}   // Don't take effect in Android debug mode.
            source={{uri: this.getUserAvatar(hostInfo.userID)}}
          />
          <Text style={styles.hostName}>{hostInfo.userName}</Text>
      </View>
    );
  }

  static memberAvatarBuilder = (userInfo: any) => {
    const showMe = userInfo.isSelf ? 'You' : '';
    const roleName = userInfo.role === ZegoLiveStreamingRole.host ? 'Host' : (userInfo.role === ZegoLiveStreamingRole.coHost ? 'Co-host' : '');
    let roleDesc = ''
    if (!showMe) {
      roleDesc = `${roleName ? ('(' + roleName + ')') : ''}`;
    } else {
      roleDesc = `(${showMe + (roleName ? (',' + roleName) : '')})`;
    } 

    return (
      <View style={styles.memberItemLeft}>
        <Image
              style={styles.memberAvatar}
              defaultSource={require('./resources/avatar_def.png')}   // Don't take effect in Android debug mode.
              source={{uri: this.getUserAvatar(userInfo.userID)}}
        />
        <View style={[styles.memberName]}>
            <Text numberOfLines={1} style={{fontSize: 16, color: '#FFFFFF'}}>{userInfo.userName}{roleDesc}</Text>
        </View>
      </View>
    );
  }

  static enableChatBuilder = (enableChat: boolean) => {
    return (
      <View style={{backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
        <Text>{enableChat ? 'Chat On' : 'Chat Off'}</Text>
      </View>
    );
  }

  static chatBuilder = (isOn: boolean) => {
    return (
      <View style={{backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
        <Text>{isOn ? 'Chat On' : 'Chat Off'}</Text>
      </View>
    );
  }

  static inRoomMessageItemBuilder = ({ message }: any) => {
    let type = message.type || 'user';
    return (
      <View style={styles.messageContainer}>
        {type === 'system' ? (
            <Text style={[styles.systemMessageLabel]}>
              {message.message}
            </Text>
          ) : (
            <Text style={styles.senderNameLabel}>
              {message.sender?.userName || 'Unknown User'}
              <Text style={styles.messageLabel}> {message.message}</Text>
            </Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  hostInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 39, 64, 0.4)',
    borderRadius: 1000,
    paddingLeft: 3,
    paddingRight: 12,
    paddingTop: 3,
    paddingBottom: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    display: 'flex',
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
      width: 36,
      height: 36,
      backgroundColor: '#5c5c5c',
      borderRadius: 1000,
      marginRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
  },
  memberName: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(1, 7, 18, 0.3000)',
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
    paddingLeft: 10,
  },
  senderNameLabel: {
    color: '#8BE7FF',
    fontSize: 13,
  },
  messageLabel: {
    color: 'white',
    fontSize: 13,
    marginLeft: 5,
  },
  systemMessageLabel: {
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})