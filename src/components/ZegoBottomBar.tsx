import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
    ZegoLeaveButton,
    ZegoSwitchAudioOutputButton,
    ZegoSwitchCameraButton,
    ZegoToggleCameraButton,
    ZegoToggleMicrophoneButton,
} from '@zegocloud/zego-uikit-rn'

import ZegoMoreButton from './ZegoMoreButton';
import ZegoMessageButton from './ZegoMessageButton';
import ZegoMenuBarButtonName from "./ZegoMenuBarButtonName";
import ZegoCoHostControlButton from "./ZegoCoHostControlButton";
import ZegoEnableChatButton from "./ZegoEnableChatButton";
import PrebuiltHelper from "../services/prebuilt_helper";

export default function ZegoBottomBar(props: any) {
    const {
        menuBarButtonsMaxCount = 5,
        menuBarButtons = [],
        menuBarExtendedButtons = [],
        onLeaveLiveStreaming,
        onLeaveLiveStreamingConfirming,
        turnOnCameraWhenJoining,
        turnOnMicrophoneWhenJoining,
        useSpeakerWhenJoining,
        onMoreButtonPress,
        onMessageButtonPress,
        showInRoomMessageButton = false,
        onConnectStateChanged,
        setIsToastVisable,
        setToastExtendedData,
        setIsDialogVisable,
        setDialogExtendedData,
        userID,
        hostID,
        liveStatus,
        isPluginsInit,
        memberConnectState,
        buttonBuilders,
    } = props;
    const [isNormalStyle, setIsNormalStyle] = useState(true);

    const getButtonByButtonIndex = (buttonIndex: number, isFirstLevel: boolean) => {
        const buttonSize = isFirstLevel ? 36 : 48;
        switch (buttonIndex) {
            case ZegoMenuBarButtonName.leaveButton:
                return <ZegoLeaveButton
                    key={buttonIndex}
                    onLeaveConfirmation={onLeaveLiveStreamingConfirming}
                    onPressed={onLeaveLiveStreaming}
                    iconLeave={require("../resources/white_bottom_button_close.png")}
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.leaveBuilder}
                />
            case ZegoMenuBarButtonName.toggleCameraButton:
                return <ZegoToggleCameraButton
                    key={buttonIndex}
                    isOn={turnOnCameraWhenJoining}
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.toggleCameraBuilder}
                />;
            case ZegoMenuBarButtonName.toggleMicrophoneButton:
                return <ZegoToggleMicrophoneButton
                    key={buttonIndex}
                    isOn={turnOnMicrophoneWhenJoining}
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.toggleMicrophoneBuilder}
                />;
            case ZegoMenuBarButtonName.switchCameraButton:
                return <ZegoSwitchCameraButton
                    key={buttonIndex}
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.switchCameraBuilder}
                />
            case ZegoMenuBarButtonName.switchAudioOutputButton:
                return <ZegoSwitchAudioOutputButton
                    key={buttonIndex}
                    useSpeaker={useSpeakerWhenJoining}
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.switchAudioOutputBuilder}
                />
            case ZegoMenuBarButtonName.coHostControlButton:
                return <ZegoCoHostControlButton
                    key={buttonIndex}
                    hostID={hostID}
                    liveStatus={liveStatus}
                    isPluginsInit={isPluginsInit}
                    memberConnectState={memberConnectState}
                    onConnectStateChanged={onConnectStateChanged}
                    setIsToastVisable={setIsToastVisable}
                    setToastExtendedData={setToastExtendedData}
                    setIsDialogVisable={setIsDialogVisable}
                    setDialogExtendedData={setDialogExtendedData}
                    turnOnCameraWhenJoining={turnOnCameraWhenJoining}
                    turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
                    useSpeakerWhenJoining={useSpeakerWhenJoining}
                />
            case ZegoMenuBarButtonName.enableChatButton: 
                return <ZegoEnableChatButton 
                    width={buttonSize}
                    height={buttonSize}
                    iconBuilder={buttonBuilders.enableChatBuilder}
                />;
        }
    }
    const getDisplayButtons = () => {
        var maxCount = menuBarButtonsMaxCount < 1 ? 1 : menuBarButtonsMaxCount;
        maxCount = maxCount > 5 ? 5 : maxCount;
        const needMoreButton = (menuBarButtons.length + menuBarExtendedButtons.length) > maxCount;
        const firstLevelButtons: any[] = [];
        const secondLevelButtons: any[] = [];
        menuBarButtons.forEach((buttonIndex: number) => {
            const limitCount = needMoreButton ? maxCount - 1 : maxCount;
            if (firstLevelButtons.length < limitCount) {
                firstLevelButtons.push(getButtonByButtonIndex(buttonIndex, true));
            } else {
                secondLevelButtons.push(getButtonByButtonIndex(buttonIndex, false));
            }
        });
        menuBarExtendedButtons.forEach((button: any) => {
            const limitCount = needMoreButton ? maxCount - 1 : maxCount;
            if (firstLevelButtons.length < limitCount) {
                firstLevelButtons.push(button, true);
            } else {
                secondLevelButtons.push(button, false);
            }
        });
        if (needMoreButton) {
            firstLevelButtons.push(<ZegoMoreButton onPress={() => { setIsNormalStyle(false); if (onMoreButtonPress) onMoreButtonPress() }} />)
        }
        return {
            firstLevelButtons: firstLevelButtons,
            secondLevelButtons: secondLevelButtons
        }
    }

    var allButtons = getDisplayButtons();
    var firstLevelButtons = allButtons['firstLevelButtons']
    var secondLevelButtons = allButtons['secondLevelButtons']

    useEffect(() => {
      const callbackID = 'ZegoBottomBar' + String(Math.floor(Math.random() * 10000));
      PrebuiltHelper.getInstance().onFullPageTouch(callbackID, () => {
        setIsNormalStyle(true);
      });
      return () => {
        PrebuiltHelper.getInstance().onFullPageTouch(callbackID);
      }
    }, []);
    

    return (
        isNormalStyle ? 
            <View style={styles.normalBar}>
                {showInRoomMessageButton ? <ZegoMessageButton userID={userID} hostID={hostID} onPress={() => {
                    if (typeof onMessageButtonPress == 'function') {
                        onMessageButtonPress();
                    }
                }} iconBuilder={buttonBuilders.chatBuilder} /> : null}

                <View style={styles.rightBar}>
                    {firstLevelButtons.map((button, index) => (
                        <View style={styles.rightBtn} key={'firstLevel' + index}>
                            {button}
                        </View>
                    ))}
                </View>
            </View> :
            <View style={[styles.popupContainer, styles.fillParent]}>
                <View style={[styles.popupMask, styles.fillParent]} >
                    <TouchableOpacity style={styles.fillParent} onPress={() => { setIsNormalStyle(true) }} />
                </View>
                <View style={styles.popupBar}>
                    {secondLevelButtons.map((button, index) => (
                        <View style={{ marginBottom: 20, marginRight: 32 / 2, marginLeft: 32 / 2 }} key={'secondLevel' + index}>
                            {button}
                        </View>
                    ))}
                </View>
            </View>
    );
}

const styles = StyleSheet.create({
    messageButton: {
        position: 'absolute',
        alignSelf: 'flex-start',
        width: 16,
        height: 16
    },
    rightBar: {
        flex: 1,
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        alignSelf: 'flex-end',
        zIndex: 2,
    },
    normalBar: {
        position: 'absolute',
        justifyContent: 'flex-end',
        marginLeft: 16,
        marginBottom: 16,
        left: 0,
        right: 0,
        height: 50,
        bottom: 25,
        zIndex: 2,
    },
    popupContainer: {
        position: 'absolute',
        flex: 1,
        justifyContent: 'flex-end',
    },
    fillParent: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    popupMask: {
        backgroundColor: '#262A2D',
        opacity: 0.5,
    },
    popupBar: {
        flex: 1,
        paddingTop: 27,
        paddingBottom: 3,
        paddingLeft: 28.5,
        paddingRight: 28.5,
        position: 'absolute',
        flexDirection: 'row',
        flexWrap: "wrap",
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        width: '100%',
        bottom: 0,
        zIndex: 2,
        backgroundColor: '#262A2D'
    },
    rightBtn: {
        marginRight: 16,
    }
});