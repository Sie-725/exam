import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['node_modules/jieba-js/src/jieba.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'jieba',
  outfile: 'dist/jieba.js',
  minify: true,
  plugins: [
    {
      name: 'node-shim',
      setup(build) {
        // 拦截内置模块
        build.onResolve({ filter: /^(fs|path|stream)$/ }, args => {
          return { path: args.path, namespace: 'node-shim' };
        });

        build.onLoad({ filter: /.*/, namespace: 'node-shim' }, (args) => {
          if (args.path === 'fs') {
            return {
              contents: `
                // minimal fs shim for browser build
                export function readFileSync() { return ''; }
                export function existsSync() { return false; }
                export const promises = {
                  readFile: async () => ''
                };
              `,
              loader: 'js'
            };
          }

          if (args.path === 'path') {
            return {
              contents: `
                // minimal path shim
                export const join = (...parts) => parts.join('/');
                export const dirname = () => '.';
                export const resolve = (...p) => p.join('/');
                export const basename = (p) => p.split('/').pop();
              `,
              loader: 'js'
            };
          }

          if (args.path === 'stream') {
            return {
              contents: `
                // minimal stream shim: 提供 Transform/Readable/Writable 的占位实现
                export class Readable {
                  constructor() {}
                }
                export class Writable {
                  constructor() {}
                }
                export class Transform {
                  constructor(opts) { this.opts = opts; }
                  _transform(chunk, encoding, callback) {
                    callback(null, chunk);
                  }
                }
                export const TransformOptions = {};
              `,
              loader: 'js'
            };
          }

          // fallback
          return {
            contents: `export default {};`,
            loader: 'js'
          };
        });
      }
    }
  ]
}).then(() => {
  console.log('build-jieba 完成');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});