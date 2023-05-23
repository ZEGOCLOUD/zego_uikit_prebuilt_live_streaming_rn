import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ZegoLeaveButton } from '@zegocloud/zego-uikit-rn';
import ZegoMinimizingButton from './ZegoMinimizingButton';
import ZegoMenuBarButtonName from "./ZegoMenuBarButtonName";

export default function ZegoTopBar(props: any) {
    const { menuBarButtons = [], onLeave, onLeaveConfirmation } = props;

    const getButtonByButtonIndex = (buttonIndex: number) => {
        switch (buttonIndex) {
            case ZegoMenuBarButtonName.minimizingButton:
                return <ZegoMinimizingButton />;
            case ZegoMenuBarButtonName.leaveButton:
                return <ZegoLeaveButton 
                    onLeaveConfirmation={onLeaveConfirmation}
                    onPressed={onLeave}
                    iconLeave={require('../resources/white_top_button_close.png')}
                />;
        }
    };

    return <View style={styles.topRightBar}>
        {
            menuBarButtons.map((buttonIndex: number) => <View key={buttonIndex} style={styles.customIconContainer}>
                {getButtonByButtonIndex(buttonIndex)}
            </View>)
        }
    </View>;
}

const styles = StyleSheet.create({
    topRightBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',    
    },
    customIconContainer: {
        marginLeft: 0,
    }
});