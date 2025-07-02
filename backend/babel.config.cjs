/**
 * transforms our code to cjs so that jest can use it, as native support is still experimental
 * re: https://jestjs.io/docs/ecmascript-modules
 */

module.exports = {
	env: {
		test: {
			plugins: ["@babel/plugin-transform-modules-commonjs"],
		},
	},
};
