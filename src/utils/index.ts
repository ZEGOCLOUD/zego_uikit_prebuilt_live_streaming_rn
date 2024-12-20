import { Platform, PermissionsAndroid, Permission } from 'react-native';

const getShortName = (name: string | undefined) => {
    if (!name) {
        return '';
    }
    const nl = name.split(' ');
    var shotName = '';
    nl.forEach((part) => {
        if (part !== '') {
            shotName += part.substring(0, 1);
        }
    });
    return shotName;
};

const grantPermissions = async (callback?: () => void) => {
    // Android: Dynamically obtaining device permissions
    if (Platform.OS === 'android') {
        // Check if permission granted
        let grantedAudio = PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO as Permission
        );
        let grantedCamera = PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA as Permission
        );
        const ungrantedPermissions = [] as Permission[];
        try {
            const isAudioGranted = await grantedAudio;
            const isVideoGranted = await grantedCamera;
            if (!isAudioGranted) {
                ungrantedPermissions.push(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO as Permission
                );
            }
            if (!isVideoGranted) {
                ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA as Permission);
            }
        } catch (error) {
            ungrantedPermissions.push(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO as Permission,
                PermissionsAndroid.PERMISSIONS.CAMERA as Permission
            );
        }
        // If not, request it
        return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
            () => {
                if (callback) {
                    callback();
                }
            }
        );
    } else if (callback) {
        callback();
    }
};

const durationFormat = (duration: number) => {
    let s = duration || 0;
    let m = 0;
    let h = 0;
    if (s >= 60) {
        m = parseInt(`${s / 60}`);
        s = parseInt(`${s % 60}`);
        if (m >= 60) {
            h = parseInt(`${m / 60}`);
            m = parseInt(`${m % 60}`);
        }
    }
    let result = `${s}`;
    if (s < 10) {
        result = `0${result}`;
    }
    if (m > 0) {
        result = `${m}:${result}`;
        if (m < 10) {
            result = `0${result}`;
        }
    } else {
        result = `00:${result}`;
    }
    if (h > 0) {
        result = `${h}:${result}`;
        if (h < 10) {
            result = `0${result}`;
        }
    } else {
        // result = `00:${result}`;
    }
    return result;
}

const getMethodReturnValue = async (func? : Function | Promise<boolean>) => {
    let result = true;
    if (func) {
        if (typeof func === 'object' && typeof (func.then) === 'function' && typeof (func.catch) === 'function') {
          // Promise
          try {
            result = await func;
          } catch (error) {
            result = false;
          }
        } else if (typeof func === 'function') {
          const temp = func();
          if (typeof temp === 'object' && typeof (temp.then) === 'function' && typeof (temp.catch) === 'function') {
            try {
              result = await temp;
            } catch (error) {
              result = false;
            }
          } else {
            result = temp;
          }
        }
    }
    return result;
}

export { getShortName, grantPermissions, durationFormat, getMethodReturnValue };
