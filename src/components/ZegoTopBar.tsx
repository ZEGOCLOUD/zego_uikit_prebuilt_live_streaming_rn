import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ZegoLeaveButton } from '@zegocloud/zego-uikit-rn';
import ZegoMinimizingButton from './ZegoMinimizingButton';
import ZegoMenuBarButtonName from "./ZegoMenuBarButtonName";

export default function ZegoTopBar(props: any) {
    const { menuBarButtons = [], onLeave, onLeaveConfirmation, buttonBuilders } = props;

    const getButtonByButtonIndex = (buttonIndex: number) => {
        switch (buttonIndex) {
            case ZegoMenuBarButtonName.minimizingButton:
                return <ZegoMinimizingButton
                  width={30}
                  height={30}
                  iconBuilder={buttonBuilders.minimizingBuilder}
                />;
            case ZegoMenuBarButtonName.leaveButton:
                return <ZegoLeaveButton 
                    onLeaveConfirmation={onLeaveConfirmation}
                    onPressed={onLeave}
                    width={30}
                    height={30}
                    iconLeave={require('../resources/white_bottom_button_close.png')}
                    iconBuilder={buttonBuilders.leaveBuilder}
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
      marginLeft: 10,    
    },
    customIconContainer: {
        marginRight: 10,
    }
});