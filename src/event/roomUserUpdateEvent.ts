import ZegoUIKit from '@zegocloud/zego-uikit-rn';

interface UserUpdateEventParams {
    callbackID: string;
    onMemberCountChange: (count: number) => void;
    updateStateData: (key: string, value: any) => void;
    onUsersEnter?: (users: any[]) => void;
    onUsersLeave?: (users: any[]) => void;
}

export const onRoomUserUpdateEvents = (params: UserUpdateEventParams) => {
    const {
        callbackID,
        onMemberCountChange,
        updateStateData,
        onUsersEnter,
        onUsersLeave,
    } = params;

    const updateMemberCount = () => {
        const count = ZegoUIKit.getAllUsers().length;
        updateStateData('memberCount', count);
        onMemberCountChange(count);
    };

    ZegoUIKit.onUserJoin(callbackID, (userInfoList: any[]) => {
        updateMemberCount();
                
        if (onUsersEnter) {
            onUsersEnter(userInfoList);
        }
    });

    ZegoUIKit.onUserLeave(callbackID, (userInfoList: any[]) => {
        updateMemberCount();
        if (onUsersLeave) {
            onUsersLeave(userInfoList);
        }
    });
}

export const offRoomUserUpdateEvents = (callbackID: string) => {
    ZegoUIKit.onUserJoin(callbackID);
    ZegoUIKit.onUserLeave(callbackID);
}
