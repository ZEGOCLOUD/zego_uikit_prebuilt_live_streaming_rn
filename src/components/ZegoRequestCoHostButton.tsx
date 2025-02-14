import React from "react";
import { ZegoTranslationText, ZegoInvitationType, ZegoLiveStatus, ZegoToastType } from "../services/defines";
import { ZegoSendInvitationButton, ZegoUIKitReport } from '@zegocloud/zego-uikit-rn';

export default function ZegoRequestCoHostButton(props: any) {
    const { 
        hostID,
        liveStatus,
        onRequestSuccessfully,
        setIsToastVisable,
        setToastExtendedData,
    } = props;

    // Verify whether invitations can be sent
    const willPressedHandle = () => {
        let result = true;
        if (!hostID) {
            setIsToastVisable(true);
            setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.requestCoHostFailed });
            result = false;
        } else if (liveStatus !== ZegoLiveStatus.start) {
            setIsToastVisable(true);
            setToastExtendedData({ type: ZegoToastType.error, text: ZegoTranslationText.requestCoHostFailed });
            result = false;
        }
        return result;
    }
    const pressedHandle = ({invitationID}) => {
        ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/invite', {
            call_id: invitationID,
        });
        setIsToastVisable(true);
        setToastExtendedData({ type: ZegoToastType.success, text: ZegoTranslationText.sendRequestCoHostToast });
        onRequestSuccessfully();
    };

    return (
        <ZegoSendInvitationButton
            icon={require('../resources/icon_request_cohost.png')}
            backgroundColor={'rgba(30, 39, 64, 0.4)'}
            width={165}
            height={36}
            fontSize={13}
            color='#fff'
            text={ZegoTranslationText.requestCoHostButton}
            verticalLayout={false}
            invitees={[hostID]}
            type={ZegoInvitationType.requestCoHost}
            onWillPressed={willPressedHandle}
            onPressed={pressedHandle}
        ></ZegoSendInvitationButton>
    )
}