import { ZegoLiveStreamingRole } from "./defines";

export default class PrebuiltHelper {
    static _instance: PrebuiltHelper;
    _realTimeData = {
        role: ZegoLiveStreamingRole.audience,
        hostID: '',
        liveStatus: '',
        requestCoHostCount: 0,
        memberConnectStateMap: {},
    };
    _stateData: { [index: string]: any } = {};
    _notifyData: { [index: string]: any }  = {};
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
            role: ZegoLiveStreamingRole.host,
            hostID: '',
            liveStatus: '',
            requestCoHostCount: 0,
            memberConnectStateMap: {},
        }
    }
    clearState() {
        this._stateData = {};
    }
    clearNotify() {
        this._notifyData = {};
    }
}