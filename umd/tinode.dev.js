(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["tinode"] = factory();
	else
		root["tinode"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/262.js":
/*!************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/262.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ArrayCreate: () => (/* binding */ ArrayCreate),
/* harmony export */   DateFromTime: () => (/* binding */ DateFromTime),
/* harmony export */   Day: () => (/* binding */ Day),
/* harmony export */   DayFromYear: () => (/* binding */ DayFromYear),
/* harmony export */   DayWithinYear: () => (/* binding */ DayWithinYear),
/* harmony export */   DaysInYear: () => (/* binding */ DaysInYear),
/* harmony export */   HasOwnProperty: () => (/* binding */ HasOwnProperty),
/* harmony export */   HourFromTime: () => (/* binding */ HourFromTime),
/* harmony export */   InLeapYear: () => (/* binding */ InLeapYear),
/* harmony export */   MinFromTime: () => (/* binding */ MinFromTime),
/* harmony export */   MonthFromTime: () => (/* binding */ MonthFromTime),
/* harmony export */   OrdinaryHasInstance: () => (/* binding */ OrdinaryHasInstance),
/* harmony export */   SameValue: () => (/* binding */ SameValue),
/* harmony export */   SecFromTime: () => (/* binding */ SecFromTime),
/* harmony export */   TimeClip: () => (/* binding */ TimeClip),
/* harmony export */   TimeFromYear: () => (/* binding */ TimeFromYear),
/* harmony export */   ToNumber: () => (/* binding */ ToNumber),
/* harmony export */   ToObject: () => (/* binding */ ToObject),
/* harmony export */   ToString: () => (/* binding */ ToString),
/* harmony export */   Type: () => (/* binding */ Type),
/* harmony export */   WeekDay: () => (/* binding */ WeekDay),
/* harmony export */   YearFromTime: () => (/* binding */ YearFromTime),
/* harmony export */   msFromTime: () => (/* binding */ msFromTime)
/* harmony export */ });
/**
 * https://tc39.es/ecma262/#sec-tostring
 */
function ToString(o) {
    // Only symbol is irregular...
    if (typeof o === 'symbol') {
        throw TypeError('Cannot convert a Symbol value to a string');
    }
    return String(o);
}
/**
 * https://tc39.es/ecma262/#sec-tonumber
 * @param val
 */
function ToNumber(val) {
    if (val === undefined) {
        return NaN;
    }
    if (val === null) {
        return +0;
    }
    if (typeof val === 'boolean') {
        return val ? 1 : +0;
    }
    if (typeof val === 'number') {
        return val;
    }
    if (typeof val === 'symbol' || typeof val === 'bigint') {
        throw new TypeError('Cannot convert symbol/bigint to number');
    }
    return Number(val);
}
/**
 * https://tc39.es/ecma262/#sec-tointeger
 * @param n
 */
function ToInteger(n) {
    var number = ToNumber(n);
    if (isNaN(number) || SameValue(number, -0)) {
        return 0;
    }
    if (isFinite(number)) {
        return number;
    }
    var integer = Math.floor(Math.abs(number));
    if (number < 0) {
        integer = -integer;
    }
    if (SameValue(integer, -0)) {
        return 0;
    }
    return integer;
}
/**
 * https://tc39.es/ecma262/#sec-timeclip
 * @param time
 */
function TimeClip(time) {
    if (!isFinite(time)) {
        return NaN;
    }
    if (Math.abs(time) > 8.64 * 1e15) {
        return NaN;
    }
    return ToInteger(time);
}
/**
 * https://tc39.es/ecma262/#sec-toobject
 * @param arg
 */
function ToObject(arg) {
    if (arg == null) {
        throw new TypeError('undefined/null cannot be converted to object');
    }
    return Object(arg);
}
/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-samevalue
 * @param x
 * @param y
 */
function SameValue(x, y) {
    if (Object.is) {
        return Object.is(x, y);
    }
    // SameValue algorithm
    if (x === y) {
        // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
    }
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
}
/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-arraycreate
 * @param len
 */
function ArrayCreate(len) {
    return new Array(len);
}
/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-hasownproperty
 * @param o
 * @param prop
 */
function HasOwnProperty(o, prop) {
    return Object.prototype.hasOwnProperty.call(o, prop);
}
/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-type
 * @param x
 */
function Type(x) {
    if (x === null) {
        return 'Null';
    }
    if (typeof x === 'undefined') {
        return 'Undefined';
    }
    if (typeof x === 'function' || typeof x === 'object') {
        return 'Object';
    }
    if (typeof x === 'number') {
        return 'Number';
    }
    if (typeof x === 'boolean') {
        return 'Boolean';
    }
    if (typeof x === 'string') {
        return 'String';
    }
    if (typeof x === 'symbol') {
        return 'Symbol';
    }
    if (typeof x === 'bigint') {
        return 'BigInt';
    }
}
var MS_PER_DAY = 86400000;
/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#eqn-modulo
 * @param x
 * @param y
 * @return k of the same sign as y
 */
function mod(x, y) {
    return x - Math.floor(x / y) * y;
}
/**
 * https://tc39.es/ecma262/#eqn-Day
 * @param t
 */
function Day(t) {
    return Math.floor(t / MS_PER_DAY);
}
/**
 * https://tc39.es/ecma262/#sec-week-day
 * @param t
 */
function WeekDay(t) {
    return mod(Day(t) + 4, 7);
}
/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
function DayFromYear(y) {
    return Date.UTC(y, 0) / MS_PER_DAY;
}
/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
function TimeFromYear(y) {
    return Date.UTC(y, 0);
}
/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param t
 */
function YearFromTime(t) {
    return new Date(t).getUTCFullYear();
}
function DaysInYear(y) {
    if (y % 4 !== 0) {
        return 365;
    }
    if (y % 100 !== 0) {
        return 366;
    }
    if (y % 400 !== 0) {
        return 365;
    }
    return 366;
}
function DayWithinYear(t) {
    return Day(t) - DayFromYear(YearFromTime(t));
}
function InLeapYear(t) {
    return DaysInYear(YearFromTime(t)) === 365 ? 0 : 1;
}
/**
 * https://tc39.es/ecma262/#sec-month-number
 * @param t
 */
function MonthFromTime(t) {
    var dwy = DayWithinYear(t);
    var leap = InLeapYear(t);
    if (dwy >= 0 && dwy < 31) {
        return 0;
    }
    if (dwy < 59 + leap) {
        return 1;
    }
    if (dwy < 90 + leap) {
        return 2;
    }
    if (dwy < 120 + leap) {
        return 3;
    }
    if (dwy < 151 + leap) {
        return 4;
    }
    if (dwy < 181 + leap) {
        return 5;
    }
    if (dwy < 212 + leap) {
        return 6;
    }
    if (dwy < 243 + leap) {
        return 7;
    }
    if (dwy < 273 + leap) {
        return 8;
    }
    if (dwy < 304 + leap) {
        return 9;
    }
    if (dwy < 334 + leap) {
        return 10;
    }
    if (dwy < 365 + leap) {
        return 11;
    }
    throw new Error('Invalid time');
}
function DateFromTime(t) {
    var dwy = DayWithinYear(t);
    var mft = MonthFromTime(t);
    var leap = InLeapYear(t);
    if (mft === 0) {
        return dwy + 1;
    }
    if (mft === 1) {
        return dwy - 30;
    }
    if (mft === 2) {
        return dwy - 58 - leap;
    }
    if (mft === 3) {
        return dwy - 89 - leap;
    }
    if (mft === 4) {
        return dwy - 119 - leap;
    }
    if (mft === 5) {
        return dwy - 150 - leap;
    }
    if (mft === 6) {
        return dwy - 180 - leap;
    }
    if (mft === 7) {
        return dwy - 211 - leap;
    }
    if (mft === 8) {
        return dwy - 242 - leap;
    }
    if (mft === 9) {
        return dwy - 272 - leap;
    }
    if (mft === 10) {
        return dwy - 303 - leap;
    }
    if (mft === 11) {
        return dwy - 333 - leap;
    }
    throw new Error('Invalid time');
}
var HOURS_PER_DAY = 24;
var MINUTES_PER_HOUR = 60;
var SECONDS_PER_MINUTE = 60;
var MS_PER_SECOND = 1e3;
var MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
var MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
function HourFromTime(t) {
    return mod(Math.floor(t / MS_PER_HOUR), HOURS_PER_DAY);
}
function MinFromTime(t) {
    return mod(Math.floor(t / MS_PER_MINUTE), MINUTES_PER_HOUR);
}
function SecFromTime(t) {
    return mod(Math.floor(t / MS_PER_SECOND), SECONDS_PER_MINUTE);
}
function IsCallable(fn) {
    return typeof fn === 'function';
}
/**
 * The abstract operation OrdinaryHasInstance implements
 * the default algorithm for determining if an object O
 * inherits from the instance object inheritance path
 * provided by constructor C.
 * @param C class
 * @param O object
 * @param internalSlots internalSlots
 */
function OrdinaryHasInstance(C, O, internalSlots) {
    if (!IsCallable(C)) {
        return false;
    }
    if (internalSlots === null || internalSlots === void 0 ? void 0 : internalSlots.boundTargetFunction) {
        var BC = internalSlots === null || internalSlots === void 0 ? void 0 : internalSlots.boundTargetFunction;
        return O instanceof BC;
    }
    if (typeof O !== 'object') {
        return false;
    }
    var P = C.prototype;
    if (typeof P !== 'object') {
        throw new TypeError('OrdinaryHasInstance called on an object with an invalid prototype property.');
    }
    return Object.prototype.isPrototypeOf.call(P, O);
}
function msFromTime(t) {
    return mod(t, MS_PER_SECOND);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeLocaleList.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeLocaleList.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CanonicalizeLocaleList: () => (/* binding */ CanonicalizeLocaleList)
/* harmony export */ });
/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
function CanonicalizeLocaleList(locales) {
    // TODO
    return Intl.getCanonicalLocales(locales);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeTimeZoneName.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeTimeZoneName.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CanonicalizeTimeZoneName: () => (/* binding */ CanonicalizeTimeZoneName)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-canonicalizetimezonename
 * @param tz
 */
function CanonicalizeTimeZoneName(tz, _a) {
    var zoneNames = _a.zoneNames, uppercaseLinks = _a.uppercaseLinks;
    var uppercasedTz = tz.toUpperCase();
    var uppercasedZones = zoneNames.reduce(function (all, z) {
        all[z.toUpperCase()] = z;
        return all;
    }, {});
    var ianaTimeZone = uppercaseLinks[uppercasedTz] || uppercasedZones[uppercasedTz];
    if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
        return 'UTC';
    }
    return ianaTimeZone;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/CoerceOptionsToObject.js":
/*!******************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/CoerceOptionsToObject.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoerceOptionsToObject: () => (/* binding */ CoerceOptionsToObject)
/* harmony export */ });
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");

/**
 * https://tc39.es/ecma402/#sec-coerceoptionstoobject
 * @param options
 * @returns
 */
function CoerceOptionsToObject(options) {
    if (typeof options === 'undefined') {
        return Object.create(null);
    }
    return (0,_262__WEBPACK_IMPORTED_MODULE_0__.ToObject)(options);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/DefaultNumberOption.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/DefaultNumberOption.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultNumberOption: () => (/* binding */ DefaultNumberOption)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * @param val
 * @param min
 * @param max
 * @param fallback
 */
function DefaultNumberOption(inputVal, min, max, fallback) {
    if (inputVal === undefined) {
        // @ts-expect-error
        return fallback;
    }
    var val = Number(inputVal);
    if (isNaN(val) || val < min || val > max) {
        throw new RangeError("".concat(val, " is outside of range [").concat(min, ", ").concat(max, "]"));
    }
    return Math.floor(val);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/GetNumberOption.js":
/*!************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/GetNumberOption.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetNumberOption: () => (/* binding */ GetNumberOption)
/* harmony export */ });
/* harmony import */ var _DefaultNumberOption__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DefaultNumberOption */ "./node_modules/@formatjs/ecma402-abstract/lib/DefaultNumberOption.js");
/**
 * https://tc39.es/ecma402/#sec-getnumberoption
 * @param options
 * @param property
 * @param min
 * @param max
 * @param fallback
 */

function GetNumberOption(options, property, minimum, maximum, fallback) {
    var val = options[property];
    return (0,_DefaultNumberOption__WEBPACK_IMPORTED_MODULE_0__.DefaultNumberOption)(val, minimum, maximum, fallback);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js":
/*!******************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetOption: () => (/* binding */ GetOption)
/* harmony export */ });
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");

/**
 * https://tc39.es/ecma402/#sec-getoption
 * @param opts
 * @param prop
 * @param type
 * @param values
 * @param fallback
 */
function GetOption(opts, prop, type, values, fallback) {
    if (typeof opts !== 'object') {
        throw new TypeError('Options must be an object');
    }
    var value = opts[prop];
    if (value !== undefined) {
        if (type !== 'boolean' && type !== 'string') {
            throw new TypeError('invalid type');
        }
        if (type === 'boolean') {
            value = Boolean(value);
        }
        if (type === 'string') {
            value = (0,_262__WEBPACK_IMPORTED_MODULE_0__.ToString)(value);
        }
        if (values !== undefined && !values.filter(function (val) { return val == value; }).length) {
            throw new RangeError("".concat(value, " is not within ").concat(values.join(', ')));
        }
        return value;
    }
    return fallback;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/GetOptionsObject.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/GetOptionsObject.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetOptionsObject: () => (/* binding */ GetOptionsObject)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-getoptionsobject
 * @param options
 * @returns
 */
function GetOptionsObject(options) {
    if (typeof options === 'undefined') {
        return Object.create(null);
    }
    if (typeof options === 'object') {
        return options;
    }
    throw new TypeError('Options must be an object');
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/GetStringOrBooleanOption.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/GetStringOrBooleanOption.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetStringOrBooleanOption: () => (/* binding */ GetStringOrBooleanOption)
/* harmony export */ });
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");
/**
 * https://tc39.es/ecma402/#sec-getstringorbooleanoption
 * @param opts
 * @param prop
 * @param values
 * @param trueValue
 * @param falsyValue
 * @param fallback
 */

function GetStringOrBooleanOption(opts, prop, values, trueValue, falsyValue, fallback) {
    var value = opts[prop];
    if (value === undefined) {
        return fallback;
    }
    if (value === true) {
        return trueValue;
    }
    var valueBoolean = Boolean(value);
    if (valueBoolean === false) {
        return falsyValue;
    }
    value = (0,_262__WEBPACK_IMPORTED_MODULE_0__.ToString)(value);
    if (value === 'true' || value === 'false') {
        return fallback;
    }
    if ((values || []).indexOf(value) === -1) {
        throw new RangeError("Invalid value ".concat(value));
    }
    return value;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/IsSanctionedSimpleUnitIdentifier.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/IsSanctionedSimpleUnitIdentifier.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IsSanctionedSimpleUnitIdentifier: () => (/* binding */ IsSanctionedSimpleUnitIdentifier),
/* harmony export */   SANCTIONED_UNITS: () => (/* binding */ SANCTIONED_UNITS),
/* harmony export */   SIMPLE_UNITS: () => (/* binding */ SIMPLE_UNITS),
/* harmony export */   removeUnitNamespace: () => (/* binding */ removeUnitNamespace)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#table-sanctioned-simple-unit-identifiers
 */
var SANCTIONED_UNITS = [
    'angle-degree',
    'area-acre',
    'area-hectare',
    'concentr-percent',
    'digital-bit',
    'digital-byte',
    'digital-gigabit',
    'digital-gigabyte',
    'digital-kilobit',
    'digital-kilobyte',
    'digital-megabit',
    'digital-megabyte',
    'digital-petabyte',
    'digital-terabit',
    'digital-terabyte',
    'duration-day',
    'duration-hour',
    'duration-millisecond',
    'duration-minute',
    'duration-month',
    'duration-second',
    'duration-week',
    'duration-year',
    'length-centimeter',
    'length-foot',
    'length-inch',
    'length-kilometer',
    'length-meter',
    'length-mile-scandinavian',
    'length-mile',
    'length-millimeter',
    'length-yard',
    'mass-gram',
    'mass-kilogram',
    'mass-ounce',
    'mass-pound',
    'mass-stone',
    'temperature-celsius',
    'temperature-fahrenheit',
    'volume-fluid-ounce',
    'volume-gallon',
    'volume-liter',
    'volume-milliliter',
];
// In CLDR, the unit name always follows the form `namespace-unit` pattern.
// For example: `digital-bit` instead of `bit`. This function removes the namespace prefix.
function removeUnitNamespace(unit) {
    return unit.slice(unit.indexOf('-') + 1);
}
/**
 * https://tc39.es/ecma402/#table-sanctioned-simple-unit-identifiers
 */
var SIMPLE_UNITS = SANCTIONED_UNITS.map(removeUnitNamespace);
/**
 * https://tc39.es/ecma402/#sec-issanctionedsimpleunitidentifier
 */
function IsSanctionedSimpleUnitIdentifier(unitIdentifier) {
    return SIMPLE_UNITS.indexOf(unitIdentifier) > -1;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/IsValidTimeZoneName.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/IsValidTimeZoneName.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IsValidTimeZoneName: () => (/* binding */ IsValidTimeZoneName)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-isvalidtimezonename
 * @param tz
 * @param implDetails implementation details
 */
function IsValidTimeZoneName(tz, _a) {
    var zoneNamesFromData = _a.zoneNamesFromData, uppercaseLinks = _a.uppercaseLinks;
    var uppercasedTz = tz.toUpperCase();
    var zoneNames = new Set();
    var linkNames = new Set();
    zoneNamesFromData.map(function (z) { return z.toUpperCase(); }).forEach(function (z) { return zoneNames.add(z); });
    Object.keys(uppercaseLinks).forEach(function (linkName) {
        linkNames.add(linkName.toUpperCase());
        zoneNames.add(uppercaseLinks[linkName].toUpperCase());
    });
    return zoneNames.has(uppercasedTz) || linkNames.has(uppercasedTz);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedCurrencyCode.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedCurrencyCode.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IsWellFormedCurrencyCode: () => (/* binding */ IsWellFormedCurrencyCode)
/* harmony export */ });
/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toUpperCase(str) {
    return str.replace(/([a-z])/g, function (_, c) { return c.toUpperCase(); });
}
var NOT_A_Z_REGEX = /[^A-Z]/;
/**
 * https://tc39.es/ecma402/#sec-iswellformedcurrencycode
 */
function IsWellFormedCurrencyCode(currency) {
    currency = toUpperCase(currency);
    if (currency.length !== 3) {
        return false;
    }
    if (NOT_A_Z_REGEX.test(currency)) {
        return false;
    }
    return true;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedUnitIdentifier.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedUnitIdentifier.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IsWellFormedUnitIdentifier: () => (/* binding */ IsWellFormedUnitIdentifier)
/* harmony export */ });
/* harmony import */ var _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./IsSanctionedSimpleUnitIdentifier */ "./node_modules/@formatjs/ecma402-abstract/lib/IsSanctionedSimpleUnitIdentifier.js");

/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toLowerCase(str) {
    return str.replace(/([A-Z])/g, function (_, c) { return c.toLowerCase(); });
}
/**
 * https://tc39.es/ecma402/#sec-iswellformedunitidentifier
 * @param unit
 */
function IsWellFormedUnitIdentifier(unit) {
    unit = toLowerCase(unit);
    if ((0,_IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_0__.IsSanctionedSimpleUnitIdentifier)(unit)) {
        return true;
    }
    var units = unit.split('-per-');
    if (units.length !== 2) {
        return false;
    }
    var numerator = units[0], denominator = units[1];
    if (!(0,_IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_0__.IsSanctionedSimpleUnitIdentifier)(numerator) ||
        !(0,_IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_0__.IsSanctionedSimpleUnitIdentifier)(denominator)) {
        return false;
    }
    return true;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ApplyUnsignedRoundingMode.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ApplyUnsignedRoundingMode.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ApplyUnsignedRoundingMode: () => (/* binding */ ApplyUnsignedRoundingMode)
/* harmony export */ });
function ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode) {
    if (x === r1)
        return r1;
    if (unsignedRoundingMode === undefined) {
        throw new Error('unsignedRoundingMode is mandatory');
    }
    if (unsignedRoundingMode === 'zero') {
        return r1;
    }
    if (unsignedRoundingMode === 'infinity') {
        return r2;
    }
    var d1 = x - r1;
    var d2 = r2 - x;
    if (d1 < d2) {
        return r1;
    }
    if (d2 < d1) {
        return r2;
    }
    if (d1 !== d2) {
        throw new Error('Unexpected error');
    }
    if (unsignedRoundingMode === 'half-zero') {
        return r1;
    }
    if (unsignedRoundingMode === 'half-infinity') {
        return r2;
    }
    if (unsignedRoundingMode !== 'half-even') {
        throw new Error("Unexpected value for unsignedRoundingMode: ".concat(unsignedRoundingMode));
    }
    var cardinality = (r1 / (r2 - r1)) % 2;
    if (cardinality === 0) {
        return r1;
    }
    return r2;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CollapseNumberRange.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CollapseNumberRange.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CollapseNumberRange: () => (/* binding */ CollapseNumberRange)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-collapsenumberrange
 */
function CollapseNumberRange(result) {
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponent.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponent.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ComputeExponent: () => (/* binding */ ComputeExponent)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");
/* harmony import */ var _ComputeExponentForMagnitude__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ComputeExponentForMagnitude */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponentForMagnitude.js");
/* harmony import */ var _FormatNumericToString__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./FormatNumericToString */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToString.js");



/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: it returns [exponent, magnitude].
 */
function ComputeExponent(numberFormat, x, _a) {
    var getInternalSlots = _a.getInternalSlots;
    if (x === 0) {
        return [0, 0];
    }
    if (x < 0) {
        x = -x;
    }
    var magnitude = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMagnitude)(x);
    var exponent = (0,_ComputeExponentForMagnitude__WEBPACK_IMPORTED_MODULE_1__.ComputeExponentForMagnitude)(numberFormat, magnitude, {
        getInternalSlots: getInternalSlots,
    });
    // Preserve more precision by doing multiplication when exponent is negative.
    x = exponent < 0 ? x * Math.pow(10, -exponent) : x / Math.pow(10, exponent);
    var formatNumberResult = (0,_FormatNumericToString__WEBPACK_IMPORTED_MODULE_2__.FormatNumericToString)(getInternalSlots(numberFormat), x);
    if (formatNumberResult.roundedNumber === 0) {
        return [exponent, magnitude];
    }
    var newMagnitude = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMagnitude)(formatNumberResult.roundedNumber);
    if (newMagnitude === magnitude - exponent) {
        return [exponent, magnitude];
    }
    return [
        (0,_ComputeExponentForMagnitude__WEBPACK_IMPORTED_MODULE_1__.ComputeExponentForMagnitude)(numberFormat, magnitude + 1, {
            getInternalSlots: getInternalSlots,
        }),
        magnitude + 1,
    ];
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponentForMagnitude.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponentForMagnitude.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ComputeExponentForMagnitude: () => (/* binding */ ComputeExponentForMagnitude)
/* harmony export */ });
/**
 * The abstract operation ComputeExponentForMagnitude computes an exponent by which to scale a
 * number of the given magnitude (power of ten of the most significant digit) according to the
 * locale and the desired notation (scientific, engineering, or compact).
 */
function ComputeExponentForMagnitude(numberFormat, magnitude, _a) {
    var getInternalSlots = _a.getInternalSlots;
    var internalSlots = getInternalSlots(numberFormat);
    var notation = internalSlots.notation, dataLocaleData = internalSlots.dataLocaleData, numberingSystem = internalSlots.numberingSystem;
    switch (notation) {
        case 'standard':
            return 0;
        case 'scientific':
            return magnitude;
        case 'engineering':
            return Math.floor(magnitude / 3) * 3;
        default: {
            // Let exponent be an implementation- and locale-dependent (ILD) integer by which to scale a
            // number of the given magnitude in compact notation for the current locale.
            var compactDisplay = internalSlots.compactDisplay, style = internalSlots.style, currencyDisplay = internalSlots.currencyDisplay;
            var thresholdMap = void 0;
            if (style === 'currency' && currencyDisplay !== 'name') {
                var currency = dataLocaleData.numbers.currency[numberingSystem] ||
                    dataLocaleData.numbers.currency[dataLocaleData.numbers.nu[0]];
                thresholdMap = currency.short;
            }
            else {
                var decimal = dataLocaleData.numbers.decimal[numberingSystem] ||
                    dataLocaleData.numbers.decimal[dataLocaleData.numbers.nu[0]];
                thresholdMap = compactDisplay === 'long' ? decimal.long : decimal.short;
            }
            if (!thresholdMap) {
                return 0;
            }
            var num = String(Math.pow(10, magnitude));
            var thresholds = Object.keys(thresholdMap); // TODO: this can be pre-processed
            if (num < thresholds[0]) {
                return 0;
            }
            if (num > thresholds[thresholds.length - 1]) {
                return thresholds[thresholds.length - 1].length - 1;
            }
            var i = thresholds.indexOf(num);
            if (i === -1) {
                return 0;
            }
            // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
            // Special handling if the pattern is precisely `0`.
            var magnitudeKey = thresholds[i];
            // TODO: do we need to handle plural here?
            var compactPattern = thresholdMap[magnitudeKey].other;
            if (compactPattern === '0') {
                return 0;
            }
            // Example: in zh-TW, `10000000` maps to `0000萬`. So we need to return 8 - 4 = 4 here.
            return (magnitudeKey.length -
                thresholdMap[magnitudeKey].other.match(/0+/)[0].length);
        }
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CurrencyDigits.js":
/*!************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CurrencyDigits.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CurrencyDigits: () => (/* binding */ CurrencyDigits)
/* harmony export */ });
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");

/**
 * https://tc39.es/ecma402/#sec-currencydigits
 */
function CurrencyDigits(c, _a) {
    var currencyDigitsData = _a.currencyDigitsData;
    return (0,_262__WEBPACK_IMPORTED_MODULE_0__.HasOwnProperty)(currencyDigitsData, c)
        ? currencyDigitsData[c]
        : 2;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatApproximately.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatApproximately.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FormatApproximately: () => (/* binding */ FormatApproximately)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-formatapproximately
 */
function FormatApproximately(numberFormat, result, _a) {
    var getInternalSlots = _a.getInternalSlots;
    var internalSlots = getInternalSlots(numberFormat);
    var symbols = internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem];
    var approximatelySign = symbols.approximatelySign;
    result.push({ type: 'approximatelySign', value: approximatelySign });
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRange.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRange.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FormatNumericRange: () => (/* binding */ FormatNumericRange)
/* harmony export */ });
/* harmony import */ var _PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionNumberRangePattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberRangePattern.js");

/**
 * https://tc39.es/ecma402/#sec-formatnumericrange
 */
function FormatNumericRange(numberFormat, x, y, _a) {
    var getInternalSlots = _a.getInternalSlots;
    var parts = (0,_PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_0__.PartitionNumberRangePattern)(numberFormat, x, y, {
        getInternalSlots: getInternalSlots,
    });
    return parts.map(function (part) { return part.value; }).join('');
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRangeToParts.js":
/*!***********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRangeToParts.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FormatNumericRangeToParts: () => (/* binding */ FormatNumericRangeToParts)
/* harmony export */ });
/* harmony import */ var _PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionNumberRangePattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberRangePattern.js");

/**
 * https://tc39.es/ecma402/#sec-formatnumericrangetoparts
 */
function FormatNumericRangeToParts(numberFormat, x, y, _a) {
    var getInternalSlots = _a.getInternalSlots;
    var parts = (0,_PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_0__.PartitionNumberRangePattern)(numberFormat, x, y, {
        getInternalSlots: getInternalSlots,
    });
    return parts.map(function (part, index) { return ({
        type: part.type,
        value: part.value,
        source: part.source,
        result: index.toString(),
    }); });
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToParts.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToParts.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FormatNumericToParts: () => (/* binding */ FormatNumericToParts)
/* harmony export */ });
/* harmony import */ var _PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionNumberPattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberPattern.js");
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");


function FormatNumericToParts(nf, x, implDetails) {
    var parts = (0,_PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_0__.PartitionNumberPattern)(nf, x, implDetails);
    var result = (0,_262__WEBPACK_IMPORTED_MODULE_1__.ArrayCreate)(0);
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        result.push({
            type: part.type,
            value: part.value,
        });
    }
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToString.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToString.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FormatNumericToString: () => (/* binding */ FormatNumericToString)
/* harmony export */ });
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");
/* harmony import */ var _ToRawPrecision__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ToRawPrecision */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawPrecision.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");
/* harmony import */ var _ToRawFixed__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ToRawFixed */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawFixed.js");




/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
function FormatNumericToString(intlObject, x) {
    var isNegative = x < 0 || (0,_262__WEBPACK_IMPORTED_MODULE_0__.SameValue)(x, -0);
    if (isNegative) {
        x = -x;
    }
    var result;
    var rourndingType = intlObject.roundingType;
    switch (rourndingType) {
        case 'significantDigits':
            result = (0,_ToRawPrecision__WEBPACK_IMPORTED_MODULE_1__.ToRawPrecision)(x, intlObject.minimumSignificantDigits, intlObject.maximumSignificantDigits);
            break;
        case 'fractionDigits':
            result = (0,_ToRawFixed__WEBPACK_IMPORTED_MODULE_2__.ToRawFixed)(x, intlObject.minimumFractionDigits, intlObject.maximumFractionDigits);
            break;
        default:
            result = (0,_ToRawPrecision__WEBPACK_IMPORTED_MODULE_1__.ToRawPrecision)(x, 1, 2);
            if (result.integerDigitsCount > 1) {
                result = (0,_ToRawFixed__WEBPACK_IMPORTED_MODULE_2__.ToRawFixed)(x, 0, 0);
            }
            break;
    }
    x = result.roundedNumber;
    var string = result.formattedString;
    var int = result.integerDigitsCount;
    var minInteger = intlObject.minimumIntegerDigits;
    if (int < minInteger) {
        var forwardZeros = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.repeat)('0', minInteger - int);
        string = forwardZeros + string;
    }
    if (isNegative) {
        x = -x;
    }
    return { roundedNumber: x, formattedString: string };
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/GetUnsignedRoundingMode.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/GetUnsignedRoundingMode.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetUnsignedRoundingMode: () => (/* binding */ GetUnsignedRoundingMode)
/* harmony export */ });
var negativeMapping = {
    ceil: 'zero',
    floor: 'infinity',
    expand: 'infinity',
    trunc: 'zero',
    halfCeil: 'half-zero',
    halfFloor: 'half-infinity',
    halfExpand: 'half-infinity',
    halfTrunc: 'half-zero',
    halfEven: 'half-even',
};
var positiveMapping = {
    ceil: 'infinity',
    floor: 'zero',
    expand: 'infinity',
    trunc: 'zero',
    halfCeil: 'half-infinity',
    halfFloor: 'half-zero',
    halfExpand: 'half-infinity',
    halfTrunc: 'half-zero',
    halfEven: 'half-even',
};
function GetUnsignedRoundingMode(roundingMode, isNegative) {
    if (isNegative) {
        return negativeMapping[roundingMode];
    }
    return positiveMapping[roundingMode];
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/InitializeNumberFormat.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/InitializeNumberFormat.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InitializeNumberFormat: () => (/* binding */ InitializeNumberFormat)
/* harmony export */ });
/* harmony import */ var _formatjs_intl_localematcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @formatjs/intl-localematcher */ "./node_modules/@formatjs/intl-localematcher/lib/index.js");
/* harmony import */ var _CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../CanonicalizeLocaleList */ "./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeLocaleList.js");
/* harmony import */ var _CoerceOptionsToObject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../CoerceOptionsToObject */ "./node_modules/@formatjs/ecma402-abstract/lib/CoerceOptionsToObject.js");
/* harmony import */ var _GetNumberOption__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../GetNumberOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetNumberOption.js");
/* harmony import */ var _GetOption__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../GetOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js");
/* harmony import */ var _GetStringOrBooleanOption__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../GetStringOrBooleanOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetStringOrBooleanOption.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");
/* harmony import */ var _CurrencyDigits__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./CurrencyDigits */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CurrencyDigits.js");
/* harmony import */ var _SetNumberFormatDigitOptions__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./SetNumberFormatDigitOptions */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatDigitOptions.js");
/* harmony import */ var _SetNumberFormatUnitOptions__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./SetNumberFormatUnitOptions */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatUnitOptions.js");










var VALID_ROUND_INCREMENT_VALUES = [
    1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000,
];
/**
 * https://tc39.es/ecma402/#sec-initializenumberformat
 */
function InitializeNumberFormat(nf, locales, opts, _a) {
    var getInternalSlots = _a.getInternalSlots, localeData = _a.localeData, availableLocales = _a.availableLocales, numberingSystemNames = _a.numberingSystemNames, getDefaultLocale = _a.getDefaultLocale, currencyDigitsData = _a.currencyDigitsData;
    // @ts-ignore
    var requestedLocales = (0,_CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_1__.CanonicalizeLocaleList)(locales);
    var options = (0,_CoerceOptionsToObject__WEBPACK_IMPORTED_MODULE_2__.CoerceOptionsToObject)(opts);
    var opt = Object.create(null);
    var matcher = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'localeMatcher', 'string', ['lookup', 'best fit'], 'best fit');
    opt.localeMatcher = matcher;
    var numberingSystem = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'numberingSystem', 'string', undefined, undefined);
    if (numberingSystem !== undefined &&
        numberingSystemNames.indexOf(numberingSystem) < 0) {
        // 8.a. If numberingSystem does not match the Unicode Locale Identifier type nonterminal,
        // throw a RangeError exception.
        throw RangeError("Invalid numberingSystems: ".concat(numberingSystem));
    }
    opt.nu = numberingSystem;
    var r = (0,_formatjs_intl_localematcher__WEBPACK_IMPORTED_MODULE_0__.ResolveLocale)(Array.from(availableLocales), requestedLocales, opt, 
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu'], localeData, getDefaultLocale);
    var dataLocaleData = localeData[r.dataLocale];
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__.invariant)(!!dataLocaleData, "Missing locale data for ".concat(r.dataLocale));
    var internalSlots = getInternalSlots(nf);
    internalSlots.locale = r.locale;
    internalSlots.dataLocale = r.dataLocale;
    internalSlots.numberingSystem = r.nu;
    internalSlots.dataLocaleData = dataLocaleData;
    (0,_SetNumberFormatUnitOptions__WEBPACK_IMPORTED_MODULE_5__.SetNumberFormatUnitOptions)(nf, options, { getInternalSlots: getInternalSlots });
    var style = internalSlots.style;
    var mnfdDefault;
    var mxfdDefault;
    if (style === 'currency') {
        var currency = internalSlots.currency;
        var cDigits = (0,_CurrencyDigits__WEBPACK_IMPORTED_MODULE_6__.CurrencyDigits)(currency, { currencyDigitsData: currencyDigitsData });
        mnfdDefault = cDigits;
        mxfdDefault = cDigits;
    }
    else {
        mnfdDefault = 0;
        mxfdDefault = style === 'percent' ? 0 : 3;
    }
    var notation = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'notation', 'string', ['standard', 'scientific', 'engineering', 'compact'], 'standard');
    internalSlots.notation = notation;
    (0,_SetNumberFormatDigitOptions__WEBPACK_IMPORTED_MODULE_7__.SetNumberFormatDigitOptions)(internalSlots, options, mnfdDefault, mxfdDefault, notation);
    var roundingIncrement = (0,_GetNumberOption__WEBPACK_IMPORTED_MODULE_8__.GetNumberOption)(options, 'roundingIncrement', 1, 5000, 1);
    if (VALID_ROUND_INCREMENT_VALUES.indexOf(roundingIncrement) === -1) {
        throw new RangeError("Invalid rounding increment value: ".concat(roundingIncrement, ".\nValid values are ").concat(VALID_ROUND_INCREMENT_VALUES, "."));
    }
    if (roundingIncrement !== 1 &&
        internalSlots.roundingType !== 'fractionDigits') {
        throw new TypeError("For roundingIncrement > 1 only fractionDigits is a valid roundingType");
    }
    if (roundingIncrement !== 1 &&
        internalSlots.maximumFractionDigits !== internalSlots.minimumFractionDigits) {
        throw new RangeError('With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.');
    }
    internalSlots.roundingIncrement = roundingIncrement;
    var trailingZeroDisplay = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'trailingZeroDisplay', 'string', ['auto', 'stripIfInteger'], 'auto');
    internalSlots.trailingZeroDisplay = trailingZeroDisplay;
    var compactDisplay = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'compactDisplay', 'string', ['short', 'long'], 'short');
    var defaultUseGrouping = 'auto';
    if (notation === 'compact') {
        internalSlots.compactDisplay = compactDisplay;
        defaultUseGrouping = 'min2';
    }
    internalSlots.useGrouping = (0,_GetStringOrBooleanOption__WEBPACK_IMPORTED_MODULE_9__.GetStringOrBooleanOption)(options, 'useGrouping', ['min2', 'auto', 'always'], 'always', false, defaultUseGrouping);
    internalSlots.signDisplay = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'signDisplay', 'string', ['auto', 'never', 'always', 'exceptZero', 'negative'], 'auto');
    internalSlots.roundingMode = (0,_GetOption__WEBPACK_IMPORTED_MODULE_3__.GetOption)(options, 'roundingMode', 'string', [
        'ceil',
        'floor',
        'expand',
        'trunc',
        'halfCeil',
        'halfFloor',
        'halfExpand',
        'halfTrunc',
        'halfEven',
    ], 'halfExpand');
    return nf;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberPattern.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberPattern.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PartitionNumberPattern: () => (/* binding */ PartitionNumberPattern)
/* harmony export */ });
/* harmony import */ var _FormatNumericToString__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./FormatNumericToString */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToString.js");
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");
/* harmony import */ var _ComputeExponent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ComputeExponent */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponent.js");
/* harmony import */ var _format_to_parts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./format_to_parts */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/format_to_parts.js");




/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
function PartitionNumberPattern(numberFormat, x, _a) {
    var _b;
    var getInternalSlots = _a.getInternalSlots;
    var internalSlots = getInternalSlots(numberFormat);
    var pl = internalSlots.pl, dataLocaleData = internalSlots.dataLocaleData, numberingSystem = internalSlots.numberingSystem;
    var symbols = dataLocaleData.numbers.symbols[numberingSystem] ||
        dataLocaleData.numbers.symbols[dataLocaleData.numbers.nu[0]];
    var magnitude = 0;
    var exponent = 0;
    var n;
    if (isNaN(x)) {
        n = symbols.nan;
    }
    else if (x == Number.POSITIVE_INFINITY || x == Number.NEGATIVE_INFINITY) {
        n = symbols.infinity;
    }
    else {
        if (!(0,_262__WEBPACK_IMPORTED_MODULE_0__.SameValue)(x, -0)) {
            if (!isFinite(x)) {
                throw new Error('Input must be a mathematical value');
            }
            if (internalSlots.style == 'percent') {
                x *= 100;
            }
            ;
            _b = (0,_ComputeExponent__WEBPACK_IMPORTED_MODULE_1__.ComputeExponent)(numberFormat, x, {
                getInternalSlots: getInternalSlots,
            }), exponent = _b[0], magnitude = _b[1];
            // Preserve more precision by doing multiplication when exponent is negative.
            x = exponent < 0 ? x * Math.pow(10, -exponent) : x / Math.pow(10, exponent);
        }
        var formatNumberResult = (0,_FormatNumericToString__WEBPACK_IMPORTED_MODULE_2__.FormatNumericToString)(internalSlots, x);
        n = formatNumberResult.formattedString;
        x = formatNumberResult.roundedNumber;
    }
    // Based on https://tc39.es/ecma402/#sec-getnumberformatpattern
    // We need to do this before `x` is rounded.
    var sign;
    var signDisplay = internalSlots.signDisplay;
    switch (signDisplay) {
        case 'never':
            sign = 0;
            break;
        case 'auto':
            if ((0,_262__WEBPACK_IMPORTED_MODULE_0__.SameValue)(x, 0) || x > 0 || isNaN(x)) {
                sign = 0;
            }
            else {
                sign = -1;
            }
            break;
        case 'always':
            if ((0,_262__WEBPACK_IMPORTED_MODULE_0__.SameValue)(x, 0) || x > 0 || isNaN(x)) {
                sign = 1;
            }
            else {
                sign = -1;
            }
            break;
        default:
            // x === 0 -> x is 0 or x is -0
            if (x === 0 || isNaN(x)) {
                sign = 0;
            }
            else if (x > 0) {
                sign = 1;
            }
            else {
                sign = -1;
            }
    }
    return (0,_format_to_parts__WEBPACK_IMPORTED_MODULE_3__["default"])({ roundedNumber: x, formattedString: n, exponent: exponent, magnitude: magnitude, sign: sign }, internalSlots.dataLocaleData, pl, internalSlots);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberRangePattern.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberRangePattern.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PartitionNumberRangePattern: () => (/* binding */ PartitionNumberRangePattern)
/* harmony export */ });
/* harmony import */ var _PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionNumberPattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberPattern.js");
/* harmony import */ var _CollapseNumberRange__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./CollapseNumberRange */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CollapseNumberRange.js");
/* harmony import */ var _FormatApproximately__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FormatApproximately */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatApproximately.js");



/**
 * https://tc39.es/ecma402/#sec-partitionnumberrangepattern
 */
function PartitionNumberRangePattern(numberFormat, x, y, _a) {
    var getInternalSlots = _a.getInternalSlots;
    if (isNaN(x) || isNaN(y)) {
        throw new RangeError('Input must be a number');
    }
    var result = [];
    var xResult = (0,_PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_0__.PartitionNumberPattern)(numberFormat, x, { getInternalSlots: getInternalSlots });
    var yResult = (0,_PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_0__.PartitionNumberPattern)(numberFormat, y, { getInternalSlots: getInternalSlots });
    if (xResult === yResult) {
        return (0,_FormatApproximately__WEBPACK_IMPORTED_MODULE_1__.FormatApproximately)(numberFormat, xResult, { getInternalSlots: getInternalSlots });
    }
    for (var _i = 0, xResult_1 = xResult; _i < xResult_1.length; _i++) {
        var r = xResult_1[_i];
        r.source = 'startRange';
    }
    result = result.concat(xResult);
    var internalSlots = getInternalSlots(numberFormat);
    var symbols = internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem];
    result.push({ type: 'literal', value: symbols.rangeSign, source: 'shared' });
    for (var _b = 0, yResult_1 = yResult; _b < yResult_1.length; _b++) {
        var r = yResult_1[_b];
        r.source = 'endRange';
    }
    result = result.concat(yResult);
    return (0,_CollapseNumberRange__WEBPACK_IMPORTED_MODULE_2__.CollapseNumberRange)(result);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatDigitOptions.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatDigitOptions.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SetNumberFormatDigitOptions: () => (/* binding */ SetNumberFormatDigitOptions)
/* harmony export */ });
/* harmony import */ var _DefaultNumberOption__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../DefaultNumberOption */ "./node_modules/@formatjs/ecma402-abstract/lib/DefaultNumberOption.js");
/* harmony import */ var _GetNumberOption__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../GetNumberOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetNumberOption.js");
/* harmony import */ var _GetOption__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../GetOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js");



/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 */
function SetNumberFormatDigitOptions(internalSlots, opts, mnfdDefault, mxfdDefault, notation) {
    var mnid = (0,_GetNumberOption__WEBPACK_IMPORTED_MODULE_0__.GetNumberOption)(opts, 'minimumIntegerDigits', 1, 21, 1);
    var mnfd = opts.minimumFractionDigits;
    var mxfd = opts.maximumFractionDigits;
    var mnsd = opts.minimumSignificantDigits;
    var mxsd = opts.maximumSignificantDigits;
    internalSlots.minimumIntegerDigits = mnid;
    var roundingPriority = (0,_GetOption__WEBPACK_IMPORTED_MODULE_1__.GetOption)(opts, 'roundingPriority', 'string', ['auto', 'morePrecision', 'lessPrecision'], 'auto');
    var hasSd = mnsd !== undefined || mxsd !== undefined;
    var hasFd = mnfd !== undefined || mxfd !== undefined;
    var needSd = true;
    var needFd = true;
    if (roundingPriority === 'auto') {
        needSd = hasSd;
        if (hasSd || (!hasFd && notation === 'compact')) {
            needFd = false;
        }
    }
    if (needSd) {
        if (hasSd) {
            mnsd = (0,_DefaultNumberOption__WEBPACK_IMPORTED_MODULE_2__.DefaultNumberOption)(mnsd, 1, 21, 1);
            mxsd = (0,_DefaultNumberOption__WEBPACK_IMPORTED_MODULE_2__.DefaultNumberOption)(mxsd, mnsd, 21, 21);
            internalSlots.minimumSignificantDigits = mnsd;
            internalSlots.maximumSignificantDigits = mxsd;
        }
        else {
            internalSlots.minimumSignificantDigits = 1;
            internalSlots.maximumSignificantDigits = 21;
        }
    }
    if (needFd) {
        if (hasFd) {
            mnfd = (0,_DefaultNumberOption__WEBPACK_IMPORTED_MODULE_2__.DefaultNumberOption)(mnfd, 0, 20, undefined);
            mxfd = (0,_DefaultNumberOption__WEBPACK_IMPORTED_MODULE_2__.DefaultNumberOption)(mxfd, 0, 20, undefined);
            if (mnfd === undefined) {
                // @ts-expect-error
                mnfd = Math.min(mnfdDefault, mxfd);
            }
            else if (mxfd === undefined) {
                mxfd = Math.max(mxfdDefault, mnfd);
            }
            else if (mnfd > mxfd) {
                throw new RangeError("Invalid range, ".concat(mnfd, " > ").concat(mxfd));
            }
            internalSlots.minimumFractionDigits = mnfd;
            internalSlots.maximumFractionDigits = mxfd;
        }
        else {
            internalSlots.minimumFractionDigits = mnfdDefault;
            internalSlots.maximumFractionDigits = mxfdDefault;
        }
    }
    if (needSd || needFd) {
        if (roundingPriority === 'morePrecision') {
            internalSlots.roundingType = 'morePrecision';
        }
        else if (roundingPriority === 'lessPrecision') {
            internalSlots.roundingType = 'lessPrecision';
        }
        else if (hasSd) {
            internalSlots.roundingType = 'significantDigits';
        }
        else {
            internalSlots.roundingType = 'fractionDigits';
        }
    }
    else {
        internalSlots.roundingType = 'morePrecision';
        internalSlots.minimumFractionDigits = 0;
        internalSlots.maximumFractionDigits = 0;
        internalSlots.minimumSignificantDigits = 1;
        internalSlots.maximumSignificantDigits = 2;
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatUnitOptions.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatUnitOptions.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SetNumberFormatUnitOptions: () => (/* binding */ SetNumberFormatUnitOptions)
/* harmony export */ });
/* harmony import */ var _GetOption__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../GetOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js");
/* harmony import */ var _IsWellFormedCurrencyCode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../IsWellFormedCurrencyCode */ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedCurrencyCode.js");
/* harmony import */ var _IsWellFormedUnitIdentifier__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../IsWellFormedUnitIdentifier */ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedUnitIdentifier.js");



/**
 * https://tc39.es/ecma402/#sec-setnumberformatunitoptions
 */
function SetNumberFormatUnitOptions(nf, options, _a) {
    if (options === void 0) { options = Object.create(null); }
    var getInternalSlots = _a.getInternalSlots;
    var internalSlots = getInternalSlots(nf);
    var style = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'style', 'string', ['decimal', 'percent', 'currency', 'unit'], 'decimal');
    internalSlots.style = style;
    var currency = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'currency', 'string', undefined, undefined);
    if (currency !== undefined && !(0,_IsWellFormedCurrencyCode__WEBPACK_IMPORTED_MODULE_1__.IsWellFormedCurrencyCode)(currency)) {
        throw RangeError('Malformed currency code');
    }
    if (style === 'currency' && currency === undefined) {
        throw TypeError('currency cannot be undefined');
    }
    var currencyDisplay = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'currencyDisplay', 'string', ['code', 'symbol', 'narrowSymbol', 'name'], 'symbol');
    var currencySign = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'currencySign', 'string', ['standard', 'accounting'], 'standard');
    var unit = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'unit', 'string', undefined, undefined);
    if (unit !== undefined && !(0,_IsWellFormedUnitIdentifier__WEBPACK_IMPORTED_MODULE_2__.IsWellFormedUnitIdentifier)(unit)) {
        throw RangeError('Invalid unit argument for Intl.NumberFormat()');
    }
    if (style === 'unit' && unit === undefined) {
        throw TypeError('unit cannot be undefined');
    }
    var unitDisplay = (0,_GetOption__WEBPACK_IMPORTED_MODULE_0__.GetOption)(options, 'unitDisplay', 'string', ['short', 'narrow', 'long'], 'short');
    if (style === 'currency') {
        internalSlots.currency = currency.toUpperCase();
        internalSlots.currencyDisplay = currencyDisplay;
        internalSlots.currencySign = currencySign;
    }
    if (style === 'unit') {
        internalSlots.unit = unit;
        internalSlots.unitDisplay = unitDisplay;
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawFixed.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawFixed.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ToRawFixed: () => (/* binding */ ToRawFixed)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");

/**
 * TODO: dedup with intl-pluralrules and support BigInt
 * https://tc39.es/ecma402/#sec-torawfixed
 * @param x a finite non-negative Number or BigInt
 * @param minFraction and integer between 0 and 20
 * @param maxFraction and integer between 0 and 20
 */
function ToRawFixed(x, minFraction, maxFraction) {
    var f = maxFraction;
    var n = Math.round(x * Math.pow(10, f));
    var xFinal = n / Math.pow(10, f);
    // n is a positive integer, but it is possible to be greater than 1e21.
    // In such case we will go the slow path.
    // See also: https://tc39.es/ecma262/#sec-numeric-types-number-tostring
    var m;
    if (n < 1e21) {
        m = n.toString();
    }
    else {
        m = n.toString();
        var _a = m.split('e'), mantissa = _a[0], exponent = _a[1];
        m = mantissa.replace('.', '');
        m = m + (0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', Math.max(+exponent - m.length + 1, 0));
    }
    var int;
    if (f !== 0) {
        var k = m.length;
        if (k <= f) {
            var z = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', f + 1 - k);
            m = z + m;
            k = f + 1;
        }
        var a = m.slice(0, k - f);
        var b = m.slice(k - f);
        m = "".concat(a, ".").concat(b);
        int = a.length;
    }
    else {
        int = m.length;
    }
    var cut = maxFraction - minFraction;
    while (cut > 0 && m[m.length - 1] === '0') {
        m = m.slice(0, -1);
        cut--;
    }
    if (m[m.length - 1] === '.') {
        m = m.slice(0, -1);
    }
    return { formattedString: m, roundedNumber: xFinal, integerDigitsCount: int };
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawPrecision.js":
/*!************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawPrecision.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ToRawPrecision: () => (/* binding */ ToRawPrecision)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");

function ToRawPrecision(x, minPrecision, maxPrecision) {
    var p = maxPrecision;
    var m;
    var e;
    var xFinal;
    if (x === 0) {
        m = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', p);
        e = 0;
        xFinal = 0;
    }
    else {
        var xToString = x.toString();
        // If xToString is formatted as scientific notation, the number is either very small or very
        // large. If the precision of the formatted string is lower that requested max precision, we
        // should still infer them from the formatted string, otherwise the formatted result might have
        // precision loss (e.g. 1e41 will not have 0 in every trailing digits).
        var xToStringExponentIndex = xToString.indexOf('e');
        var _a = xToString.split('e'), xToStringMantissa = _a[0], xToStringExponent = _a[1];
        var xToStringMantissaWithoutDecimalPoint = xToStringMantissa.replace('.', '');
        if (xToStringExponentIndex >= 0 &&
            xToStringMantissaWithoutDecimalPoint.length <= p) {
            e = +xToStringExponent;
            m =
                xToStringMantissaWithoutDecimalPoint +
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', p - xToStringMantissaWithoutDecimalPoint.length);
            xFinal = x;
        }
        else {
            e = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMagnitude)(x);
            var decimalPlaceOffset = e - p + 1;
            // n is the integer containing the required precision digits. To derive the formatted string,
            // we will adjust its decimal place in the logic below.
            var n = Math.round(adjustDecimalPlace(x, decimalPlaceOffset));
            // The rounding caused the change of magnitude, so we should increment `e` by 1.
            if (adjustDecimalPlace(n, p - 1) >= 10) {
                e = e + 1;
                // Divide n by 10 to swallow one precision.
                n = Math.floor(n / 10);
            }
            m = n.toString();
            // Equivalent of n * 10 ** (e - p + 1)
            xFinal = adjustDecimalPlace(n, p - 1 - e);
        }
    }
    var int;
    if (e >= p - 1) {
        m = m + (0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', e - p + 1);
        int = e + 1;
    }
    else if (e >= 0) {
        m = "".concat(m.slice(0, e + 1), ".").concat(m.slice(e + 1));
        int = e + 1;
    }
    else {
        m = "0.".concat((0,_utils__WEBPACK_IMPORTED_MODULE_0__.repeat)('0', -e - 1)).concat(m);
        int = 1;
    }
    if (m.indexOf('.') >= 0 && maxPrecision > minPrecision) {
        var cut = maxPrecision - minPrecision;
        while (cut > 0 && m[m.length - 1] === '0') {
            m = m.slice(0, -1);
            cut--;
        }
        if (m[m.length - 1] === '.') {
            m = m.slice(0, -1);
        }
    }
    return { formattedString: m, roundedNumber: xFinal, integerDigitsCount: int };
    // x / (10 ** magnitude), but try to preserve as much floating point precision as possible.
    function adjustDecimalPlace(x, magnitude) {
        return magnitude < 0 ? x * Math.pow(10, -magnitude) : x / Math.pow(10, magnitude);
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/digit-mapping.generated.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/digit-mapping.generated.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   digitMapping: () => (/* binding */ digitMapping)
/* harmony export */ });
var digitMapping = {
    "adlm": [
        "𞥐",
        "𞥑",
        "𞥒",
        "𞥓",
        "𞥔",
        "𞥕",
        "𞥖",
        "𞥗",
        "𞥘",
        "𞥙"
    ],
    "ahom": [
        "𑜰",
        "𑜱",
        "𑜲",
        "𑜳",
        "𑜴",
        "𑜵",
        "𑜶",
        "𑜷",
        "𑜸",
        "𑜹"
    ],
    "arab": [
        "٠",
        "١",
        "٢",
        "٣",
        "٤",
        "٥",
        "٦",
        "٧",
        "٨",
        "٩"
    ],
    "arabext": [
        "۰",
        "۱",
        "۲",
        "۳",
        "۴",
        "۵",
        "۶",
        "۷",
        "۸",
        "۹"
    ],
    "bali": [
        "᭐",
        "᭑",
        "᭒",
        "᭓",
        "᭔",
        "᭕",
        "᭖",
        "᭗",
        "᭘",
        "᭙"
    ],
    "beng": [
        "০",
        "১",
        "২",
        "৩",
        "৪",
        "৫",
        "৬",
        "৭",
        "৮",
        "৯"
    ],
    "bhks": [
        "𑱐",
        "𑱑",
        "𑱒",
        "𑱓",
        "𑱔",
        "𑱕",
        "𑱖",
        "𑱗",
        "𑱘",
        "𑱙"
    ],
    "brah": [
        "𑁦",
        "𑁧",
        "𑁨",
        "𑁩",
        "𑁪",
        "𑁫",
        "𑁬",
        "𑁭",
        "𑁮",
        "𑁯"
    ],
    "cakm": [
        "𑄶",
        "𑄷",
        "𑄸",
        "𑄹",
        "𑄺",
        "𑄻",
        "𑄼",
        "𑄽",
        "𑄾",
        "𑄿"
    ],
    "cham": [
        "꩐",
        "꩑",
        "꩒",
        "꩓",
        "꩔",
        "꩕",
        "꩖",
        "꩗",
        "꩘",
        "꩙"
    ],
    "deva": [
        "०",
        "१",
        "२",
        "३",
        "४",
        "५",
        "६",
        "७",
        "८",
        "९"
    ],
    "diak": [
        "𑥐",
        "𑥑",
        "𑥒",
        "𑥓",
        "𑥔",
        "𑥕",
        "𑥖",
        "𑥗",
        "𑥘",
        "𑥙"
    ],
    "fullwide": [
        "０",
        "１",
        "２",
        "３",
        "４",
        "５",
        "６",
        "７",
        "８",
        "９"
    ],
    "gong": [
        "𑶠",
        "𑶡",
        "𑶢",
        "𑶣",
        "𑶤",
        "𑶥",
        "𑶦",
        "𑶧",
        "𑶨",
        "𑶩"
    ],
    "gonm": [
        "𑵐",
        "𑵑",
        "𑵒",
        "𑵓",
        "𑵔",
        "𑵕",
        "𑵖",
        "𑵗",
        "𑵘",
        "𑵙"
    ],
    "gujr": [
        "૦",
        "૧",
        "૨",
        "૩",
        "૪",
        "૫",
        "૬",
        "૭",
        "૮",
        "૯"
    ],
    "guru": [
        "੦",
        "੧",
        "੨",
        "੩",
        "੪",
        "੫",
        "੬",
        "੭",
        "੮",
        "੯"
    ],
    "hanidec": [
        "〇",
        "一",
        "二",
        "三",
        "四",
        "五",
        "六",
        "七",
        "八",
        "九"
    ],
    "hmng": [
        "𖭐",
        "𖭑",
        "𖭒",
        "𖭓",
        "𖭔",
        "𖭕",
        "𖭖",
        "𖭗",
        "𖭘",
        "𖭙"
    ],
    "hmnp": [
        "𞅀",
        "𞅁",
        "𞅂",
        "𞅃",
        "𞅄",
        "𞅅",
        "𞅆",
        "𞅇",
        "𞅈",
        "𞅉"
    ],
    "java": [
        "꧐",
        "꧑",
        "꧒",
        "꧓",
        "꧔",
        "꧕",
        "꧖",
        "꧗",
        "꧘",
        "꧙"
    ],
    "kali": [
        "꤀",
        "꤁",
        "꤂",
        "꤃",
        "꤄",
        "꤅",
        "꤆",
        "꤇",
        "꤈",
        "꤉"
    ],
    "khmr": [
        "០",
        "១",
        "២",
        "៣",
        "៤",
        "៥",
        "៦",
        "៧",
        "៨",
        "៩"
    ],
    "knda": [
        "೦",
        "೧",
        "೨",
        "೩",
        "೪",
        "೫",
        "೬",
        "೭",
        "೮",
        "೯"
    ],
    "lana": [
        "᪀",
        "᪁",
        "᪂",
        "᪃",
        "᪄",
        "᪅",
        "᪆",
        "᪇",
        "᪈",
        "᪉"
    ],
    "lanatham": [
        "᪐",
        "᪑",
        "᪒",
        "᪓",
        "᪔",
        "᪕",
        "᪖",
        "᪗",
        "᪘",
        "᪙"
    ],
    "laoo": [
        "໐",
        "໑",
        "໒",
        "໓",
        "໔",
        "໕",
        "໖",
        "໗",
        "໘",
        "໙"
    ],
    "lepc": [
        "᪐",
        "᪑",
        "᪒",
        "᪓",
        "᪔",
        "᪕",
        "᪖",
        "᪗",
        "᪘",
        "᪙"
    ],
    "limb": [
        "᥆",
        "᥇",
        "᥈",
        "᥉",
        "᥊",
        "᥋",
        "᥌",
        "᥍",
        "᥎",
        "᥏"
    ],
    "mathbold": [
        "𝟎",
        "𝟏",
        "𝟐",
        "𝟑",
        "𝟒",
        "𝟓",
        "𝟔",
        "𝟕",
        "𝟖",
        "𝟗"
    ],
    "mathdbl": [
        "𝟘",
        "𝟙",
        "𝟚",
        "𝟛",
        "𝟜",
        "𝟝",
        "𝟞",
        "𝟟",
        "𝟠",
        "𝟡"
    ],
    "mathmono": [
        "𝟶",
        "𝟷",
        "𝟸",
        "𝟹",
        "𝟺",
        "𝟻",
        "𝟼",
        "𝟽",
        "𝟾",
        "𝟿"
    ],
    "mathsanb": [
        "𝟬",
        "𝟭",
        "𝟮",
        "𝟯",
        "𝟰",
        "𝟱",
        "𝟲",
        "𝟳",
        "𝟴",
        "𝟵"
    ],
    "mathsans": [
        "𝟢",
        "𝟣",
        "𝟤",
        "𝟥",
        "𝟦",
        "𝟧",
        "𝟨",
        "𝟩",
        "𝟪",
        "𝟫"
    ],
    "mlym": [
        "൦",
        "൧",
        "൨",
        "൩",
        "൪",
        "൫",
        "൬",
        "൭",
        "൮",
        "൯"
    ],
    "modi": [
        "𑙐",
        "𑙑",
        "𑙒",
        "𑙓",
        "𑙔",
        "𑙕",
        "𑙖",
        "𑙗",
        "𑙘",
        "𑙙"
    ],
    "mong": [
        "᠐",
        "᠑",
        "᠒",
        "᠓",
        "᠔",
        "᠕",
        "᠖",
        "᠗",
        "᠘",
        "᠙"
    ],
    "mroo": [
        "𖩠",
        "𖩡",
        "𖩢",
        "𖩣",
        "𖩤",
        "𖩥",
        "𖩦",
        "𖩧",
        "𖩨",
        "𖩩"
    ],
    "mtei": [
        "꯰",
        "꯱",
        "꯲",
        "꯳",
        "꯴",
        "꯵",
        "꯶",
        "꯷",
        "꯸",
        "꯹"
    ],
    "mymr": [
        "၀",
        "၁",
        "၂",
        "၃",
        "၄",
        "၅",
        "၆",
        "၇",
        "၈",
        "၉"
    ],
    "mymrshan": [
        "႐",
        "႑",
        "႒",
        "႓",
        "႔",
        "႕",
        "႖",
        "႗",
        "႘",
        "႙"
    ],
    "mymrtlng": [
        "꧰",
        "꧱",
        "꧲",
        "꧳",
        "꧴",
        "꧵",
        "꧶",
        "꧷",
        "꧸",
        "꧹"
    ],
    "newa": [
        "𑑐",
        "𑑑",
        "𑑒",
        "𑑓",
        "𑑔",
        "𑑕",
        "𑑖",
        "𑑗",
        "𑑘",
        "𑑙"
    ],
    "nkoo": [
        "߀",
        "߁",
        "߂",
        "߃",
        "߄",
        "߅",
        "߆",
        "߇",
        "߈",
        "߉"
    ],
    "olck": [
        "᱐",
        "᱑",
        "᱒",
        "᱓",
        "᱔",
        "᱕",
        "᱖",
        "᱗",
        "᱘",
        "᱙"
    ],
    "orya": [
        "୦",
        "୧",
        "୨",
        "୩",
        "୪",
        "୫",
        "୬",
        "୭",
        "୮",
        "୯"
    ],
    "osma": [
        "𐒠",
        "𐒡",
        "𐒢",
        "𐒣",
        "𐒤",
        "𐒥",
        "𐒦",
        "𐒧",
        "𐒨",
        "𐒩"
    ],
    "rohg": [
        "𐴰",
        "𐴱",
        "𐴲",
        "𐴳",
        "𐴴",
        "𐴵",
        "𐴶",
        "𐴷",
        "𐴸",
        "𐴹"
    ],
    "saur": [
        "꣐",
        "꣑",
        "꣒",
        "꣓",
        "꣔",
        "꣕",
        "꣖",
        "꣗",
        "꣘",
        "꣙"
    ],
    "segment": [
        "🯰",
        "🯱",
        "🯲",
        "🯳",
        "🯴",
        "🯵",
        "🯶",
        "🯷",
        "🯸",
        "🯹"
    ],
    "shrd": [
        "𑇐",
        "𑇑",
        "𑇒",
        "𑇓",
        "𑇔",
        "𑇕",
        "𑇖",
        "𑇗",
        "𑇘",
        "𑇙"
    ],
    "sind": [
        "𑋰",
        "𑋱",
        "𑋲",
        "𑋳",
        "𑋴",
        "𑋵",
        "𑋶",
        "𑋷",
        "𑋸",
        "𑋹"
    ],
    "sinh": [
        "෦",
        "෧",
        "෨",
        "෩",
        "෪",
        "෫",
        "෬",
        "෭",
        "෮",
        "෯"
    ],
    "sora": [
        "𑃰",
        "𑃱",
        "𑃲",
        "𑃳",
        "𑃴",
        "𑃵",
        "𑃶",
        "𑃷",
        "𑃸",
        "𑃹"
    ],
    "sund": [
        "᮰",
        "᮱",
        "᮲",
        "᮳",
        "᮴",
        "᮵",
        "᮶",
        "᮷",
        "᮸",
        "᮹"
    ],
    "takr": [
        "𑛀",
        "𑛁",
        "𑛂",
        "𑛃",
        "𑛄",
        "𑛅",
        "𑛆",
        "𑛇",
        "𑛈",
        "𑛉"
    ],
    "talu": [
        "᧐",
        "᧑",
        "᧒",
        "᧓",
        "᧔",
        "᧕",
        "᧖",
        "᧗",
        "᧘",
        "᧙"
    ],
    "tamldec": [
        "௦",
        "௧",
        "௨",
        "௩",
        "௪",
        "௫",
        "௬",
        "௭",
        "௮",
        "௯"
    ],
    "telu": [
        "౦",
        "౧",
        "౨",
        "౩",
        "౪",
        "౫",
        "౬",
        "౭",
        "౮",
        "౯"
    ],
    "thai": [
        "๐",
        "๑",
        "๒",
        "๓",
        "๔",
        "๕",
        "๖",
        "๗",
        "๘",
        "๙"
    ],
    "tibt": [
        "༠",
        "༡",
        "༢",
        "༣",
        "༤",
        "༥",
        "༦",
        "༧",
        "༨",
        "༩"
    ],
    "tirh": [
        "𑓐",
        "𑓑",
        "𑓒",
        "𑓓",
        "𑓔",
        "𑓕",
        "𑓖",
        "𑓗",
        "𑓘",
        "𑓙"
    ],
    "vaii": [
        "ᘠ",
        "ᘡ",
        "ᘢ",
        "ᘣ",
        "ᘤ",
        "ᘥ",
        "ᘦ",
        "ᘧ",
        "ᘨ",
        "ᘩ"
    ],
    "wara": [
        "𑣠",
        "𑣡",
        "𑣢",
        "𑣣",
        "𑣤",
        "𑣥",
        "𑣦",
        "𑣧",
        "𑣨",
        "𑣩"
    ],
    "wcho": [
        "𞋰",
        "𞋱",
        "𞋲",
        "𞋳",
        "𞋴",
        "𞋵",
        "𞋶",
        "𞋷",
        "𞋸",
        "𞋹"
    ]
};


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/format_to_parts.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/format_to_parts.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ formatToParts)
/* harmony export */ });
/* harmony import */ var _ToRawFixed__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ToRawFixed */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawFixed.js");
/* harmony import */ var _digit_mapping_generated__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./digit-mapping.generated */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/digit-mapping.generated.js");
/* harmony import */ var _regex_generated__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../regex.generated */ "./node_modules/@formatjs/ecma402-abstract/lib/regex.generated.js");



// This is from: unicode-12.1.0/General_Category/Symbol/regex.js
// IE11 does not support unicode flag, otherwise this is just /\p{S}/u.
// /^\p{S}/u
var CARET_S_UNICODE_REGEX = new RegExp("^".concat(_regex_generated__WEBPACK_IMPORTED_MODULE_0__.S_UNICODE_REGEX.source));
// /\p{S}$/u
var S_DOLLAR_UNICODE_REGEX = new RegExp("".concat(_regex_generated__WEBPACK_IMPORTED_MODULE_0__.S_UNICODE_REGEX.source, "$"));
var CLDR_NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;
function formatToParts(numberResult, data, pl, options) {
    var sign = numberResult.sign, exponent = numberResult.exponent, magnitude = numberResult.magnitude;
    var notation = options.notation, style = options.style, numberingSystem = options.numberingSystem;
    var defaultNumberingSystem = data.numbers.nu[0];
    // #region Part 1: partition and interpolate the CLDR number pattern.
    // ----------------------------------------------------------
    var compactNumberPattern = null;
    if (notation === 'compact' && magnitude) {
        compactNumberPattern = getCompactDisplayPattern(numberResult, pl, data, style, options.compactDisplay, options.currencyDisplay, numberingSystem);
    }
    // This is used multiple times
    var nonNameCurrencyPart;
    if (style === 'currency' && options.currencyDisplay !== 'name') {
        var byCurrencyDisplay = data.currencies[options.currency];
        if (byCurrencyDisplay) {
            switch (options.currencyDisplay) {
                case 'code':
                    nonNameCurrencyPart = options.currency;
                    break;
                case 'symbol':
                    nonNameCurrencyPart = byCurrencyDisplay.symbol;
                    break;
                default:
                    nonNameCurrencyPart = byCurrencyDisplay.narrow;
                    break;
            }
        }
        else {
            // Fallback for unknown currency
            nonNameCurrencyPart = options.currency;
        }
    }
    var numberPattern;
    if (!compactNumberPattern) {
        // Note: if the style is unit, or is currency and the currency display is name,
        // its unit parts will be interpolated in part 2. So here we can fallback to decimal.
        if (style === 'decimal' ||
            style === 'unit' ||
            (style === 'currency' && options.currencyDisplay === 'name')) {
            // Shortcut for decimal
            var decimalData = data.numbers.decimal[numberingSystem] ||
                data.numbers.decimal[defaultNumberingSystem];
            numberPattern = getPatternForSign(decimalData.standard, sign);
        }
        else if (style === 'currency') {
            var currencyData = data.numbers.currency[numberingSystem] ||
                data.numbers.currency[defaultNumberingSystem];
            // We replace number pattern part with `0` for easier postprocessing.
            numberPattern = getPatternForSign(currencyData[options.currencySign], sign);
        }
        else {
            // percent
            var percentPattern = data.numbers.percent[numberingSystem] ||
                data.numbers.percent[defaultNumberingSystem];
            numberPattern = getPatternForSign(percentPattern, sign);
        }
    }
    else {
        numberPattern = compactNumberPattern;
    }
    // Extract the decimal number pattern string. It looks like "#,##0,00", which will later be
    // used to infer decimal group sizes.
    var decimalNumberPattern = CLDR_NUMBER_PATTERN.exec(numberPattern)[0];
    // Now we start to substitute patterns
    // 1. replace strings like `0` and `#,##0.00` with `{0}`
    // 2. unquote characters (invariant: the quoted characters does not contain the special tokens)
    numberPattern = numberPattern
        .replace(CLDR_NUMBER_PATTERN, '{0}')
        .replace(/'(.)'/g, '$1');
    // Handle currency spacing (both compact and non-compact).
    if (style === 'currency' && options.currencyDisplay !== 'name') {
        var currencyData = data.numbers.currency[numberingSystem] ||
            data.numbers.currency[defaultNumberingSystem];
        // See `currencySpacing` substitution rule in TR-35.
        // Here we always assume the currencyMatch is "[:^S:]" and surroundingMatch is "[:digit:]".
        //
        // Example 1: for pattern "#,##0.00¤" with symbol "US$", we replace "¤" with the symbol,
        // but insert an extra non-break space before the symbol, because "[:^S:]" matches "U" in
        // "US$" and "[:digit:]" matches the latn numbering system digits.
        //
        // Example 2: for pattern "¤#,##0.00" with symbol "US$", there is no spacing between symbol
        // and number, because `$` does not match "[:^S:]".
        //
        // Implementation note: here we do the best effort to infer the insertion.
        // We also assume that `beforeInsertBetween` and `afterInsertBetween` will never be `;`.
        var afterCurrency = currencyData.currencySpacing.afterInsertBetween;
        if (afterCurrency && !S_DOLLAR_UNICODE_REGEX.test(nonNameCurrencyPart)) {
            numberPattern = numberPattern.replace('¤{0}', "\u00A4".concat(afterCurrency, "{0}"));
        }
        var beforeCurrency = currencyData.currencySpacing.beforeInsertBetween;
        if (beforeCurrency && !CARET_S_UNICODE_REGEX.test(nonNameCurrencyPart)) {
            numberPattern = numberPattern.replace('{0}¤', "{0}".concat(beforeCurrency, "\u00A4"));
        }
    }
    // The following tokens are special: `{0}`, `¤`, `%`, `-`, `+`, `{c:...}.
    var numberPatternParts = numberPattern.split(/({c:[^}]+}|\{0\}|[¤%\-\+])/g);
    var numberParts = [];
    var symbols = data.numbers.symbols[numberingSystem] ||
        data.numbers.symbols[defaultNumberingSystem];
    for (var _i = 0, numberPatternParts_1 = numberPatternParts; _i < numberPatternParts_1.length; _i++) {
        var part = numberPatternParts_1[_i];
        if (!part) {
            continue;
        }
        switch (part) {
            case '{0}': {
                // We only need to handle scientific and engineering notation here.
                numberParts.push.apply(numberParts, paritionNumberIntoParts(symbols, numberResult, notation, exponent, numberingSystem, 
                // If compact number pattern exists, do not insert group separators.
                !compactNumberPattern && Boolean(options.useGrouping), decimalNumberPattern));
                break;
            }
            case '-':
                numberParts.push({ type: 'minusSign', value: symbols.minusSign });
                break;
            case '+':
                numberParts.push({ type: 'plusSign', value: symbols.plusSign });
                break;
            case '%':
                numberParts.push({ type: 'percentSign', value: symbols.percentSign });
                break;
            case '¤':
                // Computed above when handling currency spacing.
                numberParts.push({ type: 'currency', value: nonNameCurrencyPart });
                break;
            default:
                if (/^\{c:/.test(part)) {
                    numberParts.push({
                        type: 'compact',
                        value: part.substring(3, part.length - 1),
                    });
                }
                else {
                    // literal
                    numberParts.push({ type: 'literal', value: part });
                }
                break;
        }
    }
    // #endregion
    // #region Part 2: interpolate unit pattern if necessary.
    // ----------------------------------------------
    switch (style) {
        case 'currency': {
            // `currencyDisplay: 'name'` has similar pattern handling as units.
            if (options.currencyDisplay === 'name') {
                var unitPattern = (data.numbers.currency[numberingSystem] ||
                    data.numbers.currency[defaultNumberingSystem]).unitPattern;
                // Select plural
                var unitName = void 0;
                var currencyNameData = data.currencies[options.currency];
                if (currencyNameData) {
                    unitName = selectPlural(pl, numberResult.roundedNumber * Math.pow(10, exponent), currencyNameData.displayName);
                }
                else {
                    // Fallback for unknown currency
                    unitName = options.currency;
                }
                // Do {0} and {1} substitution
                var unitPatternParts = unitPattern.split(/(\{[01]\})/g);
                var result = [];
                for (var _a = 0, unitPatternParts_1 = unitPatternParts; _a < unitPatternParts_1.length; _a++) {
                    var part = unitPatternParts_1[_a];
                    switch (part) {
                        case '{0}':
                            result.push.apply(result, numberParts);
                            break;
                        case '{1}':
                            result.push({ type: 'currency', value: unitName });
                            break;
                        default:
                            if (part) {
                                result.push({ type: 'literal', value: part });
                            }
                            break;
                    }
                }
                return result;
            }
            else {
                return numberParts;
            }
        }
        case 'unit': {
            var unit = options.unit, unitDisplay = options.unitDisplay;
            var unitData = data.units.simple[unit];
            var unitPattern = void 0;
            if (unitData) {
                // Simple unit pattern
                unitPattern = selectPlural(pl, numberResult.roundedNumber * Math.pow(10, exponent), data.units.simple[unit][unitDisplay]);
            }
            else {
                // See: http://unicode.org/reports/tr35/tr35-general.html#perUnitPatterns
                // If cannot find unit in the simple pattern, it must be "per" compound pattern.
                // Implementation note: we are not following TR-35 here because we need to format to parts!
                var _b = unit.split('-per-'), numeratorUnit = _b[0], denominatorUnit = _b[1];
                unitData = data.units.simple[numeratorUnit];
                var numeratorUnitPattern = selectPlural(pl, numberResult.roundedNumber * Math.pow(10, exponent), data.units.simple[numeratorUnit][unitDisplay]);
                var perUnitPattern = data.units.simple[denominatorUnit].perUnit[unitDisplay];
                if (perUnitPattern) {
                    // perUnitPattern exists, combine it with numeratorUnitPattern
                    unitPattern = perUnitPattern.replace('{0}', numeratorUnitPattern);
                }
                else {
                    // get compoundUnit pattern (e.g. "{0} per {1}"), repalce {0} with numerator pattern and {1} with
                    // the denominator pattern in singular form.
                    var perPattern = data.units.compound.per[unitDisplay];
                    var denominatorPattern = selectPlural(pl, 1, data.units.simple[denominatorUnit][unitDisplay]);
                    unitPattern = unitPattern = perPattern
                        .replace('{0}', numeratorUnitPattern)
                        .replace('{1}', denominatorPattern.replace('{0}', ''));
                }
            }
            var result = [];
            // We need spacing around "{0}" because they are not treated as "unit" parts, but "literal".
            for (var _c = 0, _d = unitPattern.split(/(\s*\{0\}\s*)/); _c < _d.length; _c++) {
                var part = _d[_c];
                var interpolateMatch = /^(\s*)\{0\}(\s*)$/.exec(part);
                if (interpolateMatch) {
                    // Space before "{0}"
                    if (interpolateMatch[1]) {
                        result.push({ type: 'literal', value: interpolateMatch[1] });
                    }
                    // "{0}" itself
                    result.push.apply(result, numberParts);
                    // Space after "{0}"
                    if (interpolateMatch[2]) {
                        result.push({ type: 'literal', value: interpolateMatch[2] });
                    }
                }
                else if (part) {
                    result.push({ type: 'unit', value: part });
                }
            }
            return result;
        }
        default:
            return numberParts;
    }
    // #endregion
}
// A subset of https://tc39.es/ecma402/#sec-partitionnotationsubpattern
// Plus the exponent parts handling.
function paritionNumberIntoParts(symbols, numberResult, notation, exponent, numberingSystem, useGrouping, 
/**
 * This is the decimal number pattern without signs or symbols.
 * It is used to infer the group size when `useGrouping` is true.
 *
 * A typical value looks like "#,##0.00" (primary group size is 3).
 * Some locales like Hindi has secondary group size of 2 (e.g. "#,##,##0.00").
 */
decimalNumberPattern) {
    var result = [];
    // eslint-disable-next-line prefer-const
    var n = numberResult.formattedString, x = numberResult.roundedNumber;
    if (isNaN(x)) {
        return [{ type: 'nan', value: n }];
    }
    else if (!isFinite(x)) {
        return [{ type: 'infinity', value: n }];
    }
    var digitReplacementTable = _digit_mapping_generated__WEBPACK_IMPORTED_MODULE_1__.digitMapping[numberingSystem];
    if (digitReplacementTable) {
        n = n.replace(/\d/g, function (digit) { return digitReplacementTable[+digit] || digit; });
    }
    // TODO: Else use an implementation dependent algorithm to map n to the appropriate
    // representation of n in the given numbering system.
    var decimalSepIndex = n.indexOf('.');
    var integer;
    var fraction;
    if (decimalSepIndex > 0) {
        integer = n.slice(0, decimalSepIndex);
        fraction = n.slice(decimalSepIndex + 1);
    }
    else {
        integer = n;
    }
    // #region Grouping integer digits
    // The weird compact and x >= 10000 check is to ensure consistency with Node.js and Chrome.
    // Note that `de` does not have compact form for thousands, but Node.js does not insert grouping separator
    // unless the rounded number is greater than 10000:
    //   NumberFormat('de', {notation: 'compact', compactDisplay: 'short'}).format(1234) //=> "1234"
    //   NumberFormat('de').format(1234) //=> "1.234"
    if (useGrouping && (notation !== 'compact' || x >= 10000)) {
        var groupSepSymbol = symbols.group;
        var groups = [];
        // > There may be two different grouping sizes: The primary grouping size used for the least
        // > significant integer group, and the secondary grouping size used for more significant groups.
        // > If a pattern contains multiple grouping separators, the interval between the last one and the
        // > end of the integer defines the primary grouping size, and the interval between the last two
        // > defines the secondary grouping size. All others are ignored.
        var integerNumberPattern = decimalNumberPattern.split('.')[0];
        var patternGroups = integerNumberPattern.split(',');
        var primaryGroupingSize = 3;
        var secondaryGroupingSize = 3;
        if (patternGroups.length > 1) {
            primaryGroupingSize = patternGroups[patternGroups.length - 1].length;
        }
        if (patternGroups.length > 2) {
            secondaryGroupingSize = patternGroups[patternGroups.length - 2].length;
        }
        var i = integer.length - primaryGroupingSize;
        if (i > 0) {
            // Slice the least significant integer group
            groups.push(integer.slice(i, i + primaryGroupingSize));
            // Then iteratively push the more signicant groups
            // TODO: handle surrogate pairs in some numbering system digits
            for (i -= secondaryGroupingSize; i > 0; i -= secondaryGroupingSize) {
                groups.push(integer.slice(i, i + secondaryGroupingSize));
            }
            groups.push(integer.slice(0, i + secondaryGroupingSize));
        }
        else {
            groups.push(integer);
        }
        while (groups.length > 0) {
            var integerGroup = groups.pop();
            result.push({ type: 'integer', value: integerGroup });
            if (groups.length > 0) {
                result.push({ type: 'group', value: groupSepSymbol });
            }
        }
    }
    else {
        result.push({ type: 'integer', value: integer });
    }
    // #endregion
    if (fraction !== undefined) {
        result.push({ type: 'decimal', value: symbols.decimal }, { type: 'fraction', value: fraction });
    }
    if ((notation === 'scientific' || notation === 'engineering') &&
        isFinite(x)) {
        result.push({ type: 'exponentSeparator', value: symbols.exponential });
        if (exponent < 0) {
            result.push({ type: 'exponentMinusSign', value: symbols.minusSign });
            exponent = -exponent;
        }
        var exponentResult = (0,_ToRawFixed__WEBPACK_IMPORTED_MODULE_2__.ToRawFixed)(exponent, 0, 0);
        result.push({
            type: 'exponentInteger',
            value: exponentResult.formattedString,
        });
    }
    return result;
}
function getPatternForSign(pattern, sign) {
    if (pattern.indexOf(';') < 0) {
        pattern = "".concat(pattern, ";-").concat(pattern);
    }
    var _a = pattern.split(';'), zeroPattern = _a[0], negativePattern = _a[1];
    switch (sign) {
        case 0:
            return zeroPattern;
        case -1:
            return negativePattern;
        default:
            return negativePattern.indexOf('-') >= 0
                ? negativePattern.replace(/-/g, '+')
                : "+".concat(zeroPattern);
    }
}
// Find the CLDR pattern for compact notation based on the magnitude of data and style.
//
// Example return value: "¤ {c:laki}000;¤{c:laki} -0" (`sw` locale):
// - Notice the `{c:...}` token that wraps the compact literal.
// - The consecutive zeros are normalized to single zero to match CLDR_NUMBER_PATTERN.
//
// Returning null means the compact display pattern cannot be found.
function getCompactDisplayPattern(numberResult, pl, data, style, compactDisplay, currencyDisplay, numberingSystem) {
    var _a;
    var roundedNumber = numberResult.roundedNumber, sign = numberResult.sign, magnitude = numberResult.magnitude;
    var magnitudeKey = String(Math.pow(10, magnitude));
    var defaultNumberingSystem = data.numbers.nu[0];
    var pattern;
    if (style === 'currency' && currencyDisplay !== 'name') {
        var byNumberingSystem = data.numbers.currency;
        var currencyData = byNumberingSystem[numberingSystem] ||
            byNumberingSystem[defaultNumberingSystem];
        // NOTE: compact notation ignores currencySign!
        var compactPluralRules = (_a = currencyData.short) === null || _a === void 0 ? void 0 : _a[magnitudeKey];
        if (!compactPluralRules) {
            return null;
        }
        pattern = selectPlural(pl, roundedNumber, compactPluralRules);
    }
    else {
        var byNumberingSystem = data.numbers.decimal;
        var byCompactDisplay = byNumberingSystem[numberingSystem] ||
            byNumberingSystem[defaultNumberingSystem];
        var compactPlaralRule = byCompactDisplay[compactDisplay][magnitudeKey];
        if (!compactPlaralRule) {
            return null;
        }
        pattern = selectPlural(pl, roundedNumber, compactPlaralRule);
    }
    // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
    // > If the value is precisely “0”, either explicit or defaulted, then the normal number format
    // > pattern for that sort of object is supplied.
    if (pattern === '0') {
        return null;
    }
    pattern = getPatternForSign(pattern, sign)
        // Extract compact literal from the pattern
        .replace(/([^\s;\-\+\d¤]+)/g, '{c:$1}')
        // We replace one or more zeros with a single zero so it matches `CLDR_NUMBER_PATTERN`.
        .replace(/0+/, '0');
    return pattern;
}
function selectPlural(pl, x, rules) {
    return rules[pl.select(x)] || rules.other;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/PartitionPattern.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/PartitionPattern.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PartitionPattern: () => (/* binding */ PartitionPattern)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");

/**
 * https://tc39.es/ecma402/#sec-partitionpattern
 * @param pattern
 */
function PartitionPattern(pattern) {
    var result = [];
    var beginIndex = pattern.indexOf('{');
    var endIndex = 0;
    var nextIndex = 0;
    var length = pattern.length;
    while (beginIndex < pattern.length && beginIndex > -1) {
        endIndex = pattern.indexOf('}', beginIndex);
        (0,_utils__WEBPACK_IMPORTED_MODULE_0__.invariant)(endIndex > beginIndex, "Invalid pattern ".concat(pattern));
        if (beginIndex > nextIndex) {
            result.push({
                type: 'literal',
                value: pattern.substring(nextIndex, beginIndex),
            });
        }
        result.push({
            type: pattern.substring(beginIndex + 1, endIndex),
            value: undefined,
        });
        nextIndex = endIndex + 1;
        beginIndex = pattern.indexOf('{', nextIndex);
    }
    if (nextIndex < length) {
        result.push({
            type: 'literal',
            value: pattern.substring(nextIndex, length),
        });
    }
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/SupportedLocales.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/SupportedLocales.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SupportedLocales: () => (/* binding */ SupportedLocales)
/* harmony export */ });
/* harmony import */ var _formatjs_intl_localematcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @formatjs/intl-localematcher */ "./node_modules/@formatjs/intl-localematcher/lib/index.js");
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");
/* harmony import */ var _GetOption__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GetOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js");



/**
 * https://tc39.es/ecma402/#sec-supportedlocales
 * @param availableLocales
 * @param requestedLocales
 * @param options
 */
function SupportedLocales(availableLocales, requestedLocales, options) {
    var matcher = 'best fit';
    if (options !== undefined) {
        options = (0,_262__WEBPACK_IMPORTED_MODULE_1__.ToObject)(options);
        matcher = (0,_GetOption__WEBPACK_IMPORTED_MODULE_2__.GetOption)(options, 'localeMatcher', 'string', ['lookup', 'best fit'], 'best fit');
    }
    if (matcher === 'best fit') {
        return (0,_formatjs_intl_localematcher__WEBPACK_IMPORTED_MODULE_0__.LookupSupportedLocales)(Array.from(availableLocales), requestedLocales);
    }
    return (0,_formatjs_intl_localematcher__WEBPACK_IMPORTED_MODULE_0__.LookupSupportedLocales)(Array.from(availableLocales), requestedLocales);
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/data.js":
/*!*************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/data.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isMissingLocaleDataError: () => (/* binding */ isMissingLocaleDataError)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.mjs");

var MissingLocaleDataError = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(MissingLocaleDataError, _super);
    function MissingLocaleDataError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'MISSING_LOCALE_DATA';
        return _this;
    }
    return MissingLocaleDataError;
}(Error));
function isMissingLocaleDataError(e) {
    return e.type === 'MISSING_LOCALE_DATA';
}


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/index.js":
/*!**************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/index.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ApplyUnsignedRoundingMode: () => (/* reexport safe */ _NumberFormat_ApplyUnsignedRoundingMode__WEBPACK_IMPORTED_MODULE_11__.ApplyUnsignedRoundingMode),
/* harmony export */   ArrayCreate: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.ArrayCreate),
/* harmony export */   CanonicalizeLocaleList: () => (/* reexport safe */ _CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_0__.CanonicalizeLocaleList),
/* harmony export */   CanonicalizeTimeZoneName: () => (/* reexport safe */ _CanonicalizeTimeZoneName__WEBPACK_IMPORTED_MODULE_1__.CanonicalizeTimeZoneName),
/* harmony export */   CoerceOptionsToObject: () => (/* reexport safe */ _CoerceOptionsToObject__WEBPACK_IMPORTED_MODULE_2__.CoerceOptionsToObject),
/* harmony export */   CollapseNumberRange: () => (/* reexport safe */ _NumberFormat_CollapseNumberRange__WEBPACK_IMPORTED_MODULE_12__.CollapseNumberRange),
/* harmony export */   ComputeExponent: () => (/* reexport safe */ _NumberFormat_ComputeExponent__WEBPACK_IMPORTED_MODULE_13__.ComputeExponent),
/* harmony export */   ComputeExponentForMagnitude: () => (/* reexport safe */ _NumberFormat_ComputeExponentForMagnitude__WEBPACK_IMPORTED_MODULE_14__.ComputeExponentForMagnitude),
/* harmony export */   CurrencyDigits: () => (/* reexport safe */ _NumberFormat_CurrencyDigits__WEBPACK_IMPORTED_MODULE_15__.CurrencyDigits),
/* harmony export */   DateFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.DateFromTime),
/* harmony export */   Day: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.Day),
/* harmony export */   DayFromYear: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.DayFromYear),
/* harmony export */   DayWithinYear: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.DayWithinYear),
/* harmony export */   DaysInYear: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.DaysInYear),
/* harmony export */   FormatApproximately: () => (/* reexport safe */ _NumberFormat_FormatApproximately__WEBPACK_IMPORTED_MODULE_16__.FormatApproximately),
/* harmony export */   FormatNumericRange: () => (/* reexport safe */ _NumberFormat_FormatNumericRange__WEBPACK_IMPORTED_MODULE_17__.FormatNumericRange),
/* harmony export */   FormatNumericRangeToParts: () => (/* reexport safe */ _NumberFormat_FormatNumericRangeToParts__WEBPACK_IMPORTED_MODULE_18__.FormatNumericRangeToParts),
/* harmony export */   FormatNumericToParts: () => (/* reexport safe */ _NumberFormat_FormatNumericToParts__WEBPACK_IMPORTED_MODULE_19__.FormatNumericToParts),
/* harmony export */   FormatNumericToString: () => (/* reexport safe */ _NumberFormat_FormatNumericToString__WEBPACK_IMPORTED_MODULE_20__.FormatNumericToString),
/* harmony export */   GetNumberOption: () => (/* reexport safe */ _GetNumberOption__WEBPACK_IMPORTED_MODULE_3__.GetNumberOption),
/* harmony export */   GetOption: () => (/* reexport safe */ _GetOption__WEBPACK_IMPORTED_MODULE_4__.GetOption),
/* harmony export */   GetOptionsObject: () => (/* reexport safe */ _GetOptionsObject__WEBPACK_IMPORTED_MODULE_5__.GetOptionsObject),
/* harmony export */   GetStringOrBooleanOption: () => (/* reexport safe */ _GetStringOrBooleanOption__WEBPACK_IMPORTED_MODULE_6__.GetStringOrBooleanOption),
/* harmony export */   GetUnsignedRoundingMode: () => (/* reexport safe */ _NumberFormat_GetUnsignedRoundingMode__WEBPACK_IMPORTED_MODULE_21__.GetUnsignedRoundingMode),
/* harmony export */   HasOwnProperty: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.HasOwnProperty),
/* harmony export */   HourFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.HourFromTime),
/* harmony export */   InLeapYear: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.InLeapYear),
/* harmony export */   InitializeNumberFormat: () => (/* reexport safe */ _NumberFormat_InitializeNumberFormat__WEBPACK_IMPORTED_MODULE_22__.InitializeNumberFormat),
/* harmony export */   IsSanctionedSimpleUnitIdentifier: () => (/* reexport safe */ _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_7__.IsSanctionedSimpleUnitIdentifier),
/* harmony export */   IsValidTimeZoneName: () => (/* reexport safe */ _IsValidTimeZoneName__WEBPACK_IMPORTED_MODULE_8__.IsValidTimeZoneName),
/* harmony export */   IsWellFormedCurrencyCode: () => (/* reexport safe */ _IsWellFormedCurrencyCode__WEBPACK_IMPORTED_MODULE_9__.IsWellFormedCurrencyCode),
/* harmony export */   IsWellFormedUnitIdentifier: () => (/* reexport safe */ _IsWellFormedUnitIdentifier__WEBPACK_IMPORTED_MODULE_10__.IsWellFormedUnitIdentifier),
/* harmony export */   MinFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.MinFromTime),
/* harmony export */   MonthFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.MonthFromTime),
/* harmony export */   OrdinaryHasInstance: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.OrdinaryHasInstance),
/* harmony export */   PartitionNumberPattern: () => (/* reexport safe */ _NumberFormat_PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_23__.PartitionNumberPattern),
/* harmony export */   PartitionNumberRangePattern: () => (/* reexport safe */ _NumberFormat_PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_24__.PartitionNumberRangePattern),
/* harmony export */   PartitionPattern: () => (/* reexport safe */ _PartitionPattern__WEBPACK_IMPORTED_MODULE_30__.PartitionPattern),
/* harmony export */   RangePatternType: () => (/* reexport safe */ _types_date_time__WEBPACK_IMPORTED_MODULE_34__.RangePatternType),
/* harmony export */   SANCTIONED_UNITS: () => (/* reexport safe */ _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_7__.SANCTIONED_UNITS),
/* harmony export */   SIMPLE_UNITS: () => (/* reexport safe */ _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_7__.SIMPLE_UNITS),
/* harmony export */   SameValue: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.SameValue),
/* harmony export */   SecFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.SecFromTime),
/* harmony export */   SetNumberFormatDigitOptions: () => (/* reexport safe */ _NumberFormat_SetNumberFormatDigitOptions__WEBPACK_IMPORTED_MODULE_25__.SetNumberFormatDigitOptions),
/* harmony export */   SetNumberFormatUnitOptions: () => (/* reexport safe */ _NumberFormat_SetNumberFormatUnitOptions__WEBPACK_IMPORTED_MODULE_26__.SetNumberFormatUnitOptions),
/* harmony export */   SupportedLocales: () => (/* reexport safe */ _SupportedLocales__WEBPACK_IMPORTED_MODULE_31__.SupportedLocales),
/* harmony export */   TimeClip: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.TimeClip),
/* harmony export */   TimeFromYear: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.TimeFromYear),
/* harmony export */   ToNumber: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.ToNumber),
/* harmony export */   ToObject: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.ToObject),
/* harmony export */   ToRawFixed: () => (/* reexport safe */ _NumberFormat_ToRawFixed__WEBPACK_IMPORTED_MODULE_27__.ToRawFixed),
/* harmony export */   ToRawPrecision: () => (/* reexport safe */ _NumberFormat_ToRawPrecision__WEBPACK_IMPORTED_MODULE_28__.ToRawPrecision),
/* harmony export */   ToString: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.ToString),
/* harmony export */   Type: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.Type),
/* harmony export */   WeekDay: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.WeekDay),
/* harmony export */   YearFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.YearFromTime),
/* harmony export */   _formatToParts: () => (/* reexport safe */ _NumberFormat_format_to_parts__WEBPACK_IMPORTED_MODULE_29__["default"]),
/* harmony export */   defineProperty: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.defineProperty),
/* harmony export */   getInternalSlot: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.getInternalSlot),
/* harmony export */   getMagnitude: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.getMagnitude),
/* harmony export */   getMultiInternalSlots: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.getMultiInternalSlots),
/* harmony export */   invariant: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.invariant),
/* harmony export */   isLiteralPart: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.isLiteralPart),
/* harmony export */   isMissingLocaleDataError: () => (/* reexport safe */ _data__WEBPACK_IMPORTED_MODULE_33__.isMissingLocaleDataError),
/* harmony export */   msFromTime: () => (/* reexport safe */ _262__WEBPACK_IMPORTED_MODULE_35__.msFromTime),
/* harmony export */   removeUnitNamespace: () => (/* reexport safe */ _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_7__.removeUnitNamespace),
/* harmony export */   setInternalSlot: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.setInternalSlot),
/* harmony export */   setMultiInternalSlots: () => (/* reexport safe */ _utils__WEBPACK_IMPORTED_MODULE_32__.setMultiInternalSlots)
/* harmony export */ });
/* harmony import */ var _CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CanonicalizeLocaleList */ "./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeLocaleList.js");
/* harmony import */ var _CanonicalizeTimeZoneName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CanonicalizeTimeZoneName */ "./node_modules/@formatjs/ecma402-abstract/lib/CanonicalizeTimeZoneName.js");
/* harmony import */ var _CoerceOptionsToObject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./CoerceOptionsToObject */ "./node_modules/@formatjs/ecma402-abstract/lib/CoerceOptionsToObject.js");
/* harmony import */ var _GetNumberOption__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./GetNumberOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetNumberOption.js");
/* harmony import */ var _GetOption__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./GetOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOption.js");
/* harmony import */ var _GetOptionsObject__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./GetOptionsObject */ "./node_modules/@formatjs/ecma402-abstract/lib/GetOptionsObject.js");
/* harmony import */ var _GetStringOrBooleanOption__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./GetStringOrBooleanOption */ "./node_modules/@formatjs/ecma402-abstract/lib/GetStringOrBooleanOption.js");
/* harmony import */ var _IsSanctionedSimpleUnitIdentifier__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./IsSanctionedSimpleUnitIdentifier */ "./node_modules/@formatjs/ecma402-abstract/lib/IsSanctionedSimpleUnitIdentifier.js");
/* harmony import */ var _IsValidTimeZoneName__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./IsValidTimeZoneName */ "./node_modules/@formatjs/ecma402-abstract/lib/IsValidTimeZoneName.js");
/* harmony import */ var _IsWellFormedCurrencyCode__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./IsWellFormedCurrencyCode */ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedCurrencyCode.js");
/* harmony import */ var _IsWellFormedUnitIdentifier__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./IsWellFormedUnitIdentifier */ "./node_modules/@formatjs/ecma402-abstract/lib/IsWellFormedUnitIdentifier.js");
/* harmony import */ var _NumberFormat_ApplyUnsignedRoundingMode__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./NumberFormat/ApplyUnsignedRoundingMode */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ApplyUnsignedRoundingMode.js");
/* harmony import */ var _NumberFormat_CollapseNumberRange__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./NumberFormat/CollapseNumberRange */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CollapseNumberRange.js");
/* harmony import */ var _NumberFormat_ComputeExponent__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./NumberFormat/ComputeExponent */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponent.js");
/* harmony import */ var _NumberFormat_ComputeExponentForMagnitude__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./NumberFormat/ComputeExponentForMagnitude */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ComputeExponentForMagnitude.js");
/* harmony import */ var _NumberFormat_CurrencyDigits__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./NumberFormat/CurrencyDigits */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/CurrencyDigits.js");
/* harmony import */ var _NumberFormat_FormatApproximately__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./NumberFormat/FormatApproximately */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatApproximately.js");
/* harmony import */ var _NumberFormat_FormatNumericRange__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./NumberFormat/FormatNumericRange */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRange.js");
/* harmony import */ var _NumberFormat_FormatNumericRangeToParts__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./NumberFormat/FormatNumericRangeToParts */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericRangeToParts.js");
/* harmony import */ var _NumberFormat_FormatNumericToParts__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./NumberFormat/FormatNumericToParts */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToParts.js");
/* harmony import */ var _NumberFormat_FormatNumericToString__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./NumberFormat/FormatNumericToString */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/FormatNumericToString.js");
/* harmony import */ var _NumberFormat_GetUnsignedRoundingMode__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./NumberFormat/GetUnsignedRoundingMode */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/GetUnsignedRoundingMode.js");
/* harmony import */ var _NumberFormat_InitializeNumberFormat__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./NumberFormat/InitializeNumberFormat */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/InitializeNumberFormat.js");
/* harmony import */ var _NumberFormat_PartitionNumberPattern__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./NumberFormat/PartitionNumberPattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberPattern.js");
/* harmony import */ var _NumberFormat_PartitionNumberRangePattern__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./NumberFormat/PartitionNumberRangePattern */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/PartitionNumberRangePattern.js");
/* harmony import */ var _NumberFormat_SetNumberFormatDigitOptions__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./NumberFormat/SetNumberFormatDigitOptions */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatDigitOptions.js");
/* harmony import */ var _NumberFormat_SetNumberFormatUnitOptions__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./NumberFormat/SetNumberFormatUnitOptions */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/SetNumberFormatUnitOptions.js");
/* harmony import */ var _NumberFormat_ToRawFixed__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./NumberFormat/ToRawFixed */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawFixed.js");
/* harmony import */ var _NumberFormat_ToRawPrecision__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./NumberFormat/ToRawPrecision */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/ToRawPrecision.js");
/* harmony import */ var _NumberFormat_format_to_parts__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./NumberFormat/format_to_parts */ "./node_modules/@formatjs/ecma402-abstract/lib/NumberFormat/format_to_parts.js");
/* harmony import */ var _PartitionPattern__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./PartitionPattern */ "./node_modules/@formatjs/ecma402-abstract/lib/PartitionPattern.js");
/* harmony import */ var _SupportedLocales__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./SupportedLocales */ "./node_modules/@formatjs/ecma402-abstract/lib/SupportedLocales.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js");
/* harmony import */ var _data__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./data */ "./node_modules/@formatjs/ecma402-abstract/lib/data.js");
/* harmony import */ var _types_date_time__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./types/date-time */ "./node_modules/@formatjs/ecma402-abstract/lib/types/date-time.js");
/* harmony import */ var _262__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./262 */ "./node_modules/@formatjs/ecma402-abstract/lib/262.js");












































/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/regex.generated.js":
/*!************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/regex.generated.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   S_UNICODE_REGEX: () => (/* binding */ S_UNICODE_REGEX)
/* harmony export */ });
// @generated from regex-gen.ts
var S_UNICODE_REGEX = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEE0-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDD78\uDD7A-\uDDCB\uDDCD-\uDE53\uDE60-\uDE6D\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6\uDF00-\uDF92\uDF94-\uDFCA]/;


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/types/date-time.js":
/*!************************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/types/date-time.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RangePatternType: () => (/* binding */ RangePatternType)
/* harmony export */ });
var RangePatternType;
(function (RangePatternType) {
    RangePatternType["startRange"] = "startRange";
    RangePatternType["shared"] = "shared";
    RangePatternType["endRange"] = "endRange";
})(RangePatternType || (RangePatternType = {}));


/***/ }),

/***/ "./node_modules/@formatjs/ecma402-abstract/lib/utils.js":
/*!**************************************************************!*\
  !*** ./node_modules/@formatjs/ecma402-abstract/lib/utils.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UNICODE_EXTENSION_SEQUENCE_REGEX: () => (/* binding */ UNICODE_EXTENSION_SEQUENCE_REGEX),
/* harmony export */   defineProperty: () => (/* binding */ defineProperty),
/* harmony export */   getInternalSlot: () => (/* binding */ getInternalSlot),
/* harmony export */   getMagnitude: () => (/* binding */ getMagnitude),
/* harmony export */   getMultiInternalSlots: () => (/* binding */ getMultiInternalSlots),
/* harmony export */   invariant: () => (/* binding */ invariant),
/* harmony export */   isLiteralPart: () => (/* binding */ isLiteralPart),
/* harmony export */   repeat: () => (/* binding */ repeat),
/* harmony export */   setInternalSlot: () => (/* binding */ setInternalSlot),
/* harmony export */   setMultiInternalSlots: () => (/* binding */ setMultiInternalSlots)
/* harmony export */ });
/**
 * Cannot do Math.log(x) / Math.log(10) bc if IEEE floating point issue
 * @param x number
 */
function getMagnitude(x) {
    // Cannot count string length via Number.toString because it may use scientific notation
    // for very small or very large numbers.
    return Math.floor(Math.log(x) * Math.LOG10E);
}
function repeat(s, times) {
    if (typeof s.repeat === 'function') {
        return s.repeat(times);
    }
    var arr = new Array(times);
    for (var i = 0; i < arr.length; i++) {
        arr[i] = s;
    }
    return arr.join('');
}
function setInternalSlot(map, pl, field, value) {
    if (!map.get(pl)) {
        map.set(pl, Object.create(null));
    }
    var slots = map.get(pl);
    slots[field] = value;
}
function setMultiInternalSlots(map, pl, props) {
    for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
        var k = _a[_i];
        setInternalSlot(map, pl, k, props[k]);
    }
}
function getInternalSlot(map, pl, field) {
    return getMultiInternalSlots(map, pl, field)[field];
}
function getMultiInternalSlots(map, pl) {
    var fields = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        fields[_i - 2] = arguments[_i];
    }
    var slots = map.get(pl);
    if (!slots) {
        throw new TypeError("".concat(pl, " InternalSlot has not been initialized"));
    }
    return fields.reduce(function (all, f) {
        all[f] = slots[f];
        return all;
    }, Object.create(null));
}
function isLiteralPart(patternPart) {
    return patternPart.type === 'literal';
}
/*
  17 ECMAScript Standard Built-in Objects:
    Every built-in Function object, including constructors, that is not
    identified as an anonymous function has a name property whose value
    is a String.

    Unless otherwise specified, the name property of a built-in Function
    object, if it exists, has the attributes { [[Writable]]: false,
    [[Enumerable]]: false, [[Configurable]]: true }.
*/
function defineProperty(target, name, _a) {
    var value = _a.value;
    Object.defineProperty(target, name, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: value,
    });
}
var UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi;
function invariant(condition, message, Err) {
    if (Err === void 0) { Err = Error; }
    if (!condition) {
        throw new Err(message);
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/BestAvailableLocale.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/BestAvailableLocale.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BestAvailableLocale: () => (/* binding */ BestAvailableLocale)
/* harmony export */ });
/**
 * https://tc39.es/ecma402/#sec-bestavailablelocale
 * @param availableLocales
 * @param locale
 */
function BestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (true) {
        if (availableLocales.indexOf(candidate) > -1) {
            return candidate;
        }
        var pos = candidate.lastIndexOf('-');
        if (!~pos) {
            return undefined;
        }
        if (pos >= 2 && candidate[pos - 2] === '-') {
            pos -= 2;
        }
        candidate = candidate.slice(0, pos);
    }
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/BestFitMatcher.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/BestFitMatcher.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BestFitMatcher: () => (/* binding */ BestFitMatcher)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js");

/**
 * https://tc39.es/ecma402/#sec-bestfitmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
function BestFitMatcher(availableLocales, requestedLocales, getDefaultLocale) {
    var foundLocale;
    var extension;
    var noExtensionLocales = [];
    var noExtensionLocaleMap = requestedLocales.reduce(function (all, l) {
        var noExtensionLocale = l.replace(_utils__WEBPACK_IMPORTED_MODULE_0__.UNICODE_EXTENSION_SEQUENCE_REGEX, '');
        noExtensionLocales.push(noExtensionLocale);
        all[noExtensionLocale] = l;
        return all;
    }, {});
    var result = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.findBestMatch)(noExtensionLocales, availableLocales);
    if (result.matchedSupportedLocale && result.matchedDesiredLocale) {
        foundLocale = result.matchedSupportedLocale;
        extension =
            noExtensionLocaleMap[result.matchedDesiredLocale].slice(result.matchedDesiredLocale.length) || undefined;
    }
    if (!foundLocale) {
        return { locale: getDefaultLocale() };
    }
    return {
        locale: foundLocale,
        extension: extension,
    };
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/CanonicalizeLocaleList.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/CanonicalizeLocaleList.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CanonicalizeLocaleList: () => (/* binding */ CanonicalizeLocaleList)
/* harmony export */ });
/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
function CanonicalizeLocaleList(locales) {
    // TODO
    return Intl.getCanonicalLocales(locales);
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupMatcher.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupMatcher.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LookupMatcher: () => (/* binding */ LookupMatcher)
/* harmony export */ });
/* harmony import */ var _BestAvailableLocale__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BestAvailableLocale */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/BestAvailableLocale.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js");


/**
 * https://tc39.es/ecma402/#sec-lookupmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
function LookupMatcher(availableLocales, requestedLocales, getDefaultLocale) {
    var result = { locale: '' };
    for (var _i = 0, requestedLocales_1 = requestedLocales; _i < requestedLocales_1.length; _i++) {
        var locale = requestedLocales_1[_i];
        var noExtensionLocale = locale.replace(_utils__WEBPACK_IMPORTED_MODULE_1__.UNICODE_EXTENSION_SEQUENCE_REGEX, '');
        var availableLocale = (0,_BestAvailableLocale__WEBPACK_IMPORTED_MODULE_0__.BestAvailableLocale)(availableLocales, noExtensionLocale);
        if (availableLocale) {
            result.locale = availableLocale;
            if (locale !== noExtensionLocale) {
                result.extension = locale.slice(noExtensionLocale.length, locale.length);
            }
            return result;
        }
    }
    result.locale = getDefaultLocale();
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupSupportedLocales.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupSupportedLocales.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LookupSupportedLocales: () => (/* binding */ LookupSupportedLocales)
/* harmony export */ });
/* harmony import */ var _BestAvailableLocale__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BestAvailableLocale */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/BestAvailableLocale.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js");


/**
 * https://tc39.es/ecma402/#sec-lookupsupportedlocales
 * @param availableLocales
 * @param requestedLocales
 */
function LookupSupportedLocales(availableLocales, requestedLocales) {
    var subset = [];
    for (var _i = 0, requestedLocales_1 = requestedLocales; _i < requestedLocales_1.length; _i++) {
        var locale = requestedLocales_1[_i];
        var noExtensionLocale = locale.replace(_utils__WEBPACK_IMPORTED_MODULE_1__.UNICODE_EXTENSION_SEQUENCE_REGEX, '');
        var availableLocale = (0,_BestAvailableLocale__WEBPACK_IMPORTED_MODULE_0__.BestAvailableLocale)(availableLocales, noExtensionLocale);
        if (availableLocale) {
            subset.push(availableLocale);
        }
    }
    return subset;
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/ResolveLocale.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/ResolveLocale.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ResolveLocale: () => (/* binding */ ResolveLocale)
/* harmony export */ });
/* harmony import */ var _BestFitMatcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BestFitMatcher */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/BestFitMatcher.js");
/* harmony import */ var _LookupMatcher__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./LookupMatcher */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupMatcher.js");
/* harmony import */ var _UnicodeExtensionValue__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./UnicodeExtensionValue */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/UnicodeExtensionValue.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js");




/**
 * https://tc39.es/ecma402/#sec-resolvelocale
 */
function ResolveLocale(availableLocales, requestedLocales, options, relevantExtensionKeys, localeData, getDefaultLocale) {
    var matcher = options.localeMatcher;
    var r;
    if (matcher === 'lookup') {
        r = (0,_LookupMatcher__WEBPACK_IMPORTED_MODULE_1__.LookupMatcher)(Array.from(availableLocales), requestedLocales, getDefaultLocale);
    }
    else {
        r = (0,_BestFitMatcher__WEBPACK_IMPORTED_MODULE_0__.BestFitMatcher)(Array.from(availableLocales), requestedLocales, getDefaultLocale);
    }
    var foundLocale = r.locale;
    var result = { locale: '', dataLocale: foundLocale };
    var supportedExtension = '-u';
    for (var _i = 0, relevantExtensionKeys_1 = relevantExtensionKeys; _i < relevantExtensionKeys_1.length; _i++) {
        var key = relevantExtensionKeys_1[_i];
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__.invariant)(foundLocale in localeData, "Missing locale data for ".concat(foundLocale));
        var foundLocaleData = localeData[foundLocale];
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__.invariant)(typeof foundLocaleData === 'object' && foundLocaleData !== null, "locale data ".concat(key, " must be an object"));
        var keyLocaleData = foundLocaleData[key];
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__.invariant)(Array.isArray(keyLocaleData), "keyLocaleData for ".concat(key, " must be an array"));
        var value = keyLocaleData[0];
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__.invariant)(typeof value === 'string' || value === null, "value must be string or null but got ".concat(typeof value, " in key ").concat(key));
        var supportedExtensionAddition = '';
        if (r.extension) {
            var requestedValue = (0,_UnicodeExtensionValue__WEBPACK_IMPORTED_MODULE_2__.UnicodeExtensionValue)(r.extension, key);
            if (requestedValue !== undefined) {
                if (requestedValue !== '') {
                    if (~keyLocaleData.indexOf(requestedValue)) {
                        value = requestedValue;
                        supportedExtensionAddition = "-".concat(key, "-").concat(value);
                    }
                }
                else if (~requestedValue.indexOf('true')) {
                    value = 'true';
                    supportedExtensionAddition = "-".concat(key);
                }
            }
        }
        if (key in options) {
            var optionsValue = options[key];
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__.invariant)(typeof optionsValue === 'string' ||
                typeof optionsValue === 'undefined' ||
                optionsValue === null, 'optionsValue must be String, Undefined or Null');
            if (~keyLocaleData.indexOf(optionsValue)) {
                if (optionsValue !== value) {
                    value = optionsValue;
                    supportedExtensionAddition = '';
                }
            }
        }
        result[key] = value;
        supportedExtension += supportedExtensionAddition;
    }
    if (supportedExtension.length > 2) {
        var privateIndex = foundLocale.indexOf('-x-');
        if (privateIndex === -1) {
            foundLocale = foundLocale + supportedExtension;
        }
        else {
            var preExtension = foundLocale.slice(0, privateIndex);
            var postExtension = foundLocale.slice(privateIndex, foundLocale.length);
            foundLocale = preExtension + supportedExtension + postExtension;
        }
        foundLocale = Intl.getCanonicalLocales(foundLocale)[0];
    }
    result.locale = foundLocale;
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/UnicodeExtensionValue.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/UnicodeExtensionValue.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UnicodeExtensionValue: () => (/* binding */ UnicodeExtensionValue)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js");

/**
 * https://tc39.es/ecma402/#sec-unicodeextensionvalue
 * @param extension
 * @param key
 */
function UnicodeExtensionValue(extension, key) {
    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.invariant)(key.length === 2, 'key must have 2 elements');
    var size = extension.length;
    var searchValue = "-".concat(key, "-");
    var pos = extension.indexOf(searchValue);
    if (pos !== -1) {
        var start = pos + 4;
        var end = start;
        var k = start;
        var done = false;
        while (!done) {
            var e = extension.indexOf('-', k);
            var len = void 0;
            if (e === -1) {
                len = size - k;
            }
            else {
                len = e - k;
            }
            if (len === 2) {
                done = true;
            }
            else if (e === -1) {
                end = size;
                done = true;
            }
            else {
                end = e;
                k = e + 1;
            }
        }
        return extension.slice(start, end);
    }
    searchValue = "-".concat(key);
    pos = extension.indexOf(searchValue);
    if (pos !== -1 && pos + 3 === size) {
        return '';
    }
    return undefined;
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/languageMatching.js":
/*!************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/languageMatching.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   data: () => (/* binding */ data)
/* harmony export */ });
var data = {
    supplemental: {
        languageMatching: {
            'written-new': [
                {
                    paradigmLocales: {
                        _locales: 'en en_GB es es_419 pt_BR pt_PT',
                    },
                },
                {
                    $enUS: {
                        _value: 'AS+CA+GU+MH+MP+PH+PR+UM+US+VI',
                    },
                },
                {
                    $cnsar: {
                        _value: 'HK+MO',
                    },
                },
                {
                    $americas: {
                        _value: '019',
                    },
                },
                {
                    $maghreb: {
                        _value: 'MA+DZ+TN+LY+MR+EH',
                    },
                },
                {
                    no: {
                        _desired: 'nb',
                        _distance: '1',
                    },
                },
                {
                    bs: {
                        _desired: 'hr',
                        _distance: '4',
                    },
                },
                {
                    bs: {
                        _desired: 'sh',
                        _distance: '4',
                    },
                },
                {
                    hr: {
                        _desired: 'sh',
                        _distance: '4',
                    },
                },
                {
                    sr: {
                        _desired: 'sh',
                        _distance: '4',
                    },
                },
                {
                    aa: {
                        _desired: 'ssy',
                        _distance: '4',
                    },
                },
                {
                    de: {
                        _desired: 'gsw',
                        _distance: '4',
                        _oneway: 'true',
                    },
                },
                {
                    de: {
                        _desired: 'lb',
                        _distance: '4',
                        _oneway: 'true',
                    },
                },
                {
                    no: {
                        _desired: 'da',
                        _distance: '8',
                    },
                },
                {
                    nb: {
                        _desired: 'da',
                        _distance: '8',
                    },
                },
                {
                    ru: {
                        _desired: 'ab',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ach',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    nl: {
                        _desired: 'af',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ak',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'am',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'ay',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'az',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ur: {
                        _desired: 'bal',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'be',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'bem',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    hi: {
                        _desired: 'bh',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'bn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'bo',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'br',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'ca',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    fil: {
                        _desired: 'ceb',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'chr',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ckb',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'co',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'crs',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    sk: {
                        _desired: 'cs',
                        _distance: '20',
                    },
                },
                {
                    en: {
                        _desired: 'cy',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ee',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'eo',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'eu',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    da: {
                        _desired: 'fo',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    nl: {
                        _desired: 'fy',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ga',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'gaa',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'gd',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'gl',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'gn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    hi: {
                        _desired: 'gu',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ha',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'haw',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'ht',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'hy',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ia',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ig',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'is',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    id: {
                        _desired: 'jv',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ka',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'kg',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'kk',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'km',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'kn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'kri',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    tr: {
                        _desired: 'ku',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'ky',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    it: {
                        _desired: 'la',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'lg',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'ln',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'lo',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'loz',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'lua',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    hi: {
                        _desired: 'mai',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'mfe',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'mg',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'mi',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ml',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'mn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    hi: {
                        _desired: 'mr',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    id: {
                        _desired: 'ms',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'mt',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'my',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ne',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    nb: {
                        _desired: 'nn',
                        _distance: '20',
                    },
                },
                {
                    no: {
                        _desired: 'nn',
                        _distance: '20',
                    },
                },
                {
                    en: {
                        _desired: 'nso',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ny',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'nyn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'oc',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'om',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'or',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'pa',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'pcm',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ps',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    es: {
                        _desired: 'qu',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    de: {
                        _desired: 'rm',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'rn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'rw',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    hi: {
                        _desired: 'sa',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'sd',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'si',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'sn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'so',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'sq',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'st',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    id: {
                        _desired: 'su',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'sw',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ta',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'te',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'tg',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ti',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'tk',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'tlh',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'tn',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'to',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'tt',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'tum',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'ug',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'uk',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'ur',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ru: {
                        _desired: 'uz',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    fr: {
                        _desired: 'wo',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'xh',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'yi',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'yo',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'za',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    en: {
                        _desired: 'zu',
                        _distance: '30',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'aao',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'abh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'abv',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'acm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'acq',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'acw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'acx',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'acy',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'adf',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'aeb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'aec',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'afb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ajp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'apc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'apd',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'arq',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ars',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ary',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'arz',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'auz',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'avl',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ayh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ayl',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ayn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ayp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'bbz',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'pga',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'shu',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ar: {
                        _desired: 'ssh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    az: {
                        _desired: 'azb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    et: {
                        _desired: 'vro',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'ffm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fub',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fue',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fuf',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fuh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fui',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fuq',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ff: {
                        _desired: 'fuv',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    gn: {
                        _desired: 'gnw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    gn: {
                        _desired: 'gui',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    gn: {
                        _desired: 'gun',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    gn: {
                        _desired: 'nhd',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    iu: {
                        _desired: 'ikt',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'enb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'eyo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'niq',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'oki',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'pko',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'sgc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'tec',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kln: {
                        _desired: 'tuy',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kok: {
                        _desired: 'gom',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    kpe: {
                        _desired: 'gkp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'ida',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lkb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lko',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lks',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lri',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lrm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lsm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lto',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lts',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'lwg',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'nle',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'nyd',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    luy: {
                        _desired: 'rag',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    lv: {
                        _desired: 'ltg',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'bhr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'bjq',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'bmm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'bzc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'msh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'skg',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'tdx',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'tkg',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'txy',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'xmv',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mg: {
                        _desired: 'xmw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    mn: {
                        _desired: 'mvf',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'bjn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'btj',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'bve',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'bvu',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'coa',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'dup',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'hji',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'id',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'jak',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'jax',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'kvb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'kvr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'kxd',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'lce',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'lcf',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'liw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'max',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'meo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'mfa',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'mfb',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'min',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'mqg',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'msi',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'mui',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'orn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'ors',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'pel',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'pse',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'tmw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'urk',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'vkk',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'vkt',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'xmm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'zlm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ms: {
                        _desired: 'zmi',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ne: {
                        _desired: 'dty',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    om: {
                        _desired: 'gax',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    om: {
                        _desired: 'hae',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    om: {
                        _desired: 'orc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    or: {
                        _desired: 'spv',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ps: {
                        _desired: 'pbt',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    ps: {
                        _desired: 'pst',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qub',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qud',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'quf',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qug',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'quh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'quk',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qul',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qup',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qur',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qus',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'quw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qux',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'quy',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qva',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qve',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvi',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvj',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvl',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvm',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvs',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qvz',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qwa',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qwc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qwh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qws',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxa',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxl',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxt',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxu',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    qu: {
                        _desired: 'qxw',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sc: {
                        _desired: 'sdc',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sc: {
                        _desired: 'sdn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sc: {
                        _desired: 'sro',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sq: {
                        _desired: 'aae',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sq: {
                        _desired: 'aat',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    sq: {
                        _desired: 'aln',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    syr: {
                        _desired: 'aii',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    uz: {
                        _desired: 'uzs',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    yi: {
                        _desired: 'yih',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'cdo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'cjy',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'cpx',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'czh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'czo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'gan',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'hak',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'hsn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'lzh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'mnp',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'nan',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'wuu',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    zh: {
                        _desired: 'yue',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    '*': {
                        _desired: '*',
                        _distance: '80',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'am-Ethi',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'ru-Cyrl': {
                        _desired: 'az-Latn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'bn-Beng',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'zh-Hans': {
                        _desired: 'bo-Tibt',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'ru-Cyrl': {
                        _desired: 'hy-Armn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ka-Geor',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'km-Khmr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'kn-Knda',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'lo-Laoo',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ml-Mlym',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'my-Mymr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ne-Deva',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'or-Orya',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'pa-Guru',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ps-Arab',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'sd-Arab',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'si-Sinh',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ta-Taml',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'te-Telu',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ti-Ethi',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'ru-Cyrl': {
                        _desired: 'tk-Latn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'ur-Arab',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'ru-Cyrl': {
                        _desired: 'uz-Latn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'en-Latn': {
                        _desired: 'yi-Hebr',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'sr-Cyrl': {
                        _desired: 'sr-Latn',
                        _distance: '5',
                    },
                },
                {
                    'zh-Hans': {
                        _desired: 'za-Latn',
                        _distance: '10',
                        _oneway: 'true',
                    },
                },
                {
                    'zh-Hans': {
                        _desired: 'zh-Hani',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'zh-Hant': {
                        _desired: 'zh-Hani',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'ar-Arab': {
                        _desired: 'ar-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'bn-Beng': {
                        _desired: 'bn-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'gu-Gujr': {
                        _desired: 'gu-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'hi-Deva': {
                        _desired: 'hi-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'kn-Knda': {
                        _desired: 'kn-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'ml-Mlym': {
                        _desired: 'ml-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'mr-Deva': {
                        _desired: 'mr-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'ta-Taml': {
                        _desired: 'ta-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'te-Telu': {
                        _desired: 'te-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'zh-Hans': {
                        _desired: 'zh-Latn',
                        _distance: '20',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Jpan': {
                        _desired: 'ja-Latn',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Jpan': {
                        _desired: 'ja-Hani',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Jpan': {
                        _desired: 'ja-Hira',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Jpan': {
                        _desired: 'ja-Kana',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Jpan': {
                        _desired: 'ja-Hrkt',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Hrkt': {
                        _desired: 'ja-Hira',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ja-Hrkt': {
                        _desired: 'ja-Kana',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ko-Kore': {
                        _desired: 'ko-Hani',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ko-Kore': {
                        _desired: 'ko-Hang',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ko-Kore': {
                        _desired: 'ko-Jamo',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    'ko-Hang': {
                        _desired: 'ko-Jamo',
                        _distance: '5',
                        _oneway: 'true',
                    },
                },
                {
                    '*-*': {
                        _desired: '*-*',
                        _distance: '50',
                    },
                },
                {
                    'ar-*-$maghreb': {
                        _desired: 'ar-*-$maghreb',
                        _distance: '4',
                    },
                },
                {
                    'ar-*-$!maghreb': {
                        _desired: 'ar-*-$!maghreb',
                        _distance: '4',
                    },
                },
                {
                    'ar-*-*': {
                        _desired: 'ar-*-*',
                        _distance: '5',
                    },
                },
                {
                    'en-*-$enUS': {
                        _desired: 'en-*-$enUS',
                        _distance: '4',
                    },
                },
                {
                    'en-*-GB': {
                        _desired: 'en-*-$!enUS',
                        _distance: '3',
                    },
                },
                {
                    'en-*-$!enUS': {
                        _desired: 'en-*-$!enUS',
                        _distance: '4',
                    },
                },
                {
                    'en-*-*': {
                        _desired: 'en-*-*',
                        _distance: '5',
                    },
                },
                {
                    'es-*-$americas': {
                        _desired: 'es-*-$americas',
                        _distance: '4',
                    },
                },
                {
                    'es-*-$!americas': {
                        _desired: 'es-*-$!americas',
                        _distance: '4',
                    },
                },
                {
                    'es-*-*': {
                        _desired: 'es-*-*',
                        _distance: '5',
                    },
                },
                {
                    'pt-*-$americas': {
                        _desired: 'pt-*-$americas',
                        _distance: '4',
                    },
                },
                {
                    'pt-*-$!americas': {
                        _desired: 'pt-*-$!americas',
                        _distance: '4',
                    },
                },
                {
                    'pt-*-*': {
                        _desired: 'pt-*-*',
                        _distance: '5',
                    },
                },
                {
                    'zh-Hant-$cnsar': {
                        _desired: 'zh-Hant-$cnsar',
                        _distance: '4',
                    },
                },
                {
                    'zh-Hant-$!cnsar': {
                        _desired: 'zh-Hant-$!cnsar',
                        _distance: '4',
                    },
                },
                {
                    'zh-Hant-*': {
                        _desired: 'zh-Hant-*',
                        _distance: '5',
                    },
                },
                {
                    '*-*-*': {
                        _desired: '*-*-*',
                        _distance: '4',
                    },
                },
            ],
        },
    },
};


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/regions.generated.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/regions.generated.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   regions: () => (/* binding */ regions)
/* harmony export */ });
// This file is generated from regions-gen.ts
var regions = {
    "001": [
        "001",
        "001-status-grouping",
        "002",
        "005",
        "009",
        "011",
        "013",
        "014",
        "015",
        "017",
        "018",
        "019",
        "021",
        "029",
        "030",
        "034",
        "035",
        "039",
        "053",
        "054",
        "057",
        "061",
        "142",
        "143",
        "145",
        "150",
        "151",
        "154",
        "155",
        "AC",
        "AD",
        "AE",
        "AF",
        "AG",
        "AI",
        "AL",
        "AM",
        "AO",
        "AQ",
        "AR",
        "AS",
        "AT",
        "AU",
        "AW",
        "AX",
        "AZ",
        "BA",
        "BB",
        "BD",
        "BE",
        "BF",
        "BG",
        "BH",
        "BI",
        "BJ",
        "BL",
        "BM",
        "BN",
        "BO",
        "BQ",
        "BR",
        "BS",
        "BT",
        "BV",
        "BW",
        "BY",
        "BZ",
        "CA",
        "CC",
        "CD",
        "CF",
        "CG",
        "CH",
        "CI",
        "CK",
        "CL",
        "CM",
        "CN",
        "CO",
        "CP",
        "CQ",
        "CR",
        "CU",
        "CV",
        "CW",
        "CX",
        "CY",
        "CZ",
        "DE",
        "DG",
        "DJ",
        "DK",
        "DM",
        "DO",
        "DZ",
        "EA",
        "EC",
        "EE",
        "EG",
        "EH",
        "ER",
        "ES",
        "ET",
        "EU",
        "EZ",
        "FI",
        "FJ",
        "FK",
        "FM",
        "FO",
        "FR",
        "GA",
        "GB",
        "GD",
        "GE",
        "GF",
        "GG",
        "GH",
        "GI",
        "GL",
        "GM",
        "GN",
        "GP",
        "GQ",
        "GR",
        "GS",
        "GT",
        "GU",
        "GW",
        "GY",
        "HK",
        "HM",
        "HN",
        "HR",
        "HT",
        "HU",
        "IC",
        "ID",
        "IE",
        "IL",
        "IM",
        "IN",
        "IO",
        "IQ",
        "IR",
        "IS",
        "IT",
        "JE",
        "JM",
        "JO",
        "JP",
        "KE",
        "KG",
        "KH",
        "KI",
        "KM",
        "KN",
        "KP",
        "KR",
        "KW",
        "KY",
        "KZ",
        "LA",
        "LB",
        "LC",
        "LI",
        "LK",
        "LR",
        "LS",
        "LT",
        "LU",
        "LV",
        "LY",
        "MA",
        "MC",
        "MD",
        "ME",
        "MF",
        "MG",
        "MH",
        "MK",
        "ML",
        "MM",
        "MN",
        "MO",
        "MP",
        "MQ",
        "MR",
        "MS",
        "MT",
        "MU",
        "MV",
        "MW",
        "MX",
        "MY",
        "MZ",
        "NA",
        "NC",
        "NE",
        "NF",
        "NG",
        "NI",
        "NL",
        "NO",
        "NP",
        "NR",
        "NU",
        "NZ",
        "OM",
        "PA",
        "PE",
        "PF",
        "PG",
        "PH",
        "PK",
        "PL",
        "PM",
        "PN",
        "PR",
        "PS",
        "PT",
        "PW",
        "PY",
        "QA",
        "QO",
        "RE",
        "RO",
        "RS",
        "RU",
        "RW",
        "SA",
        "SB",
        "SC",
        "SD",
        "SE",
        "SG",
        "SH",
        "SI",
        "SJ",
        "SK",
        "SL",
        "SM",
        "SN",
        "SO",
        "SR",
        "SS",
        "ST",
        "SV",
        "SX",
        "SY",
        "SZ",
        "TA",
        "TC",
        "TD",
        "TF",
        "TG",
        "TH",
        "TJ",
        "TK",
        "TL",
        "TM",
        "TN",
        "TO",
        "TR",
        "TT",
        "TV",
        "TW",
        "TZ",
        "UA",
        "UG",
        "UM",
        "UN",
        "US",
        "UY",
        "UZ",
        "VA",
        "VC",
        "VE",
        "VG",
        "VI",
        "VN",
        "VU",
        "WF",
        "WS",
        "XK",
        "YE",
        "YT",
        "ZA",
        "ZM",
        "ZW"
    ],
    "002": [
        "002",
        "002-status-grouping",
        "011",
        "014",
        "015",
        "017",
        "018",
        "202",
        "AO",
        "BF",
        "BI",
        "BJ",
        "BW",
        "CD",
        "CF",
        "CG",
        "CI",
        "CM",
        "CV",
        "DJ",
        "DZ",
        "EA",
        "EG",
        "EH",
        "ER",
        "ET",
        "GA",
        "GH",
        "GM",
        "GN",
        "GQ",
        "GW",
        "IC",
        "IO",
        "KE",
        "KM",
        "LR",
        "LS",
        "LY",
        "MA",
        "MG",
        "ML",
        "MR",
        "MU",
        "MW",
        "MZ",
        "NA",
        "NE",
        "NG",
        "RE",
        "RW",
        "SC",
        "SD",
        "SH",
        "SL",
        "SN",
        "SO",
        "SS",
        "ST",
        "SZ",
        "TD",
        "TF",
        "TG",
        "TN",
        "TZ",
        "UG",
        "YT",
        "ZA",
        "ZM",
        "ZW"
    ],
    "003": [
        "003",
        "013",
        "021",
        "029",
        "AG",
        "AI",
        "AW",
        "BB",
        "BL",
        "BM",
        "BQ",
        "BS",
        "BZ",
        "CA",
        "CR",
        "CU",
        "CW",
        "DM",
        "DO",
        "GD",
        "GL",
        "GP",
        "GT",
        "HN",
        "HT",
        "JM",
        "KN",
        "KY",
        "LC",
        "MF",
        "MQ",
        "MS",
        "MX",
        "NI",
        "PA",
        "PM",
        "PR",
        "SV",
        "SX",
        "TC",
        "TT",
        "US",
        "VC",
        "VG",
        "VI"
    ],
    "005": [
        "005",
        "AR",
        "BO",
        "BR",
        "BV",
        "CL",
        "CO",
        "EC",
        "FK",
        "GF",
        "GS",
        "GY",
        "PE",
        "PY",
        "SR",
        "UY",
        "VE"
    ],
    "009": [
        "009",
        "053",
        "054",
        "057",
        "061",
        "AC",
        "AQ",
        "AS",
        "AU",
        "CC",
        "CK",
        "CP",
        "CX",
        "DG",
        "FJ",
        "FM",
        "GU",
        "HM",
        "KI",
        "MH",
        "MP",
        "NC",
        "NF",
        "NR",
        "NU",
        "NZ",
        "PF",
        "PG",
        "PN",
        "PW",
        "QO",
        "SB",
        "TA",
        "TK",
        "TO",
        "TV",
        "UM",
        "VU",
        "WF",
        "WS"
    ],
    "011": [
        "011",
        "BF",
        "BJ",
        "CI",
        "CV",
        "GH",
        "GM",
        "GN",
        "GW",
        "LR",
        "ML",
        "MR",
        "NE",
        "NG",
        "SH",
        "SL",
        "SN",
        "TG"
    ],
    "013": [
        "013",
        "BZ",
        "CR",
        "GT",
        "HN",
        "MX",
        "NI",
        "PA",
        "SV"
    ],
    "014": [
        "014",
        "BI",
        "DJ",
        "ER",
        "ET",
        "IO",
        "KE",
        "KM",
        "MG",
        "MU",
        "MW",
        "MZ",
        "RE",
        "RW",
        "SC",
        "SO",
        "SS",
        "TF",
        "TZ",
        "UG",
        "YT",
        "ZM",
        "ZW"
    ],
    "015": [
        "015",
        "DZ",
        "EA",
        "EG",
        "EH",
        "IC",
        "LY",
        "MA",
        "SD",
        "TN"
    ],
    "017": [
        "017",
        "AO",
        "CD",
        "CF",
        "CG",
        "CM",
        "GA",
        "GQ",
        "ST",
        "TD"
    ],
    "018": [
        "018",
        "BW",
        "LS",
        "NA",
        "SZ",
        "ZA"
    ],
    "019": [
        "003",
        "005",
        "013",
        "019",
        "019-status-grouping",
        "021",
        "029",
        "419",
        "AG",
        "AI",
        "AR",
        "AW",
        "BB",
        "BL",
        "BM",
        "BO",
        "BQ",
        "BR",
        "BS",
        "BV",
        "BZ",
        "CA",
        "CL",
        "CO",
        "CR",
        "CU",
        "CW",
        "DM",
        "DO",
        "EC",
        "FK",
        "GD",
        "GF",
        "GL",
        "GP",
        "GS",
        "GT",
        "GY",
        "HN",
        "HT",
        "JM",
        "KN",
        "KY",
        "LC",
        "MF",
        "MQ",
        "MS",
        "MX",
        "NI",
        "PA",
        "PE",
        "PM",
        "PR",
        "PY",
        "SR",
        "SV",
        "SX",
        "TC",
        "TT",
        "US",
        "UY",
        "VC",
        "VE",
        "VG",
        "VI"
    ],
    "021": [
        "021",
        "BM",
        "CA",
        "GL",
        "PM",
        "US"
    ],
    "029": [
        "029",
        "AG",
        "AI",
        "AW",
        "BB",
        "BL",
        "BQ",
        "BS",
        "CU",
        "CW",
        "DM",
        "DO",
        "GD",
        "GP",
        "HT",
        "JM",
        "KN",
        "KY",
        "LC",
        "MF",
        "MQ",
        "MS",
        "PR",
        "SX",
        "TC",
        "TT",
        "VC",
        "VG",
        "VI"
    ],
    "030": [
        "030",
        "CN",
        "HK",
        "JP",
        "KP",
        "KR",
        "MN",
        "MO",
        "TW"
    ],
    "034": [
        "034",
        "AF",
        "BD",
        "BT",
        "IN",
        "IR",
        "LK",
        "MV",
        "NP",
        "PK"
    ],
    "035": [
        "035",
        "BN",
        "ID",
        "KH",
        "LA",
        "MM",
        "MY",
        "PH",
        "SG",
        "TH",
        "TL",
        "VN"
    ],
    "039": [
        "039",
        "AD",
        "AL",
        "BA",
        "ES",
        "GI",
        "GR",
        "HR",
        "IT",
        "ME",
        "MK",
        "MT",
        "PT",
        "RS",
        "SI",
        "SM",
        "VA",
        "XK"
    ],
    "053": [
        "053",
        "AU",
        "CC",
        "CX",
        "HM",
        "NF",
        "NZ"
    ],
    "054": [
        "054",
        "FJ",
        "NC",
        "PG",
        "SB",
        "VU"
    ],
    "057": [
        "057",
        "FM",
        "GU",
        "KI",
        "MH",
        "MP",
        "NR",
        "PW",
        "UM"
    ],
    "061": [
        "061",
        "AS",
        "CK",
        "NU",
        "PF",
        "PN",
        "TK",
        "TO",
        "TV",
        "WF",
        "WS"
    ],
    "142": [
        "030",
        "034",
        "035",
        "142",
        "143",
        "145",
        "AE",
        "AF",
        "AM",
        "AZ",
        "BD",
        "BH",
        "BN",
        "BT",
        "CN",
        "CY",
        "GE",
        "HK",
        "ID",
        "IL",
        "IN",
        "IQ",
        "IR",
        "JO",
        "JP",
        "KG",
        "KH",
        "KP",
        "KR",
        "KW",
        "KZ",
        "LA",
        "LB",
        "LK",
        "MM",
        "MN",
        "MO",
        "MV",
        "MY",
        "NP",
        "OM",
        "PH",
        "PK",
        "PS",
        "QA",
        "SA",
        "SG",
        "SY",
        "TH",
        "TJ",
        "TL",
        "TM",
        "TR",
        "TW",
        "UZ",
        "VN",
        "YE"
    ],
    "143": [
        "143",
        "KG",
        "KZ",
        "TJ",
        "TM",
        "UZ"
    ],
    "145": [
        "145",
        "AE",
        "AM",
        "AZ",
        "BH",
        "CY",
        "GE",
        "IL",
        "IQ",
        "JO",
        "KW",
        "LB",
        "OM",
        "PS",
        "QA",
        "SA",
        "SY",
        "TR",
        "YE"
    ],
    "150": [
        "039",
        "150",
        "151",
        "154",
        "155",
        "AD",
        "AL",
        "AT",
        "AX",
        "BA",
        "BE",
        "BG",
        "BY",
        "CH",
        "CQ",
        "CZ",
        "DE",
        "DK",
        "EE",
        "ES",
        "FI",
        "FO",
        "FR",
        "GB",
        "GG",
        "GI",
        "GR",
        "HR",
        "HU",
        "IE",
        "IM",
        "IS",
        "IT",
        "JE",
        "LI",
        "LT",
        "LU",
        "LV",
        "MC",
        "MD",
        "ME",
        "MK",
        "MT",
        "NL",
        "NO",
        "PL",
        "PT",
        "RO",
        "RS",
        "RU",
        "SE",
        "SI",
        "SJ",
        "SK",
        "SM",
        "UA",
        "VA",
        "XK"
    ],
    "151": [
        "151",
        "BG",
        "BY",
        "CZ",
        "HU",
        "MD",
        "PL",
        "RO",
        "RU",
        "SK",
        "UA"
    ],
    "154": [
        "154",
        "AX",
        "CQ",
        "DK",
        "EE",
        "FI",
        "FO",
        "GB",
        "GG",
        "IE",
        "IM",
        "IS",
        "JE",
        "LT",
        "LV",
        "NO",
        "SE",
        "SJ"
    ],
    "155": [
        "155",
        "AT",
        "BE",
        "CH",
        "DE",
        "FR",
        "LI",
        "LU",
        "MC",
        "NL"
    ],
    "202": [
        "011",
        "014",
        "017",
        "018",
        "202",
        "AO",
        "BF",
        "BI",
        "BJ",
        "BW",
        "CD",
        "CF",
        "CG",
        "CI",
        "CM",
        "CV",
        "DJ",
        "ER",
        "ET",
        "GA",
        "GH",
        "GM",
        "GN",
        "GQ",
        "GW",
        "IO",
        "KE",
        "KM",
        "LR",
        "LS",
        "MG",
        "ML",
        "MR",
        "MU",
        "MW",
        "MZ",
        "NA",
        "NE",
        "NG",
        "RE",
        "RW",
        "SC",
        "SH",
        "SL",
        "SN",
        "SO",
        "SS",
        "ST",
        "SZ",
        "TD",
        "TF",
        "TG",
        "TZ",
        "UG",
        "YT",
        "ZA",
        "ZM",
        "ZW"
    ],
    "419": [
        "005",
        "013",
        "029",
        "419",
        "AG",
        "AI",
        "AR",
        "AW",
        "BB",
        "BL",
        "BO",
        "BQ",
        "BR",
        "BS",
        "BV",
        "BZ",
        "CL",
        "CO",
        "CR",
        "CU",
        "CW",
        "DM",
        "DO",
        "EC",
        "FK",
        "GD",
        "GF",
        "GP",
        "GS",
        "GT",
        "GY",
        "HN",
        "HT",
        "JM",
        "KN",
        "KY",
        "LC",
        "MF",
        "MQ",
        "MS",
        "MX",
        "NI",
        "PA",
        "PE",
        "PR",
        "PY",
        "SR",
        "SV",
        "SX",
        "TC",
        "TT",
        "UY",
        "VC",
        "VE",
        "VG",
        "VI"
    ],
    "EU": [
        "AT",
        "BE",
        "BG",
        "CY",
        "CZ",
        "DE",
        "DK",
        "EE",
        "ES",
        "EU",
        "FI",
        "FR",
        "GR",
        "HR",
        "HU",
        "IE",
        "IT",
        "LT",
        "LU",
        "LV",
        "MT",
        "NL",
        "PL",
        "PT",
        "RO",
        "SE",
        "SI",
        "SK"
    ],
    "EZ": [
        "AT",
        "BE",
        "CY",
        "DE",
        "EE",
        "ES",
        "EZ",
        "FI",
        "FR",
        "GR",
        "IE",
        "IT",
        "LT",
        "LU",
        "LV",
        "MT",
        "NL",
        "PT",
        "SI",
        "SK"
    ],
    "QO": [
        "AC",
        "AQ",
        "CP",
        "DG",
        "QO",
        "TA"
    ],
    "UN": [
        "AD",
        "AE",
        "AF",
        "AG",
        "AL",
        "AM",
        "AO",
        "AR",
        "AT",
        "AU",
        "AZ",
        "BA",
        "BB",
        "BD",
        "BE",
        "BF",
        "BG",
        "BH",
        "BI",
        "BJ",
        "BN",
        "BO",
        "BR",
        "BS",
        "BT",
        "BW",
        "BY",
        "BZ",
        "CA",
        "CD",
        "CF",
        "CG",
        "CH",
        "CI",
        "CL",
        "CM",
        "CN",
        "CO",
        "CR",
        "CU",
        "CV",
        "CY",
        "CZ",
        "DE",
        "DJ",
        "DK",
        "DM",
        "DO",
        "DZ",
        "EC",
        "EE",
        "EG",
        "ER",
        "ES",
        "ET",
        "FI",
        "FJ",
        "FM",
        "FR",
        "GA",
        "GB",
        "GD",
        "GE",
        "GH",
        "GM",
        "GN",
        "GQ",
        "GR",
        "GT",
        "GW",
        "GY",
        "HN",
        "HR",
        "HT",
        "HU",
        "ID",
        "IE",
        "IL",
        "IN",
        "IQ",
        "IR",
        "IS",
        "IT",
        "JM",
        "JO",
        "JP",
        "KE",
        "KG",
        "KH",
        "KI",
        "KM",
        "KN",
        "KP",
        "KR",
        "KW",
        "KZ",
        "LA",
        "LB",
        "LC",
        "LI",
        "LK",
        "LR",
        "LS",
        "LT",
        "LU",
        "LV",
        "LY",
        "MA",
        "MC",
        "MD",
        "ME",
        "MG",
        "MH",
        "MK",
        "ML",
        "MM",
        "MN",
        "MR",
        "MT",
        "MU",
        "MV",
        "MW",
        "MX",
        "MY",
        "MZ",
        "NA",
        "NE",
        "NG",
        "NI",
        "NL",
        "NO",
        "NP",
        "NR",
        "NZ",
        "OM",
        "PA",
        "PE",
        "PG",
        "PH",
        "PK",
        "PL",
        "PT",
        "PW",
        "PY",
        "QA",
        "RO",
        "RS",
        "RU",
        "RW",
        "SA",
        "SB",
        "SC",
        "SD",
        "SE",
        "SG",
        "SI",
        "SK",
        "SL",
        "SM",
        "SN",
        "SO",
        "SR",
        "SS",
        "ST",
        "SV",
        "SY",
        "SZ",
        "TD",
        "TG",
        "TH",
        "TJ",
        "TL",
        "TM",
        "TN",
        "TO",
        "TR",
        "TT",
        "TV",
        "TZ",
        "UA",
        "UG",
        "UN",
        "US",
        "UY",
        "UZ",
        "VC",
        "VE",
        "VN",
        "VU",
        "WS",
        "YE",
        "ZA",
        "ZM",
        "ZW"
    ]
};


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/abstract/utils.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UNICODE_EXTENSION_SEQUENCE_REGEX: () => (/* binding */ UNICODE_EXTENSION_SEQUENCE_REGEX),
/* harmony export */   findBestMatch: () => (/* binding */ findBestMatch),
/* harmony export */   findMatchingDistance: () => (/* binding */ findMatchingDistance),
/* harmony export */   invariant: () => (/* binding */ invariant)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.mjs");
/* harmony import */ var _languageMatching__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./languageMatching */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/languageMatching.js");
/* harmony import */ var _regions_generated__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./regions.generated */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/regions.generated.js");



var UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi;
function invariant(condition, message, Err) {
    if (Err === void 0) { Err = Error; }
    if (!condition) {
        throw new Err(message);
    }
}
// This is effectively 2 languages in 2 different regions in the same cluster
var DEFAULT_MATCHING_THRESHOLD = 838;
var PROCESSED_DATA;
function processData() {
    var _a, _b;
    if (!PROCESSED_DATA) {
        var paradigmLocales = (_b = (_a = _languageMatching__WEBPACK_IMPORTED_MODULE_0__.data.supplemental.languageMatching['written-new'][0]) === null || _a === void 0 ? void 0 : _a.paradigmLocales) === null || _b === void 0 ? void 0 : _b._locales.split(' ');
        var matchVariables = _languageMatching__WEBPACK_IMPORTED_MODULE_0__.data.supplemental.languageMatching['written-new'].slice(1, 5);
        var data = _languageMatching__WEBPACK_IMPORTED_MODULE_0__.data.supplemental.languageMatching['written-new'].slice(5);
        var matches = data.map(function (d) {
            var key = Object.keys(d)[0];
            var value = d[key];
            return {
                supported: key,
                desired: value._desired,
                distance: +value._distance,
                oneway: value.oneway === 'true' ? true : false,
            };
        }, {});
        PROCESSED_DATA = {
            matches: matches,
            matchVariables: matchVariables.reduce(function (all, d) {
                var key = Object.keys(d)[0];
                var value = d[key];
                all[key.slice(1)] = value._value.split('+');
                return all;
            }, {}),
            paradigmLocales: (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)([], paradigmLocales, true), paradigmLocales.map(function (l) {
                return new Intl.Locale(l.replace(/_/g, '-')).maximize().toString();
            }), true),
        };
    }
    return PROCESSED_DATA;
}
function isMatched(locale, languageMatchInfoLocale, matchVariables) {
    var _a = languageMatchInfoLocale.split('-'), language = _a[0], script = _a[1], region = _a[2];
    var matches = true;
    if (region && region[0] === '$') {
        var shouldInclude = region[1] !== '!';
        var matchRegions = shouldInclude
            ? matchVariables[region.slice(1)]
            : matchVariables[region.slice(2)];
        var expandedMatchedRegions = matchRegions
            .map(function (r) { return _regions_generated__WEBPACK_IMPORTED_MODULE_1__.regions[r] || [r]; })
            .reduce(function (all, list) { return (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spreadArray)([], all, true), list, true); }, []);
        matches && (matches = !(expandedMatchedRegions.indexOf(locale.region || '') > 1 !=
            shouldInclude));
    }
    else {
        matches && (matches = locale.region
            ? region === '*' || region === locale.region
            : true);
    }
    matches && (matches = locale.script ? script === '*' || script === locale.script : true);
    matches && (matches = locale.language
        ? language === '*' || language === locale.language
        : true);
    return matches;
}
function serializeLSR(lsr) {
    return [lsr.language, lsr.script, lsr.region].filter(Boolean).join('-');
}
function findMatchingDistanceForLSR(desired, supported, data) {
    for (var _i = 0, _a = data.matches; _i < _a.length; _i++) {
        var d = _a[_i];
        var matches = isMatched(desired, d.desired, data.matchVariables) &&
            isMatched(supported, d.supported, data.matchVariables);
        if (!d.oneway && !matches) {
            matches =
                isMatched(desired, d.supported, data.matchVariables) &&
                    isMatched(supported, d.desired, data.matchVariables);
        }
        if (matches) {
            var distance = d.distance * 10;
            if (data.paradigmLocales.indexOf(serializeLSR(desired)) > -1 !=
                data.paradigmLocales.indexOf(serializeLSR(supported)) > -1) {
                return distance - 1;
            }
            return distance;
        }
    }
    throw new Error('No matching distance found');
}
function findMatchingDistance(desired, supported) {
    var desiredLocale = new Intl.Locale(desired).maximize();
    var supportedLocale = new Intl.Locale(supported).maximize();
    var desiredLSR = {
        language: desiredLocale.language,
        script: desiredLocale.script || '',
        region: desiredLocale.region || '',
    };
    var supportedLSR = {
        language: supportedLocale.language,
        script: supportedLocale.script || '',
        region: supportedLocale.region || '',
    };
    var matchingDistance = 0;
    var data = processData();
    if (desiredLSR.language !== supportedLSR.language) {
        matchingDistance += findMatchingDistanceForLSR({
            language: desiredLocale.language,
            script: '',
            region: '',
        }, {
            language: supportedLocale.language,
            script: '',
            region: '',
        }, data);
    }
    if (desiredLSR.script !== supportedLSR.script) {
        matchingDistance += findMatchingDistanceForLSR({
            language: desiredLocale.language,
            script: desiredLSR.script,
            region: '',
        }, {
            language: supportedLocale.language,
            script: desiredLSR.script,
            region: '',
        }, data);
    }
    if (desiredLSR.region !== supportedLSR.region) {
        matchingDistance += findMatchingDistanceForLSR(desiredLSR, supportedLSR, data);
    }
    return matchingDistance;
}
function findBestMatch(requestedLocales, supportedLocales, threshold) {
    if (threshold === void 0) { threshold = DEFAULT_MATCHING_THRESHOLD; }
    var lowestDistance = Infinity;
    var result = {
        matchedDesiredLocale: '',
        distances: {},
    };
    requestedLocales.forEach(function (desired, i) {
        if (!result.distances[desired]) {
            result.distances[desired] = {};
        }
        supportedLocales.forEach(function (supported) {
            // Add some weight to the distance based on the order of the supported locales
            // Add penalty for the order of the requested locales, which currently is 0 since ECMA-402
            // doesn't really have room for weighted locales like `en; q=0.1`
            var distance = findMatchingDistance(desired, supported) + 0 + i * 40;
            result.distances[desired][supported] = distance;
            if (distance < lowestDistance) {
                lowestDistance = distance;
                result.matchedDesiredLocale = desired;
                result.matchedSupportedLocale = supported;
            }
        });
    });
    if (lowestDistance >= threshold) {
        result.matchedDesiredLocale = undefined;
        result.matchedSupportedLocale = undefined;
    }
    return result;
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-localematcher/lib/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/@formatjs/intl-localematcher/lib/index.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LookupSupportedLocales: () => (/* reexport safe */ _abstract_LookupSupportedLocales__WEBPACK_IMPORTED_MODULE_2__.LookupSupportedLocales),
/* harmony export */   ResolveLocale: () => (/* reexport safe */ _abstract_ResolveLocale__WEBPACK_IMPORTED_MODULE_1__.ResolveLocale),
/* harmony export */   match: () => (/* binding */ match)
/* harmony export */ });
/* harmony import */ var _abstract_CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract/CanonicalizeLocaleList */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/CanonicalizeLocaleList.js");
/* harmony import */ var _abstract_ResolveLocale__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./abstract/ResolveLocale */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/ResolveLocale.js");
/* harmony import */ var _abstract_LookupSupportedLocales__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstract/LookupSupportedLocales */ "./node_modules/@formatjs/intl-localematcher/lib/abstract/LookupSupportedLocales.js");


function match(requestedLocales, availableLocales, defaultLocale, opts) {
    return (0,_abstract_ResolveLocale__WEBPACK_IMPORTED_MODULE_1__.ResolveLocale)(availableLocales, (0,_abstract_CanonicalizeLocaleList__WEBPACK_IMPORTED_MODULE_0__.CanonicalizeLocaleList)(requestedLocales), {
        localeMatcher: (opts === null || opts === void 0 ? void 0 : opts.algorithm) || 'best fit',
    }, [], {}, function () { return defaultLocale; }).locale;
}




/***/ }),

/***/ "./node_modules/@formatjs/intl-segmenter/polyfill.js":
/*!***********************************************************!*\
  !*** ./node_modules/@formatjs/intl-segmenter/polyfill.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var segmenter_1 = __webpack_require__(/*! ./src/segmenter */ "./node_modules/@formatjs/intl-segmenter/src/segmenter.js");
var should_polyfill_1 = __webpack_require__(/*! ./should-polyfill */ "./node_modules/@formatjs/intl-segmenter/should-polyfill.js");
if ((0, should_polyfill_1.shouldPolyfill)()) {
    Object.defineProperty(Intl, 'Segmenter', {
        value: segmenter_1.Segmenter,
        enumerable: false,
        writable: true,
        configurable: true,
    });
}


/***/ }),

/***/ "./node_modules/@formatjs/intl-segmenter/should-polyfill.js":
/*!******************************************************************!*\
  !*** ./node_modules/@formatjs/intl-segmenter/should-polyfill.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.shouldPolyfill = void 0;
function shouldPolyfill() {
    return !Intl.Segmenter;
}
exports.shouldPolyfill = shouldPolyfill;


/***/ }),

/***/ "./node_modules/@formatjs/intl-segmenter/src/cldr-segmentation-rules.generated.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-segmenter/src/cldr-segmentation-rules.generated.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SegmentationRules = void 0;
/* @generated */
// prettier-ignore
exports.SegmentationRules = {
    "de": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "Port.",
                "Alt.",
                "Di.",
                "Ges.",
                "frz.",
                "entspr.",
                "Gebr.",
                "erw.",
                "Frl.",
                "Inh.",
                "k.u.k.",
                "Ca.",
                "J.D.",
                "Ausg.",
                "evtl.",
                "So.",
                "i.B.",
                "s.a.",
                "kgl.",
                "Sept.",
                "o.B.",
                "Sa.",
                "ev.",
                "Dez.",
                "am.",
                "i.R.",
                "eigtl.",
                "i.J.",
                "u.U.",
                "G.",
                "z.Hd.",
                "u.A.w.g.",
                "Kl.",
                "Spezif.",
                "Obj.",
                "Ing.",
                "D. h.",
                "Folg.",
                "Akt.",
                "i.A.",
                "Msp.",
                "U.U.",
                "Chr.",
                "R.",
                "Einh.",
                "schwäb.",
                "Vgl.",
                "Aug.",
                "Dipl.-Ing.",
                "W.",
                "B.",
                "U. U.",
                "J.",
                "Fa.",
                "Mo.",
                "n.u.Z.",
                "Op.",
                "Mrd.",
                "e.h.",
                "Hr.",
                "Hrn.",
                "Ztr.",
                "k. u. k.",
                "Bibl.",
                "d.Ä.",
                "b.",
                "M.",
                "i.H.",
                "v.R.w.",
                "o.A.",
                "St.",
                "Dr.",
                "Fn.",
                "Abs.",
                "Rd.",
                "Dtzd.",
                "Jahrh.",
                "Z.",
                "Std.",
                "n. Chr.",
                "möbl.",
                "tägl.",
                "gest.",
                "gesch.",
                "z.B.",
                "Hbf.",
                "Abt.",
                "A.M.",
                "e.Wz.",
                "v.T.",
                "Nov.",
                "z.",
                "Prot.",
                "U.S.",
                "Wg.",
                "u.v.a.",
                "Adr.",
                "App.",
                "ggf.",
                "ggfs.",
                "Jan.",
                "O.",
                "Rel.",
                "od.",
                "Pfd.",
                "a.a.O.",
                "p.Adr.",
                "P.",
                "Gem.",
                "v. Chr.",
                "Art.",
                "z.Z.",
                "S.A.",
                "i.V.",
                "verh.",
                "Ausschl.",
                "m.W.",
                "Dir.",
                "Verf.",
                "Sek.",
                "r.",
                "Chin.",
                "Feb.",
                "Int.",
                "Sep.",
                "Gesch.",
                "schweiz.",
                "Bed.",
                "a.Rh.",
                "jew.",
                "vgl.",
                "a.M.",
                "Str.",
                "exkl.",
                "gek.",
                "Erf.",
                "u.Ä.",
                "ehem.",
                "näml.",
                "u. Z.",
                "v. u. Z.",
                "sog.",
                "C.",
                "Dipl.-Kfm.",
                "mtl.",
                "Hrsg.",
                "Qu.",
                "röm.",
                "u.",
                "U.",
                "Adj.",
                "Kap.",
                "hpts.",
                "a.D.",
                "gedr.",
                "Best.",
                "N.",
                "v.u.Z.",
                "Phys.",
                "Fr.",
                "d.J.",
                "Reg.-Bez.",
                "m.E.",
                "schles.",
                "Max.",
                "Ltd.",
                "südd.",
                "inkl.",
                "geb.",
                "Ggf.",
                "Inc.",
                "kath.",
                "kfm.",
                "Nr.",
                "Proz.",
                "Dim.",
                "verw.",
                "Reg.",
                "Dat.",
                "Evtl.",
                "led.",
                "F.",
                "Test.",
                "Schr.",
                "Do.",
                "PIN.",
                "Z. Zt.",
                "v.Chr.",
                "Tägl.",
                "s.",
                "amtl.",
                "Temp.",
                "Mind.",
                "e.V.",
                "Abw.",
                "P.M.",
                "F.f.",
                "a.a.S.",
                "Mod.",
                "Co.",
                "Min.",
                "Allg.",
                "Geograph.",
                "Jr.",
                "Urspr.",
                "Apr.",
                "Z. B.",
                "v.H.",
                "A.",
                "einschl.",
                "Trans.",
                "zzgl.",
                "StR.",
                "Fam.",
                "I.",
                "jhrl.",
                "u.a.",
                "Ben.",
                "o.g.",
                "Kfm.",
                "Konv.",
                "Mi.",
                "L.",
                "beil.",
                "T.",
                "Ursprüngl.",
                "röm.-kath.",
                "Okt.",
                "u.ä.",
                "Tel.",
                "D.",
                "Ber.",
                "Kop.",
                "Mio.",
                "Y.",
                "U.S.A.",
                "v. H.",
                "Forts. f.",
                "Rep.",
                "Hptst.",
                "österr."
            ],
            "variables": {}
        }
    },
    "el": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [],
            "variables": {
                "$STerm": "((?:[!;\\?\\u037E\\u0589\\u061D-\\u061F\\u06D4\\u0700-\\u0702\\u07F9\\u0837\\u0839\\u083D\\u083E\\u0964\\u0965\\u104A\\u104B\\u1362\\u1367\\u1368\\u166E\\u1735\\u1736\\u1803\\u1809\\u1944\\u1945\\u1AA8-\\u1AAB\\u1B5A\\u1B5B\\u1B5E\\u1B5F\\u1B7D\\u1B7E\\u1C3B\\u1C3C\\u1C7E\\u1C7F\\u203C\\u203D\\u2047-\\u2049\\u2E2E\\u2E3C\\u2E53\\u2E54\\u3002\\uA4FF\\uA60E\\uA60F\\uA6F3\\uA6F7\\uA876\\uA877\\uA8CE\\uA8CF\\uA92F\\uA9C8\\uA9C9\\uAA5D-\\uAA5F\\uAAF0\\uAAF1\\uABEB\\uFE56\\uFE57\\uFF01\\uFF1F\\uFF61]|\\uD802[\\uDE56\\uDE57]|\\uD803[\\uDF55-\\uDF59\\uDF86-\\uDF89]|\\uD804[\\uDC47\\uDC48\\uDCBE-\\uDCC1\\uDD41-\\uDD43\\uDDC5\\uDDC6\\uDDCD\\uDDDE\\uDDDF\\uDE38\\uDE39\\uDE3B\\uDE3C\\uDEA9]|\\uD805[\\uDC4B\\uDC4C\\uDDC2\\uDDC3\\uDDC9-\\uDDD7\\uDE41\\uDE42\\uDF3C-\\uDF3E]|\\uD806[\\uDD44\\uDD46\\uDE42\\uDE43\\uDE9B\\uDE9C]|\\uD807[\\uDC41\\uDC42\\uDEF7\\uDEF8\\uDF43\\uDF44]|\\uD81A[\\uDE6E\\uDE6F\\uDEF5\\uDF37\\uDF38\\uDF44]|\\uD81B\\uDE98|\\uD82F\\uDC9F|\\uD836\\uDE88)(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)"
            }
        }
    },
    "en": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "L.P.",
                "Alt.",
                "Approx.",
                "E.G.",
                "O.",
                "Maj.",
                "Misc.",
                "P.O.",
                "J.D.",
                "Jam.",
                "Card.",
                "Dec.",
                "Sept.",
                "MR.",
                "Long.",
                "Hat.",
                "G.",
                "Link.",
                "DC.",
                "D.C.",
                "M.T.",
                "Hz.",
                "Mrs.",
                "By.",
                "Act.",
                "Var.",
                "N.V.",
                "Aug.",
                "B.",
                "S.A.",
                "Up.",
                "Job.",
                "Num.",
                "M.I.T.",
                "Ok.",
                "Org.",
                "Ex.",
                "Cont.",
                "U.",
                "Mart.",
                "Fn.",
                "Abs.",
                "Lt.",
                "OK.",
                "Z.",
                "E.",
                "Kb.",
                "Est.",
                "A.M.",
                "L.A.",
                "Prof.",
                "U.S.",
                "Nov.",
                "Ph.D.",
                "Mar.",
                "I.T.",
                "exec.",
                "Jan.",
                "N.Y.",
                "X.",
                "Md.",
                "Op.",
                "vs.",
                "D.A.",
                "A.D.",
                "R.L.",
                "P.M.",
                "Or.",
                "M.R.",
                "Cap.",
                "PC.",
                "Feb.",
                "Exec.",
                "I.e.",
                "Sep.",
                "Gb.",
                "K.",
                "U.S.C.",
                "Mt.",
                "S.",
                "A.S.",
                "C.O.D.",
                "Capt.",
                "Col.",
                "In.",
                "C.F.",
                "Adj.",
                "AD.",
                "I.D.",
                "Mgr.",
                "R.T.",
                "B.V.",
                "M.",
                "Conn.",
                "Yr.",
                "Rev.",
                "Phys.",
                "pp.",
                "Ms.",
                "To.",
                "Sgt.",
                "J.K.",
                "Nr.",
                "Jun.",
                "Fri.",
                "S.A.R.",
                "Lev.",
                "Lt.Cdr.",
                "Def.",
                "F.",
                "Do.",
                "Joe.",
                "Id.",
                "Mr.",
                "Dept.",
                "Is.",
                "Pvt.",
                "Diff.",
                "Hon.B.A.",
                "Q.",
                "Mb.",
                "On.",
                "Min.",
                "J.B.",
                "Ed.",
                "AB.",
                "A.",
                "S.p.A.",
                "I.",
                "a.m.",
                "Comm.",
                "Go.",
                "VS.",
                "L.",
                "All.",
                "PP.",
                "P.V.",
                "T.",
                "K.R.",
                "Etc.",
                "D.",
                "Adv.",
                "Lib.",
                "E.g.",
                "Pro.",
                "U.S.A.",
                "S.E.",
                "AA.",
                "Rep.",
                "Sq.",
                "As."
            ],
            "variables": {}
        }
    },
    "es": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "Rdos.",
                "JJ.OO.",
                "Sres.",
                "fig.",
                "may.",
                "RR.HH.",
                "oct.",
                "cap.",
                "mié.",
                "doc.",
                "Excmo.",
                "Trab.",
                "Excmos.",
                "Kit.",
                "Inc.",
                "FF.CC.",
                "DC.",
                "ago.",
                "trad.",
                "SA.",
                "Rvdos.",
                "ed.",
                "Exmo.",
                "jul.",
                "col.",
                "RAM.",
                "Srtas.",
                "ene.",
                "Rol.",
                "Fabric.",
                "Comm.",
                "vid.",
                "Da.",
                "dic.",
                "ss.",
                "abr.",
                "ntra.",
                "Sra.",
                "dtor.",
                "cf.",
                "dom.",
                "prov.",
                "Emm.",
                "Sr.",
                "licdo.",
                "p.ej.",
                "bol.",
                "figs.",
                "Vda.",
                "Dr.",
                "ntro.",
                "Desv.",
                "O.M.",
                "Ldo.",
                "Drs.",
                "sáb.",
                "feb.",
                "Ltda.",
                "Lcda.",
                "Exma.",
                "C.V.",
                "SS.MM.",
                "Lda.",
                "U.S.",
                "hnos.",
                "R.D.",
                "Korn.",
                "v.gr.",
                "vs.",
                "Ilmas.",
                "Rdo.",
                "ej.",
                "vie.",
                "jue.",
                "a. C.",
                "Ilmos.",
                "e. c.",
                "Excma.",
                "afma.",
                "licda.",
                "Em.",
                "K.",
                "sras.",
                "MM.",
                "fund.",
                "Mons.",
                "Lcdo.",
                "afmo.",
                "C.",
                "A.C.",
                "dptos.",
                "Col.",
                "Srta.",
                "Av.",
                "Ant.",
                "depto.",
                "Var.",
                "H.P.",
                "D.",
                "M.",
                "C.P.",
                "Rev.",
                "Rvdmos.",
                "Fr.",
                "Ilmo.",
                "afmos.",
                "Ltd.",
                "afmas.",
                "prof.",
                "lun.",
                "SS.AA.",
                "Sol.",
                "nov.",
                "mss.",
                "Dña.",
                "Seg.",
                "mar.",
                "Rvdmo.",
                "Reg.",
                "ms.",
                "Sras.",
                "sres.",
                "U.S.A.",
                "Sta.",
                "Sdad.",
                "Dra.",
                "srs.",
                "R.U.",
                "deptos.",
                "dpto.",
                "jun.",
                "bco.",
                "Cía.",
                "Id.",
                "Mr.",
                "e.g.",
                "C.S.",
                "Excmas.",
                "Dª.",
                "Rvdo.",
                "Lic.",
                "cfr.",
                "Corp.",
                "Dto.",
                "Ilma.",
                "L.",
                "All.",
                "PP.",
                "d. C.",
                "Ltdo.",
                "mtro.",
                "Mrs.",
                "Desc.",
                "Avda.",
                "Exmas.",
                "a. e. c.",
                "Bien.",
                "Exmos.",
                "AA.",
                "Sto.",
                "CA.",
                "sept.",
                "Exc.",
                "c/c."
            ],
            "variables": {}
        }
    },
    "fr": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "aux.",
                "config.",
                "collab.",
                "M.",
                "dim.",
                "imprim.",
                "oct.",
                "syst.",
                "bull.",
                "MM.",
                "doc.",
                "P.O.",
                "hôp.",
                "Mart.",
                "juil.",
                "broch.",
                "adr.",
                "symb.",
                "C.",
                "anc.",
                "voit.",
                "Jr.",
                "graph.",
                "dir.",
                "éd.",
                "fig.",
                "édit.",
                "niv.",
                "quart.",
                "cam.",
                "éval.",
                "anon.",
                "réf.",
                "Comm.",
                "Prof.",
                "févr.",
                "indus.",
                "DC.",
                "équiv.",
                "illustr.",
                "acoust.",
                "nov.",
                "L.",
                "All.",
                "U.S.",
                "S.M.A.R.T.",
                "sept.",
                "avr.",
                "jeu.",
                "dest.",
                "P.-D. G.",
                "ill.",
                "coll.",
                "encycl.",
                "mer.",
                "Desc.",
                "ven.",
                "P.",
                "lun.",
                "Inc.",
                "sam.",
                "D.",
                "append.",
                "Var.",
                "categ.",
                "janv.",
                "S.A.",
                "imm.",
                "U.S.A.",
                "mar.",
                "exempl.",
                "déc.",
                "ann.",
                "U.",
                "synth.",
                "dict.",
                "av. J.-C.",
                "W.",
                "Op.",
                "ap. J.-C.",
                "gouv.",
                "trav. publ."
            ],
            "variables": {}
        }
    },
    "it": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "N.B.",
                "div.",
                "a.C.",
                "fig.",
                "d.p.R.",
                "c.c.p.",
                "Cfr.",
                "vol.",
                "Geom.",
                "O.d.G.",
                "S.p.A.",
                "ver.",
                "N.d.A.",
                "dott.",
                "arch.",
                "d.C.",
                "N.d.T.",
                "rag.",
                "Sig.",
                "Mod.",
                "pag.",
                "dr.",
                "tav.",
                "N.d.E.",
                "DC.",
                "mitt.",
                "Ing.",
                "int.",
                "on.",
                "C.P.",
                "ag.",
                "L.",
                "U.S.",
                "S.M.A.R.T.",
                "p.i.",
                "tab.",
                "Ltd.",
                "Liv.",
                "D.",
                "U.S.A.",
                "sez.",
                "avv.",
                "S.A.R.",
                "all.",
                "p."
            ],
            "variables": {}
        }
    },
    "ja": {
        "word": {
            "segmentRules": {
                "13.3": {
                    "after": "$Hiragana",
                    "before": "$Hiragana",
                    "breaks": false
                },
                "13.4": {
                    "after": "$Ideographic",
                    "before": "$Ideographic",
                    "breaks": false
                }
            },
            "suppressions": [],
            "variables": {
                "$Hiragana": "((?:[\\u3041-\\u3096\\u309D-\\u309F]|\\uD82C[\\uDC01-\\uDD1F\\uDD32\\uDD50-\\uDD52]|\\uD83C\\uDE00)(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Ideographic": "((?:[\\u3005-\\u3007\\u3021-\\u3029\\u3038-\\u303B\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFA6D\\uFA70-\\uFAD9]|\\uD81B\\uDFE4|[\\uD81C-\\uD820\\uD822\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872\\uD874-\\uD879\\uD880-\\uD883\\uD885-\\uD887][\\uDC00-\\uDFFF]|\\uD821[\\uDC00-\\uDFF7]|\\uD823[\\uDC00-\\uDCD5\\uDD00-\\uDD08]|\\uD82C[\\uDD70-\\uDEFB]|\\uD869[\\uDC00-\\uDEDF\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF39\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1\\uDEB0-\\uDFFF]|\\uD87A[\\uDC00-\\uDFE0]|\\uD87E[\\uDC00-\\uDE1D]|\\uD884[\\uDC00-\\uDF4A\\uDF50-\\uDFFF]|\\uD888[\\uDC00-\\uDFAF])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)"
            }
        }
    },
    "pt": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "psicol.",
                "fig.",
                "compl.",
                "rep.",
                "cap.",
                "doc.",
                "fisiol.",
                "dipl.",
                "astron.",
                "port.",
                "eletrôn.",
                "geom.",
                "mov.",
                "ago.",
                "trad.",
                "arquit.",
                "dez.",
                "ed.",
                "apt.",
                "Exmo.",
                "col.",
                "ff.",
                "univ.",
                "res.",
                "R.",
                "transp.",
                "D.C",
                "l.",
                "des.",
                "fev.",
                "abr.",
                "liter.",
                "lat.",
                "Dir.",
                "cf.",
                "adm.",
                "fot.",
                "p.m.",
                "P.M.",
                "créd.",
                "jur.",
                "com.",
                "anat.",
                "dir.",
                "end.",
                "fís.",
                "E.",
                "Est.",
                "cont.",
                "matem.",
                "Drs.",
                "gên.",
                "neol.",
                "pág.",
                "índ.",
                "Ltda.",
                "Exma.",
                "esp.",
                "ingl.",
                "tecnol.",
                "Mar.",
                "símb.",
                "Pe.",
                "pal.",
                "filos.",
                "V.T.",
                "fasc.",
                "vs.",
                "mai.",
                "S.A.",
                "profa.",
                "N.Sra.",
                "r.s.v.p.",
                "cel.",
                "mat.",
                "abrev.",
                "out.",
                "long.",
                "aux.",
                "arit.",
                "aer.",
                "jul.",
                "lin.",
                "S.",
                "méd.",
                "odontol.",
                "org.",
                "A.C.",
                "jun.",
                "déb.",
                "Av.",
                "álg.",
                "sup.",
                "fl.",
                "odont.",
                "caps.",
                "relat.",
                "organiz.",
                "hist.",
                "Fr.",
                "Ilmo.",
                "fem.",
                "ap.",
                "Ltd.",
                "pol.",
                "séc.",
                "prof.",
                "cx.",
                "nov.",
                "quím.",
                "mús.",
                "agric.",
                "mar.",
                "W.C.",
                "fr.",
                "cat.",
                "jan.",
                "pron.",
                "rel.",
                "autom.",
                "Sta.",
                "Dra.",
                "p.",
                "tel.",
                "div.",
                "p. ex.",
                "a.C.",
                "bras.",
                "Alm.",
                "Dr.",
                "comp.",
                "pq.",
                "arqueol.",
                "náut.",
                "biogr.",
                "f.",
                "círc.",
                "fac.",
                "d.C.",
                "apart.",
                "ex.",
                "Jr.",
                "set.",
                "tec.",
                "sociol.",
                "gram.",
                "ind.",
                "Ilma.",
                "vol.",
                "eng.",
                "rod.",
                "Ph.D.",
                "Dras.",
                "pp.",
                "elem.",
                "máq.",
                "cód.",
                "eletr.",
                "prod.",
                "ref.",
                "fil.",
                "a.m.",
                "A.M",
                "obs.",
                "N.T.",
                "contab.",
                "Sto.",
                "lit.",
                "educ.",
                "rementente",
                "desc.",
                "próx."
            ],
            "variables": {}
        }
    },
    "root": {
        "grapheme": {
            "segmentRules": {
                "11": {
                    "after": "$ExtPict",
                    "before": "$ExtPict$Extend*$ZWJ",
                    "breaks": false
                },
                "12": {
                    "after": "$RI",
                    "before": "^($RI$RI)*$RI",
                    "breaks": false
                },
                "13": {
                    "after": "$RI",
                    "before": "[^\\uDDE6-\\uDDFF]($RI$RI)*$RI",
                    "breaks": false
                },
                "3": {
                    "after": "$LF",
                    "before": "$CR",
                    "breaks": false
                },
                "4": {
                    "before": "($Control|$CR|$LF)",
                    "breaks": true
                },
                "5": {
                    "after": "($Control|$CR|$LF)",
                    "breaks": true
                },
                "6": {
                    "after": "($L|$V|$LV|$LVT)",
                    "before": "$L",
                    "breaks": false
                },
                "7": {
                    "after": "($V|$T)",
                    "before": "($LV|$V)",
                    "breaks": false
                },
                "8": {
                    "after": "$T",
                    "before": "($LVT|$T)",
                    "breaks": false
                },
                "9": {
                    "after": "($Extend|$ZWJ)",
                    "breaks": false
                },
                "9.1": {
                    "after": "$SpacingMark",
                    "breaks": false
                },
                "9.2": {
                    "before": "$Prepend",
                    "breaks": false
                },
                "9.3": {
                    "after": "$LinkingConsonant",
                    "before": "$LinkingConsonant$ExtCccZwj*$Virama$ExtCccZwj*",
                    "breaks": false
                }
            },
            "suppressions": [],
            "variables": {
                "$CR": "\\r",
                "$Control": "(?:[\\0-\\t\\x0B\\f\\x0E-\\x1F\\x7F-\\x9F\\xAD\\u061C\\u180E\\u200B\\u200E\\u200F\\u2028-\\u202E\\u2060-\\u206F\\uFEFF\\uFFF0-\\uFFFB]|\\uD80D[\\uDC30-\\uDC3F]|\\uD82F[\\uDCA0-\\uDCA3]|\\uD834[\\uDD73-\\uDD7A]|\\uDB40[\\uDC00-\\uDC1F\\uDC80-\\uDCFF\\uDDF0-\\uDFFF]|[\\uDB41-\\uDB43][\\uDC00-\\uDFFF])",
                "$ExtCccZwj": "(?:[\\u0300-\\u034E\\u0350-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0898-\\u089F\\u08CA-\\u08E1\\u08E3-\\u08FF\\u093C\\u094D\\u0951-\\u0954\\u09BC\\u09CD\\u09FE\\u0A3C\\u0A4D\\u0ABC\\u0ACD\\u0B3C\\u0B4D\\u0BCD\\u0C3C\\u0C4D\\u0C55\\u0C56\\u0CBC\\u0CCD\\u0D3B\\u0D3C\\u0D4D\\u0DCA\\u0E38-\\u0E3A\\u0E48-\\u0E4B\\u0EB8-\\u0EBA\\u0EC8-\\u0ECB\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71\\u0F72\\u0F74\\u0F7A-\\u0F7D\\u0F80\\u0F82-\\u0F84\\u0F86\\u0F87\\u0FC6\\u1037\\u1039\\u103A\\u108D\\u135D-\\u135F\\u1714\\u17D2\\u17DD\\u18A9\\u1939-\\u193B\\u1A17\\u1A18\\u1A60\\u1A75-\\u1A7C\\u1A7F\\u1AB0-\\u1ABD\\u1ABF-\\u1ACE\\u1B34\\u1B6B-\\u1B73\\u1BAB\\u1BE6\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1CF4\\u1CF8\\u1CF9\\u1DC0-\\u1DFF\\u200D\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA806\\uA82C\\uA8C4\\uA8E0-\\uA8F1\\uA92B-\\uA92D\\uA9B3\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAF6\\uABED\\uFB1E\\uFE20-\\uFE2F]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE0D\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC46\\uDC70\\uDC7F\\uDCB9\\uDCBA\\uDD00-\\uDD02\\uDD33\\uDD34\\uDD73\\uDDCA\\uDE36\\uDEE9\\uDEEA\\uDF3B\\uDF3C\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC42\\uDC46\\uDC5E\\uDCC2\\uDCC3\\uDDBF\\uDDC0\\uDE3F\\uDEB7\\uDF2B]|\\uD806[\\uDC39\\uDC3A\\uDD3E\\uDD43\\uDDE0\\uDE34\\uDE47\\uDE99]|\\uD807[\\uDC3F\\uDD42\\uDD44\\uDD45\\uDD97\\uDF42]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD82F\\uDC9E|\\uD834[\\uDD65\\uDD67-\\uDD69\\uDD6E-\\uDD72\\uDD7B-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A])",
                "$ExtPict": "(?:[\\xA9\\xAE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u2199\\u21A9\\u21AA\\u231A\\u231B\\u2328\\u2388\\u23CF\\u23E9-\\u23F3\\u23F8-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u2605\\u2607-\\u2612\\u2614-\\u2685\\u2690-\\u2705\\u2708-\\u2712\\u2714\\u2716\\u271D\\u2721\\u2728\\u2733\\u2734\\u2744\\u2747\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2763-\\u2767\\u2795-\\u2797\\u27A1\\u27B0\\u27BF\\u2934\\u2935\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55\\u3030\\u303D\\u3297\\u3299]|\\uD83C[\\uDC00-\\uDCFF\\uDD0D-\\uDD0F\\uDD2F\\uDD6C-\\uDD71\\uDD7E\\uDD7F\\uDD8E\\uDD91-\\uDD9A\\uDDAD-\\uDDE5\\uDE01-\\uDE0F\\uDE1A\\uDE2F\\uDE32-\\uDE3A\\uDE3C-\\uDE3F\\uDE49-\\uDFFA]|\\uD83D[\\uDC00-\\uDD3D\\uDD46-\\uDE4F\\uDE80-\\uDEFF\\uDF74-\\uDF7F\\uDFD5-\\uDFFF]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE-\\uDCFF\\uDD0C-\\uDD3A\\uDD3C-\\uDD45\\uDD47-\\uDEFF]|\\uD83F[\\uDC00-\\uDFFD])",
                "$Extend": "(?:[\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0898-\\u089F\\u08CA-\\u08E1\\u08E3-\\u0902\\u093A\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0957\\u0962\\u0963\\u0981\\u09BC\\u09BE\\u09C1-\\u09C4\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01\\u0B3C\\u0B3E\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE\\u0BC0\\u0BCD\\u0BD7\\u0C00\\u0C04\\u0C3C\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81\\u0CBC\\u0CBF\\u0CC2\\u0CC6\\u0CCC\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0D00\\u0D01\\u0D3B\\u0D3C\\u0D3E\\u0D41-\\u0D44\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81\\u0DCA\\u0DCF\\u0DD2-\\u0DD4\\u0DD6\\u0DDF\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135D-\\u135F\\u1712-\\u1714\\u1732\\u1733\\u1752\\u1753\\u1772\\u1773\\u17B4\\u17B5\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A1B\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B03\\u1B34-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1BAB-\\u1BAD\\u1BE6\\u1BE8\\u1BE9\\u1BED\\u1BEF-\\u1BF1\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1CF4\\u1CF8\\u1CF9\\u1DC0-\\u1DFF\\u200C\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA82C\\uA8C4\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uA9BD\\uA9E5\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAA7C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEC\\uAAED\\uAAF6\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFF9E\\uFF9F]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC01\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC81\\uDCB3-\\uDCB6\\uDCB9\\uDCBA\\uDCC2\\uDD00-\\uDD02\\uDD27-\\uDD2B\\uDD2D-\\uDD34\\uDD73\\uDD80\\uDD81\\uDDB6-\\uDDBE\\uDDC9-\\uDDCC\\uDDCF\\uDE2F-\\uDE31\\uDE34\\uDE36\\uDE37\\uDE3E\\uDE41\\uDEDF\\uDEE3-\\uDEEA\\uDF00\\uDF01\\uDF3B\\uDF3C\\uDF3E\\uDF40\\uDF57\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC38-\\uDC3F\\uDC42-\\uDC44\\uDC46\\uDC5E\\uDCB0\\uDCB3-\\uDCB8\\uDCBA\\uDCBD\\uDCBF\\uDCC0\\uDCC2\\uDCC3\\uDDAF\\uDDB2-\\uDDB5\\uDDBC\\uDDBD\\uDDBF\\uDDC0\\uDDDC\\uDDDD\\uDE33-\\uDE3A\\uDE3D\\uDE3F\\uDE40\\uDEAB\\uDEAD\\uDEB0-\\uDEB5\\uDEB7\\uDF1D-\\uDF1F\\uDF22-\\uDF25\\uDF27-\\uDF2B]|\\uD806[\\uDC2F-\\uDC37\\uDC39\\uDC3A\\uDD30\\uDD3B\\uDD3C\\uDD3E\\uDD43\\uDDD4-\\uDDD7\\uDDDA\\uDDDB\\uDDE0\\uDE01-\\uDE0A\\uDE33-\\uDE38\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE56\\uDE59-\\uDE5B\\uDE8A-\\uDE96\\uDE98\\uDE99]|\\uD807[\\uDC30-\\uDC36\\uDC38-\\uDC3D\\uDC3F\\uDC92-\\uDCA7\\uDCAA-\\uDCB0\\uDCB2\\uDCB3\\uDCB5\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD90\\uDD91\\uDD95\\uDD97\\uDEF3\\uDEF4\\uDF00\\uDF01\\uDF36-\\uDF3A\\uDF40\\uDF42]|\\uD80D[\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF8F-\\uDF92\\uDFE4]|\\uD82F[\\uDC9D\\uDC9E]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65\\uDD67-\\uDD69\\uDD6E-\\uDD72\\uDD7B-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC20-\\uDC7F\\uDD00-\\uDDEF])",
                "$L": "[\\u1100-\\u115F\\uA960-\\uA97C]",
                "$LF": "\\n",
                "$LV": "[\\uAC00\\uAC1C\\uAC38\\uAC54\\uAC70\\uAC8C\\uACA8\\uACC4\\uACE0\\uACFC\\uAD18\\uAD34\\uAD50\\uAD6C\\uAD88\\uADA4\\uADC0\\uADDC\\uADF8\\uAE14\\uAE30\\uAE4C\\uAE68\\uAE84\\uAEA0\\uAEBC\\uAED8\\uAEF4\\uAF10\\uAF2C\\uAF48\\uAF64\\uAF80\\uAF9C\\uAFB8\\uAFD4\\uAFF0\\uB00C\\uB028\\uB044\\uB060\\uB07C\\uB098\\uB0B4\\uB0D0\\uB0EC\\uB108\\uB124\\uB140\\uB15C\\uB178\\uB194\\uB1B0\\uB1CC\\uB1E8\\uB204\\uB220\\uB23C\\uB258\\uB274\\uB290\\uB2AC\\uB2C8\\uB2E4\\uB300\\uB31C\\uB338\\uB354\\uB370\\uB38C\\uB3A8\\uB3C4\\uB3E0\\uB3FC\\uB418\\uB434\\uB450\\uB46C\\uB488\\uB4A4\\uB4C0\\uB4DC\\uB4F8\\uB514\\uB530\\uB54C\\uB568\\uB584\\uB5A0\\uB5BC\\uB5D8\\uB5F4\\uB610\\uB62C\\uB648\\uB664\\uB680\\uB69C\\uB6B8\\uB6D4\\uB6F0\\uB70C\\uB728\\uB744\\uB760\\uB77C\\uB798\\uB7B4\\uB7D0\\uB7EC\\uB808\\uB824\\uB840\\uB85C\\uB878\\uB894\\uB8B0\\uB8CC\\uB8E8\\uB904\\uB920\\uB93C\\uB958\\uB974\\uB990\\uB9AC\\uB9C8\\uB9E4\\uBA00\\uBA1C\\uBA38\\uBA54\\uBA70\\uBA8C\\uBAA8\\uBAC4\\uBAE0\\uBAFC\\uBB18\\uBB34\\uBB50\\uBB6C\\uBB88\\uBBA4\\uBBC0\\uBBDC\\uBBF8\\uBC14\\uBC30\\uBC4C\\uBC68\\uBC84\\uBCA0\\uBCBC\\uBCD8\\uBCF4\\uBD10\\uBD2C\\uBD48\\uBD64\\uBD80\\uBD9C\\uBDB8\\uBDD4\\uBDF0\\uBE0C\\uBE28\\uBE44\\uBE60\\uBE7C\\uBE98\\uBEB4\\uBED0\\uBEEC\\uBF08\\uBF24\\uBF40\\uBF5C\\uBF78\\uBF94\\uBFB0\\uBFCC\\uBFE8\\uC004\\uC020\\uC03C\\uC058\\uC074\\uC090\\uC0AC\\uC0C8\\uC0E4\\uC100\\uC11C\\uC138\\uC154\\uC170\\uC18C\\uC1A8\\uC1C4\\uC1E0\\uC1FC\\uC218\\uC234\\uC250\\uC26C\\uC288\\uC2A4\\uC2C0\\uC2DC\\uC2F8\\uC314\\uC330\\uC34C\\uC368\\uC384\\uC3A0\\uC3BC\\uC3D8\\uC3F4\\uC410\\uC42C\\uC448\\uC464\\uC480\\uC49C\\uC4B8\\uC4D4\\uC4F0\\uC50C\\uC528\\uC544\\uC560\\uC57C\\uC598\\uC5B4\\uC5D0\\uC5EC\\uC608\\uC624\\uC640\\uC65C\\uC678\\uC694\\uC6B0\\uC6CC\\uC6E8\\uC704\\uC720\\uC73C\\uC758\\uC774\\uC790\\uC7AC\\uC7C8\\uC7E4\\uC800\\uC81C\\uC838\\uC854\\uC870\\uC88C\\uC8A8\\uC8C4\\uC8E0\\uC8FC\\uC918\\uC934\\uC950\\uC96C\\uC988\\uC9A4\\uC9C0\\uC9DC\\uC9F8\\uCA14\\uCA30\\uCA4C\\uCA68\\uCA84\\uCAA0\\uCABC\\uCAD8\\uCAF4\\uCB10\\uCB2C\\uCB48\\uCB64\\uCB80\\uCB9C\\uCBB8\\uCBD4\\uCBF0\\uCC0C\\uCC28\\uCC44\\uCC60\\uCC7C\\uCC98\\uCCB4\\uCCD0\\uCCEC\\uCD08\\uCD24\\uCD40\\uCD5C\\uCD78\\uCD94\\uCDB0\\uCDCC\\uCDE8\\uCE04\\uCE20\\uCE3C\\uCE58\\uCE74\\uCE90\\uCEAC\\uCEC8\\uCEE4\\uCF00\\uCF1C\\uCF38\\uCF54\\uCF70\\uCF8C\\uCFA8\\uCFC4\\uCFE0\\uCFFC\\uD018\\uD034\\uD050\\uD06C\\uD088\\uD0A4\\uD0C0\\uD0DC\\uD0F8\\uD114\\uD130\\uD14C\\uD168\\uD184\\uD1A0\\uD1BC\\uD1D8\\uD1F4\\uD210\\uD22C\\uD248\\uD264\\uD280\\uD29C\\uD2B8\\uD2D4\\uD2F0\\uD30C\\uD328\\uD344\\uD360\\uD37C\\uD398\\uD3B4\\uD3D0\\uD3EC\\uD408\\uD424\\uD440\\uD45C\\uD478\\uD494\\uD4B0\\uD4CC\\uD4E8\\uD504\\uD520\\uD53C\\uD558\\uD574\\uD590\\uD5AC\\uD5C8\\uD5E4\\uD600\\uD61C\\uD638\\uD654\\uD670\\uD68C\\uD6A8\\uD6C4\\uD6E0\\uD6FC\\uD718\\uD734\\uD750\\uD76C\\uD788]",
                "$LVT": "[\\uAC01-\\uAC1B\\uAC1D-\\uAC37\\uAC39-\\uAC53\\uAC55-\\uAC6F\\uAC71-\\uAC8B\\uAC8D-\\uACA7\\uACA9-\\uACC3\\uACC5-\\uACDF\\uACE1-\\uACFB\\uACFD-\\uAD17\\uAD19-\\uAD33\\uAD35-\\uAD4F\\uAD51-\\uAD6B\\uAD6D-\\uAD87\\uAD89-\\uADA3\\uADA5-\\uADBF\\uADC1-\\uADDB\\uADDD-\\uADF7\\uADF9-\\uAE13\\uAE15-\\uAE2F\\uAE31-\\uAE4B\\uAE4D-\\uAE67\\uAE69-\\uAE83\\uAE85-\\uAE9F\\uAEA1-\\uAEBB\\uAEBD-\\uAED7\\uAED9-\\uAEF3\\uAEF5-\\uAF0F\\uAF11-\\uAF2B\\uAF2D-\\uAF47\\uAF49-\\uAF63\\uAF65-\\uAF7F\\uAF81-\\uAF9B\\uAF9D-\\uAFB7\\uAFB9-\\uAFD3\\uAFD5-\\uAFEF\\uAFF1-\\uB00B\\uB00D-\\uB027\\uB029-\\uB043\\uB045-\\uB05F\\uB061-\\uB07B\\uB07D-\\uB097\\uB099-\\uB0B3\\uB0B5-\\uB0CF\\uB0D1-\\uB0EB\\uB0ED-\\uB107\\uB109-\\uB123\\uB125-\\uB13F\\uB141-\\uB15B\\uB15D-\\uB177\\uB179-\\uB193\\uB195-\\uB1AF\\uB1B1-\\uB1CB\\uB1CD-\\uB1E7\\uB1E9-\\uB203\\uB205-\\uB21F\\uB221-\\uB23B\\uB23D-\\uB257\\uB259-\\uB273\\uB275-\\uB28F\\uB291-\\uB2AB\\uB2AD-\\uB2C7\\uB2C9-\\uB2E3\\uB2E5-\\uB2FF\\uB301-\\uB31B\\uB31D-\\uB337\\uB339-\\uB353\\uB355-\\uB36F\\uB371-\\uB38B\\uB38D-\\uB3A7\\uB3A9-\\uB3C3\\uB3C5-\\uB3DF\\uB3E1-\\uB3FB\\uB3FD-\\uB417\\uB419-\\uB433\\uB435-\\uB44F\\uB451-\\uB46B\\uB46D-\\uB487\\uB489-\\uB4A3\\uB4A5-\\uB4BF\\uB4C1-\\uB4DB\\uB4DD-\\uB4F7\\uB4F9-\\uB513\\uB515-\\uB52F\\uB531-\\uB54B\\uB54D-\\uB567\\uB569-\\uB583\\uB585-\\uB59F\\uB5A1-\\uB5BB\\uB5BD-\\uB5D7\\uB5D9-\\uB5F3\\uB5F5-\\uB60F\\uB611-\\uB62B\\uB62D-\\uB647\\uB649-\\uB663\\uB665-\\uB67F\\uB681-\\uB69B\\uB69D-\\uB6B7\\uB6B9-\\uB6D3\\uB6D5-\\uB6EF\\uB6F1-\\uB70B\\uB70D-\\uB727\\uB729-\\uB743\\uB745-\\uB75F\\uB761-\\uB77B\\uB77D-\\uB797\\uB799-\\uB7B3\\uB7B5-\\uB7CF\\uB7D1-\\uB7EB\\uB7ED-\\uB807\\uB809-\\uB823\\uB825-\\uB83F\\uB841-\\uB85B\\uB85D-\\uB877\\uB879-\\uB893\\uB895-\\uB8AF\\uB8B1-\\uB8CB\\uB8CD-\\uB8E7\\uB8E9-\\uB903\\uB905-\\uB91F\\uB921-\\uB93B\\uB93D-\\uB957\\uB959-\\uB973\\uB975-\\uB98F\\uB991-\\uB9AB\\uB9AD-\\uB9C7\\uB9C9-\\uB9E3\\uB9E5-\\uB9FF\\uBA01-\\uBA1B\\uBA1D-\\uBA37\\uBA39-\\uBA53\\uBA55-\\uBA6F\\uBA71-\\uBA8B\\uBA8D-\\uBAA7\\uBAA9-\\uBAC3\\uBAC5-\\uBADF\\uBAE1-\\uBAFB\\uBAFD-\\uBB17\\uBB19-\\uBB33\\uBB35-\\uBB4F\\uBB51-\\uBB6B\\uBB6D-\\uBB87\\uBB89-\\uBBA3\\uBBA5-\\uBBBF\\uBBC1-\\uBBDB\\uBBDD-\\uBBF7\\uBBF9-\\uBC13\\uBC15-\\uBC2F\\uBC31-\\uBC4B\\uBC4D-\\uBC67\\uBC69-\\uBC83\\uBC85-\\uBC9F\\uBCA1-\\uBCBB\\uBCBD-\\uBCD7\\uBCD9-\\uBCF3\\uBCF5-\\uBD0F\\uBD11-\\uBD2B\\uBD2D-\\uBD47\\uBD49-\\uBD63\\uBD65-\\uBD7F\\uBD81-\\uBD9B\\uBD9D-\\uBDB7\\uBDB9-\\uBDD3\\uBDD5-\\uBDEF\\uBDF1-\\uBE0B\\uBE0D-\\uBE27\\uBE29-\\uBE43\\uBE45-\\uBE5F\\uBE61-\\uBE7B\\uBE7D-\\uBE97\\uBE99-\\uBEB3\\uBEB5-\\uBECF\\uBED1-\\uBEEB\\uBEED-\\uBF07\\uBF09-\\uBF23\\uBF25-\\uBF3F\\uBF41-\\uBF5B\\uBF5D-\\uBF77\\uBF79-\\uBF93\\uBF95-\\uBFAF\\uBFB1-\\uBFCB\\uBFCD-\\uBFE7\\uBFE9-\\uC003\\uC005-\\uC01F\\uC021-\\uC03B\\uC03D-\\uC057\\uC059-\\uC073\\uC075-\\uC08F\\uC091-\\uC0AB\\uC0AD-\\uC0C7\\uC0C9-\\uC0E3\\uC0E5-\\uC0FF\\uC101-\\uC11B\\uC11D-\\uC137\\uC139-\\uC153\\uC155-\\uC16F\\uC171-\\uC18B\\uC18D-\\uC1A7\\uC1A9-\\uC1C3\\uC1C5-\\uC1DF\\uC1E1-\\uC1FB\\uC1FD-\\uC217\\uC219-\\uC233\\uC235-\\uC24F\\uC251-\\uC26B\\uC26D-\\uC287\\uC289-\\uC2A3\\uC2A5-\\uC2BF\\uC2C1-\\uC2DB\\uC2DD-\\uC2F7\\uC2F9-\\uC313\\uC315-\\uC32F\\uC331-\\uC34B\\uC34D-\\uC367\\uC369-\\uC383\\uC385-\\uC39F\\uC3A1-\\uC3BB\\uC3BD-\\uC3D7\\uC3D9-\\uC3F3\\uC3F5-\\uC40F\\uC411-\\uC42B\\uC42D-\\uC447\\uC449-\\uC463\\uC465-\\uC47F\\uC481-\\uC49B\\uC49D-\\uC4B7\\uC4B9-\\uC4D3\\uC4D5-\\uC4EF\\uC4F1-\\uC50B\\uC50D-\\uC527\\uC529-\\uC543\\uC545-\\uC55F\\uC561-\\uC57B\\uC57D-\\uC597\\uC599-\\uC5B3\\uC5B5-\\uC5CF\\uC5D1-\\uC5EB\\uC5ED-\\uC607\\uC609-\\uC623\\uC625-\\uC63F\\uC641-\\uC65B\\uC65D-\\uC677\\uC679-\\uC693\\uC695-\\uC6AF\\uC6B1-\\uC6CB\\uC6CD-\\uC6E7\\uC6E9-\\uC703\\uC705-\\uC71F\\uC721-\\uC73B\\uC73D-\\uC757\\uC759-\\uC773\\uC775-\\uC78F\\uC791-\\uC7AB\\uC7AD-\\uC7C7\\uC7C9-\\uC7E3\\uC7E5-\\uC7FF\\uC801-\\uC81B\\uC81D-\\uC837\\uC839-\\uC853\\uC855-\\uC86F\\uC871-\\uC88B\\uC88D-\\uC8A7\\uC8A9-\\uC8C3\\uC8C5-\\uC8DF\\uC8E1-\\uC8FB\\uC8FD-\\uC917\\uC919-\\uC933\\uC935-\\uC94F\\uC951-\\uC96B\\uC96D-\\uC987\\uC989-\\uC9A3\\uC9A5-\\uC9BF\\uC9C1-\\uC9DB\\uC9DD-\\uC9F7\\uC9F9-\\uCA13\\uCA15-\\uCA2F\\uCA31-\\uCA4B\\uCA4D-\\uCA67\\uCA69-\\uCA83\\uCA85-\\uCA9F\\uCAA1-\\uCABB\\uCABD-\\uCAD7\\uCAD9-\\uCAF3\\uCAF5-\\uCB0F\\uCB11-\\uCB2B\\uCB2D-\\uCB47\\uCB49-\\uCB63\\uCB65-\\uCB7F\\uCB81-\\uCB9B\\uCB9D-\\uCBB7\\uCBB9-\\uCBD3\\uCBD5-\\uCBEF\\uCBF1-\\uCC0B\\uCC0D-\\uCC27\\uCC29-\\uCC43\\uCC45-\\uCC5F\\uCC61-\\uCC7B\\uCC7D-\\uCC97\\uCC99-\\uCCB3\\uCCB5-\\uCCCF\\uCCD1-\\uCCEB\\uCCED-\\uCD07\\uCD09-\\uCD23\\uCD25-\\uCD3F\\uCD41-\\uCD5B\\uCD5D-\\uCD77\\uCD79-\\uCD93\\uCD95-\\uCDAF\\uCDB1-\\uCDCB\\uCDCD-\\uCDE7\\uCDE9-\\uCE03\\uCE05-\\uCE1F\\uCE21-\\uCE3B\\uCE3D-\\uCE57\\uCE59-\\uCE73\\uCE75-\\uCE8F\\uCE91-\\uCEAB\\uCEAD-\\uCEC7\\uCEC9-\\uCEE3\\uCEE5-\\uCEFF\\uCF01-\\uCF1B\\uCF1D-\\uCF37\\uCF39-\\uCF53\\uCF55-\\uCF6F\\uCF71-\\uCF8B\\uCF8D-\\uCFA7\\uCFA9-\\uCFC3\\uCFC5-\\uCFDF\\uCFE1-\\uCFFB\\uCFFD-\\uD017\\uD019-\\uD033\\uD035-\\uD04F\\uD051-\\uD06B\\uD06D-\\uD087\\uD089-\\uD0A3\\uD0A5-\\uD0BF\\uD0C1-\\uD0DB\\uD0DD-\\uD0F7\\uD0F9-\\uD113\\uD115-\\uD12F\\uD131-\\uD14B\\uD14D-\\uD167\\uD169-\\uD183\\uD185-\\uD19F\\uD1A1-\\uD1BB\\uD1BD-\\uD1D7\\uD1D9-\\uD1F3\\uD1F5-\\uD20F\\uD211-\\uD22B\\uD22D-\\uD247\\uD249-\\uD263\\uD265-\\uD27F\\uD281-\\uD29B\\uD29D-\\uD2B7\\uD2B9-\\uD2D3\\uD2D5-\\uD2EF\\uD2F1-\\uD30B\\uD30D-\\uD327\\uD329-\\uD343\\uD345-\\uD35F\\uD361-\\uD37B\\uD37D-\\uD397\\uD399-\\uD3B3\\uD3B5-\\uD3CF\\uD3D1-\\uD3EB\\uD3ED-\\uD407\\uD409-\\uD423\\uD425-\\uD43F\\uD441-\\uD45B\\uD45D-\\uD477\\uD479-\\uD493\\uD495-\\uD4AF\\uD4B1-\\uD4CB\\uD4CD-\\uD4E7\\uD4E9-\\uD503\\uD505-\\uD51F\\uD521-\\uD53B\\uD53D-\\uD557\\uD559-\\uD573\\uD575-\\uD58F\\uD591-\\uD5AB\\uD5AD-\\uD5C7\\uD5C9-\\uD5E3\\uD5E5-\\uD5FF\\uD601-\\uD61B\\uD61D-\\uD637\\uD639-\\uD653\\uD655-\\uD66F\\uD671-\\uD68B\\uD68D-\\uD6A7\\uD6A9-\\uD6C3\\uD6C5-\\uD6DF\\uD6E1-\\uD6FB\\uD6FD-\\uD717\\uD719-\\uD733\\uD735-\\uD74F\\uD751-\\uD76B\\uD76D-\\uD787\\uD789-\\uD7A3]",
                "$LinkingConsonant": "[\\u0915-\\u0939\\u0958-\\u095F\\u0978-\\u097F\\u0995-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09DC\\u09DD\\u09DF\\u09F0\\u09F1\\u0A95-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0AF9\\u0B15-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B5C\\u0B5D\\u0B5F\\u0B71\\u0C15-\\u0C28\\u0C2A-\\u0C39\\u0C58-\\u0C5A\\u0D15-\\u0D3A]",
                "$Prepend": "(?:[\\u0600-\\u0605\\u06DD\\u070F\\u0890\\u0891\\u08E2\\u0D4E]|\\uD804[\\uDCBD\\uDCCD\\uDDC2\\uDDC3]|\\uD806[\\uDD3F\\uDD41\\uDE3A\\uDE84-\\uDE89]|\\uD807[\\uDD46\\uDF02])",
                "$RI": "(?:\\uD83C[\\uDDE6-\\uDDFF])",
                "$SpacingMark": "(?:[\\u0903\\u093B\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u094F\\u0982\\u0983\\u09BF\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0\\u0CC1\\u0CC3\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CF3\\u0D02\\u0D03\\u0D3F\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D82\\u0D83\\u0DD0\\u0DD1\\u0DD8-\\u0DDE\\u0DF2\\u0DF3\\u0E33\\u0EB3\\u0F3E\\u0F3F\\u0F7F\\u1031\\u103B\\u103C\\u1056\\u1057\\u1084\\u1715\\u1734\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u1A19\\u1A1A\\u1A55\\u1A57\\u1A6D-\\u1A72\\u1B04\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1BE7\\u1BEA-\\u1BEC\\u1BEE\\u1BF2\\u1BF3\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF7\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BE-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAAEB\\uAAEE\\uAAEF\\uAAF5\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]|\\uD804[\\uDC00\\uDC02\\uDC82\\uDCB0-\\uDCB2\\uDCB7\\uDCB8\\uDD2C\\uDD45\\uDD46\\uDD82\\uDDB3-\\uDDB5\\uDDBF\\uDDC0\\uDDCE\\uDE2C-\\uDE2E\\uDE32\\uDE33\\uDE35\\uDEE0-\\uDEE2\\uDF02\\uDF03\\uDF3F\\uDF41-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF62\\uDF63]|\\uD805[\\uDC35-\\uDC37\\uDC40\\uDC41\\uDC45\\uDCB1\\uDCB2\\uDCB9\\uDCBB\\uDCBC\\uDCBE\\uDCC1\\uDDB0\\uDDB1\\uDDB8-\\uDDBB\\uDDBE\\uDE30-\\uDE32\\uDE3B\\uDE3C\\uDE3E\\uDEAC\\uDEAE\\uDEAF\\uDEB6\\uDF26]|\\uD806[\\uDC2C-\\uDC2E\\uDC38\\uDD31-\\uDD35\\uDD37\\uDD38\\uDD3D\\uDD40\\uDD42\\uDDD1-\\uDDD3\\uDDDC-\\uDDDF\\uDDE4\\uDE39\\uDE57\\uDE58\\uDE97]|\\uD807[\\uDC2F\\uDC3E\\uDCA9\\uDCB1\\uDCB4\\uDD8A-\\uDD8E\\uDD93\\uDD94\\uDD96\\uDEF5\\uDEF6\\uDF03\\uDF34\\uDF35\\uDF3E\\uDF3F\\uDF41]|\\uD81B[\\uDF51-\\uDF87\\uDFF0\\uDFF1]|\\uD834[\\uDD66\\uDD6D])",
                "$T": "[\\u11A8-\\u11FF\\uD7CB-\\uD7FB]",
                "$V": "[\\u1160-\\u11A7\\uD7B0-\\uD7C6]",
                "$Virama": "[\\u094D\\u09CD\\u0ACD\\u0B4D\\u0C4D\\u0D4D]",
                "$ZWJ": "\\u200D"
            }
        },
        "sentence": {
            "segmentRules": {
                "10": {
                    "after": "($Sp|$ParaSep)",
                    "before": "$SATerm$Close*$Sp*",
                    "breaks": false
                },
                "11": {
                    "before": "$SATerm$Close*$Sp*$ParaSep?",
                    "breaks": true
                },
                "3": {
                    "after": "$LF",
                    "before": "$CR",
                    "breaks": false
                },
                "4": {
                    "before": "$ParaSep",
                    "breaks": true
                },
                "5": {
                    "after": "(?:$Format|$Extend)",
                    "breaks": false
                },
                "6": {
                    "after": "$Numeric",
                    "before": "$ATerm",
                    "breaks": false
                },
                "7": {
                    "after": "$Upper",
                    "before": "($Upper|$Lower)$ATerm",
                    "breaks": false
                },
                "8": {
                    "after": "$NotPreLower_*$Lower",
                    "before": "$ATerm$Close*$Sp*",
                    "breaks": false
                },
                "8.1": {
                    "after": "($SContinue|$SATerm)",
                    "before": "$SATerm$Close*$Sp*",
                    "breaks": false
                },
                "9": {
                    "after": "($Close|$Sp|$ParaSep)",
                    "before": "$SATerm$Close*",
                    "breaks": false
                },
                "998": {
                    "after": "$Any",
                    "breaks": false
                }
            },
            "suppressions": [],
            "variables": {
                "$ATerm": "([\\.\\u2024\\uFE52\\uFF0E](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Any": "(?:[\\0-\\uD7FF\\uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF])",
                "$CR": "\\r",
                "$Close": "((?:[\"'-\\)\\[\\]\\{\\}\\xAB\\xBB\\u0F3A-\\u0F3D\\u169B\\u169C\\u2018-\\u201F\\u2039\\u203A\\u2045\\u2046\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u275B-\\u2760\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2E00-\\u2E0D\\u2E1C\\u2E1D\\u2E20-\\u2E29\\u2E42\\u2E55-\\u2E5C\\u3008-\\u3011\\u3014-\\u301B\\u301D-\\u301F\\uFD3E\\uFD3F\\uFE17\\uFE18\\uFE35-\\uFE44\\uFE47\\uFE48\\uFE59-\\uFE5E\\uFF08\\uFF09\\uFF3B\\uFF3D\\uFF5B\\uFF5D\\uFF5F\\uFF60\\uFF62\\uFF63]|\\uD83D[\\uDE76-\\uDE78])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Extend": "(?:[\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0898-\\u089F\\u08CA-\\u08E1\\u08E3-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180D\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C\\u200D\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFF9E\\uFF9F]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCC2\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD72\\uDD7B-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC20-\\uDC7F\\uDD00-\\uDDEF])",
                "$FE": "(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])",
                "$Format": "(?:[\\xAD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890\\u0891\\u08E2\\u180E\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB]|\\uD804[\\uDCBD\\uDCCD]|\\uD80D[\\uDC30-\\uDC3F]|\\uD82F[\\uDCA0-\\uDCA3]|\\uD834[\\uDD73-\\uDD7A]|\\uDB40\\uDC01)",
                "$LF": "\\n",
                "$Lower": "((?:[a-z\\xAA\\xB5\\xBA\\xDF-\\xF6\\xF8-\\xFF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E-\\u0180\\u0183\\u0185\\u0188\\u018C\\u018D\\u0192\\u0195\\u0199-\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9\\u01BA\\u01BD-\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233-\\u0239\\u023C\\u023F\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F-\\u0293\\u0295-\\u02B8\\u02C0\\u02C1\\u02E0-\\u02E4\\u0371\\u0373\\u0377\\u037A-\\u037D\\u0390\\u03AC-\\u03CE\\u03D0\\u03D1\\u03D5-\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF-\\u03F3\\u03F5\\u03F8\\u03FB\\u03FC\\u0430-\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7\\u04D9\\u04DB\\u04DD\\u04DF\\u04E1\\u04E3\\u04E5\\u04E7\\u04E9\\u04EB\\u04ED\\u04EF\\u04F1\\u04F3\\u04F5\\u04F7\\u04F9\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0525\\u0527\\u0529\\u052B\\u052D\\u052F\\u0560-\\u0588\\u10FC\\u13F8-\\u13FD\\u1C80-\\u1C88\\u1D00-\\u1DBF\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95-\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF-\\u1F07\\u1F10-\\u1F15\\u1F20-\\u1F27\\u1F30-\\u1F37\\u1F40-\\u1F45\\u1F50-\\u1F57\\u1F60-\\u1F67\\u1F70-\\u1F7D\\u1F80-\\u1F87\\u1F90-\\u1F97\\u1FA0-\\u1FA7\\u1FB0-\\u1FB4\\u1FB6\\u1FB7\\u1FBE\\u1FC2-\\u1FC4\\u1FC6\\u1FC7\\u1FD0-\\u1FD3\\u1FD6\\u1FD7\\u1FE0-\\u1FE7\\u1FF2-\\u1FF4\\u1FF6\\u1FF7\\u2071\\u207F\\u2090-\\u209C\\u210A\\u210E\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C\\u213D\\u2146-\\u2149\\u214E\\u2170-\\u217F\\u2184\\u24D0-\\u24E9\\u2C30-\\u2C5F\\u2C61\\u2C65\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73\\u2C74\\u2C76-\\u2C7D\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3\\u2CE4\\u2CEC\\u2CEE\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA661\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA699\\uA69B-\\uA69D\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F-\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F-\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uA78E\\uA791\\uA793-\\uA795\\uA797\\uA799\\uA79B\\uA79D\\uA79F\\uA7A1\\uA7A3\\uA7A5\\uA7A7\\uA7A9\\uA7AF\\uA7B5\\uA7B7\\uA7B9\\uA7BB\\uA7BD\\uA7BF\\uA7C1\\uA7C3\\uA7C8\\uA7CA\\uA7D1\\uA7D3\\uA7D5\\uA7D7\\uA7D9\\uA7F2-\\uA7F4\\uA7F6\\uA7F8-\\uA7FA\\uAB30-\\uAB5A\\uAB5C-\\uAB69\\uAB70-\\uABBF\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFF41-\\uFF5A]|\\uD801[\\uDC28-\\uDC4F\\uDCD8-\\uDCFB\\uDD97-\\uDDA1\\uDDA3-\\uDDB1\\uDDB3-\\uDDB9\\uDDBB\\uDDBC\\uDF80\\uDF83-\\uDF85\\uDF87-\\uDFB0\\uDFB2-\\uDFBA]|\\uD803[\\uDCC0-\\uDCF2]|\\uD806[\\uDCC0-\\uDCDF]|\\uD81B[\\uDE60-\\uDE7F]|\\uD835[\\uDC1A-\\uDC33\\uDC4E-\\uDC54\\uDC56-\\uDC67\\uDC82-\\uDC9B\\uDCB6-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDCCF\\uDCEA-\\uDD03\\uDD1E-\\uDD37\\uDD52-\\uDD6B\\uDD86-\\uDD9F\\uDDBA-\\uDDD3\\uDDEE-\\uDE07\\uDE22-\\uDE3B\\uDE56-\\uDE6F\\uDE8A-\\uDEA5\\uDEC2-\\uDEDA\\uDEDC-\\uDEE1\\uDEFC-\\uDF14\\uDF16-\\uDF1B\\uDF36-\\uDF4E\\uDF50-\\uDF55\\uDF70-\\uDF88\\uDF8A-\\uDF8F\\uDFAA-\\uDFC2\\uDFC4-\\uDFC9\\uDFCB]|\\uD837[\\uDF00-\\uDF09\\uDF0B-\\uDF1E\\uDF25-\\uDF2A]|\\uD838[\\uDC30-\\uDC6D]|\\uD83A[\\uDD22-\\uDD43])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$NotPreLower_": "(?:(?![\\n\\r!\\.\\?A-Za-z\\x85\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0560-\\u0589\\u05D0-\\u05EA\\u05EF-\\u05F3\\u061D-\\u064A\\u066E\\u066F\\u0671-\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF-\\u0702\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07F9\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0837\\u0839\\u083D\\u083E\\u0840-\\u0858\\u0860-\\u086A\\u0870-\\u0887\\u0889-\\u088E\\u08A0-\\u08C9\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0964\\u0965\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u09FC\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0AF9\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58-\\u0C5A\\u0C5D\\u0C60\\u0C61\\u0C80\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D04-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D54-\\u0D56\\u0D5F-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E86-\\u0E8A\\u0E8C-\\u0EA3\\u0EA5\\u0EA7-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u104A\\u104B\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1362\\u1367\\u1368\\u1380-\\u138F\\u13A0-\\u13F5\\u13F8-\\u13FD\\u1401-\\u166C\\u166E-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u1711\\u171F-\\u1731\\u1735\\u1736\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1803\\u1809\\u1820-\\u1878\\u1880-\\u1884\\u1887-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1944\\u1945\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7-\\u1AAB\\u1B05-\\u1B33\\u1B45-\\u1B4C\\u1B5A\\u1B5B\\u1B5E\\u1B5F\\u1B7D\\u1B7E\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C3B\\u1C3C\\u1C4D-\\u1C4F\\u1C5A-\\u1C88\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u1CE9-\\u1CEC\\u1CEE-\\u1CF3\\u1CF5\\u1CF6\\u1CFA\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2024\\u2028\\u2029\\u203C\\u203D\\u2047-\\u2049\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u24B6-\\u24E9\\u2C00-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2E\\u2E2F\\u2E3C\\u2E53\\u2E54\\u3002\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312F\\u3131-\\u318E\\u31A0-\\u31BF\\u31F0-\\u31FF\\u3400-\\u4DBF\\u4E00-\\uA48C\\uA4D0-\\uA4FD\\uA4FF-\\uA60C\\uA60E-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA6F3\\uA6F7\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA7CA\\uA7D0\\uA7D1\\uA7D3\\uA7D5-\\uA7D9\\uA7F2-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA876\\uA877\\uA882-\\uA8B3\\uA8CE\\uA8CF\\uA8F2-\\uA8F7\\uA8FB\\uA8FD\\uA8FE\\uA90A-\\uA925\\uA92F-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9C8\\uA9C9\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA5D-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF0-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB69\\uAB70-\\uABE2\\uABEB\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE52\\uFE56\\uFE57\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF01\\uFF0E\\uFF1F\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF61\\uFF66-\\uFF9D\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDF00-\\uDF1F\\uDF2D-\\uDF4A\\uDF50-\\uDF75\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC00-\\uDC9D\\uDCB0-\\uDCD3\\uDCD8-\\uDCFB\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDD70-\\uDD7A\\uDD7C-\\uDD8A\\uDD8C-\\uDD92\\uDD94\\uDD95\\uDD97-\\uDDA1\\uDDA3-\\uDDB1\\uDDB3-\\uDDB9\\uDDBB\\uDDBC\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67\\uDF80-\\uDF85\\uDF87-\\uDFB0\\uDFB2-\\uDFBA]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00\\uDE10-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE35\\uDE56\\uDE57\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE4\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDC80-\\uDCB2\\uDCC0-\\uDCF2\\uDD00-\\uDD23\\uDE80-\\uDEA9\\uDEB0\\uDEB1\\uDF00-\\uDF1C\\uDF27\\uDF30-\\uDF45\\uDF55-\\uDF59\\uDF70-\\uDF81\\uDF86-\\uDF89\\uDFB0-\\uDFC4\\uDFE0-\\uDFF6]|\\uD804[\\uDC03-\\uDC37\\uDC47\\uDC48\\uDC71\\uDC72\\uDC75\\uDC83-\\uDCAF\\uDCBE-\\uDCC1\\uDCD0-\\uDCE8\\uDD03-\\uDD26\\uDD41-\\uDD44\\uDD47\\uDD50-\\uDD72\\uDD76\\uDD83-\\uDDB2\\uDDC1-\\uDDC6\\uDDCD\\uDDDA\\uDDDC\\uDDDE\\uDDDF\\uDE00-\\uDE11\\uDE13-\\uDE2B\\uDE38\\uDE39\\uDE3B\\uDE3C\\uDE3F\\uDE40\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA9\\uDEB0-\\uDEDE\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3D\\uDF50\\uDF5D-\\uDF61]|\\uD805[\\uDC00-\\uDC34\\uDC47-\\uDC4C\\uDC5F-\\uDC61\\uDC80-\\uDCAF\\uDCC4\\uDCC5\\uDCC7\\uDD80-\\uDDAE\\uDDC2\\uDDC3\\uDDC9-\\uDDDB\\uDE00-\\uDE2F\\uDE41\\uDE42\\uDE44\\uDE80-\\uDEAA\\uDEB8\\uDF00-\\uDF1A\\uDF3C-\\uDF3E\\uDF40-\\uDF46]|\\uD806[\\uDC00-\\uDC2B\\uDCA0-\\uDCDF\\uDCFF-\\uDD06\\uDD09\\uDD0C-\\uDD13\\uDD15\\uDD16\\uDD18-\\uDD2F\\uDD3F\\uDD41\\uDD44\\uDD46\\uDDA0-\\uDDA7\\uDDAA-\\uDDD0\\uDDE1\\uDDE3\\uDE00\\uDE0B-\\uDE32\\uDE3A\\uDE42\\uDE43\\uDE50\\uDE5C-\\uDE89\\uDE9B-\\uDE9D\\uDEB0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC2E\\uDC40-\\uDC42\\uDC72-\\uDC8F\\uDD00-\\uDD06\\uDD08\\uDD09\\uDD0B-\\uDD30\\uDD46\\uDD60-\\uDD65\\uDD67\\uDD68\\uDD6A-\\uDD89\\uDD98\\uDEE0-\\uDEF2\\uDEF7\\uDEF8\\uDF02\\uDF04-\\uDF10\\uDF12-\\uDF33\\uDF43\\uDF44\\uDFB0]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|\\uD80B[\\uDF90-\\uDFF0]|[\\uD80C\\uD81C-\\uD820\\uD822\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872\\uD874-\\uD879\\uD880-\\uD883\\uD885-\\uD887][\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2F\\uDC41-\\uDC46]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDE6E-\\uDEBE\\uDED0-\\uDEED\\uDEF5\\uDF00-\\uDF2F\\uDF37\\uDF38\\uDF40-\\uDF44\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDE40-\\uDE7F\\uDE98\\uDF00-\\uDF4A\\uDF50\\uDF93-\\uDF9F\\uDFE0\\uDFE1\\uDFE3]|\\uD821[\\uDC00-\\uDFF7]|\\uD823[\\uDC00-\\uDCD5\\uDD00-\\uDD08]|\\uD82B[\\uDFF0-\\uDFF3\\uDFF5-\\uDFFB\\uDFFD\\uDFFE]|\\uD82C[\\uDC00-\\uDD22\\uDD32\\uDD50-\\uDD52\\uDD55\\uDD64-\\uDD67\\uDD70-\\uDEFB]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99\\uDC9F]|\\uD835[\\uDC00-\\uDC54\\uDC56-\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD1E-\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD52-\\uDEA5\\uDEA8-\\uDEC0\\uDEC2-\\uDEDA\\uDEDC-\\uDEFA\\uDEFC-\\uDF14\\uDF16-\\uDF34\\uDF36-\\uDF4E\\uDF50-\\uDF6E\\uDF70-\\uDF88\\uDF8A-\\uDFA8\\uDFAA-\\uDFC2\\uDFC4-\\uDFCB]|\\uD836\\uDE88|\\uD837[\\uDF00-\\uDF1E\\uDF25-\\uDF2A]|\\uD838[\\uDC30-\\uDC6D\\uDD00-\\uDD2C\\uDD37-\\uDD3D\\uDD4E\\uDE90-\\uDEAD\\uDEC0-\\uDEEB]|\\uD839[\\uDCD0-\\uDCEB\\uDFE0-\\uDFE6\\uDFE8-\\uDFEB\\uDFED\\uDFEE\\uDFF0-\\uDFFE]|\\uD83A[\\uDC00-\\uDCC4\\uDD00-\\uDD43\\uDD4B]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD83C[\\uDD30-\\uDD49\\uDD50-\\uDD69\\uDD70-\\uDD89]|\\uD869[\\uDC00-\\uDEDF\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF39\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1\\uDEB0-\\uDFFF]|\\uD87A[\\uDC00-\\uDFE0]|\\uD87E[\\uDC00-\\uDE1D]|\\uD884[\\uDC00-\\uDF4A\\uDF50-\\uDFFF]|\\uD888[\\uDC00-\\uDFAF])[\\s\\S])",
                "$Numeric": "((?:[0-9\\u0660-\\u0669\\u066B\\u066C\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]|\\uD801[\\uDCA0-\\uDCA9]|\\uD803[\\uDD30-\\uDD39]|\\uD804[\\uDC66-\\uDC6F\\uDCF0-\\uDCF9\\uDD36-\\uDD3F\\uDDD0-\\uDDD9\\uDEF0-\\uDEF9]|\\uD805[\\uDC50-\\uDC59\\uDCD0-\\uDCD9\\uDE50-\\uDE59\\uDEC0-\\uDEC9\\uDF30-\\uDF39]|\\uD806[\\uDCE0-\\uDCE9\\uDD50-\\uDD59]|\\uD807[\\uDC50-\\uDC59\\uDD50-\\uDD59\\uDDA0-\\uDDA9\\uDF50-\\uDF59]|\\uD81A[\\uDE60-\\uDE69\\uDEC0-\\uDEC9\\uDF50-\\uDF59]|\\uD835[\\uDFCE-\\uDFFF]|\\uD838[\\uDD40-\\uDD49\\uDEF0-\\uDEF9]|\\uD839[\\uDCF0-\\uDCF9]|\\uD83A[\\uDD50-\\uDD59]|\\uD83E[\\uDFF0-\\uDFF9])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$OLetter": "((?:[\\u01BB\\u01C0-\\u01C3\\u0294\\u02B9-\\u02BF\\u02C6-\\u02D1\\u02EC\\u02EE\\u0374\\u0559\\u05D0-\\u05EA\\u05EF-\\u05F3\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u0860-\\u086A\\u0870-\\u0887\\u0889-\\u088E\\u08A0-\\u08C9\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u09FC\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0AF9\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58-\\u0C5A\\u0C5D\\u0C60\\u0C61\\u0C80\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D04-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D54-\\u0D56\\u0D5F-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E86-\\u0E8A\\u0E8C-\\u0EA3\\u0EA5\\u0EA7-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10D0-\\u10FA\\u10FD-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u1711\\u171F-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1878\\u1880-\\u1884\\u1887-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4C\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u1CE9-\\u1CEC\\u1CEE-\\u1CF3\\u1CF5\\u1CF6\\u1CFA\\u2135-\\u2138\\u2180-\\u2182\\u2185-\\u2188\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312F\\u3131-\\u318E\\u31A0-\\u31BF\\u31F0-\\u31FF\\u3400-\\u4DBF\\u4E00-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA66E\\uA67F\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA788\\uA78F\\uA7F7\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA8FD\\uA8FE\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF66-\\uFF9D\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDF00-\\uDF1F\\uDF2D-\\uDF4A\\uDF50-\\uDF75\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC50-\\uDC9D\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67\\uDF81\\uDF82]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00\\uDE10-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE35\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE4\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDD00-\\uDD23\\uDE80-\\uDEA9\\uDEB0\\uDEB1\\uDF00-\\uDF1C\\uDF27\\uDF30-\\uDF45\\uDF70-\\uDF81\\uDFB0-\\uDFC4\\uDFE0-\\uDFF6]|\\uD804[\\uDC03-\\uDC37\\uDC71\\uDC72\\uDC75\\uDC83-\\uDCAF\\uDCD0-\\uDCE8\\uDD03-\\uDD26\\uDD44\\uDD47\\uDD50-\\uDD72\\uDD76\\uDD83-\\uDDB2\\uDDC1-\\uDDC4\\uDDDA\\uDDDC\\uDE00-\\uDE11\\uDE13-\\uDE2B\\uDE3F\\uDE40\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA8\\uDEB0-\\uDEDE\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3D\\uDF50\\uDF5D-\\uDF61]|\\uD805[\\uDC00-\\uDC34\\uDC47-\\uDC4A\\uDC5F-\\uDC61\\uDC80-\\uDCAF\\uDCC4\\uDCC5\\uDCC7\\uDD80-\\uDDAE\\uDDD8-\\uDDDB\\uDE00-\\uDE2F\\uDE44\\uDE80-\\uDEAA\\uDEB8\\uDF00-\\uDF1A\\uDF40-\\uDF46]|\\uD806[\\uDC00-\\uDC2B\\uDCFF-\\uDD06\\uDD09\\uDD0C-\\uDD13\\uDD15\\uDD16\\uDD18-\\uDD2F\\uDD3F\\uDD41\\uDDA0-\\uDDA7\\uDDAA-\\uDDD0\\uDDE1\\uDDE3\\uDE00\\uDE0B-\\uDE32\\uDE3A\\uDE50\\uDE5C-\\uDE89\\uDE9D\\uDEB0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC2E\\uDC40\\uDC72-\\uDC8F\\uDD00-\\uDD06\\uDD08\\uDD09\\uDD0B-\\uDD30\\uDD46\\uDD60-\\uDD65\\uDD67\\uDD68\\uDD6A-\\uDD89\\uDD98\\uDEE0-\\uDEF2\\uDF02\\uDF04-\\uDF10\\uDF12-\\uDF33\\uDFB0]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|\\uD80B[\\uDF90-\\uDFF0]|[\\uD80C\\uD81C-\\uD820\\uD822\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872\\uD874-\\uD879\\uD880-\\uD883\\uD885-\\uD887][\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2F\\uDC41-\\uDC46]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDE70-\\uDEBE\\uDED0-\\uDEED\\uDF00-\\uDF2F\\uDF40-\\uDF43\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDF00-\\uDF4A\\uDF50\\uDF93-\\uDF9F\\uDFE0\\uDFE1\\uDFE3]|\\uD821[\\uDC00-\\uDFF7]|\\uD823[\\uDC00-\\uDCD5\\uDD00-\\uDD08]|\\uD82B[\\uDFF0-\\uDFF3\\uDFF5-\\uDFFB\\uDFFD\\uDFFE]|\\uD82C[\\uDC00-\\uDD22\\uDD32\\uDD50-\\uDD52\\uDD55\\uDD64-\\uDD67\\uDD70-\\uDEFB]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99]|\\uD837\\uDF0A|\\uD838[\\uDD00-\\uDD2C\\uDD37-\\uDD3D\\uDD4E\\uDE90-\\uDEAD\\uDEC0-\\uDEEB]|\\uD839[\\uDCD0-\\uDCEB\\uDFE0-\\uDFE6\\uDFE8-\\uDFEB\\uDFED\\uDFEE\\uDFF0-\\uDFFE]|\\uD83A[\\uDC00-\\uDCC4\\uDD4B]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD869[\\uDC00-\\uDEDF\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF39\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1\\uDEB0-\\uDFFF]|\\uD87A[\\uDC00-\\uDFE0]|\\uD87E[\\uDC00-\\uDE1D]|\\uD884[\\uDC00-\\uDF4A\\uDF50-\\uDFFF]|\\uD888[\\uDC00-\\uDFAF])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$ParaSep": "([\\x85\\u2028\\u2029]|\\r|\\n)",
                "$SATerm": "(((?:[!\\?\\u0589\\u061D-\\u061F\\u06D4\\u0700-\\u0702\\u07F9\\u0837\\u0839\\u083D\\u083E\\u0964\\u0965\\u104A\\u104B\\u1362\\u1367\\u1368\\u166E\\u1735\\u1736\\u1803\\u1809\\u1944\\u1945\\u1AA8-\\u1AAB\\u1B5A\\u1B5B\\u1B5E\\u1B5F\\u1B7D\\u1B7E\\u1C3B\\u1C3C\\u1C7E\\u1C7F\\u203C\\u203D\\u2047-\\u2049\\u2E2E\\u2E3C\\u2E53\\u2E54\\u3002\\uA4FF\\uA60E\\uA60F\\uA6F3\\uA6F7\\uA876\\uA877\\uA8CE\\uA8CF\\uA92F\\uA9C8\\uA9C9\\uAA5D-\\uAA5F\\uAAF0\\uAAF1\\uABEB\\uFE56\\uFE57\\uFF01\\uFF1F\\uFF61]|\\uD802[\\uDE56\\uDE57]|\\uD803[\\uDF55-\\uDF59\\uDF86-\\uDF89]|\\uD804[\\uDC47\\uDC48\\uDCBE-\\uDCC1\\uDD41-\\uDD43\\uDDC5\\uDDC6\\uDDCD\\uDDDE\\uDDDF\\uDE38\\uDE39\\uDE3B\\uDE3C\\uDEA9]|\\uD805[\\uDC4B\\uDC4C\\uDDC2\\uDDC3\\uDDC9-\\uDDD7\\uDE41\\uDE42\\uDF3C-\\uDF3E]|\\uD806[\\uDD44\\uDD46\\uDE42\\uDE43\\uDE9B\\uDE9C]|\\uD807[\\uDC41\\uDC42\\uDEF7\\uDEF8\\uDF43\\uDF44]|\\uD81A[\\uDE6E\\uDE6F\\uDEF5\\uDF37\\uDF38\\uDF44]|\\uD81B\\uDE98|\\uD82F\\uDC9F|\\uD836\\uDE88)(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)|([\\.\\u2024\\uFE52\\uFF0E](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*))",
                "$SContinue": "([,\\x2D:\\u055D\\u060C\\u060D\\u07F8\\u1802\\u1808\\u2013\\u2014\\u3001\\uFE10\\uFE11\\uFE13\\uFE31\\uFE32\\uFE50\\uFE51\\uFE55\\uFE58\\uFE63\\uFF0C\\uFF0D\\uFF1A\\uFF64](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$STerm": "((?:[!\\?\\u0589\\u061D-\\u061F\\u06D4\\u0700-\\u0702\\u07F9\\u0837\\u0839\\u083D\\u083E\\u0964\\u0965\\u104A\\u104B\\u1362\\u1367\\u1368\\u166E\\u1735\\u1736\\u1803\\u1809\\u1944\\u1945\\u1AA8-\\u1AAB\\u1B5A\\u1B5B\\u1B5E\\u1B5F\\u1B7D\\u1B7E\\u1C3B\\u1C3C\\u1C7E\\u1C7F\\u203C\\u203D\\u2047-\\u2049\\u2E2E\\u2E3C\\u2E53\\u2E54\\u3002\\uA4FF\\uA60E\\uA60F\\uA6F3\\uA6F7\\uA876\\uA877\\uA8CE\\uA8CF\\uA92F\\uA9C8\\uA9C9\\uAA5D-\\uAA5F\\uAAF0\\uAAF1\\uABEB\\uFE56\\uFE57\\uFF01\\uFF1F\\uFF61]|\\uD802[\\uDE56\\uDE57]|\\uD803[\\uDF55-\\uDF59\\uDF86-\\uDF89]|\\uD804[\\uDC47\\uDC48\\uDCBE-\\uDCC1\\uDD41-\\uDD43\\uDDC5\\uDDC6\\uDDCD\\uDDDE\\uDDDF\\uDE38\\uDE39\\uDE3B\\uDE3C\\uDEA9]|\\uD805[\\uDC4B\\uDC4C\\uDDC2\\uDDC3\\uDDC9-\\uDDD7\\uDE41\\uDE42\\uDF3C-\\uDF3E]|\\uD806[\\uDD44\\uDD46\\uDE42\\uDE43\\uDE9B\\uDE9C]|\\uD807[\\uDC41\\uDC42\\uDEF7\\uDEF8\\uDF43\\uDF44]|\\uD81A[\\uDE6E\\uDE6F\\uDEF5\\uDF37\\uDF38\\uDF44]|\\uD81B\\uDE98|\\uD82F\\uDC9F|\\uD836\\uDE88)(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Sep": "[\\x85\\u2028\\u2029]",
                "$Sp": "([\\t\\x0B\\f \\xA0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Upper": "((?:[A-Z\\xC0-\\xD6\\xD8-\\xDE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178\\u0179\\u017B\\u017D\\u0181\\u0182\\u0184\\u0186\\u0187\\u0189-\\u018B\\u018E-\\u0191\\u0193\\u0194\\u0196-\\u0198\\u019C\\u019D\\u019F\\u01A0\\u01A2\\u01A4\\u01A6\\u01A7\\u01A9\\u01AC\\u01AE\\u01AF\\u01B1-\\u01B3\\u01B5\\u01B7\\u01B8\\u01BC\\u01C4\\u01C5\\u01C7\\u01C8\\u01CA\\u01CB\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F2\\u01F4\\u01F6-\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A\\u023B\\u023D\\u023E\\u0241\\u0243-\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E\\u038F\\u0391-\\u03A1\\u03A3-\\u03AB\\u03CF\\u03D2-\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9\\u03FA\\u03FD-\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0\\u04B2\\u04B4\\u04B6\\u04B8\\u04BA\\u04BC\\u04BE\\u04C0\\u04C1\\u04C3\\u04C5\\u04C7\\u04C9\\u04CB\\u04CD\\u04D0\\u04D2\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0524\\u0526\\u0528\\u052A\\u052C\\u052E\\u0531-\\u0556\\u10A0-\\u10C5\\u10C7\\u10CD\\u13A0-\\u13F5\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08-\\u1F0F\\u1F18-\\u1F1D\\u1F28-\\u1F2F\\u1F38-\\u1F3F\\u1F48-\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68-\\u1F6F\\u1F88-\\u1F8F\\u1F98-\\u1F9F\\u1FA8-\\u1FAF\\u1FB8-\\u1FBC\\u1FC8-\\u1FCC\\u1FD8-\\u1FDB\\u1FE8-\\u1FEC\\u1FF8-\\u1FFC\\u2102\\u2107\\u210B-\\u210D\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u2130-\\u2133\\u213E\\u213F\\u2145\\u2160-\\u216F\\u2183\\u24B6-\\u24CF\\u2C00-\\u2C2F\\u2C60\\u2C62-\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D-\\u2C70\\u2C72\\u2C75\\u2C7E-\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\u2CEB\\u2CED\\u2CF2\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA660\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA698\\uA69A\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uA78D\\uA790\\uA792\\uA796\\uA798\\uA79A\\uA79C\\uA79E\\uA7A0\\uA7A2\\uA7A4\\uA7A6\\uA7A8\\uA7AA-\\uA7AE\\uA7B0-\\uA7B4\\uA7B6\\uA7B8\\uA7BA\\uA7BC\\uA7BE\\uA7C0\\uA7C2\\uA7C4-\\uA7C7\\uA7C9\\uA7D0\\uA7D6\\uA7D8\\uA7F5\\uFF21-\\uFF3A]|\\uD801[\\uDC00-\\uDC27\\uDCB0-\\uDCD3\\uDD70-\\uDD7A\\uDD7C-\\uDD8A\\uDD8C-\\uDD92\\uDD94\\uDD95]|\\uD803[\\uDC80-\\uDCB2]|\\uD806[\\uDCA0-\\uDCBF]|\\uD81B[\\uDE40-\\uDE5F]|\\uD835[\\uDC00-\\uDC19\\uDC34-\\uDC4D\\uDC68-\\uDC81\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB5\\uDCD0-\\uDCE9\\uDD04\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD38\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD6C-\\uDD85\\uDDA0-\\uDDB9\\uDDD4-\\uDDED\\uDE08-\\uDE21\\uDE3C-\\uDE55\\uDE70-\\uDE89\\uDEA8-\\uDEC0\\uDEE2-\\uDEFA\\uDF1C-\\uDF34\\uDF56-\\uDF6E\\uDF90-\\uDFA8\\uDFCA]|\\uD83A[\\uDD00-\\uDD21]|\\uD83C[\\uDD30-\\uDD49\\uDD50-\\uDD69\\uDD70-\\uDD89])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)"
            }
        },
        "word": {
            "segmentRules": {
                "10": {
                    "after": "$AHLetter",
                    "before": "$Numeric",
                    "breaks": false
                },
                "11": {
                    "after": "$Numeric",
                    "before": "$Numeric($MidNum|$MidNumLetQ)",
                    "breaks": false
                },
                "12": {
                    "after": "($MidNum|$MidNumLetQ)$Numeric",
                    "before": "$Numeric",
                    "breaks": false
                },
                "13": {
                    "after": "$Katakana",
                    "before": "$Katakana",
                    "breaks": false
                },
                "13.1": {
                    "after": "$ExtendNumLet",
                    "before": "($AHLetter|$Numeric|$Katakana|$ExtendNumLet)",
                    "breaks": false
                },
                "13.2": {
                    "after": "($AHLetter|$Numeric|$Katakana)",
                    "before": "$ExtendNumLet",
                    "breaks": false
                },
                "15": {
                    "after": "$RI",
                    "before": "^($RI$RI)*$RI",
                    "breaks": false
                },
                "16": {
                    "after": "$RI",
                    "before": "[^\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB\\uDDFD\\uDEE0\\uDF76-\\uDF7A\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42\\uDC30-\\uDC40\\uDC47-\\uDC55\\uDEF0-\\uDEF4\\uDF30-\\uDF36\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1\\uDC9D\\uDC9E\\uDCA0-\\uDCA3\\uDF00-\\uDF2D\\uDF30-\\uDF46\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF\\uDCEC-\\uDCEF\\uDCD0-\\uDCD6\\uDD44-\\uDD4A\\uDDE6-\\uDDFF\\uDFFB-\\uDFFF\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF]($RI$RI)*$RI",
                    "breaks": false
                },
                "3": {
                    "after": "$LF",
                    "before": "$CR",
                    "breaks": false
                },
                "3.1": {
                    "before": "($Newline|$CR|$LF)",
                    "breaks": true
                },
                "3.2": {
                    "after": "($Newline|$CR|$LF)",
                    "breaks": true
                },
                "3.3": {
                    "after": "$ExtPict",
                    "before": "$ZWJ",
                    "breaks": false
                },
                "3.4": {
                    "after": "$WSegSpace",
                    "before": "$WSegSpace",
                    "breaks": false
                },
                "4": {
                    "after": "(?:$Format|$Extend|$ZWJ)",
                    "before": "$NotBreak_",
                    "breaks": false
                },
                "5": {
                    "after": "$AHLetter",
                    "before": "$AHLetter",
                    "breaks": false
                },
                "6": {
                    "after": "($MidLetter|$MidNumLetQ)$AHLetter",
                    "before": "$AHLetter",
                    "breaks": false
                },
                "7": {
                    "after": "$AHLetter",
                    "before": "$AHLetter($MidLetter|$MidNumLetQ)",
                    "breaks": false
                },
                "7.1": {
                    "after": "$Single_Quote",
                    "before": "$Hebrew_Letter",
                    "breaks": false
                },
                "7.2": {
                    "after": "$Double_Quote$Hebrew_Letter",
                    "before": "$Hebrew_Letter",
                    "breaks": false
                },
                "7.3": {
                    "after": "$Hebrew_Letter",
                    "before": "$Hebrew_Letter$Double_Quote",
                    "breaks": false
                },
                "8": {
                    "after": "$Numeric",
                    "before": "$Numeric",
                    "breaks": false
                },
                "9": {
                    "after": "$Numeric",
                    "before": "$AHLetter",
                    "breaks": false
                }
            },
            "suppressions": [],
            "variables": {
                "$AHLetter": "(((?:[A-Za-z\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02D7\\u02DE-\\u02FF\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559-\\u055C\\u055E\\u0560-\\u0588\\u058A\\u05F3\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u0860-\\u086A\\u0870-\\u0887\\u0889-\\u088E\\u08A0-\\u08C9\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u09FC\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0AF9\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58-\\u0C5A\\u0C5D\\u0C60\\u0C61\\u0C80\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D04-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D54-\\u0D56\\u0D5F-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F5\\u13F8-\\u13FD\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u1711\\u171F-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1820-\\u1878\\u1880-\\u1884\\u1887-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1A00-\\u1A16\\u1B05-\\u1B33\\u1B45-\\u1B4C\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1C80-\\u1C88\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u1CE9-\\u1CEC\\u1CEE-\\u1CF3\\u1CF5\\u1CF6\\u1CFA\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u24B6-\\u24E9\\u2C00-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005\\u303B\\u303C\\u3105-\\u312F\\u3131-\\u318E\\u31A0-\\u31BF\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA708-\\uA7CA\\uA7D0\\uA7D1\\uA7D3\\uA7D5-\\uA7D9\\uA7F2-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA8FD\\uA8FE\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB69\\uAB70-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB50-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDF00-\\uDF1F\\uDF2D-\\uDF4A\\uDF50-\\uDF75\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC00-\\uDC9D\\uDCB0-\\uDCD3\\uDCD8-\\uDCFB\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDD70-\\uDD7A\\uDD7C-\\uDD8A\\uDD8C-\\uDD92\\uDD94\\uDD95\\uDD97-\\uDDA1\\uDDA3-\\uDDB1\\uDDB3-\\uDDB9\\uDDBB\\uDDBC\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67\\uDF80-\\uDF85\\uDF87-\\uDFB0\\uDFB2-\\uDFBA]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00\\uDE10-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE35\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE4\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDC80-\\uDCB2\\uDCC0-\\uDCF2\\uDD00-\\uDD23\\uDE80-\\uDEA9\\uDEB0\\uDEB1\\uDF00-\\uDF1C\\uDF27\\uDF30-\\uDF45\\uDF70-\\uDF81\\uDFB0-\\uDFC4\\uDFE0-\\uDFF6]|\\uD804[\\uDC03-\\uDC37\\uDC71\\uDC72\\uDC75\\uDC83-\\uDCAF\\uDCD0-\\uDCE8\\uDD03-\\uDD26\\uDD44\\uDD47\\uDD50-\\uDD72\\uDD76\\uDD83-\\uDDB2\\uDDC1-\\uDDC4\\uDDDA\\uDDDC\\uDE00-\\uDE11\\uDE13-\\uDE2B\\uDE3F\\uDE40\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA8\\uDEB0-\\uDEDE\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3D\\uDF50\\uDF5D-\\uDF61]|\\uD805[\\uDC00-\\uDC34\\uDC47-\\uDC4A\\uDC5F-\\uDC61\\uDC80-\\uDCAF\\uDCC4\\uDCC5\\uDCC7\\uDD80-\\uDDAE\\uDDD8-\\uDDDB\\uDE00-\\uDE2F\\uDE44\\uDE80-\\uDEAA\\uDEB8]|\\uD806[\\uDC00-\\uDC2B\\uDCA0-\\uDCDF\\uDCFF-\\uDD06\\uDD09\\uDD0C-\\uDD13\\uDD15\\uDD16\\uDD18-\\uDD2F\\uDD3F\\uDD41\\uDDA0-\\uDDA7\\uDDAA-\\uDDD0\\uDDE1\\uDDE3\\uDE00\\uDE0B-\\uDE32\\uDE3A\\uDE50\\uDE5C-\\uDE89\\uDE9D\\uDEB0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC2E\\uDC40\\uDC72-\\uDC8F\\uDD00-\\uDD06\\uDD08\\uDD09\\uDD0B-\\uDD30\\uDD46\\uDD60-\\uDD65\\uDD67\\uDD68\\uDD6A-\\uDD89\\uDD98\\uDEE0-\\uDEF2\\uDF02\\uDF04-\\uDF10\\uDF12-\\uDF33\\uDFB0]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|\\uD80B[\\uDF90-\\uDFF0]|\\uD80C[\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2F\\uDC41-\\uDC46]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDE70-\\uDEBE\\uDED0-\\uDEED\\uDF00-\\uDF2F\\uDF40-\\uDF43\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDE40-\\uDE7F\\uDF00-\\uDF4A\\uDF50\\uDF93-\\uDF9F\\uDFE0\\uDFE1\\uDFE3]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99]|\\uD835[\\uDC00-\\uDC54\\uDC56-\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD1E-\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD52-\\uDEA5\\uDEA8-\\uDEC0\\uDEC2-\\uDEDA\\uDEDC-\\uDEFA\\uDEFC-\\uDF14\\uDF16-\\uDF34\\uDF36-\\uDF4E\\uDF50-\\uDF6E\\uDF70-\\uDF88\\uDF8A-\\uDFA8\\uDFAA-\\uDFC2\\uDFC4-\\uDFCB]|\\uD837[\\uDF00-\\uDF1E\\uDF25-\\uDF2A]|\\uD838[\\uDC30-\\uDC6D\\uDD00-\\uDD2C\\uDD37-\\uDD3D\\uDD4E\\uDE90-\\uDEAD\\uDEC0-\\uDEEB]|\\uD839[\\uDCD0-\\uDCEB\\uDFE0-\\uDFE6\\uDFE8-\\uDFEB\\uDFED\\uDFEE\\uDFF0-\\uDFFE]|\\uD83A[\\uDC00-\\uDCC4\\uDD00-\\uDD43\\uDD4B]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD83C[\\uDD30-\\uDD49\\uDD50-\\uDD69\\uDD70-\\uDD89])|[\\u05D0-\\u05EA\\u05EF-\\u05F2\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFB4F])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$ALetter": "((?:[A-Za-z\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02D7\\u02DE-\\u02FF\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559-\\u055C\\u055E\\u0560-\\u0588\\u058A\\u05F3\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u0860-\\u086A\\u0870-\\u0887\\u0889-\\u088E\\u08A0-\\u08C9\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u09FC\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0AF9\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58-\\u0C5A\\u0C5D\\u0C60\\u0C61\\u0C80\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D04-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D54-\\u0D56\\u0D5F-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F5\\u13F8-\\u13FD\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u1711\\u171F-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1820-\\u1878\\u1880-\\u1884\\u1887-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1A00-\\u1A16\\u1B05-\\u1B33\\u1B45-\\u1B4C\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1C80-\\u1C88\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u1CE9-\\u1CEC\\u1CEE-\\u1CF3\\u1CF5\\u1CF6\\u1CFA\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u24B6-\\u24E9\\u2C00-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005\\u303B\\u303C\\u3105-\\u312F\\u3131-\\u318E\\u31A0-\\u31BF\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA708-\\uA7CA\\uA7D0\\uA7D1\\uA7D3\\uA7D5-\\uA7D9\\uA7F2-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA8FD\\uA8FE\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB69\\uAB70-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB50-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDF00-\\uDF1F\\uDF2D-\\uDF4A\\uDF50-\\uDF75\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC00-\\uDC9D\\uDCB0-\\uDCD3\\uDCD8-\\uDCFB\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDD70-\\uDD7A\\uDD7C-\\uDD8A\\uDD8C-\\uDD92\\uDD94\\uDD95\\uDD97-\\uDDA1\\uDDA3-\\uDDB1\\uDDB3-\\uDDB9\\uDDBB\\uDDBC\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67\\uDF80-\\uDF85\\uDF87-\\uDFB0\\uDFB2-\\uDFBA]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00\\uDE10-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE35\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE4\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDC80-\\uDCB2\\uDCC0-\\uDCF2\\uDD00-\\uDD23\\uDE80-\\uDEA9\\uDEB0\\uDEB1\\uDF00-\\uDF1C\\uDF27\\uDF30-\\uDF45\\uDF70-\\uDF81\\uDFB0-\\uDFC4\\uDFE0-\\uDFF6]|\\uD804[\\uDC03-\\uDC37\\uDC71\\uDC72\\uDC75\\uDC83-\\uDCAF\\uDCD0-\\uDCE8\\uDD03-\\uDD26\\uDD44\\uDD47\\uDD50-\\uDD72\\uDD76\\uDD83-\\uDDB2\\uDDC1-\\uDDC4\\uDDDA\\uDDDC\\uDE00-\\uDE11\\uDE13-\\uDE2B\\uDE3F\\uDE40\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA8\\uDEB0-\\uDEDE\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3D\\uDF50\\uDF5D-\\uDF61]|\\uD805[\\uDC00-\\uDC34\\uDC47-\\uDC4A\\uDC5F-\\uDC61\\uDC80-\\uDCAF\\uDCC4\\uDCC5\\uDCC7\\uDD80-\\uDDAE\\uDDD8-\\uDDDB\\uDE00-\\uDE2F\\uDE44\\uDE80-\\uDEAA\\uDEB8]|\\uD806[\\uDC00-\\uDC2B\\uDCA0-\\uDCDF\\uDCFF-\\uDD06\\uDD09\\uDD0C-\\uDD13\\uDD15\\uDD16\\uDD18-\\uDD2F\\uDD3F\\uDD41\\uDDA0-\\uDDA7\\uDDAA-\\uDDD0\\uDDE1\\uDDE3\\uDE00\\uDE0B-\\uDE32\\uDE3A\\uDE50\\uDE5C-\\uDE89\\uDE9D\\uDEB0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC2E\\uDC40\\uDC72-\\uDC8F\\uDD00-\\uDD06\\uDD08\\uDD09\\uDD0B-\\uDD30\\uDD46\\uDD60-\\uDD65\\uDD67\\uDD68\\uDD6A-\\uDD89\\uDD98\\uDEE0-\\uDEF2\\uDF02\\uDF04-\\uDF10\\uDF12-\\uDF33\\uDFB0]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|\\uD80B[\\uDF90-\\uDFF0]|\\uD80C[\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2F\\uDC41-\\uDC46]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDE70-\\uDEBE\\uDED0-\\uDEED\\uDF00-\\uDF2F\\uDF40-\\uDF43\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDE40-\\uDE7F\\uDF00-\\uDF4A\\uDF50\\uDF93-\\uDF9F\\uDFE0\\uDFE1\\uDFE3]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99]|\\uD835[\\uDC00-\\uDC54\\uDC56-\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD1E-\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD52-\\uDEA5\\uDEA8-\\uDEC0\\uDEC2-\\uDEDA\\uDEDC-\\uDEFA\\uDEFC-\\uDF14\\uDF16-\\uDF34\\uDF36-\\uDF4E\\uDF50-\\uDF6E\\uDF70-\\uDF88\\uDF8A-\\uDFA8\\uDFAA-\\uDFC2\\uDFC4-\\uDFCB]|\\uD837[\\uDF00-\\uDF1E\\uDF25-\\uDF2A]|\\uD838[\\uDC30-\\uDC6D\\uDD00-\\uDD2C\\uDD37-\\uDD3D\\uDD4E\\uDE90-\\uDEAD\\uDEC0-\\uDEEB]|\\uD839[\\uDCD0-\\uDCEB\\uDFE0-\\uDFE6\\uDFE8-\\uDFEB\\uDFED\\uDFEE\\uDFF0-\\uDFFE]|\\uD83A[\\uDC00-\\uDCC4\\uDD00-\\uDD43\\uDD4B]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD83C[\\uDD30-\\uDD49\\uDD50-\\uDD69\\uDD70-\\uDD89])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$CR": "\\r",
                "$Double_Quote": "(\"(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$ExtPict": "(?:[\\xA9\\xAE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u2199\\u21A9\\u21AA\\u231A\\u231B\\u2328\\u2388\\u23CF\\u23E9-\\u23F3\\u23F8-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u2605\\u2607-\\u2612\\u2614-\\u2685\\u2690-\\u2705\\u2708-\\u2712\\u2714\\u2716\\u271D\\u2721\\u2728\\u2733\\u2734\\u2744\\u2747\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2763-\\u2767\\u2795-\\u2797\\u27A1\\u27B0\\u27BF\\u2934\\u2935\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55\\u3030\\u303D\\u3297\\u3299]|\\uD83C[\\uDC00-\\uDCFF\\uDD0D-\\uDD0F\\uDD2F\\uDD6C-\\uDD71\\uDD7E\\uDD7F\\uDD8E\\uDD91-\\uDD9A\\uDDAD-\\uDDE5\\uDE01-\\uDE0F\\uDE1A\\uDE2F\\uDE32-\\uDE3A\\uDE3C-\\uDE3F\\uDE49-\\uDFFA]|\\uD83D[\\uDC00-\\uDD3D\\uDD46-\\uDE4F\\uDE80-\\uDEFF\\uDF74-\\uDF7F\\uDFD5-\\uDFFF]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE-\\uDCFF\\uDD0C-\\uDD3A\\uDD3C-\\uDD45\\uDD47-\\uDEFF]|\\uD83F[\\uDC00-\\uDFFD])",
                "$Extend": "(?:[\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0898-\\u089F\\u08CA-\\u08E1\\u08E3-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180D\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFF9E\\uFF9F]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCC2\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD72\\uDD7B-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC20-\\uDC7F\\uDD00-\\uDDEF])",
                "$ExtendNumLet": "([_\\u202F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$FE": "(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])",
                "$Format": "(?:[\\xAD\\u0600-\\u0605\\u061C\\u06DD\\u070F\\u0890\\u0891\\u08E2\\u180E\\u200E\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF\\uFFF9-\\uFFFB]|\\uD804[\\uDCBD\\uDCCD]|\\uD80D[\\uDC30-\\uDC3F]|\\uD82F[\\uDCA0-\\uDCA3]|\\uD834[\\uDD73-\\uDD7A]|\\uDB40\\uDC01)",
                "$Hebrew_Letter": "([\\u05D0-\\u05EA\\u05EF-\\u05F2\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFB4F](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Katakana": "((?:[\\u3031-\\u3035\\u309B\\u309C\\u30A0-\\u30FA\\u30FC-\\u30FF\\u31F0-\\u31FF\\u32D0-\\u32FE\\u3300-\\u3357\\uFF66-\\uFF9D]|\\uD82B[\\uDFF0-\\uDFF3\\uDFF5-\\uDFFB\\uDFFD\\uDFFE]|\\uD82C[\\uDC00\\uDD20-\\uDD22\\uDD55\\uDD64-\\uDD67])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$LF": "\\n",
                "$MidLetter": "([\\xB7\\u0387\\u055F\\u05F4\\u2027\\uFE13](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$MidNum": "([,;\\u037E\\u0589\\u060C\\u060D\\u066C\\u07F8\\u2044\\uFE10\\uFE14\\uFE50\\uFE54\\uFF0C\\uFF1B](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$MidNumLet": "([\\.\\u2018\\u2019\\u2024\\uFE52\\uFF07\\uFF0E](?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$MidNumLetQ": "(([\\.\\u2018\\u2019\\u2024\\uFE52\\uFF07\\uFF0E]|')(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Newline": "[\\x0B\\f\\x85\\u2028\\u2029]",
                "$NotBreak_": "(?:(?![\\n-\\r\\x85\\u2028\\u2029])[\\s\\S])",
                "$Numeric": "((?:[0-9\\u0660-\\u0669\\u066B\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]|\\uD801[\\uDCA0-\\uDCA9]|\\uD803[\\uDD30-\\uDD39]|\\uD804[\\uDC66-\\uDC6F\\uDCF0-\\uDCF9\\uDD36-\\uDD3F\\uDDD0-\\uDDD9\\uDEF0-\\uDEF9]|\\uD805[\\uDC50-\\uDC59\\uDCD0-\\uDCD9\\uDE50-\\uDE59\\uDEC0-\\uDEC9\\uDF30-\\uDF39]|\\uD806[\\uDCE0-\\uDCE9\\uDD50-\\uDD59]|\\uD807[\\uDC50-\\uDC59\\uDD50-\\uDD59\\uDDA0-\\uDDA9\\uDF50-\\uDF59]|\\uD81A[\\uDE60-\\uDE69\\uDEC0-\\uDEC9\\uDF50-\\uDF59]|\\uD835[\\uDFCE-\\uDFFF]|\\uD838[\\uDD40-\\uDD49\\uDEF0-\\uDEF9]|\\uD839[\\uDCF0-\\uDCF9]|\\uD83A[\\uDD50-\\uDD59]|\\uD83E[\\uDFF0-\\uDFF9])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$RI": "((?:\\uD83C[\\uDDE6-\\uDDFF])(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$Single_Quote": "('(?:[\\xAD\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0600-\\u0605\\u0610-\\u061A\\u061C\\u064B-\\u065F\\u0670\\u06D6-\\u06DD\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u070F\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u07FD\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u0890\\u0891\\u0898-\\u089F\\u08CA-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u09FE\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0AFA-\\u0AFF\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C00-\\u0C04\\u0C3C\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C81-\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0CF3\\u0D00-\\u0D03\\u0D3B\\u0D3C\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D81-\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECE\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1715\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180F\\u1885\\u1886\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1AB0-\\u1ACE\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF4\\u1CF7-\\u1CF9\\u1DC0-\\u1DFF\\u200C-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\u20D0-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F-\\uA672\\uA674-\\uA67D\\uA69E\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA82C\\uA880\\uA881\\uA8B4-\\uA8C5\\uA8E0-\\uA8F1\\uA8FF\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uA9E5\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B-\\uAA7D\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFEFF\\uFF9E\\uFF9F\\uFFF9-\\uFFFB]|\\uD800[\\uDDFD\\uDEE0\\uDF76-\\uDF7A]|\\uD802[\\uDE01-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE0F\\uDE38-\\uDE3A\\uDE3F\\uDEE5\\uDEE6]|\\uD803[\\uDD24-\\uDD27\\uDEAB\\uDEAC\\uDEFD-\\uDEFF\\uDF46-\\uDF50\\uDF82-\\uDF85]|\\uD804[\\uDC00-\\uDC02\\uDC38-\\uDC46\\uDC70\\uDC73\\uDC74\\uDC7F-\\uDC82\\uDCB0-\\uDCBA\\uDCBD\\uDCC2\\uDCCD\\uDD00-\\uDD02\\uDD27-\\uDD34\\uDD45\\uDD46\\uDD73\\uDD80-\\uDD82\\uDDB3-\\uDDC0\\uDDC9-\\uDDCC\\uDDCE\\uDDCF\\uDE2C-\\uDE37\\uDE3E\\uDE41\\uDEDF-\\uDEEA\\uDF00-\\uDF03\\uDF3B\\uDF3C\\uDF3E-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF57\\uDF62\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC35-\\uDC46\\uDC5E\\uDCB0-\\uDCC3\\uDDAF-\\uDDB5\\uDDB8-\\uDDC0\\uDDDC\\uDDDD\\uDE30-\\uDE40\\uDEAB-\\uDEB7\\uDF1D-\\uDF2B]|\\uD806[\\uDC2C-\\uDC3A\\uDD30-\\uDD35\\uDD37\\uDD38\\uDD3B-\\uDD3E\\uDD40\\uDD42\\uDD43\\uDDD1-\\uDDD7\\uDDDA-\\uDDE0\\uDDE4\\uDE01-\\uDE0A\\uDE33-\\uDE39\\uDE3B-\\uDE3E\\uDE47\\uDE51-\\uDE5B\\uDE8A-\\uDE99]|\\uD807[\\uDC2F-\\uDC36\\uDC38-\\uDC3F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6\\uDD31-\\uDD36\\uDD3A\\uDD3C\\uDD3D\\uDD3F-\\uDD45\\uDD47\\uDD8A-\\uDD8E\\uDD90\\uDD91\\uDD93-\\uDD97\\uDEF3-\\uDEF6\\uDF00\\uDF01\\uDF03\\uDF34-\\uDF3A\\uDF3E-\\uDF42]|\\uD80D[\\uDC30-\\uDC40\\uDC47-\\uDC55]|\\uD81A[\\uDEF0-\\uDEF4\\uDF30-\\uDF36]|\\uD81B[\\uDF4F\\uDF51-\\uDF87\\uDF8F-\\uDF92\\uDFE4\\uDFF0\\uDFF1]|\\uD82F[\\uDC9D\\uDC9E\\uDCA0-\\uDCA3]|\\uD833[\\uDF00-\\uDF2D\\uDF30-\\uDF46]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A\\uDC8F\\uDD30-\\uDD36\\uDEAE\\uDEEC-\\uDEEF]|\\uD839[\\uDCEC-\\uDCEF]|\\uD83A[\\uDCD0-\\uDCD6\\uDD44-\\uDD4A]|\\uD83C[\\uDFFB-\\uDFFF]|\\uDB40[\\uDC01\\uDC20-\\uDC7F\\uDD00-\\uDDEF])*)",
                "$WSegSpace": "[ \\u1680\\u2000-\\u2006\\u2008-\\u200A\\u205F\\u3000]",
                "$ZWJ": "\\u200D"
            }
        }
    },
    "ru": {
        "sentence": {
            "segmentRules": {},
            "suppressions": [
                "руб.",
                "янв.",
                "до н. э.",
                "сент.",
                "тел.",
                "дек.",
                "февр.",
                "нояб.",
                "апр.",
                "н. э.",
                "окт.",
                "тыс.",
                "авг.",
                "проф.",
                "н.э.",
                "кв.",
                "ул.",
                "отд."
            ],
            "variables": {}
        }
    },
    "zh": {}
};


/***/ }),

/***/ "./node_modules/@formatjs/intl-segmenter/src/segmentation-utils.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@formatjs/intl-segmenter/src/segmentation-utils.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isSurrogate = exports.replaceVariables = void 0;
var replaceVariables = function (variables, input) {
    var findVarRegex = /\$[A-Za-z0-9_]+/gm;
    return input.replaceAll(findVarRegex, function (match) {
        if (!(match in variables)) {
            throw new Error("No such variable ".concat(match));
        }
        return variables[match];
    });
};
exports.replaceVariables = replaceVariables;
var isSurrogate = function (str, pos) {
    return (0xd800 <= str.charCodeAt(pos - 1) &&
        str.charCodeAt(pos - 1) <= 0xdbff &&
        0xdc00 <= str.charCodeAt(pos) &&
        str.charCodeAt(pos) <= 0xdfff);
};
exports.isSurrogate = isSurrogate;
// alternative surrogate check mimicking the java implementation
// const TRAIL_SURROGATE_BITMASK = 0xfffffc00
// const TRAIL_SURROGATE_BITS = 0xdc00
// const LEAD_SURROGATE_BITMASK = 0xfffffc00
// const LEAD_SURROGATE_BITS = 0xd800
// const isSurrogate = (text: string, position: number) => {
//   if (
//     (text.charCodeAt(position - 1) & LEAD_SURROGATE_BITMASK) ==
//       LEAD_SURROGATE_BITS &&
//     (text.charCodeAt(position) & TRAIL_SURROGATE_BITMASK) ==
//       TRAIL_SURROGATE_BITS
//   ) {
//     return true
//   } else {
//     return false
//   }
// }


/***/ }),

/***/ "./node_modules/@formatjs/intl-segmenter/src/segmenter.js":
/*!****************************************************************!*\
  !*** ./node_modules/@formatjs/intl-segmenter/src/segmenter.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Segmenter = void 0;
var tslib_1 = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.mjs");
var cldr_segmentation_rules_generated_1 = __webpack_require__(/*! ./cldr-segmentation-rules.generated */ "./node_modules/@formatjs/intl-segmenter/src/cldr-segmentation-rules.generated.js");
var segmentation_utils_1 = __webpack_require__(/*! ./segmentation-utils */ "./node_modules/@formatjs/intl-segmenter/src/segmentation-utils.js");
var ecma402_abstract_1 = __webpack_require__(/*! @formatjs/ecma402-abstract */ "./node_modules/@formatjs/ecma402-abstract/lib/index.js");
var intl_localematcher_1 = __webpack_require__(/*! @formatjs/intl-localematcher */ "./node_modules/@formatjs/intl-localematcher/lib/index.js");
/**
 * Adds $ to before rules and ^ to after rules for strickness
 * Replaces variables
 * Initializes the RegExp
 *
 * @param rule raw rule string from cldr-segmentation-rules.generated
 * @param variables
 * @param after appends ^ if true and $ if false
 * @returns
 */
var generateRuleRegex = function (rule, variables, after) {
    return new RegExp("".concat(after ? '^' : '').concat((0, segmentation_utils_1.replaceVariables)(variables, rule)).concat(after ? '' : '$'));
};
var prepareLocaleSegmentationRules = function (segmentationTypeValue) {
    var preparedRules = {};
    for (var _i = 0, _a = Object.keys(segmentationTypeValue.segmentRules); _i < _a.length; _i++) {
        var ruleNr = _a[_i];
        var ruleValue = segmentationTypeValue.segmentRules[ruleNr];
        var preparedRule = {
            breaks: ruleValue.breaks,
        };
        if ('before' in ruleValue && ruleValue.before) {
            preparedRule.before = generateRuleRegex(ruleValue.before, segmentationTypeValue.variables, false);
        }
        if ('after' in ruleValue && ruleValue.after) {
            preparedRule.after = generateRuleRegex(ruleValue.after, segmentationTypeValue.variables, true);
        }
        preparedRules[ruleNr] = preparedRule;
    }
    return preparedRules;
};
var breaksAtResult = function (breaks, matchingRule) { return ({
    breaks: breaks,
    matchingRule: matchingRule,
}); };
var Segmenter = /** @class */ (function () {
    function Segmenter(locales, options) {
        var _newTarget = this.constructor;
        if (_newTarget === undefined) {
            throw TypeError("Constructor Intl.Segmenter requires 'new'");
        }
        var requestedLocales = (0, ecma402_abstract_1.CanonicalizeLocaleList)(locales);
        options = (0, ecma402_abstract_1.GetOptionsObject)(options);
        var opt = Object.create(null);
        var matcher = (0, ecma402_abstract_1.GetOption)(options, 'localeMatcher', 'string', ['lookup', 'best fit'], 'best fit');
        opt.localeMatcher = matcher;
        var granularity = (0, ecma402_abstract_1.GetOption)(options, 'granularity', 'string', ['word', 'sentence', 'grapheme'], 'grapheme');
        setSlot(this, 'granularity', granularity);
        //TODO: figure out correct availible locales
        var r = (0, intl_localematcher_1.ResolveLocale)(Segmenter.availableLocales, //availible locales
        requestedLocales, opt, [], // there is no relevantExtensionKeys
        {}, function () { return ''; } //use only root rules
        );
        setSlot(this, 'locale', r.locale);
        //root rules based on granularity
        this.mergedSegmentationTypeValue = cldr_segmentation_rules_generated_1.SegmentationRules.root[granularity];
        //merge root rules with locale ones if locale is specified
        if (r.locale.length) {
            var localeOverrides = cldr_segmentation_rules_generated_1.SegmentationRules[r.locale];
            if (granularity in localeOverrides) {
                var localeSegmentationTypeValue = localeOverrides[granularity];
                this.mergedSegmentationTypeValue.variables = tslib_1.__assign(tslib_1.__assign({}, this.mergedSegmentationTypeValue.variables), localeSegmentationTypeValue.variables);
                this.mergedSegmentationTypeValue.segmentRules = tslib_1.__assign(tslib_1.__assign({}, this.mergedSegmentationTypeValue.segmentRules), localeSegmentationTypeValue.segmentRules);
                this.mergedSegmentationTypeValue.suppressions = tslib_1.__spreadArray(tslib_1.__spreadArray([], this.mergedSegmentationTypeValue.suppressions, true), localeSegmentationTypeValue.suppressions, true);
            }
        }
        //prepare rules
        this.rules = prepareLocaleSegmentationRules(this.mergedSegmentationTypeValue);
        //order rule keys
        this.ruleSortedKeys = Object.keys(this.rules).sort(function (a, b) { return Number(a) - Number(b); });
    }
    Segmenter.prototype.breaksAt = function (position, input) {
        var ruleSortedKeys = this.ruleSortedKeys;
        var rules = this.rules;
        var mergedSegmentationTypeValue = this.mergedSegmentationTypeValue;
        //artificial rule 0.2
        if (position === 0) {
            return breaksAtResult(true, '0.2');
        }
        if (position === input.length) {
            //rule 0.3
            return breaksAtResult(true, '0.3');
        }
        //artificial rule 0.1: js specific, due to es5 regex not being unicode aware
        //number 0.1 chosen to mimic java implementation, but needs to execute after 0.2 and 0.3 to be inside the string bounds
        if ((0, segmentation_utils_1.isSurrogate)(input, position)) {
            return breaksAtResult(false, '0.1');
        }
        var stringBeforeBreak = input.substring(0, position);
        var stringAfterBreak = input.substring(position);
        //artificial rule 0.4: handle suppressions
        if ('suppressions' in mergedSegmentationTypeValue) {
            for (var _i = 0, _a = mergedSegmentationTypeValue.suppressions; _i < _a.length; _i++) {
                var suppressions = _a[_i];
                if (stringBeforeBreak.trim().endsWith(suppressions)) {
                    return breaksAtResult(false, '0.4');
                }
            }
        }
        // loop through rules and find a match
        for (var _b = 0, ruleSortedKeys_1 = ruleSortedKeys; _b < ruleSortedKeys_1.length; _b++) {
            var ruleKey = ruleSortedKeys_1[_b];
            var _c = rules[ruleKey], before = _c.before, after = _c.after, breaks = _c.breaks;
            // for debugging
            // if (ruleKey === '16' && position === 4) {
            //   console.log({before, after, stringBeforeBreak, stringAfterBreak})
            // }
            if (before) {
                if (!before.test(stringBeforeBreak)) {
                    //didn't match the before part, therfore skipping
                    continue;
                }
            }
            if (after) {
                if (!after.test(stringAfterBreak)) {
                    //didn't match the after part, therfore skipping
                    continue;
                }
            }
            return breaksAtResult(breaks, ruleKey);
        }
        //artificial rule 999: if no rule matched is Any ÷ Any so return true
        return breaksAtResult(true, '999');
    };
    Segmenter.prototype.segment = function (input) {
        checkReceiver(this, 'segment');
        return new SegmentIterator(this, input);
    };
    Segmenter.prototype.resolvedOptions = function () {
        checkReceiver(this, 'resolvedOptions');
        return tslib_1.__assign({}, (0, ecma402_abstract_1.getMultiInternalSlots)(__INTERNAL_SLOT_MAP__, this, 'locale', 'granularity'));
    };
    Segmenter.supportedLocalesOf = function (locales, options) {
        return (0, ecma402_abstract_1.SupportedLocales)(Segmenter.availableLocales, (0, ecma402_abstract_1.CanonicalizeLocaleList)(locales), options);
    };
    Segmenter.availableLocales = new Set(Object.keys(cldr_segmentation_rules_generated_1.SegmentationRules).filter(function (key) { return key !== 'root'; }));
    Segmenter.polyfilled = true;
    return Segmenter;
}());
exports.Segmenter = Segmenter;
var createSegmentDataObject = function (segmenter, segment, index, input, matchingRule) {
    var returnValue = {
        segment: segment,
        index: index,
        input: input,
    };
    if (getSlot(segmenter, 'granularity') === 'word') {
        returnValue.isWordLike = matchingRule !== '3.1' && matchingRule !== '3.2';
    }
    return returnValue;
};
var SegmentIterator = /** @class */ (function () {
    function SegmentIterator(segmenter, input) {
        this.segmenter = segmenter;
        this.lastSegmentIndex = 0;
        if (typeof input == 'symbol') {
            throw TypeError("Input must not be a symbol");
        }
        this.input = String(input);
    }
    SegmentIterator.prototype[Symbol.iterator] = function () {
        return new SegmentIterator(this.segmenter, this.input);
    };
    SegmentIterator.prototype.next = function () {
        //using only the relevant bit of the string
        var checkString = this.input.substring(this.lastSegmentIndex);
        //loop from the start of the checkString, until exactly length (breaksAt returns break at pos=== lenght)
        for (var position = 1; position <= checkString.length; position++) {
            var _a = this.segmenter.breaksAt(position, checkString), breaks = _a.breaks, matchingRule = _a.matchingRule;
            if (breaks) {
                var segment = checkString.substring(0, position);
                var index = this.lastSegmentIndex;
                this.lastSegmentIndex += position;
                return {
                    done: false,
                    value: createSegmentDataObject(this.segmenter, segment, index, this.input, matchingRule),
                };
            }
        }
        //no segment was found by the loop, therefore the segmentation is done
        return { done: true, value: undefined };
    };
    SegmentIterator.prototype.containing = function (positionInput) {
        if (typeof positionInput === 'bigint') {
            throw TypeError('Index must not be a BigInt');
        }
        var position = Number(positionInput);
        //https://tc39.es/ecma262/#sec-tointegerorinfinity
        // 2. If number is NaN, +0𝔽, or -0𝔽, return 0.
        if (isNaN(position) || !position) {
            position = 0;
        }
        // 5. Let integer be floor(abs(ℝ(number))).
        // 6. If number < -0𝔽, set integer to -integer.
        position = Math.floor(Math.abs(position)) * (position < 0 ? -1 : 1);
        if (position < 0 || position >= this.input.length) {
            return undefined;
        }
        //find previous break point
        var previousBreakPoint = 0;
        if (position === 0) {
            previousBreakPoint = 0;
        }
        else {
            var checkString_1 = this.input;
            for (var cursor = position; cursor >= 0; cursor--) {
                var breaks = this.segmenter.breaksAt(cursor, checkString_1).breaks;
                if (breaks) {
                    previousBreakPoint = cursor;
                    break;
                }
            }
        }
        var checkString = this.input.substring(previousBreakPoint);
        //find next break point
        for (var cursor = 1; cursor <= checkString.length; cursor++) {
            var _a = this.segmenter.breaksAt(cursor, checkString), breaks = _a.breaks, matchingRule = _a.matchingRule;
            if (breaks) {
                var segment = checkString.substring(0, cursor);
                return createSegmentDataObject(this.segmenter, segment, previousBreakPoint, this.input, matchingRule);
            }
        }
    };
    return SegmentIterator;
}());
var __INTERNAL_SLOT_MAP__ = new WeakMap();
function getSlot(instance, key) {
    return (0, ecma402_abstract_1.getInternalSlot)(__INTERNAL_SLOT_MAP__, instance, key);
}
function setSlot(instance, key, value) {
    (0, ecma402_abstract_1.setInternalSlot)(__INTERNAL_SLOT_MAP__, instance, key, value);
}
function checkReceiver(receiver, methodName) {
    if (!(receiver instanceof Segmenter)) {
        throw TypeError("Method Intl.Segmenter.prototype.".concat(methodName, " called on incompatible receiver"));
    }
}
try {
    // IE11 does not have Symbol
    if (typeof Symbol !== 'undefined') {
        Object.defineProperty(Segmenter.prototype, Symbol.toStringTag, {
            value: 'Intl.Segmenter',
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
    //github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/length.js
    https: Object.defineProperty(Segmenter.prototype.constructor, 'length', {
        value: 0,
        writable: false,
        enumerable: false,
        configurable: true,
    });
    // https://github.com/tc39/test262/blob/main/test/intl402/Segmenter/constructor/supportedLocalesOf/length.js
    Object.defineProperty(Segmenter.supportedLocalesOf, 'length', {
        value: 1,
        writable: false,
        enumerable: false,
        configurable: true,
    });
}
catch (e) {
    // Meta fix so we're test262-compliant, not important
}


/***/ }),

/***/ "./src/access-mode.js":
/*!****************************!*\
  !*** ./src/access-mode.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AccessMode)
/* harmony export */ });

class AccessMode {
  constructor(acs) {
    if (acs) {
      this.given = typeof acs.given == 'number' ? acs.given : AccessMode.decode(acs.given);
      this.want = typeof acs.want == 'number' ? acs.want : AccessMode.decode(acs.want);
      this.mode = acs.mode ? typeof acs.mode == 'number' ? acs.mode : AccessMode.decode(acs.mode) : this.given & this.want;
    }
  }
  static #checkFlag(val, side, flag) {
    side = side || 'mode';
    if (['given', 'want', 'mode'].includes(side)) {
      return (val[side] & flag) != 0;
    }
    throw new Error(`Invalid AccessMode component '${side}'`);
  }
  static decode(str) {
    if (!str) {
      return null;
    } else if (typeof str == 'number') {
      return str & AccessMode._BITMASK;
    } else if (str === 'N' || str === 'n') {
      return AccessMode._NONE;
    }
    const bitmask = {
      'J': AccessMode._JOIN,
      'R': AccessMode._READ,
      'W': AccessMode._WRITE,
      'P': AccessMode._PRES,
      'A': AccessMode._APPROVE,
      'S': AccessMode._SHARE,
      'D': AccessMode._DELETE,
      'O': AccessMode._OWNER
    };
    let m0 = AccessMode._NONE;
    for (let i = 0; i < str.length; i++) {
      const bit = bitmask[str.charAt(i).toUpperCase()];
      if (!bit) {
        continue;
      }
      m0 |= bit;
    }
    return m0;
  }
  static encode(val) {
    if (val === null || val === AccessMode._INVALID) {
      return null;
    } else if (val === AccessMode._NONE) {
      return 'N';
    }
    const bitmask = ['J', 'R', 'W', 'P', 'A', 'S', 'D', 'O'];
    let res = '';
    for (let i = 0; i < bitmask.length; i++) {
      if ((val & 1 << i) != 0) {
        res = res + bitmask[i];
      }
    }
    return res;
  }
  static update(val, upd) {
    if (!upd || typeof upd != 'string') {
      return val;
    }
    let action = upd.charAt(0);
    if (action == '+' || action == '-') {
      let val0 = val;
      const parts = upd.split(/([-+])/);
      for (let i = 1; i < parts.length - 1; i += 2) {
        action = parts[i];
        const m0 = AccessMode.decode(parts[i + 1]);
        if (m0 == AccessMode._INVALID) {
          return val;
        }
        if (m0 == null) {
          continue;
        }
        if (action === '+') {
          val0 |= m0;
        } else if (action === '-') {
          val0 &= ~m0;
        }
      }
      val = val0;
    } else {
      const val0 = AccessMode.decode(upd);
      if (val0 != AccessMode._INVALID) {
        val = val0;
      }
    }
    return val;
  }
  static diff(a1, a2) {
    a1 = AccessMode.decode(a1);
    a2 = AccessMode.decode(a2);
    if (a1 == AccessMode._INVALID || a2 == AccessMode._INVALID) {
      return AccessMode._INVALID;
    }
    return a1 & ~a2;
  }
  toString() {
    return '{"mode": "' + AccessMode.encode(this.mode) + '", "given": "' + AccessMode.encode(this.given) + '", "want": "' + AccessMode.encode(this.want) + '"}';
  }
  jsonHelper() {
    return {
      mode: AccessMode.encode(this.mode),
      given: AccessMode.encode(this.given),
      want: AccessMode.encode(this.want)
    };
  }
  setMode(m) {
    this.mode = AccessMode.decode(m);
    return this;
  }
  updateMode(u) {
    this.mode = AccessMode.update(this.mode, u);
    return this;
  }
  getMode() {
    return AccessMode.encode(this.mode);
  }
  setGiven(g) {
    this.given = AccessMode.decode(g);
    return this;
  }
  updateGiven(u) {
    this.given = AccessMode.update(this.given, u);
    return this;
  }
  getGiven() {
    return AccessMode.encode(this.given);
  }
  setWant(w) {
    this.want = AccessMode.decode(w);
    return this;
  }
  updateWant(u) {
    this.want = AccessMode.update(this.want, u);
    return this;
  }
  getWant() {
    return AccessMode.encode(this.want);
  }
  getMissing() {
    return AccessMode.encode(this.want & ~this.given);
  }
  getExcessive() {
    return AccessMode.encode(this.given & ~this.want);
  }
  updateAll(val) {
    if (val) {
      this.updateGiven(val.given);
      this.updateWant(val.want);
      this.mode = this.given & this.want;
    }
    return this;
  }
  isOwner(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._OWNER);
  }
  isPresencer(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._PRES);
  }
  isMuted(side) {
    return !this.isPresencer(side);
  }
  isJoiner(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._JOIN);
  }
  isReader(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._READ);
  }
  isWriter(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._WRITE);
  }
  isApprover(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._APPROVE);
  }
  isAdmin(side) {
    return this.isOwner(side) || this.isApprover(side);
  }
  isSharer(side) {
    return this.isAdmin(side) || AccessMode.#checkFlag(this, side, AccessMode._SHARE);
  }
  isDeleter(side) {
    return AccessMode.#checkFlag(this, side, AccessMode._DELETE);
  }
}
AccessMode._NONE = 0x00;
AccessMode._JOIN = 0x01;
AccessMode._READ = 0x02;
AccessMode._WRITE = 0x04;
AccessMode._PRES = 0x08;
AccessMode._APPROVE = 0x10;
AccessMode._SHARE = 0x20;
AccessMode._DELETE = 0x40;
AccessMode._OWNER = 0x80;
AccessMode._BITMASK = AccessMode._JOIN | AccessMode._READ | AccessMode._WRITE | AccessMode._PRES | AccessMode._APPROVE | AccessMode._SHARE | AccessMode._DELETE | AccessMode._OWNER;
AccessMode._INVALID = 0x100000;

/***/ }),

/***/ "./src/cbuffer.js":
/*!************************!*\
  !*** ./src/cbuffer.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CBuffer)
/* harmony export */ });

class CBuffer {
  #comparator = undefined;
  #unique = false;
  buffer = [];
  constructor(compare_, unique_) {
    this.#comparator = compare_ || ((a, b) => {
      return a === b ? 0 : a < b ? -1 : 1;
    });
    this.#unique = unique_;
  }
  #findNearest(elem, arr, exact) {
    let start = 0;
    let end = arr.length - 1;
    let pivot = 0;
    let diff = 0;
    let found = false;
    while (start <= end) {
      pivot = (start + end) / 2 | 0;
      diff = this.#comparator(arr[pivot], elem);
      if (diff < 0) {
        start = pivot + 1;
      } else if (diff > 0) {
        end = pivot - 1;
      } else {
        found = true;
        break;
      }
    }
    if (found) {
      return {
        idx: pivot,
        exact: true
      };
    }
    if (exact) {
      return {
        idx: -1
      };
    }
    return {
      idx: diff < 0 ? pivot + 1 : pivot
    };
  }
  #insertSorted(elem, arr) {
    const found = this.#findNearest(elem, arr, false);
    const count = found.exact && this.#unique ? 1 : 0;
    arr.splice(found.idx, count, elem);
    return arr;
  }
  getAt(at) {
    return this.buffer[at];
  }
  getLast(at) {
    at |= 0;
    return this.buffer.length > at ? this.buffer[this.buffer.length - 1 - at] : undefined;
  }
  put() {
    let insert;
    if (arguments.length == 1 && Array.isArray(arguments[0])) {
      insert = arguments[0];
    } else {
      insert = arguments;
    }
    for (let idx in insert) {
      this.#insertSorted(insert[idx], this.buffer);
    }
  }
  delAt(at) {
    at |= 0;
    let r = this.buffer.splice(at, 1);
    if (r && r.length > 0) {
      return r[0];
    }
    return undefined;
  }
  delRange(since, before) {
    return this.buffer.splice(since, before - since);
  }
  length() {
    return this.buffer.length;
  }
  reset() {
    this.buffer = [];
  }
  forEach(callback, startIdx, beforeIdx, context) {
    startIdx = startIdx | 0;
    beforeIdx = beforeIdx || this.buffer.length;
    for (let i = startIdx; i < beforeIdx; i++) {
      callback.call(context, this.buffer[i], i > startIdx ? this.buffer[i - 1] : undefined, i < beforeIdx - 1 ? this.buffer[i + 1] : undefined, i);
    }
  }
  find(elem, nearest) {
    const {
      idx
    } = this.#findNearest(elem, this.buffer, !nearest);
    return idx;
  }
  filter(callback, context) {
    let count = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (callback.call(context, this.buffer[i], i)) {
        this.buffer[count] = this.buffer[i];
        count++;
      }
    }
    this.buffer.splice(count);
  }
  isEmpty() {
    return this.buffer.length == 0;
  }
}

/***/ }),

/***/ "./src/comm-error.js":
/*!***************************!*\
  !*** ./src/comm-error.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CommError)
/* harmony export */ });


class CommError extends Error {
  constructor(message, code) {
    super(`${message} (${code})`);
    this.name = 'CommError';
    this.code = code;
  }
}

/***/ }),

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_MESSAGES_PAGE: () => (/* binding */ DEFAULT_MESSAGES_PAGE),
/* harmony export */   DEL_CHAR: () => (/* binding */ DEL_CHAR),
/* harmony export */   EXPIRE_PROMISES_PERIOD: () => (/* binding */ EXPIRE_PROMISES_PERIOD),
/* harmony export */   EXPIRE_PROMISES_TIMEOUT: () => (/* binding */ EXPIRE_PROMISES_TIMEOUT),
/* harmony export */   LIBRARY: () => (/* binding */ LIBRARY),
/* harmony export */   LOCAL_SEQID: () => (/* binding */ LOCAL_SEQID),
/* harmony export */   MESSAGE_STATUS_FAILED: () => (/* binding */ MESSAGE_STATUS_FAILED),
/* harmony export */   MESSAGE_STATUS_FATAL: () => (/* binding */ MESSAGE_STATUS_FATAL),
/* harmony export */   MESSAGE_STATUS_NONE: () => (/* binding */ MESSAGE_STATUS_NONE),
/* harmony export */   MESSAGE_STATUS_QUEUED: () => (/* binding */ MESSAGE_STATUS_QUEUED),
/* harmony export */   MESSAGE_STATUS_READ: () => (/* binding */ MESSAGE_STATUS_READ),
/* harmony export */   MESSAGE_STATUS_RECEIVED: () => (/* binding */ MESSAGE_STATUS_RECEIVED),
/* harmony export */   MESSAGE_STATUS_SENDING: () => (/* binding */ MESSAGE_STATUS_SENDING),
/* harmony export */   MESSAGE_STATUS_SENT: () => (/* binding */ MESSAGE_STATUS_SENT),
/* harmony export */   MESSAGE_STATUS_TO_ME: () => (/* binding */ MESSAGE_STATUS_TO_ME),
/* harmony export */   PROTOCOL_VERSION: () => (/* binding */ PROTOCOL_VERSION),
/* harmony export */   RECV_TIMEOUT: () => (/* binding */ RECV_TIMEOUT),
/* harmony export */   TOPIC_CHAN: () => (/* binding */ TOPIC_CHAN),
/* harmony export */   TOPIC_FND: () => (/* binding */ TOPIC_FND),
/* harmony export */   TOPIC_GRP: () => (/* binding */ TOPIC_GRP),
/* harmony export */   TOPIC_ME: () => (/* binding */ TOPIC_ME),
/* harmony export */   TOPIC_NEW: () => (/* binding */ TOPIC_NEW),
/* harmony export */   TOPIC_NEW_CHAN: () => (/* binding */ TOPIC_NEW_CHAN),
/* harmony export */   TOPIC_P2P: () => (/* binding */ TOPIC_P2P),
/* harmony export */   TOPIC_SYS: () => (/* binding */ TOPIC_SYS),
/* harmony export */   USER_NEW: () => (/* binding */ USER_NEW),
/* harmony export */   VERSION: () => (/* binding */ VERSION)
/* harmony export */ });
/* harmony import */ var _version_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../version.js */ "./version.js");



const PROTOCOL_VERSION = '0';
const VERSION = _version_js__WEBPACK_IMPORTED_MODULE_0__.PACKAGE_VERSION || '0.21';
const LIBRARY = 'tinodejs/' + VERSION;
const TOPIC_NEW = 'new';
const TOPIC_NEW_CHAN = 'nch';
const TOPIC_ME = 'me';
const TOPIC_FND = 'fnd';
const TOPIC_SYS = 'sys';
const TOPIC_CHAN = 'chn';
const TOPIC_GRP = 'grp';
const TOPIC_P2P = 'p2p';
const USER_NEW = 'new';
const LOCAL_SEQID = 0xFFFFFFF;
const MESSAGE_STATUS_NONE = 0;
const MESSAGE_STATUS_QUEUED = 10;
const MESSAGE_STATUS_SENDING = 20;
const MESSAGE_STATUS_FAILED = 30;
const MESSAGE_STATUS_FATAL = 40;
const MESSAGE_STATUS_SENT = 50;
const MESSAGE_STATUS_RECEIVED = 60;
const MESSAGE_STATUS_READ = 70;
const MESSAGE_STATUS_TO_ME = 80;
const EXPIRE_PROMISES_TIMEOUT = 5000;
const EXPIRE_PROMISES_PERIOD = 1000;
const RECV_TIMEOUT = 100;
const DEFAULT_MESSAGES_PAGE = 24;
const DEL_CHAR = '\u2421';

/***/ }),

/***/ "./src/connection.js":
/*!***************************!*\
  !*** ./src/connection.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Connection)
/* harmony export */ });
/* harmony import */ var _comm_error_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./comm-error.js */ "./src/comm-error.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");




let WebSocketProvider;
let XHRProvider;
const NETWORK_ERROR = 503;
const NETWORK_ERROR_TEXT = "Connection failed";
const NETWORK_USER = 418;
const NETWORK_USER_TEXT = "Disconnected by client";
const _BOFF_BASE = 2000;
const _BOFF_MAX_ITER = 10;
const _BOFF_JITTER = 0.3;
function makeBaseUrl(host, protocol, version, apiKey) {
  let url = null;
  if (['http', 'https', 'ws', 'wss'].includes(protocol)) {
    url = `${protocol}://${host}`;
    if (url.charAt(url.length - 1) !== '/') {
      url += '/';
    }
    url += 'v' + version + '/channels';
    if (['http', 'https'].includes(protocol)) {
      url += '/lp';
    }
    url += '?apikey=' + apiKey;
  }
  return url;
}
class Connection {
  static #log = _ => {};
  #boffTimer = null;
  #boffIteration = 0;
  #boffClosed = false;
  #socket = null;
  host;
  secure;
  apiKey;
  version;
  autoreconnect;
  initialized;
  constructor(config, version_, autoreconnect_) {
    this.host = config.host;
    this.secure = config.secure;
    this.apiKey = config.apiKey;
    this.version = version_;
    this.autoreconnect = autoreconnect_;
    if (config.transport === 'lp') {
      this.#init_lp();
      this.initialized = 'lp';
    } else if (config.transport === 'ws') {
      this.#init_ws();
      this.initialized = 'ws';
    }
    if (!this.initialized) {
      Connection.#log("Unknown or invalid network transport. Running under Node? Call 'Tinode.setNetworkProviders()'.");
      throw new Error("Unknown or invalid network transport. Running under Node? Call 'Tinode.setNetworkProviders()'.");
    }
  }
  static setNetworkProviders(wsProvider, xhrProvider) {
    WebSocketProvider = wsProvider;
    XHRProvider = xhrProvider;
  }
  static set logger(l) {
    Connection.#log = l;
  }
  connect(host_, force) {
    return Promise.reject(null);
  }
  reconnect(force) {}
  disconnect() {}
  sendText(msg) {}
  isConnected() {
    return false;
  }
  transport() {
    return this.initialized;
  }
  probe() {
    this.sendText('1');
  }
  backoffReset() {
    this.#boffReset();
  }
  #boffReconnect() {
    clearTimeout(this.#boffTimer);
    const timeout = _BOFF_BASE * (Math.pow(2, this.#boffIteration) * (1.0 + _BOFF_JITTER * Math.random()));
    this.#boffIteration = this.#boffIteration >= _BOFF_MAX_ITER ? this.#boffIteration : this.#boffIteration + 1;
    if (this.onAutoreconnectIteration) {
      this.onAutoreconnectIteration(timeout);
    }
    this.#boffTimer = setTimeout(_ => {
      Connection.#log(`Reconnecting, iter=${this.#boffIteration}, timeout=${timeout}`);
      if (!this.#boffClosed) {
        const prom = this.connect();
        if (this.onAutoreconnectIteration) {
          this.onAutoreconnectIteration(0, prom);
        } else {
          prom.catch(_ => {});
        }
      } else if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(-1);
      }
    }, timeout);
  }
  #boffStop() {
    clearTimeout(this.#boffTimer);
    this.#boffTimer = null;
  }
  #boffReset() {
    this.#boffIteration = 0;
  }
  #init_lp() {
    const XDR_UNSENT = 0;
    const XDR_OPENED = 1;
    const XDR_HEADERS_RECEIVED = 2;
    const XDR_LOADING = 3;
    const XDR_DONE = 4;
    let _lpURL = null;
    let _poller = null;
    let _sender = null;
    let lp_sender = url_ => {
      const sender = new XHRProvider();
      sender.onreadystatechange = evt => {
        if (sender.readyState == XDR_DONE && sender.status >= 400) {
          throw new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"]("LP sender failed", sender.status);
        }
      };
      sender.open('POST', url_, true);
      return sender;
    };
    let lp_poller = (url_, resolve, reject) => {
      let poller = new XHRProvider();
      let promiseCompleted = false;
      poller.onreadystatechange = evt => {
        if (poller.readyState == XDR_DONE) {
          if (poller.status == 201) {
            let pkt = JSON.parse(poller.responseText, _utils_js__WEBPACK_IMPORTED_MODULE_1__.jsonParseHelper);
            _lpURL = url_ + '&sid=' + pkt.ctrl.params.sid;
            poller = lp_poller(_lpURL);
            poller.send(null);
            if (this.onOpen) {
              this.onOpen();
            }
            if (resolve) {
              promiseCompleted = true;
              resolve();
            }
            if (this.autoreconnect) {
              this.#boffStop();
            }
          } else if (poller.status > 0 && poller.status < 400) {
            if (this.onMessage) {
              this.onMessage(poller.responseText);
            }
            poller = lp_poller(_lpURL);
            poller.send(null);
          } else {
            if (reject && !promiseCompleted) {
              promiseCompleted = true;
              reject(poller.responseText);
            }
            if (this.onMessage && poller.responseText) {
              this.onMessage(poller.responseText);
            }
            if (this.onDisconnect) {
              const code = poller.status || (this.#boffClosed ? NETWORK_USER : NETWORK_ERROR);
              const text = poller.responseText || (this.#boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT);
              this.onDisconnect(new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"](text, code), code);
            }
            poller = null;
            if (!this.#boffClosed && this.autoreconnect) {
              this.#boffReconnect();
            }
          }
        }
      };
      poller.open('POST', url_, true);
      return poller;
    };
    this.connect = (host_, force) => {
      this.#boffClosed = false;
      if (_poller) {
        if (!force) {
          return Promise.resolve();
        }
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }
      if (host_) {
        this.host = host_;
      }
      return new Promise((resolve, reject) => {
        const url = makeBaseUrl(this.host, this.secure ? 'https' : 'http', this.version, this.apiKey);
        Connection.#log("LP connecting to:", url);
        _poller = lp_poller(url, resolve, reject);
        _poller.send(null);
      }).catch(err => {
        Connection.#log("LP connection failed:", err);
      });
    };
    this.reconnect = force => {
      this.#boffStop();
      this.connect(null, force);
    };
    this.disconnect = _ => {
      this.#boffClosed = true;
      this.#boffStop();
      if (_sender) {
        _sender.onreadystatechange = undefined;
        _sender.abort();
        _sender = null;
      }
      if (_poller) {
        _poller.onreadystatechange = undefined;
        _poller.abort();
        _poller = null;
      }
      if (this.onDisconnect) {
        this.onDisconnect(new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"](NETWORK_USER_TEXT, NETWORK_USER), NETWORK_USER);
      }
      _lpURL = null;
    };
    this.sendText = msg => {
      _sender = lp_sender(_lpURL);
      if (_sender && _sender.readyState == XDR_OPENED) {
        _sender.send(msg);
      } else {
        throw new Error("Long poller failed to connect");
      }
    };
    this.isConnected = _ => {
      return _poller && true;
    };
  }
  #init_ws() {
    this.connect = (host_, force) => {
      this.#boffClosed = false;
      if (this.#socket) {
        if (!force && this.#socket.readyState == this.#socket.OPEN) {
          return Promise.resolve();
        }
        this.#socket.close();
        this.#socket = null;
      }
      if (host_) {
        this.host = host_;
      }
      return new Promise((resolve, reject) => {
        const url = makeBaseUrl(this.host, this.secure ? 'wss' : 'ws', this.version, this.apiKey);
        Connection.#log("WS connecting to: ", url);
        const conn = new WebSocketProvider(url);
        conn.onerror = err => {
          reject(err);
        };
        conn.onopen = _ => {
          if (this.autoreconnect) {
            this.#boffStop();
          }
          if (this.onOpen) {
            this.onOpen();
          }
          resolve();
        };
        conn.onclose = _ => {
          this.#socket = null;
          if (this.onDisconnect) {
            const code = this.#boffClosed ? NETWORK_USER : NETWORK_ERROR;
            this.onDisconnect(new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"](this.#boffClosed ? NETWORK_USER_TEXT : NETWORK_ERROR_TEXT, code), code);
          }
          if (!this.#boffClosed && this.autoreconnect) {
            this.#boffReconnect();
          }
        };
        conn.onmessage = evt => {
          if (this.onMessage) {
            this.onMessage(evt.data);
          }
        };
        this.#socket = conn;
      });
    };
    this.reconnect = force => {
      this.#boffStop();
      this.connect(null, force);
    };
    this.disconnect = _ => {
      this.#boffClosed = true;
      this.#boffStop();
      if (!this.#socket) {
        return;
      }
      this.#socket.close();
      this.#socket = null;
    };
    this.sendText = msg => {
      if (this.#socket && this.#socket.readyState == this.#socket.OPEN) {
        this.#socket.send(msg);
      } else {
        throw new Error("Websocket is not connected");
      }
    };
    this.isConnected = _ => {
      return this.#socket && this.#socket.readyState == this.#socket.OPEN;
    };
  }
  onMessage = undefined;
  onDisconnect = undefined;
  onOpen = undefined;
  onAutoreconnectIteration = undefined;
}
Connection.NETWORK_ERROR = NETWORK_ERROR;
Connection.NETWORK_ERROR_TEXT = NETWORK_ERROR_TEXT;
Connection.NETWORK_USER = NETWORK_USER;
Connection.NETWORK_USER_TEXT = NETWORK_USER_TEXT;

/***/ }),

/***/ "./src/db.js":
/*!*******************!*\
  !*** ./src/db.js ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ DB)
/* harmony export */ });

const DB_VERSION = 1;
const DB_NAME = 'tinode-web';
let IDBProvider;
class DB {
  #onError = _ => {};
  #logger = _ => {};
  db = null;
  disabled = true;
  constructor(onError, logger) {
    this.#onError = onError || this.#onError;
    this.#logger = logger || this.#logger;
  }
  #mapObjects(source, callback, context) {
    if (!this.db) {
      return disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction([source]);
      trx.onerror = event => {
        this.#logger('PCache', 'mapObjects', source, event.target.error);
        reject(event.target.error);
      };
      trx.objectStore(source).getAll().onsuccess = event => {
        if (callback) {
          event.target.result.forEach(topic => {
            callback.call(context, topic);
          });
        }
        resolve(event.target.result);
      };
    });
  }
  initDatabase() {
    return new Promise((resolve, reject) => {
      const req = IDBProvider.open(DB_NAME, DB_VERSION);
      req.onsuccess = event => {
        this.db = event.target.result;
        this.disabled = false;
        resolve(this.db);
      };
      req.onerror = event => {
        this.#logger('PCache', "failed to initialize", event);
        reject(event.target.error);
        this.#onError(event.target.error);
      };
      req.onupgradeneeded = event => {
        this.db = event.target.result;
        this.db.onerror = event => {
          this.#logger('PCache', "failed to create storage", event);
          this.#onError(event.target.error);
        };
        this.db.createObjectStore('topic', {
          keyPath: 'name'
        });
        this.db.createObjectStore('user', {
          keyPath: 'uid'
        });
        this.db.createObjectStore('subscription', {
          keyPath: ['topic', 'uid']
        });
        this.db.createObjectStore('message', {
          keyPath: ['topic', 'seq']
        });
      };
    });
  }
  deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const req = IDBProvider.deleteDatabase(DB_NAME);
      req.onblocked = _ => {
        if (this.db) {
          this.db.close();
        }
        const err = new Error("blocked");
        this.#logger('PCache', 'deleteDatabase', err);
        reject(err);
      };
      req.onsuccess = _ => {
        this.db = null;
        this.disabled = true;
        resolve(true);
      };
      req.onerror = event => {
        this.#logger('PCache', 'deleteDatabase', event.target.error);
        reject(event.target.error);
      };
    });
  }
  isReady() {
    return !!this.db;
  }
  updTopic(topic) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updTopic', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('topic').get(topic.name);
      req.onsuccess = _ => {
        trx.objectStore('topic').put(DB.#serializeTopic(req.result, topic));
        trx.commit();
      };
    });
  }
  markTopicAsDeleted(name, deleted) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'markTopicAsDeleted', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('topic').get(name);
      req.onsuccess = event => {
        const topic = event.target.result;
        if (topic && topic._deleted != deleted) {
          topic._deleted = deleted;
          trx.objectStore('topic').put(topic);
        }
        trx.commit();
      };
    });
  }
  remTopic(name) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['topic', 'subscription', 'message'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remTopic', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('topic').delete(IDBKeyRange.only(name));
      trx.objectStore('subscription').delete(IDBKeyRange.bound([name, '-'], [name, '~']));
      trx.objectStore('message').delete(IDBKeyRange.bound([name, 0], [name, Number.MAX_SAFE_INTEGER]));
      trx.commit();
    });
  }
  mapTopics(callback, context) {
    return this.#mapObjects('topic', callback, context);
  }
  deserializeTopic(topic, src) {
    DB.#deserializeTopic(topic, src);
  }
  updUser(uid, pub) {
    if (arguments.length < 2 || pub === undefined) {
      return;
    }
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').put({
        uid: uid,
        public: pub
      });
      trx.commit();
    });
  }
  remUser(uid) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').delete(IDBKeyRange.only(uid));
      trx.commit();
    });
  }
  mapUsers(callback, context) {
    return this.#mapObjects('user', callback, context);
  }
  getUser(uid) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['user']);
      trx.oncomplete = event => {
        const user = event.target.result;
        resolve({
          user: user.uid,
          public: user.public
        });
      };
      trx.onerror = event => {
        this.#logger('PCache', 'getUser', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('user').get(uid);
    });
  }
  updSubscription(topicName, uid, sub) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription'], 'readwrite');
      trx.oncomplete = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updSubscription', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('subscription').get([topicName, uid]).onsuccess = event => {
        trx.objectStore('subscription').put(DB.#serializeSubscription(event.target.result, topicName, uid, sub));
        trx.commit();
      };
    });
  }
  mapSubscriptions(topicName, callback, context) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['subscription']);
      trx.onerror = event => {
        this.#logger('PCache', 'mapSubscriptions', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('subscription').getAll(IDBKeyRange.bound([topicName, '-'], [topicName, '~'])).onsuccess = event => {
        if (callback) {
          event.target.result.forEach(topic => {
            callback.call(context, topic);
          });
        }
        resolve(event.target.result);
      };
    });
  }
  addMessage(msg) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'addMessage', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('message').add(DB.#serializeMessage(null, msg));
      trx.commit();
    });
  }
  updMessageStatus(topicName, seq, status) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'updMessageStatus', event.target.error);
        reject(event.target.error);
      };
      const req = trx.objectStore('message').get(IDBKeyRange.only([topicName, seq]));
      req.onsuccess = event => {
        const src = req.result || event.target.result;
        if (!src || src._status == status) {
          trx.commit();
          return;
        }
        trx.objectStore('message').put(DB.#serializeMessage(src, {
          topic: topicName,
          seq: seq,
          _status: status
        }));
        trx.commit();
      };
    });
  }
  remMessages(topicName, from, to) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve() : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      if (!from && !to) {
        from = 0;
        to = Number.MAX_SAFE_INTEGER;
      }
      const range = to > 0 ? IDBKeyRange.bound([topicName, from], [topicName, to], false, true) : IDBKeyRange.only([topicName, from]);
      const trx = this.db.transaction(['message'], 'readwrite');
      trx.onsuccess = event => {
        resolve(event.target.result);
      };
      trx.onerror = event => {
        this.#logger('PCache', 'remMessages', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('message').delete(range);
      trx.commit();
    });
  }
  readMessages(topicName, query, callback, context) {
    if (!this.isReady()) {
      return this.disabled ? Promise.resolve([]) : Promise.reject(new Error("not initialized"));
    }
    return new Promise((resolve, reject) => {
      query = query || {};
      const since = query.since > 0 ? query.since : 0;
      const before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      const limit = query.limit | 0;
      const result = [];
      const range = IDBKeyRange.bound([topicName, since], [topicName, before], false, true);
      const trx = this.db.transaction(['message']);
      trx.onerror = event => {
        this.#logger('PCache', 'readMessages', event.target.error);
        reject(event.target.error);
      };
      trx.objectStore('message').openCursor(range, 'prev').onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (callback) {
            callback.call(context, cursor.value);
          }
          result.push(cursor.value);
          if (limit <= 0 || result.length < limit) {
            cursor.continue();
          } else {
            resolve(result);
          }
        } else {
          resolve(result);
        }
      };
    });
  }
  static #topic_fields = ['created', 'updated', 'deleted', 'read', 'recv', 'seq', 'clear', 'defacs', 'creds', 'public', 'trusted', 'private', 'touched', '_deleted'];
  static #deserializeTopic(topic, src) {
    DB.#topic_fields.forEach(f => {
      if (src.hasOwnProperty(f)) {
        topic[f] = src[f];
      }
    });
    if (Array.isArray(src.tags)) {
      topic._tags = src.tags;
    }
    if (src.acs) {
      topic.setAccessMode(src.acs);
    }
    topic.seq |= 0;
    topic.read |= 0;
    topic.unread = Math.max(0, topic.seq - topic.read);
  }
  static #serializeTopic(dst, src) {
    const res = dst || {
      name: src.name
    };
    DB.#topic_fields.forEach(f => {
      if (src.hasOwnProperty(f)) {
        res[f] = src[f];
      }
    });
    if (Array.isArray(src._tags)) {
      res.tags = src._tags;
    }
    if (src.acs) {
      res.acs = src.getAccessMode().jsonHelper();
    }
    return res;
  }
  static #serializeSubscription(dst, topicName, uid, sub) {
    const fields = ['updated', 'mode', 'read', 'recv', 'clear', 'lastSeen', 'userAgent'];
    const res = dst || {
      topic: topicName,
      uid: uid
    };
    fields.forEach(f => {
      if (sub.hasOwnProperty(f)) {
        res[f] = sub[f];
      }
    });
    return res;
  }
  static #serializeMessage(dst, msg) {
    const fields = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];
    const res = dst || {};
    fields.forEach(f => {
      if (msg.hasOwnProperty(f)) {
        res[f] = msg[f];
      }
    });
    return res;
  }
  static setDatabaseProvider(idbProvider) {
    IDBProvider = idbProvider;
  }
}

/***/ }),

/***/ "./src/drafty.js":
/*!***********************!*\
  !*** ./src/drafty.js ***!
  \***********************/
/***/ ((module) => {

/**
 * @copyright 2015-2024 Tinode LLC.
 * @summary Minimally rich text representation and formatting for Tinode.
 * @license Apache 2.0
 *
 * @file Basic parser and formatter for very simple text markup. Mostly targeted at
 * mobile use cases similar to Telegram, WhatsApp, and FB Messenger.
 *
 * <p>Supports conversion of user keyboard input to formatted text:</p>
 * <ul>
 *   <li>*abc* &rarr; <b>abc</b></li>
 *   <li>_abc_ &rarr; <i>abc</i></li>
 *   <li>~abc~ &rarr; <del>abc</del></li>
 *   <li>`abc` &rarr; <tt>abc</tt></li>
 * </ul>
 * Also supports forms and buttons.
 *
 * Nested formatting is supported, e.g. *abc _def_* -> <b>abc <i>def</i></b>
 * URLs, @mentions, and #hashtags are extracted and converted into links.
 * Forms and buttons can be added procedurally.
 * JSON data representation is inspired by Draft.js raw formatting.
 *
 *
 * @example
 * Text:
 * <pre>
 *     this is *bold*, `code` and _italic_, ~strike~
 *     combined *bold and _italic_*
 *     an url: https://www.example.com/abc#fragment and another _www.tinode.co_
 *     this is a @mention and a #hashtag in a string
 *     second #hashtag
 * </pre>
 *
 *  Sample JSON representation of the text above:
 *  {
 *     "txt": "this is bold, code and italic, strike combined bold and italic an url: https://www.example.com/abc#fragment " +
 *             "and another www.tinode.co this is a @mention and a #hashtag in a string second #hashtag",
 *     "fmt": [
 *         { "at":8, "len":4,"tp":"ST" },{ "at":14, "len":4, "tp":"CO" },{ "at":23, "len":6, "tp":"EM"},
 *         { "at":31, "len":6, "tp":"DL" },{ "tp":"BR", "len":1, "at":37 },{ "at":56, "len":6, "tp":"EM" },
 *         { "at":47, "len":15, "tp":"ST" },{ "tp":"BR", "len":1, "at":62 },{ "at":120, "len":13, "tp":"EM" },
 *         { "at":71, "len":36, "key":0 },{ "at":120, "len":13, "key":1 },{ "tp":"BR", "len":1, "at":133 },
 *         { "at":144, "len":8, "key":2 },{ "at":159, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":179 },
 *         { "at":187, "len":8, "key":3 },{ "tp":"BR", "len":1, "at":195 }
 *     ],
 *     "ent": [
 *         { "tp":"LN", "data":{ "url":"https://www.example.com/abc#fragment" } },
 *         { "tp":"LN", "data":{ "url":"http://www.tinode.co" } },
 *         { "tp":"MN", "data":{ "val":"mention" } },
 *         { "tp":"HT", "data":{ "val":"hashtag" } }
 *     ]
 *  }
 */


const MAX_FORM_ELEMENTS = 8;
const MAX_PREVIEW_ATTACHMENTS = 3;
const MAX_PREVIEW_DATA_SIZE = 64;
const JSON_MIME_TYPE = 'application/json';
const DRAFTY_MIME_TYPE = 'text/x-drafty';
const ALLOWED_ENT_FIELDS = ['act', 'height', 'duration', 'incoming', 'mime', 'name', 'premime', 'preref', 'preview', 'ref', 'size', 'state', 'url', 'val', 'width'];
const segmenter = new Intl.Segmenter();
const INLINE_STYLES = [{
  name: 'ST',
  start: /(?:^|[\W_])(\*)[^\s*]/,
  end: /[^\s*](\*)(?=$|[\W_])/
}, {
  name: 'EM',
  start: /(?:^|\W)(_)[^\s_]/,
  end: /[^\s_](_)(?=$|\W)/
}, {
  name: 'DL',
  start: /(?:^|[\W_])(~)[^\s~]/,
  end: /[^\s~](~)(?=$|[\W_])/
}, {
  name: 'CO',
  start: /(?:^|\W)(`)[^`]/,
  end: /[^`](`)(?=$|\W)/
}];
const FMT_WEIGHT = ['QQ'];
const ENTITY_TYPES = [{
  name: 'LN',
  dataName: 'url',
  pack: function (val) {
    if (!/^[a-z]+:\/\//i.test(val)) {
      val = 'http://' + val;
    }
    return {
      url: val
    };
  },
  re: /(?:(?:https?|ftp):\/\/|www\.|ftp\.)[-A-Z0-9+&@#\/%=~_|$?!:,.]*[A-Z0-9+&@#\/%=~_|$]/ig
}, {
  name: 'MN',
  dataName: 'val',
  pack: function (val) {
    return {
      val: val.slice(1)
    };
  },
  re: /\B@([\p{L}\p{N}][._\p{L}\p{N}]*[\p{L}\p{N}])/ug
}, {
  name: 'HT',
  dataName: 'val',
  pack: function (val) {
    return {
      val: val.slice(1)
    };
  },
  re: /\B#([\p{L}\p{N}][._\p{L}\p{N}]*[\p{L}\p{N}])/ug
}];
const FORMAT_TAGS = {
  AU: {
    html_tag: 'audio',
    md_tag: undefined,
    isVoid: false
  },
  BN: {
    html_tag: 'button',
    md_tag: undefined,
    isVoid: false
  },
  BR: {
    html_tag: 'br',
    md_tag: '\n',
    isVoid: true
  },
  CO: {
    html_tag: 'tt',
    md_tag: '`',
    isVoid: false
  },
  DL: {
    html_tag: 'del',
    md_tag: '~',
    isVoid: false
  },
  EM: {
    html_tag: 'i',
    md_tag: '_',
    isVoid: false
  },
  EX: {
    html_tag: '',
    md_tag: undefined,
    isVoid: true
  },
  FM: {
    html_tag: 'div',
    md_tag: undefined,
    isVoid: false
  },
  HD: {
    html_tag: '',
    md_tag: undefined,
    isVoid: false
  },
  HL: {
    html_tag: 'span',
    md_tag: undefined,
    isVoid: false
  },
  HT: {
    html_tag: 'a',
    md_tag: undefined,
    isVoid: false
  },
  IM: {
    html_tag: 'img',
    md_tag: undefined,
    isVoid: false
  },
  LN: {
    html_tag: 'a',
    md_tag: undefined,
    isVoid: false
  },
  MN: {
    html_tag: 'a',
    md_tag: undefined,
    isVoid: false
  },
  RW: {
    html_tag: 'div',
    md_tag: undefined,
    isVoid: false
  },
  QQ: {
    html_tag: 'div',
    md_tag: undefined,
    isVoid: false
  },
  ST: {
    html_tag: 'b',
    md_tag: '*',
    isVoid: false
  },
  VC: {
    html_tag: 'div',
    md_tag: undefined,
    isVoid: false
  },
  VD: {
    html_tag: 'video',
    md_tag: undefined,
    isVoid: false
  }
};
function base64toObjectUrl(b64, contentType, logger) {
  if (!b64) {
    return null;
  }
  try {
    const bin = atob(b64);
    const length = bin.length;
    const buf = new ArrayBuffer(length);
    const arr = new Uint8Array(buf);
    for (let i = 0; i < length; i++) {
      arr[i] = bin.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([buf], {
      type: contentType
    }));
  } catch (err) {
    if (logger) {
      logger("Drafty: failed to convert object.", err.message);
    }
  }
  return null;
}
function base64toDataUrl(b64, contentType) {
  if (!b64) {
    return null;
  }
  contentType = contentType || 'image/jpeg';
  return 'data:' + contentType + ';base64,' + b64;
}
const DECORATORS = {
  ST: {
    open: _ => '<b>',
    close: _ => '</b>'
  },
  EM: {
    open: _ => '<i>',
    close: _ => '</i>'
  },
  DL: {
    open: _ => '<del>',
    close: _ => '</del>'
  },
  CO: {
    open: _ => '<tt>',
    close: _ => '</tt>'
  },
  BR: {
    open: _ => '<br/>',
    close: _ => ''
  },
  HD: {
    open: _ => '',
    close: _ => ''
  },
  HL: {
    open: _ => '<span style="color:teal">',
    close: _ => '</span>'
  },
  LN: {
    open: data => {
      return '<a href="' + data.url + '">';
    },
    close: _ => '</a>',
    props: data => {
      return data ? {
        href: data.url,
        target: '_blank'
      } : null;
    }
  },
  MN: {
    open: data => {
      return '<a href="#' + data.val + '">';
    },
    close: _ => '</a>',
    props: data => {
      return data ? {
        id: data.val
      } : null;
    }
  },
  HT: {
    open: data => {
      return '<a href="#' + data.val + '">';
    },
    close: _ => '</a>',
    props: data => {
      return data ? {
        id: data.val
      } : null;
    }
  },
  BN: {
    open: _ => '<button>',
    close: _ => '</button>',
    props: data => {
      return data ? {
        'data-act': data.act,
        'data-val': data.val,
        'data-name': data.name,
        'data-ref': data.ref
      } : null;
    }
  },
  AU: {
    open: data => {
      const url = data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger);
      return '<audio controls src="' + url + '">';
    },
    close: _ => '</audio>',
    props: data => {
      if (!data) return null;
      return {
        src: data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        'data-preload': data.ref ? 'metadata' : 'auto',
        'data-duration': data.duration,
        'data-name': data.name,
        'data-size': data.val ? data.val.length * 0.75 | 0 : data.size | 0,
        'data-mime': data.mime
      };
    }
  },
  IM: {
    open: data => {
      const tmpPreviewUrl = base64toDataUrl(data._tempPreview, data.mime);
      const previewUrl = base64toObjectUrl(data.val, data.mime, Drafty.logger);
      const downloadUrl = data.ref || previewUrl;
      return (data.name ? '<a href="' + downloadUrl + '" download="' + data.name + '">' : '') + '<img src="' + (tmpPreviewUrl || previewUrl) + '"' + (data.width ? ' width="' + data.width + '"' : '') + (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: data => {
      return data.name ? '</a>' : '';
    },
    props: data => {
      if (!data) return null;
      return {
        src: base64toDataUrl(data._tempPreview, data.mime) || data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        title: data.name,
        alt: data.name,
        'data-width': data.width,
        'data-height': data.height,
        'data-name': data.name,
        'data-size': data.ref ? data.size | 0 : data.val ? data.val.length * 0.75 | 0 : data.size | 0,
        'data-mime': data.mime
      };
    }
  },
  FM: {
    open: _ => '<div>',
    close: _ => '</div>'
  },
  RW: {
    open: _ => '<div>',
    close: _ => '</div>'
  },
  QQ: {
    open: _ => '<div>',
    close: _ => '</div>',
    props: data => {
      return data ? {} : null;
    }
  },
  VC: {
    open: _ => '<div>',
    close: _ => '</div>',
    props: data => {
      if (!data) return {};
      return {
        'data-duration': data.duration,
        'data-state': data.state
      };
    }
  },
  VD: {
    open: data => {
      const tmpPreviewUrl = base64toDataUrl(data._tempPreview, data.mime);
      const previewUrl = data.ref || base64toObjectUrl(data.preview, data.premime || 'image/jpeg', Drafty.logger);
      return '<img src="' + (tmpPreviewUrl || previewUrl) + '"' + (data.width ? ' width="' + data.width + '"' : '') + (data.height ? ' height="' + data.height + '"' : '') + ' border="0" />';
    },
    close: _ => '',
    props: data => {
      if (!data) return null;
      const poster = data.preref || base64toObjectUrl(data.preview, data.premime || 'image/jpeg', Drafty.logger);
      return {
        src: poster,
        'data-src': data.ref || base64toObjectUrl(data.val, data.mime, Drafty.logger),
        'data-width': data.width,
        'data-height': data.height,
        'data-preload': data.ref ? 'metadata' : 'auto',
        'data-preview': poster,
        'data-duration': data.duration | 0,
        'data-name': data.name,
        'data-size': data.ref ? data.size | 0 : data.val ? data.val.length * 0.75 | 0 : data.size | 0,
        'data-mime': data.mime
      };
    }
  }
};
const Drafty = function () {
  this.txt = '';
  this.fmt = [];
  this.ent = [];
};
Drafty.init = function (plainText) {
  if (typeof plainText == 'undefined') {
    plainText = '';
  } else if (typeof plainText != 'string') {
    return null;
  }
  return {
    txt: plainText
  };
};
Drafty.parse = function (content) {
  if (typeof content != 'string') {
    return null;
  }
  const lines = content.split(/\r?\n/);
  const entityMap = [];
  const entityIndex = {};
  const blx = [];
  lines.forEach(line => {
    let spans = [];
    let entities;
    INLINE_STYLES.forEach(tag => {
      spans = spans.concat(spannify(line, tag.start, tag.end, tag.name));
    });
    let block;
    if (spans.length == 0) {
      block = {
        txt: line
      };
    } else {
      spans.sort((a, b) => {
        const diff = a.at - b.at;
        return diff != 0 ? diff : b.end - a.end;
      });
      spans = toSpanTree(spans);
      const chunks = chunkify(line, 0, line.length, spans);
      const drafty = draftify(chunks, 0);
      block = {
        txt: drafty.txt,
        fmt: drafty.fmt
      };
    }
    entities = extractEntities(block.txt);
    if (entities.length > 0) {
      const ranges = [];
      for (let i in entities) {
        const entity = entities[i];
        let index = entityIndex[entity.unique];
        if (!index) {
          index = entityMap.length;
          entityIndex[entity.unique] = index;
          entityMap.push({
            tp: entity.type,
            data: entity.data
          });
        }
        ranges.push({
          at: entity.offset,
          len: entity.len,
          key: index
        });
      }
      block.ent = ranges;
    }
    blx.push(block);
  });
  const result = {
    txt: ''
  };
  if (blx.length > 0) {
    result.txt = blx[0].txt;
    result.fmt = (blx[0].fmt || []).concat(blx[0].ent || []);
    if (result.fmt.length) {
      const segments = segmenter.segment(result.txt);
      for (const ele of result.fmt) {
        ({
          at: ele.at,
          len: ele.len
        } = getCorrectLengthsWhenTreatedAsGrapheme(ele, segments, result.txt));
      }
    }
    for (let i = 1; i < blx.length; i++) {
      const block = blx[i];
      const offset = getGraphemesFromString(result.txt).length + 1;
      result.fmt.push({
        tp: 'BR',
        len: 1,
        at: offset - 1
      });
      let segments = {};
      result.txt += ' ' + block.txt;
      if (block.fmt) {
        segments = segmenter.segment(block.txt);
        result.fmt = result.fmt.concat(block.fmt.map(s => {
          const {
            at: correctAt,
            len: correctLen
          } = getCorrectLengthsWhenTreatedAsGrapheme(s, segments, block.txt);
          s.at = correctAt + offset;
          s.len = correctLen;
          return s;
        }));
      }
      if (block.ent) {
        if (isEmptyObject(segments)) {
          segments = segmenter.segment(block.txt);
        }
        result.fmt = result.fmt.concat(block.ent.map(s => {
          const {
            at: correctAt,
            len: correctLen
          } = getCorrectLengthsWhenTreatedAsGrapheme(s, segments, block.txt);
          s.at = correctAt + offset;
          s.len = correctLen;
          return s;
        }));
      }
    }
    if (result.fmt.length == 0) {
      delete result.fmt;
    }
    if (entityMap.length > 0) {
      result.ent = entityMap;
    }
  }
  return result;
};
Drafty.append = function (first, second) {
  if (!first) {
    return second;
  }
  if (!second) {
    return first;
  }
  first.txt = first.txt || '';
  const len = getGraphemesFromString(first.txt).length;
  if (typeof second == 'string') {
    first.txt += second;
  } else if (second.txt) {
    first.txt += second.txt;
  }
  if (Array.isArray(second.fmt)) {
    first.fmt = first.fmt || [];
    if (Array.isArray(second.ent)) {
      first.ent = first.ent || [];
    }
    second.fmt.forEach(src => {
      const fmt = {
        at: (src.at | 0) + len,
        len: src.len | 0
      };
      if (src.at == -1) {
        fmt.at = -1;
        fmt.len = 0;
      }
      if (src.tp) {
        fmt.tp = src.tp;
      } else {
        fmt.key = first.ent.length;
        first.ent.push(second.ent[src.key || 0]);
      }
      first.fmt.push(fmt);
    });
  }
  return first;
};
Drafty.insertImage = function (content, at, imageDesc) {
  content = content || {
    txt: ' '
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
    len: 1,
    key: content.ent.length
  });
  const ex = {
    tp: 'IM',
    data: {
      mime: imageDesc.mime,
      ref: imageDesc.refurl,
      val: imageDesc.bits || imageDesc.preview,
      width: imageDesc.width,
      height: imageDesc.height,
      name: imageDesc.filename,
      size: imageDesc.size | 0
    }
  };
  if (imageDesc.urlPromise) {
    ex.data._tempPreview = imageDesc._tempPreview;
    ex.data._processing = true;
    imageDesc.urlPromise.then(url => {
      ex.data.ref = url;
      ex.data._tempPreview = undefined;
      ex.data._processing = undefined;
    }, _ => {
      ex.data._processing = undefined;
    });
  }
  content.ent.push(ex);
  return content;
};
Drafty.insertVideo = function (content, at, videoDesc) {
  content = content || {
    txt: ' '
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
    len: 1,
    key: content.ent.length
  });
  const ex = {
    tp: 'VD',
    data: {
      mime: videoDesc.mime,
      ref: videoDesc.refurl,
      val: videoDesc.bits,
      preref: videoDesc.preref,
      preview: videoDesc.preview,
      width: videoDesc.width,
      height: videoDesc.height,
      duration: videoDesc.duration | 0,
      name: videoDesc.filename,
      size: videoDesc.size | 0
    }
  };
  if (videoDesc.urlPromise) {
    ex.data._tempPreview = videoDesc._tempPreview;
    ex.data._processing = true;
    videoDesc.urlPromise.then(urls => {
      ex.data.ref = urls[0];
      ex.data.preref = urls[1];
      ex.data._tempPreview = undefined;
      ex.data._processing = undefined;
    }, _ => {
      ex.data._processing = undefined;
    });
  }
  content.ent.push(ex);
  return content;
};
Drafty.insertAudio = function (content, at, audioDesc) {
  content = content || {
    txt: ' '
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
    len: 1,
    key: content.ent.length
  });
  const ex = {
    tp: 'AU',
    data: {
      mime: audioDesc.mime,
      val: audioDesc.bits,
      duration: audioDesc.duration | 0,
      preview: audioDesc.preview,
      name: audioDesc.filename,
      size: audioDesc.size | 0,
      ref: audioDesc.refurl
    }
  };
  if (audioDesc.urlPromise) {
    ex.data._processing = true;
    audioDesc.urlPromise.then(url => {
      ex.data.ref = url;
      ex.data._processing = undefined;
    }, _ => {
      ex.data._processing = undefined;
    });
  }
  content.ent.push(ex);
  return content;
};
Drafty.videoCall = function (audioOnly) {
  const content = {
    txt: ' ',
    fmt: [{
      at: 0,
      len: 1,
      key: 0
    }],
    ent: [{
      tp: 'VC',
      data: {
        aonly: audioOnly
      }
    }]
  };
  return content;
};
Drafty.updateVideoCall = function (content, params) {
  const fmt = ((content || {}).fmt || [])[0];
  if (!fmt) {
    return content;
  }
  let ent;
  if (fmt.tp == 'VC') {
    delete fmt.tp;
    fmt.key = 0;
    ent = {
      tp: 'VC'
    };
    content.ent = [ent];
  } else {
    ent = (content.ent || [])[fmt.key | 0];
    if (!ent || ent.tp != 'VC') {
      return content;
    }
  }
  ent.data = ent.data || {};
  Object.assign(ent.data, params);
  return content;
};
Drafty.quote = function (header, uid, body) {
  const quote = Drafty.append(Drafty.appendLineBreak(Drafty.mention(header, uid)), body);
  quote.fmt.push({
    at: 0,
    len: getGraphemesFromString(quote.txt).length,
    tp: 'QQ'
  });
  return quote;
};
Drafty.mention = function (name, uid) {
  return {
    txt: name || '',
    fmt: [{
      at: 0,
      len: getGraphemesFromString(name || '').length,
      key: 0
    }],
    ent: [{
      tp: 'MN',
      data: {
        val: uid
      }
    }]
  };
};
Drafty.appendLink = function (content, linkData) {
  content = content || {
    txt: ''
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: content.txt.length,
    len: linkData.txt.length,
    key: content.ent.length
  });
  content.txt += linkData.txt;
  const ex = {
    tp: 'LN',
    data: {
      url: linkData.url
    }
  };
  content.ent.push(ex);
  return content;
};
Drafty.appendImage = function (content, imageDesc) {
  content = content || {
    txt: ''
  };
  content.txt += ' ';
  return Drafty.insertImage(content, content.txt.length - 1, imageDesc);
};
Drafty.appendAudio = function (content, audioDesc) {
  content = content || {
    txt: ''
  };
  content.txt += ' ';
  return Drafty.insertAudio(content, content.txt.length - 1, audioDesc);
};
Drafty.attachFile = function (content, attachmentDesc) {
  content = content || {
    txt: ''
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });
  const ex = {
    tp: 'EX',
    data: {
      mime: attachmentDesc.mime,
      val: attachmentDesc.data,
      name: attachmentDesc.filename,
      ref: attachmentDesc.refurl,
      size: attachmentDesc.size | 0
    }
  };
  if (attachmentDesc.urlPromise) {
    ex.data._processing = true;
    attachmentDesc.urlPromise.then(url => {
      ex.data.ref = url;
      ex.data._processing = undefined;
    }, _ => {
      ex.data._processing = undefined;
    });
  }
  content.ent.push(ex);
  return content;
};
Drafty.wrapInto = function (content, style, at, len) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at || 0,
    len: len || content.txt.length,
    tp: style
  });
  return content;
};
Drafty.wrapAsForm = function (content, at, len) {
  return Drafty.wrapInto(content, 'FM', at, len);
};
Drafty.insertButton = function (content, at, len, name, actionType, actionValue, refUrl) {
  if (typeof content == 'string') {
    content = {
      txt: content
    };
  }
  if (!content || !content.txt || content.txt.length < at + len) {
    return null;
  }
  if (len <= 0 || ['url', 'pub'].indexOf(actionType) == -1) {
    return null;
  }
  if (actionType == 'url' && !refUrl) {
    return null;
  }
  refUrl = '' + refUrl;
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: at | 0,
    len: len,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'BN',
    data: {
      act: actionType,
      val: actionValue,
      ref: refUrl,
      name: name
    }
  });
  return content;
};
Drafty.appendButton = function (content, title, name, actionType, actionValue, refUrl) {
  content = content || {
    txt: ''
  };
  const at = content.txt.length;
  content.txt += title;
  return Drafty.insertButton(content, at, title.length, name, actionType, actionValue, refUrl);
};
Drafty.attachJSON = function (content, data) {
  content = content || {
    txt: ''
  };
  content.ent = content.ent || [];
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: -1,
    len: 0,
    key: content.ent.length
  });
  content.ent.push({
    tp: 'EX',
    data: {
      mime: JSON_MIME_TYPE,
      val: data
    }
  });
  return content;
};
Drafty.appendLineBreak = function (content) {
  content = content || {
    txt: ''
  };
  content.fmt = content.fmt || [];
  content.fmt.push({
    at: getGraphemesFromString(content.txt).length,
    len: 1,
    tp: 'BR'
  });
  content.txt += ' ';
  return content;
};
Drafty.UNSAFE_toHTML = function (doc) {
  const tree = draftyToTree(doc);
  const htmlFormatter = function (type, data, values) {
    const tag = DECORATORS[type];
    let result = values ? values.join('') : '';
    if (tag) {
      result = tag.open(data) + result + tag.close(data);
    }
    return result;
  };
  return treeBottomUp(tree, htmlFormatter, 0);
};
Drafty.format = function (original, formatter, context) {
  return treeBottomUp(draftyToTree(original), formatter, 0, [], context);
};
Drafty.shorten = function (original, limit, light) {
  let tree = draftyToTree(original);
  tree = shortenTree(tree, limit, '…');
  if (tree && light) {
    tree = lightEntity(tree);
  }
  return treeToDrafty({}, tree, []);
};
Drafty.forwardedContent = function (original) {
  let tree = draftyToTree(original);
  const rmMention = function (node) {
    if (node.type == 'MN') {
      if (!node.parent || !node.parent.type) {
        return null;
      }
    }
    return node;
  };
  tree = treeTopDown(tree, rmMention);
  tree = lTrim(tree);
  return treeToDrafty({}, tree, []);
};
Drafty.replyContent = function (original, limit) {
  const convMNnQQnBR = function (node) {
    if (node.type == 'QQ') {
      return null;
    } else if (node.type == 'MN') {
      if ((!node.parent || !node.parent.type) && (node.text || '').startsWith('➦')) {
        node.text = '➦';
        delete node.children;
        delete node.data;
      }
    } else if (node.type == 'BR') {
      node.text = ' ';
      delete node.type;
      delete node.children;
    }
    return node;
  };
  let tree = draftyToTree(original);
  if (!tree) {
    return original;
  }
  tree = treeTopDown(tree, convMNnQQnBR);
  tree = attachmentsToEnd(tree, MAX_PREVIEW_ATTACHMENTS);
  tree = shortenTree(tree, limit, '…');
  const filter = node => {
    switch (node.type) {
      case 'IM':
        return ['val'];
      case 'VD':
        return ['preview'];
    }
    return null;
  };
  tree = lightEntity(tree, filter);
  return treeToDrafty({}, tree, []);
};
Drafty.preview = function (original, limit, forwarding) {
  let tree = draftyToTree(original);
  tree = attachmentsToEnd(tree, MAX_PREVIEW_ATTACHMENTS);
  const convMNnQQnBR = function (node) {
    if (node.type == 'MN') {
      if ((!node.parent || !node.parent.type) && (node.text || '').startsWith('➦')) {
        node.text = '➦';
        delete node.children;
      }
    } else if (node.type == 'QQ') {
      node.text = ' ';
      delete node.children;
    } else if (node.type == 'BR') {
      node.text = ' ';
      delete node.children;
      delete node.type;
    }
    return node;
  };
  tree = treeTopDown(tree, convMNnQQnBR);
  tree = shortenTree(tree, limit, '…');
  if (forwarding) {
    const filter = {
      IM: ['val'],
      VD: ['preview']
    };
    tree = lightEntity(tree, node => {
      return filter[node.type];
    });
  } else {
    tree = lightEntity(tree);
  }
  return treeToDrafty({}, tree, []);
};
Drafty.toPlainText = function (content) {
  return typeof content == 'string' ? content : content.txt;
};
Drafty.isPlainText = function (content) {
  return typeof content == 'string' || !(content.fmt || content.ent);
};
Drafty.toMarkdown = function (content) {
  let tree = draftyToTree(content);
  const mdFormatter = function (type, _, values) {
    const def = FORMAT_TAGS[type];
    let result = values ? values.join('') : '';
    if (def) {
      if (def.isVoid) {
        result = def.md_tag || '';
      } else if (def.md_tag) {
        result = def.md_tag + result + def.md_tag;
      }
    }
    return result;
  };
  return treeBottomUp(tree, mdFormatter, 0);
};
Drafty.isValid = function (content) {
  if (!content) {
    return false;
  }
  const {
    txt,
    fmt,
    ent
  } = content;
  if (!txt && txt !== '' && !fmt && !ent) {
    return false;
  }
  const txt_type = typeof txt;
  if (txt_type != 'string' && txt_type != 'undefined' && txt !== null) {
    return false;
  }
  if (typeof fmt != 'undefined' && !Array.isArray(fmt) && fmt !== null) {
    return false;
  }
  if (typeof ent != 'undefined' && !Array.isArray(ent) && ent !== null) {
    return false;
  }
  return true;
};
Drafty.hasAttachments = function (content) {
  if (!Array.isArray(content.fmt)) {
    return false;
  }
  for (let i in content.fmt) {
    const fmt = content.fmt[i];
    if (fmt && fmt.at < 0) {
      const ent = content.ent[fmt.key | 0];
      return ent && ent.tp == 'EX' && ent.data;
    }
  }
  return false;
};
Drafty.attachments = function (content, callback, context) {
  if (!Array.isArray(content.fmt)) {
    return;
  }
  let count = 0;
  for (let i in content.fmt) {
    let fmt = content.fmt[i];
    if (fmt && fmt.at < 0) {
      const ent = content.ent[fmt.key | 0];
      if (ent && ent.tp == 'EX' && ent.data) {
        if (callback.call(context, ent.data, count++, 'EX')) {
          break;
        }
      }
    }
  }
  ;
};
Drafty.hasEntities = function (content) {
  return content.ent && content.ent.length > 0;
};
Drafty.entities = function (content, callback, context) {
  if (content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      if (content.ent[i]) {
        if (callback.call(context, content.ent[i].data, i, content.ent[i].tp)) {
          break;
        }
      }
    }
  }
};
Drafty.styles = function (content, callback, context) {
  if (content.fmt && content.fmt.length > 0) {
    for (let i in content.fmt) {
      const fmt = content.fmt[i];
      if (fmt) {
        if (callback.call(context, fmt.tp, fmt.at, fmt.len, fmt.key, i)) {
          break;
        }
      }
    }
  }
};
Drafty.sanitizeEntities = function (content) {
  if (content && content.ent && content.ent.length > 0) {
    for (let i in content.ent) {
      const ent = content.ent[i];
      if (ent && ent.data) {
        const data = copyEntData(ent.data);
        if (data) {
          content.ent[i].data = data;
        } else {
          delete content.ent[i].data;
        }
      }
    }
  }
  return content;
};
Drafty.getDownloadUrl = function (entData) {
  let url = null;
  if (entData.mime != JSON_MIME_TYPE && entData.val) {
    url = base64toObjectUrl(entData.val, entData.mime, Drafty.logger);
  } else if (typeof entData.ref == 'string') {
    url = entData.ref;
  }
  return url;
};
Drafty.isProcessing = function (entData) {
  return !!entData._processing;
};
Drafty.getPreviewUrl = function (entData) {
  return entData.val ? base64toObjectUrl(entData.val, entData.mime, Drafty.logger) : null;
};
Drafty.getEntitySize = function (entData) {
  return entData.size ? entData.size : entData.val ? entData.val.length * 0.75 | 0 : 0;
};
Drafty.getEntityMimeType = function (entData) {
  return entData.mime || 'text/plain';
};
Drafty.tagName = function (style) {
  return FORMAT_TAGS[style] && FORMAT_TAGS[style].html_tag;
};
Drafty.attrValue = function (style, data) {
  if (data && DECORATORS[style] && DECORATORS[style].props) {
    return DECORATORS[style].props(data);
  }
  return undefined;
};
Drafty.getContentType = function () {
  return DRAFTY_MIME_TYPE;
};
function chunkify(line, start, end, spans) {
  const chunks = [];
  if (spans.length == 0) {
    return [];
  }
  for (let i in spans) {
    const span = spans[i];
    if (span.at > start) {
      chunks.push({
        txt: line.slice(start, span.at)
      });
    }
    const chunk = {
      tp: span.tp
    };
    const chld = chunkify(line, span.at + 1, span.end, span.children);
    if (chld.length > 0) {
      chunk.children = chld;
    } else {
      chunk.txt = span.txt;
    }
    chunks.push(chunk);
    start = span.end + 1;
  }
  if (start < end) {
    chunks.push({
      txt: line.slice(start, end)
    });
  }
  return chunks;
}
function spannify(original, re_start, re_end, type) {
  const result = [];
  let index = 0;
  let line = original.slice(0);
  while (line.length > 0) {
    const start = re_start.exec(line);
    if (start == null) {
      break;
    }
    let start_offset = start['index'] + start[0].lastIndexOf(start[1]);
    line = line.slice(start_offset + 1);
    start_offset += index;
    index = start_offset + 1;
    const end = re_end ? re_end.exec(line) : null;
    if (end == null) {
      break;
    }
    let end_offset = end['index'] + end[0].indexOf(end[1]);
    line = line.slice(end_offset + 1);
    end_offset += index;
    index = end_offset + 1;
    result.push({
      txt: original.slice(start_offset + 1, end_offset),
      children: [],
      at: start_offset,
      end: end_offset,
      tp: type
    });
  }
  return result;
}
function toSpanTree(spans) {
  if (spans.length == 0) {
    return [];
  }
  const tree = [spans[0]];
  let last = spans[0];
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].at > last.end) {
      tree.push(spans[i]);
      last = spans[i];
    } else if (spans[i].end <= last.end) {
      last.children.push(spans[i]);
    }
  }
  for (let i in tree) {
    tree[i].children = toSpanTree(tree[i].children);
  }
  return tree;
}
function draftyToTree(doc) {
  if (!doc) {
    return null;
  }
  doc = typeof doc == 'string' ? {
    txt: doc
  } : doc;
  let {
    txt,
    fmt,
    ent
  } = doc;
  txt = txt || '';
  if (!Array.isArray(ent)) {
    ent = [];
  }
  if (!Array.isArray(fmt) || fmt.length == 0) {
    if (ent.length == 0) {
      return {
        text: txt
      };
    }
    fmt = [{
      at: 0,
      len: 0,
      key: 0
    }];
  }
  const spans = [];
  const attachments = [];
  fmt.forEach(span => {
    if (!span || typeof span != 'object') {
      return;
    }
    if (!['undefined', 'number'].includes(typeof span.at)) {
      return;
    }
    if (!['undefined', 'number'].includes(typeof span.len)) {
      return;
    }
    let at = span.at | 0;
    let len = span.len | 0;
    if (len < 0) {
      return;
    }
    let key = span.key || 0;
    if (ent.length > 0 && (typeof key != 'number' || key < 0 || key >= ent.length)) {
      return;
    }
    if (at <= -1) {
      attachments.push({
        start: -1,
        end: 0,
        key: key
      });
      return;
    } else if (at + len > getGraphemesFromString(txt).length) {
      return;
    }
    if (!span.tp) {
      if (ent.length > 0 && typeof ent[key] == 'object') {
        spans.push({
          start: at,
          end: at + len,
          key: key
        });
      }
    } else {
      spans.push({
        type: span.tp,
        start: at,
        end: at + len
      });
    }
  });
  spans.sort((a, b) => {
    let diff = a.start - b.start;
    if (diff != 0) {
      return diff;
    }
    diff = b.end - a.end;
    if (diff != 0) {
      return diff;
    }
    return FMT_WEIGHT.indexOf(b.type) - FMT_WEIGHT.indexOf(a.type);
  });
  if (attachments.length > 0) {
    spans.push(...attachments);
  }
  spans.forEach(span => {
    if (ent.length > 0 && !span.type && ent[span.key] && typeof ent[span.key] == 'object') {
      span.type = ent[span.key].tp;
      span.data = ent[span.key].data;
    }
    if (!span.type) {
      span.type = 'HD';
    }
  });
  const graphemes = getGraphemesFromString(txt);
  let tree = spansToTree({}, graphemes, 0, graphemes.length, spans);
  const flatten = function (node) {
    if (Array.isArray(node.children) && node.children.length == 1) {
      const child = node.children[0];
      if (!node.type) {
        const parent = node.parent;
        node = child;
        node.parent = parent;
      } else if (!child.type && !child.children) {
        node.text = child.text;
        delete node.children;
      }
    }
    return node;
  };
  tree = treeTopDown(tree, flatten);
  return tree;
}
function addNode(parent, n) {
  if (!n) {
    return parent;
  }
  if (!parent.children) {
    parent.children = [];
  }
  if (parent.text) {
    parent.children.push({
      text: parent.text,
      parent: parent
    });
    delete parent.text;
  }
  n.parent = parent;
  parent.children.push(n);
  return parent;
}
function spansToTree(parent, graphemes, start, end, spans) {
  if (!spans || spans.length == 0) {
    if (start < end) {
      addNode(parent, {
        text: graphemes.slice(start, end).map(segment => segment.segment).join('')
      });
    }
    return parent;
  }
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    if (span.start < 0 && span.type == 'EX') {
      addNode(parent, {
        type: span.type,
        data: span.data,
        key: span.key,
        att: true
      });
      continue;
    }
    if (start < span.start) {
      addNode(parent, {
        text: graphemes.slice(start, span.start).map(segment => segment.segment).join('')
      });
      start = span.start;
    }
    const subspans = [];
    while (i < spans.length - 1) {
      const inner = spans[i + 1];
      if (inner.start < 0) {
        break;
      } else if (inner.start < span.end) {
        if (inner.end <= span.end) {
          const tag = FORMAT_TAGS[inner.tp] || {};
          if (inner.start < inner.end || tag.isVoid) {
            subspans.push(inner);
          }
        }
        i++;
      } else {
        break;
      }
    }
    addNode(parent, spansToTree({
      type: span.type,
      data: span.data,
      key: span.key
    }, graphemes, start, span.end, subspans));
    start = span.end;
  }
  if (start < end) {
    addNode(parent, {
      text: graphemes.slice(start, end).map(segment => segment.segment).join('')
    });
  }
  return parent;
}
function treeToDrafty(doc, tree, keymap) {
  if (!tree) {
    return doc;
  }
  doc.txt = doc.txt || '';
  const start = getGraphemesFromString(doc.txt).length;
  if (tree.text) {
    doc.txt += tree.text;
  } else if (Array.isArray(tree.children)) {
    tree.children.forEach(c => {
      treeToDrafty(doc, c, keymap);
    });
  }
  if (tree.type) {
    const len = getGraphemesFromString(doc.txt).length - start;
    doc.fmt = doc.fmt || [];
    if (Object.keys(tree.data || {}).length > 0) {
      doc.ent = doc.ent || [];
      const newKey = typeof keymap[tree.key] == 'undefined' ? doc.ent.length : keymap[tree.key];
      keymap[tree.key] = newKey;
      doc.ent[newKey] = {
        tp: tree.type,
        data: tree.data
      };
      if (tree.att) {
        doc.fmt.push({
          at: -1,
          len: 0,
          key: newKey
        });
      } else {
        doc.fmt.push({
          at: start,
          len: len,
          key: newKey
        });
      }
    } else {
      doc.fmt.push({
        tp: tree.type,
        at: start,
        len: len
      });
    }
  }
  return doc;
}
function treeTopDown(src, transformer, context) {
  if (!src) {
    return null;
  }
  let dst = transformer.call(context, src);
  if (!dst || !dst.children) {
    return dst;
  }
  const children = [];
  for (let i in dst.children) {
    let n = dst.children[i];
    if (n) {
      n = treeTopDown(n, transformer, context);
      if (n) {
        children.push(n);
      }
    }
  }
  if (children.length == 0) {
    dst.children = null;
  } else {
    dst.children = children;
  }
  return dst;
}
function treeBottomUp(src, formatter, index, stack, context) {
  if (!src) {
    return null;
  }
  if (stack && src.type) {
    stack.push(src.type);
  }
  let values = [];
  for (let i in src.children) {
    const n = treeBottomUp(src.children[i], formatter, i, stack, context);
    if (n) {
      values.push(n);
    }
  }
  if (values.length == 0) {
    if (src.text) {
      values = [src.text];
    } else {
      values = null;
    }
  }
  if (stack && src.type) {
    stack.pop();
  }
  return formatter.call(context, src.type, src.data, values, index, stack);
}
function shortenTree(tree, limit, tail) {
  if (!tree) {
    return null;
  }
  if (tail) {
    limit -= tail.length;
  }
  const shortener = function (node) {
    if (limit <= -1) {
      return null;
    }
    if (node.att) {
      return node;
    }
    if (limit == 0) {
      node.text = tail;
      limit = -1;
    } else if (node.text) {
      const graphemes = getGraphemesFromString(node.text);
      if (graphemes.length > limit) {
        node.text = graphemes.slice(0, limit).map(segment => segment.segment).join('') + tail;
        limit = -1;
      } else {
        limit -= graphemes.length;
      }
    }
    return node;
  };
  return treeTopDown(tree, shortener);
}
function lightEntity(tree, allow) {
  const lightCopy = node => {
    const data = copyEntData(node.data, true, allow ? allow(node) : null);
    if (data) {
      node.data = data;
    } else {
      delete node.data;
    }
    return node;
  };
  return treeTopDown(tree, lightCopy);
}
function lTrim(tree) {
  if (tree.type == 'BR') {
    tree = null;
  } else if (tree.text) {
    if (!tree.type) {
      tree.text = tree.text.trimStart();
      if (!tree.text) {
        tree = null;
      }
    }
  } else if (!tree.type && tree.children && tree.children.length > 0) {
    const c = lTrim(tree.children[0]);
    if (c) {
      tree.children[0] = c;
    } else {
      tree.children.shift();
      if (!tree.type && tree.children.length == 0) {
        tree = null;
      }
    }
  }
  return tree;
}
function attachmentsToEnd(tree, limit) {
  if (!tree) {
    return null;
  }
  if (tree.att) {
    tree.text = ' ';
    delete tree.att;
    delete tree.children;
  } else if (tree.children) {
    const attachments = [];
    const children = [];
    for (let i in tree.children) {
      const c = tree.children[i];
      if (c.att) {
        if (attachments.length == limit) {
          continue;
        }
        if (c.data['mime'] == JSON_MIME_TYPE) {
          continue;
        }
        delete c.att;
        delete c.children;
        c.text = ' ';
        attachments.push(c);
      } else {
        children.push(c);
      }
    }
    tree.children = children.concat(attachments);
  }
  return tree;
}
function extractEntities(line) {
  let match;
  let extracted = [];
  ENTITY_TYPES.forEach(entity => {
    while ((match = entity.re.exec(line)) !== null) {
      extracted.push({
        offset: match['index'],
        len: match[0].length,
        unique: match[0],
        data: entity.pack(match[0]),
        type: entity.name
      });
    }
  });
  if (extracted.length == 0) {
    return extracted;
  }
  extracted.sort((a, b) => {
    return a.offset - b.offset;
  });
  let idx = -1;
  extracted = extracted.filter(el => {
    const result = el.offset > idx;
    idx = el.offset + el.len;
    return result;
  });
  return extracted;
}
function draftify(chunks, startAt) {
  let plain = '';
  let ranges = [];
  for (let i in chunks) {
    const chunk = chunks[i];
    if (!chunk.txt) {
      const drafty = draftify(chunk.children, plain.length + startAt);
      chunk.txt = drafty.txt;
      ranges = ranges.concat(drafty.fmt);
    }
    if (chunk.tp) {
      ranges.push({
        at: plain.length + startAt,
        len: chunk.txt.length,
        tp: chunk.tp
      });
    }
    plain += chunk.txt;
  }
  return {
    txt: plain,
    fmt: ranges
  };
}
function copyEntData(data, light, allow) {
  if (data && Object.entries(data).length > 0) {
    allow = allow || [];
    const dc = {};
    ALLOWED_ENT_FIELDS.forEach(key => {
      if (data[key]) {
        if (light && !allow.includes(key) && (typeof data[key] == 'string' || Array.isArray(data[key])) && data[key].length > MAX_PREVIEW_DATA_SIZE) {
          return;
        }
        if (typeof data[key] == 'object') {
          return;
        }
        dc[key] = data[key];
      }
    });
    if (Object.entries(dc).length != 0) {
      return dc;
    }
  }
  return null;
}
function isEmptyObject(obj) {
  return Object.keys(obj ?? {}).length == 0;
}
;
function getGraphemeIndices(graphemes) {
  const result = [];
  let graphemeIndex = 0;
  let charIndex = 0;
  for (const {
    segment
  } of graphemes) {
    for (let i = 0; i < segment.length; i++) {
      result[charIndex + i] = graphemeIndex;
    }
    charIndex += segment.length;
    graphemeIndex++;
  }
  return result;
}
function getCorrectLengthsWhenTreatedAsGrapheme(fmt, segments, txt) {
  segments = segments ?? segmenter.segment(txt);
  const indices = getGraphemeIndices(segments);
  const correctAt = indices[fmt.at];
  const correctLen = fmt.at + fmt.len <= txt.length ? indices[fmt.at + fmt.len - 1] - correctAt : fmt.len;
  return {
    at: correctAt,
    len: correctLen + 1
  };
}
function getGraphemesFromString(input) {
  return Array.from(segmenter.segment(input));
}
if (true) {
  module.exports = Drafty;
}

/***/ }),

/***/ "./src/large-file.js":
/*!***************************!*\
  !*** ./src/large-file.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LargeFileHelper)
/* harmony export */ });
/* harmony import */ var _comm_error_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./comm-error.js */ "./src/comm-error.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");




let XHRProvider;
function addURLParam(relUrl, key, value) {
  const url = new URL(relUrl, window.location.origin);
  url.searchParams.append(key, value);
  return url.toString().substring(window.location.origin.length);
}
class LargeFileHelper {
  constructor(tinode, version) {
    this._tinode = tinode;
    this._version = version;
    this._apiKey = tinode._apiKey;
    this._authToken = tinode.getAuthToken();
    this.xhr = [];
  }
  uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure) {
    let url = `/v${this._version}/file/u/`;
    if (baseUrl) {
      let base = baseUrl;
      if (base.endsWith('/')) {
        base = base.slice(0, -1);
      }
      if (base.startsWith('http://') || base.startsWith('https://')) {
        url = base + url;
      } else {
        throw new Error(`Invalid base URL '${baseUrl}'`);
      }
    }
    const instance = this;
    const xhr = new XHRProvider();
    this.xhr.push(xhr);
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    if (this._authToken) {
      xhr.setRequestHeader('X-Tinode-Auth', `Token ${this._authToken.token}`);
    }
    let toResolve = null;
    let toReject = null;
    const result = new Promise((resolve, reject) => {
      toResolve = resolve;
      toReject = reject;
    });
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        if (onProgress) {
          onProgress(e.loaded / e.total);
        }
        if (this.onProgress) {
          this.onProgress(e.loaded / e.total);
        }
      }
    };
    xhr.onload = function () {
      let pkt;
      try {
        pkt = JSON.parse(this.response, _utils_js__WEBPACK_IMPORTED_MODULE_1__.jsonParseHelper);
      } catch (err) {
        instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.response);
        pkt = {
          ctrl: {
            code: this.status,
            text: this.statusText
          }
        };
      }
      if (this.status >= 200 && this.status < 300) {
        if (toResolve) {
          toResolve(pkt.ctrl.params.url);
        }
        if (onSuccess) {
          onSuccess(pkt.ctrl);
        }
      } else if (this.status >= 400) {
        if (toReject) {
          toReject(new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"](pkt.ctrl.text, pkt.ctrl.code));
        }
        if (onFailure) {
          onFailure(pkt.ctrl);
        }
      } else {
        instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
      }
    };
    xhr.onerror = function (e) {
      if (toReject) {
        toReject(e || new Error("failed"));
      }
      if (onFailure) {
        onFailure(null);
      }
    };
    xhr.onabort = function (e) {
      if (toReject) {
        toReject(new Error("upload cancelled by user"));
      }
      if (onFailure) {
        onFailure(null);
      }
    };
    try {
      const form = new FormData();
      form.append('file', data);
      form.set('id', this._tinode.getNextUniqueId());
      if (avatarFor) {
        form.set('topic', avatarFor);
      }
      xhr.send(form);
    } catch (err) {
      if (toReject) {
        toReject(err);
      }
      if (onFailure) {
        onFailure(null);
      }
    }
    return result;
  }
  upload(data, avatarFor, onProgress, onSuccess, onFailure) {
    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;
    return this.uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure);
  }
  download(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!(0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.isUrlRelative)(relativeUrl)) {
      if (onError) {
        onError(`The URL '${relativeUrl}' must be relative, not absolute`);
      }
      return;
    }
    if (!this._authToken) {
      if (onError) {
        onError("Must authenticate first");
      }
      return;
    }
    const instance = this;
    const xhr = new XHRProvider();
    this.xhr.push(xhr);
    relativeUrl = addURLParam(relativeUrl, 'asatt', '1');
    xhr.open('GET', relativeUrl, true);
    xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    xhr.responseType = 'blob';
    xhr.onprogress = function (e) {
      if (onProgress) {
        onProgress(e.loaded);
      }
    };
    let toResolve = null;
    let toReject = null;
    const result = new Promise((resolve, reject) => {
      toResolve = resolve;
      toReject = reject;
    });
    xhr.onload = function () {
      if (this.status == 200) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(new Blob([this.response], {
          type: mimetype
        }));
        link.style.display = 'none';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        if (toResolve) {
          toResolve();
        }
      } else if (this.status >= 400 && toReject) {
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const pkt = JSON.parse(this.result, _utils_js__WEBPACK_IMPORTED_MODULE_1__.jsonParseHelper);
            toReject(new _comm_error_js__WEBPACK_IMPORTED_MODULE_0__["default"](pkt.ctrl.text, pkt.ctrl.code));
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.result);
            toReject(err);
          }
        };
        reader.readAsText(this.response);
      }
    };
    xhr.onerror = function (e) {
      if (toReject) {
        toReject(new Error("failed"));
      }
      if (onError) {
        onError(e);
      }
    };
    xhr.onabort = function () {
      if (toReject) {
        toReject(null);
      }
    };
    try {
      xhr.send();
    } catch (err) {
      if (toReject) {
        toReject(err);
      }
      if (onError) {
        onError(err);
      }
    }
    return result;
  }
  cancel() {
    this.xhr.forEach(req => {
      if (req.readyState < 4) {
        req.abort();
      }
    });
  }
  static setNetworkProvider(xhrProvider) {
    XHRProvider = xhrProvider;
  }
}

/***/ }),

/***/ "./src/meta-builder.js":
/*!*****************************!*\
  !*** ./src/meta-builder.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MetaGetBuilder)
/* harmony export */ });

class MetaGetBuilder {
  constructor(parent) {
    this.topic = parent;
    this.what = {};
  }
  #get_desc_ims() {
    return this.topic._deleted ? undefined : this.topic.updated;
  }
  #get_subs_ims() {
    if (this.topic.isP2PType()) {
      return this.#get_desc_ims();
    }
    return this.topic._deleted ? undefined : this.topic._lastSubsUpdate;
  }
  withData(since, before, limit) {
    this.what['data'] = {
      since: since,
      before: before,
      limit: limit
    };
    return this;
  }
  withLaterData(limit) {
    return this.withData(this.topic._maxSeq > 0 ? this.topic._maxSeq + 1 : undefined, undefined, limit);
  }
  withEarlierData(limit) {
    return this.withData(undefined, this.topic._minSeq > 0 ? this.topic._minSeq : undefined, limit);
  }
  withDesc(ims) {
    this.what['desc'] = {
      ims: ims
    };
    return this;
  }
  withLaterDesc() {
    return this.withDesc(this.#get_desc_ims());
  }
  withSub(ims, limit, userOrTopic) {
    const opts = {
      ims: ims,
      limit: limit
    };
    if (this.topic.getType() == 'me') {
      opts.topic = userOrTopic;
    } else {
      opts.user = userOrTopic;
    }
    this.what['sub'] = opts;
    return this;
  }
  withOneSub(ims, userOrTopic) {
    return this.withSub(ims, undefined, userOrTopic);
  }
  withLaterOneSub(userOrTopic) {
    return this.withOneSub(this.topic._lastSubsUpdate, userOrTopic);
  }
  withLaterSub(limit) {
    return this.withSub(this.#get_subs_ims(), limit);
  }
  withTags() {
    this.what['tags'] = true;
    return this;
  }
  withCred() {
    if (this.topic.getType() == 'me') {
      this.what['cred'] = true;
    } else {
      this.topic._tinode.logger("ERROR: Invalid topic type for MetaGetBuilder:withCreds", this.topic.getType());
    }
    return this;
  }
  withDel(since, limit) {
    if (since || limit) {
      this.what['del'] = {
        since: since,
        limit: limit
      };
    }
    return this;
  }
  withLaterDel(limit) {
    return this.withDel(this.topic._maxSeq > 0 ? this.topic._maxDel + 1 : undefined, limit);
  }
  extract(what) {
    return this.what[what];
  }
  build() {
    const what = [];
    let params = {};
    ['data', 'sub', 'desc', 'tags', 'cred', 'del'].forEach(key => {
      if (this.what.hasOwnProperty(key)) {
        what.push(key);
        if (Object.getOwnPropertyNames(this.what[key]).length > 0) {
          params[key] = this.what[key];
        }
      }
    });
    if (what.length > 0) {
      params.what = what.join(' ');
    } else {
      params = undefined;
    }
    return params;
  }
}

/***/ }),

/***/ "./src/topic.js":
/*!**********************!*\
  !*** ./src/topic.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Topic: () => (/* binding */ Topic),
/* harmony export */   TopicFnd: () => (/* binding */ TopicFnd),
/* harmony export */   TopicMe: () => (/* binding */ TopicMe)
/* harmony export */ });
/* harmony import */ var _access_mode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./access-mode.js */ "./src/access-mode.js");
/* harmony import */ var _cbuffer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./cbuffer.js */ "./src/cbuffer.js");
/* harmony import */ var _comm_error_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./comm-error.js */ "./src/comm-error.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _drafty_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./drafty.js */ "./src/drafty.js");
/* harmony import */ var _drafty_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_drafty_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _meta_builder_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./meta-builder.js */ "./src/meta-builder.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");









class Topic {
  constructor(name, callbacks) {
    this._tinode = null;
    this.name = name;
    this.created = null;
    this.updated = null;
    this.touched = new Date(0);
    this.acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](null);
    this.private = null;
    this.public = null;
    this.trusted = null;
    this._users = {};
    this._queuedSeqId = _config_js__WEBPACK_IMPORTED_MODULE_3__.LOCAL_SEQID;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._noEarlierMsgs = false;
    this._maxDel = 0;
    this._recvNotificationTimer = null;
    this._tags = [];
    this._credentials = [];
    this._messageVersions = {};
    this._messages = new _cbuffer_js__WEBPACK_IMPORTED_MODULE_1__["default"]((a, b) => {
      return a.seq - b.seq;
    }, true);
    this._attached = false;
    this._lastSubsUpdate = new Date(0);
    this._new = true;
    this._deleted = false;
    this._delayedLeaveTimer = null;
    if (callbacks) {
      this.onData = callbacks.onData;
      this.onMeta = callbacks.onMeta;
      this.onPres = callbacks.onPres;
      this.onInfo = callbacks.onInfo;
      this.onMetaDesc = callbacks.onMetaDesc;
      this.onMetaSub = callbacks.onMetaSub;
      this.onSubsUpdated = callbacks.onSubsUpdated;
      this.onTagsUpdated = callbacks.onTagsUpdated;
      this.onCredsUpdated = callbacks.onCredsUpdated;
      this.onDeleteTopic = callbacks.onDeleteTopic;
      this.onAllMessagesReceived = callbacks.onAllMessagesReceived;
    }
  }
  static topicType(name) {
    const types = {
      'me': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME,
      'fnd': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_FND,
      'grp': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_GRP,
      'new': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_GRP,
      'nch': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_GRP,
      'chn': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_GRP,
      'usr': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_P2P,
      'sys': _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_SYS
    };
    return types[typeof name == 'string' ? name.substring(0, 3) : 'xxx'];
  }
  static isMeTopicName(name) {
    return Topic.topicType(name) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME;
  }
  static isGroupTopicName(name) {
    return Topic.topicType(name) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_GRP;
  }
  static isP2PTopicName(name) {
    return Topic.topicType(name) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_P2P;
  }
  static isCommTopicName(name) {
    return Topic.isP2PTopicName(name) || Topic.isGroupTopicName(name);
  }
  static isNewGroupTopicName(name) {
    return typeof name == 'string' && (name.substring(0, 3) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_NEW || name.substring(0, 3) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_NEW_CHAN);
  }
  static isChannelTopicName(name) {
    return typeof name == 'string' && (name.substring(0, 3) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_CHAN || name.substring(0, 3) == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_NEW_CHAN);
  }
  isSubscribed() {
    return this._attached;
  }
  subscribe(getParams, setParams) {
    clearTimeout(this._delayedLeaveTimer);
    this._delayedLeaveTimer = null;
    if (this._attached) {
      return Promise.resolve(this);
    }
    return this._tinode.subscribe(this.name || _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_NEW, getParams, setParams).then(ctrl => {
      if (ctrl.code >= 300) {
        return ctrl;
      }
      this._attached = true;
      this._deleted = false;
      this.acs = ctrl.params && ctrl.params.acs ? ctrl.params.acs : this.acs;
      if (this._new) {
        delete this._new;
        if (this.name != ctrl.topic) {
          this._cacheDelSelf();
          this.name = ctrl.topic;
        }
        this._cachePutSelf();
        this.created = ctrl.ts;
        this.updated = ctrl.ts;
        if (this.name != _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME && this.name != _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_FND) {
          const me = this._tinode.getMeTopic();
          if (me.onMetaSub) {
            me.onMetaSub(this);
          }
          if (me.onSubsUpdated) {
            me.onSubsUpdated([this.name], 1);
          }
        }
        if (setParams && setParams.desc) {
          setParams.desc._noForwarding = true;
          this._processMetaDesc(setParams.desc);
        }
      }
      return ctrl;
    });
  }
  createMessage(data, noEcho) {
    return this._tinode.createMessage(this.name, data, noEcho);
  }
  publish(data, noEcho) {
    return this.publishMessage(this.createMessage(data, noEcho));
  }
  publishMessage(pub) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot publish on inactive topic"));
    }
    if (this._sending) {
      return Promise.reject(new Error("The message is already being sent"));
    }
    pub._sending = true;
    pub._failed = false;
    let attachments = null;
    if (_drafty_js__WEBPACK_IMPORTED_MODULE_4___default().hasEntities(pub.content)) {
      attachments = [];
      _drafty_js__WEBPACK_IMPORTED_MODULE_4___default().entities(pub.content, data => {
        if (data) {
          if (data.ref) {
            attachments.push(data.ref);
          }
          if (data.preref) {
            attachments.push(data.preref);
          }
        }
      });
      if (attachments.length == 0) {
        attachments = null;
      }
    }
    return this._tinode.publishMessage(pub, attachments).then(ctrl => {
      pub._sending = false;
      pub.ts = ctrl.ts;
      this.swapMessageId(pub, ctrl.params.seq);
      this._maybeUpdateMessageVersionsCache(pub);
      this._routeData(pub);
      return ctrl;
    }).catch(err => {
      this._tinode.logger("WARNING: Message rejected by the server", err);
      pub._sending = false;
      pub._failed = true;
      if (this.onData) {
        this.onData();
      }
    });
  }
  publishDraft(pub, prom) {
    const seq = pub.seq || this._getQueuedSeqId();
    if (!pub._noForwarding) {
      pub._noForwarding = true;
      pub.seq = seq;
      pub.ts = new Date();
      pub.from = this._tinode.getCurrentUserID();
      pub.noecho = true;
      this._messages.put(pub);
      this._tinode._db.addMessage(pub);
      if (this.onData) {
        this.onData(pub);
      }
    }
    return (prom || Promise.resolve()).then(_ => {
      if (pub._cancelled) {
        return {
          code: 300,
          text: "cancelled"
        };
      }
      return this.publishMessage(pub);
    }).catch(err => {
      this._tinode.logger("WARNING: Message draft rejected", err);
      pub._sending = false;
      pub._failed = true;
      pub._fatal = err instanceof _comm_error_js__WEBPACK_IMPORTED_MODULE_2__["default"] ? err.code >= 400 && err.code < 500 : false;
      if (this.onData) {
        this.onData();
      }
      throw err;
    });
  }
  leave(unsub) {
    if (!this._attached && !unsub) {
      return Promise.reject(new Error("Cannot leave inactive topic"));
    }
    return this._tinode.leave(this.name, unsub).then(ctrl => {
      this._resetSub();
      if (unsub) {
        this._gone();
      }
      return ctrl;
    });
  }
  leaveDelayed(unsub, delay) {
    clearTimeout(this._delayedLeaveTimer);
    this._delayedLeaveTimer = setTimeout(_ => {
      this._delayedLeaveTimer = null;
      this.leave(unsub);
    }, delay);
  }
  getMeta(params) {
    return this._tinode.getMeta(this.name, params);
  }
  getMessagesPage(limit, forward) {
    let query = forward ? this.startMetaQuery().withLaterData(limit) : this.startMetaQuery().withEarlierData(limit);
    return this._loadMessages(this._tinode._db, query.extract('data')).then(count => {
      if (count == limit) {
        return Promise.resolve({
          topic: this.name,
          code: 200,
          params: {
            count: count
          }
        });
      }
      limit -= count;
      query = forward ? this.startMetaQuery().withLaterData(limit) : this.startMetaQuery().withEarlierData(limit);
      let promise = this.getMeta(query.build());
      if (!forward) {
        promise = promise.then(ctrl => {
          if (ctrl && ctrl.params && !ctrl.params.count) {
            this._noEarlierMsgs = true;
          }
        });
      }
      return promise;
    });
  }
  setMeta(params) {
    if (params.tags) {
      params.tags = (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.normalizeArray)(params.tags);
    }
    return this._tinode.setMeta(this.name, params).then(ctrl => {
      if (ctrl && ctrl.code >= 300) {
        return ctrl;
      }
      if (params.sub) {
        params.sub.topic = this.name;
        if (ctrl.params && ctrl.params.acs) {
          params.sub.acs = ctrl.params.acs;
          params.sub.updated = ctrl.ts;
        }
        if (!params.sub.user) {
          params.sub.user = this._tinode.getCurrentUserID();
          if (!params.desc) {
            params.desc = {};
          }
        }
        params.sub._noForwarding = true;
        this._processMetaSubs([params.sub]);
      }
      if (params.desc) {
        if (ctrl.params && ctrl.params.acs) {
          params.desc.acs = ctrl.params.acs;
          params.desc.updated = ctrl.ts;
        }
        this._processMetaDesc(params.desc);
      }
      if (params.tags) {
        this._processMetaTags(params.tags);
      }
      if (params.cred) {
        this._processMetaCreds([params.cred], true);
      }
      return ctrl;
    });
  }
  updateMode(uid, update) {
    const user = uid ? this.subscriber(uid) : null;
    const am = user ? user.acs.updateGiven(update).getGiven() : this.getAccessMode().updateWant(update).getWant();
    return this.setMeta({
      sub: {
        user: uid,
        mode: am
      }
    });
  }
  invite(uid, mode) {
    return this.setMeta({
      sub: {
        user: uid,
        mode: mode
      }
    });
  }
  archive(arch) {
    if (this.private && !this.private.arch == !arch) {
      return Promise.resolve(arch);
    }
    return this.setMeta({
      desc: {
        private: {
          arch: arch ? true : _config_js__WEBPACK_IMPORTED_MODULE_3__.DEL_CHAR
        }
      }
    });
  }
  delMessages(ranges, hard) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete messages in inactive topic"));
    }
    ranges.sort((r1, r2) => {
      if (r1.low < r2.low) {
        return true;
      }
      if (r1.low == r2.low) {
        return !r2.hi || r1.hi >= r2.hi;
      }
      return false;
    });
    let tosend = ranges.reduce((out, r) => {
      if (r.low < _config_js__WEBPACK_IMPORTED_MODULE_3__.LOCAL_SEQID) {
        if (!r.hi || r.hi < _config_js__WEBPACK_IMPORTED_MODULE_3__.LOCAL_SEQID) {
          out.push(r);
        } else {
          out.push({
            low: r.low,
            hi: this._maxSeq + 1
          });
        }
      }
      return out;
    }, []);
    let result;
    if (tosend.length > 0) {
      result = this._tinode.delMessages(this.name, tosend, hard);
    } else {
      result = Promise.resolve({
        params: {
          del: 0
        }
      });
    }
    return result.then(ctrl => {
      if (ctrl.params.del > this._maxDel) {
        this._maxDel = ctrl.params.del;
      }
      ranges.forEach(r => {
        if (r.hi) {
          this.flushMessageRange(r.low, r.hi);
        } else {
          this.flushMessage(r.low);
        }
      });
      if (this.onData) {
        this.onData();
      }
      return ctrl;
    });
  }
  delMessagesAll(hardDel) {
    if (!this._maxSeq || this._maxSeq <= 0) {
      return Promise.resolve();
    }
    return this.delMessages([{
      low: 1,
      hi: this._maxSeq + 1,
      _all: true
    }], hardDel);
  }
  delMessagesList(list, hardDel) {
    list.sort((a, b) => a - b);
    let ranges = list.reduce((out, id) => {
      if (out.length == 0) {
        out.push({
          low: id
        });
      } else {
        let prev = out[out.length - 1];
        if (!prev.hi && id != prev.low + 1 || id > prev.hi) {
          out.push({
            low: id
          });
        } else {
          prev.hi = prev.hi ? Math.max(prev.hi, id + 1) : id + 1;
        }
      }
      return out;
    }, []);
    return this.delMessages(ranges, hardDel);
  }
  delMessagesEdits(seq, hardDel) {
    const list = [seq];
    this.messageVersions(seq, msg => list.push(msg.seq));
    return this.delMessagesList(list, hardDel);
  }
  delTopic(hard) {
    if (this._deleted) {
      this._gone();
      return Promise.resolve(null);
    }
    return this._tinode.delTopic(this.name, hard).then(ctrl => {
      this._deleted = true;
      this._resetSub();
      this._gone();
      return ctrl;
    });
  }
  delSubscription(user) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete subscription in inactive topic"));
    }
    return this._tinode.delSubscription(this.name, user).then(ctrl => {
      delete this._users[user];
      if (this.onSubsUpdated) {
        this.onSubsUpdated(Object.keys(this._users));
      }
      return ctrl;
    });
  }
  note(what, seq) {
    if (!this._attached) {
      return;
    }
    const user = this._users[this._tinode.getCurrentUserID()];
    let update = false;
    if (user) {
      if (!user[what] || user[what] < seq) {
        user[what] = seq;
        update = true;
      }
    } else {
      update = (this[what] | 0) < seq;
    }
    if (update) {
      this._tinode.note(this.name, what, seq);
      this._updateMyReadRecv(what, seq);
      if (this.acs != null && !this.acs.isMuted()) {
        const me = this._tinode.getMeTopic();
        me._refreshContact(what, this);
      }
    }
  }
  noteRecv(seq) {
    this.note('recv', seq);
  }
  noteRead(seq) {
    seq = seq || this._maxSeq;
    if (seq > 0) {
      this.note('read', seq);
    }
  }
  noteKeyPress() {
    if (this._attached) {
      this._tinode.noteKeyPress(this.name);
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  }
  noteRecording(audioOnly) {
    if (this._attached) {
      this._tinode.noteKeyPress(this.name, audioOnly ? 'kpa' : 'kpv');
    } else {
      this._tinode.logger("INFO: Cannot send notification in inactive topic");
    }
  }
  videoCall(evt, seq, payload) {
    if (!this._attached && !['ringing', 'hang-up'].includes(evt)) {
      return;
    }
    return this._tinode.videoCall(this.name, seq, evt, payload);
  }
  _updateMyReadRecv(what, seq, ts) {
    let oldVal,
      doUpdate = false;
    seq = seq | 0;
    this.seq = this.seq | 0;
    this.read = this.read | 0;
    this.recv = this.recv | 0;
    switch (what) {
      case 'recv':
        oldVal = this.recv;
        this.recv = Math.max(this.recv, seq);
        doUpdate = oldVal != this.recv;
        break;
      case 'read':
        oldVal = this.read;
        this.read = Math.max(this.read, seq);
        doUpdate = oldVal != this.read;
        break;
      case 'msg':
        oldVal = this.seq;
        this.seq = Math.max(this.seq, seq);
        if (!this.touched || this.touched < ts) {
          this.touched = ts;
        }
        doUpdate = oldVal != this.seq;
        break;
    }
    if (this.recv < this.read) {
      this.recv = this.read;
      doUpdate = true;
    }
    if (this.seq < this.recv) {
      this.seq = this.recv;
      if (!this.touched || this.touched < ts) {
        this.touched = ts;
      }
      doUpdate = true;
    }
    this.unread = this.seq - this.read;
    return doUpdate;
  }
  userDesc(uid) {
    const user = this._cacheGetUser(uid);
    if (user) {
      return user;
    }
  }
  p2pPeerDesc() {
    if (!this.isP2PType()) {
      return undefined;
    }
    return this._users[this.name];
  }
  subscribers(callback, context) {
    const cb = callback || this.onMetaSub;
    if (cb) {
      for (let idx in this._users) {
        cb.call(context, this._users[idx], idx, this._users);
      }
    }
  }
  tags() {
    return this._tags.slice(0);
  }
  subscriber(uid) {
    return this._users[uid];
  }
  messageVersions(origSeq, callback, context) {
    if (!callback) {
      return;
    }
    const versions = this._messageVersions[origSeq];
    if (!versions) {
      return;
    }
    versions.forEach(callback, undefined, undefined, context);
  }
  messages(callback, sinceId, beforeId, context) {
    const cb = callback || this.onData;
    if (cb) {
      const startIdx = typeof sinceId == 'number' ? this._messages.find({
        seq: sinceId
      }, true) : undefined;
      const beforeIdx = typeof beforeId == 'number' ? this._messages.find({
        seq: beforeId
      }, true) : undefined;
      if (startIdx != -1 && beforeIdx != -1) {
        let msgs = [];
        this._messages.forEach((msg, unused1, unused2, i) => {
          if (this._isReplacementMsg(msg)) {
            return;
          }
          const latest = this.latestMsgVersion(msg.seq) || msg;
          if (!latest._origTs) {
            latest._origTs = latest.ts;
            latest._origSeq = latest.seq;
            latest.ts = msg.ts;
            latest.seq = msg.seq;
          }
          msgs.push({
            data: latest,
            idx: i
          });
        }, startIdx, beforeIdx, {});
        msgs.forEach((val, i) => {
          cb.call(context, val.data, i > 0 ? msgs[i - 1].data : undefined, i < msgs.length - 1 ? msgs[i + 1].data : undefined, val.idx);
        });
      }
    }
  }
  findMessage(seq) {
    const idx = this._messages.find({
      seq: seq
    });
    if (idx >= 0) {
      return this._messages.getAt(idx);
    }
    return undefined;
  }
  latestMessage() {
    return this._messages.getLast();
  }
  latestMsgVersion(seq) {
    const versions = this._messageVersions[seq];
    return versions ? versions.getLast() : null;
  }
  maxMsgSeq() {
    return this._maxSeq;
  }
  minMsgSeq() {
    return this._minSeq;
  }
  maxClearId() {
    return this._maxDel;
  }
  messageCount() {
    return this._messages.length();
  }
  queuedMessages(callback, context) {
    if (!callback) {
      throw new Error("Callback must be provided");
    }
    this.messages(callback, _config_js__WEBPACK_IMPORTED_MODULE_3__.LOCAL_SEQID, undefined, context);
  }
  msgReceiptCount(what, seq) {
    let count = 0;
    if (seq > 0) {
      const me = this._tinode.getCurrentUserID();
      for (let idx in this._users) {
        const user = this._users[idx];
        if (user.user !== me && user[what] >= seq) {
          count++;
        }
      }
    }
    return count;
  }
  msgReadCount(seq) {
    return this.msgReceiptCount('read', seq);
  }
  msgRecvCount(seq) {
    return this.msgReceiptCount('recv', seq);
  }
  msgHasMoreMessages(newer) {
    return newer ? this.seq > this._maxSeq : this._minSeq > 1 && !this._noEarlierMsgs;
  }
  isNewMessage(seqId) {
    return this._maxSeq <= seqId;
  }
  flushMessage(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    delete this._messageVersions[seqId];
    if (idx >= 0) {
      this._tinode._db.remMessages(this.name, seqId);
      return this._messages.delAt(idx);
    }
    return undefined;
  }
  flushMessageRange(fromId, untilId) {
    this._tinode._db.remMessages(this.name, fromId, untilId);
    for (let i = fromId; i < untilId; i++) {
      delete this._messageVersions[i];
    }
    const since = this._messages.find({
      seq: fromId
    }, true);
    return since >= 0 ? this._messages.delRange(since, this._messages.find({
      seq: untilId
    }, true)) : [];
  }
  swapMessageId(pub, newSeqId) {
    const idx = this._messages.find(pub);
    const numMessages = this._messages.length();
    if (0 <= idx && idx < numMessages) {
      this._messages.delAt(idx);
      this._tinode._db.remMessages(this.name, pub.seq);
      pub.seq = newSeqId;
      this._messages.put(pub);
      this._tinode._db.addMessage(pub);
    }
  }
  cancelSend(seqId) {
    const idx = this._messages.find({
      seq: seqId
    });
    if (idx >= 0) {
      const msg = this._messages.getAt(idx);
      const status = this.msgStatus(msg);
      if (status == _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_QUEUED || status == _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_FAILED || status == _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_FATAL) {
        this._tinode._db.remMessages(this.name, seqId);
        msg._cancelled = true;
        this._messages.delAt(idx);
        if (this.onData) {
          this.onData();
        }
        return true;
      }
    }
    return false;
  }
  getType() {
    return Topic.topicType(this.name);
  }
  getAccessMode() {
    return this.acs;
  }
  setAccessMode(acs) {
    return this.acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](acs);
  }
  getDefaultAccess() {
    return this.defacs;
  }
  startMetaQuery() {
    return new _meta_builder_js__WEBPACK_IMPORTED_MODULE_5__["default"](this);
  }
  isArchived() {
    return this.private && !!this.private.arch;
  }
  isMeType() {
    return Topic.isMeTopicName(this.name);
  }
  isChannelType() {
    return Topic.isChannelTopicName(this.name);
  }
  isGroupType() {
    return Topic.isGroupTopicName(this.name);
  }
  isP2PType() {
    return Topic.isP2PTopicName(this.name);
  }
  isCommType() {
    return Topic.isCommTopicName(this.name);
  }
  msgStatus(msg, upd) {
    let status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_NONE;
    if (this._tinode.isMe(msg.from)) {
      if (msg._sending) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_SENDING;
      } else if (msg._fatal || msg._cancelled) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_FATAL;
      } else if (msg._failed) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_FAILED;
      } else if (msg.seq >= _config_js__WEBPACK_IMPORTED_MODULE_3__.LOCAL_SEQID) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_QUEUED;
      } else if (this.msgReadCount(msg.seq) > 0) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_READ;
      } else if (this.msgRecvCount(msg.seq) > 0) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_RECEIVED;
      } else if (msg.seq > 0) {
        status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_SENT;
      }
    } else {
      status = _config_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGE_STATUS_TO_ME;
    }
    if (upd && msg._status != status) {
      msg._status = status;
      this._tinode._db.updMessageStatus(this.name, msg.seq, status);
    }
    return status;
  }
  _isReplacementMsg(pub) {
    return pub.head && pub.head.replace;
  }
  _maybeUpdateMessageVersionsCache(msg) {
    if (!this._isReplacementMsg(msg)) {
      if (this._messageVersions[msg.seq]) {
        this._messageVersions[msg.seq].filter(version => version.from == msg.from);
        if (this._messageVersions[msg.seq].isEmpty()) {
          delete this._messageVersions[msg.seq];
        }
      }
      return;
    }
    const targetSeq = parseInt(msg.head.replace.split(':')[1]);
    if (targetSeq > msg.seq) {
      return;
    }
    const targetMsg = this.findMessage(targetSeq);
    if (targetMsg && targetMsg.from != msg.from) {
      return;
    }
    const versions = this._messageVersions[targetSeq] || new _cbuffer_js__WEBPACK_IMPORTED_MODULE_1__["default"]((a, b) => {
      return a.seq - b.seq;
    }, true);
    versions.put(msg);
    this._messageVersions[targetSeq] = versions;
  }
  _routeData(data) {
    if (data.content) {
      if (!this.touched || this.touched < data.ts) {
        this.touched = data.ts;
        this._tinode._db.updTopic(this);
      }
    }
    if (data.seq > this._maxSeq) {
      this._maxSeq = data.seq;
      this.msgStatus(data, true);
      clearTimeout(this._recvNotificationTimer);
      this._recvNotificationTimer = setTimeout(_ => {
        this._recvNotificationTimer = null;
        this.noteRecv(this._maxSeq);
      }, _config_js__WEBPACK_IMPORTED_MODULE_3__.RECV_TIMEOUT);
    }
    if (data.seq < this._minSeq || this._minSeq == 0) {
      this._minSeq = data.seq;
    }
    const outgoing = !this.isChannelType() && !data.from || this._tinode.isMe(data.from);
    if (data.head && data.head.webrtc && data.head.mime == _drafty_js__WEBPACK_IMPORTED_MODULE_4___default().getContentType() && data.content) {
      data.content = _drafty_js__WEBPACK_IMPORTED_MODULE_4___default().updateVideoCall(data.content, {
        state: data.head.webrtc,
        duration: data.head['webrtc-duration'],
        incoming: !outgoing
      });
    }
    if (!data._noForwarding) {
      this._messages.put(data);
      this._tinode._db.addMessage(data);
      this._maybeUpdateMessageVersionsCache(data);
    }
    if (this.onData) {
      this.onData(data);
    }
    const what = outgoing ? 'read' : 'msg';
    this._updateMyReadRecv(what, data.seq, data.ts);
    if (!outgoing && data.from) {
      this._routeInfo({
        what: 'read',
        from: data.from,
        seq: data.seq,
        _noForwarding: true
      });
    }
    this._tinode.getMeTopic()._refreshContact(what, this);
  }
  _routeMeta(meta) {
    if (meta.desc) {
      this._processMetaDesc(meta.desc);
    }
    if (meta.sub && meta.sub.length > 0) {
      this._processMetaSubs(meta.sub);
    }
    if (meta.del) {
      this._processDelMessages(meta.del.clear, meta.del.delseq);
    }
    if (meta.tags) {
      this._processMetaTags(meta.tags);
    }
    if (meta.cred) {
      this._processMetaCreds(meta.cred);
    }
    if (this.onMeta) {
      this.onMeta(meta);
    }
  }
  _routePres(pres) {
    let user, uid;
    switch (pres.what) {
      case 'del':
        this._processDelMessages(pres.clear, pres.delseq);
        break;
      case 'on':
      case 'off':
        user = this._users[pres.src];
        if (user) {
          user.online = pres.what == 'on';
        } else {
          this._tinode.logger("WARNING: Presence update for an unknown user", this.name, pres.src);
        }
        break;
      case 'term':
        this._resetSub();
        break;
      case 'upd':
        if (pres.src && !this._tinode.isTopicCached(pres.src)) {
          this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());
        }
        break;
      case 'acs':
        uid = pres.src || this._tinode.getCurrentUserID();
        user = this._users[uid];
        if (!user) {
          const acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]().updateAll(pres.dacs);
          if (acs && acs.mode != _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]._NONE) {
            user = this._cacheGetUser(uid);
            if (!user) {
              user = {
                user: uid,
                acs: acs
              };
              this.getMeta(this.startMetaQuery().withOneSub(undefined, uid).build());
            } else {
              user.acs = acs;
            }
            user.updated = new Date();
            this._processMetaSubs([user]);
          }
        } else {
          user.acs.updateAll(pres.dacs);
          this._processMetaSubs([{
            user: uid,
            updated: new Date(),
            acs: user.acs
          }]);
        }
        break;
      default:
        this._tinode.logger("INFO: Ignored presence update", pres.what);
    }
    if (this.onPres) {
      this.onPres(pres);
    }
  }
  _routeInfo(info) {
    switch (info.what) {
      case 'recv':
      case 'read':
        const user = this._users[info.from];
        if (user) {
          user[info.what] = info.seq;
          if (user.recv < user.read) {
            user.recv = user.read;
          }
        }
        const msg = this.latestMessage();
        if (msg) {
          this.msgStatus(msg, true);
        }
        if (this._tinode.isMe(info.from) && !info._noForwarding) {
          this._updateMyReadRecv(info.what, info.seq);
        }
        this._tinode.getMeTopic()._refreshContact(info.what, this);
        break;
      case 'kp':
      case 'kpa':
      case 'kpv':
        break;
      case 'call':
        break;
      default:
        this._tinode.logger("INFO: Ignored info update", info.what);
    }
    if (this.onInfo) {
      this.onInfo(info);
    }
  }
  _processMetaDesc(desc) {
    if (this.isP2PType()) {
      delete desc.defacs;
      this._tinode._db.updUser(this.name, desc.public);
    }
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeObj)(this, desc);
    this._tinode._db.updTopic(this);
    if (this.name !== _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME && !desc._noForwarding) {
      const me = this._tinode.getMeTopic();
      if (me.onMetaSub) {
        me.onMetaSub(this);
      }
      if (me.onSubsUpdated) {
        me.onSubsUpdated([this.name], 1);
      }
    }
    if (this.onMetaDesc) {
      this.onMetaDesc(this);
    }
  }
  _processMetaSubs(subs) {
    for (let idx in subs) {
      const sub = subs[idx];
      sub.online = !!sub.online;
      this._lastSubsUpdate = new Date(Math.max(this._lastSubsUpdate, sub.updated));
      let user = null;
      if (!sub.deleted) {
        if (this._tinode.isMe(sub.user) && sub.acs) {
          this._processMetaDesc({
            updated: sub.updated,
            touched: sub.touched,
            acs: sub.acs
          });
        }
        user = this._updateCachedUser(sub.user, sub);
      } else {
        delete this._users[sub.user];
        user = sub;
      }
      if (this.onMetaSub) {
        this.onMetaSub(user);
      }
    }
    if (this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._users));
    }
  }
  _processMetaTags(tags) {
    if (tags.length == 1 && tags[0] == _config_js__WEBPACK_IMPORTED_MODULE_3__.DEL_CHAR) {
      tags = [];
    }
    this._tags = tags;
    if (this.onTagsUpdated) {
      this.onTagsUpdated(tags);
    }
  }
  _processMetaCreds(creds) {}
  _processDelMessages(clear, delseq) {
    this._maxDel = Math.max(clear, this._maxDel);
    this.clear = Math.max(clear, this.clear);
    const topic = this;
    let count = 0;
    if (Array.isArray(delseq)) {
      delseq.forEach(function (range) {
        if (!range.hi) {
          count++;
          topic.flushMessage(range.low);
        } else {
          for (let i = range.low; i < range.hi; i++) {
            count++;
            topic.flushMessage(i);
          }
        }
      });
    }
    if (count > 0) {
      if (this.onData) {
        this.onData();
      }
    }
  }
  _allMessagesReceived(count) {
    if (this.onAllMessagesReceived) {
      this.onAllMessagesReceived(count);
    }
  }
  _resetSub() {
    this._attached = false;
  }
  _gone() {
    this._messages.reset();
    this._tinode._db.remMessages(this.name);
    this._users = {};
    this.acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](null);
    this.private = null;
    this.public = null;
    this.trusted = null;
    this._maxSeq = 0;
    this._minSeq = 0;
    this._attached = false;
    const me = this._tinode.getMeTopic();
    if (me) {
      me._routePres({
        _noForwarding: true,
        what: 'gone',
        topic: _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME,
        src: this.name
      });
    }
    if (this.onDeleteTopic) {
      this.onDeleteTopic();
    }
  }
  _updateCachedUser(uid, obj) {
    let cached = this._cacheGetUser(uid);
    cached = (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeObj)(cached || {}, obj);
    this._cachePutUser(uid, cached);
    return (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeToCache)(this._users, uid, cached);
  }
  _getQueuedSeqId() {
    return this._queuedSeqId++;
  }
  _loadMessages(db, params) {
    const {
      since,
      before,
      limit
    } = params || {};
    return db.readMessages(this.name, {
      since: since,
      before: before,
      limit: limit || _config_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_MESSAGES_PAGE
    }).then(msgs => {
      msgs.forEach(data => {
        if (data.seq > this._maxSeq) {
          this._maxSeq = data.seq;
        }
        if (data.seq < this._minSeq || this._minSeq == 0) {
          this._minSeq = data.seq;
        }
        this._messages.put(data);
        this._maybeUpdateMessageVersionsCache(data);
      });
      return msgs.length;
    });
  }
  _updateReceived(seq, act) {
    this.touched = new Date();
    this.seq = seq | 0;
    if (!act || this._tinode.isMe(act)) {
      this.read = this.read ? Math.max(this.read, this.seq) : this.seq;
      this.recv = this.recv ? Math.max(this.read, this.recv) : this.read;
    }
    this.unread = this.seq - (this.read | 0);
    this._tinode._db.updTopic(this);
  }
}
class TopicMe extends Topic {
  onContactUpdate;
  constructor(callbacks) {
    super(_config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME, callbacks);
    if (callbacks) {
      this.onContactUpdate = callbacks.onContactUpdate;
    }
  }
  _processMetaDesc(desc) {
    const turnOff = desc.acs && !desc.acs.isPresencer() && this.acs && this.acs.isPresencer();
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeObj)(this, desc);
    this._tinode._db.updTopic(this);
    this._updateCachedUser(this._tinode._myUID, desc);
    if (turnOff) {
      this._tinode.mapTopics(cont => {
        if (cont.online) {
          cont.online = false;
          cont.seen = Object.assign(cont.seen || {}, {
            when: new Date()
          });
          this._refreshContact('off', cont);
        }
      });
    }
    if (this.onMetaDesc) {
      this.onMetaDesc(this);
    }
  }
  _processMetaSubs(subs) {
    let updateCount = 0;
    subs.forEach(sub => {
      const topicName = sub.topic;
      if (topicName == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_FND || topicName == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME) {
        return;
      }
      sub.online = !!sub.online;
      let cont = null;
      if (sub.deleted) {
        cont = sub;
        this._tinode.cacheRemTopic(topicName);
        this._tinode._db.remTopic(topicName);
      } else {
        if (typeof sub.seq != 'undefined') {
          sub.seq = sub.seq | 0;
          sub.recv = sub.recv | 0;
          sub.read = sub.read | 0;
          sub.unread = sub.seq - sub.read;
        }
        const topic = this._tinode.getTopic(topicName);
        if (topic._new) {
          delete topic._new;
        }
        cont = (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeObj)(topic, sub);
        this._tinode._db.updTopic(cont);
        if (Topic.isP2PTopicName(topicName)) {
          this._cachePutUser(topicName, cont);
          this._tinode._db.updUser(topicName, cont.public);
        }
        if (!sub._noForwarding && topic) {
          sub._noForwarding = true;
          topic._processMetaDesc(sub);
        }
      }
      updateCount++;
      if (this.onMetaSub) {
        this.onMetaSub(cont);
      }
    });
    if (this.onSubsUpdated && updateCount > 0) {
      const keys = [];
      subs.forEach(s => {
        keys.push(s.topic);
      });
      this.onSubsUpdated(keys, updateCount);
    }
  }
  _processMetaCreds(creds, upd) {
    if (creds.length == 1 && creds[0] == _config_js__WEBPACK_IMPORTED_MODULE_3__.DEL_CHAR) {
      creds = [];
    }
    if (upd) {
      creds.forEach(cr => {
        if (cr.val) {
          let idx = this._credentials.findIndex(el => {
            return el.meth == cr.meth && el.val == cr.val;
          });
          if (idx < 0) {
            if (!cr.done) {
              idx = this._credentials.findIndex(el => {
                return el.meth == cr.meth && !el.done;
              });
              if (idx >= 0) {
                this._credentials.splice(idx, 1);
              }
            }
            this._credentials.push(cr);
          } else {
            this._credentials[idx].done = cr.done;
          }
        } else if (cr.resp) {
          const idx = this._credentials.findIndex(el => {
            return el.meth == cr.meth && !el.done;
          });
          if (idx >= 0) {
            this._credentials[idx].done = true;
          }
        }
      });
    } else {
      this._credentials = creds;
    }
    if (this.onCredsUpdated) {
      this.onCredsUpdated(this._credentials);
    }
  }
  _routePres(pres) {
    if (pres.what == 'term') {
      this._resetSub();
      return;
    }
    if (pres.what == 'upd' && pres.src == _config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_ME) {
      this.getMeta(this.startMetaQuery().withDesc().build());
      return;
    }
    const cont = this._tinode.cacheGetTopic(pres.src);
    if (cont) {
      switch (pres.what) {
        case 'on':
          cont.online = true;
          break;
        case 'off':
          if (cont.online) {
            cont.online = false;
            cont.seen = Object.assign(cont.seen || {}, {
              when: new Date()
            });
          }
          break;
        case 'msg':
          cont._updateReceived(pres.seq, pres.act);
          break;
        case 'upd':
          this.getMeta(this.startMetaQuery().withLaterOneSub(pres.src).build());
          break;
        case 'acs':
          if (!pres.tgt) {
            if (cont.acs) {
              cont.acs.updateAll(pres.dacs);
            } else {
              cont.acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]().updateAll(pres.dacs);
            }
            cont.touched = new Date();
          }
          break;
        case 'ua':
          cont.seen = {
            when: new Date(),
            ua: pres.ua
          };
          break;
        case 'recv':
          pres.seq = pres.seq | 0;
          cont.recv = cont.recv ? Math.max(cont.recv, pres.seq) : pres.seq;
          break;
        case 'read':
          pres.seq = pres.seq | 0;
          cont.read = cont.read ? Math.max(cont.read, pres.seq) : pres.seq;
          cont.recv = cont.recv ? Math.max(cont.read, cont.recv) : cont.recv;
          cont.unread = cont.seq - cont.read;
          break;
        case 'gone':
          this._tinode.cacheRemTopic(pres.src);
          if (!cont._deleted) {
            cont._deleted = true;
            cont._attached = false;
            this._tinode._db.markTopicAsDeleted(pres.src, true);
          } else {
            this._tinode._db.remTopic(pres.src);
          }
          break;
        case 'del':
          break;
        default:
          this._tinode.logger("INFO: Unsupported presence update in 'me'", pres.what);
      }
      this._refreshContact(pres.what, cont);
    } else {
      if (pres.what == 'acs') {
        const acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](pres.dacs);
        if (!acs || acs.mode == _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]._INVALID) {
          this._tinode.logger("ERROR: Invalid access mode update", pres.src, pres.dacs);
          return;
        } else if (acs.mode == _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]._NONE) {
          this._tinode.logger("WARNING: Removing non-existent subscription", pres.src, pres.dacs);
          return;
        } else {
          this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());
          const dummy = this._tinode.getTopic(pres.src);
          dummy.online = false;
          dummy.acs = acs;
          this._tinode._db.updTopic(dummy);
        }
      } else if (pres.what == 'tags') {
        this.getMeta(this.startMetaQuery().withTags().build());
      } else if (pres.what == 'msg') {
        this.getMeta(this.startMetaQuery().withOneSub(undefined, pres.src).build());
        const dummy = this._tinode.getTopic(pres.src);
        dummy._deleted = false;
        this._tinode._db.updTopic(dummy);
      }
      this._refreshContact(pres.what, cont);
    }
    if (this.onPres) {
      this.onPres(pres);
    }
  }
  _refreshContact(what, cont) {
    if (this.onContactUpdate) {
      this.onContactUpdate(what, cont);
    }
  }
  publish() {
    return Promise.reject(new Error("Publishing to 'me' is not supported"));
  }
  delCredential(method, value) {
    if (!this._attached) {
      return Promise.reject(new Error("Cannot delete credential in inactive 'me' topic"));
    }
    return this._tinode.delCredential(method, value).then(ctrl => {
      const index = this._credentials.findIndex(el => {
        return el.meth == method && el.val == value;
      });
      if (index > -1) {
        this._credentials.splice(index, 1);
      }
      if (this.onCredsUpdated) {
        this.onCredsUpdated(this._credentials);
      }
      return ctrl;
    });
  }
  contacts(callback, filter, context) {
    this._tinode.mapTopics((c, idx) => {
      if (c.isCommType() && (!filter || filter(c))) {
        callback.call(context, c, idx);
      }
    });
  }
  getContact(name) {
    return this._tinode.cacheGetTopic(name);
  }
  getAccessMode(name) {
    if (name) {
      const cont = this._tinode.cacheGetTopic(name);
      return cont ? cont.acs : null;
    }
    return this.acs;
  }
  isArchived(name) {
    const cont = this._tinode.cacheGetTopic(name);
    return cont && cont.private && !!cont.private.arch;
  }
  getCredentials() {
    return this._credentials;
  }
}
class TopicFnd extends Topic {
  _contacts = {};
  constructor(callbacks) {
    super(_config_js__WEBPACK_IMPORTED_MODULE_3__.TOPIC_FND, callbacks);
  }
  _processMetaSubs(subs) {
    let updateCount = Object.getOwnPropertyNames(this._contacts).length;
    this._contacts = {};
    for (let idx in subs) {
      let sub = subs[idx];
      const indexBy = sub.topic ? sub.topic : sub.user;
      sub = (0,_utils_js__WEBPACK_IMPORTED_MODULE_6__.mergeToCache)(this._contacts, indexBy, sub);
      updateCount++;
      if (this.onMetaSub) {
        this.onMetaSub(sub);
      }
    }
    if (updateCount > 0 && this.onSubsUpdated) {
      this.onSubsUpdated(Object.keys(this._contacts));
    }
  }
  publish() {
    return Promise.reject(new Error("Publishing to 'fnd' is not supported"));
  }
  setMeta(params) {
    return Object.getPrototypeOf(TopicFnd.prototype).setMeta.call(this, params).then(_ => {
      if (Object.keys(this._contacts).length > 0) {
        this._contacts = {};
        if (this.onSubsUpdated) {
          this.onSubsUpdated([]);
        }
      }
    });
  }
  contacts(callback, context) {
    const cb = callback || this.onMetaSub;
    if (cb) {
      for (let idx in this._contacts) {
        cb.call(context, this._contacts[idx], idx, this._contacts);
      }
    }
  }
}

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isUrlRelative: () => (/* binding */ isUrlRelative),
/* harmony export */   jsonParseHelper: () => (/* binding */ jsonParseHelper),
/* harmony export */   mergeObj: () => (/* binding */ mergeObj),
/* harmony export */   mergeToCache: () => (/* binding */ mergeToCache),
/* harmony export */   normalizeArray: () => (/* binding */ normalizeArray),
/* harmony export */   rfc3339DateString: () => (/* binding */ rfc3339DateString),
/* harmony export */   simplify: () => (/* binding */ simplify)
/* harmony export */ });
/* harmony import */ var _access_mode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./access-mode.js */ "./src/access-mode.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");




function jsonParseHelper(key, val) {
  if (typeof val == 'string' && val.length >= 20 && val.length <= 24 && ['ts', 'touched', 'updated', 'created', 'when', 'deleted', 'expires'].includes(key)) {
    const date = new Date(val);
    if (!isNaN(date)) {
      return date;
    }
  } else if (key === 'acs' && typeof val === 'object') {
    return new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](val);
  }
  return val;
}
function isUrlRelative(url) {
  return url && !/^\s*([a-z][a-z0-9+.-]*:|\/\/)/im.test(url);
}
function isValidDate(d) {
  return d instanceof Date && !isNaN(d) && d.getTime() != 0;
}
function rfc3339DateString(d) {
  if (!isValidDate(d)) {
    return undefined;
  }
  const pad = function (val, sp) {
    sp = sp || 2;
    return '0'.repeat(sp - ('' + val).length) + val;
  };
  const millis = d.getUTCMilliseconds();
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + (millis ? '.' + pad(millis, 3) : '') + 'Z';
}
function mergeObj(dst, src, ignore) {
  if (typeof src != 'object') {
    if (src === undefined) {
      return dst;
    }
    if (src === _config_js__WEBPACK_IMPORTED_MODULE_1__.DEL_CHAR) {
      return undefined;
    }
    return src;
  }
  if (src === null) {
    return src;
  }
  if (src instanceof Date && !isNaN(src)) {
    return !dst || !(dst instanceof Date) || isNaN(dst) || dst < src ? src : dst;
  }
  if (src instanceof _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    return new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](src);
  }
  if (src instanceof Array) {
    return src;
  }
  if (!dst || dst === _config_js__WEBPACK_IMPORTED_MODULE_1__.DEL_CHAR) {
    dst = src.constructor();
  }
  for (let prop in src) {
    if (src.hasOwnProperty(prop) && (!ignore || !ignore[prop]) && prop != '_noForwarding') {
      try {
        dst[prop] = mergeObj(dst[prop], src[prop]);
      } catch (err) {}
    }
  }
  return dst;
}
function mergeToCache(cache, key, newval, ignore) {
  cache[key] = mergeObj(cache[key], newval, ignore);
  return cache[key];
}
function simplify(obj) {
  Object.keys(obj).forEach(key => {
    if (key[0] == '_') {
      delete obj[key];
    } else if (!obj[key]) {
      delete obj[key];
    } else if (Array.isArray(obj[key]) && obj[key].length == 0) {
      delete obj[key];
    } else if (!obj[key]) {
      delete obj[key];
    } else if (obj[key] instanceof Date) {
      if (!isValidDate(obj[key])) {
        delete obj[key];
      }
    } else if (typeof obj[key] == 'object') {
      simplify(obj[key]);
      if (Object.getOwnPropertyNames(obj[key]).length == 0) {
        delete obj[key];
      }
    }
  });
  return obj;
}
;
function normalizeArray(arr) {
  let out = [];
  if (Array.isArray(arr)) {
    for (let i = 0, l = arr.length; i < l; i++) {
      let t = arr[i];
      if (t) {
        t = t.trim().toLowerCase();
        if (t.length > 1) {
          out.push(t);
        }
      }
    }
    out.sort().filter(function (item, pos, ary) {
      return !pos || item != ary[pos - 1];
    });
  }
  if (out.length == 0) {
    out.push(_config_js__WEBPACK_IMPORTED_MODULE_1__.DEL_CHAR);
  }
  return out;
}

/***/ }),

/***/ "./version.js":
/*!********************!*\
  !*** ./version.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PACKAGE_VERSION: () => (/* binding */ PACKAGE_VERSION)
/* harmony export */ });
const PACKAGE_VERSION = "0.22.12";

/***/ }),

/***/ "./node_modules/tslib/tslib.es6.mjs":
/*!******************************************!*\
  !*** ./node_modules/tslib/tslib.es6.mjs ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __addDisposableResource: () => (/* binding */ __addDisposableResource),
/* harmony export */   __assign: () => (/* binding */ __assign),
/* harmony export */   __asyncDelegator: () => (/* binding */ __asyncDelegator),
/* harmony export */   __asyncGenerator: () => (/* binding */ __asyncGenerator),
/* harmony export */   __asyncValues: () => (/* binding */ __asyncValues),
/* harmony export */   __await: () => (/* binding */ __await),
/* harmony export */   __awaiter: () => (/* binding */ __awaiter),
/* harmony export */   __classPrivateFieldGet: () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   __classPrivateFieldIn: () => (/* binding */ __classPrivateFieldIn),
/* harmony export */   __classPrivateFieldSet: () => (/* binding */ __classPrivateFieldSet),
/* harmony export */   __createBinding: () => (/* binding */ __createBinding),
/* harmony export */   __decorate: () => (/* binding */ __decorate),
/* harmony export */   __disposeResources: () => (/* binding */ __disposeResources),
/* harmony export */   __esDecorate: () => (/* binding */ __esDecorate),
/* harmony export */   __exportStar: () => (/* binding */ __exportStar),
/* harmony export */   __extends: () => (/* binding */ __extends),
/* harmony export */   __generator: () => (/* binding */ __generator),
/* harmony export */   __importDefault: () => (/* binding */ __importDefault),
/* harmony export */   __importStar: () => (/* binding */ __importStar),
/* harmony export */   __makeTemplateObject: () => (/* binding */ __makeTemplateObject),
/* harmony export */   __metadata: () => (/* binding */ __metadata),
/* harmony export */   __param: () => (/* binding */ __param),
/* harmony export */   __propKey: () => (/* binding */ __propKey),
/* harmony export */   __read: () => (/* binding */ __read),
/* harmony export */   __rest: () => (/* binding */ __rest),
/* harmony export */   __runInitializers: () => (/* binding */ __runInitializers),
/* harmony export */   __setFunctionName: () => (/* binding */ __setFunctionName),
/* harmony export */   __spread: () => (/* binding */ __spread),
/* harmony export */   __spreadArray: () => (/* binding */ __spreadArray),
/* harmony export */   __spreadArrays: () => (/* binding */ __spreadArrays),
/* harmony export */   __values: () => (/* binding */ __values),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
  __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
  }
  return __assign.apply(this, arguments);
}

function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
      }
  return t;
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); }
}

function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
      }
      else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
      }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};

function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};

function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
};

function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

/** @deprecated */
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
  return ar;
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
  function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
  function fulfill(value) { resume("next", value); }
  function reject(value) { resume("throw", value); }
  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
  return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}

function __importDefault(mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose;
    if (async) {
        if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
        dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
        if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
        dispose = value[Symbol.dispose];
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    env.stack.push({ value: value, dispose: dispose, async: async });
  }
  else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  function next() {
    while (env.stack.length) {
      var rec = env.stack.pop();
      try {
        var result = rec.dispose && rec.dispose.call(rec.value);
        if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
      }
      catch (e) {
          fail(e);
      }
    }
    if (env.hasError) throw env.error;
  }
  return next();
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __createBinding,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __spreadArray,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  __classPrivateFieldIn,
  __addDisposableResource,
  __disposeResources,
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************!*\
  !*** ./src/tinode.js ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AccessMode: () => (/* reexport safe */ _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   Drafty: () => (/* reexport default from dynamic */ _drafty_js__WEBPACK_IMPORTED_MODULE_6___default.a),
/* harmony export */   Tinode: () => (/* binding */ Tinode)
/* harmony export */ });
/* harmony import */ var _access_mode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./access-mode.js */ "./src/access-mode.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config.js */ "./src/config.js");
/* harmony import */ var _comm_error_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./comm-error.js */ "./src/comm-error.js");
/* harmony import */ var _connection_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./connection.js */ "./src/connection.js");
/* harmony import */ var _db_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./db.js */ "./src/db.js");
/* harmony import */ var _formatjs_intl_segmenter_polyfill__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @formatjs/intl-segmenter/polyfill */ "./node_modules/@formatjs/intl-segmenter/polyfill.js");
/* harmony import */ var _drafty_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./drafty.js */ "./src/drafty.js");
/* harmony import */ var _drafty_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_drafty_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _large_file_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./large-file.js */ "./src/large-file.js");
/* harmony import */ var _meta_builder_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./meta-builder.js */ "./src/meta-builder.js");
/* harmony import */ var _topic_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./topic.js */ "./src/topic.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./utils.js */ "./src/utils.js");
/**
 * @module tinode-sdk
 *
 * @copyright 2015-2022 Tinode LLC.
 * @summary Javascript bindings for Tinode.
 * @license Apache 2.0
 * @version 0.20
 *
 * See <a href="https://github.com/tinode/webapp">https://github.com/tinode/webapp</a> for real-life usage.
 *
 * @example
 * <head>
 * <script src=".../tinode.js"></script>
 * </head>
 *
 * <body>
 *  ...
 * <script>
 *  // Instantiate tinode.
 *  const tinode = new Tinode(config, _ => {
 *    // Called on init completion.
 *  });
 *  tinode.enableLogging(true);
 *  tinode.onDisconnect = err => {
 *    // Handle disconnect.
 *  };
 *  // Connect to the server.
 *  tinode.connect('https://example.com/').then(_ => {
 *    // Connected. Login now.
 *    return tinode.loginBasic(login, password);
 *  }).then(ctrl => {
 *    // Logged in fine, attach callbacks, subscribe to 'me'.
 *    const me = tinode.getMeTopic();
 *    me.onMetaDesc = function(meta) { ... };
 *    // Subscribe, fetch topic description and the list of contacts.
 *    me.subscribe({get: {desc: {}, sub: {}}});
 *  }).catch(err => {
 *    // Login or subscription failed, do something.
 *    ...
 *  });
 *  ...
 * </script>
 * </body>
 */













let WebSocketProvider;
if (typeof WebSocket != 'undefined') {
  WebSocketProvider = WebSocket;
}
let XHRProvider;
if (typeof XMLHttpRequest != 'undefined') {
  XHRProvider = XMLHttpRequest;
}
let IndexedDBProvider;
if (typeof indexedDB != 'undefined') {
  IndexedDBProvider = indexedDB;
}

initForNonBrowserApp();
function initForNonBrowserApp() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  if (typeof btoa == 'undefined') {
    __webpack_require__.g.btoa = function () {
      let input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      let str = input;
      let output = '';
      for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
        charCode = str.charCodeAt(i += 3 / 4);
        if (charCode > 0xFF) {
          throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        }
        block = block << 8 | charCode;
      }
      return output;
    };
  }
  if (typeof atob == 'undefined') {
    __webpack_require__.g.atob = function () {
      let input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      let str = input.replace(/=+$/, '');
      let output = '';
      if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    };
  }
  if (typeof window == 'undefined') {
    __webpack_require__.g.window = {
      WebSocket: WebSocketProvider,
      XMLHttpRequest: XHRProvider,
      indexedDB: IndexedDBProvider,
      URL: {
        createObjectURL: function () {
          throw new Error("Unable to use URL.createObjectURL in a non-browser application");
        }
      }
    };
  }
  _connection_js__WEBPACK_IMPORTED_MODULE_3__["default"].setNetworkProviders(WebSocketProvider, XHRProvider);
  _large_file_js__WEBPACK_IMPORTED_MODULE_7__["default"].setNetworkProvider(XHRProvider);
  _db_js__WEBPACK_IMPORTED_MODULE_4__["default"].setDatabaseProvider(IndexedDBProvider);
}
function detectTransport() {
  if (typeof window == 'object') {
    if (window['WebSocket']) {
      return 'ws';
    } else if (window['XMLHttpRequest']) {
      return 'lp';
    }
  }
  return null;
}
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}
function jsonBuildHelper(key, val) {
  if (val instanceof Date) {
    val = (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.rfc3339DateString)(val);
  } else if (val instanceof _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]) {
    val = val.jsonHelper();
  } else if (val === undefined || val === null || val === false || Array.isArray(val) && val.length == 0 || typeof val == 'object' && Object.keys(val).length == 0) {
    return undefined;
  }
  return val;
}
;
function jsonLoggerHelper(key, val) {
  if (typeof val == 'string' && val.length > 128) {
    return '<' + val.length + ', bytes: ' + val.substring(0, 12) + '...' + val.substring(val.length - 12) + '>';
  }
  return jsonBuildHelper(key, val);
}
;
function getBrowserInfo(ua, product) {
  ua = ua || '';
  let reactnative = '';
  if (/reactnative/i.test(product)) {
    reactnative = 'ReactNative; ';
  }
  let result;
  ua = ua.replace(' (KHTML, like Gecko)', '');
  let m = ua.match(/(AppleWebKit\/[.\d]+)/i);
  if (m) {
    const priority = ['edg', 'chrome', 'safari', 'mobile', 'version'];
    let tmp = ua.substr(m.index + m[0].length).split(' ');
    let tokens = [];
    let version;
    for (let i = 0; i < tmp.length; i++) {
      let m2 = /([\w.]+)[\/]([\.\d]+)/.exec(tmp[i]);
      if (m2) {
        tokens.push([m2[1], m2[2], priority.findIndex(e => {
          return m2[1].toLowerCase().startsWith(e);
        })]);
        if (m2[1] == 'Version') {
          version = m2[2];
        }
      }
    }
    tokens.sort((a, b) => {
      return a[2] - b[2];
    });
    if (tokens.length > 0) {
      if (tokens[0][0].toLowerCase().startsWith('edg')) {
        tokens[0][0] = 'Edge';
      } else if (tokens[0][0] == 'OPR') {
        tokens[0][0] = 'Opera';
      } else if (tokens[0][0] == 'Safari' && version) {
        tokens[0][1] = version;
      }
      result = tokens[0][0] + '/' + tokens[0][1];
    } else {
      result = m[1];
    }
  } else if (/firefox/i.test(ua)) {
    m = /Firefox\/([.\d]+)/g.exec(ua);
    if (m) {
      result = 'Firefox/' + m[1];
    } else {
      result = 'Firefox/?';
    }
  } else {
    m = /([\w.]+)\/([.\d]+)/.exec(ua);
    if (m) {
      result = m[1] + '/' + m[2];
    } else {
      m = ua.split(' ');
      result = m[0];
    }
  }
  m = result.split('/');
  if (m.length > 1) {
    const v = m[1].split('.');
    const minor = v[1] ? '.' + v[1].substr(0, 2) : '';
    result = `${m[0]}/${v[0]}${minor}`;
  }
  return reactnative + result;
}
class Tinode {
  _host;
  _secure;
  _appName;
  _apiKey;
  _browser = '';
  _platform;
  _hwos = 'undefined';
  _humanLanguage = 'xx';
  _loggingEnabled = false;
  _trimLongStrings = false;
  _myUID = null;
  _authenticated = false;
  _login = null;
  _authToken = null;
  _inPacketCount = 0;
  _messageId = Math.floor(Math.random() * 0xFFFF + 0xFFFF);
  _serverInfo = null;
  _deviceToken = null;
  _pendingPromises = {};
  _expirePromises = null;
  _connection = null;
  _persist = false;
  _db = null;
  _cache = {};
  constructor(config, onComplete) {
    this._host = config.host;
    this._secure = config.secure;
    this._appName = config.appName || "Undefined";
    this._apiKey = config.apiKey;
    this._platform = config.platform || 'web';
    if (typeof navigator != 'undefined') {
      this._browser = getBrowserInfo(navigator.userAgent, navigator.product);
      this._hwos = navigator.platform;
      this._humanLanguage = navigator.language || 'en-US';
    }
    _connection_js__WEBPACK_IMPORTED_MODULE_3__["default"].logger = this.logger;
    (_drafty_js__WEBPACK_IMPORTED_MODULE_6___default().logger) = this.logger;
    if (config.transport != 'lp' && config.transport != 'ws') {
      config.transport = detectTransport();
    }
    this._connection = new _connection_js__WEBPACK_IMPORTED_MODULE_3__["default"](config, _config_js__WEBPACK_IMPORTED_MODULE_1__.PROTOCOL_VERSION, true);
    this._connection.onMessage = data => {
      this.#dispatchMessage(data);
    };
    this._connection.onOpen = _ => this.#connectionOpen();
    this._connection.onDisconnect = (err, code) => this.#disconnected(err, code);
    this._connection.onAutoreconnectIteration = (timeout, promise) => {
      if (this.onAutoreconnectIteration) {
        this.onAutoreconnectIteration(timeout, promise);
      }
    };
    this._persist = config.persist;
    this._db = new _db_js__WEBPACK_IMPORTED_MODULE_4__["default"](err => {
      this.logger('DB', err);
    }, this.logger);
    if (this._persist) {
      const prom = [];
      this._db.initDatabase().then(_ => {
        return this._db.mapTopics(data => {
          let topic = this.#cacheGet('topic', data.name);
          if (topic) {
            return;
          }
          if (data.name == _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_ME) {
            topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.TopicMe();
          } else if (data.name == _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_FND) {
            topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.TopicFnd();
          } else {
            topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic(data.name);
          }
          this._db.deserializeTopic(topic, data);
          this.#attachCacheToTopic(topic);
          topic._cachePutSelf();
          delete topic._new;
          prom.push(topic._loadMessages(this._db));
        });
      }).then(_ => {
        return this._db.mapUsers(data => {
          this.#cachePut('user', data.uid, (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.mergeObj)({}, data.public));
        });
      }).then(_ => {
        return Promise.all(prom);
      }).then(_ => {
        if (onComplete) {
          onComplete();
        }
        this.logger("Persistent cache initialized.");
      }).catch(err => {
        if (onComplete) {
          onComplete(err);
        }
        this.logger("Failed to initialize persistent cache:", err);
      });
    } else {
      this._db.deleteDatabase().then(_ => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }
  logger(str) {
    if (this._loggingEnabled) {
      const d = new Date();
      const dateString = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2) + ':' + ('0' + d.getUTCSeconds()).slice(-2) + '.' + ('00' + d.getUTCMilliseconds()).slice(-3);
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      console.log('[' + dateString + ']', str, args.join(' '));
    }
  }
  #makePromise(id) {
    let promise = null;
    if (id) {
      promise = new Promise((resolve, reject) => {
        this._pendingPromises[id] = {
          'resolve': resolve,
          'reject': reject,
          'ts': new Date()
        };
      });
    }
    return promise;
  }
  #execPromise(id, code, onOK, errorText) {
    const callbacks = this._pendingPromises[id];
    if (callbacks) {
      delete this._pendingPromises[id];
      if (code >= 200 && code < 400) {
        if (callbacks.resolve) {
          callbacks.resolve(onOK);
        }
      } else if (callbacks.reject) {
        callbacks.reject(new _comm_error_js__WEBPACK_IMPORTED_MODULE_2__["default"](errorText, code));
      }
    }
  }
  #send(pkt, id) {
    let promise;
    if (id) {
      promise = this.#makePromise(id);
    }
    pkt = (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.simplify)(pkt);
    let msg = JSON.stringify(pkt);
    this.logger("out: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : msg));
    try {
      this._connection.sendText(msg);
    } catch (err) {
      if (id) {
        this.#execPromise(id, _connection_js__WEBPACK_IMPORTED_MODULE_3__["default"].NETWORK_ERROR, null, err.message);
      } else {
        throw err;
      }
    }
    return promise;
  }
  #dispatchMessage(data) {
    if (!data) return;
    this._inPacketCount++;
    if (this.onRawMessage) {
      this.onRawMessage(data);
    }
    if (data === '0') {
      if (this.onNetworkProbe) {
        this.onNetworkProbe();
      }
      return;
    }
    let pkt = JSON.parse(data, _utils_js__WEBPACK_IMPORTED_MODULE_10__.jsonParseHelper);
    if (!pkt) {
      this.logger("in: " + data);
      this.logger("ERROR: failed to parse data");
    } else {
      this.logger("in: " + (this._trimLongStrings ? JSON.stringify(pkt, jsonLoggerHelper) : data));
      if (this.onMessage) {
        this.onMessage(pkt);
      }
      if (pkt.ctrl) {
        if (this.onCtrlMessage) {
          this.onCtrlMessage(pkt.ctrl);
        }
        if (pkt.ctrl.id) {
          this.#execPromise(pkt.ctrl.id, pkt.ctrl.code, pkt.ctrl, pkt.ctrl.text);
        }
        setTimeout(_ => {
          if (pkt.ctrl.code == 205 && pkt.ctrl.text == 'evicted') {
            const topic = this.#cacheGet('topic', pkt.ctrl.topic);
            if (topic) {
              topic._resetSub();
              if (pkt.ctrl.params && pkt.ctrl.params.unsub) {
                topic._gone();
              }
            }
          } else if (pkt.ctrl.code < 300 && pkt.ctrl.params) {
            if (pkt.ctrl.params.what == 'data') {
              const topic = this.#cacheGet('topic', pkt.ctrl.topic);
              if (topic) {
                topic._allMessagesReceived(pkt.ctrl.params.count);
              }
            } else if (pkt.ctrl.params.what == 'sub') {
              const topic = this.#cacheGet('topic', pkt.ctrl.topic);
              if (topic) {
                topic._processMetaSubs([]);
              }
            }
          }
        }, 0);
      } else {
        setTimeout(_ => {
          if (pkt.meta) {
            const topic = this.#cacheGet('topic', pkt.meta.topic);
            if (topic) {
              topic._routeMeta(pkt.meta);
            }
            if (pkt.meta.id) {
              this.#execPromise(pkt.meta.id, 200, pkt.meta, 'META');
            }
            if (this.onMetaMessage) {
              this.onMetaMessage(pkt.meta);
            }
          } else if (pkt.data) {
            const topic = this.#cacheGet('topic', pkt.data.topic);
            if (topic) {
              topic._routeData(pkt.data);
            }
            if (this.onDataMessage) {
              this.onDataMessage(pkt.data);
            }
          } else if (pkt.pres) {
            const topic = this.#cacheGet('topic', pkt.pres.topic);
            if (topic) {
              topic._routePres(pkt.pres);
            }
            if (this.onPresMessage) {
              this.onPresMessage(pkt.pres);
            }
          } else if (pkt.info) {
            const topic = this.#cacheGet('topic', pkt.info.topic);
            if (topic) {
              topic._routeInfo(pkt.info);
            }
            if (this.onInfoMessage) {
              this.onInfoMessage(pkt.info);
            }
          } else {
            this.logger("ERROR: Unknown packet received.");
          }
        }, 0);
      }
    }
  }
  #connectionOpen() {
    if (!this._expirePromises) {
      this._expirePromises = setInterval(_ => {
        const err = new _comm_error_js__WEBPACK_IMPORTED_MODULE_2__["default"]("timeout", 504);
        const expires = new Date(new Date().getTime() - _config_js__WEBPACK_IMPORTED_MODULE_1__.EXPIRE_PROMISES_TIMEOUT);
        for (let id in this._pendingPromises) {
          let callbacks = this._pendingPromises[id];
          if (callbacks && callbacks.ts < expires) {
            this.logger("Promise expired", id);
            delete this._pendingPromises[id];
            if (callbacks.reject) {
              callbacks.reject(err);
            }
          }
        }
      }, _config_js__WEBPACK_IMPORTED_MODULE_1__.EXPIRE_PROMISES_PERIOD);
    }
    this.hello();
  }
  #disconnected(err, code) {
    this._inPacketCount = 0;
    this._serverInfo = null;
    this._authenticated = false;
    if (this._expirePromises) {
      clearInterval(this._expirePromises);
      this._expirePromises = null;
    }
    this.#cacheMap('topic', (topic, key) => {
      topic._resetSub();
    });
    for (let key in this._pendingPromises) {
      const callbacks = this._pendingPromises[key];
      if (callbacks && callbacks.reject) {
        callbacks.reject(err);
      }
    }
    this._pendingPromises = {};
    if (this.onDisconnect) {
      this.onDisconnect(err);
    }
  }
  #getUserAgent() {
    return this._appName + ' (' + (this._browser ? this._browser + '; ' : '') + this._hwos + '); ' + _config_js__WEBPACK_IMPORTED_MODULE_1__.LIBRARY;
  }
  #initPacket(type, topic) {
    switch (type) {
      case 'hi':
        return {
          'hi': {
            'id': this.getNextUniqueId(),
            'ver': _config_js__WEBPACK_IMPORTED_MODULE_1__.VERSION,
            'ua': this.#getUserAgent(),
            'dev': this._deviceToken,
            'lang': this._humanLanguage,
            'platf': this._platform
          }
        };
      case 'acc':
        return {
          'acc': {
            'id': this.getNextUniqueId(),
            'user': null,
            'scheme': null,
            'secret': null,
            'tmpscheme': null,
            'tmpsecret': null,
            'login': false,
            'tags': null,
            'desc': {},
            'cred': {}
          }
        };
      case 'login':
        return {
          'login': {
            'id': this.getNextUniqueId(),
            'scheme': null,
            'secret': null
          }
        };
      case 'sub':
        return {
          'sub': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'set': {},
            'get': {}
          }
        };
      case 'leave':
        return {
          'leave': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'unsub': false
          }
        };
      case 'pub':
        return {
          'pub': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'noecho': false,
            'head': null,
            'content': {}
          }
        };
      case 'get':
        return {
          'get': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'what': null,
            'desc': {},
            'sub': {},
            'data': {}
          }
        };
      case 'set':
        return {
          'set': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'desc': {},
            'sub': {},
            'tags': [],
            'ephemeral': {}
          }
        };
      case 'del':
        return {
          'del': {
            'id': this.getNextUniqueId(),
            'topic': topic,
            'what': null,
            'delseq': null,
            'user': null,
            'hard': false
          }
        };
      case 'note':
        return {
          'note': {
            'topic': topic,
            'what': null,
            'seq': undefined
          }
        };
      default:
        throw new Error(`Unknown packet type requested: ${type}`);
    }
  }
  #cachePut(type, name, obj) {
    this._cache[type + ':' + name] = obj;
  }
  #cacheGet(type, name) {
    return this._cache[type + ':' + name];
  }
  #cacheDel(type, name) {
    delete this._cache[type + ':' + name];
  }
  #cacheMap(type, func, context) {
    const key = type ? type + ':' : undefined;
    for (let idx in this._cache) {
      if (!key || idx.indexOf(key) == 0) {
        if (func.call(context, this._cache[idx], idx)) {
          break;
        }
      }
    }
  }
  #attachCacheToTopic(topic) {
    topic._tinode = this;
    topic._cacheGetUser = uid => {
      const pub = this.#cacheGet('user', uid);
      if (pub) {
        return {
          user: uid,
          public: (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.mergeObj)({}, pub)
        };
      }
      return undefined;
    };
    topic._cachePutUser = (uid, user) => {
      this.#cachePut('user', uid, (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.mergeObj)({}, user.public));
    };
    topic._cacheDelUser = uid => {
      this.#cacheDel('user', uid);
    };
    topic._cachePutSelf = _ => {
      this.#cachePut('topic', topic.name, topic);
    };
    topic._cacheDelSelf = _ => {
      this.#cacheDel('topic', topic.name);
    };
  }
  #loginSuccessful(ctrl) {
    if (!ctrl.params || !ctrl.params.user) {
      return ctrl;
    }
    this._myUID = ctrl.params.user;
    this._authenticated = ctrl && ctrl.code >= 200 && ctrl.code < 300;
    if (ctrl.params && ctrl.params.token && ctrl.params.expires) {
      this._authToken = {
        token: ctrl.params.token,
        expires: ctrl.params.expires
      };
    } else {
      this._authToken = null;
    }
    if (this.onLogin) {
      this.onLogin(ctrl.code, ctrl.text);
    }
    return ctrl;
  }
  static credential(meth, val, params, resp) {
    if (typeof meth == 'object') {
      ({
        val,
        params,
        resp,
        meth
      } = meth);
    }
    if (meth && (val || resp)) {
      return [{
        'meth': meth,
        'val': val,
        'resp': resp,
        'params': params
      }];
    }
    return null;
  }
  static topicType(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.topicType(name);
  }
  static isMeTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isMeTopicName(name);
  }
  static isGroupTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isGroupTopicName(name);
  }
  static isP2PTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isP2PTopicName(name);
  }
  static isCommTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isCommTopicName(name);
  }
  static isNewGroupTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isNewGroupTopicName(name);
  }
  static isChannelTopicName(name) {
    return _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic.isChannelTopicName(name);
  }
  static getVersion() {
    return _config_js__WEBPACK_IMPORTED_MODULE_1__.VERSION;
  }
  static setNetworkProviders(wsProvider, xhrProvider) {
    WebSocketProvider = wsProvider;
    XHRProvider = xhrProvider;
    _connection_js__WEBPACK_IMPORTED_MODULE_3__["default"].setNetworkProviders(WebSocketProvider, XHRProvider);
    _large_file_js__WEBPACK_IMPORTED_MODULE_7__["default"].setNetworkProvider(XHRProvider);
  }
  static setDatabaseProvider(idbProvider) {
    IndexedDBProvider = idbProvider;
    _db_js__WEBPACK_IMPORTED_MODULE_4__["default"].setDatabaseProvider(IndexedDBProvider);
  }
  static getLibrary() {
    return _config_js__WEBPACK_IMPORTED_MODULE_1__.LIBRARY;
  }
  static isNullValue(str) {
    return str === _config_js__WEBPACK_IMPORTED_MODULE_1__.DEL_CHAR;
  }
  getNextUniqueId() {
    return this._messageId != 0 ? '' + this._messageId++ : undefined;
  }
  connect(host_) {
    return this._connection.connect(host_);
  }
  reconnect(force) {
    this._connection.reconnect(force);
  }
  disconnect() {
    this._connection.disconnect();
  }
  clearStorage() {
    if (this._db.isReady()) {
      return this._db.deleteDatabase();
    }
    return Promise.resolve();
  }
  initStorage() {
    if (!this._db.isReady()) {
      return this._db.initDatabase();
    }
    return Promise.resolve();
  }
  networkProbe() {
    this._connection.probe();
  }
  isConnected() {
    return this._connection.isConnected();
  }
  isAuthenticated() {
    return this._authenticated;
  }
  authorizeURL(url) {
    if (typeof url != 'string') {
      return url;
    }
    if ((0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.isUrlRelative)(url)) {
      const base = 'scheme://host/';
      const parsed = new URL(url, base);
      if (this._apiKey) {
        parsed.searchParams.append('apikey', this._apiKey);
      }
      if (this._authToken && this._authToken.token) {
        parsed.searchParams.append('auth', 'token');
        parsed.searchParams.append('secret', this._authToken.token);
      }
      url = parsed.toString().substring(base.length - 1);
    }
    return url;
  }
  account(uid, scheme, secret, login, params) {
    const pkt = this.#initPacket('acc');
    pkt.acc.user = uid;
    pkt.acc.scheme = scheme;
    pkt.acc.secret = secret;
    pkt.acc.login = login;
    if (params) {
      pkt.acc.desc.defacs = params.defacs;
      pkt.acc.desc.public = params.public;
      pkt.acc.desc.private = params.private;
      pkt.acc.desc.trusted = params.trusted;
      pkt.acc.tags = params.tags;
      pkt.acc.cred = params.cred;
      pkt.acc.tmpscheme = params.scheme;
      pkt.acc.tmpsecret = params.secret;
      if (Array.isArray(params.attachments) && params.attachments.length > 0) {
        pkt.extra = {
          attachments: params.attachments.filter(ref => (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.isUrlRelative)(ref))
        };
      }
    }
    return this.#send(pkt, pkt.acc.id);
  }
  createAccount(scheme, secret, login, params) {
    let promise = this.account(_config_js__WEBPACK_IMPORTED_MODULE_1__.USER_NEW, scheme, secret, login, params);
    if (login) {
      promise = promise.then(ctrl => this.#loginSuccessful(ctrl));
    }
    return promise;
  }
  createAccountBasic(username, password, params) {
    username = username || '';
    password = password || '';
    return this.createAccount('basic', b64EncodeUnicode(username + ':' + password), true, params);
  }
  updateAccountBasic(uid, username, password, params) {
    username = username || '';
    password = password || '';
    return this.account(uid, 'basic', b64EncodeUnicode(username + ':' + password), false, params);
  }
  hello() {
    const pkt = this.#initPacket('hi');
    return this.#send(pkt, pkt.hi.id).then(ctrl => {
      this._connection.backoffReset();
      if (ctrl.params) {
        this._serverInfo = ctrl.params;
      }
      if (this.onConnect) {
        this.onConnect();
      }
      return ctrl;
    }).catch(err => {
      this._connection.reconnect(true);
      if (this.onDisconnect) {
        this.onDisconnect(err);
      }
    });
  }
  setDeviceToken(dt) {
    let sent = false;
    dt = dt || null;
    if (dt != this._deviceToken) {
      this._deviceToken = dt;
      if (this.isConnected() && this.isAuthenticated()) {
        this.#send({
          'hi': {
            'dev': dt || Tinode.DEL_CHAR
          }
        });
        sent = true;
      }
    }
    return sent;
  }
  login(scheme, secret, cred) {
    const pkt = this.#initPacket('login');
    pkt.login.scheme = scheme;
    pkt.login.secret = secret;
    pkt.login.cred = cred;
    return this.#send(pkt, pkt.login.id).then(ctrl => this.#loginSuccessful(ctrl));
  }
  loginBasic(uname, password, cred) {
    return this.login('basic', b64EncodeUnicode(uname + ':' + password), cred).then(ctrl => {
      this._login = uname;
      return ctrl;
    });
  }
  loginToken(token, cred) {
    return this.login('token', token, cred);
  }
  requestResetAuthSecret(scheme, method, value) {
    return this.login('reset', b64EncodeUnicode(scheme + ':' + method + ':' + value));
  }
  getAuthToken() {
    if (this._authToken && this._authToken.expires.getTime() > Date.now()) {
      return this._authToken;
    } else {
      this._authToken = null;
    }
    return null;
  }
  setAuthToken(token) {
    this._authToken = token;
  }
  subscribe(topicName, getParams, setParams) {
    const pkt = this.#initPacket('sub', topicName);
    if (!topicName) {
      topicName = _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_NEW;
    }
    pkt.sub.get = getParams;
    if (setParams) {
      if (setParams.sub) {
        pkt.sub.set.sub = setParams.sub;
      }
      if (setParams.desc) {
        const desc = setParams.desc;
        if (Tinode.isNewGroupTopicName(topicName)) {
          pkt.sub.set.desc = desc;
        } else if (Tinode.isP2PTopicName(topicName) && desc.defacs) {
          pkt.sub.set.desc = {
            defacs: desc.defacs
          };
        }
      }
      if (Array.isArray(setParams.attachments) && setParams.attachments.length > 0) {
        pkt.extra = {
          attachments: setParams.attachments.filter(ref => (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.isUrlRelative)(ref))
        };
      }
      if (setParams.tags) {
        pkt.sub.set.tags = setParams.tags;
      }
    }
    return this.#send(pkt, pkt.sub.id);
  }
  leave(topic, unsub) {
    const pkt = this.#initPacket('leave', topic);
    pkt.leave.unsub = unsub;
    return this.#send(pkt, pkt.leave.id);
  }
  createMessage(topic, content, noEcho) {
    const pkt = this.#initPacket('pub', topic);
    let dft = typeof content == 'string' ? _drafty_js__WEBPACK_IMPORTED_MODULE_6___default().parse(content) : content;
    if (dft && !_drafty_js__WEBPACK_IMPORTED_MODULE_6___default().isPlainText(dft)) {
      pkt.pub.head = {
        mime: _drafty_js__WEBPACK_IMPORTED_MODULE_6___default().getContentType()
      };
      content = dft;
    }
    pkt.pub.noecho = noEcho;
    pkt.pub.content = content;
    return pkt.pub;
  }
  publish(topicName, content, noEcho) {
    return this.publishMessage(this.createMessage(topicName, content, noEcho));
  }
  publishMessage(pub, attachments) {
    pub = Object.assign({}, pub);
    pub.seq = undefined;
    pub.from = undefined;
    pub.ts = undefined;
    const msg = {
      pub: pub
    };
    if (attachments) {
      msg.extra = {
        attachments: attachments.filter(ref => (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.isUrlRelative)(ref))
      };
    }
    return this.#send(msg, pub.id);
  }
  oobNotification(data) {
    this.logger('oob: ' + (this._trimLongStrings ? JSON.stringify(data, jsonLoggerHelper) : data));
    switch (data.what) {
      case 'msg':
        if (!data.seq || data.seq < 1 || !data.topic) {
          break;
        }
        if (!this.isConnected()) {
          break;
        }
        const topic = this.#cacheGet('topic', data.topic);
        if (!topic) {
          break;
        }
        if (topic.isSubscribed()) {
          break;
        }
        if (topic.maxMsgSeq() < data.seq) {
          if (topic.isChannelType()) {
            topic._updateReceived(data.seq, 'fake-uid');
          }
          if (data.xfrom && !this.#cacheGet('user', data.xfrom)) {
            this.getMeta(data.xfrom, new _meta_builder_js__WEBPACK_IMPORTED_MODULE_8__["default"]().withDesc().build()).catch(err => {
              this.logger("Failed to get the name of a new sender", err);
            });
          }
          topic.subscribe(null).then(_ => {
            return topic.getMeta(new _meta_builder_js__WEBPACK_IMPORTED_MODULE_8__["default"](topic).withLaterData(24).withLaterDel(24).build());
          }).then(_ => {
            topic.leaveDelayed(false, 1000);
          }).catch(err => {
            this.logger("On push data fetch failed", err);
          }).finally(_ => {
            this.getMeTopic()._refreshContact('msg', topic);
          });
        }
        break;
      case 'read':
        this.getMeTopic()._routePres({
          what: 'read',
          seq: data.seq
        });
        break;
      case 'sub':
        if (!this.isMe(data.xfrom)) {
          break;
        }
        const mode = {
          given: data.modeGiven,
          want: data.modeWant
        };
        const acs = new _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"](mode);
        const pres = !acs.mode || acs.mode == _access_mode_js__WEBPACK_IMPORTED_MODULE_0__["default"]._NONE ? {
          what: 'gone',
          src: data.topic
        } : {
          what: 'acs',
          src: data.topic,
          dacs: mode
        };
        this.getMeTopic()._routePres(pres);
        break;
      default:
        this.logger("Unknown push type ignored", data.what);
    }
  }
  getMeta(topic, params) {
    const pkt = this.#initPacket('get', topic);
    pkt.get = (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.mergeObj)(pkt.get, params);
    return this.#send(pkt, pkt.get.id);
  }
  setMeta(topic, params) {
    const pkt = this.#initPacket('set', topic);
    const what = [];
    if (params) {
      ['desc', 'sub', 'tags', 'cred', 'ephemeral'].forEach(function (key) {
        if (params.hasOwnProperty(key)) {
          what.push(key);
          pkt.set[key] = params[key];
        }
      });
      if (Array.isArray(params.attachments) && params.attachments.length > 0) {
        pkt.extra = {
          attachments: params.attachments.filter(ref => (0,_utils_js__WEBPACK_IMPORTED_MODULE_10__.isUrlRelative)(ref))
        };
      }
    }
    if (what.length == 0) {
      return Promise.reject(new Error("Invalid {set} parameters"));
    }
    return this.#send(pkt, pkt.set.id);
  }
  delMessages(topic, ranges, hard) {
    const pkt = this.#initPacket('del', topic);
    pkt.del.what = 'msg';
    pkt.del.delseq = ranges;
    pkt.del.hard = hard;
    return this.#send(pkt, pkt.del.id);
  }
  delTopic(topicName, hard) {
    const pkt = this.#initPacket('del', topicName);
    pkt.del.what = 'topic';
    pkt.del.hard = hard;
    return this.#send(pkt, pkt.del.id);
  }
  delSubscription(topicName, user) {
    const pkt = this.#initPacket('del', topicName);
    pkt.del.what = 'sub';
    pkt.del.user = user;
    return this.#send(pkt, pkt.del.id);
  }
  delCredential(method, value) {
    const pkt = this.#initPacket('del', _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_ME);
    pkt.del.what = 'cred';
    pkt.del.cred = {
      meth: method,
      val: value
    };
    return this.#send(pkt, pkt.del.id);
  }
  delCurrentUser(hard) {
    const pkt = this.#initPacket('del', null);
    pkt.del.what = 'user';
    pkt.del.hard = hard;
    return this.#send(pkt, pkt.del.id).then(_ => {
      this._myUID = null;
    });
  }
  note(topicName, what, seq) {
    if (seq <= 0 || seq >= _config_js__WEBPACK_IMPORTED_MODULE_1__.LOCAL_SEQID) {
      throw new Error(`Invalid message id ${seq}`);
    }
    const pkt = this.#initPacket('note', topicName);
    pkt.note.what = what;
    pkt.note.seq = seq;
    this.#send(pkt);
  }
  noteKeyPress(topicName, type) {
    const pkt = this.#initPacket('note', topicName);
    pkt.note.what = type || 'kp';
    this.#send(pkt);
  }
  videoCall(topicName, seq, evt, payload) {
    const pkt = this.#initPacket('note', topicName);
    pkt.note.seq = seq;
    pkt.note.what = 'call';
    pkt.note.event = evt;
    pkt.note.payload = payload;
    this.#send(pkt, pkt.note.id);
  }
  getTopic(topicName) {
    let topic = this.#cacheGet('topic', topicName);
    if (!topic && topicName) {
      if (topicName == _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_ME) {
        topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.TopicMe();
      } else if (topicName == _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_FND) {
        topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.TopicFnd();
      } else {
        topic = new _topic_js__WEBPACK_IMPORTED_MODULE_9__.Topic(topicName);
      }
      this.#attachCacheToTopic(topic);
      topic._cachePutSelf();
    }
    return topic;
  }
  cacheGetTopic(topicName) {
    return this.#cacheGet('topic', topicName);
  }
  cacheRemTopic(topicName) {
    this.#cacheDel('topic', topicName);
  }
  mapTopics(func, context) {
    this.#cacheMap('topic', func, context);
  }
  isTopicCached(topicName) {
    return !!this.#cacheGet('topic', topicName);
  }
  newGroupTopicName(isChan) {
    return (isChan ? _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_NEW_CHAN : _config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_NEW) + this.getNextUniqueId();
  }
  getMeTopic() {
    return this.getTopic(_config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_ME);
  }
  getFndTopic() {
    return this.getTopic(_config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_FND);
  }
  getLargeFileHelper() {
    return new _large_file_js__WEBPACK_IMPORTED_MODULE_7__["default"](this, _config_js__WEBPACK_IMPORTED_MODULE_1__.PROTOCOL_VERSION);
  }
  getCurrentUserID() {
    return this._myUID;
  }
  isMe(uid) {
    return this._myUID === uid;
  }
  getCurrentLogin() {
    return this._login;
  }
  getServerInfo() {
    return this._serverInfo;
  }
  report(action, target) {
    return this.publish(_config_js__WEBPACK_IMPORTED_MODULE_1__.TOPIC_SYS, _drafty_js__WEBPACK_IMPORTED_MODULE_6___default().attachJSON(null, {
      'action': action,
      'target': target
    }));
  }
  getServerParam(name, defaultValue) {
    return this._serverInfo && this._serverInfo[name] || defaultValue;
  }
  enableLogging(enabled, trimLongStrings) {
    this._loggingEnabled = enabled;
    this._trimLongStrings = enabled && trimLongStrings;
  }
  setHumanLanguage(hl) {
    if (hl) {
      this._humanLanguage = hl;
    }
  }
  isTopicOnline(name) {
    const topic = this.#cacheGet('topic', name);
    return topic && topic.online;
  }
  getTopicAccessMode(name) {
    const topic = this.#cacheGet('topic', name);
    return topic ? topic.acs : null;
  }
  wantAkn(status) {
    if (status) {
      this._messageId = Math.floor(Math.random() * 0xFFFFFF + 0xFFFFFF);
    } else {
      this._messageId = 0;
    }
  }
  onWebsocketOpen = undefined;
  onConnect = undefined;
  onDisconnect = undefined;
  onLogin = undefined;
  onCtrlMessage = undefined;
  onDataMessage = undefined;
  onPresMessage = undefined;
  onMessage = undefined;
  onRawMessage = undefined;
  onNetworkProbe = undefined;
  onAutoreconnectIteration = undefined;
}
;
Tinode.MESSAGE_STATUS_NONE = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_NONE;
Tinode.MESSAGE_STATUS_QUEUED = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_QUEUED;
Tinode.MESSAGE_STATUS_SENDING = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_SENDING;
Tinode.MESSAGE_STATUS_FAILED = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_FAILED;
Tinode.MESSAGE_STATUS_FATAL = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_FATAL;
Tinode.MESSAGE_STATUS_SENT = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_SENT;
Tinode.MESSAGE_STATUS_RECEIVED = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_RECEIVED;
Tinode.MESSAGE_STATUS_READ = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_READ;
Tinode.MESSAGE_STATUS_TO_ME = _config_js__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_STATUS_TO_ME;
Tinode.DEL_CHAR = _config_js__WEBPACK_IMPORTED_MODULE_1__.DEL_CHAR;
Tinode.MAX_MESSAGE_SIZE = 'maxMessageSize';
Tinode.MAX_SUBSCRIBER_COUNT = 'maxSubscriberCount';
Tinode.MAX_TAG_COUNT = 'maxTagCount';
Tinode.MAX_FILE_UPLOAD_SIZE = 'maxFileUploadSize';
Tinode.REQ_CRED_VALIDATORS = 'reqCred';
Tinode.URI_TOPIC_ID_PREFIX = 'tinode:topic/';
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=tinode.dev.js.map