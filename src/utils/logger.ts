import {ZegoUIKitLogger} from '@zegocloud/zego-uikit-rn';

export const zloginfo = (...msg: any[]) => {
    ZegoUIKitLogger.logInfo('PrebuiltLiveStreaming', ...msg);
}
export const zlogwarning = (...msg: any[]) => {
    ZegoUIKitLogger.logWarning('PrebuiltLiveStreaming', ...msg);
}

export const zlogerror = (...msg: any[]) => {
    ZegoUIKitLogger.logError('PrebuiltLiveStreaming', ...msg);
}