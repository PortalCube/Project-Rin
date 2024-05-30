import dayjs from "dayjs";

function getTime() {
    return dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS");
}

export const Log = {
    info: (...message) => {
        console.log(`[${getTime()}][INFO]`, ...message);
    },
    warn: (...message) => {
        console.warn(`[${getTime()}][WARN]`, ...message);
    },
    error: (...message) => {
        console.error(`[${getTime()}][ERROR]`, ...message);
    },
    Log: (...message) => {
        console.Log(`[${getTime()}][Log]`, ...message);
    },
};
