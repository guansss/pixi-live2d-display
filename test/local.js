// a place to persist data from a webpage in electron

const data = {};

function getData() {
    return data;
}

function setData(_data) {
    Object.assign(data, _data);
}

module.exports = {
    getData,
    setData,
};
