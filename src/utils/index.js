const getShotName = (name) => {
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

export { getShotName };