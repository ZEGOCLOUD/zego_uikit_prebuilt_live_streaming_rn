import React from "react";

import { ZegoTranslationText } from "../services/defines";
import { ZegoCancelInvitationButton, ZegoUIKitReport } from '@zegocloud/zego-uikit-rn';

export default function ZegoCancelRequestCoHostButton(props: any) {
    const {
        hostID,
        onCancelSuccessfully,
        setIsToastVisable,
        setToastExtendedData,
    } = props;

    const pressedHandle = ({callID}) => {
        ZegoUIKitReport.reportEvent('livestreaming/cohost/audience/respond', {
            call_id: callID,
            action: 'cancel'
        });
        onCancelSuccessfully();
    };

    return (
        <ZegoCancelInvitationButton
            icon={require('../resources/icon_request_cohost.png')}
            backgroundColor={'rgba(30, 39, 64, 0.4)'}
            width={195}
            height={36}
            fontSize={13}
            color='#fff'
            text={ZegoTranslationText.cancelRequestCoHostButton}
            verticalLayout={false}
            invitees={[hostID]}
            onPressed={pressedHandle}
        ></ZegoCancelInvitationButton>
    )
}