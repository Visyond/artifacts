"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var abstract_1 = require("./abstract");
var TypeParameterType = (function (_super) {
    __extends(TypeParameterType, _super);
    function TypeParameterType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypeParameterType.prototype.clone = function () {
        var clone = new TypeParameterType();
        clone.isArray = this.isArray;
        clone.name = this.name;
        clone.constraint = this.constraint;
        return clone;
    };
    TypeParameterType.prototype.equals = function (type) {
        if (!(type instanceof TypeParameterType)) {
            return false;
        }
        var constraintEquals;
        if (this.constraint && type.constraint) {
            constraintEquals = type.constraint.equals(this.constraint);
        }
        else if (!this.constraint && !type.constraint) {
            constraintEquals = true;
        }
        else {
            return false;
        }
        return constraintEquals &&
            type.isArray === this.isArray;
    };
    TypeParameterType.prototype.toObject = function () {
        var result = _super.prototype.toObject.call(this);
        result.type = 'typeParameter';
        result.name = this.name;
        if (this.constraint) {
            result.constraint = this.constraint.toObject();
        }
        return result;
    };
    TypeParameterType.prototype.toString = function () {
        return this.name;
    };
    return TypeParameterType;
}(abstract_1.Type));
exports.TypeParameterType = TypeParameterType;
//# sourceMappingURL=type-parameter.js.map