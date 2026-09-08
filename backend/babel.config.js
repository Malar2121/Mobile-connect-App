/**
 * Babel is used only by Jest.
 *
 * The backend itself is plain CommonJS and runs unmodified under Node — this
 * exists so tests can also import the small, pure modules that live in the
 * mobile app (currently the invite-link parser), which are written as ES
 * modules. Testing the real shared file is better than keeping a second copy
 * of the parsing rules in sync by hand.
 */
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
