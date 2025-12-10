import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Orientation, { OrientationType } from 'react-native-orientation-locker';

import ZegoUIKit, {
  ZegoAudioVideoContainer,
  ZegoAudioVideoResourceMode,
  ZegoInRoomMessageInput,
  ZegoInRoomMessageView,
  ZegoLayoutMode,
  ZegoRoomPropertyUpdateType,
  ZegoSwitchCameraButton,
  ZegoUIKitPluginType,
  ZegoUIKitReport,
  ZegoUIKitVideoConfig,
} from '@zegocloud/zego-uikit-rn';

import ZegoAudioVideoForegroundView from './components/ZegoAudioVideoForegroundView';
import ZegoBottomBar from './components/ZegoBottomBar';
import ZegoCoHostMenuDialog from "./components/ZegoCoHostMenuDialog";
import ZegoDialog from "./components/ZegoDialog";
import ZegoLiveStreamingClock from './components/ZegoLiveStreamingClock'
import ZegoLiveStreamingMemberList from './components/ZegoLiveStreamingMemberList';
import ZegoMenuBarButtonName from './components/ZegoMenuBarButtonName';
import ZegoStartLiveButton from './components/ZegoStartLiveButton';
import ZegoToast from "./components/ZegoToast";
import ZegoTopBar from "./components/ZegoTopBar";
import ZegoUIKitPrebuiltLiveStreamingFloatingMinimizedView from "./components/ZegoUIKitPrebuiltLiveStreamingFloatingMinimizedView";
import { onRoomUserUpdateEvents, offRoomUserUpdateEvents } from './event/roomUserUpdateEvent';
import {
  HOST_DEFAULT_CONFIG,
  AUDIENCE_DEFAULT_CONFIG,
  ZegoCoHostConnectState,
  ZegoInvitationType,
  ZegoLiveStreamingRole,
  ZegoLiveStatus,
  ZegoToastType,
  ZegoTranslationText,
} from "./services/defines";
import MinimizingHelper from "./services/minimizing_helper";
import ZegoPrebuiltPlugins from './services/plugins';
import PrebuiltHelper from "./services/prebuilt_helper";
import { getShortName, grantPermissions } from './utils';
import { useKeyboard } from './utils/keyboard';
import { zloginfo, zlogwarning } from './utils/logger';

export {
  ZegoLiveStreamingRole,
  ZegoMenuBarButtonName,
  HOST_DEFAULT_CONFIG,
  AUDIENCE_DEFAULT_CONFIG,
  ZegoUIKitPrebuiltLiveStreamingFloatingMinimizedView,
};

// https://github.com/react-native-community/hooks#usekeyboard
function ZegoUIKitPrebuiltLiveStreaming(props: any, ref: React.Ref<unknown>) {
  const TAG = 'ZegoUIKitPrebuiltLiveStreaming';

  const insets = useSafeAreaInsets();

  let { appID, appSign, userID, userName, liveID, config, plugins = [] } = props;
  const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
  if (isMinimizeSwitch) {
    // const initAppInfo = MinimizingHelper.getInstance().getInitAppInfo();
    // const initUser = MinimizingHelper.getInstance().getInitUser();
    // const initLiveID = MinimizingHelper.getInstance().getInitRoomID();
    // const initConfig = MinimizingHelper.getInstance().getInitConfig();
    // const initPlugins = MinimizingHelper.getInstance().getInitPlugins();
    // appID = initAppInfo.appID;
    // appSign = initAppInfo.appSign
    // userID = initUser.userID;
    // userName = initUser.userName;
    // liveID = initLiveID;
    // config = initConfig;
    // plugins = initPlugins;
  } else {
    MinimizingHelper.getInstance().notifyEntryNormal();
    config.role === undefined && (config.role = ZegoLiveStreamingRole.audience);
    Object.assign(ZegoTranslationText, config.translationText || {});
    config.deviceConfirmDialogInfo === undefined && (config.deviceConfirmDialogInfo = {});
    MinimizingHelper.getInstance().setInitParams(appID, appSign, userID, userName, liveID, config);
  }

  const showDefaultDeviceOnDialog = (isCamera: boolean, formUser: any) => {
    zloginfo('########showDefaultDeviceOnDialog', formUser, isCamera);
    return new Promise<void>((resolve, reject) => {
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
    // turnOnCameraWhenJoining = true,
    // turnOnMicrophoneWhenJoining = true,
    // useSpeakerWhenJoining = true,
    audioVideoViewConfig = {},
    bottomMenuBarConfig = {},
    topMenuBarConfig = {},
    memberListConfig = {},
    inRoomMessageViewConfig = {},
    confirmDialogInfo = {},
    onLeaveLiveStreaming,
    onLeaveLiveStreamingConfirming,
    onLiveStreamingEnded,
    onStartLiveButtonPressed,
    startLiveButtonBuilder,
    markAsLargeRoom = false,
    // @ts-ignore
    onCameraTurnOnByOthersConfirmation = showDefaultDeviceOnDialog.bind(this, true),
    // @ts-ignore
    onMicrophoneTurnOnByOthersConfirmation = showDefaultDeviceOnDialog.bind(this, false),
    durationConfig = {},
    logoutSignalingPluginOnLeaveLiveStreaming = true,
    showNoHostOnlineTipAfterSeconds = 3,
    audienceAudioVideoResourceMode = ZegoAudioVideoResourceMode.Default,
    video = ZegoUIKitVideoConfig.preset540P,
    roomConfig = {},
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
    avatarBuilder,
  } = memberListConfig;
  const { itemBuilder: messageItemBuilder } = inRoomMessageViewConfig;
  const {
    showInRoomMessageButton = true,
    hostButtons = [ZegoMenuBarButtonName.toggleCameraButton, ZegoMenuBarButtonName.toggleMicrophoneButton, ZegoMenuBarButtonName.switchCameraButton],
    coHostButtons = [ZegoMenuBarButtonName.toggleCameraButton, ZegoMenuBarButtonName.toggleMicrophoneButton, ZegoMenuBarButtonName.switchCameraButton, ZegoMenuBarButtonName.coHostControlButton],
    audienceButtons = plugins && plugins.length && plugins.find((plugin: any) => plugin.ZIMConnectionState) ? [ZegoMenuBarButtonName.coHostControlButton] : [],
    hostExtendButtons = [],
    coHostExtendButtons = [],
    audienceExtendButtons = [],
    maxCount = 5,
    // toggleCameraBuilder(isOn)
    // toggleMicrophoneBuilder(isOn)
    // switchCameraBuilder(isFront)
    // switchAudioOutputBuilder(deviceType)
      // ZegoAudioRouteSpeaker=(0) ZegoAudioRouteHeadphone=(1) ZegoAudioRouteBluetooth=(2) ZegoAudioRouteReceiver=(3) ZegoAudioRouteExternalUSB=(4) ZegoAudioRouteAirPlay=(5)
    // leaveBuilder
    // enableChatBuilder(enableChat)
    // chatBuilder(isChatOn)
    buttonBuilders = {},
  } = bottomMenuBarConfig;
  const {
    buttons = [ZegoMenuBarButtonName.leaveButton],
    showMemberListButton = true,
    showHostLabel = true,
    // leaveBuilder
    // minimizingBuilder
    // memberBuilder(memberCount, requestCoHostCount)
    buttonBuilders: topButtonBuilders = {},
  } = topMenuBarConfig;
  const {
    isVisible = true,
    onDurationUpdate
  } = durationConfig;
  const {
    onUsersEnter,
    onUsersLeave,
  } = roomConfig;

  const stateData = useRef(PrebuiltHelper.getInstance().getStateData());

  const [turnOnCameraWhenJoining, setTurnOnCameraWhenJoining] =
    useState(
      stateData.current.turnOnCameraWhenJoining !== undefined ?
        stateData.current.turnOnCameraWhenJoining :
        (config.turnOnCameraWhenJoining));
  const [turnOnMicrophoneWhenJoining, setTurnOnMicrophoneWhenJoining] =
    useState(
      stateData.current.turnOnMicrophoneWhenJoining !== undefined ?
        stateData.current.turnOnMicrophoneWhenJoining :
        (config.turnOnMicrophoneWhenJoining));
  const [useSpeakerWhenJoining, setUseSpeakerWhenJoining] =
    useState(
      stateData.current.useSpeakerWhenJoining !== undefined ?
        stateData.current.useSpeakerWhenJoining :
        (config.useSpeakerWhenJoining));


  const keyboardHeight = useKeyboard();
  const [textInputVisable, setTextInputVisable] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [textInputHeight, setTextInputHeight] = useState(45);
  const [role, setRole] = useState(stateData.current.role !== undefined ? stateData.current.role : config.role);
  const [hostID, setHostID] = useState(stateData.current.hostID || undefined);
  const [liveStatus, setLiveStatus] = useState(stateData.current.liveStatus !== undefined ? stateData.current.liveStatus : ''); // init: '' default: 0, start: 1
  const [memberCount, setMemberCount] = useState(stateData.current.memberCount || 1);
  const [isMemberListVisable, setIsMemberListVisable] = useState(stateData.current.isMemberListVisable || false);
  const [isPluginsInit, setIsPluginsInit] = useState(false);
  const [requestCoHostCount, setRequestCoHostCount] = useState(stateData.current.requestCoHostCount || 0);
  const [memberConnectStateMap, setMemberConnectStateMap] = useState(stateData.current.memberConnectStateMap || {} as any); // The connection status of the current member
  const [isCoHostDialogVisable, setIsCoHostDialogVisable] = useState(false);
  const [coHostDialogExtendedData, setCoHostDialogExtendedData] = useState({} as any);
  const [isToastVisable, setIsToastVisable] = useState(false);
  const [toastExtendedData, setToastExtendedData] = useState({} as any);

  PrebuiltHelper.getInstance().notifyZegoDialogTrigger(stateData.current.isDialogVisable || false);
  const [dialogExtendedData, setDialogExtendedData] = useState(stateData.current.dialogExtendedData || {} as any);
  const clockRef = useRef<any>();

  const [orientationState, setOrientationState] = useState<OrientationType>(OrientationType.UNKNOWN);

  const [isShowNoHostOnlineTip, setShowNoHostOnlineTip] = useState(false);
  const showNoHostOnlineTipTimeoutRef = useRef(null);
  const [systemMessageList, setSystemMessageList] = useState([] as any[]);

  if (stateData.current.callbackID) {
    stateData.current.callbackID  = 'ZegoUIKitPrebuiltLiveStreaming' +
    String(Math.floor(Math.random() * 10000));
  }
  const callbackID = stateData.current.callbackID;

  const hideCountdownOnToastLimit = 3;
  const hideCountdownOnDialogLimit = 60;

  let hideCountdownOnToast = hideCountdownOnToastLimit;

  const hideCountdownOn_Dialog = useRef(hideCountdownOnDialogLimit);
  const hideCountdownOn_DialogTimer = useRef(null);

  const liveStreamingTiming = useRef(stateData.current.duration || 0);

  const realTimeData = useRef(PrebuiltHelper.getInstance().getRealTimeData()); // Resolve the problem where closures cannot obtain new values, add as needed
  if (!isMinimizeSwitch) {
    realTimeData.current.role = config.role;
  }

  const isIgnore = useRef(false); // Resolved callback delay in receiving room attached message
  const shouldSortHostAtFirst = useRef(true);
  const debounce = useRef(false);

  const isPageInBackground = () => {
    const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
    zloginfo('######isPageInBackground', isMinimize);
    return isMinimize;
  }
  const registerPluginCallback = () => {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }: any) => {
        zloginfo(`onInvitationReceived implement by ${TAG}, callID: ${callID}, type: ${type}, inviter: ${JSON.stringify(inviter)}, data: ${data}`);
        zloginfo('[Prebuilt]onInvitationReceived', JSON.stringify(realTimeData.current), requestCoHostCount);

        if (type === ZegoInvitationType.requestCoHost && userID === realTimeData.current.hostID) {
          // The audience created a cohost request
          ZegoUIKitReport.reportEvent('livestreaming/cohost/host/received', {
            call_id: callID,
            audience_id: inviter.id,
            extended_data: data
          });

          realTimeData.current.requestCoHostCount += 1;
          stateData.current.requestCoHostCount = realTimeData.current.requestCoHostCount;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          setIsToastVisable(true);
          setToastExtendedData({ type: ZegoToastType.success, text: ZegoTranslationText.receivedRequestCoHostToast.replace('%0', inviter.id) });

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.connecting;
          stateData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.connecting;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          setTimeout(() => {
            // The sorting will not be triggered if the member list pop-up is not reopened, the sorting must be forced
            ZegoUIKit.forceSortMemberList();
          }, 50);
        } else if (type === ZegoInvitationType.inviteToCoHost) {
          // The audience is invited to connect the cohost by host
          ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/received', {
            call_id: callID,
            host_id: inviter.id,
            extended_data: data
          });

          const temp = {
            title: ZegoTranslationText.receivedCoHostInvitationDialogInfo.title,
            content: ZegoTranslationText.receivedCoHostInvitationDialogInfo.message,
            cancelText: ZegoTranslationText.receivedCoHostInvitationDialogInfo.cancelButtonName,
            okText: ZegoTranslationText.receivedCoHostInvitationDialogInfo.confirmButtonName,
            onCancel: () => {
              // Refuse the cohost request of the host
              zloginfo('[onInvitationReceived][inviteToCoHost][onCancel]')
              ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/respond', {
                call_id: callID,
                action: 'refuse'
              });

              ZegoUIKit.getSignalingPlugin().refuseInvitation(inviter.id).then(() => {
                realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
                stateData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
                setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

                ZegoUIKit.turnCameraOn('', false);
                ZegoUIKit.turnMicrophoneOn('', false);
                setIsDialogVisableHandle(false);
              });
            },
            onOk: () => {
              // Accept the cohost request of the host
              zloginfo('[onInvitationReceived][inviteToCoHost][onOk]')
              ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/respond', {
                call_id: callID,
                action: 'accept'
              });

              ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id).then(async () => {
                realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.connected;
                stateData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.connected;
                setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
                try {
                  await grantPermissions();
                } catch (error) {
                }
                ZegoUIKit.turnCameraOn('', true);
                ZegoUIKit.turnMicrophoneOn('', true);
                setIsDialogVisableHandle(false);

                setRole(ZegoLiveStreamingRole.coHost);
                realTimeData.current.role = ZegoLiveStreamingRole.coHost;
                stateData.current.role = ZegoLiveStreamingRole.coHost;
              });
            }
          }
          setIsDialogVisableHandle(true);
          setDialogExtendedData(temp);
          stateData.current.dialogExtendedData = temp;
        } else if (type == ZegoInvitationType.removeCoHost) {
          // The audience was forced off the cohost by host
          ZegoUIKitReport.reportEvent('livestreaming/cohost/cohost/received', {
            call_id: callID,
            host_id: inviter.id,
            action: 'remove',
            extended_data: data
          });

          ZegoUIKit.turnCameraOn('', false);
          ZegoUIKit.turnMicrophoneOn('', false);

          realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
          stateData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          setRole(ZegoLiveStreamingRole.audience);
          realTimeData.current.role = ZegoLiveStreamingRole.audience;
          stateData.current.role = ZegoLiveStreamingRole.audience;
        }
      }, TAG);
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ inviter }: any) => {
        if (userID === realTimeData.current.hostID) {
          // The audience canceled the cohost request
          realTimeData.current.requestCoHostCount -= 1;
          stateData.current.requestCoHostCount = realTimeData.current.requestCoHostCount;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          stateData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter }: any) => {
        zloginfo(`onInvitationTimeout implement by ${TAG}, callID: ${callID}, inviter: ${JSON.stringify(inviter)}`);

        if (userID === realTimeData.current.hostID) {
          // The host did not process the cohost request, resulting in a timeout
          ZegoUIKitReport.reportEvent('livestreaming/cohost/host/respond', {
            call_id: callID,
            action: 'timeout'
          });

          realTimeData.current.requestCoHostCount -= 1;
          stateData.current.requestCoHostCount = realTimeData.current.requestCoHostCount;
          setRequestCoHostCount(realTimeData.current.requestCoHostCount);

          realTimeData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          stateData.current.memberConnectStateMap[inviter.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        } else {
          // i'm not host, i don't process host's request, , resulting in a timeout
          ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/respond', {
              call_id: callID,
              action: 'timeout'
          });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ invitee }: any) => {
        if (userID === realTimeData.current.hostID) {
          // The audience accept the cohost request
          realTimeData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.connected;
          stateData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.connected;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          // Reset invitation timer
          setCoHostDialogExtendedData({ resetTimer: true, inviteeID: invitee.id});
        }
      });
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ invitee }: any) => {
        if (userID === realTimeData.current.hostID) {
          // The audience reject the cohost request
          realTimeData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.idle;
          stateData.current.memberConnectStateMap[invitee.id] = ZegoCoHostConnectState.idle;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

          setIsToastVisable(true);
          setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.audienceRejectInvitationToast.replace('%0', invitee.id) });

          // Reset invitation timer
          setCoHostDialogExtendedData({ resetTimer: true, inviteeID: invitee.id });
        }
      });
      ZegoUIKit.getSignalingPlugin().onInRoomTextMessageReceived(callbackID, (message: any) => {
        zloginfo('[Prebuilt]onInRoomTextMessageReceived', message);
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
    // @ts-ignore
    clearInterval(hideCountdownOn_DialogTimer.current);
    (hideCountdownOn_DialogTimer.current as any) = null;
    (hideCountdownOn_Dialog.current as any) = hideCountdownOnDialogLimit;
  }
  const startDialogTimer = () => {
    // @ts-ignore
    clearInterval(hideCountdownOn_DialogTimer.current);
    (hideCountdownOn_DialogTimer.current as any) = setInterval(() => {
      if (hideCountdownOn_Dialog.current === 0) {
        setIsDialogVisableHandle(false);
      } else {
        (hideCountdownOn_Dialog.current as any) -= 1;
      }
    }, 1000);
  }
  const startClock = () => {
    clockRef.current && clockRef.current.start()
  }

  const stopClock = () => {
    clockRef.current && clockRef.current.stop()
  }

  const ondurationchange = (duration: number) => {
    liveStreamingTiming.current = duration;
    typeof onDurationUpdate === 'function' && onDurationUpdate(duration);
  }
  const setIsDialogVisableHandle = (visable: boolean) => {
    if (visable) {
      startDialogTimer();
    } else {
      initDialogTimer();
      setDialogExtendedData({});
      stateData.current.dialogExtendedData = {};
    }
    PrebuiltHelper.getInstance().notifyZegoDialogTrigger(visable);
    stateData.current.isDialogVisable = visable;
  }
  const startLiveStreamingTimingTimer = useCallback(() => {
    zloginfo(`######startLiveStreamingTimingTimer######## isVisible: ${isVisible} timing: ${liveStreamingTiming.current}`);
    if (!isVisible) return;
    startClock();
  }, []);

  const initLiveStreamingTimingTimer = () => {
    zloginfo('########initLiveStreamingTimingTimer');
    stopClock();
    liveStreamingTiming.current = 0;
  }

  const orientationChangedListener = (orientation: OrientationType) => {
    var orientationValue = 0;
    if (orientation === 'PORTRAIT') {
      orientationValue = 0;
    } else if (orientation === 'LANDSCAPE-LEFT') {
      orientationValue = 1;
    } else if (orientation === 'LANDSCAPE-RIGHT') {
      orientationValue = 3;
    }
    zloginfo('Orientation changed:', orientation, orientationValue);
    ZegoUIKit.setAppOrientation(orientationValue);
    setOrientationState(orientation);
  }

  const executeLeaveCallback = () => {
    if (typeof onLeaveLiveStreaming == 'function') {
      zloginfo(`[ZegoUIKitPrebuiltLiveStreaming][onLeaveLiveStreaming] notify will`)
      onLeaveLiveStreaming(liveStreamingTiming.current)
      zloginfo(`[ZegoUIKitPrebuiltLiveStreaming][onLeaveLiveStreaming] notify succeed`)
    } else {
      zloginfo(`[ZegoUIKitPrebuiltLiveStreaming][onLeaveLiveStreaming] is not configured`)
    }
  }

  useImperativeHandle(ref, () => ({
    leave: async (showConfirmation = false) => {
      if (debounce.current) return;
      if (!showConfirmation) {
        (debounce.current as any) = true;
        await tempHandle();
        ZegoUIKit.leaveRoom();
        executeLeaveCallback();
        (debounce.current as any) = false;
      } else {
        (debounce.current as any) = true;
        onLeaveLiveStreamingConfirmingWrap(onLeaveLiveStreamingConfirming).then(() => {
          ZegoUIKit.leaveRoom();
          executeLeaveCallback();
          (debounce.current as any) = false;
        });
      }
    },
    minimizeWindow: () => {
      MinimizingHelper.getInstance().minimizeWindow();
    },
    sendSystemMessage: (message: string) => {
      const systemMessage = {
        type: 'system',
        message,
        sendTime: Date.now(),
      };
      setSystemMessageList((arr) => [...arr, systemMessage]);
    }
  }));

  useEffect(() => {
    ZegoUIKit.onRoomStateChanged(callbackID, () => {
      if (ZegoUIKit.isRoomConnected()) {
        // Anchor set host
        zloginfo('########onRoomStateChanged anchor set host', realTimeData.current);
        if (realTimeData.current.role === ZegoLiveStreamingRole.host && !realTimeData.current.hostID) {
          ZegoUIKit.updateRoomProperties({ host: userID, live_status: `${ZegoLiveStatus.default}` });
          // Unequal results update the local value first
          setHostID(userID);
          realTimeData.current.hostID = userID;
          stateData.current.hostID = userID;

          // @ts-ignore
          setLiveStatus(ZegoLiveStatus.default);
          realTimeData.current.liveStatus = ZegoLiveStatus.default;
          stateData.current.liveStatus = ZegoLiveStatus.default;
          zloginfo('########onRoomStateChanged anchor set host end', realTimeData.current);
        }
      }
    });
    onRoomUserUpdateEvents({
      callbackID,
      onMemberCountChange: setMemberCount,
      updateStateData: (key, value) => {
        (stateData.current as any)[key] = value;
      },
      onUsersEnter,
      onUsersLeave,
    });
    ZegoUIKit.onRoomPropertiesFullUpdated(callbackID, (keys: string[], oldRoomProperties: any, roomProperties: any, type: any) => {
      zloginfo('########onRoomPropertiesFullUpdated', keys, oldRoomProperties, roomProperties, type);
    });
    ZegoUIKit.onRoomPropertyUpdated(callbackID, (key: string, oldValue: any, value: any, type: any) => {
      zloginfo('########onRoomPropertyUpdated', key, oldValue, value, type);
      // Resolved callback delay in receiving room attached message
      if (realTimeData.current.role === ZegoLiveStreamingRole.host && type === ZegoRoomPropertyUpdateType.remote) {
        // Set again, update uikit data
        zloginfo('########Set again, update uikit data', userID, realTimeData.current.liveStatus);
        (isIgnore.current as any) = true;
        ZegoUIKit.updateRoomProperties({ host: userID, live_status: `${realTimeData.current.liveStatus}` });
        return;
      }
      if (isIgnore.current) {
        zloginfo('########onRoomPropertyUpdated ignore');
        (isIgnore.current as any) = false;
        return;
      }
      if (key === 'host') {
        setHostID(value);
        realTimeData.current.hostID = value;
        stateData.current.hostID = value;
      } else if (key === 'live_status') {
        let temp = value ? parseInt(value) : '';
        if (temp === ZegoLiveStatus.default) {
          // The live_status is set to 0 before the host enters the room
          zloginfo('########onRoomPropertyUpdated Update the reorder identity', true);
          if (realTimeData.current.role !== ZegoLiveStreamingRole.host) {
            // When the audience character receives the broadcast notification, stop pull all streams
            // Uikit is also pulled by default, so you have to stop here as well
            ZegoUIKit.stopPlayingAllAudioVideo();
            if (oldValue === `${ZegoLiveStatus.start}`) {
              // Hide the host's invitation to cohost dialog
              setIsDialogVisableHandle(false);
              initLiveStreamingTimingTimer();

              // Cancel the invitation to cohost
              if (ZegoUIKit.getSignalingPlugin()) {
                ZegoUIKit.getSignalingPlugin().cancelInvitation([realTimeData.current.hostID]);
              }
              ZegoUIKit.turnCameraOn('', false);
              ZegoUIKit.turnMicrophoneOn('', false);

              // Update role and memberConnectStateMap
              setRole(ZegoLiveStreamingRole.audience);
              realTimeData.current.role = ZegoLiveStreamingRole.audience;
              stateData.current.role = ZegoLiveStreamingRole.audience;

              realTimeData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
              stateData.current.memberConnectStateMap[userID] = ZegoCoHostConnectState.idle;
              setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });

              typeof onLiveStreamingEnded === 'function' && onLiveStreamingEnded(liveStreamingTiming.current);
            }
          }
        } else {
          // The launch needs to be sorted, with the owner at the top of the list
          (shouldSortHostAtFirst.current as any) = true;
          ZegoUIKit.forceSortAudioVideoList();

          ZegoUIKit.startPlayingAllAudioVideo();
        }

        // @ts-ignore
        setLiveStatus(temp);
        realTimeData.current.liveStatus = temp;
        stateData.current.liveStatus = temp;
      }
    });
    ZegoUIKit.onUserInfoUpdate(callbackID, (userInfo: any) => {
      // This callback is executed before onAudioVideoAvailable and onAudioVideoUnavailable
      const { userID, isMicDeviceOn, isCameraDeviceOn } = userInfo;
      if (userID === realTimeData.current.hostID && !isMicDeviceOn && !isCameraDeviceOn) {
        // Host turn off their cameras and microphones, cohost will fill in the bit, so it needs to be reordered next time
        zloginfo('########onAudioVideoUnavailable Update the reorder identity', true);
        (shouldSortHostAtFirst.current as any) = true;
      }
    });
    ZegoUIKit.onAudioVideoAvailable(callbackID, (userList: any[]) => {
      zloginfo('########onAudioVideoAvailable', userList);
      userList.forEach((userInfo: any) => {
        // Not in memberConnectStateMap but already connected
        if (realTimeData.current.hostID !== userInfo.userID) {
          realTimeData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.connected;
          stateData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.connected;
          setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
        }
      });
    });
    ZegoUIKit.onAudioVideoUnavailable(callbackID, (userList: any[]) => {
      userList.forEach((userInfo) => {
        if (userInfo.userID === realTimeData.current.hostID) {
          // Host turn off their cameras and microphones, cohost will fill in the bit, so it needs to be reordered next time
          // Move to the onUserInfoUpdate callback for processing
        } else {
          if (userInfo.userID !== userID) {
            realTimeData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.idle;
            stateData.current.memberConnectStateMap[userInfo.userID] = ZegoCoHostConnectState.idle;
            setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
          } else {
            // Do not deal with
          }
        }
      })
    });
    ZegoUIKit.onTurnOnYourCameraRequest(callbackID, (formUser: any) => {
      zloginfo('########onTurnOnYourCameraRequest', formUser);
      onCameraTurnOnByOthersConfirmation && onCameraTurnOnByOthersConfirmation(formUser).then(async () => {
        // Allow to open
        try {
          await grantPermissions();
        } catch (error) {
        }
        ZegoUIKit.turnCameraOn('', true);
      });
    });
    ZegoUIKit.onTurnOnYourMicrophoneRequest(callbackID, (formUser: any) => {
      zloginfo('########onTurnOnYourMicrophoneRequest', formUser);
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
      executeLeaveCallback();
    });
    ZegoUIKit.onInRoomCommandReceived(callbackID, (fromUser: any, command: any) => {
      zloginfo('[Prebuilt]onInRoomCommandReceived', fromUser, command);
    });
    ZegoUIKit.onMicrophoneOn(callbackID, (targetUserID: string, isOn: boolean) => {
      if (targetUserID === userID && ZegoUIKit.inRoom()) {
        zloginfo('onMicrophoneOn', targetUserID, isOn);
        stateData.current.turnOnMicrophoneWhenJoining = !!isOn;
      }
    });
    ZegoUIKit.onCameraOn(callbackID, (targetUserID: string, isOn: boolean) => {
      if (targetUserID === userID && ZegoUIKit.inRoom()) {
        zloginfo('onCameraOn', targetUserID, isOn);
        stateData.current.turnOnCameraWhenJoining = !!isOn;
      }
    });
    ZegoUIKit.onAudioOutputDeviceChanged(callbackID, (type: number) => {
      zloginfo('onAudioOutputDeviceChanged', type);
      stateData.current.useSpeakerWhenJoining = (type === 0);
    });

    zloginfo(`${TAG} add orientationChangedListener`);
    Orientation.addOrientationListener(orientationChangedListener);
    Orientation.getOrientation((orientation: OrientationType) => {
      zloginfo(`${TAG} getOrientation: ${orientation}`);
      setOrientationState(orientation);
      orientationChangedListener(orientation)
    })

    MinimizingHelper.getInstance().onWindowMinimized(callbackID, () => {
      // Hidden input box
      setTextInputVisable(false);

      // Hide toast
      hideCountdownOnToast = hideCountdownOnToastLimit;
      setIsToastVisable(false);

      // Hide the invitation and remove box at the bottom
      setIsCoHostDialogVisable(false);
      setCoHostDialogExtendedData({});
    });

    // Initialize after use
    MinimizingHelper.getInstance().setIsMinimizeSwitch(false);

    return () => {
      const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
      if (!isMinimizeSwitch) {
        zloginfo(`${TAG} remove orientationChangedListener`);
        Orientation.removeOrientationListener(orientationChangedListener);

        ZegoUIKit.onRoomStateChanged(callbackID);
        offRoomUserUpdateEvents(callbackID);
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

        PrebuiltHelper.getInstance().clearRealTimeData();
        PrebuiltHelper.getInstance().clearState();
        PrebuiltHelper.getInstance().clearNotify();
      }
    };
  }, []);

  useEffect(() => {
    zloginfo(`[ZegoUIKitPrebuiltLiveStreaming] useEffect, userID:${userID}, role:${config.role}, liveID:${liveID}, video:${config.video ? config.video.width : 'undefined'}`);

    let pluginsConfig = {
      logoutSignalingPluginOnLeaveLiveStreaming: (config.logoutSignalingPluginOnLeaveLiveStreaming === false) ? false : true,
    };
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins, pluginsConfig).then((result) => {
      setIsPluginsInit(result);
      MinimizingHelper.getInstance().notifyPrebuiltInit();
      // Register plugin callback
      registerPluginCallback();

      ZegoPrebuiltPlugins.leaveAllRoom().then((result: boolean) => {
        zloginfo('[ZegoUIKitPrebuiltLiveStreaming] Plugin leave all room success.');
        ZegoPrebuiltPlugins.joinRoom(liveID).then((result: boolean) => {
          if (result) {
            zloginfo('[ZegoUIKitPrebuiltLiveStreaming] Plugin join room success.');
          }
        });
      })

      // should called before ZegoUIKit.init
      ZegoUIKit.setVideoConfig(config.video)
      ZegoUIKit.setAudioVideoResourceMode(config.audienceAudioVideoResourceMode);

      ZegoUIKit.init(appID, appSign, { userID: userID, userName: userName }).then(
        () => {
          zloginfo('===zego uikit init success');
          ZegoUIKit.setAudioOutputToSpeaker(useSpeakerWhenJoining);

          if (config.role === ZegoLiveStreamingRole.host || config.role === ZegoLiveStreamingRole.coHost) {
            grantPermissions(() => {
              ZegoUIKit.turnCameraOn('', turnOnCameraWhenJoining);
              ZegoUIKit.turnMicrophoneOn('', turnOnMicrophoneWhenJoining);
              ZegoUIKit.joinRoom(liveID, '', !!markAsLargeRoom);
            });
          } else {
              ZegoUIKit.joinRoom(liveID, '', !!markAsLargeRoom);
          }
        }
      );
    });
    // Initialize after use
    MinimizingHelper.getInstance().setIsMinimizeSwitch(false);

    // @ts-ignore
    showNoHostOnlineTipTimeoutRef.current = setTimeout(() => {
      // After the configured time, if the timer has not been cleared, display the tip.
      setShowNoHostOnlineTip(true);
      zloginfo('showNoHostOnlineTip true when timeout')
    }, config.showNoHostOnlineTipAfterSeconds * 1000);

    return () => {
      zloginfo(`[ZegoUIKitPrebuiltLiveStreaming] useEffect return`);

      // @ts-ignore
      clearTimeout(showNoHostOnlineTipTimeoutRef.current);
      zloginfo('clear showNoHostOnlineTip timeout')

      const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
      if (!isMinimizeSwitch) {
        setIsDialogVisableHandle(false);
        initLiveStreamingTimingTimer();
        ZegoUIKit.leaveRoom();
        unRegisterPluginCallback();
        ZegoPrebuiltPlugins.uninit();

        PrebuiltHelper.getInstance().clearRealTimeData();
        PrebuiltHelper.getInstance().clearState();
        PrebuiltHelper.getInstance().clearNotify();
      }
    };
  }, []);

  useEffect(() => {
    if (liveStatus === ZegoLiveStatus.start) {
      startLiveStreamingTimingTimer()
    }
  }, [liveStatus])

  useEffect(() => {
    // Filter out the value automatically assigned to hostID by the function.
    if (hostID === undefined) {
      return
    }

    zloginfo(`hostID has set: ${hostID}`)
    if (!showNoHostOnlineTipTimeoutRef.current) {
      return
    }

    let hasHost = (hostID !== null && hostID !== '')
    setShowNoHostOnlineTip(!hasHost);
    zloginfo(`showNoHostOnlineTip ${!hasHost} from set hostID`)
    
    clearTimeout(showNoHostOnlineTipTimeoutRef.current);
    zloginfo('clear showNoHostOnlineTip timeout where set hostID')
  }, [hostID])

  const showAudioVideoContainer = () => {
    // @ts-ignore
    return role === ZegoLiveStreamingRole.host || role !== ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start;
  };
  const showStartLiveButton = () => {
    // @ts-ignore
    return role === ZegoLiveStreamingRole.host && hostID && hostID === userID && liveStatus === ZegoLiveStatus.default;
  };
  const showHostAvatar = () => {
    return ((role === ZegoLiveStreamingRole.host && hostID && liveStatus === ZegoLiveStatus.start) || (role !== ZegoLiveStreamingRole.host && hostID)) && showHostLabel;
  };
  const showBottomBar = () => {
    // @ts-ignore
    return role === ZegoLiveStreamingRole.host && hostID && hostID === userID && liveStatus === ZegoLiveStatus.start ||
    role === ZegoLiveStreamingRole.audience || role === ZegoLiveStreamingRole.coHost;
  }
  const showMessageListView = () => {
    // @ts-ignore
    return role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host;
  }
  const onFullPageTouch = () => {
    zloginfo('####onFullPageTouch####');
    hideCountdownOnToast = hideCountdownOnToastLimit;
    setIsToastVisable(false);
    setTextInputVisable(false);
    setIsMemberListVisable(false);
    setIsCoHostDialogVisable(false);
    setCoHostDialogExtendedData({});
    setTextInputHeight(45); // It needs to be reinitialized, otherwise the height will be wrong
    PrebuiltHelper.getInstance().notifyFullPageTouch();

    stateData.current.isMemberListVisable = false;
  };

  useEffect(() => {
    if (!isToastVisable) return
    const closeToast = () => {
      hideCountdownOnToast = hideCountdownOnToastLimit;
      setIsToastVisable(false);
      setToastExtendedData({});
    }
    const closeToastTimer = setInterval(() => {
      hideCountdownOnToast--;
    if (hideCountdownOnToast <= 0) {
      closeToast()
      clearInterval(closeToastTimer);
    }
    }, 1000)
    return () => {
      clearInterval(closeToastTimer);
    }
  }, [isToastVisable])

  const getHostNameByID = (hostID: string) => {
    const userInfo = ZegoUIKit.getUser(hostID) || { };
    const hostName = userInfo.userName || '';
    return hostName;
  };
  const getHostUser = () => {
    return ZegoUIKit.getUser(hostID) || { };
  };
  const onMemberButtonPressed = () => {
    setTextInputVisable(false);
    setIsMemberListVisable(true);
    stateData.current.isMemberListVisable = true;
  };
  const onNavBackPressed = () => {
    const leaveHandle = async () => {
      // Leave the room
      ZegoUIKit.leaveRoom();
      executeLeaveCallback();
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
  const sortAudioVideo = (globalAudioVideoUserList: any[]) => {
    zloginfo('########sortAudioVideo', globalAudioVideoUserList, realTimeData.current.hostID, shouldSortHostAtFirst.current);
    const index = globalAudioVideoUserList.findIndex((userInfo) => userInfo.userID === realTimeData.current.hostID);
    if (shouldSortHostAtFirst.current && index !== -1) {
      // Put host first
      const temp = globalAudioVideoUserList.splice(index, 1)[0];
      globalAudioVideoUserList.unshift(temp);
      // You don't have to deal with the sorting once, because the addition to the internal stream is also added to the end of the queue
      zloginfo('########sortAudioVideo Sort completion and update the reorder identity', false);
      (shouldSortHostAtFirst.current as any) = false;
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
    return new Promise<void>((resolve, reject) => {
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
  const tempHandle = async () => {
    // Intercept confirm
    if (role === ZegoLiveStreamingRole.host) {
      // @ts-ignore
      if (liveStatus === ZegoLiveStatus.start) {
        // Clear room properties
        await ZegoUIKit.updateRoomProperties({ live_status: `${ZegoLiveStatus.default}`, host: '' });
        typeof onLiveStreamingEnded === 'function' && onLiveStreamingEnded(liveStreamingTiming.current);
      } else {
        // Clear room properties
        await ZegoUIKit.updateRoomProperties({ live_status: `${ZegoLiveStatus.default}`, host: '' });
      }
    } else if (role === ZegoLiveStreamingRole.coHost) {

    } else {

    }
  }
  const onLeaveLiveStreamingConfirmingWrap = (onLeaveLiveStreamingConfirming: any) => {
    const temp = onLeaveLiveStreamingConfirming || showDefaultLeaveDialog;
    return new Promise<void>((resolve, reject) => {
      temp().then(async () => {
        await tempHandle();
        resolve();
      }).catch(() => {
        // Intercept confirm cancel
        reject();
      });
    });
  };
  const connectStateChangedHandle = (changedUserID: string, connectState: number, isClosure: boolean) => {
    zloginfo('#########connectStateChangedHandle', changedUserID, connectState, memberConnectStateMap, realTimeData.current.memberConnectStateMap);
    // The audience connection status changes
    changedUserID = changedUserID || userID;
    const temp = connectState === ZegoCoHostConnectState.connected ? ZegoLiveStreamingRole.coHost : ZegoLiveStreamingRole.audience;
    if (!isClosure) {
      // Just take the value in state, because there's no closure
      memberConnectStateMap[changedUserID] = connectState;
      // Rerendering causes realTimeData.current to be empty, so a reassignment is required here
      role !== ZegoLiveStreamingRole.host && (realTimeData.current.role = temp, stateData.current.role = temp);
      realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };
      stateData.current.memberConnectStateMap = { ...memberConnectStateMap };

      role !== ZegoLiveStreamingRole.host && setRole(temp);
      setMemberConnectStateMap({ ...memberConnectStateMap });
    } else {
      // There are closures, status values cannot be used directly
      realTimeData.current.memberConnectStateMap[changedUserID] = connectState;
      stateData.current.memberConnectStateMap[changedUserID] = connectState;
      setMemberConnectStateMap({ ...realTimeData.current.memberConnectStateMap });
      if (realTimeData.current.role !== ZegoLiveStreamingRole.host) {
        setRole(temp);
        realTimeData.current.role = temp;
        stateData.current.role = temp;
      }
    }
  };
  const coHostDisagreeHandle = ({inviterID, callID}: {inviterID: string, callID: string}) => {
    zloginfo(`[coHostDisagreeHandle] inviterID: ${inviterID}, callID: ${callID}`)

    ZegoUIKitReport.reportEvent('livestreaming/cohost/host/respond', {
      call_id: callID,
      action: 'refuse'
    });

    // Just take the value in state, because there's no closure
    memberConnectStateMap[inviterID] = ZegoCoHostConnectState.idle;

    // Rerendering causes realTimeData.current to be empty, so a reassignment is required here
    realTimeData.current.requestCoHostCount = requestCoHostCount - 1;
    stateData.current.requestCoHostCount = realTimeData.current.requestCoHostCount;
    realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };
    stateData.current.memberConnectStateMap = { ...memberConnectStateMap };

    setMemberConnectStateMap({ ...memberConnectStateMap });
    setRequestCoHostCount(requestCoHostCount - 1);
  };
  const coHostAgreeHandle = ({inviterID, callID}: {inviterID: string, callID: string}) => {
    zloginfo(`[coHostAgreeHandle] inviterID: ${inviterID}, callID: ${callID}`)

    ZegoUIKitReport.reportEvent('livestreaming/cohost/host/respond', {
      call_id: callID,
      action: 'accept'
    });

    // Just take the value in state, because there's no closure
    memberConnectStateMap[inviterID] = ZegoCoHostConnectState.connected;

    realTimeData.current.requestCoHostCount = requestCoHostCount - 1;
    stateData.current.requestCoHostCount = realTimeData.current.requestCoHostCount;
    realTimeData.current.memberConnectStateMap = { ...memberConnectStateMap };
    stateData.current.memberConnectStateMap = { ...memberConnectStateMap };

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
            cacheAudioVideoUserList: isMinimizeSwitch ?
              // @ts-ignore
              ZegoUIKit.getAllUsers().filter(user => user.userID && (user.isCameraOn || user.isMicrophoneOn)) :
              null
          }}
          layout={{mode: ZegoLayoutMode.pictureInPicture, config: { removeViewWhenAudioVideoUnavailable: true }}}
          sortAudioVideo={sortAudioVideo}
          foregroundBuilder={foregroundBuilder || (({ userInfo }: any) => <ZegoAudioVideoForegroundView
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
            {isShowNoHostOnlineTip ? <Text style={styles.noHostTips}>{ZegoTranslationText.noHostOnline}</Text> : null}
          </ImageBackground>
        </View>
      </View>
      {/* Top bar */}
      <View style={[styles.topBarContainer, {top: insets.top + 15}]}>
        <View style={styles.left}>
          {topButtonBuilders.hostAvatarBuilder && showHostAvatar()
          ? topButtonBuilders.hostAvatarBuilder(getHostUser())
          : <View style={[styles.hostInfo, showHostAvatar() ? styles.show : null]}>
              <View style={styles.avatar}>
                <Text style={styles.nameLabel}>
                  {getShortName(getHostNameByID(hostID))}
                </Text>
              </View>
              <Text style={styles.hostName}>{getHostNameByID(hostID)}</Text>
          </View>}
          {/* Return home */}
          {/* @ts-ignore */}
          <TouchableOpacity onPress={onNavBackPressed} style={[styles.navBackButton, (role === ZegoLiveStreamingRole.host && hostID && liveStatus !== ZegoLiveStatus.start) ? styles.show : null]}>
            <Image resizeMode='contain' source={require('./resources/icon_nav_back.png')} />
          </TouchableOpacity>
        </View>
        <View style={styles.right}>
          {
            // @ts-ignore
            (role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host) && showMemberListButton ? <TouchableOpacity onPress={onMemberButtonPressed}>
              {
              topButtonBuilders.memberBuilder
              ? topButtonBuilders.memberBuilder(memberCount, requestCoHostCount)
              : <View style={styles.memberButton}>
                <Image source={require('./resources/white_top_button_member.png')} />
                <Text style={styles.memberCountLabel}>{memberCount}</Text>
                { requestCoHostCount ? <View style={styles.memberRedDot}></View> : null }
              </View>}
            </TouchableOpacity> : null
          }
          {
            // @ts-ignore
            role === ZegoLiveStreamingRole.host && liveStatus === ZegoLiveStatus.start || role !== ZegoLiveStreamingRole.host ? <ZegoTopBar
              menuBarButtons={buttons}
              buttonBuilders={topButtonBuilders}
              onLeave={() => {
                executeLeaveCallback();
              }}
              // @ts-ignore
              onLeaveConfirmation={onLeaveLiveStreamingConfirmingWrap.bind(this, onLeaveLiveStreamingConfirming)}
            /> : null
          }
          {
            // @ts-ignore
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
      {/* Timing */}
      {
        isVisible && liveStatus === ZegoLiveStatus.start
          ? <ZegoLiveStreamingClock ref={clockRef} initialDuration={stateData.current.duration} onDurationChange={ondurationchange} />
          : null
      }
      {/* Message list */}
      {
        showMessageListView() && !textInputVisable ? <View style={styles.messageListView}>
          <ZegoInRoomMessageView 
            itemBuilder={messageItemBuilder} 
            style={styles.fillParent}
            systemMessageList={systemMessageList}
          />
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
            avatarBuilder={avatarBuilder}
            onCloseMemberList={() => {
              setIsMemberListVisable(false);
              stateData.current.isMemberListVisable = false;
            }}
            hostID={hostID}
            memberCount={memberCount}
            memberConnectStateMap={memberConnectStateMap}
            onCoHostDisagree={coHostDisagreeHandle}
            onCoHostAgree={coHostAgreeHandle}
            onConnectStateChanged={connectStateChangedHandle}
            setIsToastVisable={(visable: boolean) => setIsToastVisable(visable)}
            setToastExtendedData={(toastExtendedData: any) => setToastExtendedData(toastExtendedData)}
            setIsCoHostDialogVisable={(visable: boolean) => setIsCoHostDialogVisable(visable)}
            setCoHostDialogExtendedData={(coHostDialogExtendedData: any) => setCoHostDialogExtendedData(coHostDialogExtendedData)}
            orientationState={orientationState}
          /> : null
      }
      {/* Cohost dialog */}
      <ZegoCoHostMenuDialog
        visable={isCoHostDialogVisable}
        inviteeID={coHostDialogExtendedData.inviteeID}
        invitationType={coHostDialogExtendedData.invitationType}
        onCancel={coHostDialogExtendedData.onCancel}
        onOk={coHostDialogExtendedData.onOk}
        setIsToastVisable={(visable: boolean) => setIsToastVisable(visable)}
        setToastExtendedData={(toastExtendedData: any) => setToastExtendedData(toastExtendedData)}
        resetTimer={coHostDialogExtendedData.resetTimer}
      />
      {/* Common toast */}
      <ZegoToast
        visable={isToastVisable}
        text={toastExtendedData.text}
        type={toastExtendedData.type}
      />
      <ZegoDialog
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
            top: insets.top + 15 + 40 + 6,
            bottom:
              (Platform.OS == 'ios'
                ? keyboardHeight + textInputHeight
                : textInputHeight) + 40,
          },
        ]}
      />
      {/* Bottom bar */}
      {showBottomBar() ? (
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
                onLeaveLiveStreaming={() => {
                  executeLeaveCallback();
                }}
                // @ts-ignore
                onLeaveLiveStreamingConfirming={onLeaveLiveStreamingConfirmingWrap.bind(this, onLeaveLiveStreamingConfirming)}
                onMessageButtonPress={() => { setTextInputVisable(true) }}
                onConnectStateChanged={connectStateChangedHandle}
                setIsToastVisable={(visable: boolean) => setIsToastVisable(visable)}
                setToastExtendedData={(toastExtendedData: any) => setToastExtendedData(toastExtendedData)}
                setIsDialogVisable={setIsDialogVisableHandle}
                setDialogExtendedData={(dialogExtendedData: any) => {
                  setDialogExtendedData(dialogExtendedData);
                  stateData.current.dialogExtendedData = dialogExtendedData;
                }}
                isPluginsInit={isPluginsInit}
                userID={userID}
                hostID={hostID}
                liveStatus={liveStatus}
                buttonBuilders={buttonBuilders}
                memberConnectState={memberConnectStateMap[userID]}
              />
        ) : null}
      {textInputVisable ? <KeyboardAvoidingView
            style={[styles.fillParent]}
            behavior={Platform.OS == "ios" ? "padding" : "height"}
            keyboardVerticalOffset={(Platform.OS === 'android' && Platform.Version < 35) ? 35 : 0}
          >
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
                  ref={(input: any) => {
                    setTextInput(input);
                  }}
                  // @ts-ignore
                  onContentSizeChange={(height: number) => {
                    // setTextInputHeight(height);
                  }}
                  placeholder={'Say something...'}
                  onSumit={() => {
                    setTextInputVisable(false);
                  }}
                />
              </View>
      </KeyboardAvoidingView> : null}
    </View>
  );
}

export default forwardRef(ZegoUIKitPrebuiltLiveStreaming);

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
    zIndex: 12,
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
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
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
    // marginRight: 2,
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
  }
});
