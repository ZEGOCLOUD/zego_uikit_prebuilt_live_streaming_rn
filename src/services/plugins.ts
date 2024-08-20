import ZegoUIKit, {
  ZegoUIKitPluginType,
  ZegoInvitationConnectionState,
} from '@zegocloud/zego-uikit-rn';
import { zloginfo } from '../utils/logger';
import { packageVersion } from '../utils/package';

const _appInfo = {} as any;
const _localUser = {} as any;
let _pluginConnectionState: number;
let ZIMKitPlugin: any = null;
const _install = (plugins: any[]) => {
  ZegoUIKit.installPlugins(plugins);
  ZegoUIKit.logComponentsVersion(new Map([['PrebuiltLiveStreaming', packageVersion()]]));
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

const ZegoPrebuiltPlugins = {
  init: (appID: number, appSign: string, userID: string, userName: string, plugins: any[]) => {
    const callbackID =
      'ZegoPrebuiltPlugins' + String(Math.floor(Math.random() * 10000));
    _install(plugins);
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
        return true;
      });
    } else {
      zloginfo('[Plugins]The signal plugin passed in is empty');
      return Promise.resolve(false);
    }
  },
  joinRoom(roomID: string) {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      return ZegoUIKit.getSignalingPlugin().joinRoom(roomID).then(() => {
        zloginfo('[Plugins] join room success.');
        return true;
      });
    } else {
      zloginfo('[Plugins]The signal plugin passed in is empty');
      return Promise.resolve(false);
    }
  },
  reconnectIfDisconnected: () => {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
      zloginfo(
        '[Plugins] reconnectIfDisconnected',
        _pluginConnectionState,
        ZegoInvitationConnectionState.disconnected
      );
      if (_pluginConnectionState === ZegoInvitationConnectionState.disconnected) {
        ZegoUIKit.getSignalingPlugin().logout().then(() => {
          zloginfo('[Plugins] auto logout success.');
          ZegoUIKit.getSignalingPlugin().login(
            _localUser.userID,
            _localUser.userName
          ).then(() => {
            zloginfo('[Plugins] auto reconnect success.');
          });
        });
      }
    } else {
      zloginfo('[Plugins]The signal plugin passed in is empty');
    }
  },
  uninit: () => {
    if (ZegoUIKit.getPlugin(ZegoUIKitPluginType.signaling)) {
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
