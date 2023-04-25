# Quick start

- - -

[![](https://img.shields.io/badge/chat-on%20discord-7289da.svg)](https://discord.gg/EtNRATttyp)

> If you have any questions regarding bugs and feature requests, visit the [ZEGOCLOUD community](https://discord.gg/EtNRATttyp) .

## Integrate the SDK

[![Tutorial | How to build live streaming using React Native in 10 mins with ZEGOCLOUD](https://res.cloudinary.com/marcomontalbano/image/upload/v1682409295/video_to_markdown/images/youtube--Ch_szozkMfA-c05b58ac6eb4c4700831b2b3070cd403.jpg)](https://youtu.be/Ch_szozkMfA "Tutorial | How to build live streaming using React Native in 10 mins with ZEGOCLOUD")

### Import the SDK

### Add @zegocloud/zego-uikit-prebuilt-live-streaming-rn as dependencies

```bash
yarn add @zegocloud/zego-uikit-prebuilt-live-streaming-rn 
```

### Add other dependencies

Run the following command to install other dependencies for making sure the `@zegocloud/zego-uikit-prebuilt-live-streaming-rn` can work properly:

```bash
yarn add @zegocloud/zego-uikit-rn react-delegate-component zego-express-engine-reactnative
```

### Using the `ZegoUIKitPrebuiltLiveStreaming` Component in your project

- Go to [ZEGOCLOUD Admin Console\|_blank](https://console.zegocloud.com/), get the `appID` and `appSign` of your project.
- Specify the `userID` and `userName` for connecting the LiveStreaming Kit service. 
- Create a `liveID` that represents the live streaming you want to make. 

<div class="mk-hint">

- `userID` and `callID` can only contain numbers, letters, and underlines (_). 
- Using the same `liveID` will enter the same live streaming.
</div>



```js
// HostPage.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ZegoUIKitPrebuiltLiveStreaming, { HOST_DEFAULT_CONFIG } from '@zegocloud/zego-uikit-prebuilt-live-streaming-rn'

export default function HostPage(props) {
    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltLiveStreaming
                appID={yourAppID}
                appSign={yourAppSign}
                userID={userID}
                userName={userName}
                liveID={liveID}

                config={{
                    ...HOST_DEFAULT_CONFIG,
                    onLeaveLiveStreaming: () => { props.navigation.navigate('HomePage') }
                }}
            />
        </View>
    );
}
```


## Configure your project

- Android: 

Open `my_project/android/app/src/main/AndroidManifest.xml` file and add the code as follow:

<img src="/Pics/ZegoUIKit/RN/PrebuiltCall/android_config.gif" width=500/>

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
```

- iOS:

Open `my_project/ios/my_project/Info.plist` file and add the code as follow:

<img src="/Pics/ZegoUIKit/RN/PrebuiltCall/ios_config.gif" width=500/>

```xml
<key>NSCameraUsageDescription</key>
<string></string>
<key>NSMicrophoneUsageDescription</key>
<string></string>
```

## Run & Test

- Run on an iOS device:
```bash
yarn android
```
- Run on an Android device:
```bash
yarn ios
```

## Related guide

[Custom prebuilt UI](https://docs.zegocloud.com/article/14879)

[Sample code](https://github.com/ZEGOCLOUD/zego_uikit_prebuilt_live_streaming_example_rn)

