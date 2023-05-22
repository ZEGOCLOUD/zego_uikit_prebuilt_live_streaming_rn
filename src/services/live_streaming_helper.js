import { ZegoLiveStreamingRole } from "./defines";

export default class LiveStreamingHelper {
    _instance;
    _realTimeData = {
        role: ZegoLiveStreamingRole.host,
        hostID: '',
        liveStatus: '',
        requestCoHostCount: 0,
        memberConnectStateMap: {},
    };
    _stateData = {};
    _notifyData = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new LiveStreamingHelper());
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
            role: 0,
            hostID: '',
            requestCoHostCount: 0,
            memberConnectStateMap: {},
            seatingAreaData: [],
            roomProperties: {},
            isLocked: false,
        }
    }
    clearState() {
        this._stateData = {};
    }
    clearNotify() {
        this._notifyData = {};
    }
}