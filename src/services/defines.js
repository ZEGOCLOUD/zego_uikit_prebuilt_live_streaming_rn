class ZegoDialogInfo {
    title = '';
    message = '';
    cancelButtonName = 'Cancel';
    confirmButtonName = 'OK';
    constructor({ title, message, cancelButtonName, confirmButtonName }) {
        this.title = title;
        this.message = message;
        this.cancelButtonName = cancelButtonName;
        this.confirmButtonName = confirmButtonName;
    }
};
const ZegoTranslationText = {
    startLiveStreamingButton: "Start",
    endCoHostButton: "End",
    requestCoHostButton: "Apply to co-host",
    cancelRequestCoHostButton: "Cancel the application",
    removeCoHostButton: "Remove the co-host",
    inviteCoHostButton: "Invite %0 to co-host",
    cancelMenuDialogButton: "Cancel",

    noHostOnline: "No host is online.",
    memberListTitle: "Attendance",

    sendRequestCoHostToast: "You are applying to be a co-host, please wait for confirmation.", // green
    hostRejectCoHostRequestToast: "Your request to co-host with the host has been refused.", // red
    inviteCoHostFailedToast: "Failed to connect with the co-host, please try again.", // red
    repeatInviteCoHostFailedToast: "You've sent the co-host invitation, please wait for confirmation.", // red
    audienceRejectInvitationToast: "%0 refused to be a co-host.", // red
    requestCoHostFailed: "Failed to apply for connection.", // red
    receivedRequestCoHostToast: "%0 wants to co-host with you.", // green
    inviteCoHostSuccessfullyToast: "Sent the invitation successfully.", // green

    cameraPermissionSettingDialogInfo: new ZegoDialogInfo({
        title: "Can not use Camera!",
        message: "Please enable camera access in the system settings!",
        cancelButtonName: "Cancel",
        confirmButtonName: "Settings"
    }),
    microphonePermissionSettingDialogInfo: new ZegoDialogInfo({
        title: "Can not use Microphone!",
        message: "Please enable microphone access in the system settings!",
        cancelButtonName: "Cancel",
        confirmButtonName: "Settings"
    }),
    receivedCoHostInvitationDialogInfo: new ZegoDialogInfo({
        title: "Invitation",
        message: "The host is inviting you to co-host.",
        cancelButtonName: "Disagree",
        confirmButtonName: "Agree"
    }),
    endConnectionDialogInfo: new ZegoDialogInfo({
        title: "End the connection",
        message: "Do you want to end the cohosting?",
    }),
};
const ZegoRole = {
    host: 0,
    coHost: 1,
    audience: 2,
};
const ZegoLiveStatus = {
    default: 0,
    start: 1,
};
const ZegoInvitationType = {
    requestCoHost: 2,
    inviteToCoHost: 3,
    removeCoHost: 4,
};
const ZegoCoHostConnectState = {
    idle: 0,
    connecting: 1,
    connected: 2,
};
const ZegoToastType = {
    default: 0,
    info: 1,
    success: 2,
    warning: 3,
    error: 4,
};

const HOST_DEFAULT_CONFIG = {
    role: ZegoRole.host,
    confirmDialogInfo: new ZegoDialogInfo({
        title: "Stop the live",
        message: "Are you sure to stop the live?",
        cancelButtonName: "Cancel",
        confirmButtonName: "Stop it",
    }),
    showSoundWavesInAudioMode: true,
    turnOnCameraWhenJoining: true,
    turnOnMicrophoneWhenJoining: true,
    useSpeakerWhenJoining: true,
    showInRoomMessageButton: true,
};
const AUDIENCE_DEFAULT_CONFIG = {
    role: ZegoRole.audience,
    showSoundWavesInAudioMode: true,
    turnOnCameraWhenJoining: false,
    turnOnMicrophoneWhenJoining: false,
    useSpeakerWhenJoining: true,
    showInRoomMessageButton: true,
};

export {
    HOST_DEFAULT_CONFIG,
    AUDIENCE_DEFAULT_CONFIG,
    ZegoTranslationText,
    ZegoRole,
    ZegoLiveStatus,
    ZegoInvitationType,
    ZegoCoHostConnectState,
    ZegoToastType,
};