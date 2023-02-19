export default (function () {
    function Rounding () {
    }

    Rounding.round = function (value, precision) {
        return this._round(value, precision, 'round');
    };

    Rounding.floor = function (value, precision) {
        return this._round(value, precision, 'floor');
    };

    Rounding.ceil = function (value, precision) {
        return this._round(value, precision, 'ceil');
    };

    Rounding._round = function (value, precision, roundingMethod) {
        if (precision === void 0) {
            precision = 1;
        }
        const denominator = 1 / precision;
        value = value * denominator;
        value = Math[roundingMethod](value);
        value = value / denominator;
        return value;
    };

    return Rounding;
}());
