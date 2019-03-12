/*
 * json-reform
 * Copyright (c) 2019 Andy Tran (https://github.com/andycillin/json-reform)
 * MIT Licensed
 */

'use strict';

function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
}

module.exports = {
    isFunction
};