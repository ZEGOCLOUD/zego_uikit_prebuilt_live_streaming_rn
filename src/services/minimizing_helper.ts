import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export default class MinimizingHelper {
    static _instance: MinimizingHelper;
    _isMinimize = false;
    _isMinimizeSwitch = false;
    _activeUserID = '';
    _rangeSoundLevels: { [index: string]: number[] } = {};
    _onActiveUserIDUpdateCallbackMap: { [index: string]: (data?: any) => void } = {};
    _onWindowMinimizeCallbackMap: { [index: string]: (data?: any) => void } = {};
    _onWindowMaximizeCallbackMap: { [index: string]: (data?: any) => void } = {};
    _onEntryNormalCallbackMap: { [index: string]: (data?: any) => void } = {};
    _updateTimer: null | NodeJS.Timer = null;
    _appInfo: {
        appID?: number;
        appSign?: String;
    } = {};
    _localUser: {
        userID?: string;
        userName?: string;
    } = {};
    _roomID = '';
    _config: any = {};
    _plugins: any[] = [];
    _onPrebuiltInitCallbackMap: { [index: string]: (data?: any) => void } = {};
    _onZegoDialogTriggerCallbackMap: { [index: string]: (data?: any) => void } = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new MinimizingHelper());
    }
    getIsMinimize() {
        return this._isMinimize;
    }
    setIsMinimizeSwitch(isMinimizeSwitch: boolean) {
        this._isMinimizeSwitch = !!isMinimizeSwitch;
    }
    getIsMinimizeSwitch() {
        return this._isMinimizeSwitch;
    }
    setInitParams(appID: number, appSign: string, userID: string, userName: string, roomID: string, config = {}) {
        this._appInfo = { appID, appSign };
        this._localUser = { userID, userName };
        this._roomID = roomID;
        Object.assign(this._config, config);
    }
    getInitAppInfo() {
        return this._appInfo;
    }
    getInitUser() {
        return this._localUser;
    }
    getInitRoomID() {
        return this._roomID;
    }
    getInitConfig() {
        return this._config;
    }
    getInitPlugins() {
        return this._plugins;
    }
    minimizeWindow() {
        const callbackID = 'MinimizingHelper' + String(Math.floor(Math.random() * 10000));
        this.unRegisterAudioVideoListCallback(callbackID);
        this.registerAudioVideoListCallback(callbackID);

        this.notifyMinimize();
        this.startUpdateTimer();
    }
    startUpdateTimer() {
        this.updateActiveUserIDByTimer();

        this.initUpdateTimer();
        this._updateTimer = setInterval(() => {
            this.updateActiveUserIDByTimer();
        }, 1000)
    }
    initUpdateTimer() {
        clearInterval(this._updateTimer);
        this._updateTimer = null;
    }
    updateActiveUserIDByTimer() {
        // console.log('[MinimizingHelper]updateActiveUserIDByTimer', this._rangeSoundLevels);
        let maxAverageSoundLevel = 0;
        Object.entries(this._rangeSoundLevels).forEach(([userID, soundLevels]) => {
            const averageSoundLevel =
                soundLevels.reduce((a, b) => a + b) / soundLevels.length;

            if (averageSoundLevel > maxAverageSoundLevel) {
                this._activeUserID = userID;
                maxAverageSoundLevel = averageSoundLevel;
            }
        });

        this._activeUserID = this._activeUserID || ZegoUIKit.getLocalUserInfo().userID || '';
        this._rangeSoundLevels = {};
        
        // console.log('[MinimizingHelper]updateActiveUserIDByTimer', this._activeUserID);
        this.notifyActiveUserIDUpdate(this._activeUserID);
    }
    registerAudioVideoListCallback(callbackID: string) {
        ZegoUIKit.onAudioVideoAvailable(callbackID, (userList: any[]) => {
            console.log('[MinimizingHelper]onAudioVideoAvailable', this._activeUserID);
            userList.forEach((user) => {
                if (this._rangeSoundLevels[user.userID]) {
                    this._rangeSoundLevels[user.userID].push(user.soundLevel);
                } else {
                    this._rangeSoundLevels[user.userID] = [user.soundLevel];
                }
            });
        });
        ZegoUIKit.onAudioVideoUnavailable(callbackID, (userList: any[]) => {
            console.log('[MinimizingHelper]onAudioVideoUnavailable', this._activeUserID);
            userList.forEach((user) => {
                delete this._rangeSoundLevels[user.userID];
            });
        });
        ZegoUIKit.onSoundLevelUpdated(callbackID, (userID: string, soundLevel: number) => {
            // console.log('[MinimizingHelper]onSoundLevelUpdated', this._rangeSoundLevels, userID, soundLevel);
            if (this._rangeSoundLevels[userID]) {
                this._rangeSoundLevels[userID].push(soundLevel);
            } else {
                this._rangeSoundLevels[userID] = [soundLevel];
            }
        });
    }
    unRegisterAudioVideoListCallback(callbackID: string) {
        ZegoUIKit.onAudioVideoAvailable(callbackID);
        ZegoUIKit.onAudioVideoUnavailable(callbackID);
        ZegoUIKit.onSoundLevelUpdated(callbackID);
    }
    notifyPrebuiltInit() {
        Object.keys(this._onPrebuiltInitCallbackMap).forEach((callbackID) => {
            if (this._onPrebuiltInitCallbackMap[callbackID]) {
                this._onPrebuiltInitCallbackMap[callbackID]();
            }
        });
    }
    notifyActiveUserIDUpdate(activeUserID: string) {
        Object.keys(this._onActiveUserIDUpdateCallbackMap).forEach((callbackID) => {
            if (this._onActiveUserIDUpdateCallbackMap[callbackID]) {
                this._onActiveUserIDUpdateCallbackMap[callbackID](activeUserID);
            }
        })
    }
    notifyMinimize() {
        this._isMinimize = true;

        Object.keys(this._onWindowMinimizeCallbackMap).forEach((callbackID) => {
            if (this._onWindowMinimizeCallbackMap[callbackID]) {
                this._onWindowMinimizeCallbackMap[callbackID]();
            }
        })
    }
    notifyMaximize() {
        this._isMinimize = false;

        Object.keys(this._onWindowMaximizeCallbackMap).forEach((callbackID) => {
            if (this._onWindowMaximizeCallbackMap[callbackID]) {
                this._onWindowMaximizeCallbackMap[callbackID]();
            }
        })
    }
    notifyEntryNormal() {
        this._isMinimize = false;

        Object.keys(this._onEntryNormalCallbackMap).forEach((callbackID) => {
            if (this._onEntryNormalCallbackMap[callbackID]) {
                this._onEntryNormalCallbackMap[callbackID]();
            }
        })
    }
    notifyZegoDialogTrigger(visable: boolean) {
        Object.keys(this._onZegoDialogTriggerCallbackMap).forEach((callbackID) => {
            if (this._onZegoDialogTriggerCallbackMap[callbackID]) {
                this._onZegoDialogTriggerCallbackMap[callbackID](visable);
            }
        })
    }
    onPrebuiltInit(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onPrebuiltInitCallbackMap[callbackID];
        } else {
            this._onPrebuiltInitCallbackMap[callbackID] = callback;
        }
    }
    onActiveUserIDUpdate(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onActiveUserIDUpdateCallbackMap[callbackID];
        } else {
            this._onActiveUserIDUpdateCallbackMap[callbackID] = callback;
        }
    }
    onWindowMinimized(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onWindowMinimizeCallbackMap[callbackID];
        } else {
            this._onWindowMinimizeCallbackMap[callbackID] = callback;
        }
    }
    onWindowMaximized(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onWindowMaximizeCallbackMap[callbackID];
        } else {
            this._onWindowMaximizeCallbackMap[callbackID] = callback;
        }
    }
    onEntryNormal(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onEntryNormalCallbackMap[callbackID];
        } else {
            this._onEntryNormalCallbackMap[callbackID] = callback;
        }
    }
    // Temporarily resolved an issue where dialog shutdown could not be triggered
    onZegoDialogTrigger(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onZegoDialogTriggerCallbackMap[callbackID];
        } else {
            this._onZegoDialogTriggerCallbackMap[callbackID] = callback;
        }
    }
}