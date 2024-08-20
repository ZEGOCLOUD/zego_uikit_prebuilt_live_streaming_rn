import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export const zloginfo = (...msg: any[]) => {
    ZegoUIKit.kitLogInfo('PrebuiltLiveStreaming', ...msg);
}
export const zlogwarning = (...msg: any[]) => {
    ZegoUIKit.kitLogWarning('PrebuiltLiveStreaming', ...msg);
}

export const zlogerror = (...msg: any[]) => {
    ZegoUIKit.kitLogError('PrebuiltLiveStreaming', ...msg);
}