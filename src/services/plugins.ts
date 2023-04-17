import ZegoUIKit, {
  ZegoUIKitPluginType,
  ZegoInvitationConnectionState,
} from '@zegocloud/zego-uikit-rn';
import { zloginfo } from '../utils/logger';

const _appInfo = {} as any;
const _localUser = {} as any;
let _pluginConnectionState: number;
const _install = (plugins: any[]) => {
  ZegoUIKit.installPlugins(plugins);
  Object.values(ZegoUIKitPluginType).forEach((pluginType) => {
    const plugin = ZegoUIKit.getPlugin(pluginType);
    plugin && plugin.getVersion()
      .then((pluginVersion: string) => {
        zloginfo(
          `[Plugins] install success, pluginType: ${pluginType}, version: ${pluginVersion}`
        );
      });
  });
};

const ZegoPrebuiltPlugins = {
  init: (appID: string, appSign: string, userID: string, userName: string, plugins: any[]) => {
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
      zloginfo('[Plugins]The plugin passed in is empty');
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
      zloginfo('[Plugins]The plugin passed in is empty');
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
        ZegoUIKit.getSignalingPlugin().logout.then(() => {
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
      zloginfo('[Plugins]The plugin passed in is empty');
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
};

export default ZegoPrebuiltPlugins;
