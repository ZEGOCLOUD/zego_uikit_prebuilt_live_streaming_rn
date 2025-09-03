import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { durationFormat } from "../utils";
import PrebuiltHelper from "../services/prebuilt_helper";

interface Props {
  initialDuration?: number;
  onDurationChange?: (duration: number) => void;
}

const ZegoLiveStreamingClock = (props: Props, ref: React.Ref<unknown>) => {
  const insets = useSafeAreaInsets();
  
  const stateData = useRef(PrebuiltHelper.getInstance().getStateData());
  const durationTimer = useRef(stateData.current.liveStreamingTimingTimer)
  const [duration, setDuration] = useState(stateData.current.duration || 0)

  const start = () => {
    clearDurationTimer()
    durationTimer.current = setInterval(() => {
      stateData.current.duration = (stateData.current.duration || 0) + 1
      setDuration(() => {
        if (typeof props.onDurationChange === 'function') {
          props.onDurationChange(stateData.current.duration)
        }
        return stateData.current.duration
      })
    }, 1000)
    stateData.current.liveStreamingTimingTimer = durationTimer.current
  }

  const clearDurationTimer = () => {
    durationTimer.current && clearInterval(durationTimer.current)
  }

  const stop = () => {
    clearDurationTimer()
  }

  useImperativeHandle(ref, () => ({
    start,
    stop
  }), [duration])

  return (
    <View style={[styles.timingContainer, {top: insets.top}]}>
      <Text style={styles.timing}>{durationFormat(duration)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  timingContainer: {
    position: 'absolute',
    zIndex: 11,
  },
  timing: {
    color: 'white',
  }
})

export default forwardRef(ZegoLiveStreamingClock);
