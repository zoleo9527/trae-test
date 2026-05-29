"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEvidenceUrlsString = exports.parseEvidenceUrls = exports.fromJsonString = exports.toJsonString = void 0;
const toJsonString = (obj) => {
    if (obj === null || obj === undefined)
        return null;
    try {
        return JSON.stringify(obj);
    }
    catch {
        return null;
    }
};
exports.toJsonString = toJsonString;
const fromJsonString = (str) => {
    if (!str)
        return null;
    try {
        return JSON.parse(str);
    }
    catch {
        return null;
    }
};
exports.fromJsonString = fromJsonString;
const parseEvidenceUrls = (str) => {
    if (!str)
        return [];
    return str.split(',').filter(url => url.trim());
};
exports.parseEvidenceUrls = parseEvidenceUrls;
const toEvidenceUrlsString = (urls) => {
    if (!urls || urls.length === 0)
        return null;
    return urls.join(',');
};
exports.toEvidenceUrlsString = toEvidenceUrlsString;
