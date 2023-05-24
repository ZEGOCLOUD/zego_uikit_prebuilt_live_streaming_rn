import { ZegoLiveStreamingRole } from "./defines";

export default class PrebuiltHelper {
    static _instance: PrebuiltHelper;
    _realTimeData: { [index: string]: any } = {
        role: ZegoLiveStreamingRole.audience,
        hostID: '',
        liveStatus: '',
        requestCoHostCount: 0,
        memberConnectStateMap: {},
    };
    _stateData: { [index: string]: any } = {
        memberConnectStateMap: {},
    };
    _notifyData: { [index: string]: any }  = {};
    _onZegoDialogTriggerCallbackMap: { [index: string]: (data?: any) => void } = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new PrebuiltHelper());
    }
    // Use reference types directly, so the set method is not provided here
    getRealTimeData() {
        return this._realTimeData;
    }
    getStateData() {
        return this._stateData;
    }
    getNotifyData() {
        return this._notifyData;
    }
    clearRealTimeData() {
        this._realTimeData = {
            role: ZegoLiveStreamingRole.audience,
            hostID: '',
            liveStatus: '',
            requestCoHostCount: 0,
            memberConnectStateMap: {},
        }
    }
    clearState() {
        this._stateData = {
            memberConnectStateMap: {},
        };
    }
    clearNotify() {
        this._notifyData = {};
    }
    notifyZegoDialogTrigger(visable: boolean) {
        Object.keys(this._onZegoDialogTriggerCallbackMap).forEach((callbackID) => {
            if (this._onZegoDialogTriggerCallbackMap[callbackID]) {
                this._onZegoDialogTriggerCallbackMap[callbackID](visable);
            }
        })
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