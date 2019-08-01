const mergeWith = require('lodash.mergewith');

const isEqual = (x, y) => {
    if (typeof x !== typeof y) return false;
    if (typeof x === 'object') {
        const xProps = Object.getOwnPropertyNames(x);
        const yProps = Object.getOwnPropertyNames(y);
        if (xProps.length !== yProps.length) return false;
        for (let i = 0; i < xProps.length; i += 1) {
            let prop = xProps[i];
            if (!isEqual(x[prop], y[prop])) return false;
        }
        return true;
    }
    return x === y;
};

const mergeHandlers = {
    combine(targetVal, sourceVal) {
        return targetVal
            .concat(sourceVal)
            .filter((value, index, arr) => {
                return value && arr.findIndex(x => isEqual(x, value)) === index;
            });
    },
    override(targetVal, sourceVal) {
        return sourceVal;
    },
    index() { // lodash.merge default merge strategy

    }
};

const merge = (objects = [], options = {}) => {
    const {
        mergeStrategies = {},
        convert = false
    } = options;
    return mergeWith(...objects, (targetVal, sourceVal, key, object, source, stack) => {
        if (stack) {
            const path = stack.get('path');
            const src = stack.get('source');
            stack.delete('path');
            stack.delete('source');
            if (path && src === source) {
                stack.set('path', path + '.' + key);
            } else {
                stack.set('path', key);
            }
            stack.set('source', sourceVal);
        }
        if (Array.isArray(targetVal) && sourceVal) {
            if (Array.isArray(sourceVal)) {
                const handler = mergeHandlers[mergeStrategies[stack.get('path')]] || mergeHandlers.override;
                return handler(targetVal, sourceVal);
            }
            if (sourceVal instanceof Set) {
                return mergeHandlers.combine(targetVal, Array.from(sourceVal));
            }
        } else if (convert && typeof sourceVal === 'string') {
            switch (sourceVal) {
                case 'true':
                    return true;
                case 'false':
                    return false;
                case 'null':
                    return null;
                default:
                    const float = parseFloat(sourceVal);
                    if (!isNaN(float) && (float + '') === sourceVal) return float;
            }
        }
    });
};

module.exports = (objects, options, ...rest) => {
    if (Array.isArray(objects) && !Array.isArray(options)) return merge(objects, options);
    return merge([objects, options, ...rest]);
};
