export const zloginfo = (...msg: any[]) => {
    console.log("ZEGOUIKit[INFO]: ", ...msg);
}
export const zlogwarning = (...msg: any[]) => {
    console.warn("ZEGOUIKit[WARNING]: ", ...msg);
}

export const zlogerror = (...msg: any[]) => {
    console.error("ZEGOUIKit[ERROR]: ", ...msg);
}