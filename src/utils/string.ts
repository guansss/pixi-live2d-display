/**
 * Gets the name of parent folder in a url.
 * @param url - URL of a file.
 * @return Name of the parent folder, or the file itself if it has no parent folder.
 */
export function folderName(url: string) {
    const hadTrailingSlash = /\/$/.test(url);
    url = url.replace(/\/+$/, "");

    let lastSlashIndex = url.lastIndexOf("/");

    if (hadTrailingSlash) {
        return lastSlashIndex !== -1 ? url.slice(lastSlashIndex + 1) : url;
    }

    if (lastSlashIndex != -1) {
        url = url.slice(0, lastSlashIndex);
    }

    lastSlashIndex = url.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
        url = url.slice(lastSlashIndex + 1);
    }

    return url;
}
