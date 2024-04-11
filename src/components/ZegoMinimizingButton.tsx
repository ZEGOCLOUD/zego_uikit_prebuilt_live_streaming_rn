import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image, View } from 'react-native';
import MinimizingHelper from "../services/minimizing_helper";
import { getMethodReturnValue } from "../utils"

export default function ZegoMinimizingButton(props: any) {
    const {
        width = 30,
        height = 30,
        iconBuilder,
        borderRadius = iconBuilder ? 0 : 100,
        backgroundColor = iconBuilder ? 'rgba(0, 0, 0, 0, 0)' : 'rgba(30, 39, 64, 0.4000)',
        icon = require('../resources/icon_minimize.png'),
        onPressed,
        onWillPressed,
    } = props;

    const pressedHandle = async () => {
        const canMinimize = await getMethodReturnValue(onWillPressed);
        if (canMinimize) {
            MinimizingHelper.getInstance().minimizeWindow();

            typeof onPressed === 'function' && onPressed();
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.imgContainer,
                { width, height, backgroundColor, borderRadius },
            ]}
            onPress={pressedHandle}
        >
          {iconBuilder
          ? iconBuilder()
          : <Image
              source={icon}
              style={{ width: 16, height: 16 }}
            />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    imgContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // marginLeft: 8,
    },
});