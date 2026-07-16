const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');

// Accept the previous/next 30s window so slightly out-of-sync clocks still work
authenticator.options = { window: 1 };

// ──────────────────────────────────────────────────────────
// Helper: generate access token (30 days)
// ──────────────────────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

// ──────────────────────────────────────────────────────────
// Helper: generate refresh token (90 days)
// ──────────────────────────────────────────────────────────
const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '90d',
  });

// ──────────────────────────────────────────────────────────
// Helper: strip sensitive fields from user object
// ──────────────────────────────────────────────────────────
const sanitize = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.twoFactorSecret;
  delete obj.__v;
  return obj;
};

// Short-lived token bridging password success → TOTP verification
const generateTwoFactorToken = (userId) =>
  jwt.sign({ id: userId, purpose: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });

// ══════════════════════════════════════════════════════════
// POST /api/auth/register
// ══════════════════════════════════════════════════════════
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, memberType, dateOfBirth } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email and password are required',
      });
    }

    // Self-registration may never claim the admin role — admin is granted
    // only by creating a family (privilege-escalation guard).
    const safeRole = ['member', 'parent', 'child'].includes(role) ? role : 'member';
    const safeMemberType = ['adult', 'child', 'elder'].includes(memberType) ? memberType : 'adult';

    // Check for duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Create user (password is auto-hashed by the pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role: safeRole,
      memberType: safeMemberType,
      elderMode: safeMemberType === 'elder',
      dateOfBirth: dateOfBirth || null,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Persist refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: sanitize(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Explicitly select password (it is select:false on the schema)
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Second factor required — hold back tokens until the TOTP code is verified
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: 'Two-factor code required',
        data: {
          requires2FA: true,
          tempToken: generateTwoFactorToken(user._id),
        },
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitize(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/refresh
// ══════════════════════════════════════════════════════════
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch' });
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════════════════════
const logoutUser = async (req, res) => {
  try {
    // req.user is attached by the auth middleware
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/auth/me  (bonus — get current user profile)
// ══════════════════════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('familyId', 'name');
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: { user: sanitize(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PATCH /api/auth/me
// ══════════════════════════════════════════════════════════
const updateMe = async (req, res) => {
  try {
    const { pushPreferences, pushToken, fullName, avatar, dateOfBirth, elderMode } = req.body;
    const updateData = {};
    if (pushPreferences) updateData.pushPreferences = pushPreferences;
    if (pushToken !== undefined) updateData.pushToken = pushToken;
    if (fullName !== undefined && String(fullName).trim()) updateData.fullName = String(fullName).trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (typeof elderMode === 'boolean') updateData.elderMode = elderMode;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true }).populate('familyId', 'name');
    return res.status(200).json({
      success: true,
      message: 'User profile updated',
      data: { user: sanitize(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/2fa/login  (public)
// Complete a 2FA login: exchange tempToken + TOTP code for tokens
// ══════════════════════════════════════════════════════════
const loginWith2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'tempToken and code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired 2FA session — log in again' });
    }
    if (decoded.purpose !== '2fa') {
      return res.status(401).json({ success: false, message: 'Invalid 2FA session token' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret +refreshToken');
    if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ success: false, message: 'Two-factor login not available for this account' });
    }

    if (!authenticator.verify({ token: String(code), secret: user.twoFactorSecret })) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: sanitize(user), accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/2fa/setup  (protected)
// Generate a TOTP secret; enabled only after /2fa/verify
// ══════════════════════════════════════════════════════════
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Two-factor authentication is already enabled' });
    }

    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save({ validateBeforeSave: false });

    const otpauthUrl = authenticator.keyuri(user.email, 'Family Connect', secret);

    return res.status(200).json({
      success: true,
      message: 'Scan the QR code with an authenticator app, then verify a code',
      data: { secret, otpauthUrl },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/2fa/verify  (protected)
// Confirm the first TOTP code and switch 2FA on
// ══════════════════════════════════════════════════════════
const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Run 2FA setup first' });
    }

    if (!authenticator.verify({ token: String(code), secret: user.twoFactorSecret })) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled',
      data: { twoFactorEnabled: true },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/2fa/disable  (protected)
// Requires a valid current code to switch 2FA off
// ══════════════════════════════════════════════════════════
const disable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled' });
    }
    if (!code || !authenticator.verify({ token: String(code), secret: user.twoFactorSecret })) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled',
      data: { twoFactorEnabled: false },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateMe,
  loginWith2FA,
  setup2FA,
  verify2FA,
  disable2FA,
};
