import ZegoUIKit, {
  ZegoInvitationConnectionState,
  ZegoUIKitLogger,
  ZegoUIKitPluginType,
} from '@zegocloud/zego-uikit-rn';

import { zloginfo } from '../utils/logger';
import { getPackageVersion } from '../utils/package_version';

const _appInfo = {} as any;
const _localUser = {} as any;
let _pluginConnectionState: number;
let ZIMKitPlugin: any = null;
const _install = (plugins: any[]) => {
  ZegoUIKit.installPlugins(plugins);
  ZegoUIKit.logComponentsVersion(new Map([['PrebuiltLiveStreaming', getPackageVersion()]]));
  plugins.forEach(plugin => {
    if (plugin.ZIMKit) {
      zloginfo('[Plugins] install ZIMKit success.');
      ZIMKitPlugin = plugin;
    } else if (plugin.default && typeof plugin.default.getModuleName === 'function') {
      const temp = plugin.default.getModuleName();
      if (temp === 'ZIMKit') {
        zloginfo('[Plugins] install ZIMKit success.');
        ZIMKitPlugin = plugin;
      }
    }
  })
};
let logoutSignalingPluginOnLeaveLiveStreaming = true; // default value is true

const ZegoPrebuiltPlugins = {
  init: (appID: number, appSign: string, userID: string, userName: string, plugins: any[], pluginsConfig: any) => {
    ZegoUIKitLogger.logSetUserID(userID)

    zloginfo(`[ZegoPrebuiltPlugins][init] appID: ${appID}, userID: ${userID}, userName: ${userName}, config: ${JSON.stringify(pluginsConfig)}`)

    const callbackID = 'ZegoPrebuiltPlugins' + String(Math.floor(Math.random() * 10000));
    _install(plugins);

    logoutSignalingPluginOnLeaveLiveStreaming = pluginsConfig.logoutSignalingPluginOnLeaveLiveStreaming;

    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      ZegoUIKit.getSignalingPlugin().init(appID, appSign);
      ZegoUIKit.getSignalingPlugin().onConnectionStateChanged(
        callbackID,
        ({ state }: any) => {
          _pluginConnectionState = state;
        }
      );
      _appInfo.appID = appID;
      _appInfo.appSign = appSign;
      _localUser.userID = userID;
      _localUser.userName = userName;
      return ZegoUIKit.getSignalingPlugin().login(userID, userName).then(() => {
        zloginfo('[Plugins] login success.');
        return Promise.resolve(true);
      });
    } else {
      zloginfo('[Plugins]The signal plugin passed in is empty');
      return Promise.resolve(false);
    }
  },
  uninit: () => {
    zloginfo(`config logoutSignalingPluginOnLeaveLiveStreaming = ${logoutSignalingPluginOnLeaveLiveStreaming}`)

    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling) && logoutSignalingPluginOnLeaveLiveStreaming) {
      ZegoUIKit.getSignalingPlugin().logout();
      ZegoUIKit.getSignalingPlugin().uninit();
    }
  },
  getLocalUser: () => {
    return _localUser;
  },
  getAppInfo: () => {
    return _appInfo;
  },
  getZIMKitPlugin: () => {
    return ZIMKitPlugin;
  }
};

export default ZegoPrebuiltPlugins;
