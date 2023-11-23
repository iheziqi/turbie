import cleanup from 'rollup-plugin-cleanup';
import filesize from 'rollup-plugin-filesize';

export default {
	input: 'src/index.js', // The entry point of the framework code.
	plugins: [cleanup()], // Remove all comments in source files.
	output: [
		{
			file: 'dist/turbie.js',
			format: 'esm', // The generated bundle should be an ES module.
			plugins: [filesize()],
		},
	],
};
