import React, { useEffect, useState, useRef } from 'react';
import { PermissionsAndroid, Image, Text, ImageBackground, Alert } from 'react-native';

import {
  StyleSheet,
  View,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import ZegoUIKit, {
  ZegoRoomPropertyUpdateType,
  ZegoLeaveButton,
  ZegoInRoomMessageInput,
  ZegoInRoomMessageView,
  ZegoAudioVideoContainer,
  ZegoLayoutMode,
  ZegoSwitchCameraButton,
  ZegoUIKitPluginType,
} from '@zegocloud/zego-uikit-rn';
import ZegoBottomBar from './components/ZegoBottomBar';
import { useKeyboard } from './utils/keyboard';
import ZegoMenuBarButtonName from './components/ZegoMenuBarButtonName';
import ZegoStartLiveButton from './components/ZegoStartLiveButton';
import ZegoLiveStreamingMemberList from './components/ZegoLiveStreamingMemberList';
import ZegoCoHostMenuDialog from "./components/ZegoCoHostMenuDialog";
import ZegoToast from "./components/ZegoToast";
import ZegoDialog from "./components/ZegoDialog";
import ZegoPrebuiltPlugins from './services/plugins';
import { getShotName, grantPermissions } from './utils';
import ZegoAudioVideoForegroundView from './components/ZegoAudioVideoForegroundView';
import {
  HOST_DEFAULT_CONFIG,
  AUDIENCE_DEFAULT_CONFIG,
  ZegoLiveStreamingRole,
  ZegoLiveStatus,
  ZegoTranslationText,
  ZegoInvitationType,
  ZegoCoHostConnectState,
  ZegoToastType,
} from "./services/defines";

export {
  ZegoMenuBarButtonName,
  HOST_DEFAULT_CONFIG,
  AUDIENCE_DEFAULT_CONFIG,
};

// https://github.com/react-native-community/hooks#usekeyboard
export default function ZegoUIKitPrebuiltLiveStreaming(props) {
  const { appID, appSign, userID, userName, liveID, config, plugins = [] } = props;
  const realTimeData = useRef(); // Resolve the problem where closures cannot obtain new values, add as needed
  const isIgnore = useRef(); // Resolved callback delay in receiving room attached message
  const shouldSortHostAtFirst = useRef();

  config.role === undefined && (config.role = ZegoLiveStreamingRole.audience);
  Object.assign(ZegoTranslationText, config.translationText || {});
  config.deviceConfirmDialogInfo === undefined && (config.deviceConfirmDialogInfo = {});

  const showDefaultDeviceOnDialog = (isCamera, formUser) => {
    console.log('########showDefaultDeviceOnDialog', formUser, isCamera);
    return new Promise((resolve, reject) => {
      const {
        title = `${formUser.userID} wants to turn on your ${isCamera ? 'camera' : 'microphone'}`,
        message = `Are you sure to turn on your ${isCamera ? 'camera' : 'microphone'}?`,
        cancelButtonName = "Cancel",
        confirmButtonName = "Confirm"
      } = config.deviceConfirmDialogInfo;
      Alert.alert(
        title,
        message,
        [
          {
            text: cancelButtonName,
            onPress: () => reject(),
            style: "cancel"
          },
          {
            text: confirmButtonName,
            onPress: () => resolve()
          }
        ]
      );
    })
  }

  const {
    turnOnCameraWhenJoining = true,
    turnOnMicrophoneWhenJoining = true,
    useSpeakerWhenJoining = true,
    audioVideoViewConfig = {},
    bottomMenuBarConfig = {},
    memberListConfig = {},
    inRoomMessageViewConfig = {},
    confirmDialogInfo = {},
    onLeaveLiveStreaming,
    onLeaveLiveStreamingConfirming,
    onLiveStreamingEnded,
    onStartLiveButtonPressed,
    startLiveButtonBuilder,
    markAsLargeRoom = false,
    onCameraTurnOnByOthersConfirmation = showDefaultDeviceOnDialog.bind(this, true),
    onMicrophoneTurnOnByOthersConfirmation = showDefaultDeviceOnDialog.bind(this, false),
  } = config;
  const {
    showSoundWavesInAudioMode = true,
    useVideoViewAspectFill = true,
    foregroundBuilder,
  } = audioVideoViewConfig;
  const {
    showMicrophoneState = true,
    showCameraState = true,
    itemBuilder,
  } = memberListConfig;
  const { itemBuilder: messageItemBuilder } = inRoomMessageViewConfig;
  const {
    showInRoomMessageButton = true,
    hostButtons = [ZegoMenuBarButtonName.toggleCameraButton, ZegoMenuBarButtonName.toggleMicrophoneButton, ZegoMenuBarButtonName.switchCameraButton],
    coHostButtons = [ZegoMenuBarButtonName.toggleCameraButton, ZegoMenuBarButtonName.toggleMicrophoneButton, ZegoMenuBarButtonName.switchCameraButton, ZegoMenuBarButtonName.coHostControlButton],
    audienceButtons = plugins && plugins.length ? [ZegoMenuBarButtonName.coHostControlButton] : [],
    hostExtendButtons = [],
    coHostExtendButtons = [],
    audienceExtendButtons = [],
    maxCount = 5,
  } = bottomMenuBarConfig;

  const keyboardHeight = useKeyboard();
  const [textInputVisable, setTextInputVisable] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [textInputHeight, setTextInputHeight] = useState(95);
  const [role, setRole] = useState(config.role);
  const [hostID, setHostID] = useState('');
  const [liveStatus, setLiveStatus] = useState(''); // init: '' default: 0, start: 1
  const [memberCount, setMemberCount] = useState(1);
  const [isMemberListVisable, setIsMemberListVisable] = useState(false);
  const [isPluginsInit, setIsPluginsInit] = useState(false);
  const [requestCoHostCount, setRequestCoHostCount] = useState(0);
  let [memberConnectStateMap, setMemberConnectStateMap] = useState({}); // The connection status of the current member
  const [isCoHostDialogVisable, setIsCoHostDialogVisable] = useState(false);
  const [coHostDialogExtendedData, setCoHostDialogExtendedData] = useState({});
  const [isToastVisable, setIsToastVisable] = useState(false);
  const [toastExtendedData, setToastExtendedData] = useState({});
  const [isDialogVisable, setIsDialogVisable] = useState(false);
  const [dialogExtendedData, setDialogExtendedData] = useState({});

  const callbackID = 'ZegoUIKitPrebuiltLiveStreaming' + String(Math.floor(Math.random() * 10000));
  const hideCountdownOnToastLimit = 5;
  const hideCountdownOnDialogLimit = 60;

  let hideCountdownOnToast = hideCountdownOnToastLimit;

  const hideCountdownOn_Dialog = useRef();
  const hideCountdownOn_DialogTimer = useRef();

  const registerPluginCallback = () => {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }) => {
        console.log('[Prebuilt]onInvitationReceived', JSON.stringify(realTimeData.current), requestCoHostCount);
        if (type === ZegoInvitationType.requestCoHost && userID === realTimeData.current.hostID) {
          // The audience created a cohost request
          realTimeData.current.requestCoHostCount += 1;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          setIsToastVisable(true);
          setToastExtendedData({ type: ZegoToastType.success, text: ZegoTranslationText.receivedRequestCoHostToast.replace('%0', inviter.id) });

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.connecting;
          memberConnectStateMap = realTimeData.current.memberConnectStateMap;
          setMemberConnectStateMap(memberConnectStateMap);

          setTimeout(() => {
            // The sorting will not be triggered if the member list pop-up is not reopened, the sorting must be forced
            ZegoUIKit.forceSortMemberList();
          }, 50);
        } else if (type === ZegoInvitationType.inviteToCoHost) {
          // The audience is invited to connect the cohost by host
          setIsDialogVisable(true);
          setDialogExtendedData({
            title: ZegoTranslationText.receivedCoHostInvitationDialogInfo.title,
            content: ZegoTranslationText.receivedCoHostInvitationDialogInfo.message,
            cancelText: ZegoTranslationText.receivedCoHostInvitationDialogInfo.cancelButtonName,
            okText: ZegoTranslationText.receivedCoHostInvitationDialogInfo.confirmButtonName,
            onCancel: () => {
              // Refuse the cohost request of the host
              ZegoUIKit.getSignalingPlugin().refuseInvitation(inviter.id).then(() => {
                realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
                setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

                ZegoUIKit.turnCameraOn('', false);
                ZegoUIKit.turnMicrophoneOn('', false);
                setIsDialogVisable(false);
                setDialogExtendedData({});
                initDialogTimer();
              });
            },
            onOk: () => {
              // Accept the cohost request of the host
              ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id).then(async () => {
                realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.connected;
                setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
                try {
                  await grantPermissions();
                } catch (error) {
                }
                ZegoUIKit.turnCameraOn('', true);
                ZegoUIKit.turnMicrophoneOn('', true);
                setIsDialogVisable(false);
                setDialogExtendedData({});
                initDialogTimer();

                setRole(ZegoLiveStreamingRole.coHost);
                realTimeData.current.role = ZegoLiveStreamingRole.coHost;
              });
            }
          });
          startDialogTimer();
        } else if (type == ZegoInvitationType.removeCoHost) {
          // The audience was forced off the cohost by host
          ZegoUIKit.turnCameraOn('', false);
          ZegoUIKit.turnMicrophoneOn('', false);

          realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          setRole(ZegoLiveStreamingRole.audience);
          realTimeData.current.role = ZegoLiveStreamingRole.audience;
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
        if (userID === realTimeData.current.hostID) {
          // The audience canceled the cohost request
          realTimeData.current.requestCoHostCount -= 1;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter, data }) => {
        if (userID === realTimeData.current.hostID) {
          // The host did not process the cohost request, resulting in a timeout
          realTimeData.current.requestCoHostCount -= 1;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ callID, invitee, data }) => {
        if (userID === realTimeData.current.hostID) {
          // The audience accept the cohost request
          realTimeData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.connected;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          // Reset invitation timer
          setCoHostDialogExtendedData({ resetTimer: true, inviteeID: invitee.id});
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
        if (userID === realTimeData.current.hostID) {
          // The audience reject the cohost request
          realTimeData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          setIsToastVisable(true);
          setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.audienceRejectInvitationToast.replace('%0', invitee.id) });

          // Reset invitation timer
          setCoHostDialogExtendedData({ resetTimer: true, inviteeID: invitee.id });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInRoomTextMessageReceived(callbackID, (messageList) => {
        console.log('[Prebuilt]onInRoomTextMessageReceived', messageList);
      });
    }
  };
  const unRegisterPluginCallback = () => {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
      ZegoUIKit.getSignalingPlugin().onInRoomTextMessageReceived(callbackID);
    }
  };

  const initDialogTimer = () => {
    clearInterval(hideCountdownOn_DialogTimer.current);
    hideCountdownOn_DialogTimer.current = null;
    hideCountdownOn_Dialog.current = hideCountdownOnDialogLimit;
  }
  const startDialogTimer = () => {
    clearInterval(hideCountdownOn_DialogTimer.current);
    hideCountdownOn_DialogTimer.current = setInterval(() => {
      if (hideCountdownOn_Dialog.current === 0) {
        setIsDialogVisable(false);
        setDialogExtendedData({});
        initDialogTimer();
      } else {
        hideCountdownOn_Dialog.current -= 1;
      }
    }, 1000);
  }
  const setIsDialogVisableHandle = (visable) => {
    if (visable) {
      startDialogTimer();
    } else {
      initDialogTimer();
    }
    setIsDialogVisable(visable);
  }

  useEffect(() => {
    ZegoUIKit.onRoomStateChanged(callbackID, (reason) => {
      if (ZegoUIKit.isRoomConnected()) {
        // Anchor set host
        console.log('########onRoomStateChanged anchor set host', realTimeData.current);
        if (realTimeData.current.role === ZegoLiveStreamingRole.host && !realTimeData.current.hostID) {
          ZegoUIKit.updateRoomProperties({ host: userID, live_status: `${ZegoLiveStatus.default}` });
          // Unequal results update the local value first
          setHostID(userID);
          realTimeData.current.hostID = userID;

          setLiveStatus(ZegoLiveStatus.default);
          realTimeData.current.liveStatus = ZegoLiveStatus.default;
          console.log('########onRoomStateChanged anchor set host end', realTimeData.current);
        }
      }
    });
    ZegoUIKit.onUserJoin(callbackID, (userList) => {
      setMemberCount(ZegoUIKit.getAllUsers().length);
    });
    ZegoUIKit.onUserLeave(callbackID, (userList) => {
      setMemberCount(ZegoUIKit.getAllUsers().length);
    });
    ZegoUIKit.onRoomPropertiesFullUpdated(callbackID, (keys, oldRoomProperties, roomProperties, type) => {
      console.log('########onRoomPropertiesFullUpdated', keys, oldRoomProperties, roomProperties, type);
    });
    ZegoUIKit.onRoomPropertyUpdated(callbackID, (key, oldValue, value, type) => {
      console.log('########onRoomPropertyUpdated', key, oldValue, value, type);
      // Resolved callback delay in receiving room attached message
      if (realTimeData.current.role === ZegoLiveStreamingRole.host && type === ZegoRoomPropertyUpdateType.remote) {
        // Set again, update uikit data
        console.log('########Set again, update uikit data', userID, realTimeData.current.liveStatus);
        isIgnore.current = true;
        ZegoUIKit.updateRoomProperties({ host: userID, live_status: `${realTimeData.current.liveStatus}` });
        return;
      }
      if (isIgnore.current) {
        console.log('########onRoomPropertyUpdated ignore');
        isIgnore.current = false;
        return;
      }
      if (key === 'host') {
        setHostID(value);
        realTimeData.current.hostID = value;
      } else if (key === 'live_status') {
        let temp = value ? parseInt(value) : '';
        if (temp === ZegoLiveStatus.default) {
          // The live_status is set to 0 before the host enters the room
          console.log('########onRoomPropertyUpdated Update the reorder identity', true);
          if (realTimeData.current.role !== ZegoLiveStreamingRole.host) {
            // When the audience character receives the broadcast notification, stop pull all streams
            // Uikit is also pulled by default, so you have to stop here as well
            ZegoUIKit.stopPlayingAllAudioVideo();
            if (oldValue === `${ZegoLiveStatus.start}`) {
              // Hide the host's invitation to cohost dialog
              setIsDialogVisable(false);
              setDialogExtendedData({});
              initDialogTimer();

              // Cancel the invitation to cohost
              ZegoUIKit.getSignalingPlugin().cancelInvitation([realTimeData.current.hostID]);
              ZegoUIKit.turnCameraOn('', false);
              ZegoUIKit.turnMicrophoneOn('', false);

              // Update role and memberConnectStateMap
              setRole(ZegoLiveStreamingRole.audience);
              realTimeData.current.role = ZegoLiveStreamingRole.audience;
        
              realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
              setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

              typeof onLiveStreamingEnded === 'function' && onLiveStreamingEnded();
            }
          }
        } else {
          // The launch needs to be sorted, with the owner at the top of the list
          shouldSortHostAtFirst.current = true;
          ZegoUIKit.forceSortAudioVideoList();

          ZegoUIKit.startPlayingAllAudioVideo();
        }

        setLiveStatus(temp);
        realTimeData.current.liveStatus = temp;
      }
    });
    ZegoUIKit.onUserInfoUpdate(callbackID, (userInfo) => {
      // This callback is executed before onAudioVideoAvailable and onAudioVideoUnavailable
      const { userID, isMicDeviceOn, isCameraDeviceOn } = userInfo;
      if (userID === realTimeData.current.hostID && !isMicDeviceOn && !isCameraDeviceOn) {
        // Host turn off their cameras and microphones, cohost will fill in the bit, so it needs to be reordered next time
        console.log('########onAudioVideoUnavailable Update the reorder identity', true);
        shouldSortHostAtFirst.current = true;
      }
    });
    ZegoUIKit.onAudioVideoAvailable(callbackID, (userList) => {
      console.log('########onAudioVideoAvailable', userList);
      userList.forEach((userInfo) => {
        // Not in memberConnectStateMap but already connected
        if (realTimeData.current.hostID !== userInfo.userID) {
          realTimeData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.connected;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        }
      });
    });
    ZegoUIKit.onAudioVideoUnavailable(callbackID, (userList) => {
      userList.forEach((userInfo) => {
        if (userInfo.userID === realTimeData.current.hostID) {
          // Host turn off their cameras and microphones, cohost will fill in the bit, so it needs to be reordered next time
          // Move to the onUserInfoUpdate callback for processing
        } else {
          if (userInfo.userID !== userID) {
            realTimeData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.idle;
            setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
          } else {
            // Do not deal with
          }
        }
      })
    });
    ZegoUIKit.onTurnOnYourCameraRequest(callbackID, (formUser) => {
      console.log('########onTurnOnYourCameraRequest', formUser);
      onCameraTurnOnByOthersConfirmation && onCameraTurnOnByOthersConfirmation(formUser).then(async () => {
        // Allow to open
        try {
          await grantPermissions();
        } catch (error) {
        }
        ZegoUIKit.turnCameraOn('', true);
      });
    });
    ZegoUIKit.onTurnOnYourMicrophoneRequest(callbackID, (formUser) => {
      console.log('########onTurnOnYourMicrophoneRequest', formUser);
      onMicrophoneTurnOnByOthersConfirmation && onMicrophoneTurnOnByOthersConfirmation(formUser).then(async () => {
        // Allow to open
        try {
          await grantPermissions();
        } catch (error) {
        }
        ZegoUIKit.turnMicrophoneOn('', true);
      });
    });
    ZegoUIKit.onMeRemovedFromRoom(callbackID, () => {
      onLeaveLiveStreaming();
    });
    ZegoUIKit.onInRoomCommandReceived(callbackID, (fromUser, command) => {
      console.log('[Prebuilt]onInRoomCommandReceived', fromUser, command);
    });
    
    return () => {
      ZegoUIKit.onRoomStateChanged(callbackID);
      ZegoUIKit.onUserJoin(callbackID);
      ZegoUIKit.onUserLeave(callbackID);
      ZegoUIKit.onRoomPropertiesFullUpdated(callbackID);
      ZegoUIKit.onRoomPropertyUpdated(callbackID);
      ZegoUIKit.onUserInfoUpdate(callbackID);
      ZegoUIKit.onAudioVideoAvailable(callbackID);
      ZegoUIKit.onAudioVideoUnavailable(callbackID);
      ZegoUIKit.onTurnOnYourCameraRequest(callbackID);
      ZegoUIKit.onTurnOnYourMicrophoneRequest(callbackID);
      ZegoUIKit.onMeRemovedFromRoom(callbackID);
      ZegoUIKit.onInRoomCommandReceived(callbackID);
    };
  }, []);
  useEffect(() => {
    initDialogTimer();

    realTimeData.current = {
      role: config.role,
      hostID: '',
      liveStatus: '',
      requestCoHostCount: 0,
      memberConnectStateMap: {},
    }
    isIgnore.current = false;
    shouldSortHostAtFirst.current = true;
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then((result) => {
      setIsPluginsInit(result);
      // Register plugin callback
      registerPluginCallback();
      ZegoUIKit.init(appID, appSign, { userID: userID, userName: userName }).then(
        () => {
          ZegoUIKit.turnCameraOn('', turnOnCameraWhenJoining);
          ZegoUIKit.turnMicrophoneOn('', turnOnMicrophoneWhenJoining);
          ZegoUIKit.setAudioOutputToSpeaker(useSpeakerWhenJoining);

          if (config.role === ZegoLiveStreamingRole.host) {
            grantPermissions(() => {
              ZegoUIKit.joinRoom(liveID, '', !!markAsLargeRoom);
            });
          } else {
            ZegoUIKit.joinRoom(liveID, '', !!markAsLargeRoom);
          }
        }
      );
    });
    return () => {
      ZegoUIKit.leaveRoom();
      unRegisterPluginCallback();
      ZegoPrebuiltPlugins.uninit();
    };
  }, []);

  const showAudioVideoContainer = () => {
    return role === ZegoLiveStreamingRole.host || role !== ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start;
  };
  const showStartLiveButton = () => {
    return role === ZegoLiveStreamingRole.host && hostID && hostID === userID && liveStatus === ZegoLiveStatus.default;
  };
  const showBottomBar = () => {
    return role === ZegoLiveStreamingRole.host && hostID && hostID === userID && liveStatus === ZegoLiveStatus.start ||
    role === ZegoLiveStreamingRole.audience || role === ZegoLiveStreamingRole.coHost;
  }
  const showMessageListView = () => {
    return role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host;
  }
  const onFullPageTouch = () => {
    console.log('####onFullPageTouch####');
    hideCountdownOnToast = hideCountdownOnToastLimit;
    setIsToastVisable(false);
    setTextInputVisable(false);
    setIsMemberListVisable(false);
    setIsCoHostDialogVisable(false);
    setCoHostDialogExtendedData({});
    setTextInputHeight(95); // It needs to be reinitialized, otherwise the height will be wrong
  };
  const useInterval = (callback, delay) => {
    const savedCallback = useRef();
    useEffect(() => {
      savedCallback.current = callback;
    }, []);
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }
  // Close toast on time
  useInterval(() => {
    hideCountdownOnToast--;
    if (hideCountdownOnToast <= 0) {
      hideCountdownOnToast = hideCountdownOnToastLimit;
      setIsToastVisable(false);
      setToastExtendedData({});
    }
  }, 1000);
  const getHostNameByID = (hostID) => {
    const userInfo = ZegoUIKit.getUser(hostID) || { };
    const hostName = userInfo.userName || '';
    return hostName;
  };
  const onMemberButtonPressed = () => {
    setTextInputVisable(false);
    setIsMemberListVisable(true);
  };
  const onNavBackPressed = () => {
    const leaveHandle = async () => {
      // Leave the room
      ZegoUIKit.leaveRoom();
      if (typeof onLeaveLiveStreaming == 'function') {
        onLeaveLiveStreaming();
      }
    }
    const temp = onLeaveLiveStreamingConfirmingWrap(onLeaveLiveStreamingConfirming);
    if (temp) {
      temp.then(() => {
        leaveHandle();
      })
    } else {
      // Reserve cases that do not require confirmation
      leaveHandle();
    }
  };
  const sortAudioVideo = (globalAudioVideoUserList) => {
    console.log('########sortAudioVideo', globalAudioVideoUserList, realTimeData.current.hostID, shouldSortHostAtFirst.current);
    const index = globalAudioVideoUserList.findIndex((userInfo) => userInfo.userID === realTimeData.current.hostID);
    if (shouldSortHostAtFirst.current && index !== -1) {
      // Put host first
      const temp = globalAudioVideoUserList.splice(index, 1)[0];
      globalAudioVideoUserList.unshift(temp);
      // You don't have to deal with the sorting once, because the addition to the internal stream is also added to the end of the queue
      console.log('########sortAudioVideo Sort completion and update the reorder identity', false);
      shouldSortHostAtFirst.current = false;
    }
    return globalAudioVideoUserList;
  };
  const onStartLiveStreaming = () => {
    // After the host enters the room and sets the room properties successfully
    // The host receives the callback of the additional message of the room
    // You must also set the property host, otherwise host will be null
    ZegoUIKit.updateRoomProperties({ host: hostID, live_status: `${ZegoLiveStatus.start}` }).then(() => {
      typeof onStartLiveButtonPressed === 'function' && onStartLiveButtonPressed();
    });
  };
  const showDefaultLeaveDialog = () => {
    return new Promise((resolve, reject) => {
      if (!confirmDialogInfo) {
        resolve();
      } else {
        const {
          title = "Leave the live streaming",
          message = "Are you sure to leave the live streaming?",
          cancelButtonName = "Cancel",
          confirmButtonName = "Confirm"
        } = confirmDialogInfo;
        Alert.alert(
          title,
          message,
          [
            {
              text: cancelButtonName,
              onPress: () => reject(),
              style: "cancel"
            },
            {
              text: confirmButtonName,
              onPress: () => resolve()
            }
          ]
        );
      }
    })
  };
  const onLeaveLiveStreamingConfirmingWrap = (onLeaveLiveStreamingConfirming) => {
    const temp = onLeaveLiveStreamingConfirming || showDefaultLeaveDialog;
    return new Promise((resolve, reject) => {
      temp().then(async () => {
        // Intercept confirm 
        if (role === ZegoLiveStreamingRole.host) {
          if (liveStatus === ZegoLiveStatus.start) {
            // Clear room properties
            await ZegoUIKit.updateRoomProperties({ live_status: `${ZegoLiveStatus.default}`, host: '' });
            typeof onLiveStreamingEnded === 'function' && onLiveStreamingEnded();
          } else {
            // Clear room properties
            await ZegoUIKit.updateRoomProperties({ live_status: `${ZegoLiveStatus.default}`, host: '' });
          }
        } else if (role === ZegoLiveStreamingRole.coHost) {

        } else {
          
        }
        resolve();
      }).catch(() => {
        // Intercept confirm cancel
        reject();
      });
    });
  };
  const connectStateChangedHandle = (changedUserID, connectState, isClosure) => {
    console.log('#########connectStateChangedHandle', changedUserID, connectState, memberConnectStateMap, realTimeData.current.memberConnectStateMap);
    // The audience connection status changes
    changedUserID = changedUserID || userID;
    const temp = connectState === ZegoCoHostConnectState.connected ? ZegoLiveStreamingRole.coHost : ZegoLiveStreamingRole.audience;
    if (!isClosure) {
      // Just take the value in state, because there's no closure
      memberConnectStateMap[changedUserID] = connectState;
      // Rerendering causes realTimeData.current to be empty, so a reassignment is required here
      role !== ZegoLiveStreamingRole.host && (realTimeData.current.role = temp);
      realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };

      role !== ZegoLiveStreamingRole.host && setRole(temp);
      setMemberConnectStateMap({ ...memberConnectStateMap });
    } else {
      // There are closures, status values cannot be used directly
      realTimeData.current.memberConnectStateMap[changedUserID] = connectState;
      setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
      if (realTimeData.current.role !== ZegoLiveStreamingRole.host) {
        realTimeData.current.role = temp;
        setRole(temp);
      }
    }
  };
  const coHostDisagreeHandle = (changedUserID) => {
    // Just take the value in state, because there's no closure
    memberConnectStateMap[changedUserID] = ZegoCoHostConnectState.idle;

    // Rerendering causes realTimeData.current to be empty, so a reassignment is required here
    realTimeData.current.requestCoHostCount = requestCoHostCount - 1;
    realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };

    setMemberConnectStateMap({ ...memberConnectStateMap });
    setRequestCoHostCount(requestCoHostCount - 1);
  };
  const coHostAgreeHandle = (changedUserID) => {
    // Just take the value in state, because there's no closure
    memberConnectStateMap[changedUserID] = ZegoCoHostConnectState.connected;
  
    realTimeData.current.requestCoHostCount = requestCoHostCount - 1;
    realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };

    setMemberConnectStateMap({ ...memberConnectStateMap });
    setRequestCoHostCount(requestCoHostCount - 1);
  };

  return (
    <View style={styles.container}>
      {/* Main frame or background */}
      <View style={styles.fillParent}>
        {/* I have to render it first, otherwise I won't get the callbacks */}
        <ZegoAudioVideoContainer
          audioVideoConfig={{
            showSoundWavesInAudioMode: showSoundWavesInAudioMode,
            useVideoViewAspectFill: useVideoViewAspectFill,
          }}
          layout={{mode: ZegoLayoutMode.pictureInPicture, removeViewWhenAudioVideoUnavailable: true}}
          sortAudioVideo={sortAudioVideo}
          foregroundBuilder={foregroundBuilder || (({userInfo}) => <ZegoAudioVideoForegroundView
            role={role}
            userInfo={userInfo}
            localUserID={userID}
            turnOnCameraWhenJoining={turnOnCameraWhenJoining}
            turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
            showUserNameOnView={true}
            showCameraStateOnView={false}
            showMicrophoneStateOnView={true}
          />) }
        />
        <View style={[styles.fillParent, {zIndex: showAudioVideoContainer() ? -1 : 1}]}>
          <ImageBackground
            style={styles.noHostBg}
            source={require('./resources/background.png')}
          >
            <Text style={styles.noHostTips}>{ZegoTranslationText.noHostOnline}</Text>
          </ImageBackground>
        </View>
      </View>
      {/* Top bar */}
      <View style={styles.topBarContainer}>
        <View style={styles.left}>
          <View style={[styles.hostInfo, (role === ZegoLiveStreamingRole.host && hostID && liveStatus === ZegoLiveStatus.start) || (role !== ZegoLiveStreamingRole.host && hostID) ? styles.show : null]}>
            <View style={styles.avatar}>
              <Text style={styles.nameLabel}>
                {getShotName(getHostNameByID(hostID))}
              </Text>
            </View>
            <Text style={styles.hostName}>{getHostNameByID(hostID)}</Text>
          </View>
          {/* Return home */}
          <TouchableOpacity onPress={onNavBackPressed} style={[styles.navBackButton, (role === ZegoLiveStreamingRole.host && hostID && liveStatus !== ZegoLiveStatus.start) ? styles.show : null]}>
            <Image resizeMode='contain' source={require('./resources/icon_nav_back.png')} />
          </TouchableOpacity>
        </View>
        <View style={styles.right}>
          {
            role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host ? <TouchableOpacity onPress={onMemberButtonPressed}>
              <View style={styles.memberButton}>
                <Image source={require('./resources/white_top_button_member.png')} />
                <Text style={styles.memberCountLabel}>{memberCount}</Text>
                { requestCoHostCount ? <View style={styles.memberRedDot}></View> : null }
              </View>
            </TouchableOpacity> : null
          }
          {
            role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host ? <View style={styles.leaveButton}>
              <ZegoLeaveButton
                style={styles.fillParent}
                onLeaveConfirmation={onLeaveLiveStreamingConfirmingWrap.bind(this, onLeaveLiveStreamingConfirming)}
                onPressed={onLeaveLiveStreaming}
                iconLeave={require('./resources/white_top_button_close.png')}
              />
            </View> : null
          }
          {
            role === ZegoLiveStreamingRole.host && hostID && hostID === userID && (liveStatus === ZegoLiveStatus.default || liveStatus === ZegoLiveStatus.default) ? <View style={styles.switchCameraButton}>
              <ZegoSwitchCameraButton
                iconFrontFacingCamera={require('./resources/icon_nav_flip.png')}
                iconBackFacingCamera={require('./resources/icon_nav_flip.png')}
                width={36}
                height={36}
              />
            </View> : null
          }
        </View>
      </View>
      {/* Start live button */}
      {
        showStartLiveButton() ? <View style={styles.startLiveButtonCon}>
          {
            startLiveButtonBuilder ? startLiveButtonBuilder(onStartLiveStreaming) : <ZegoStartLiveButton onPressed={onStartLiveStreaming} />
          }
        </View> : null
      }
      {/* Message list */}
      {
        showMessageListView() ? <View style={styles.messageListView}>
          <ZegoInRoomMessageView itemBuilder={messageItemBuilder} style={styles.fillParent} />
        </View> : null
      }
      {/* Member list */}
      {
        isMemberListVisable ?
          <ZegoLiveStreamingMemberList
            isPluginsInit={isPluginsInit}
            showMicrophoneState={showMicrophoneState}
            showCameraState={showCameraState}
            itemBuilder={itemBuilder}
            onCloseMemberList={() => setIsMemberListVisable(false)}
            hostID={hostID}
            memberCount={memberCount}
            memberConnectStateMap={memberConnectStateMap}
            onCoHostDisagree={coHostDisagreeHandle}
            onCoHostAgree={coHostAgreeHandle}
            onConnectStateChanged={connectStateChangedHandle}
            setIsToastVisable={(visable) => setIsToastVisable(visable)}
            setToastExtendedData={(toastExtendedData) => setToastExtendedData(toastExtendedData)}
            setIsCoHostDialogVisable={(visable) => setIsCoHostDialogVisable(visable)}
            setCoHostDialogExtendedData={(coHostDialogExtendedData) => setCoHostDialogExtendedData(coHostDialogExtendedData)}
          /> : null
      }
      {/* Cohost dialog */}
      <ZegoCoHostMenuDialog
        visable={isCoHostDialogVisable}
        inviteeID={coHostDialogExtendedData.inviteeID}
        invitationType={coHostDialogExtendedData.invitationType}
        onCancel={coHostDialogExtendedData.onCancel}
        onOk={coHostDialogExtendedData.onOk}
        setIsToastVisable={(visable) => setIsToastVisable(visable)}
        setToastExtendedData={(toastExtendedData) => setToastExtendedData(toastExtendedData)}
        resetTimer={coHostDialogExtendedData.resetTimer}
      />
      {/* Common toast */}
      <ZegoToast
        visable={isToastVisable}
        text={toastExtendedData.text}
        type={toastExtendedData.type}
      />
      <ZegoDialog
        visable={isDialogVisable}
        title={dialogExtendedData.title}
        content={dialogExtendedData.content}
        cancelText={dialogExtendedData.cancelText}
        okText={dialogExtendedData.okText}
        onCancel={dialogExtendedData.onCancel}
        onOk={dialogExtendedData.onOk}
      />
      {/* Click in full screen to collapse the input box */}
      <View
        pointerEvents="auto"
        onTouchStart={onFullPageTouch}
        style={[
          styles.dismissArea,
          {
            bottom:
              (Platform.OS == 'ios'
                ? keyboardHeight + textInputHeight
                : textInputHeight) + 10,
          },
        ]}
      />
      {/* Bottom bar */}
      {
        showBottomBar() ? <KeyboardAvoidingView
            style={[styles.fillParent, { zIndex: 9 }]}
            behavior={'padding'}
          >
            {Platform.OS != 'ios' && keyboardHeight > 0 ? null : (
              <ZegoBottomBar
                menuBarButtonsMaxCount={maxCount}
                menuBarButtons={
                  role === ZegoLiveStreamingRole.host ?
                  hostButtons :
                    role === ZegoLiveStreamingRole.audience ?
                    audienceButtons :
                      role === ZegoLiveStreamingRole.coHost ? 
                      coHostButtons : []
                }
                menuBarExtendedButtons={
                  role === ZegoLiveStreamingRole.host ?
                  hostExtendButtons :
                    role === ZegoLiveStreamingRole.audience ?
                    audienceExtendButtons :
                      role === ZegoLiveStreamingRole.coHost ? 
                      coHostExtendButtons : []
                }
                turnOnCameraWhenJoining={turnOnCameraWhenJoining}
                turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
                useSpeakerWhenJoining={useSpeakerWhenJoining}
                showInRoomMessageButton={showInRoomMessageButton}
                onLeaveLiveStreaming={onLeaveLiveStreaming}
                onLeaveLiveStreamingConfirming={onLeaveLiveStreamingConfirmingWrap.bind(this, onLeaveLiveStreamingConfirming)}
                onMessageButtonPress={() => { setTextInputVisable(true) }}
                onConnectStateChanged={connectStateChangedHandle}
                setIsToastVisable={(visable) => setIsToastVisable(visable)}
                setToastExtendedData={(toastExtendedData) => setToastExtendedData(toastExtendedData)}
                setIsDialogVisable={setIsDialogVisableHandle}
                setDialogExtendedData={(dialogExtendedData) => setDialogExtendedData(dialogExtendedData)}
                isPluginsInit={isPluginsInit}
                userID={userID}
                hostID={hostID}
                liveStatus={liveStatus}
                memberConnectState={memberConnectStateMap[userID]}
              />
            )}
            {textInputVisable ? (
              <View
                style={[
                  styles.messageInputPannel,
                  {
                    bottom: Platform.OS == 'ios' ? keyboardHeight : 0,
                    height: textInputHeight,
                  },
                ]}
              >
                <ZegoInRoomMessageInput
                  ref={(input) => {
                    setTextInput(input);
                  }}
                  onContentSizeChange={(width, height) => {
                    setTextInputHeight(height);
                  }}
                  placeholder={'Say something...'}
                  onSumit={() => {
                    setTextInputVisable(false);
                  }}
                />
              </View>
            ) : null}
        </KeyboardAvoidingView> : null
      }
    </View>
  );
}

const styles = StyleSheet.create({
  messageListView: {
    position: 'absolute',
    left: 16,
    bottom: 80,
    width: 270,
    maxHeight: 200,
    zIndex: 12,
  },
  messageInputPannel: {
    position: 'absolute',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7500)',
    width: '100%',
    zIndex: 11,
  },
  container: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  fillParent: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  topBarContainer: {
    position: 'absolute',
    top: 32,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 3,
    paddingBottom: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: "center",
  },
  right: {
    flexDirection: 'row',
    alignItems: "center",
  },
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
    display: 'none',
  },
  show: {
    display: 'flex',
  },
  avatar: {
    backgroundColor: '#ffffff',
    borderRadius: 1000,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginLeft: 3,
  },
  nameLabel: {
    fontSize: 18,
    color: '#2A2A2A',
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  navBackButton: {
    marginLeft: 20,
    display: 'none',
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  leaveButton: {
    marginRight: 10,
  },
  switchCameraButton: {
    marginRight: 16,
  },
  memberButton: {
    width: 53,
    height: 28,
    backgroundColor: 'rgba(30, 39, 64, 0.4000)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
    marginRight: 2,
  },
  memberCountLabel: {
    fontSize: 14,
    color: 'white',
    marginLeft: 3,
  },
  memberRedDot: {
    backgroundColor: '#FF0D23',
    borderRadius: 1000,
    width: 8,
    height: 8,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  startLiveButtonCon: {
    position: 'absolute',
    width: '100%',
    zIndex: 12,
    bottom: 48.5,
    alignItems: 'center',
  },
  dismissArea: {
    zIndex: 11,
    width: '100%',
    top: 80,
    position: 'absolute',
  },
  noHostBg: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noHostTips: {
    width: 330,
    height: 90,
    fontSize: 14,
    lineHeight: 45,
    color: 'white',
    textAlign: 'center',
  },
});
