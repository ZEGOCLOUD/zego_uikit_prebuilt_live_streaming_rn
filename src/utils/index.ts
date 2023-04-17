import { Platform, PermissionsAndroid, Permission } from 'react-native';

const getShotName = (name: string | undefined) => {
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

const grantPermissions = async (callback: () => void) => {
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
            (data) => {
                if (callback) {
                    callback();
                }
            }
        );
    } else if (callback) {
        callback();
    }
};

export { getShotName, grantPermissions };
